'use client';
import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  useNotificationStore,
  type AppNotification,
} from '@/store/notificationStore';

/**
 * Subscribes to real-time notification pushes for the given user via
 * Supabase Realtime Broadcast.  The API route that creates a notification
 * also broadcasts to the channel `notifications:<userId>` so the bell
 * updates instantly without any polling.
 */
export function useRealtimeNotifications(userId: string | null) {
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { addNotification, incrementUnread, triggerBellAnimation } =
    useNotificationStore();

  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const showBrowserNotification = useCallback(
    (title: string, body: string) => {
      if (
        'Notification' in window &&
        Notification.permission === 'granted' &&
        document.visibilityState === 'hidden'
      ) {
        new Notification(title, {
          body,
          icon: '/icon-192.png',
          tag: 'b2b-hub-notification',
        });
      }
    },
    []
  );

  useEffect(() => {
    if (!userId) return;

    requestPushPermission();

    const channel = supabase
      .channel(`notifications:${userId}`, {
        config: { broadcast: { self: false } },
      })
      .on('broadcast', { event: 'new_notification' }, ({ payload }) => {
        const notification = payload as AppNotification;
        addNotification(notification);
        incrementUnread();
        triggerBellAnimation();
        showBrowserNotification(notification.title, notification.body);
      })
      .on('broadcast', { event: 'mark_read' }, ({ payload }) => {
        const { id } = payload as { id: string };
        useNotificationStore.getState().markAsRead(id);
      })
      .on('broadcast', { event: 'mark_all_read' }, () => {
        useNotificationStore.getState().markAllAsRead();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.debug('[Realtime] Notification channel connected');
        }
        if (status === 'CHANNEL_ERROR') {
          console.warn('[Realtime] Notification channel error — will retry');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
}
