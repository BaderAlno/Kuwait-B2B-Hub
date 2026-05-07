import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/notifications — current user's notifications, newest first
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = readDB();
  const all = (db.notifications || [])
    .filter(n => n.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const unread_count = all.filter(n => !n.read).length;

  return NextResponse.json({ notifications: all, unread_count });
}

// PATCH /api/notifications — mark ALL as read for current user
export async function PATCH() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = readDB();
  if (!db.notifications) db.notifications = [];

  db.notifications = db.notifications.map(n =>
    n.user_id === user.id ? { ...n, read: true } : n
  );

  writeDB(db);
  return NextResponse.json({ success: true });
}
