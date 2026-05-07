import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = readDB();

  const orders = db.orders.map(order => {
    const buyer = db.users.find(u => u.id === order.buyer_id);
    const brand = db.brands.find(b => b.id === order.brand_id);
    const items = db.order_items.filter(i => i.order_id === order.id);
    return { ...order, buyer, brand, items };
  });

  const stats = {
    total_users: db.users.length,
    total_brands: db.brands.length,
    approved_brands: db.brands.filter(b => b.status === 'approved').length,
    pending_brands: db.brands.filter(b => b.status === 'pending').length,
    total_orders: db.orders.length,
    pending_orders: db.orders.filter(o => o.status === 'pending').length,
    total_revenue: db.orders.filter(o => o.status === 'approved').reduce((sum, o) => sum + o.total_amount, 0),
  };

  return NextResponse.json({ orders, stats });
}
