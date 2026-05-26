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
    const body = await req.json();
    const { user_id, age, gender, weight_kg, height_cm, goal, sport, display_name } = body;
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    const db = getDb(req);
    if (!db) return NextResponse.json({ error: 'Not authorized — set SUPABASE_SERVICE_ROLE_KEY or pass Bearer token' }, { status: 401 });

    // Light update path: only display_name passed (from activate.tsx and the
    // home name-prompt modal). RLS blocks direct profile writes from the app,
    // so this server endpoint is the only reliable way to persist a name.
    const onlyName = display_name && !age && !gender && !weight_kg && !height_cm && !goal && !sport;

    const row: Record<string, unknown> = {
      id:         user_id,
      updated_at: new Date().toISOString(),
    };
    if (display_name) {
      row.display_name = String(display_name).trim();
      row.full_name    = String(display_name).trim();
    }
    if (!onlyName) {
      row.age             = age || null;
      row.gender          = gender || null;
      row.weight_kg       = weight_kg || null;
      row.height_cm       = height_cm || null;
      row.goal            = goal || null;
      row.sport           = sport || null;
      row.onboarding_done = true;
    }

    const { error } = await db.from('profiles').upsert(row, { onConflict: 'id' });
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
