import { supabase } from './supabase';
import { ensureSession, authHeaders } from './session';
import { lifecodeFetch } from './api';
import {
  AthleteProfile, DEFAULT_PROFILE, profileFromDb,
  computeDailyTargets, sectionAverage, safetyWarnings,
  NutrientTarget, Category,
} from './nutrition';

// Local-timezone date helpers — Romania/Moldova is UTC+2/+3 so toISOString()
// would lag by up to 3 hours and the Today rings wouldn't reset at local
// 00:00. We pass the local date string to /api/me/state so the day filter
// matches what the user sees in the date header.
export function localDateIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type { NutrientTarget, Category } from './nutrition';

export type Section = Category;
export type DailyNutrient = NutrientTarget;

export type DailyTotals = {
  profile: AthleteProfile;
  rows: NutrientTarget[];
  bySection: Record<Category, NutrientTarget[]>;
  morningPct: number;
  essentialsPct: number;
  recoveryPct: number;
  totalPct: number;
  morningTaken: boolean;
  recoveryTaken: boolean;
  mealsCount: number;
  warnings: string[];
};

function dayBounds(iso?: string) {
  const d = iso ? new Date(iso + 'T00:00:00') : new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

// Map Gemini analyze-nutrients output keys → nutrition.ts NutrientDef ids.
// Lets the personalized targets the AI produced override our formula baseline.
const GEMINI_TO_NUTRIENT_ID: Record<string, string> = {
  // Morning Pak
  vitamin_a:        'vit_a',
  vitamin_c:        'vit_c',
  vitamin_d3:       'vit_d3',
  vitamin_e:        'vit_e',
  vitamin_k2:       'vit_k2',
  vitamin_b12:      'vit_b12',
  b_complex:        'b_complex',
  zinc:             'zinc',
  copper:           'copper',
  magnesium_citrate:'magnesium_am',
  selenium:         'selenium',
  // Recovery Pak
  maltodextrin:     'maltodextrin',
  eaa:              'eaa',
  creatine:         'creatine',
  glutamine:        'l_glutamine',
  hmb:              'hmb',
  tart_cherry:      'tart_cherry',
  magnesium_bisgly: 'magnesium_pm',
  l_theanine:       'l_theanine',
  astragin:         'astragin',
  // Essentials (food + 3rd-party)
  omega_3:          'omega_3',
  calcium:          'calcium',
  potassium:        'potassium',
  sodium:           'sodium',
  iodine:           'iodine',
  manganese:        'manganese',
  chromium:         'chromium',
  molybdenum:       'molybdenum',
};

function applyMicroTargetsOverride(rows: NutrientTarget[], microTargets: Record<string, number> | null): NutrientTarget[] {
  if (!microTargets) return rows;

  const overrides: Record<string, number> = {};
  for (const [geminiKey, value] of Object.entries(microTargets)) {
    const id = GEMINI_TO_NUTRIENT_ID[geminiKey];
    if (!id) continue;
    const v = Number(value);
    if (!Number.isFinite(v) || v <= 0) continue;
    overrides[id] = v;
  }

  return rows.map(r => {
    const newTarget = overrides[r.id];
    if (!newTarget) return r;
    // Recompute pct against the new target without touching consumption
    const effective = r.capped && r.ul ? r.ul : r.consumed;
    const pct = newTarget > 0 ? Math.min(100, Math.round((effective / newTarget) * 100)) : 0;
    return { ...r, target: newTarget, pct };
  });
}

export type DayPct = { iso: string; morningPct: number; recoveryPct: number; essentialsPct: number };

// Fetch full daily state from the server (bypasses RLS via service role).
// Returns today's data + this week's intake/meals for client-side aggregation.
async function fetchServerState(): Promise<{
  profile: any | null;
  intake: any[];
  meals: any[];
  weekIntake: any[];
  weekMeals: any[];
} | null> {
  try {
    const { accessToken } = await ensureSession();
    if (!accessToken) return null;
    // Pass local date + timezone offset so the server filters by the day the
    // USER sees on screen (UTC date can lag by 2-3h in EET/EEST → Life Ring
    // wouldn't reset at 00:00). Cache-buster t=Date.now() defeats any lingering
    // edge-cache entry that would echo a stale "pack still taken" snapshot.
    const today = localDateIso();
    const tz = new Date().getTimezoneOffset(); // server expects same sign convention (Romania EEST → -180)
    const res = await lifecodeFetch(`/api/me/state?date=${today}&tz=${tz}&t=${Date.now()}`, {
      headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
    });
    if (!res.ok) {
      console.log('[dailyTotals] /api/me/state HTTP', res.status);
      return null;
    }
    const json = await res.json();
    return {
      profile: json?.profile || null,
      intake: Array.isArray(json?.today?.intake) ? json.today.intake : [],
      meals:  Array.isArray(json?.today?.meals)  ? json.today.meals  : [],
      weekIntake: Array.isArray(json?.week?.intake) ? json.week.intake : [],
      weekMeals:  Array.isArray(json?.week?.meals)  ? json.week.meals  : [],
    };
  } catch (e: any) {
    console.log('[dailyTotals] server state fetch failed:', e?.message);
    return null;
  }
}

// Returns Mon→Sun for the current week with REAL morning/recovery/essentials
// percentages per day, computed using the same nutrition.ts formulas against
// the athlete's actual profile (no RLS issues — server provides everything).
export async function fetchWeekPcts(): Promise<DayPct[]> {
  const out: DayPct[] = [];
  const today = new Date();
  const offset = (today.getDay() + 6) % 7; // Mon=0
  const monday = new Date(today); monday.setDate(today.getDate() - offset);
  const week: { iso: string; start: Date; end: Date }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    week.push({ iso, start, end });
  }

  const server = await fetchServerState();
  const profile = server?.profile ? profileFromDb(server.profile) : DEFAULT_PROFILE;

  for (const day of week) {
    const startMs = day.start.getTime();
    const endMs   = day.end.getTime();
    const dayIntake = (server?.weekIntake || []).filter((l: any) => {
      const t = new Date(l.taken_at).getTime();
      return t >= startMs && t <= endMs;
    });
    const dayMeals = (server?.weekMeals || []).filter((m: any) => {
      const t = new Date(m.logged_at).getTime();
      return t >= startMs && t <= endMs;
    });
    const packs = new Set(dayIntake.map((l: any) => l.pack));
    const morningTaken  = packs.has('morning');
    const recoveryTaken = packs.has('recovery');

    const foodTotals: Record<string, number> = {};
    dayMeals.forEach((m: any) => {
      if (!m.nutrients || typeof m.nutrients !== 'object') return;
      for (const [k, v] of Object.entries(m.nutrients)) {
        const num = Number(v);
        if (!Number.isFinite(num) || num <= 0) continue;
        foodTotals[k] = (foodTotals[k] || 0) + num;
      }
    });

    const rows = computeDailyTargets(profile, morningTaken, recoveryTaken, foodTotals);
    out.push({
      iso: day.iso,
      morningPct:    sectionAverage(rows, 'morning'),
      essentialsPct: sectionAverage(rows, 'essentials'),
      recoveryPct:   sectionAverage(rows, 'recovery'),
    });
  }
  return out;
}

