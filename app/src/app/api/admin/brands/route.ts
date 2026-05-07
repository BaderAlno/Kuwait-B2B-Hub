import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/admin/brands — list all brands with owner info
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = readDB();
  const brands = db.brands.map(brand => {
    const owner = db.users.find(u => u.id === brand.owner_id);
    return { ...brand, owner };
  });

  return NextResponse.json({ brands });
}
