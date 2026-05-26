// Athlete-personalised nutrient calculator.
// Formulas, multipliers, safety caps + pack definitions per Lifecode spec.

export type Sex        = 'M' | 'F';
export type SportType  = 'STRENGTH' | 'ENDURANCE' | 'MIXED' | 'TEAM';
export type Intensity  = 'LIGHT' | 'MODERATE' | 'HIGH' | 'ELITE';
export type Category   = 'morning' | 'essentials' | 'recovery';

export type AthleteProfile = {
  weightKg: number;
  age: number;
  sex: Sex;
  trainingHours: number;    // hours / week
  sportType: SportType;
  intensity: Intensity;
  isMenstruating: boolean;
  conditions: string[];
};

export const DEFAULT_PROFILE: AthleteProfile = {
  weightKg: 75,
  age: 25,
  sex: 'M',
  trainingHours: 5,
  sportType: 'MIXED',
  intensity: 'MODERATE',
  isMenstruating: false,
  conditions: [],
};

export type NutrientDef = {
  id: string;
  name: string;
  unit: string;
  category: Category;
  ul?: number;                              // upper limit
  // base formula in (W=weightKg, T=trainingHours, A=age, S=sex)
  base: (p: AthleteProfile) => number;
  // pack contributions
  morningPack?: number;
  recoveryPack?: number;
  // food key from AI scan response (after normalizeStrictNutrients)
  foodKey?: string;
  foodTip?: string;
};

// ──────────────────────────────────────────────────────────────
// MORNING — exact contents of LIFECODE Morning Pak (11 items)
// ──────────────────────────────────────────────────────────────
const MORNING: NutrientDef[] = [
  { id: 'vit_a',     name: 'Vitamin A',          unit: 'μg', category: 'morning', ul: 3000,  base: p => p.sex === 'F' ? 700 : 900,                  morningPack: 800,  foodKey: 'vitamin_a',  foodTip: 'Carrots, sweet potato, liver' },
  { id: 'vit_c',     name: 'Vitamin C',          unit: 'mg', category: 'morning', ul: 2000,  base: p => 200 + p.trainingHours * 25,                 morningPack: 200,  foodKey: 'vitamin_c',  foodTip: 'Citrus, kiwi, bell pepper' },
  { id: 'vit_d3',    name: 'Vitamin D3',         unit: 'μg', category: 'morning', ul: 100,   base: p => 25 + Math.min(50, p.trainingHours * 2),     morningPack: 25,   foodKey: 'vitamin_d3', foodTip: 'Salmon, egg yolks, sunlight' },
  { id: 'vit_e',     name: 'Vitamin E',          unit: 'mg', category: 'morning', ul: 1000,  base: p => 15 + p.trainingHours * 0.5,                 morningPack: 12,   foodKey: 'vitamin_e',  foodTip: 'Almonds, sunflower seeds' },
  { id: 'vit_k2',    name: 'Vitamin K2 (MK-7)',  unit: 'μg', category: 'morning', ul: 200,   base: () => 100,                                       morningPack: 50,   foodKey: 'vitamin_k2', foodTip: 'Hard cheese, natto, egg yolk' },
  { id: 'vit_b12',   name: 'Vitamin B12',        unit: 'μg', category: 'morning',            base: () => 100,                                       morningPack: 100,  foodKey: 'vitamin_b12',foodTip: 'Beef, salmon, eggs' },
  { id: 'b_complex', name: 'B Complex',          unit: '%',  category: 'morning',            base: p => p.sportType === 'ENDURANCE' ? 200 : 100,    morningPack: 100,                          foodTip: 'Whole grains, eggs, leafy greens' },
  { id: 'zinc',      name: 'Zinc',               unit: 'mg', category: 'morning', ul: 40,    base: p => (p.sex === 'F' ? 8 : 11) + p.trainingHours * 0.3, morningPack: 10, foodKey: 'zinc',  foodTip: 'Pumpkin seeds, beef, oysters' },
  { id: 'copper',    name: 'Copper',             unit: 'mg', category: 'morning', ul: 10,    base: p => 0.9 + p.trainingHours * 0.05,               morningPack: 0.5,  foodKey: 'copper',     foodTip: 'Cashews, dark chocolate, liver' },
  { id: 'magnesium_am', name: 'Magnesium (Citrate)', unit: 'mg', category: 'morning', ul: 700, base: p => 350 + p.trainingHours * 5,                morningPack: 350,  foodKey: 'magnesium',  foodTip: 'Spinach, almonds, dark chocolate' },
  { id: 'selenium',  name: 'Selenium',           unit: 'μg', category: 'morning', ul: 400,   base: p => 55 + p.trainingHours * 2,                   morningPack: 50,   foodKey: 'selenium',   foodTip: 'Brazil nuts (1-2 daily)' },
];

