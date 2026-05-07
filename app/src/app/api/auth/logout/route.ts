import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('b2b_user_id', '', { maxAge: 0, path: '/' });
  response.cookies.set('b2b_user_role', '', { maxAge: 0, path: '/' });
  return response;
}
