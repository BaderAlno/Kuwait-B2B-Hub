import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { brand_id } = await req.json();
    if (!brand_id) return NextResponse.json({ ok: false });
    const db = readDB();
    const brand = db.brands.find(b => b.id === brand_id);
    if (brand) {
      brand.whatsapp_clicks = (brand.whatsapp_clicks || 0) + 1;
      writeDB(db);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
