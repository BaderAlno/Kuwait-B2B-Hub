import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Verify the current user is the buyer or brand owner of this order
function canAccessOrder(
  db: ReturnType<typeof readDB>,
  orderId: string,
  userId: string
): boolean {
  const order = db.orders.find(o => o.id === orderId);
  if (!order) return false;
  if (order.buyer_id === userId) return true;
  const brand = db.brands.find(b => b.id === order.brand_id);
  return brand?.owner_id === userId;
}

// GET /api/messages?order_id=xxx
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('order_id');
  if (!orderId) return NextResponse.json({ error: 'order_id is required' }, { status: 400 });

  const db = readDB();

  if (!canAccessOrder(db, orderId, user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const messages = db.messages
    .filter(m => m.order_id === orderId)
    .map(m => {
      const sender = db.users.find(u => u.id === m.sender_id);
      return {
        ...m,
        sender: sender
          ? { id: sender.id, name: sender.name, role: sender.role }
          : null,
      };
    })
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  return NextResponse.json({ messages });
}

// POST /api/messages — send a message
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { order_id, content } = await request.json();
  if (!order_id || !content?.trim()) {
    return NextResponse.json({ error: 'order_id and content are required' }, { status: 400 });
  }

  const db = readDB();

  if (!canAccessOrder(db, order_id, user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const message = {
    id: generateId('msg'),
    order_id,
    sender_id: user.id,
    content: content.trim(),
    created_at: new Date().toISOString(),
  };

  db.messages.push(message);
  writeDB(db);

  return NextResponse.json({
    message: { ...message, sender: { id: user.id, name: user.name, role: user.role } }
  }, { status: 201 });
}
