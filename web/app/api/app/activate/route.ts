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
    const { code } = await req.json();
    if (!code || code.length !== 5) {
      return NextResponse.json({ error: 'Invalid code.' }, { status: 400 });
    }

    const admin = getAdmin();
    const upperCode = code.toUpperCase().trim();

    // Find the activation code
    const { data: row, error: rowErr } = await admin
      .from('activation_codes')
      .select('user_id')
      .eq('code', upperCode)
      .maybeSingle();

    if (rowErr) {
      console.error('DB lookup error:', rowErr);
      return NextResponse.json({ error: 'Database error.' }, { status: 500 });
    }

    if (!row?.user_id) {
      return NextResponse.json({ error: 'Code not found. Check your email.' }, { status: 404 });
    }

    // Get user
    const { data: { user }, error: userErr } = await admin.auth.admin.getUserById(row.user_id);
    if (userErr || !user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Generate magic link — use hashed_token (more reliable than email_otp)
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
      options: { redirectTo: 'lifecode://auth' },
    });

    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error('generateLink error:', linkErr, linkData);
      return NextResponse.json({ error: 'Could not generate session.' }, { status: 500 });
    }

    // Mark as used (allow re-use — just track)
    await admin.from('activation_codes').update({ used: true }).eq('code', upperCode);

    const name =
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'Athlete';

    return NextResponse.json({
      email: user.email,
      token_hash: linkData.properties.hashed_token,
      name,
    });
  } catch (err: any) {
    console.error('activate error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
