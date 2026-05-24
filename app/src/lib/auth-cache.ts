import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { lifecodeFetch } from './api';

let _userId: string | null = null;
let _accessToken: string | null = null;
let _refreshToken: string | null = null;

export function cacheAuth(userId: string, accessToken: string, refreshToken: string) {
  _userId = userId;
  _accessToken = accessToken;
  _refreshToken = refreshToken;
}

export function getCachedUserId(): string | null {
  return _userId;
}

export function getCachedTokens(): { access_token: string; refresh_token: string } | null {
  if (!_accessToken || !_refreshToken) return null;
  return { access_token: _accessToken, refresh_token: _refreshToken };
}

export function clearCache() {
  _userId = null;
  _accessToken = null;
  _refreshToken = null;
}

// ──────────────────────────────────────────────────────────────────
// Unified onboarding-done check used by /index (auth gate) AND /activate.
// Priority order:
//   1) AsyncStorage local flag (instant — set on prior onboarding completion)
//   2) Server /api/me/state (service role → bypasses RLS, most authoritative)
//   3) Direct Supabase (RLS fallback)
// Returns true if ANY of these confirm onboarding is complete.
// ──────────────────────────────────────────────────────────────────

export async function checkOnboardingDone(uid: string, accessToken: string | null): Promise<boolean> {
  // 0) "Activated once" flag — once a device has ever activated a code, NEVER ask
  //    for onboarding again on that device. This is the user-requested behavior:
  //    "if you already know me, don't ask me to fill data again".
  try {
    const activated = await AsyncStorage.getItem('lifecode.activated_once');
    if (activated === '1') {
      console.log('[auth-check] device activated before → skip onboarding (no DB check needed)');
      return true;
    }
  } catch {}

  // 1) Local onboarding flag (legacy — set explicitly on onboarding completion)
  try {
    const local = await AsyncStorage.getItem('lifecode.onboarding_done');
    const lastUid = await AsyncStorage.getItem('lifecode.last_uid');
    if (local === '1') {
      console.log('[auth-check] local flag found (last_uid=' + lastUid + ', current=' + uid + ') → skip onboarding');
      return true;
    }
  } catch {}

  // 2) Server endpoint (service role bypasses RLS)
  if (accessToken) {
    try {
      const res = await lifecodeFetch('/api/me/state', {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      });
      console.log('[auth-check] /api/me/state HTTP', res.status);
      if (res.ok) {
        const json = await res.json();
        const p = json?.profile;
        console.log('[auth-check] server profile:', p ? `age=${p.age} weight=${p.weight_kg} height=${p.height_cm} done=${p.onboarding_done}` : 'null');
        if (p?.onboarding_done || (p?.age && p?.weight_kg && p?.height_cm)) {
          try {
            await AsyncStorage.setItem('lifecode.onboarding_done', '1');
            await AsyncStorage.setItem('lifecode.last_uid', uid);
          } catch {}
          console.log('[auth-check] server confirmed → skip onboarding');
          return true;
        }
      }
    } catch (e: any) {
      console.log('[auth-check] server fetch threw:', e?.message);
    }
  } else {
    console.log('[auth-check] no access token, skipping server check');
  }

  // 3) Direct Supabase (RLS-dependent fallback)
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_done, age, weight_kg, height_cm')
      .eq('id', uid)
      .maybeSingle();
    if (error) console.log('[auth-check] supabase direct error:', error.message);
    console.log('[auth-check] supabase profile:', data ? `age=${data.age} weight=${data.weight_kg} height=${data.height_cm} done=${data.onboarding_done}` : 'null');
    if (data?.onboarding_done || (data?.age && data?.weight_kg && data?.height_cm)) {
      try {
        await AsyncStorage.setItem('lifecode.onboarding_done', '1');
        await AsyncStorage.setItem('lifecode.last_uid', uid);
      } catch {}
      console.log('[auth-check] supabase confirmed → skip onboarding');
      return true;
    }
  } catch (e: any) {
    console.log('[auth-check] supabase direct threw:', e?.message);
  }

  console.log('[auth-check] no source confirmed onboarding → showing /onboarding');
  return false;
}