export async function fetchDailyTotals(userId: string, dateIso?: string): Promise<DailyTotals> {
  const { start, end } = dayBounds(dateIso);

  // STRATEGY 1: hit our server (uses service role → bypasses Supabase RLS)
  const server = await fetchServerState();

  let prof: any = null;
  let logs: any[] = [];
  let meals: any[] = [];

  if (server) {
    prof = server.profile;
    if (dateIso) {
      // Filter weekIntake/weekMeals for the requested historical day
      const startMs = new Date(start).getTime();
      const endMs   = new Date(end).getTime();
      logs  = (server.weekIntake || []).filter((l: any) => {
        const t = new Date(l.taken_at).getTime(); return t >= startMs && t <= endMs;
      });
      meals = (server.weekMeals || []).filter((m: any) => {
        const t = new Date(m.logged_at).getTime(); return t >= startMs && t <= endMs;
      });
    } else {
      logs  = server.intake;
      meals = server.meals;
    }
  } else {
    // STRATEGY 2: fall back to direct Supabase reads with the anon client.
    // If RLS is configured correctly for authenticated users, this works.
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('weight_kg, age, gender, sport, goal, training_frequency, height_cm, is_menstruating, conditions, micro_targets')
        .eq('id', userId)
        .maybeSingle();
      if (error) console.log('[dailyTotals] supabase profile error:', error.message);
      prof = data;
    } catch (e: any) { console.log('[dailyTotals] supabase profile threw:', e?.message); }

    try {
      const { data } = await supabase
        .from('intake_logs').select('pack')
        .eq('user_id', userId).gte('taken_at', start).lte('taken_at', end);
      logs = data || [];
    } catch {}

    try {
      const { data } = await supabase
        .from('meal_logs').select('nutrients')
        .eq('user_id', userId).gte('logged_at', start).lte('logged_at', end);
      meals = data || [];
    } catch {}
  }

  const profile = prof ? profileFromDb(prof) : DEFAULT_PROFILE;
  const microTargets = (prof?.micro_targets && typeof prof.micro_targets === 'object')
    ? prof.micro_targets as Record<string, number>
    : null;

  const packs = new Set(logs.map((l: any) => l.pack));
  const morningTaken  = packs.has('morning');
  const recoveryTaken = packs.has('recovery');

  const foodTotals: Record<string, number> = {};
  meals.forEach((m: any) => {
    if (!m.nutrients || typeof m.nutrients !== 'object') return;
    for (const [k, v] of Object.entries(m.nutrients)) {
      const num = Number(v);
      if (!Number.isFinite(num) || num <= 0) continue;
      foodTotals[k] = (foodTotals[k] || 0) + num;
    }
  });

  // 4) Compute targets per nutrient, then override with Gemini-personalized targets
  //    (stored on profiles.micro_targets by /api/analyze-nutrients).
  const rows = applyMicroTargetsOverride(
    computeDailyTargets(profile, morningTaken, recoveryTaken, foodTotals),
    microTargets,
  );

  const bySection: Record<Category, NutrientTarget[]> = {
    morning:    rows.filter(r => r.category === 'morning'),
    essentials: rows.filter(r => r.category === 'essentials'),
    recovery:   rows.filter(r => r.category === 'recovery'),
  };

  const morningPct    = sectionAverage(rows, 'morning');
  const essentialsPct = sectionAverage(rows, 'essentials');
  const recoveryPct   = sectionAverage(rows, 'recovery');
  const totalPct      = Math.round((morningPct + essentialsPct + recoveryPct) / 3);

  const warnings = safetyWarnings(rows, profile);

  return {
    profile, rows, bySection,
    morningPct, essentialsPct, recoveryPct, totalPct,
    morningTaken, recoveryTaken,
    mealsCount: meals.length,
    warnings,
  };
}