// ──────────────────────────────────────────────────────────────
// ESSENTIALS — food + 3rd-party only (NOT in any LIFECODE pack)
// Targets are Gemini-personalized (override formulas in profiles.micro_targets)
// ──────────────────────────────────────────────────────────────
const ESSENTIALS: NutrientDef[] = [
  { id: 'omega_3',   name: 'Omega-3 (EPA+DHA)',  unit: 'mg', category: 'essentials', ul: 5000, base: p => 1000 + p.weightKg * 15,                  foodKey: 'omega_3',   foodTip: 'Salmon, sardines, walnuts' },
  { id: 'calcium',   name: 'Calcium',            unit: 'mg', category: 'essentials', ul: 2500, base: p => p.age >= 50 ? 1200 : 1000,               foodKey: 'calcium',   foodTip: 'Dairy, sardines, kale' },
  { id: 'potassium', name: 'Potassium',          unit: 'mg', category: 'essentials', ul: 3500, base: p => 1000 + p.trainingHours * 80,             foodKey: 'potassium', foodTip: 'Banana, potato, avocado' },
  // Sodium target = total daily need. Recovery Pak's Pink Salt adds 300mg (cross-contributes).
  { id: 'sodium',    name: 'Sodium',             unit: 'mg', category: 'essentials', ul: 2300, base: p => 500 + p.trainingHours * 100,             foodKey: 'sodium',    foodTip: 'Salt, broth, pickles', recoveryPack: 300 },
  { id: 'iodine',    name: 'Iodine',             unit: 'μg', category: 'essentials', ul: 1100, base: p => 150 + p.trainingHours * 5,               foodKey: 'iodine',    foodTip: 'Seaweed, fish, dairy' },
];

// ──────────────────────────────────────────────────────────────
// RECOVERY — exact contents of LIFECODE Anabolic Recovery Pak (10 items)
// ──────────────────────────────────────────────────────────────
const RECOVERY: NutrientDef[] = [
  { id: 'maltodextrin', name: 'Maltodextrin',    unit: 'g',  category: 'recovery', ul: 100,  base: p => 20 + p.trainingHours * 1.5,           recoveryPack: 20 },
  { id: 'eaa',          name: 'EAA Complex',     unit: 'g',  category: 'recovery', ul: 20,   base: p => 7 + p.weightKg * 0.05,                recoveryPack: 7,  foodKey: 'eaa',       foodTip: 'Chicken, whey, eggs' },
  { id: 'creatine',     name: 'Creatine Monohydrate', unit: 'g', category: 'recovery', ul: 10, base: () => 5,                                  recoveryPack: 5 }, // pack covers; food contribution negligible
  { id: 'l_glutamine',  name: 'L-Glutamine',     unit: 'g',  category: 'recovery', ul: 30,   base: p => 3 + p.trainingHours * 0.15,           recoveryPack: 3,  foodKey: 'glutamine', foodTip: 'Cottage cheese, beef' },
  { id: 'hmb',          name: 'HMB (Ca-Salt)',   unit: 'g',  category: 'recovery', ul: 6,    base: () => 1.5,                                 recoveryPack: 1.5 }, // pack only
  { id: 'tart_cherry',  name: 'Tart Cherry Extract', unit: 'mg', category: 'recovery', ul: 1200, base: () => 500,                              recoveryPack: 500 }, // pack only
  { id: 'pink_salt',    name: 'Himalayan Pink Salt', unit: 'mg', category: 'recovery',          base: () => 300,                              recoveryPack: 300 }, // pack only (sodium also tracked in Essentials)
  { id: 'magnesium_pm', name: 'Magnesium Bisglycinate', unit: 'mg', category: 'recovery', ul: 400, base: () => 150,                            recoveryPack: 150 },
  { id: 'l_theanine',   name: 'L-Theanine',      unit: 'mg', category: 'recovery', ul: 1200, base: () => 100,                                 recoveryPack: 100 },
  { id: 'astragin',     name: 'AstraGin',        unit: 'mg', category: 'recovery', ul: 100,  base: () => 50,                                  recoveryPack: 50 }, // pack only
];

