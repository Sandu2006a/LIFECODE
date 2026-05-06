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

// Identify-only: returns description + estimated grams + (if label) parsed nutrients.
// Does NOT save anything. The client confirms/edits, then calls /api/meal to log.
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

    const prompt = `You are analyzing a photo for a sports nutrition app. The photo can be:
A) A meal/plate/food the user just ate
B) A nutrition facts label/table on a package

DESCRIBE what you see and estimate the portion. Return ONLY this JSON (no markdown, no explanation):
{
  "description": "<plain-English short description of the meal in 5-15 words: ingredients you see + cooking style. e.g. 'Grilled chicken breast with rice and steamed broccoli'>",
  "quantity_g": <best-guess total grams of the visible portion, integer>,
  "isNutritionLabel": <true if photo is a nutrition label/table, false if meal>,
  "labelNutrients": <only if isNutritionLabel is true: object with the EXACT values from the label scaled to quantity_g, using these keys when present in the label: vitamin_a (μg), vitamin_c (mg), vitamin_d3 (μg), vitamin_e (mg), vitamin_k2 (μg), vitamin_b12 (μg), vitamin_b6 (mg), folate (μg), b_complex (% RDA), zinc (mg), copper (mg), magnesium (mg), selenium (μg), iron (mg), calcium (mg), omega_3 (mg), potassium (mg), iodine (μg), sodium (mg), coq10 (mg), choline (mg), eaa (mg), creatine (mg), glutamine (mg). Omit zeros. ALL VALUES MUST BE NUMBERS, NO UNITS.>
}

Rules:
- description must be human-readable, NO grams in it (we have quantity_g)
- if isNutritionLabel is false, omit the labelNutrients field entirely
- JSON only`;

    const imagePart = {
      inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' },
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

    return NextResponse.json({
      ok: true,
      description: String(parsed.description || 'Scanned meal').slice(0, 200),
      quantity_g: Math.max(1, parseInt(String(parsed.quantity_g)) || 100),
      isNutritionLabel: !!parsed.isNutritionLabel,
      labelNutrients: parsed.labelNutrients || null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'server error' }, { status: 500 });
  }
}
