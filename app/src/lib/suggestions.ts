import { MORNING_NUTRIENTS, RECOVERY_NUTRIENTS, type Nutrient } from './nutrients';

export type Suggestion = {
  nutrientKey: string;
  nutrientName: string;
  pct: number;
  gap: number;
  unit: string;
  food: string;
  defaultQty: number;
  estimatedGain: number;
  reason: string;
};

const FOOD_MAP: Record<string, { food: string; qty: number; per100g: number; reason: string }[]> = {
  vitamin_a:        [{ food: 'carrot',           qty: 100, per100g: 835,   reason: 'Beta-carotene rich' },
                     { food: 'spinach',          qty: 100, per100g: 469,   reason: 'High in retinol' }],
  vitamin_c:        [{ food: 'orange',           qty: 150, per100g: 70,    reason: 'Citrus burst' },
                     { food: 'kiwi',             qty: 100, per100g: 92,    reason: 'Best per gram' },
                     { food: 'red bell pepper',  qty: 100, per100g: 128,   reason: 'Highest source' }],
  vitamin_d3:       [{ food: 'salmon',           qty: 100, per100g: 11,    reason: 'Plus omega-3' },
                     { food: 'eggs',             qty: 100, per100g: 2,     reason: 'Daily staple' }],
  vitamin_e:        [{ food: 'almonds',          qty: 30,  per100g: 25,    reason: 'Easy snack' },
                     { food: 'sunflower seeds',  qty: 30,  per100g: 35,    reason: 'Top source' }],
  vitamin_k2:       [{ food: 'hard cheese',      qty: 30,  per100g: 76,    reason: 'Fermented dairy' },
                     { food: 'natto',            qty: 30,  per100g: 1100,  reason: 'Best source' }],
  vitamin_b12:      [{ food: 'beef',             qty: 100, per100g: 6,     reason: 'Plus iron' },
                     { food: 'eggs',             qty: 100, per100g: 1.1,   reason: 'Two eggs' }],
  b_complex:        [{ food: 'eggs',             qty: 100, per100g: 12,    reason: 'B-vitamin complete' },
                     { food: 'salmon',           qty: 150, per100g: 18,    reason: 'B6 + B12' }],
  zinc:             [{ food: 'pumpkin seeds',    qty: 30,  per100g: 7.8,   reason: 'Easy snack' },
                     { food: 'beef',             qty: 100, per100g: 4.8,   reason: 'Bioavailable' }],
  copper:           [{ food: 'cashews',          qty: 30,  per100g: 2.2,   reason: 'Top plant source' },
                     { food: 'dark chocolate',   qty: 30,  per100g: 1.8,   reason: 'Treat option' }],
  magnesium_citrate:[{ food: 'spinach',          qty: 100, per100g: 78,    reason: 'Leafy green' },
                     { food: 'dark chocolate',   qty: 30,  per100g: 230,   reason: 'Best ratio' },
                     { food: 'almonds',          qty: 30,  per100g: 270,   reason: 'Snack' }],
  selenium:         [{ food: 'brazil nuts',      qty: 5,   per100g: 1900,  reason: '2 nuts = full RDA' },
                     { food: 'tuna',             qty: 100, per100g: 90,    reason: 'Daily option' }],
  eaa:              [{ food: 'chicken breast',   qty: 150, per100g: 23,    reason: 'Lean protein' },
                     { food: 'whey protein',     qty: 30,  per100g: 80,    reason: 'Fast absorb' }],
  glutamine:        [{ food: 'cottage cheese',   qty: 100, per100g: 1.8,   reason: 'High glutamine' },
                     { food: 'beef',             qty: 100, per100g: 1.2,   reason: 'Free-form' }],
  sodium:           [{ food: 'pickles',          qty: 30,  per100g: 1200,  reason: 'Quick fix' },
                     { food: 'pretzels',         qty: 30,  per100g: 1715,  reason: 'Pre-workout' }],
};

export function getSuggestions(
  progress: Record<string, { current: number; target: number; pct: number }>,
  limit = 4
): Suggestion[] {
  const all: Nutrient[] = [...MORNING_NUTRIENTS, ...RECOVERY_NUTRIENTS];
  const out: Suggestion[] = [];

  for (const n of all) {
    const pr = progress[n.key];
    if (!pr || pr.target === 0) continue;
    if (pr.pct >= 90) continue;
    const candidates = FOOD_MAP[n.key];
    if (!candidates || candidates.length === 0) continue;

    const gap = Math.max(0, pr.target - pr.current);
    const pick = candidates[0];
    const totalFromQty = (pick.per100g * pick.qty) / 100;
    const gain = Math.min(totalFromQty, gap);

    out.push({
      nutrientKey: n.key,
      nutrientName: n.name,
      pct: pr.pct,
      gap: Math.round(gap * 10) / 10,
      unit: n.unit,
      food: pick.food,
      defaultQty: pick.qty,
      estimatedGain: Math.round(gain * 10) / 10,
      reason: pick.reason,
    });
  }

  out.sort((a, b) => a.pct - b.pct);
  return out.slice(0, limit);
}
