export type Nutrient = {
  key: string;
  name: string;
  unit: string;
  supplement: number;
  form: string;
};

export const MORNING_NUTRIENTS: Nutrient[] = [
  { key: 'vitamin_a',         name: 'Vitamin A',   unit: 'μg', supplement: 800,   form: 'Retinyl Palmitate'   },
  { key: 'vitamin_c',         name: 'Vitamin C',   unit: 'mg',      supplement: 200,   form: 'Calcium Ascorbate'   },
  { key: 'vitamin_d3',        name: 'Vitamin D3',  unit: 'μg', supplement: 25,    form: 'Cholecalciferol'     },
  { key: 'vitamin_e',         name: 'Vitamin E',   unit: 'mg',      supplement: 12,    form: 'd-alpha-Tocopheryl'  },
  { key: 'vitamin_k2',        name: 'Vitamin K2',  unit: 'μg', supplement: 50,    form: 'MK-7'                },
  { key: 'vitamin_b12',       name: 'Vitamin B12', unit: 'μg', supplement: 100,   form: 'Methylcobalamin'     },
  { key: 'b_complex',         name: 'B Complex',   unit: '%',       supplement: 100,   form: 'Methylated Premix'   },
  { key: 'zinc',              name: 'Zinc',        unit: 'mg',      supplement: 10,    form: 'Bisglycinate'        },
  { key: 'copper',            name: 'Copper',      unit: 'mg',      supplement: 0.5,   form: 'Bisglycinate'        },
  { key: 'magnesium_citrate', name: 'Magnesium',   unit: 'mg',      supplement: 350,   form: 'Citrate'             },
  { key: 'selenium',          name: 'Selenium',    unit: 'μg', supplement: 50,    form: 'Selenomethionine'    },
];

export const RECOVERY_NUTRIENTS: Nutrient[] = [
  { key: 'maltodextrin',     name: 'Maltodextrin',    unit: 'g',   supplement: 20,    form: 'Low DE'              },
  { key: 'eaa',              name: 'EAA Complex',     unit: 'g',   supplement: 7,     form: 'Full Spectrum'        },
  { key: 'creatine',         name: 'Creatine',        unit: 'g',   supplement: 5,     form: 'Monohydrate'         },
  { key: 'glutamine',        name: 'L-Glutamine',     unit: 'g',   supplement: 3,     form: 'Free-Form'           },
  { key: 'hmb',              name: 'HMB',             unit: 'g',   supplement: 1.5,   form: 'Calcium Salt'        },
  { key: 'tart_cherry',      name: 'Tart Cherry',     unit: 'mg',  supplement: 500,   form: 'Anthocyanin'         },
  { key: 'sodium',           name: 'Himalayan Salt',  unit: 'mg',  supplement: 116,   form: '84 Minerals'         },
  { key: 'magnesium_bisgly', name: 'Mg Bisglycinate', unit: 'mg',  supplement: 150,   form: 'Chelated'            },
  { key: 'l_theanine',       name: 'L-Theanine',      unit: 'mg',  supplement: 100,   form: 'Free-Form'           },
  { key: 'astragin',         name: 'AstraGin®',  unit: 'mg',  supplement: 50,    form: 'Astragalus+Panax'    },
];

export const DEFAULT_TARGETS: Record<string, number> = {
  vitamin_a: 900, vitamin_c: 600, vitamin_d3: 50, vitamin_e: 20,
  vitamin_k2: 120, vitamin_b12: 100, b_complex: 100,
  zinc: 15, copper: 1.5, magnesium_citrate: 600, selenium: 100,
  maltodextrin: 25, eaa: 14, creatine: 5, glutamine: 5,
  hmb: 3, tart_cherry: 500, sodium: 500, magnesium_bisgly: 300,
  l_theanine: 200, astragin: 50,
};

export function calcProgress(
  morningTaken: boolean,
  recoveryTaken: boolean,
  mealNutrients: Record<string, number>,
  targets: Record<string, number>
): Record<string, { current: number; target: number; pct: number }> {
  const totals: Record<string, number> = { ...mealNutrients };

  if (morningTaken) {
    for (const n of MORNING_NUTRIENTS) {
      totals[n.key] = (totals[n.key] || 0) + n.supplement;
    }
  }
  if (recoveryTaken) {
    for (const n of RECOVERY_NUTRIENTS) {
      totals[n.key] = (totals[n.key] || 0) + n.supplement;
    }
  }

  const result: Record<string, { current: number; target: number; pct: number }> = {};
  for (const n of [...MORNING_NUTRIENTS, ...RECOVERY_NUTRIENTS]) {
    const target = targets[n.key] || DEFAULT_TARGETS[n.key] || n.supplement;
    const current = totals[n.key] || 0;
    result[n.key] = {
      current: Math.round(current * 10) / 10,
      target,
      pct: Math.min(100, Math.round((current / target) * 100)),
    };
  }
  return result;
}

export function formatAmount(val: number, unit: string): string {
  if (unit === 'g' || unit === 'mg' || unit === '%') return val.toFixed(unit === 'g' ? 1 : 0);
  return val.toFixed(0);
}
