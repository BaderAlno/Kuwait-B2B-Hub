import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

interface BulkProduct {
  name: string;
  description?: string;
  category?: string;
  price: number;
  moq: number;
  stock: number;
  tier1_qty?: number;
  tier1_price?: number;
  tier2_qty?: number;
  tier2_price?: number;
  image_url?: string;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'brand_owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = readDB();
  const brand = db.brands.find(b => b.owner_id === user.id);
  if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

  const body = await req.json() as { products: BulkProduct[]; duplicateAction?: 'skip' | 'overwrite' | 'keep' };
  const { products, duplicateAction = 'skip' } = body;

  let added = 0, skipped = 0;
  const failed: { name: string; reason: string }[] = [];

  for (const p of products) {
    try {
      const existing = db.products.find(
        ep => ep.brand_id === brand.id && ep.name.toLowerCase() === p.name.toLowerCase()
      );

      if (existing) {
        if (duplicateAction === 'skip') { skipped++; continue; }
        if (duplicateAction === 'overwrite') {
          existing.description = p.description || existing.description;
          existing.price = p.price;
          existing.moq = p.moq;
          existing.stock = p.stock;
          existing.image_url = p.image_url || existing.image_url;
          existing.bulk_pricing_tiers = buildTiers(p);
          skipped++; // counted as "updated"
          continue;
        }
        // keep both — fall through to add
      }

      db.products.push({
        id: generateId('product'),
        brand_id: brand.id,
        name: p.name,
        description: p.description || '',
        price: p.price,
        moq: p.moq,
        stock: p.stock,
        image_url: p.image_url || '',
        bulk_pricing_tiers: buildTiers(p),
        created_at: new Date().toISOString(),
      });
      added++;
    } catch (err: any) {
      failed.push({ name: p.name || 'Unknown', reason: err?.message || 'Unknown error' });
    }
  }

  writeDB(db);
  return NextResponse.json({ added, skipped, failed });
}

function buildTiers(p: BulkProduct) {
  const tiers = [];
  if (p.tier1_qty && p.tier1_price) {
    tiers.push({ min_qty: p.tier1_qty, max_qty: p.tier2_qty ? p.tier2_qty - 1 : null, price: p.tier1_price });
  }
  if (p.tier2_qty && p.tier2_price) {
    tiers.push({ min_qty: p.tier2_qty, max_qty: null, price: p.tier2_price });
  }
  return tiers;
}
