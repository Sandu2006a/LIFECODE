import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username?.trim() || !password || password.length < 6) {
      return NextResponse.json({ error: 'Invalid username or password (min 6 chars).' }, { status: 400 });
    }

    const clean = username.trim().toLowerCase();

    // Check if username taken
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', clean)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Username already taken.' }, { status: 409 });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({ username: clean, password_hash })
      .select('id, username')
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
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
    console.error('signup error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
