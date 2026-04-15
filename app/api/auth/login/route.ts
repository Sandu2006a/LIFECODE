import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username?.trim() || !password) {
      return NextResponse.json({ error: 'Username and password required.' }, { status: 400 });
    }

    const clean = username.trim().toLowerCase();

    // Find user
    const { data: user } = await supabase
      .from('users')
      .select('id, username, password_hash')
      .eq('username', clean)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'Wrong username or password.' }, { status: 401 });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Wrong username or password.' }, { status: 401 });
    }

    // Sign JWT
    const token = await signToken({ userId: user.id, username: user.username });

    const res = NextResponse.json({ userId: user.id, username: user.username });
    res.cookies.set('lc_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    console.error('login error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
