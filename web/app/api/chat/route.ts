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

    type Micro = { label: string; current: number; target: number; unit: string; pct?: number; category?: string };
    const microList: Micro[] = Array.isArray(micros) ? micros : [];

    // Sort low → high so the AI sees the WORST deficits first; show pct + category
    // so it can speak in the same terms as the rings (Morning / Essentials / Recovery).
    const sortedMicros = [...microList].sort((a, b) => (a.pct ?? 100) - (b.pct ?? 100));
    const microsContext = sortedMicros.length > 0
      ? sortedMicros.map(m => {
          const pct = typeof m.pct === 'number' ? m.pct : (m.target > 0 ? Math.round((m.current / m.target) * 100) : 0);
          const cat = m.category ? ` [${m.category}]` : '';
          return `  ${m.label}${cat}: ${m.current}/${m.target}${m.unit} — ${pct}%`;
        }).join('\n')
      : '  No micro data.';

    const lowMicros = sortedMicros.filter(m => (typeof m.pct === 'number' ? m.pct : 0) < 60).slice(0, 6);
    const lowSummary = lowMicros.length > 0
      ? lowMicros.map(m => `${m.label} ${m.pct ?? 0}%`).join(', ')
      : 'no notable deficits';

    const systemContext = `You are LIFECODE AI — an elite sports scientist and nutritionist with long-term memory. Reply in the language the athlete writes to you (Romanian or English).

ATHLETE: ${profile?.name}, ${profile?.gender}, ${profile?.age}y, ${profile?.height}cm, ${profile?.weight}kg
SPORT: ${profile?.sport || 'General'} — Best: ${profile?.result || 'n/a'}

═══ LONG-TERM MEMORY ═══
${memorySummary}

═══ TODAY'S MEAL LOG ═══
${foodSummary}

═══ TODAY'S WORKOUT SCHEDULE ═══
${workoutSummary}

═══ TODAY'S PROGRESS RINGS (current/target — % filled) ═══
${microsContext}

CURRENT LOW NUTRIENTS (<60%): ${lowSummary}

═══ DEFICIT → SYMPTOM MAP (use when the athlete describes how they feel) ═══
- Vitamin D3 low → low mood, slow recovery, frequent colds, weak bones
- Vitamin B12 / B-Complex low → fatigue, brain fog, poor concentration, low energy in training
- Iron / Vitamin C low → tiredness, breathlessness, pale skin, slow endurance recovery
- Magnesium low → muscle cramps, twitches, restless sleep, anxiety, headaches
- Zinc low → slow wound healing, weak immunity, hormonal dips
- Omega-3 low → joint stiffness, persistent inflammation, mood swings
- Potassium / Sodium low → cramps, dizziness on standing, weak pumps in training
- Calcium / Vitamin K2 low → weaker bones, slower recovery from impact training
- EAA / Creatine / HMB low (no Recovery Pack) → poor muscle recovery, soreness lingers, less strength next session
- Maltodextrin / Tart Cherry low (no Recovery Pack) → glycogen not replenished, more next-day soreness

═══ RULES ═══
1. Keep responses 2-4 sentences unless detail requested.
2. When the athlete says they feel tired / sore / weak / foggy / can't sleep / cramping / "ma simt rau" / "obosit" / etc. → ALWAYS open by naming the 1-3 LOWEST progress rings above and connect them to the symptom. Quote the exact % (e.g. "B12 is only at 18% today — that's why the fog").
3. When the athlete asks "how am I doing" / "ce-mi lipseste" → list the 3 lowest rings with % and one concrete food OR pack action to close each gap.
4. Reference the rings by their category names: Morning ring, Essentials ring, Recovery ring. Tell them which pack (code·charge AM = Morning Pack, code·build PM = Recovery Pack) would close gaps fastest.
5. Always apply long-term memory in advice.
6. When the user mentions eating/drinking, append on a new line:
   LOG_FOOD:{"meal":"<name>","quantity_g":<grams>}
   Use realistic gram estimates (orange ~150g, apple ~180g, eggs ~50g each, chicken ~150g).
7. When the user shares a personal insight, preference, allergy, or training fact, append:
   SAVE_MEMORY:{"memory":"<fact in 3rd person>","category":"nutrition|training|recovery|preference|schedule|health"}
8. Never mention the LOG_FOOD or SAVE_MEMORY tags in human-readable text.`;

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
