import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only access' }, { status: 403 });
  }

  const db = readDB();
  const review = (db.reviews || []).find((r: any) => r.id === id);

  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  const { action } = await req.json();

  if (action === 'remove') {
    review.status = 'removed';
    review.flagged = true;
  } else if (action === 'keep') {
    review.status = 'active';
    review.flagged = false;
  }

  writeDB(db);

  return NextResponse.json({ review });
}
