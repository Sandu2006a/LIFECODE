import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
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

export async function POST(req: NextRequest) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 });
    }

    const key = (process.env.GEMINI_API_KEY || '').trim();
    if (!key) return NextResponse.json({ error: 'gemini not configured' }, { status: 500 });

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a sports nutrition AI analyzing a photo. The photo can be one of:
A) A meal/plate/food the user just ate
B) A nutrition facts label/table on a package

ANALYZE the photo and return ONLY this JSON (no markdown, no explanation):
{
  "meal": "<short name of the food, max 5 words>",
  "quantity_g": <best-guess total grams of the meal portion shown, integer>,
  "isNutritionLabel": <true if photo is a nutrition label/table, false if meal>,
  "nutrients": {
    "vitamin_a": <μg>,
    "vitamin_c": <mg>,
    "vitamin_d3": <μg>,
    "vitamin_e": <mg>,
    "vitamin_k2": <μg>,
    "vitamin_b12": <μg>,
    "b_complex": <% RDA contribution>,
    "vitamin_b6": <mg>,
    "folate": <μg>,
    "zinc": <mg>,
    "copper": <mg>,
    "magnesium": <mg>,
    "selenium": <μg>,
    "iron": <mg>,
    "calcium": <mg>,
    "omega_3": <mg>,
    "potassium": <mg>,
    "iodine": <μg>,
    "sodium": <mg>,
    "coq10": <mg>,
    "choline": <mg>,
    "eaa": <mg total essential amino acids>,
    "creatine": <mg>,
    "glutamine": <mg>
  }
}

RULES:
- Only include nutrients with meaningful amounts (>0). Omit zeros entirely.
- All values must be NUMBERS (no units inside JSON).
- If the photo is a nutrition label, READ the values directly from the label, scaled to "quantity_g" (the serving size shown on the label).
- If the photo is a meal, ESTIMATE values from USDA food composition data based on visible portion.
- Return JSON only.`;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType || 'image/jpeg',
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: 'could not analyze image', raw: text }, { status: 500 });
    }

    let parsed: any;
    try { parsed = JSON.parse(match[0]); }
    catch { return NextResponse.json({ error: 'invalid AI JSON', raw: text }, { status: 500 }); }

    const meal = String(parsed.meal || 'Scanned meal').slice(0, 100);
    const qty = Math.max(1, parseInt(String(parsed.quantity_g)) || 100);
    const nutrients = parsed.nutrients || {};

    const admin = getAdmin();
    if (!admin) return NextResponse.json({ error: 'server not configured' }, { status: 500 });

    const { data, error } = await admin.from('meal_logs').insert({
      user_id: userId, meal_name: meal, quantity_g: qty,
      nutrients, logged_at: new Date().toISOString(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      data,
      meal,
      quantity_g: qty,
      nutrients,
      isNutritionLabel: !!parsed.isNutritionLabel,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'server error' }, { status: 500 });
  }
}
