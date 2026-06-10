import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// App signup: email + password, no confirmation email. The admin API creates
// the user with email_confirm=true so signInWithPassword works immediately —
// this is what lets the app skip the gmail activation-code flow entirely.
export async function POST(req: NextRequest) {
  try {
    const { name = '', email = '', password = '' } = await req.json() as {
      name?: string; email?: string; password?: string;
    };

    const normalEmail = String(email).toLowerCase().trim();
    const cleanName = String(name).trim();

    if (!normalEmail.includes('@') || normalEmail.length < 5) {
      return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });
    }
    if (String(password).length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    if (!cleanName) {
      return NextResponse.json({ error: 'Name required.' }, { status: 400 });
    }

    const admin = getAdmin();

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: normalEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: cleanName, display_name: cleanName },
    });

    if (createErr || !created?.user?.id) {
      const msg = createErr?.message || '';
      // Existing accounts came through the website/waitlist and may have no
      // password — don't let signup silently overwrite them.
      if (/already|registered|exists/i.test(msg)) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Sign in, or use your activation code.' },
          { status: 409 },
        );
      }
      console.error('app signup createUser error:', createErr);
      return NextResponse.json({ error: 'Could not create account.' }, { status: 500 });
    }

    const userId = created.user.id;

    // Profile row up-front so the app never falls back to 'Athlete'/'You'.
    const { error: profErr } = await admin.from('profiles').upsert({
      id: userId,
      email: normalEmail,
      display_name: cleanName,
      full_name: cleanName,
      avatar_letter: cleanName.charAt(0).toUpperCase(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (profErr) console.error('app signup profile upsert error:', profErr);

    return NextResponse.json({ success: true, user_id: userId, name: cleanName });
  } catch (err: any) {
    console.error('app signup error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