// Recompute rings client-side when the user toggles a pack — no DB read needed.
// Uses the existing fromFood + pack base amounts on each row.
export function recomputeWithPacks(
  totals: DailyTotals, morningTaken: boolean, recoveryTaken: boolean,
): DailyTotals {
  const rows = totals.rows.map(r => {
    const fromMorningPack  = morningTaken  ? r.morningPack  : 0;
    const fromRecoveryPack = recoveryTaken ? r.recoveryPack : 0;
    const consumed = fromMorningPack + fromRecoveryPack + r.fromFood;
    const capped = !!(r.ul && consumed > r.ul);
    const effective = capped ? r.ul! : consumed;
    const pct = r.target > 0 ? Math.min(100, Math.round((effective / r.target) * 100)) : 0;
    return { ...r, fromMorningPack, fromRecoveryPack, consumed, pct, capped };
  });

  const bySection: Record<Category, NutrientTarget[]> = {
    morning:    rows.filter(r => r.category === 'morning'),
    essentials: rows.filter(r => r.category === 'essentials'),
    recovery:   rows.filter(r => r.category === 'recovery'),
  };

  const morningPct    = sectionAverage(rows, 'morning');
  const essentialsPct = sectionAverage(rows, 'essentials');
  const recoveryPct   = sectionAverage(rows, 'recovery');
  const totalPct      = Math.round((morningPct + essentialsPct + recoveryPct) / 3);

  return {
    ...totals,
    rows, bySection,
    morningPct, essentialsPct, recoveryPct, totalPct,
    morningTaken, recoveryTaken,
  };
}

// Brief deficit summary for the Ask AI prompt
export function summariseDeficits(totals: DailyTotals): string {
  const p = totals.profile;
  const profLine = `Athlete profile: ${p.weightKg}kg, ${p.age}yo, ${p.sex}, sport=${p.sportType}, intensity=${p.intensity}, training=${p.trainingHours}h/wk${p.isMenstruating ? ', menstrual=true' : ''}.`;

  const deficits = totals.rows
    .filter(r => r.pct < 50 && r.target > 0)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 10)
    .map(r => `${r.name} ${r.pct}% (${formatNum(r.consumed)}/${formatNum(r.target)} ${r.unit})`);

  const covered = totals.rows.filter(r => r.pct >= 85 && r.target > 0).map(r => r.name);

  const sectionLine = `Coverage by category — Morning: ${totals.morningPct}%, Essentials: ${totals.essentialsPct}%, Recovery: ${totals.recoveryPct}%, Total Life Ring: ${totals.totalPct}%.`;
  const packLine = `Packs today: Morning ${totals.morningTaken ? 'taken' : 'NOT taken'}, Recovery ${totals.recoveryTaken ? 'taken' : 'NOT taken'}. Meals logged: ${totals.mealsCount}.`;
  const deficitLine = deficits.length > 0 ? `Lowest nutrients (<50%): ${deficits.join('; ')}.` : 'No nutrient is below 50% today.';
  const coveredLine = covered.length > 0 ? `Well covered (≥85%): ${covered.slice(0, 8).join(', ')}.` : '';
  const warnLine = totals.warnings.length > 0 ? `Safety warnings: ${totals.warnings.join(' / ')}` : '';

  return [profLine, sectionLine, packLine, deficitLine, coveredLine, warnLine].filter(Boolean).join('\n');
}

function formatNum(v: number): string {
  if (v >= 10) return Math.round(v).toString();
  return (Math.round(v * 100) / 100).toString();
}
