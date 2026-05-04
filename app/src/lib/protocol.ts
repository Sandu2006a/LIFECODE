import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureSession, authHeaders } from './session';
import { API_URL } from './api';

export type NutrientRow = {
  id: string;
  name: string;
  unit: string;
  dailyTarget: number;
  morningPak: number;
  recoveryPak: number;
  total: number;
  percent: number;
  status: 'covered' | 'partial' | 'gap';
  gap: number;
  foodTip: string;
  inMorning: boolean;
  inRecovery: boolean;
};

const CACHE_KEY = 'lifecode.protocol.v1';

type CacheShape = {
  fingerprint: string;
  nutrients: NutrientRow[];
  computedAt: number;
};

export type ProfileSnapshot = {
  age: number;
  sex: string;
  weight: number;
  height: number;
  sport: string;
  level: string;
  frequency: number;
  bestResult: string;
};

export function profileFingerprint(p: ProfileSnapshot): string {
  return [p.age, p.sex, p.weight, p.height, p.sport, p.level, p.frequency, p.bestResult]
    .map(v => String(v ?? '')).join('|');
}

export function profileFromState(state: any): ProfileSnapshot {
  const p = state?.profile || {};
  return {
    age: Number(p.age) || 25,
    sex: String(p.gender || 'male'),
    weight: Number(p.weight_kg) || 75,
    height: Number(p.height_cm) || 175,
    sport: String(p.sport || 'General Athletics'),
    level: String(p.goal || 'competitive'),
    frequency: Number(p.training_frequency) || 5,
    bestResult: String((p as any).best_result || p.sport || 'N/A'),
  };
}

export async function getCachedProtocol(snap: ProfileSnapshot): Promise<NutrientRow[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as CacheShape;
    if (cache.fingerprint !== profileFingerprint(snap)) return null;
    return cache.nutrients;
  } catch { return null; }
}

