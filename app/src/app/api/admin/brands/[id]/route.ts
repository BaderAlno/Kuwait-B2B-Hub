import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createNotification, createNotificationForMany } from '@/lib/notifications';

// PATCH /api/admin/brands/[id] — approve or reject brand
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { status, verification_tier } = await request.json();
  const db = readDB();
  const brandIdx = db.brands.findIndex(b => b.id === id);
  if (brandIdx === -1) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

  const brand = db.brands[brandIdx];

  if (status) {
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    db.brands[brandIdx].status = status;

    // Also update owner verification_status
    const ownerId = brand.owner_id;
    const ownerIdx = db.users.findIndex(u => u.id === ownerId);
    if (ownerIdx !== -1) {
      db.users[ownerIdx].verification_status = status as 'approved' | 'rejected';
    }

    writeDB(db);

    if (status === 'approved') {
      // Notify brand owner their brand is live
      createNotification({
        userId: ownerId,
        type: 'account_approved',
        title: 'Your Brand is Now Live!',
        body: `Congratulations! ${brand.brand_name} has been verified and is now visible on the marketplace.`,
        actionUrl: '/brand/profile',
        iconType: 'success',
      });

      // Notify all buyers about the new brand
      const buyerIds = db.users.filter(u => u.role === 'buyer').map(u => u.id);
      createNotificationForMany(buyerIds, {
        type: 'new_brand',
        title: 'New Brand on the Platform',
        body: `${brand.brand_name} just joined Kuwait B2B Hub. Check their catalog!`,
        actionUrl: `/brands/${brand.id}`,
        iconType: 'store',
      });
    } else if (status === 'rejected') {
      createNotification({
        userId: ownerId,
        type: 'account_rejected',
        title: 'Brand Verification Update',
        body: `Your application for ${brand.brand_name} was not approved at this time. Contact support for details.`,
        actionUrl: '/brand/profile',
        iconType: 'error',
      });
    }
  } else {
    writeDB(db);
  }

  if (verification_tier) {
    if (!['new', 'verified', 'premium'].includes(verification_tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }
    const freshDB = readDB();
    freshDB.brands[brandIdx].verification_tier = verification_tier;
    writeDB(freshDB);
  }

  return NextResponse.json({ success: true, brand: db.brands[brandIdx] });
}
