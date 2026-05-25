import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

async function resolveUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length);
  const anon = createClient(SUPA_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data, error } = await anon.auth.getUser(token);
  if (error) return null;
  return data?.user?.id ?? null;
}

function getAdmin() {
  const svcKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!svcKey) return null;
  return createClient(SUPA_URL, svcKey, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const { pack } = await req.json();
    if (pack !== 'morning' && pack !== 'recovery') {
      return NextResponse.json({ error: 'invalid pack' }, { status: 400 });
    }

    const admin = getAdmin();
    if (!admin) return NextResponse.json({ error: 'server not configured' }, { status: 500 });

    const { data, error } = await admin.from('intake_logs').insert({
      user_id: userId, pack, taken_at: new Date().toISOString(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'server error' }, { status: 500 });
  }
}

// Un-check a pack: removes today's intake_logs row for this user+pack.
// Direct supabase delete from the app is blocked by RLS, so the toggle UX
// (tap once to take, tap again to undo) needs this server-side path.
export async function DELETE(req: NextRequest) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const pack = req.nextUrl.searchParams.get('pack');
    if (pack !== 'morning' && pack !== 'recovery') {
      return NextResponse.json({ error: 'invalid pack' }, { status: 400 });
    }

    const admin = getAdmin();
    if (!admin) return NextResponse.json({ error: 'server not configured' }, { status: 500 });

    // Scope to today only — yesterday's intake stays in history for streaks.
    const today = new Date().toISOString().split('T')[0];
    const startIso = `${today}T00:00:00.000Z`;
    const endIso   = `${today}T23:59:59.999Z`;

    const { error } = await admin.from('intake_logs').delete()
      .eq('user_id', userId).eq('pack', pack)
      .gte('taken_at', startIso).lte('taken_at', endIso);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'server error' }, { status: 500 });
  }
}
