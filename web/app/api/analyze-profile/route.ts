import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getGenAI() { return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!); }
function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { name, age, height, weight, sport, result, gender, user_id } = await req.json();

    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a world-class sports nutritionist and exercise physiologist with 20 years of experience working with Olympic and professional athletes.

Analyze this athlete completely and calculate their precise daily nutrition targets.

ATHLETE PROFILE:
- Name: ${name}
- Gender: ${gender}
- Age: ${age} years old
- Height: ${height} cm
- Weight: ${weight} kg
- Sport: ${sport}
- Best Result / Achievement: ${result}

YOUR ANALYSIS PROCESS:

1. CALCULATE BMR using Mifflin-St Jeor:
   - If male:   BMR = (10 × ${weight}) + (6.25 × ${height}) - (5 × ${age}) + 5
   - If female: BMR = (10 × ${weight}) + (6.25 × ${height}) - (5 × ${age}) - 161
   Show your calculation.

2. CLASSIFY SPORT TYPE:
   - Endurance: triathlon, running, cycling, swimming, rowing, marathon, duathlon
   - Strength/Power: weightlifting, powerlifting, bodybuilding, CrossFit, sprinting
   - Team/Mixed: football, basketball, tennis, volleyball, handball, rugby, MMA, boxing
   - Technical: gymnastics, golf, archery, equestrian

3. DETERMINE ATHLETE LEVEL from their best result:
   - ELITE: results in top 5-10% of the sport globally or nationally (e.g., sub-2h45 marathon, sub-8h30 Ironman, national medals, professional contracts)
   - COMPETITIVE: above average, club/regional level, dedicated competitor (e.g., sub-3h30 marathon, sub-10h Ironman, amateur competitions)
   - RECREATIONAL: casual participation, beginner, no competitive results

4. APPLY TDEE MULTIPLIER:
   - Elite endurance: BMR × 2.0–2.1 (training 15–25h/week, often 2x/day)
   - Elite strength/power: BMR × 1.85–1.95
   - Elite mixed/team: BMR × 1.9–2.0
   - Competitive endurance: BMR × 1.75–1.85
   - Competitive strength: BMR × 1.65–1.75
   - Competitive mixed: BMR × 1.70–1.80
   - Recreational any: BMR × 1.45–1.60

5. SET PROTEIN TARGET (prioritize muscle repair and performance):
   - Elite endurance: 1.8–2.0g per kg body weight
   - Elite strength: 2.2–2.5g per kg
   - Elite mixed: 2.0–2.2g per kg
   - Competitive any: 1.7–2.0g per kg
   - Recreational: 1.4–1.6g per kg

6. SET CARBOHYDRATE TARGET (primary fuel, especially critical for endurance):
   - Elite endurance: 7–10g per kg (very high demand)
   - Elite strength: 4–6g per kg
   - Elite mixed: 5–7g per kg
   - Competitive endurance: 5–7g per kg
   - Competitive strength: 3–5g per kg
   - Recreational: 3–4g per kg

7. SET FAT TARGET:
   - Calculate remaining calories: total_kcal - (protein_g × 4) - (carbs_g × 4)
   - Divide by 9 to get grams
   - Minimum floor: 0.8g per kg body weight (hormonal health)
   - Healthy range: 20–30% of total calories

8. VERIFY MATH:
   - Total kcal = protein_g × 4 + carbs_g × 4 + fats_g × 9
   - Must equal your TDEE estimate ± 50 kcal
   - Adjust if needed

Return ONLY this JSON (no text before or after, no markdown):
{"calories_target":0,"protein_target":0,"carbs_target":0,"fats_target":0}`;

    const aiResult = await model.generateContent(prompt);
    const raw  = aiResult.response.text().trim();
    const jsonMatch = raw.match(/\{[\s\S]*?"calories_target"[\s\S]*?\}/);
    if (!jsonMatch) throw new Error('No JSON found in AI response');

    const targets = JSON.parse(jsonMatch[0]);

    targets.calories_target = Math.round(targets.calories_target);
    targets.protein_target  = Math.round(targets.protein_target);
    targets.carbs_target    = Math.round(targets.carbs_target);
    targets.fats_target     = Math.round(targets.fats_target);

    await getAdmin().from('profiles').upsert({
      id:              user_id,
      calories_target: targets.calories_target,
      protein_target:  targets.protein_target,
      carbs_target:    targets.carbs_target,
      fats_target:     targets.fats_target,
      updated_at:      new Date().toISOString(),
    }, { onConflict: 'id' });

    return NextResponse.json({ targets });
  } catch (err) {
    console.error('analyze-profile error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user_id = req.nextUrl.searchParams.get('user_id');
  const { data } = await getAdmin()
    .from('profiles')
    .select('*')
    .eq('id', user_id)
    .single();
  return NextResponse.json({ data });
}
