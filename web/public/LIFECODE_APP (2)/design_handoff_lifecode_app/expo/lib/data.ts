// Static reference data — same as web prototype
export type Ingredient = { name: string; form: string; amount: string };

export const MORNING_INGREDIENTS: Ingredient[] = [
  { name: 'Vitamin A', form: 'Retinyl Palmitate (CWD)', amount: '800 μg' },
  { name: 'Vitamin C', form: 'Calcium Ascorbate', amount: '200 mg' },
  { name: 'Vitamin D3', form: 'Cholecalciferol (Vegan)', amount: '25 μg' },
  { name: 'Vitamin E', form: 'd-alpha-Tocopheryl', amount: '12 mg' },
  { name: 'Vitamin K2', form: 'Menaquinone-7 (MK-7)', amount: '50 μg' },
  { name: 'Vitamin B12', form: 'Methylcobalamin', amount: '100 μg' },
  { name: 'B Complex', form: 'Methylated B-Complex Premix', amount: '100% RDA' },
  { name: 'Zinc', form: 'Zinc Bisglycinate', amount: '10 mg' },
  { name: 'Copper', form: 'Copper Bisglycinate', amount: '0.5 mg' },
  { name: 'Magnesium', form: 'Magnesium Citrate', amount: '350 mg' },
  { name: 'Selenium', form: 'Selenomethionine', amount: '50 μg' },
];

export const RECOVERY_INGREDIENTS: Ingredient[] = [
  { name: 'Maltodextrin (Low DE)', form: 'Carbohydrate Matrix', amount: '20 000 mg' },
  { name: 'EAA Complex', form: 'Full Spectrum (all 9 EAAs)', amount: '7 000 mg' },
  { name: 'Creatine Monohydrate', form: 'Micronized (Clinical Grade)', amount: '5 000 mg' },
  { name: 'L-Glutamine', form: 'Free-Form L-Glutamine', amount: '3 000 mg' },
  { name: 'HMB (Calcium Salt)', form: 'Beta-Hydroxy Beta-Methylbutyrate', amount: '1 500 mg' },
  { name: 'Tart Cherry Extract', form: 'Standardized Anthocyanin', amount: '500 mg' },
  { name: 'Himalayan Pink Salt', form: '84 Trace Minerals', amount: '300 mg' },
  { name: 'Magnesium Bisglycinate', form: 'Chelated Magnesium', amount: '150 mg' },
  { name: 'L-Theanine', form: 'Free-Form L-Theanine', amount: '100 mg' },
  { name: 'AstraGin®', form: 'Astragalus + Panax', amount: '50 mg' },
];
