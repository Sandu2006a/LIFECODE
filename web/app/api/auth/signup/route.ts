import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkForBot, getClientIp } from '@/lib/bot-protection';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, _hp } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required.' }, { status: 400 });
    }

    const check = checkForBot({ email, name, honeypot: _hp, ip: getClientIp(req) });
    if (check.blocked) {
      if (check.silentReject) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: check.reason }, { status: check.status });
    }

    const admin = getAdmin();

    const { data, error } = await admin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: name || '', display_name: name || '' },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, userId: data.user.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
