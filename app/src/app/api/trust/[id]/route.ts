import { NextRequest, NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDB();

  // Brand trust
  const trust = (db.brand_trust || []).find((t: any) => t.brand_id === id);
  if (trust) {
    const brand = (db.brands || []).find((b: any) => b.id === id);
    return NextResponse.json({
      type: 'brand',
      ...trust,
      verification_tier: brand?.verification_tier || 'new',
      member_since: brand?.created_at,
    });
  }

  // Buyer trust
  const buyerTrust = (db.buyer_trust || []).find((t: any) => t.buyer_id === id);
  if (buyerTrust) {
    const buyer = (db.users || []).find((u: any) => u.id === id);
    return NextResponse.json({
      type: 'buyer',
      ...buyerTrust,
      member_since: buyer?.created_at,
    });
  }

  // Return empty defaults
  return NextResponse.json({
    type: 'unknown',
    response_rate: 0,
    completion_rate: 0,
    avg_response_hours: null,
    total_fulfilled: 0,
    orders_this_month: 0,
    badges: [],
  });
}
