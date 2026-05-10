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

const VALID_TYPES = ['strength', 'cardio', 'mobility', 'class'] as const;

// GET /api/workouts?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    const admin = getAdmin();
    if (!admin) return NextResponse.json({ error: 'server not configured' }, { status: 500 });
    const from = req.nextUrl.searchParams.get('from');
    const to = req.nextUrl.searchParams.get('to');
    let query = admin.from('workouts').select('*').eq('user_id', userId).order('date', { ascending: true }).order('start_time', { ascending: true });
    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ workouts: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'server error' }, { status: 500 });
  }
}

// POST /api/workouts  body: { date, type, name?, start_time?, duration_min }
export async function POST(req: NextRequest) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    const admin = getAdmin();
    if (!admin) return NextResponse.json({ error: 'server not configured' }, { status: 500 });
    const body = await req.json();
    const date = String(body.date || '').slice(0, 10);
    const type = String(body.type || '');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'invalid date (YYYY-MM-DD)' }, { status: 400 });
    }
    if (!VALID_TYPES.includes(type as any)) {
      return NextResponse.json({ error: 'invalid type' }, { status: 400 });
    }
    const { data, error } = await admin.from('workouts').insert({
      user_id: userId,
      date,
      type,
      name: body.name ? String(body.name).slice(0, 80) : null,
      start_time: body.start_time ? String(body.start_time).slice(0, 5) : null,
      duration_min: Math.max(1, parseInt(String(body.duration_min)) || 60),
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ workout: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'server error' }, { status: 500 });
  }
}

// PUT /api/workouts  body: { id, date?, type?, name?, start_time?, duration_min? }
export async function PUT(req: NextRequest) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    const admin = getAdmin();
    if (!admin) return NextResponse.json({ error: 'server not configured' }, { status: 500 });
    const body = await req.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.date) patch.date = String(body.date).slice(0, 10);
    if (body.type) {
      if (!VALID_TYPES.includes(body.type)) return NextResponse.json({ error: 'invalid type' }, { status: 400 });
      patch.type = body.type;
    }
    if (body.name !== undefined) patch.name = body.name ? String(body.name).slice(0, 80) : null;
    if (body.start_time !== undefined) patch.start_time = body.start_time ? String(body.start_time).slice(0, 5) : null;
    if (body.duration_min !== undefined) patch.duration_min = Math.max(1, parseInt(String(body.duration_min)) || 60);
    const { data, error } = await admin.from('workouts').update(patch).eq('id', id).eq('user_id', userId).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ workout: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'server error' }, { status: 500 });
  }
}

// DELETE /api/workouts?id=...
export async function DELETE(req: NextRequest) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    const admin = getAdmin();
    if (!admin) return NextResponse.json({ error: 'server not configured' }, { status: 500 });
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { error } = await admin.from('workouts').delete().eq('id', id).eq('user_id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'server error' }, { status: 500 });
  }
}
