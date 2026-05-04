import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function getDb(req: NextRequest) {
  const svcKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (svcKey) {
    return createClient(SUPA_URL, svcKey, { auth: { persistSession: false } });
  }
  const auth = req.headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) {
    return createClient(SUPA_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
      global: { headers: { Authorization: auth } },
    });
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { user_id, age, gender, weight_kg, height_cm, goal, sport } = await req.json();
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    const db = getDb(req);
    if (!db) return NextResponse.json({ error: 'Not authorized — set SUPABASE_SERVICE_ROLE_KEY or pass Bearer token' }, { status: 401 });

    const { error } = await db.from('profiles').upsert({
      id:              user_id,
      age:             age || null,
      gender:          gender || null,
      weight_kg:       weight_kg || null,
      height_cm:       height_cm || null,
      goal:            goal || null,
      sport:           sport || null,
      onboarding_done: true,
      updated_at:      new Date().toISOString(),
    }, { onConflict: 'id' });

    if (error) {
      console.error('save-profile error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('save-profile error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