export const NUTRIENTS: NutrientDef[] = [...MORNING, ...ESSENTIALS, ...RECOVERY];

// ──────────────────────────────────────────────────────────────
// Multipliers
// ──────────────────────────────────────────────────────────────
const INTENSITY_MULT: Record<Intensity, number> = {
  LIGHT: 0.85, MODERATE: 1.00, HIGH: 1.15, ELITE: 1.30,
};

const SPORT_ADJUST: Record<SportType, Partial<Record<string, number>>> = {
  ENDURANCE: { omega_3: 1.25, sodium: 1.3, potassium: 1.2, vit_c: 1.2, iodine: 1.15, b_complex: 1.5 },
  STRENGTH:  { creatine: 1.0, eaa: 1.15, hmb: 1.15, magnesium_am: 1.1, magnesium_pm: 1.1 },
  MIXED: {}, // averaged of both
  TEAM:  {}, // same as MIXED
};
// Pre-compute MIXED/TEAM as average of ENDURANCE and STRENGTH where keys overlap
(() => {
  const keys = new Set([...Object.keys(SPORT_ADJUST.ENDURANCE), ...Object.keys(SPORT_ADJUST.STRENGTH)]);
  const mixed: Record<string, number> = {};
  keys.forEach(k => {
    const a = (SPORT_ADJUST.ENDURANCE as any)[k];
    const b = (SPORT_ADJUST.STRENGTH as any)[k];
    if (a && b) mixed[k] = (a + b) / 2;
    else if (a) mixed[k] = 1 + (a - 1) * 0.5;
    else if (b) mixed[k] = 1 + (b - 1) * 0.5;
  });
  SPORT_ADJUST.MIXED = mixed;
  SPORT_ADJUST.TEAM  = mixed;
})();

// ──────────────────────────────────────────────────────────────
// Profile mappers (from app's `profiles` table values to AthleteProfile)
// ──────────────────────────────────────────────────────────────
export function mapSportType(sport: string | null | undefined): SportType {
  if (!sport) return 'MIXED';
  const s = sport.toLowerCase();
  if (s.includes('marathon') || s.includes('endurance') || s.includes('run') || s.includes('cycl') || s.includes('triathlon') || s.includes('swim')) return 'ENDURANCE';
  if (s.includes('powerlift') || s.includes('strength') || s.includes('weightlift') || s.includes('bodybuild') || s.includes('cross')) return 'STRENGTH';
  if (s.includes('football') || s.includes('soccer') || s.includes('basketball') || s.includes('rugby') || s.includes('hockey') || s.includes('handball')) return 'TEAM';
  return 'MIXED';
}

export function mapIntensity(goal: string | null | undefined): Intensity {
  if (!goal) return 'MODERATE';
  const g = goal.toLowerCase();
  if (g.includes('elite') || g.includes('pro')) return 'ELITE';
  if (g.includes('muscle') || g.includes('fat') || g.includes('competit') || g.includes('high')) return 'HIGH';
  if (g.includes('recover') || g.includes('general') || g.includes('light')) return 'LIGHT';
  return 'MODERATE';
}

export function profileFromDb(row: any): AthleteProfile {
  return {
    weightKg:        Number(row?.weight_kg) || DEFAULT_PROFILE.weightKg,
    age:             Number(row?.age) || DEFAULT_PROFILE.age,
    sex:             (row?.gender || '').toLowerCase().startsWith('f') ? 'F' : 'M',
    trainingHours:   Number(row?.training_frequency || 0) > 0
                       ? Math.max(1, Number(row?.training_frequency) * 1.5)
                       : DEFAULT_PROFILE.trainingHours,
    sportType:       mapSportType(row?.sport),
    intensity:       mapIntensity(row?.goal),
    isMenstruating:  !!row?.is_menstruating,
    conditions:      Array.isArray(row?.conditions) ? row.conditions : [],
  };
}

