'use client';
import { useEffect } from 'react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import {
  useNotificationStore,
  type AppNotification,
} from '@/store/notificationStore';

interface RealtimeProviderProps {
  userId: string | null;
  initialUnreadCount: number;
  initialNotifications: AppNotification[];
  children: React.ReactNode;
}

/**
 * Single mount point for all real-time subscriptions.
 * Place inside the authenticated layout so it mounts once per session.
 * Hydrates the Zustand store with server-fetched initial state, then
 * hands off to the Supabase Broadcast hook for live updates.
 */
export function RealtimeProvider({
  userId,
  initialUnreadCount,
  initialNotifications,
  children,
}: RealtimeProviderProps) {
  const { setUnreadCount, setNotifications } = useNotificationStore();

  // Hydrate store from server data on first render
  useEffect(() => {
    setUnreadCount(initialUnreadCount);
    setNotifications(initialNotifications);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to live push updates
  useRealtimeNotifications(userId);

  return <>{children}</>;
}
