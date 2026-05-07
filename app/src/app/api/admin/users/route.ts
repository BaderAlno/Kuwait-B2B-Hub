import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = readDB();
  return NextResponse.json({
    users: db.users.map(u => ({ ...u, password: undefined }))
  });
}
