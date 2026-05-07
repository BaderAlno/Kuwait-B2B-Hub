import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

// GET /api/orders/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = readDB();
  const order = db.orders.find(o => o.id === id);
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const buyer = db.users.find(u => u.id === order.buyer_id);
  const brand = db.brands.find(b => b.id === order.brand_id);
  const items = db.order_items
    .filter(i => i.order_id === id)
    .map(item => ({ ...item, product: db.products.find(p => p.id === item.product_id) }));

  const messages = db.messages
    .filter(m => m.order_id === id)
    .map(m => ({ ...m, sender: db.users.find(u => u.id === m.sender_id) }))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  return NextResponse.json({ order: { ...order, buyer, brand, items }, messages });
}

// PATCH /api/orders/[id] — approve/reject/complete (brand owner or admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { status } = await request.json();
  const db = readDB();

  const idx = db.orders.findIndex(o => o.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const order = db.orders[idx];

  // Brand owner can only change their brand's orders
  if (user.role === 'brand_owner') {
    const brand = db.brands.find(b => b.owner_id === user.id);
    if (!brand || order.brand_id !== brand.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  db.orders[idx].status = status;
  writeDB(db);

  // Notify the buyer about status change
  const brand = db.brands.find(b => b.id === order.brand_id);
  const brandName = brand?.brand_name ?? 'The brand';
  const amt = `KD ${order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (status === 'approved') {
    createNotification({
      userId: order.buyer_id,
      type: 'order_approved',
      title: 'Order Approved!',
      body: `${brandName} approved your order #${id} for ${amt}`,
      actionUrl: `/orders/${id}`,
      iconType: 'success',
    });
  } else if (status === 'rejected') {
    createNotification({
      userId: order.buyer_id,
      type: 'order_rejected',
      title: 'Order Request Declined',
      body: `${brandName} declined your order #${id}. View details for reason.`,
      actionUrl: `/orders/${id}`,
      iconType: 'error',
    });
  } else if (status === 'completed') {
    createNotification({
      userId: order.buyer_id,
      type: 'order_completed',
      title: 'Order Fulfilled!',
      body: `Your order from ${brandName} has been completed. Leave a review?`,
      actionUrl: `/orders/${id}`,
      iconType: 'info',
    });
  }

  return NextResponse.json({ success: true, order: db.orders[idx] });
}
