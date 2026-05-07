'use client';
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface NewOrderPayload {
  id: string;
  buyer_id: string;
  total: number;
}

interface UseRealtimeBrandOrdersProps {
  brandId: string;
  onNewOrder: (order: NewOrderPayload) => void;
}

/**
 * Subscribes to new order events for a brand via Supabase Broadcast.
 * The API route POST /api/orders broadcasts to `brand-orders:<brandId>`
 * so the brand owner is notified instantly without polling.
 */
export function useRealtimeBrandOrders({
  brandId,
  onNewOrder,
}: UseRealtimeBrandOrdersProps) {
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!brandId) return;

    const channel = supabase
      .channel(`brand-orders:${brandId}`)
      .on('broadcast', { event: 'new_order' }, ({ payload }) => {
        const order = payload as NewOrderPayload;
        onNewOrder(order);
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
  }, [brandId]);
}