export async function setCachedProtocol(snap: ProfileSnapshot, nutrients: NutrientRow[]) {
  try {
    const cache: CacheShape = {
      fingerprint: profileFingerprint(snap),
      nutrients,
      computedAt: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

export async function clearCachedProtocol() {
  try { await AsyncStorage.removeItem(CACHE_KEY); } catch {}
}

export async function fetchProtocol(force = false): Promise<{ nutrients: NutrientRow[] | null; error?: string }> {
  try {
    const { accessToken } = await ensureSession();
    if (!accessToken) return { nutrients: null, error: 'not signed in' };
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders(accessToken),
    };
    const res = await fetch(`${API_URL}/api/analyze-protocol`, {
      method: 'POST', headers, body: JSON.stringify({ force }),
    });
    const json = await res.json();
    if (!res.ok) return { nutrients: null, error: json.error || `HTTP ${res.status}` };
    const nutrients = (json.nutrients || []) as NutrientRow[];
    return { nutrients };
  } catch (e: any) {
    return { nutrients: null, error: e?.message || 'network error' };
  }
}

// ── Local fallback computation if Gemini fails ────────────────────────
const MORNING_PAK: Record<string, { name: string; amount: number; unit: string }> = {
  vitamin_a:   { name: 'Vitamin A',   amount: 800, unit: 'μg' },
  vitamin_c:   { name: 'Vitamin C',   amount: 200, unit: 'mg' },
  vitamin_d3:  { name: 'Vitamin D3',  amount: 25,  unit: 'μg' },
  vitamin_e:   { name: 'Vitamin E',   amount: 12,  unit: 'mg' },
  vitamin_k2:  { name: 'Vitamin K2',  amount: 50,  unit: 'μg' },
  vitamin_b12: { name: 'Vitamin B12', amount: 100, unit: 'μg' },
  b_complex:   { name: 'B Complex',   amount: 100, unit: '%' },
  zinc:        { name: 'Zinc',        amount: 10,  unit: 'mg' },
  copper:      { name: 'Copper',      amount: 0.5, unit: 'mg' },
  magnesium:   { name: 'Magnesium',   amount: 350, unit: 'mg' },
  selenium:    { name: 'Selenium',    amount: 50,  unit: 'μg' },
};

const RECOVERY_PAK: Record<string, { name: string; amount: number; unit: string }> = {
  maltodextrin: { name: 'Maltodextrin', amount: 20000, unit: 'mg' },
  eaa:          { name: 'EAA Complex',  amount: 7000,  unit: 'mg' },
  creatine:     { name: 'Creatine',     amount: 5000,  unit: 'mg' },
  glutamine:    { name: 'L-Glutamine',  amount: 3000,  unit: 'mg' },
  hmb:          { name: 'HMB',          amount: 1500,  unit: 'mg' },
  tart_cherry:  { name: 'Tart Cherry',  amount: 500,   unit: 'mg' },
  sodium:       { name: 'Sodium',       amount: 300,   unit: 'mg' },
  l_theanine:   { name: 'L-Theanine',   amount: 100,   unit: 'mg' },
  astragin:     { name: 'AstraGin',     amount: 50,    unit: 'mg' },
};

const BASE_RDA: Record<string, { unit: string; rda: number; tip: string }> = {
  vitamin_a:   { unit: 'μg', rda: 900,   tip: 'Carrots, sweet potato, spinach' },
  vitamin_c:   { unit: 'mg', rda: 200,   tip: 'Oranges, kiwi, bell pepper' },
  vitamin_d3:  { unit: 'μg', rda: 50,    tip: 'Salmon, egg yolks, sun exposure' },
  vitamin_e:   { unit: 'mg', rda: 18,    tip: 'Almonds, sunflower seeds' },
  vitamin_k2:  { unit: 'μg', rda: 120,   tip: 'Hard cheese, natto, egg yolk' },
  vitamin_b12: { unit: 'μg', rda: 2.4,   tip: 'Beef, salmon, eggs' },
  b_complex:   { unit: '%',  rda: 100,   tip: 'Whole grains, eggs, leafy greens' },
  zinc:        { unit: 'mg', rda: 12,    tip: 'Pumpkin seeds, beef, oysters' },
  copper:      { unit: 'mg', rda: 1.2,   tip: 'Cashews, dark chocolate' },
  magnesium:   { unit: 'mg', rda: 500,   tip: 'Spinach, almonds, dark chocolate' },
  selenium:    { unit: 'μg', rda: 80,    tip: 'Brazil nuts (1-2 daily)' },
  creatine:    { unit: 'mg', rda: 5000,  tip: 'Red meat, fish' },
  eaa:         { unit: 'mg', rda: 14000, tip: 'Chicken, eggs, whey' },
  glutamine:   { unit: 'mg', rda: 5000,  tip: 'Cottage cheese, beef' },
  iron:        { unit: 'mg', rda: 12,    tip: 'Red meat, lentils, spinach' },
  calcium:     { unit: 'mg', rda: 1000,  tip: 'Dairy, sardines, kale' },
  omega_3:     { unit: 'mg', rda: 1500,  tip: 'Salmon, walnuts, flaxseed' },
  potassium:   { unit: 'mg', rda: 3500,  tip: 'Banana, potato, avocado' },
  sodium:      { unit: 'mg', rda: 1500,  tip: 'Salt, pickles, broth' },
  coq10:       { unit: 'mg', rda: 100,   tip: 'Beef heart, salmon, peanuts' },
  vitamin_b6:  { unit: 'mg', rda: 1.7,   tip: 'Chicken, banana, potato' },
  folate:      { unit: 'μg', rda: 400,   tip: 'Leafy greens, beans, lentils' },
};

const NAMES: Record<string, string> = {
  vitamin_a: 'Vitamin A', vitamin_c: 'Vitamin C', vitamin_d3: 'Vitamin D3',
  vitamin_e: 'Vitamin E', vitamin_k2: 'Vitamin K2', vitamin_b12: 'Vitamin B12',
  b_complex: 'B Complex', zinc: 'Zinc', copper: 'Copper', magnesium: 'Magnesium',
  selenium: 'Selenium', creatine: 'Creatine', eaa: 'EAA Complex', glutamine: 'L-Glutamine',
  iron: 'Iron', calcium: 'Calcium', omega_3: 'Omega-3', potassium: 'Potassium',
  sodium: 'Sodium', coq10: 'CoQ10', vitamin_b6: 'Vitamin B6', folate: 'Folate',
};

function levelFactor(level: string): number {
  const l = level.toLowerCase();
  if (l.includes('elite') || l.includes('pro')) return 1.8;
  if (l.includes('competit')) return 1.5;
  if (l.includes('amateur') || l.includes('recreational')) return 1.2;
  return 1.4;
}

function sportFactors(sport: string): Record<string, number> {
  const s = sport.toLowerCase();
  if (s.includes('swim')) return { zinc: 1.5, vitamin_d3: 1.6, magnesium: 1.4 };
  if (s.includes('triathlon')) return { iron: 1.8, sodium: 2.0, potassium: 1.8 };
  if (s.includes('marathon') || s.includes('endurance') || s.includes('run')) {
    return { iron: 1.5, sodium: 1.8, potassium: 1.6, vitamin_c: 1.4 };
  }
  if (s.includes('cycl')) return { iron: 1.4, sodium: 1.6, potassium: 1.6 };
  if (s.includes('strength') || s.includes('lift') || s.includes('power')) {
    return { creatine: 1.0, eaa: 1.4, magnesium: 1.3 };
  }
  return {};
}

export function computeFallbackProtocol(snap: ProfileSnapshot): NutrientRow[] {
  const lf = levelFactor(snap.level);
  const sf = sportFactors(snap.sport);
  const weightFactor = snap.weight > 70 ? 1 + (snap.weight - 70) * 0.005 : 1;

  const rows: NutrientRow[] = [];
  for (const id of Object.keys(BASE_RDA)) {
    const base = BASE_RDA[id];
    const target = Math.round(base.rda * lf * weightFactor * (sf[id] || 1) * 100) / 100;

    const morningEntry = MORNING_PAK[id];
    const recoveryEntry = RECOVERY_PAK[id];
    const morningPak = morningEntry?.amount || 0;
    const recoveryPak = recoveryEntry?.amount || 0;
    const total = morningPak + recoveryPak;
    const percent = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;
    const status: NutrientRow['status'] = percent >= 85 ? 'covered' : percent >= 30 ? 'partial' : 'gap';
    const gap = Math.max(0, target - total);

    rows.push({
      id,
      name: NAMES[id] || id,
      unit: base.unit,
      dailyTarget: target,
      morningPak,
      recoveryPak,
      total,
      percent,
      status,
      gap: Math.round(gap * 100) / 100,
      foodTip: base.tip,
      inMorning: !!morningEntry,
      inRecovery: !!recoveryEntry,
    });
  }
  return rows;
}

export function sortNutrients(rows: NutrientRow[]): NutrientRow[] {
  const order: Record<NutrientRow['status'], number> = { covered: 0, partial: 1, gap: 2 };
  return [...rows].sort((a, b) =>
    order[a.status] - order[b.status] || b.percent - a.percent
  );
}

export function pakSummary(rows: NutrientRow[], pak: 'morning' | 'recovery'): { percent: number; count: number } {
  const filter = pak === 'morning'
    ? (r: NutrientRow) => r.inMorning
    : (r: NutrientRow) => r.inRecovery;
  const items = rows.filter(filter);
  if (items.length === 0) return { percent: 0, count: 0 };
  const sum = items.reduce((s, r) => s + r.percent, 0);
  return { percent: Math.round(sum / items.length), count: items.length };
}
