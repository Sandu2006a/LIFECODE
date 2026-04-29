import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { user_id, age, gender, weight_kg, height_cm, goal } = await req.json();
    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    const admin = getAdmin();
    const { error } = await admin.from('profiles').upsert({
      id:              user_id,
      age:             age || null,
      gender:          gender || null,
      weight_kg:       weight_kg || null,
      height_cm:       height_cm || null,
      goal:            goal || null,
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
