import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


  const db = readDB();
  const reviews = db.reviews || [];
  const idx = reviews.findIndex((r: any) => r.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

  const review = reviews[idx];
  const body = await req.json();

  // Brand owner can reply to reviews on their own brand
  if (user.role === 'brand_owner') {
    const brand = (db.brands || []).find((b: any) => b.owner_id === user.id && b.id === review.brand_id);
    if (!brand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (body.brand_reply !== undefined) {
      reviews[idx] = { ...review, brand_reply: body.brand_reply.slice(0, 400) };
    }
  }

  // Admin can flag/unflag reviews
  if (user.role === 'admin') {
    if (body.flagged !== undefined) reviews[idx] = { ...review, flagged: !!body.flagged };
    if (body.brand_reply !== undefined) reviews[idx] = { ...reviews[idx], brand_reply: body.brand_reply };
  }

  db.reviews = reviews;
  writeDB(db);
  return NextResponse.json({ review: reviews[idx] });
}
