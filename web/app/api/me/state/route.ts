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

export async function GET(req: NextRequest) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    const admin = getAdmin();
    if (!admin) return NextResponse.json({ error: 'server not configured' }, { status: 500 });

    const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const startISO = `${date}T00:00:00.000Z`;
    const endISO = `${date}T23:59:59.999Z`;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [profileRes, todayIntake, todayMeals, memories, weekIntake, weekMeals] = await Promise.all([
      admin.from('profiles').select('*').eq('id', userId).maybeSingle(),
      admin.from('intake_logs').select('pack, taken_at')
        .eq('user_id', userId).gte('taken_at', startISO).lte('taken_at', endISO),
      admin.from('meal_logs').select('id, meal_name, quantity_g, nutrients, logged_at')
        .eq('user_id', userId).gte('logged_at', startISO).lte('logged_at', endISO)
        .order('logged_at', { ascending: false }),
      admin.from('user_memories').select('memory, category, created_at')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      admin.from('intake_logs').select('pack, taken_at')
        .eq('user_id', userId).gte('taken_at', sevenDaysAgo.toISOString()),
      admin.from('meal_logs').select('nutrients, logged_at')
        .eq('user_id', userId).gte('logged_at', sevenDaysAgo.toISOString()),
    ]);

    return NextResponse.json({
      profile: profileRes.data,
      today: {
        date,
        intake: todayIntake.data || [],
        meals: todayMeals.data || [],
      },
      memories: memories.data || [],
      week: {
        intake: weekIntake.data || [],
        meals: weekMeals.data || [],
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'server error' }, { status: 500 });
  }
}
