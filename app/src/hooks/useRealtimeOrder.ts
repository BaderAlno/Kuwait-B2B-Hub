'use client';
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export type OrderStatus = 'pending' | 'approved' | 'rejected' | 'completed';

interface UseRealtimeOrderProps {
  orderId: string;
  onStatusChange: (newStatus: OrderStatus) => void;
}

/**
 * Subscribes to real-time order status changes via Supabase Broadcast.
 * The API route PATCH /api/orders/[id] broadcasts to `order:<orderId>`
 * so the buyer sees the change instantly.
 */
export function useRealtimeOrder({
  orderId,
  onStatusChange,
}: UseRealtimeOrderProps) {
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order:${orderId}`)
      .on('broadcast', { event: 'status_change' }, ({ payload }) => {
        const { status } = payload as { status: OrderStatus };
        onStatusChange(status);
        router.refresh();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);
}
