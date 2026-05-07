import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// PATCH /api/notifications/[id] — mark single notification as read
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = readDB();
  if (!db.notifications) db.notifications = [];

  const idx = db.notifications.findIndex(n => n.id === id && n.user_id === user.id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.notifications[idx].read = true;
  writeDB(db);

  return NextResponse.json({ success: true });
}
