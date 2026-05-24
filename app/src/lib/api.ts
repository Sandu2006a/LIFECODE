import { ensureSession } from './session';

// Primary URL + fallbacks (university WiFi, captive portals, country blocks)
// can block custom Vercel domains. We try each in order on each request.
export const API_URL = 'https://lifecodenutrition.com';
const API_FALLBACKS: string[] = [
  'https://lifecodenutrition.com',
  // Vercel default URL — different domain, often not blocked when the custom one is
  'https://lifecode-app.vercel.app',
  // Additional fallback can be set via env var on the device
  process.env.EXPO_PUBLIC_API_URL_FALLBACK || '',
].filter(Boolean);

// Per-domain blacklist that times out fast for the rest of the session
// once a domain has failed (so we don't waste 10s on each request).
const _deadHosts = new Set<string>();

function withTimeout(ms: number, signal?: AbortSignal): { signal: AbortSignal; cancel: () => void } {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  if (signal) signal.addEventListener('abort', () => ctrl.abort());
  return { signal: ctrl.signal, cancel: () => clearTimeout(t) };
}

// Drop-in replacement for fetch that:
//  • adds a 10s timeout (otherwise blocked WiFi hangs forever),
//  • retries each fallback URL until one succeeds,
//  • caches which hosts are dead for the session.
export async function lifecodeFetch(path: string, init?: RequestInit): Promise<Response> {
  let lastError: any = null;
  for (const base of API_FALLBACKS) {
    if (_deadHosts.has(base)) continue;
    const url = `${base}${path}`;
    const { signal, cancel } = withTimeout(10_000);
    try {
      const res = await fetch(url, { ...init, signal });
      cancel();
      return res;
    } catch (e: any) {
      cancel();
      lastError = e;
      _deadHosts.add(base);
      console.log(`[api] ${base} unreachable (${e?.name || 'error'}: ${e?.message || ''}) — trying next`);
    }
  }
  // Reset dead-hosts after total failure so the next user action retries
  _deadHosts.clear();
  throw lastError || new Error('All API endpoints unreachable. Try mobile data or VPN.');
}

async function authFetch(path: string, init?: RequestInit) {
  const { accessToken } = await ensureSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> || {}),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return lifecodeFetch(path, { ...init, headers });
}

export async function logIntake(pack: 'morning' | 'recovery'): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await authFetch('/api/intake', { method: 'POST', body: JSON.stringify({ pack }) });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || `HTTP ${res.status}` };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message || 'network error' };
  }
}

export async function logMeal(
  meal_name: string, quantity_g: number, nutrients?: Record<string, number>
): Promise<{ ok: boolean; error?: string; nutrients?: Record<string, number> }> {
  try {
    const res = await authFetch('/api/meal', {
      method: 'POST',
      body: JSON.stringify({ meal_name, quantity_g, nutrients }),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || `HTTP ${res.status}` };
    return { ok: true, nutrients: json.nutrients };
  } catch (e: any) {
    return { ok: false, error: e.message || 'network error' };
  }
}

export async function saveMemory(memory: string, category: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await authFetch('/api/memory', {
      method: 'POST',
      body: JSON.stringify({ memory, category }),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || `HTTP ${res.status}` };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message || 'network error' };
  }
}

export type ScannedIngredient = {
  name: string;
  quantity_g: number;
  nutrients: Record<string, number>;
};

export async function scanMeal(
  imageBase64: string, mimeType: string = 'image/jpeg'
): Promise<{
  ok: boolean;
  error?: string;
  description?: string;
  quantity_g?: number;
  isNutritionLabel?: boolean;
  ingredients?: ScannedIngredient[];
}> {
  try {
    const res = await authFetch('/api/scan-meal', {
      method: 'POST',
      body: JSON.stringify({ imageBase64, mimeType }),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || `HTTP ${res.status}` };
    return {
      ok: true,
      description: json.description,
      quantity_g: json.quantity_g,
      isNutritionLabel: json.isNutritionLabel,
      ingredients: Array.isArray(json.ingredients) ? json.ingredients : [],
    };
  } catch (e: any) {
    return { ok: false, error: e.message || 'network error' };
  }
}

export type Workout = {
  id: string;
  date: string;          // YYYY-MM-DD
  type: 'strength' | 'cardio' | 'mobility' | 'class';
  name: string | null;
  start_time: string | null; // HH:MM
  duration_min: number;
};

export async function listWorkouts(from: string, to: string): Promise<{ ok: boolean; error?: string; workouts: Workout[] }> {
  try {
    const res = await authFetch(`/api/workouts?from=${from}&to=${to}`);
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || `HTTP ${res.status}`, workouts: [] };
    return { ok: true, workouts: json.workouts || [] };
  } catch (e: any) { return { ok: false, error: e.message || 'network', workouts: [] }; }
}

export async function createWorkout(w: Omit<Workout, 'id'>): Promise<{ ok: boolean; error?: string; workout?: Workout }> {
  try {
    const res = await authFetch('/api/workouts', { method: 'POST', body: JSON.stringify(w) });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || `HTTP ${res.status}` };
    return { ok: true, workout: json.workout };
  } catch (e: any) { return { ok: false, error: e.message || 'network' }; }
}

export async function updateWorkout(id: string, patch: Partial<Workout>): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await authFetch('/api/workouts', { method: 'PUT', body: JSON.stringify({ id, ...patch }) });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || `HTTP ${res.status}` };
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message || 'network' }; }
}

export async function deleteWorkout(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await authFetch(`/api/workouts?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || `HTTP ${res.status}` };
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message || 'network' }; }
}

export async function getState(): Promise<any | null> {
  try {
    const res = await authFetch('/api/me/state');
    const json = await res.json();
    if (!res.ok) return null;
    return json;
  } catch {
    return null;
  }
}
