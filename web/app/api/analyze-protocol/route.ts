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

    const admin = getAdmin();
    if (!admin) return NextResponse.json({ error: 'server not configured' }, { status: 500 });

    const { data: profile } = await admin.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (!profile) return NextResponse.json({ error: 'profile not found' }, { status: 404 });

    const age = profile.age || 25;
    const sex = profile.gender || 'male';
    const weight = profile.weight_kg || 75;
    const height = profile.height_cm || 175;
    const sport = profile.sport || 'General Athletics';
    const level = profile.goal || 'competitive';
    const bestResult = (profile as any).best_result || sport;
    const frequency = (profile as any).training_frequency || 5;

    const prompt = `You are a sports nutritionist for LIFECODE, a precision athlete nutrition system.
Calculate exact daily micronutrient targets for this athlete and map them against the two LIFECODE supplements.

ATHLETE PROFILE:
- Age: ${age}
- Sex: ${sex}
- Weight: ${weight} kg
- Height: ${height} cm
- Sport: ${sport}
- Training: ${frequency} sessions/week
- Level: ${level}
- Achievement: ${bestResult}

MORNING PAK provides per day:
Vitamin A 800μg, Vitamin C 200mg, Vitamin D3 25μg, Vitamin E 12mg,
Vitamin K2 50μg, Vitamin B12 100μg, B Complex 100% RDA, Zinc 10mg,
Copper 0.5mg, Magnesium Citrate 350mg, Selenium 50μg

RECOVERY PAK provides per serving:
Maltodextrin 20000mg, EAA Complex 7000mg, Creatine Monohydrate 5000mg,
L-Glutamine 3000mg, HMB 1500mg, Tart Cherry Extract 500mg,
Himalayan Pink Salt 300mg, Magnesium Bisglycinate 150mg,
L-Theanine 100mg, AstraGin 50mg

ESSENTIALS is a CATEGORY of nutrients NOT in any supplement — they must come from food.
The Essentials category contains: Iron, Calcium, Omega-3, Potassium, Iodine, CoQ10, Choline, Vitamin B6, Folate.
For these nutrients, set morningPak=0, recoveryPak=0, essentialsPak=0 (we do NOT sell an essentials supplement).

TASK:
For each nutrient below, calculate the exact daily target for THIS athlete (adjust for weight, sport, training load, level). Calculate how much each supplement provides and what percentage of the daily target is covered when both Morning + Recovery paks are taken.

NUTRIENTS TO CALCULATE:
Vitamin A, Vitamin C, Vitamin D3, Vitamin E, Vitamin K2, Vitamin B12, B Complex, Zinc, Copper, Magnesium (total across paks), Selenium, Creatine, EAA, L-Glutamine, Iron, Calcium, Omega-3, Potassium, Iodine, Sodium, CoQ10, Choline, Vitamin B6, Folate

Respond ONLY with a JSON array. No markdown, no explanation.
Exact format:
[
  {
    "id": "vitamin_d3",
    "name": "Vitamin D3",
    "unit": "μg",
    "dailyTarget": 62.5,
    "morningPak": 25,
    "essentialsPak": 0,
    "recoveryPak": 0,
    "total": 25,
    "percent": 40,
    "status": "partial",
    "gap": 37.5,
    "foodTip": "Salmon, egg yolks",
    "inMorning": true,
    "inEssentials": false,
    "inRecovery": false
  }
]

IMPORTANT id rules: use snake_case ids matching the table above (vitamin_a, vitamin_c, vitamin_d3, vitamin_e, vitamin_k2, vitamin_b12, b_complex, zinc, copper, magnesium, selenium, creatine, eaa, glutamine, iron, calcium, omega_3, potassium, iodine, sodium, coq10, choline, vitamin_b6, folate).

Status rules: "covered" if percent >= 85, "partial" if 30-84, "gap" if below 30.
Set inMorning=true if morningPak>0, inRecovery=true if recoveryPak>0.
Set inEssentials=true ONLY for these category ids: iron, calcium, omega_3, potassium, iodine, coq10, choline, vitamin_b6, folate. essentialsPak must always be 0.`;

    const key = (process.env.GEMINI_API_KEY || '').trim();
    if (!key) return NextResponse.json({ error: 'gemini not configured' }, { status: 500 });

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return NextResponse.json({ error: 'invalid response' }, { status: 500 });

    let nutrients: any[];
    try { nutrients = JSON.parse(match[0]); } catch {
      return NextResponse.json({ error: 'invalid JSON' }, { status: 500 });
    }

    // Persist to profile.protocol_analysis (column added by schema-v6 if present;
    // gracefully ignore if missing)
    try {
      await admin.from('profiles').update({
        protocol_analysis: nutrients,
        protocol_updated_at: new Date().toISOString(),
      }).eq('id', userId);
    } catch {
      // ignore — column may not exist yet
    }

    return NextResponse.json({ nutrients, profile: { age, sex, weight, height, sport, level, frequency, bestResult } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    const admin = getAdmin();
    if (!admin) return NextResponse.json({ error: 'server not configured' }, { status: 500 });
    const { data: profile } = await admin.from('profiles').select('protocol_analysis').eq('id', userId).maybeSingle();
    return NextResponse.json({ nutrients: (profile as any)?.protocol_analysis || null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'server error' }, { status: 500 });
  }
}
