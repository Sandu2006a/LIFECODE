import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const FEATURES_BY_LEVEL: Record<string, Record<string, boolean>> = {
  locked: {
    daily_tracking: false, protocol_score: false,
    nutri_guru: false, tokens: false, blood_tests: false,
  },
  basic: {
    daily_tracking: false, protocol_score: false,
    nutri_guru: false, tokens: false, blood_tests: false,
  },
  protocol: {
    daily_tracking: true, protocol_score: true,
    nutri_guru: true, tokens: true, blood_tests: false,
  },
  elite_lab: {
    daily_tracking: true, protocol_score: true,
    nutri_guru: true, tokens: true, blood_tests: true,
  },
};

const LOCKED_RESPONSE = {
  plan: null, status: 'inactive',
  access_level: 'locked', is_active: false,
  current_period_end: null,
  features: FEATURES_BY_LEVEL.locked,
};

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get app_access
  const { data: access } = await client
    .from('app_access')
    .select('access_level, is_active, reason, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!access || !access.is_active) {
    return NextResponse.json(LOCKED_RESPONSE);
  }

  // Get latest subscription details
  const { data: sub } = await client
    .from('subscriptions')
    .select('plan, status, current_period_end, cancel_at_period_end, stripe_subscription_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const level = access.access_level as string;
  return NextResponse.json({
    plan: sub?.plan ?? null,
    status: sub?.status ?? 'active',
    access_level: level,
    is_active: true,
    current_period_end: sub?.current_period_end ?? null,
    cancel_at_period_end: sub?.cancel_at_period_end ?? false,
    features: FEATURES_BY_LEVEL[level] ?? FEATURES_BY_LEVEL.locked,
  });
}
