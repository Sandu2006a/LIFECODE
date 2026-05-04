const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

export async function analyzeMealWithAI(
  mealName: string,
  quantityG: number
): Promise<Record<string, number>> {
  const prompt = `You are a sports nutrition AI with access to USDA and European food composition databases.

MEAL: "${mealName}"
QUANTITY: ${quantityG}g

Calculate the micronutrient content of this specific food at this quantity.
Base your calculations on standard food composition data. Adjust all values proportionally for ${quantityG}g (standard reference is 100g).

Return ONLY valid JSON. Include only nutrients with meaningful amounts (>0). Use these exact keys and units:
- vitamin_a (μg retinol equivalents)
- vitamin_c (mg)
- vitamin_d3 (μg)
- vitamin_e (mg)
- vitamin_k2 (μg — only for fermented foods, cheese, natto; 0 otherwise)
- vitamin_b12 (μg — only animal products)
- b_complex (% RDA contribution from this food)
- zinc (mg)
- copper (mg)
- magnesium_citrate (mg — use total magnesium from food)
- selenium (μg)
- eaa (g — essential amino acids, for protein foods)
- sodium (mg)

Example for "chicken breast 200g": {"vitamin_b12":0.6,"zinc":4.4,"selenium":68,"magnesium_citrate":62,"copper":0.2,"eaa":38,"b_complex":25}
Example for "orange 150g": {"vitamin_c":106,"vitamin_a":9,"b_complex":15,"magnesium_citrate":18}

JSON only, no explanation:`;

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 300 },
    }),
  });

  const data = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try { return JSON.parse(match[0]); } catch { return {}; }
}
