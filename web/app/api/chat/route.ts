import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });

    const microsContext = micros
      ? micros.map((m: { label: string; current: number; target: number; unit: string }) =>
          `  ${m.label}: ${m.current}/${m.target}${m.unit}`).join('\n')
      : '  No micro data.';

    const systemContext = `You are LIFECODE AI — an elite sports scientist and nutritionist with long-term memory.

ATHLETE: ${profile?.name}, ${profile?.gender}, ${profile?.age}y, ${profile?.height}cm, ${profile?.weight}kg
SPORT: ${profile?.sport || 'General'} — Best: ${profile?.result || 'n/a'}

═══ LONG-TERM MEMORY ═══
${memorySummary}

═══ TODAY'S MEAL LOG ═══
${foodSummary}

═══ TODAY'S WORKOUT SCHEDULE ═══
${workoutSummary}

═══ MICRONUTRIENT TRACKING ═══
${microsContext}

═══ RULES ═══
1. Keep responses 2-4 sentences unless detail requested.
2. Always apply long-term memory in advice.
3. When the user mentions eating/drinking, append on a new line:
   LOG_FOOD:{"meal":"<name>","quantity_g":<grams>}
   Use realistic gram estimates (orange ~150g, apple ~180g, eggs ~50g each, chicken ~150g).
4. When the user shares a personal insight, preference, allergy, or training fact, append:
   SAVE_MEMORY:{"memory":"<fact in 3rd person>","category":"nutrition|training|recovery|preference|schedule|health"}
5. Never mention the LOG_FOOD or SAVE_MEMORY tags in human-readable text.`;

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
