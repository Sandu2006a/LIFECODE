import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

function getGenAI() { return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!); }

export async function POST(req: NextRequest) {
  try {
    const { user_id, age, height, weight, gender, level } = await req.json();
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a world-class sports nutritionist and micronutrient specialist with 20+ years of experience working exclusively with Olympic, professional, and elite athletes.

TASK: Calculate TOTAL daily micronutrient targets for this specific athlete. Targets represent the OPTIMAL intake from ALL sources combined (LIFECODE supplements + food). These are the numbers the athlete should hit each day for peak performance and health.

ATHLETE PROFILE:
- Gender: ${gender || 'male'}
- Age: ${age || 25} years old
- Height: ${height || 175} cm
- Weight: ${weight || 75} kg
- Athletic Level: ${level || 'competitive'} (amateur = trains 3x/week for health; competitive = club/regional competitions; elite = national/professional level)

WHAT LIFECODE SUPPLEMENTS PROVIDE PER DAY (when both packs are taken):
Morning Pack: Vitamin A 800μg | Vitamin C 200mg | Vitamin D3 25μg | Vitamin E 12mg | Vitamin K2 50μg | Vitamin B12 100μg | B Complex 100% RDA | Zinc 10mg | Copper 0.5mg | Magnesium Citrate 350mg | Selenium 50μg
Recovery Pack: Maltodextrin 20g | EAA 7g | Creatine 5g | L-Glutamine 3g | HMB 1.5g | Tart Cherry Extract 500mg | Himalayan Salt (116mg sodium) | Magnesium Bisglycinate 150mg | L-Theanine 100mg | AstraGin 50mg

CALCULATION PROTOCOL — for each nutrient:

VITAMIN A:
- Male RDA 900μg, Female RDA 700μg. Athletes: +15-25% for immune function and antioxidant needs.
- Amateur: 900M/700F. Competitive: 1000M/850F. Elite: 1100M/950F.

VITAMIN C:
- Standard RDA: 90mg (male), 75mg (female). Athletes need far more — 500-1000mg for oxidative stress.
- Amateur: 400mg. Competitive: 600mg. Elite endurance: 800-1000mg.

VITAMIN D3:
- Standard RDA 15μg is woefully inadequate for athletes. Target blood level >75 nmol/L requires 50-125μg/day.
- Supplement gives only 25μg. Food rarely contributes meaningfully.
- Amateur: 50μg. Competitive: 75μg. Elite: 100μg.

VITAMIN E:
- RDA 15mg. Athletes: 20-30mg for oxidative stress from training.
- Amateur: 18mg. Competitive: 22mg. Elite: 28mg.

VITAMIN K2:
- RDA 90-120μg. Athletes: 150-200μg for bone health (stress fractures) and cardiovascular.
- Amateur: 100μg. Competitive: 150μg. Elite: 200μg.

VITAMIN B12:
- Supplement provides 100μg (far above RDA of 2.4μg). This covers all needs. Target = 100μg.

B COMPLEX (% RDA):
- 100% is the floor. Endurance athletes deplete B vitamins rapidly (energy metabolism).
- Amateur: 100%. Competitive: 150%. Elite endurance: 200%.

ZINC:
- Male RDA 11mg, Female 8mg. Athletes lose zinc in sweat, need 50-100% more.
- Amateur: 12M/9F. Competitive: 16M/12F. Elite: 22M/16F.

COPPER:
- RDA 0.9mg. Athletes: 1.5-2mg (ratio with zinc matters).
- Amateur: 1.2mg. Competitive: 1.8mg. Elite: 2.2mg.

MAGNESIUM (total — citrate + bisglycinate from both packs = 500mg):
- Athletes deplete magnesium rapidly. Need 400-700mg total from all sources.
- Amateur: 500mg. Competitive: 650mg. Elite: 750mg.
- magnesium_citrate target = 70% of total. magnesium_bisgly target = 30% of total.

SELENIUM:
- RDA 55μg. Athletes: 100-200μg for thyroid and immune function.
- Amateur: 80μg. Competitive: 120μg. Elite: 180μg.

MALTODEXTRIN (carb source from Recovery Pack):
- Post-workout carb replenishment. 20g from supplement.
- Amateur: 20g (supplement covers it). Competitive: 30g. Elite: 40g.

EAA COMPLEX:
- Athletes need 2-3g per session minimum. Total daily depends on training.
- Amateur: 10g. Competitive: 16g. Elite: 24g.

CREATINE:
- 3-5g/day maintenance is the scientific consensus. No benefit beyond 5g.
- All levels: 5g target.

L-GLUTAMINE:
- 3g from supplement. Athletes benefit from more during heavy training.
- Amateur: 3g. Competitive: 6g. Elite: 10g.

HMB:
- 3g/day is the optimal dose from research. Supplement provides 1.5g.
- Target: 3g for all levels.

TART CHERRY:
- 500mg is the evidence-based dose. No need to exceed supplement.
- Target: 500mg for all levels.

SODIUM (from Himalayan Salt):
- 500-2000mg daily depending on sweat rate.
- Amateur: 500mg. Competitive: 800mg. Elite: 1200mg.

MAGNESIUM BISGLYCINATE:
- See magnesium calculation above (30% of total target).

L-THEANINE:
- 200mg is the optimal dose for focus + calm. Supplement gives 100mg.
- Target: 200mg (food cannot contribute — needs supplement).

ASTRAGIN:
- 50mg is the standard dose for absorption enhancement. No benefit beyond this.
- Target: 50mg for all levels.

Now calculate the specific values for the athlete described above and return ONLY this JSON (no text before or after, no markdown code blocks, no explanation):
{"vitamin_a":900,"vitamin_c":600,"vitamin_d3":50,"vitamin_e":20,"vitamin_k2":120,"vitamin_b12":100,"b_complex":100,"zinc":15,"copper":1.5,"magnesium_citrate":420,"selenium":100,"maltodextrin":25,"eaa":14,"creatine":5,"glutamine":5,"hmb":3,"tart_cherry":500,"sodium":500,"magnesium_bisgly":180,"l_theanine":200,"astragin":50}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const match = raw.match(/\{[\s\S]*?\}/);
    if (!match) throw new Error('No JSON in AI response');

    const targets: Record<string, number> = JSON.parse(match[0]);

    await supabase.from('profiles').update({
      micro_targets: targets,
      updated_at: new Date().toISOString(),
    }).eq('id', user_id);

    return NextResponse.json({ targets });
  } catch (err: any) {
    console.error('analyze-nutrients error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
