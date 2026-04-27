import { supabase } from './supabase';

const API = 'https://web-zeta-lyart-53.vercel.app/api';

export type SubscriptionData = {
  plan: string | null;
  status: string;
  access_level: 'locked' | 'basic' | 'protocol' | 'elite_lab';
  is_active: boolean;
  current_period_end: string | null;
  features: {
    daily_tracking: boolean;
    protocol_score: boolean;
    nutri_guru: boolean;
    tokens: boolean;
    blood_tests: boolean;
  };
};

const LOCKED: SubscriptionData = {
  plan: null, status: 'inactive', access_level: 'locked',
  is_active: false, current_period_end: null,
  features: { daily_tracking: false, protocol_score: false, nutri_guru: false, tokens: false, blood_tests: false },
};

export async function fetchSubscription(): Promise<SubscriptionData> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return LOCKED;

    const res = await fetch(`${API}/me/subscription`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return LOCKED;
    return await res.json();
  } catch {
    return LOCKED;
  }
}

export function canAccess(feature: keyof SubscriptionData['features'], sub: SubscriptionData): boolean {
  return sub.is_active && sub.features[feature] === true;
}
