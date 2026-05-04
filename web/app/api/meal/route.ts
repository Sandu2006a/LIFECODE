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
Calculate micronutrient content. Return ONLY valid JSON. Include only nutrients with amounts > 0.
Use these exact keys with values for ${qty}g: vitamin_a (μg), vitamin_c (mg), vitamin_d3 (μg), vitamin_e (mg), vitamin_k2 (μg, only fermented/cheese/natto), vitamin_b12 (μg, only animal), b_complex (% RDA), zinc (mg), copper (mg), magnesium_citrate (mg), selenium (μg), eaa (g), sodium (mg).
Example chicken breast 200g: {"vitamin_b12":0.6,"zinc":4.4,"selenium":68,"magnesium_citrate":62,"copper":0.2,"eaa":38,"b_complex":25}
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
