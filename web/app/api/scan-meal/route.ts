import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { STRICT_INSTRUCTIONS, normalizeStrictNutrients } from '@/lib/nutrients';

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

// Identify-only: image → strict nutrient JSON. Does NOT save anything.
// Client confirms/edits, then calls /api/meal to log with the parsed
// nutrients (so we don't run Gemini twice on labels we've already read).
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
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1500,
      },
    });

    const imagePart = {
      inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' },
    };

    const result = await model.generateContent([STRICT_INSTRUCTIONS, imagePart]);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: 'could not analyze image', raw: text }, { status: 500 });
    }

    let parsed: any;
    try { parsed = JSON.parse(match[0]); }
    catch { return NextResponse.json({ error: 'invalid AI JSON', raw: text }, { status: 500 }); }

    const nutrientsStrict = parsed.nutrients || {};
    const labelNutrients = normalizeStrictNutrients(nutrientsStrict);
    const description = String(parsed.description || parsed.item_identified || 'Scanned meal').slice(0, 200);
    const quantity_g = Math.max(1, parseInt(String(parsed.quantity_g)) || 100);
    const isNutritionLabel = !!parsed.isNutritionLabel;

    return NextResponse.json({
      ok: true,
      description,
      quantity_g,
      isNutritionLabel,
      // Always return parsed nutrients (works for both meal photos AND labels)
      // The client can choose to pass them straight through to /api/meal
      // skipping a second Gemini call.
      labelNutrients,
      itemIdentified: parsed.item_identified || description,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'server error' }, { status: 500 });
  }
}
