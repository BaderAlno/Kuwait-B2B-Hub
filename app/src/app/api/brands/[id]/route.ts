import { NextRequest, NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = readDB();
  const brand = db.brands.find(b => b.id === id);
  if (!brand) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const owner = db.users.find(u => u.id === brand.owner_id);
  const products = db.products.filter(p => p.brand_id === id);

  return NextResponse.json({
    brand: { ...brand, owner_name: owner?.name },
    products,
  });
}
