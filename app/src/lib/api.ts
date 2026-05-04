import { ensureSession } from './session';

export const API_URL = 'https://web-zeta-lyart-53.vercel.app';

async function authFetch(path: string, init?: RequestInit) {
  const { accessToken } = await ensureSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> || {}),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return fetch(`${API_URL}${path}`, { ...init, headers });
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
