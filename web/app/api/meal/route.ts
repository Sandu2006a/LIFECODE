import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

async function resolveUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length);
  const anon = createClient(SUPA_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data, error } = await anon.auth.getUser(token);
  if (error) return null;
  return data?.user?.id ?? null;
}

function getAdmin() {
  const svcKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!svcKey) return null;
  return createClient(SUPA_URL, svcKey, { auth: { persistSession: false } });
}

async function analyzeMeal(meal: string, qty: number): Promise<Record<string, number>> {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) return {};
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const prompt = `You are a sports nutrition AI with USDA database access.
MEAL: "${meal}" QUANTITY: ${qty}g
Calculate micronutrient content for ${qty}g. Return ONLY valid JSON. Include only nutrients with meaningful amounts (>0).
Use EXACTLY these keys with their units (values must be numeric, no unit strings):
- vitamin_a (μg RAE)
- vitamin_c (mg)
- vitamin_d3 (μg)
- vitamin_e (mg)
- vitamin_k2 (μg, only fermented foods, cheese, natto)
- vitamin_b12 (μg, only animal products)
- b_complex (% RDA contribution)
- vitamin_b6 (mg)
- folate (μg)
- zinc (mg)
- copper (mg)
- magnesium (mg, total)
- selenium (μg)
- iron (mg)
- calcium (mg)
- omega_3 (mg)
- potassium (mg)
- sodium (mg)
- coq10 (mg)
- eaa (mg, total essential amino acids)
- creatine (mg)
- glutamine (mg)
Example "chicken breast 150g": {"vitamin_b12":0.5,"vitamin_b6":0.7,"zinc":1.5,"selenium":36,"magnesium":42,"copper":0.06,"iron":1.5,"potassium":390,"sodium":110,"eaa":33000,"creatine":420,"glutamine":4500,"b_complex":18}
Example "orange 150g": {"vitamin_c":80,"vitamin_a":11,"folate":45,"calcium":60,"potassium":270,"magnesium":15,"b_complex":12}
JSON only:`;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return {};
    return JSON.parse(match[0]);
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const { meal_name, quantity_g, nutrients: providedNutrients } = await req.json();
    const name = String(meal_name || '').trim();
    if (!name) return NextResponse.json({ error: 'meal_name required' }, { status: 400 });
    const qty = Math.max(1, parseInt(String(quantity_g)) || 100);

    let nutrients = providedNutrients;
    if (!nutrients || typeof nutrients !== 'object' || Object.keys(nutrients).length === 0) {
      nutrients = await analyzeMeal(name, qty);
    }

    const admin = getAdmin();
    if (!admin) return NextResponse.json({ error: 'server not configured' }, { status: 500 });

    const { data, error } = await admin.from('meal_logs').insert({
      user_id: userId, meal_name: name, quantity_g: qty,
      nutrients, logged_at: new Date().toISOString(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, data, nutrients });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'server error' }, { status: 500 });
  }
}
