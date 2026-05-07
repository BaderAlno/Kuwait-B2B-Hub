import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  const db = readDB();
  const { searchParams } = new URL(req.url);
  const brandId = searchParams.get('brand_id');
  const sort = searchParams.get('sort') || 'recent'; // recent | high | low

  let reviewsRaw = db.reviews || [];
  if (brandId) reviewsRaw = reviewsRaw.filter((r: any) => r.brand_id === brandId);

  // Filter out flagged/removed reviews for non-admins
  const user = await getCurrentUser();
  const isAdmin = user?.role === 'admin';
  if (!isAdmin) {
    reviewsRaw = reviewsRaw.filter((r: any) => !r.flagged && r.status !== 'removed');
  }

  // Attach reviewer info (respecting anonymous flag)
  let enriched = reviewsRaw.map((r: any) => {
    const buyer = db.users.find((u: any) => u.id === r.buyer_id);
    return {
      ...r,
      buyer_name: r.anonymous ? 'Anonymous Buyer' : (buyer?.name || 'Verified Buyer'),
      buyer_company: r.anonymous ? null : buyer?.company_name,
    };
  });

  // Sorting
  if (sort === 'high') {
    enriched.sort((a, b) => b.rating - a.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sort === 'low') {
    enriched.sort((a, b) => a.rating - b.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else {
    // Default: recent
    enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Compute aggregate stats
  const activeReviews = enriched.filter((r: any) => r.status !== 'removed');
  const avgRating = activeReviews.length
    ? Math.round((activeReviews.reduce((s: number, r: any) => s + r.rating, 0) / activeReviews.length) * 10) / 10
    : 0;

  const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  activeReviews.forEach((r: any) => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });

  return NextResponse.json({
    reviews: enriched,
    avg_rating: avgRating,
    total_reviews: activeReviews.length,
    breakdown,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'buyer') {
    return NextResponse.json({ error: 'Only buyers can submit reviews' }, { status: 403 });
  }

  const db = readDB();
  const body = await req.json();
  const { brand_id, order_id, rating, content, anonymous } = body;

  if (!brand_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'brand_id and rating (1–5) are required' }, { status: 400 });
  }

  // One review per order (if order_id provided)
  if (order_id) {
    const existing = (db.reviews || []).find((r: any) => r.order_id === order_id && r.buyer_id === user.id);
    if (existing) {
      return NextResponse.json({ error: 'You already reviewed this order' }, { status: 409 });
    }
  }

  const review = {
    id: `review-${uuidv4().slice(0, 8)}`,
    brand_id,
    order_id: order_id || null,
    buyer_id: user.id,
    rating,
    content: (content || '').slice(0, 300),
    anonymous: !!anonymous,
    flagged: false,
    brand_reply: null,
    created_at: new Date().toISOString(),
  };

  if (!db.reviews) db.reviews = [];
  db.reviews.push(review);
  writeDB(db);

  // Notify brand owner about new review
  const brand = db.brands.find(b => b.id === brand_id);
  if (brand) {
    const stars = '★'.repeat(rating);
    const reviewerLabel = anonymous ? 'An anonymous buyer' : user.name;
    createNotification({
      userId: brand.owner_id,
      type: 'new_review',
      title: 'New Review Received',
      body: `${reviewerLabel} left a ${rating}${stars} review on your brand`,
      actionUrl: '/brand/profile',
      iconType: 'star',
    });
  }

  return NextResponse.json({ review }, { status: 201 });
}
