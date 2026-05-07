import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'brand_owner') {
    return NextResponse.json({ error: 'Only brand owners can reply to reviews' }, { status: 403 });
  }

  const db = readDB();
  const review = (db.reviews || []).find((r: any) => r.id === id);
  
  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  // Ensure this brand owner owns the brand associated with the review
  const brand = db.brands.find((b: any) => b.id === review.brand_id);
  if (!brand || brand.owner_id !== user.id) {
    return NextResponse.json({ error: 'You can only reply to reviews for your own brand' }, { status: 403 });
  }

  const { content } = await req.json();
  if (!content) {
    return NextResponse.json({ error: 'Reply content is required' }, { status: 400 });
  }

  review.brand_reply = content.slice(0, 500);
  writeDB(db);

  return NextResponse.json({ review });
}
