// Strict nutrient schema used by the AI to ensure deterministic output.
// The prompt uses ALL these exact keys, with the unit baked into the key
// (so the AI can't drift on units). After the AI replies we normalize
// back to the snake_case keys our protocol code uses, converting
// Creatine/EAA/Glutamine from grams to mg.

export const STRICT_NUTRIENT_KEYS = [
  'Vitamin_B12_mcg',
  'Vitamin_B1_mg',
  'Magnesium_mg',
  'Vitamin_A_mcg',
  'Vitamin_K2_mcg',
  'Zinc_mg',
  'Selenium_mcg',
  'Vitamin_E_mg',
  'Copper_mg',
  'Vitamin_C_mg',
  'Vitamin_D3_mcg',
  'Iodine_mcg',
  'Calcium_mg',
  'Folate_mcg',
  'CoQ10_mg',
  'Vitamin_B6_mg',
  'Choline_mg',
  'Omega_3_mg',
  'Potassium_mg',
  'Iron_mg',
  'Creatine_g',
  'EAA_g',
  'L_Glutamine_g',
  'Sodium_mg',
] as const;

const STRICT_TO_INTERNAL: Record<string, [string, number]> = {
  // [internalKey, multiplierToMatchProtocolUnit]
  'Vitamin_B12_mcg': ['vitamin_b12', 1],
  'Vitamin_B1_mg':   ['vitamin_b1', 1],
  'Magnesium_mg':    ['magnesium', 1],
  'Vitamin_A_mcg':   ['vitamin_a', 1],
  'Vitamin_K2_mcg':  ['vitamin_k2', 1],
  'Zinc_mg':         ['zinc', 1],
  'Selenium_mcg':    ['selenium', 1],
  'Vitamin_E_mg':    ['vitamin_e', 1],
  'Copper_mg':       ['copper', 1],
  'Vitamin_C_mg':    ['vitamin_c', 1],
  'Vitamin_D3_mcg':  ['vitamin_d3', 1],
  'Iodine_mcg':      ['iodine', 1],
  'Calcium_mg':      ['calcium', 1],
  'Folate_mcg':      ['folate', 1],
  'CoQ10_mg':        ['coq10', 1],
  'Vitamin_B6_mg':   ['vitamin_b6', 1],
  'Choline_mg':      ['choline', 1],
  'Omega_3_mg':      ['omega_3', 1],
  'Potassium_mg':    ['potassium', 1],
  'Iron_mg':         ['iron', 1],
  'Creatine_g':      ['creatine', 1000],
  'EAA_g':           ['eaa', 1000],
  'L_Glutamine_g':   ['glutamine', 1000],
  'Sodium_mg':       ['sodium', 1],
};

export function normalizeStrictNutrients(input: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  if (!input || typeof input !== 'object') return out;
  for (const [key, raw] of Object.entries(input)) {
    const m = STRICT_TO_INTERNAL[key];
    if (!m) continue;
    const v = Number(raw);
    if (!Number.isFinite(v) || v <= 0) continue;
    out[m[0]] = v * m[1];
  }
  return out;
}

// Strict instructions block — same wording across image and text prompts so
// the model produces consistent, calibrated values. Include unit-in-key
// schema and the < 2% RDA floor.
export const STRICT_INSTRUCTIONS = `Ești un API expert în nutriție integrat într-o aplicație de tracking. Sarcina ta este să analizezi inputul (imagine sau text) și să extragi/estimezi valorile nutriționale precise.

REGULI STRICTE (respectă-le toate):
1. Calculează valorile DOAR pentru nutrienții din schema de mai jos. Nu adăuga alți nutrienți. Nu schimba nicio cheie.
2. Folosește baze de date oficiale (USDA FoodData Central, EuroFIR, etichete de pe ambalaj) ca sursă pentru valorile nutritive standard la 100g, apoi scalează liniar la greutatea estimată a porției.
3. Dacă un nutrient nu se găsește în mod natural în acel aliment SAU se găsește sub formă de urme nesemnificative (mai puțin de 2% din doza zilnică recomandată — ex: EAA sau Omega-3 într-un măr, Vitamina B12 în plante, Creatina în vegetale), TREBUIE să returnezi valoarea 0. Nu inventa.
4. Estimează o greutate standard a porției din imagine sau text dacă nu este specificată în clar (ex: 1 portocală ≈ 150g, 1 măr ≈ 180g, 1 ou ≈ 50g, 1 piept de pui ≈ 150g, 1 felie pâine ≈ 30g, 1 cană orez fiert ≈ 200g). Include greutatea în "item_identified".
5. Dacă imaginea este o ETICHETĂ NUTRIȚIONALĂ pe un ambalaj, citește valorile DIRECT de pe etichetă (la mărimea porției specificate pe ea). Nu estima — extrage exact.
6. Răspunde EXCLUSIV în format JSON valid, fără absolut niciun alt text, salut, sau formatare Markdown în afara blocului JSON.

SCHEMA JSON OBLIGATORIE — exact aceste chei și DOAR numere ca valori (fără unități în valoare, fără ghilimele pe numere):

{
  "item_identified": "Numele alimentului și greutatea estimată în grame",
  "quantity_g": <număr întreg, greutatea totală a porției în grame>,
  "isNutritionLabel": <true dacă inputul este o etichetă nutrițională, altfel false>,
  "description": "<descriere scurtă (5-15 cuvinte) a ce vezi: ingrediente vizibile + mod de preparare; FĂRĂ grame în text>",
  "nutrients": {
    "Vitamin_B12_mcg": 0,
    "Vitamin_B1_mg": 0,
    "Magnesium_mg": 0,
    "Vitamin_A_mcg": 0,
    "Vitamin_K2_mcg": 0,
    "Zinc_mg": 0,
    "Selenium_mcg": 0,
    "Vitamin_E_mg": 0,
    "Copper_mg": 0,
    "Vitamin_C_mg": 0,
    "Vitamin_D3_mcg": 0,
    "Iodine_mcg": 0,
    "Calcium_mg": 0,
    "Folate_mcg": 0,
    "CoQ10_mg": 0,
    "Vitamin_B6_mg": 0,
    "Choline_mg": 0,
    "Omega_3_mg": 0,
    "Potassium_mg": 0,
    "Iron_mg": 0,
    "Creatine_g": 0,
    "EAA_g": 0,
    "L_Glutamine_g": 0,
    "Sodium_mg": 0
  }
}`;
