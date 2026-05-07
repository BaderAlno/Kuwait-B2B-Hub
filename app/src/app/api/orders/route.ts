import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

// GET /api/orders — role-filtered order list
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = readDB();
  let orders = db.orders;

  if (user.role === 'buyer') {
    orders = orders.filter(o => o.buyer_id === user.id);
  } else if (user.role === 'brand_owner') {
    const brand = db.brands.find(b => b.owner_id === user.id);
    orders = brand ? orders.filter(o => o.brand_id === brand.id) : [];
  }
  // admin sees all

  const enriched = orders.map(order => {
    const buyer = db.users.find(u => u.id === order.buyer_id);
    const brand = db.brands.find(b => b.id === order.brand_id);
    const items = db.order_items
      .filter(i => i.order_id === order.id)
      .map(item => {
        const product = db.products.find(p => p.id === item.product_id);
        return { ...item, product };
      });
    return { ...order, buyer, brand, items };
  });

  return NextResponse.json({ orders: enriched });
}

// POST /api/orders — create order (buyer)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'buyer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { brand_id, items } = await request.json();
  // items: [{product_id, quantity}]

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No items provided' }, { status: 400 });
  }

  const db = readDB();
  const brand = db.brands.find(b => b.id === brand_id && b.status === 'approved');
  if (!brand) return NextResponse.json({ error: 'Brand not found or not approved' }, { status: 404 });

  // Calculate total — validate products, MOQ, and stock
  let total = 0;
  const orderItems: { id: string; order_id: string; product_id: string; quantity: number; unit_price: number }[] = [];
  const products = db.products || [];

  for (const item of items as { product_id: string; quantity: number }[]) {
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json({ error: `Invalid quantity for product ${item.product_id}` }, { status: 400 });
    }

    const product = products.find(p => p.id === item.product_id && p.brand_id === brand_id);
    if (!product) {
      return NextResponse.json({ error: `Product ${item.product_id} not found` }, { status: 404 });
    }
    if (qty < product.moq) {
      return NextResponse.json(
        { error: `Minimum order quantity for "${product.name}" is ${product.moq} units` },
        { status: 400 }
      );
    }
    if (product.stock < qty) {
      return NextResponse.json(
        { error: `Insufficient stock for "${product.name}" — only ${product.stock} units available` },
        { status: 400 }
      );
    }

    let unitPrice = product.price;
    for (const tier of product.bulk_pricing_tiers) {
      if (qty >= tier.min_qty && (tier.max_qty === null || qty <= tier.max_qty)) {
        unitPrice = tier.price;
        break;
      }
    }

    total += unitPrice * qty;
    orderItems.push({
      id: generateId('item'),
      order_id: '',
      product_id: item.product_id,
      quantity: qty,
      unit_price: unitPrice,
    });
  }

  const orderId = generateId('order');
  const order = {
    id: orderId,
    buyer_id: user.id,
    brand_id,
    status: 'approved' as const,
    total_amount: total,
    created_at: new Date().toISOString(),
  };

  db.orders.push(order);
  db.order_items.push(...orderItems.map((i: typeof orderItems[0]) => ({ ...i, order_id: orderId })));
  writeDB(db);

  // Notify brand owner about new order
  createNotification({
    userId: brand.owner_id,
    type: 'new_order',
    title: 'New Order Received!',
    body: `${user.name} from ${user.company_name} placed a new order for KD ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    actionUrl: `/brand/orders/${orderId}`,
    iconType: 'package',
  });

  return NextResponse.json({ order }, { status: 201 });
}
