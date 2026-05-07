import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/products?brand_id=xxx
export async function GET(request: NextRequest) {
  const db = readDB();
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get('brand_id');

  const products = db.products || [];
  const result = brandId ? products.filter(p => p.brand_id === brandId) : products;

  return NextResponse.json({ products: result });
}

// POST /api/products — create product (brand owner)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'brand_owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = readDB();
  const brand = db.brands.find(b => b.owner_id === user.id);
  if (!brand) return NextResponse.json({ error: 'No brand profile found' }, { status: 404 });

  const body = await request.json();
  const { name, description, price, moq, stock, image_url, bulk_pricing_tiers } = body;

  // --- Input validation ---
  if (!name?.trim() || name.trim().length < 2) {
    return NextResponse.json({ error: 'Product name must be at least 2 characters' }, { status: 400 });
  }
  if (!description?.trim()) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }

  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 });
  }

  const parsedMoq = parseInt(moq, 10);
  if (isNaN(parsedMoq) || parsedMoq < 1) {
    return NextResponse.json({ error: 'Minimum order quantity must be at least 1' }, { status: 400 });
  }

  const parsedStock = parseInt(stock, 10);
  if (isNaN(parsedStock) || parsedStock < 0) {
    return NextResponse.json({ error: 'Stock must be a non-negative integer' }, { status: 400 });
  }

  if (bulk_pricing_tiers !== undefined && !Array.isArray(bulk_pricing_tiers)) {
    return NextResponse.json({ error: 'bulk_pricing_tiers must be an array' }, { status: 400 });
  }

  const tiers = (bulk_pricing_tiers || []).map((t: { min_qty: unknown; max_qty: unknown; price: unknown }) => {
    const tMin = parseInt(String(t.min_qty), 10);
    const tMax = t.max_qty != null ? parseInt(String(t.max_qty), 10) : null;
    const tPrice = parseFloat(String(t.price));
    if (isNaN(tMin) || tMin < 1) throw new Error('Tier min_qty must be a positive integer');
    if (tMax !== null && tMax <= tMin) throw new Error('Tier max_qty must be greater than min_qty');
    if (isNaN(tPrice) || tPrice <= 0) throw new Error('Tier price must be a positive number');
    return { min_qty: tMin, max_qty: tMax, price: tPrice };
  });

  const product = {
    id: generateId('prod'),
    brand_id: brand.id,
    name: name.trim(),
    description: description.trim(),
    price: parsedPrice,
    moq: parsedMoq,
    stock: parsedStock,
    image_url: image_url?.trim() || '',
    bulk_pricing_tiers: tiers,
    created_at: new Date().toISOString(),
  };

  db.products.push(product);
  writeDB(db);

  return NextResponse.json({ product }, { status: 201 });
}