// ──────────────────────────────────────────────────────────────
// Target calculation
// ──────────────────────────────────────────────────────────────
export function calculateTarget(def: NutrientDef, p: AthleteProfile): number {
  let v = Math.max(0, def.base(p));

  // Intensity applies to MORNING + RECOVERY (not ESSENTIALS)
  if (def.category === 'morning' || def.category === 'recovery') {
    v *= INTENSITY_MULT[p.intensity];
  }

  // Sport adjustment
  const sportMul = SPORT_ADJUST[p.sportType]?.[def.id];
  if (sportMul) v *= sportMul;

  // Menstrual adjustment (female athletes only)
  if (p.isMenstruating && p.sex === 'F') {
    if (def.id === 'magnesium_am') v *= 1.2;
    if (def.id === 'magnesium_pm') v *= 1.2;
    if (def.id === 'calcium')      v *= 1.2;
  }

  // Age adjustment >= 40
  if (p.age >= 40) {
    if (def.id === 'vit_d3')       v *= 1.2;
    if (def.id === 'magnesium_am') v *= 1.15;
    if (def.id === 'magnesium_pm') v *= 1.15;
    if (def.id === 'calcium')      v *= 1.1;
  }

  // Cap at UL
  if (def.ul != null && v > def.ul) v = def.ul;

  // Round nicely (1 decimal under 10, integer ≥ 10)
  if (v < 10) return Math.round(v * 100) / 100;
  return Math.round(v);
}

export type NutrientTarget = {
  id: string;
  name: string;
  unit: string;
  category: Category;
  target: number;
  ul?: number;
  fromMorningPack: number;
  fromRecoveryPack: number;
  fromFood: number;
  consumed: number;
  pct: number;
  morningPack: number;
  recoveryPack: number;
  foodTip: string;
  capped: boolean;
};

// Compute today's nutrient state given profile + which packs taken + food totals
export function computeDailyTargets(
  profile: AthleteProfile,
  morningTaken: boolean,
  recoveryTaken: boolean,
  foodTotals: Record<string, number>,
): NutrientTarget[] {
  return NUTRIENTS.map(def => {
    const target = calculateTarget(def, profile);
    const fromMorningPack  = morningTaken  ? (def.morningPack  || 0) : 0;
    const fromRecoveryPack = recoveryTaken ? (def.recoveryPack || 0) : 0;

    // Pull food contribution from AI scan keys
    let fromFood = 0;
    if (def.foodKey) {
      const v = Number(foodTotals[def.foodKey]) || 0;
      // AI's eaa/glutamine/creatine arrive in mg after normalization — convert to g
      if (def.id === 'eaa' || def.id === 'l_glutamine' || def.id === 'creatine') {
        fromFood = v / 1000;
      } else {
        fromFood = v;
      }
    }

    const consumed = fromMorningPack + fromRecoveryPack + fromFood;
    const capped = !!(def.ul && consumed > def.ul);
    const consumedEffective = capped ? def.ul! : consumed;
    const pct = target > 0 ? Math.min(100, Math.round((consumedEffective / target) * 100)) : 0;

    return {
      id: def.id, name: def.name, unit: def.unit, category: def.category,
      target, ul: def.ul,
      fromMorningPack, fromRecoveryPack, fromFood,
      consumed,
      pct,
      morningPack: def.morningPack || 0,
      recoveryPack: def.recoveryPack || 0,
      foodTip: def.foodTip || '',
      capped,
    };
  });
}

export function sectionAverage(rows: NutrientTarget[], cat: Category): number {
  const arr = rows.filter(r => r.category === cat);
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b.pct, 0) / arr.length);
}

// ──────────────────────────────────────────────────────────────
// Safety warnings (for Ask AI prompt + UI badges)
// ──────────────────────────────────────────────────────────────
export function safetyWarnings(rows: NutrientTarget[], p: AthleteProfile): string[] {
  const out: string[] = [];

  // Capped nutrients
  const capped = rows.filter(r => r.capped);
  capped.forEach(r => out.push(`${r.name} is at upper limit (${r.ul}${r.unit}).`));

  // Conditions
  const cond = (p.conditions || []).map(c => c.toLowerCase());
  if (cond.includes('pregnancy')) {
    const va = rows.find(r => r.id === 'vit_a');
    if (va && va.consumed > 700) out.push(`Vitamin A ${va.consumed}μg too high in pregnancy (max 700μg retinol).`);
  }
  if (cond.includes('warfarin') || cond.includes('anticoagulant')) {
    const k2 = rows.find(r => r.id === 'vit_k2');
    if (k2 && k2.consumed > 0) out.push(`Vitamin K2 interacts with warfarin — consult your doctor.`);
  }
  return out;
}
