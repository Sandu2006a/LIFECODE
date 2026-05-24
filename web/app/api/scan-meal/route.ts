import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { INGREDIENT_INSTRUCTIONS, normalizeStrictNutrients } from '@/lib/nutrients';

// Extend the serverless timeout. Default on Vercel Hobby is 10s; Gemini Vision
// reliably needs 15-25s for image analysis. Without this, the function gets
// killed mid-request and Vercel returns an HTML gateway timeout page instead
// of JSON — the exact bug the user kept seeing.
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

    const imagePart = {
      inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' },
    };

    // Flash is the right choice for vision in a serverless context: 5-10x faster
    // than Pro on image analysis, well under Vercel's timeout, and accurate
    // enough for food identification (Pro's reasoning advantage doesn't show
    // up on "what is in this photo" tasks). We keep Pro as a backup only if
    // Flash truly fails — but in practice Flash succeeds.
    async function runModel(modelId: 'gemini-2.5-flash' | 'gemini-2.5-pro') {
      const model = genAI.getGenerativeModel({
        model: modelId,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
          // Force JSON output — eliminates the markdown-wrap & "intro paragraph"
          // failures that made the regex extraction unreliable.
          responseMimeType: 'application/json',
        },
      });
      return model.generateContent([INGREDIENT_INSTRUCTIONS, imagePart]);
    }

    let text: string;
    try {
      const result = await runModel('gemini-2.5-flash');
      text = result.response.text();
    } catch (e: any) {
      console.warn('[scan-meal] Flash failed, falling back to Pro:', e?.message);
      const result = await runModel('gemini-2.5-pro');
      text = result.response.text();
    }

    // With responseMimeType=json, `text` should already be valid JSON.
    // Keep the regex extractor as a safety net for older SDK behavior.
    let parsed: any;
    try { parsed = JSON.parse(text); }
    catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json({ error: 'could not analyze image', raw: text.slice(0, 500) }, { status: 500 });
      }
      try { parsed = JSON.parse(match[0]); }
      catch { return NextResponse.json({ error: 'invalid AI JSON', raw: text.slice(0, 500) }, { status: 500 }); }
    }

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
