import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function getGenAI() {
  return new GoogleGenerativeAI((process.env.GEMINI_API_KEY || '').trim());
}

function getDb(req: NextRequest) {
  const svcKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (svcKey) {
    return createClient(SUPA_URL, svcKey, { auth: { persistSession: false } });
  }
  const auth = req.headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) {
    return createClient(SUPA_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
      global: { headers: { Authorization: auth } },
    });
  }
  return null;
}

function extractJSONBlock(text: string, marker: string): Record<string, unknown> | null {
  const idx = text.indexOf(marker);
  if (idx === -1) return null;
  const start = text.indexOf('{', idx + marker.length);
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(text.slice(start, i + 1)); }
        catch { return null; }
      }
    }
  }
  return null;
}

function stripMarker(text: string, marker: string): string {
  const idx = text.indexOf(marker);
  if (idx === -1) return text;
  const start = text.indexOf('{', idx + marker.length);
  if (start === -1) return text;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) {
        const removeFrom = (idx > 0 && text[idx - 1] === '\n') ? idx - 1 : idx;
        return (text.slice(0, removeFrom) + text.slice(i + 1)).trim();
      }
    }
  }
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, profile, micros, user_id, silent } = await req.json();
    const db = getDb(req);
    const today = new Date().toISOString().split('T')[0];

    let foodSummary = '  No meals logged yet.';
    let memorySummary = '  No memories stored yet.';
    let workoutSummary = '  No workouts scheduled today.';

    if (db && user_id) {
      const [{ data: meals }, { data: memories }, { data: workouts }] = await Promise.all([
        db.from('meal_logs').select('meal_name, quantity_g, nutrients, logged_at')
          .eq('user_id', user_id)
          .gte('logged_at', `${today}T00:00:00.000Z`)
          .lte('logged_at', `${today}T23:59:59.999Z`)
          .order('logged_at', { ascending: true }),
        db.from('user_memories').select('memory, category, created_at')
          .eq('user_id', user_id).order('created_at', { ascending: false }).limit(20),
        db.from('workout_events').select('event_time, workout_type, duration_min')
          .eq('user_id', user_id).eq('event_date', today)
          .order('event_time', { ascending: true }),
      ]);

      const mealsList = meals || [];
      foodSummary = mealsList.length > 0
        ? mealsList.map((m: any) => `  • ${m.meal_name} — ${m.quantity_g}g`).join('\n')
        : '  No meals logged yet.';

      memorySummary = memories && memories.length > 0
        ? memories.map((m: any) => `  [${m.category}] ${m.memory}`).join('\n')
        : '  No memories stored yet.';

      workoutSummary = workouts && workouts.length > 0
        ? workouts.map((w: any) => `  ${w.event_time} — ${w.workout_type} (${w.duration_min} min)`).join('\n')
        : '  No workouts scheduled today.';
    }

    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-pro' });

    type Micro = { label: string; current: number; target: number; unit: string; pct?: number; category?: string; foodTip?: string };
    const microList: Micro[] = Array.isArray(micros) ? micros : [];

    // Sort low → high so the AI sees the WORST deficits first; show pct + category
    // so it can speak in the same terms as the rings (Morning / Essentials / Recovery).
    const sortedMicros = [...microList].sort((a, b) => (a.pct ?? 100) - (b.pct ?? 100));
    const microsContext = sortedMicros.length > 0
      ? sortedMicros.map(m => {
          const pct = typeof m.pct === 'number' ? m.pct : (m.target > 0 ? Math.round((m.current / m.target) * 100) : 0);
          const cat = m.category ? ` [${m.category}]` : '';
          const food = m.foodTip ? ` → eat: ${m.foodTip}` : '';
          return `  ${m.label}${cat}: ${m.current}/${m.target}${m.unit} — ${pct}%${food}`;
        }).join('\n')
      : '  No micro data.';

    const lowMicros = sortedMicros.filter(m => (typeof m.pct === 'number' ? m.pct : 0) < 60).slice(0, 8);
    const lowSummary = lowMicros.length > 0
      ? lowMicros.map(m => `${m.label} ${m.pct ?? 0}%${m.foodTip ? ` (eat: ${m.foodTip})` : ''}`).join('; ')
      : 'no notable deficits';

    // Bucket by category so the AI can answer "which ring needs work?" precisely.
    const byCat = (cat: string) => sortedMicros.filter(m => m.category === cat);
    const catSummary = (cat: string) => {
      const arr = byCat(cat);
      if (arr.length === 0) return '  (no data)';
      const avg = Math.round(arr.reduce((a, b) => a + (b.pct ?? 0), 0) / arr.length);
      const worst = arr.slice(0, 3).map(m => `${m.label} ${m.pct ?? 0}%`).join(', ');
      return `  avg ${avg}% — lowest: ${worst}`;
    };

    const systemContext = `You are LIFECODE AI — an elite sports scientist and nutritionist with long-term memory. Reply in the language the athlete writes to you (Romanian or English).

ATHLETE: ${profile?.name}, ${profile?.gender}, ${profile?.age}y, ${profile?.height}cm, ${profile?.weight}kg
SPORT: ${profile?.sport || 'General'} — Best: ${profile?.result || 'n/a'}

═══ LONG-TERM MEMORY ═══
${memorySummary}

═══ TODAY'S MEAL LOG ═══
${foodSummary}

═══ TODAY'S WORKOUT SCHEDULE ═══
${workoutSummary}

═══ TODAY'S PROGRESS RINGS — every nutrient with current/target/% and the foods that fix it ═══
${microsContext}

═══ RING SUMMARIES (use to pick which ring needs the most work) ═══
Morning ring:    ${catSummary('morning')}
Essentials ring: ${catSummary('essentials')}
Recovery ring:   ${catSummary('recovery')}

TOP DEFICITS RIGHT NOW (<60%, with foods that close each gap): ${lowSummary}

═══ DEFICIT → SYMPTOM MAP (use when the athlete describes how they feel) ═══
- Vitamin D3 low → low mood, slow recovery, frequent colds, weak bones
- Vitamin B12 / B-Complex low → fatigue, brain fog, poor concentration, low energy in training
- Vitamin C low → tiredness, slow endurance recovery, frequent colds
- Magnesium low → muscle cramps, twitches, restless sleep, anxiety, headaches
- Zinc low → slow wound healing, weak immunity, hormonal dips, low libido
- Selenium low → low thyroid output, slow metabolism, fatigue
- Copper low → low energy, slow iron absorption, brittle hair
- Omega-3 low → joint stiffness, persistent inflammation, mood swings
- Potassium / Sodium low → cramps, dizziness on standing, weak pumps in training
- Calcium / Vitamin K2 low → weaker bones, slower recovery from impact training
- Iodine low → fatigue, cold sensitivity, mental sluggishness
- EAA / Creatine / HMB low (no Recovery Pack) → poor muscle recovery, soreness lingers, less strength next session
- Maltodextrin / Tart Cherry low (no Recovery Pack) → glycogen not replenished, more next-day soreness
- L-Glutamine low → gut discomfort, weaker immunity after long sessions
- L-Theanine / Magnesium PM low → poor sleep quality, harder to wind down at night

═══ ANSWER RULES — apply STRICTLY ═══

A) "Ce am în deficit?" / "What are my deficits?" / "Where am I short?" — DO THIS:
   1. Scan EVERY nutrient in TODAY'S PROGRESS RINGS above.
   2. List the 3-5 lowest by % (under 60% always; if all rings are full, list the 3 lowest anyway).
   3. For EACH deficit say: name, exact %, and a SPECIFIC FOOD with a portion to close it (use the "→ eat:" hint after each ring line, plus your own knowledge for portions in grams).
   4. End with which Pack closes the most gaps at once (code·charge AM for the Morning ring, code·build PM for the Recovery ring) IF the athlete hasn't taken it yet.

B) "Cum să influențez / cum să le ridic?" / "How do I fix this?" / "What should I eat?" — DO THIS:
   1. Take the 2-3 lowest deficits.
   2. Suggest a CONCRETE meal that hits multiple at once. Format: "Eat [meal with portions in g] → covers [Nutrient X +Y%, Nutrient Z +W%]".
   3. Estimate the % bump realistically from typical food composition.
   4. Always quote the food name in Romanian if the athlete writes in Romanian (somon, ouă, spanac, brânză, etc.).

C) "Mă simt rău / obosit / am crampe / nu dorm bine" — DO THIS:
   1. Match the symptom to the DEFICIT → SYMPTOM MAP above.
   2. Open with: "<Nutrient> is at <X>% — that's likely why."
   3. Then give the specific food + portion to fix it.

D) General questions about feeling / training / progress:
   1. Always check the TOP DEFICITS first and weave them into the answer if relevant.
   2. Quote percentages and ring names explicitly.

═══ FORMAT ═══
- 3-5 short sentences; bullet lists allowed when listing multiple deficits.
- Always be SPECIFIC: nutrient name, exact %, exact food, exact portion.
- Never give generic advice like "eat healthy" or "vary your diet".
- Match the user's language (Romanian ↔ Romanian, English ↔ English).

═══ SIDE-CHANNEL TAGS (never in human-readable text) ═══
- When the user mentions eating/drinking, append on a new line:
  LOG_FOOD:{"meal":"<name>","quantity_g":<grams>}
  Realistic grams: orange ~150g, apple ~180g, eggs ~50g each, chicken breast ~150g, salmon fillet ~150g.
- When the user shares a personal insight, allergy, preference, or training fact, append:
  SAVE_MEMORY:{"memory":"<fact in 3rd person>","category":"nutrition|training|recovery|preference|schedule|health"}
- Always apply long-term memory in advice.`;

    const history = messages.slice(0, -1).map((m: { role: string; text: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    const chat = model.startChat({
      history: [
        { role: 'user',  parts: [{ text: systemContext }] },
        { role: 'model', parts: [{ text: 'Ready.' }] },
        ...history,
      ],
    });

    const result = await chat.sendMessage(messages[messages.length - 1].text);
    let text = result.response.text();

    let logFood: { meal: string; quantity_g: number } | null = null;
    const foodData = extractJSONBlock(text, 'LOG_FOOD:') as { meal?: string; quantity_g?: number } | null;
    if (foodData && foodData.meal) {
      logFood = { meal: String(foodData.meal), quantity_g: Number(foodData.quantity_g) || 100 };
    }
    text = stripMarker(text, 'LOG_FOOD:');

    let saveMemory: { memory: string; category: string } | null = null;
    const memData = extractJSONBlock(text, 'SAVE_MEMORY:') as { memory?: string; category?: string } | null;
    if (memData && memData.memory) {
      saveMemory = { memory: String(memData.memory), category: String(memData.category || 'general') };
      if (db && user_id) {
        try { await db.from('user_memories').insert({ user_id, memory: saveMemory.memory, category: saveMemory.category }); } catch {}
      }
    }
    text = stripMarker(text, 'SAVE_MEMORY:');

    if (silent) return NextResponse.json({ ok: true });

    return NextResponse.json({ text, logFood, saveMemory });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ text: 'Connection error — retrying protocol.' }, { status: 500 });
  }
}
