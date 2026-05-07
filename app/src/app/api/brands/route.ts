import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/brands — list approved brands (plus owner's own brand)
export async function GET(request: NextRequest) {
  const db = readDB();
  const user = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const mine = searchParams.get('mine') === 'true';

  let brands = db.brands;

  if (mine && user) {
    brands = brands.filter(b => b.owner_id === user.id);
  } else {
    brands = brands.filter(b => b.status === 'approved');
  }

  if (search) {
    brands = brands.filter(b =>
      b.brand_name.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  const products = db.products || [];
  const result = brands.map(brand => {
    const owner = db.users.find(u => u.id === brand.owner_id);
    const productCount = products.filter(p => p.brand_id === brand.id).length;
    return { ...brand, owner_name: owner?.name, owner_company: owner?.company_name, product_count: productCount };
  });

  return NextResponse.json({ brands: result });
}

// POST /api/brands — update brand profile (brand owner)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'brand_owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { brand_name, description, logo_url, whatsapp_number, business_hours, auto_reply_message } = await request.json();
  const db = readDB();

  let brand = db.brands.find(b => b.owner_id === user.id);

  if (!brand) {
    const newBrand = {
      id: generateId('brand'),
      owner_id: user.id,
      brand_name: brand_name || user.company_name,
      description: description || '',
      logo_url: logo_url || '',
      status: 'pending' as const,
      whatsapp_number: whatsapp_number || '',
      business_hours: business_hours || '',
      auto_reply_message: auto_reply_message || '',
      whatsapp_clicks: 0,
      created_at: new Date().toISOString(),
    };
    db.brands.push(newBrand);
    writeDB(db);
    return NextResponse.json({ brand: newBrand });
  }

  // Use !== undefined so callers can explicitly clear a field by sending ""
  if (brand_name !== undefined) brand.brand_name = brand_name.trim() || brand.brand_name;
  if (description !== undefined) brand.description = description;
  if (logo_url !== undefined) brand.logo_url = logo_url.trim();
  if (whatsapp_number !== undefined) brand.whatsapp_number = whatsapp_number;
  if (business_hours !== undefined) brand.business_hours = business_hours;
  if (auto_reply_message !== undefined) brand.auto_reply_message = auto_reply_message;
  writeDB(db);
  return NextResponse.json({ brand });
}
