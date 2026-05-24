import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { STRICT_INSTRUCTIONS, normalizeStrictNutrients } from '@/lib/nutrients';

export const maxDuration = 60;

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

async function analyzeMealText(meal: string, qty: number): Promise<Record<string, number>> {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) return {};
  const genAI = new GoogleGenerativeAI(key);
  const prompt = `${STRICT_INSTRUCTIONS}

INPUT (text, nu imagine):
Aliment: "${meal}"
Cantitate: ${qty} grame

Setează "isNutritionLabel": false. Setează "quantity_g": ${qty}. Calculează nutrienții pentru exact ${qty} grame din "${meal}".`;

  async function runModel(modelId: 'gemini-2.5-pro' | 'gemini-2.5-flash') {
    const model = genAI.getGenerativeModel({
      model: modelId,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1500,
        responseMimeType: 'application/json',
      },
    });
    return model.generateContent(prompt);
  }

  // Flash first — text-to-nutrient is well within its capability AND it
  // returns in 1-3s vs Pro's 5-10s, comfortably under any timeout.
  let text: string;
  try {
    const result = await runModel('gemini-2.5-flash');
    text = result.response.text();
  } catch (e: any) {
    console.warn('[meal] Flash failed, falling back to Pro:', e?.message);
    try {
      const result = await runModel('gemini-2.5-pro');
      text = result.response.text();
    } catch {
      return {};
    }
  }

  try {
    let parsed: any;
    try { parsed = JSON.parse(text); }
    catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return {};
      parsed = JSON.parse(match[0]);
    }
    return normalizeStrictNutrients(parsed.nutrients || {});
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
      nutrients = await analyzeMealText(name, qty);
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
