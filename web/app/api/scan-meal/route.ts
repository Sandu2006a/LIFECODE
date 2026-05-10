import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { INGREDIENT_INSTRUCTIONS, normalizeStrictNutrients } from '@/lib/nutrients';

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

// Identify-only: image → list of ingredients (each with weight + nutrients).
// Does NOT save anything. Client lets user edit per-ingredient weights, then
// calls /api/meal to log the aggregated nutrients.
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
        temperature: 0.2,
        maxOutputTokens: 4096,
      },
    });

    const imagePart = {
      inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' },
    };

    const result = await model.generateContent([INGREDIENT_INSTRUCTIONS, imagePart]);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: 'could not analyze image', raw: text }, { status: 500 });
    }

    let parsed: any;
    try { parsed = JSON.parse(match[0]); }
    catch { return NextResponse.json({ error: 'invalid AI JSON', raw: text }, { status: 500 }); }

    const isNutritionLabel = !!parsed.isNutritionLabel;
    const description = String(parsed.description || 'Scanned meal').slice(0, 200);

    const rawIngredients = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
    const ingredients = rawIngredients.map((ing: any, idx: number) => {
      const name = String(ing.name || `Ingredient ${idx + 1}`).slice(0, 100);
      const quantity_g = Math.max(1, parseInt(String(ing.quantity_g)) || 100);
      const nutrients = normalizeStrictNutrients(ing.nutrients || {});
      return { name, quantity_g, nutrients };
    });

    // Total estimated portion across all ingredients
    const totalGrams = ingredients.reduce((s: number, ing: any) => s + ing.quantity_g, 0);

    return NextResponse.json({
      ok: true,
      description,
      isNutritionLabel,
      ingredients,
      quantity_g: totalGrams || 100,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'server error' }, { status: 500 });
  }
}
