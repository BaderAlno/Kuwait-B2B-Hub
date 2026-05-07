import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId } from '@/lib/db';
import { createNotificationForMany } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, company_name } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (role === 'brand_owner' && !company_name) {
      return NextResponse.json({ error: 'Company name is required for brand owners' }, { status: 400 });
    }

    const db = readDB();
    if (db.users.find(u => u.email === email)) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const userId = generateId('user');
    const newUser = {
      id: userId,
      name,
      email,
      password,
      role,
      company_name: role === 'brand_owner' ? company_name : null,
      verification_status: role === 'buyer' ? 'approved' : 'pending',
      created_at: new Date().toISOString(),
    };

    db.users.push(newUser as typeof db.users[0]);

    // If brand owner, create a pending brand profile
    if (role === 'brand_owner') {
      db.brands.push({
        id: generateId('brand'),
        owner_id: userId,
        brand_name: company_name,
        description: '',
        logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(company_name.substring(0,2))}&background=d4a847&color=070912&size=128&font-size=0.4&bold=true`,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    }

    writeDB(db);

    // Notify all admins about new registration
    const adminIds = db.users.filter(u => u.role === 'admin').map(u => u.id);
    const roleLabel = role === 'brand_owner' ? 'Brand Owner' : 'Business Buyer';
    createNotificationForMany(adminIds, {
      type: 'new_user',
      title: 'New User Registration',
      body: role === 'brand_owner'
        ? `${name} joined as ${roleLabel} from ${company_name}`
        : `${name} joined as ${roleLabel}`,
      actionUrl: '/admin/users',
      iconType: 'user',
    });

    // If brand owner, also notify admins about pending brand approval
    if (role === 'brand_owner') {
      createNotificationForMany(adminIds, {
        type: 'new_brand_registration',
        title: 'New Brand Awaiting Approval',
        body: `${company_name} by ${name} submitted for verification`,
        actionUrl: '/admin/brands',
        iconType: 'store',
      });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        name,
        email,
        role,
        company_name,
        verification_status: newUser.verification_status,
      },
    });

    response.cookies.set('b2b_user_id', userId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.set('b2b_user_role', role, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
