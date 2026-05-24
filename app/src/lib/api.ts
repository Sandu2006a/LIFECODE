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
//  • detects HTML responses from captive portals / proxies / 404 pages
//    and treats them as failures (so we retry the next fallback URL
//    instead of letting the caller crash on `res.json()`),
//  • caches which hosts are dead for the session.
//
// Pass `expectJson: false` for endpoints that legitimately return non-JSON.
export async function lifecodeFetch(
  path: string,
  init?: RequestInit & { expectJson?: boolean },
): Promise<Response> {
  const expectJson = init?.expectJson !== false;
  let lastError: any = null;
  for (const base of API_FALLBACKS) {
    if (_deadHosts.has(base)) continue;
    const url = `${base}${path}`;
    const { signal, cancel } = withTimeout(10_000);
    try {
      const res = await fetch(url, { ...init, signal });
      cancel();

      // If we expect JSON but the response is HTML, the request was intercepted
      // by a captive portal, network proxy, or the route doesn't exist on this
      // deploy. Buffer the body, mark the host dead, and try the next fallback.
      if (expectJson) {
        const ct = res.headers.get('content-type') || '';
        const looksJson = ct.includes('application/json') || ct.includes('text/json');
        // We must look at the body too — some proxies serve HTML with a misleading content-type
        if (!looksJson) {
          const peek = (await res.clone().text()).trim().slice(0, 1);
          if (peek === '<') {
            _deadHosts.add(base);
            lastError = new Error(`Server returned HTML on ${path} (intercepted by network proxy)`);
            console.log(`[api] ${base}${path} returned HTML — trying next URL`);
            continue;
          }
        }
      }
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

// Same architecture as scanMeal: call Gemini directly for the slow analysis
// step, then post-save with pre-computed nutrients so /api/meal doesn't have
// to call Gemini itself (which is what was timing out → 'HTML on /api/meal').
const ANALYZE_TEXT_PROMPT = `Nutrition API. Given a meal description and a quantity in grams, estimate per-meal micronutrient amounts.

Return STRICTLY valid JSON (no markdown):
{
  "nutrients": {
    "vitamin_a": <μg>, "vitamin_c": <mg>, "vitamin_d3": <μg>,
    "vitamin_e": <mg>, "vitamin_k2": <μg>, "vitamin_b12": <μg>,
    "zinc": <mg>, "copper": <mg>, "magnesium": <mg>, "selenium": <μg>,
    "omega_3": <mg>, "calcium": <mg>, "potassium": <mg>, "sodium": <mg>,
    "iodine": <μg>, "iron": <mg>,
    "eaa": <mg>, "glutamine": <mg>, "creatine": <mg>
  }
}
Use 0 for nutrients not provided. JSON only.`;

async function analyzeTextNutrientsDirect(meal: string, qty: number): Promise<Record<string, number> | null> {
  if (!GEMINI_KEY) return null;
  const body = JSON.stringify({
    contents: [{
      role: 'user',
      parts: [{ text: `${ANALYZE_TEXT_PROMPT}\n\nMEAL: "${meal}"\nQUANTITY: ${qty} grams` }],
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1500,
      responseMimeType: 'application/json',
    },
  });

  async function call(model: 'gemini-2.5-flash' | 'gemini-2.5-pro') {
    const { signal, cancel } = withTimeout(30_000);
    try {
      const res = await fetch(GEMINI_VISION_URL(model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal,
      });
      cancel();
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('empty Gemini response');
      return text;
    } finally { cancel(); }
  }

  let raw: string;
  try { raw = await call('gemini-2.5-flash'); }
  catch (e: any) {
    console.log('[analyzeText] Flash failed, Pro fallback:', e?.message);
    try { raw = await call('gemini-2.5-pro'); } catch { return null; }
  }

  try {
    let parsed: any;
    try { parsed = JSON.parse(raw); }
    catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) return null;
      parsed = JSON.parse(m[0]);
    }
    return parsed.nutrients || null;
  } catch { return null; }
}

export async function logMeal(
  meal_name: string, quantity_g: number, nutrients?: Record<string, number>
): Promise<{ ok: boolean; error?: string; nutrients?: Record<string, number> }> {
  // If caller didn't supply nutrients, compute them via direct Gemini first.
  // This means /api/meal only inserts the row (fast — no Gemini server call),
  // sidestepping the Vercel timeout that produced 'HTML on /api/meal' errors.
  let computedNutrients = nutrients;
  if (!computedNutrients || Object.keys(computedNutrients).length === 0) {
    const direct = await analyzeTextNutrientsDirect(meal_name, quantity_g);
    if (direct && Object.keys(direct).length > 0) computedNutrients = direct;
  }

  try {
    const res = await authFetch('/api/meal', {
      method: 'POST',
      body: JSON.stringify({ meal_name, quantity_g, nutrients: computedNutrients }),
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

// Prompt that drives Gemini's food vision. Returns strict JSON we can parse
// directly: a list of ingredients with weights and per-ingredient micronutrients.
// Mirrors web/lib/nutrients.ts INGREDIENT_INSTRUCTIONS but lives in the app so
// we don't need to ship a separate package boundary.
const SCAN_PROMPT = `You are a nutrition vision API. Analyze the meal in the image and break it into individual ingredients (e.g. chicken + rice + broccoli = 3 separate ingredients, not 1).

Return STRICTLY valid JSON in this exact shape (no markdown, no commentary):
{
  "description": "<short label, max 60 chars>",
  "isNutritionLabel": <true if the photo shows a packaged-food nutrition label, else false>,
  "ingredients": [
    {
      "name": "<ingredient name>",
      "quantity_g": <integer grams visible on plate>,
      "nutrients": {
        "vitamin_a": <μg>,
        "vitamin_c": <mg>,
        "vitamin_d3": <μg>,
        "vitamin_e": <mg>,
        "vitamin_k2": <μg>,
        "vitamin_b12": <μg>,
        "zinc": <mg>,
        "copper": <mg>,
        "magnesium": <mg>,
        "selenium": <μg>,
        "omega_3": <mg>,
        "calcium": <mg>,
        "potassium": <mg>,
        "sodium": <mg>,
        "iodine": <μg>,
        "iron": <mg>,
        "eaa": <mg>,
        "glutamine": <mg>,
        "creatine": <mg>
      }
    }
  ]
}

Use 0 for nutrients the ingredient does not provide. Estimate quantities realistically from the photo. Return JSON only.`;

// Direct Gemini Vision call — bypasses our /api/scan-meal entirely.
// This eliminates Vercel timeout issues on image analysis, which were the
// root cause of the "Server returned HTML on /api/scan-meal" errors.
// Falls back to the server endpoint only if Gemini direct fails.
const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY || '';
const GEMINI_VISION_URL = (model: 'gemini-2.5-flash' | 'gemini-2.5-pro') =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;

async function scanMealDirectGemini(
  imageBase64: string, mimeType: string,
): Promise<{
  ok: boolean;
  error?: string;
  description?: string;
  quantity_g?: number;
  isNutritionLabel?: boolean;
  ingredients?: ScannedIngredient[];
}> {
  if (!GEMINI_KEY) return { ok: false, error: 'no gemini key on device' };
  const body = JSON.stringify({
    contents: [{
      role: 'user',
      parts: [
        { text: SCAN_PROMPT },
        { inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' } },
      ],
    }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  });

  // Try Flash first (fast), Pro on fallback
  async function call(model: 'gemini-2.5-flash' | 'gemini-2.5-pro') {
    const { signal, cancel } = withTimeout(45_000);
    try {
      const res = await fetch(GEMINI_VISION_URL(model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal,
      });
      cancel();
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('empty Gemini response');
      return text;
    } finally {
      cancel();
    }
  }

  let raw: string;
  try {
    raw = await call('gemini-2.5-flash');
  } catch (e: any) {
    console.log('[scanMeal] Flash direct failed, trying Pro:', e?.message);
    try { raw = await call('gemini-2.5-pro'); }
    catch (e2: any) { return { ok: false, error: e2?.message || 'gemini call failed' }; }
  }

  // responseMimeType=json ensures `raw` IS the JSON; safety regex below
  let parsed: any;
  try { parsed = JSON.parse(raw); }
  catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { ok: false, error: 'could not parse Gemini JSON' };
    try { parsed = JSON.parse(match[0]); }
    catch { return { ok: false, error: 'invalid Gemini JSON' }; }
  }

  const rawIngs = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
  const ingredients: ScannedIngredient[] = rawIngs.map((ing: any, idx: number) => ({
    name: String(ing.name || `Ingredient ${idx + 1}`).slice(0, 100),
    quantity_g: Math.max(1, parseInt(String(ing.quantity_g)) || 100),
    nutrients: typeof ing.nutrients === 'object' && ing.nutrients ? ing.nutrients : {},
  }));
  const totalGrams = ingredients.reduce((s, ing) => s + ing.quantity_g, 0);

  return {
    ok: true,
    description: String(parsed.description || 'Scanned meal').slice(0, 200),
    isNutritionLabel: !!parsed.isNutritionLabel,
    ingredients,
    quantity_g: totalGrams || 100,
  };
}

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
  // Strategy 1: direct Gemini call — fast, no Vercel timeout exposure.
  // Most users on most networks will succeed here.
  const direct = await scanMealDirectGemini(imageBase64, mimeType);
  if (direct.ok) return direct;
  console.log('[scanMeal] direct Gemini failed, falling back to server:', direct.error);

  // Strategy 2: server endpoint — only hit when direct call fails
  // (e.g. Google API blocked on the user's network).
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
    return { ok: false, error: direct.error || e.message || 'network error' };
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
