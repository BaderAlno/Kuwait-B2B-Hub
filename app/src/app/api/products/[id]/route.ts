import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/products/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = readDB();
  const product = db.products.find(p => p.id === id);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ product });
}

// DELETE /api/products/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'brand_owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const db = readDB();
  const brand = db.brands.find(b => b.owner_id === user.id);
  const product = db.products.find(p => p.id === id);

  if (!product || !brand || product.brand_id !== brand.id) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
  }

  db.products = db.products.filter(p => p.id !== id);
  writeDB(db);
  return NextResponse.json({ success: true });
}

// PATCH /api/products/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'brand_owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const db = readDB();
  const brand = db.brands.find(b => b.owner_id === user.id);
  const idx = db.products.findIndex(p => p.id === id);

  if (idx === -1 || !brand || db.products[idx].brand_id !== brand.id) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
  }

  const body = await request.json();
  db.products[idx] = { ...db.products[idx], ...body };
  writeDB(db);
  return NextResponse.json({ product: db.products[idx] });
}
