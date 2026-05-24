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

    // Resolve display name. user_metadata is the canonical source written at signup,
    // but the website also writes display_name into profiles row. We check both
    // so the app gets a real name even if one of them missed it.
    let profileName: string | null = null;
    try {
      const { data: prof } = await admin
        .from('profiles')
        .select('display_name, full_name')
        .eq('id', user.id)
        .maybeSingle();
      profileName = prof?.display_name || prof?.full_name || null;
    } catch {}

    const metaName = user.user_metadata?.display_name || user.user_metadata?.full_name || null;

    // Self-healing migration: if the user signed up via a path that wrote the
    // name only into user_metadata (not profiles), backfill profiles now so
    // every subsequent read sees a consistent name. This also handles users
    // who had no profiles row at all yet.
    if (!profileName && metaName) {
      try {
        await admin.from('profiles').upsert(
          { id: user.id, display_name: metaName },
          { onConflict: 'id' },
        );
        profileName = metaName;
      } catch {}
    }

    const name =
      profileName ||
      metaName ||
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
