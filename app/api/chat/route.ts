import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { messages, profile, macros, micros, user_id, silent } = await req.json();

    // ── Load today's food log ──────────────────────────────────────
    const today = new Date().toISOString().split('T')[0];
    const { data: foodLogs } = await supabase
      .from('food_logs').select('*').eq('user_id', user_id)
      .gte('logged_at', `${today}T00:00:00.000Z`)
      .lte('logged_at', `${today}T23:59:59.999Z`)
      .order('logged_at', { ascending: true });

    const logs = foodLogs || [];
    const totals = logs.reduce(
      (acc: { calories: number; protein: number; carbs: number; fats: number }, l: { calories: number; protein: number; carbs: number; fats: number }) => ({
        calories: acc.calories + (l.calories || 0), protein: acc.protein + (l.protein || 0),
        carbs: acc.carbs + (l.carbs || 0), fats: acc.fats + (l.fats || 0),
      }), { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const foodSummary = logs.length > 0
      ? logs.map((l: { meal: string; calories: number; protein: number; carbs: number; fats: number; logged_at: string }) => {
          const t = new Date(l.logged_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          return `  ${t} — ${l.meal} (${l.calories}kcal | P:${l.protein}g C:${l.carbs}g F:${l.fats}g)`;
        }).join('\n')
      : '  No meals logged yet.';

    // ── Load long-term memories ────────────────────────────────────
    const { data: memories } = await supabase
      .from('user_memories').select('memory, category, created_at')
      .eq('user_id', user_id).order('created_at', { ascending: false }).limit(20);

    const memorySummary = memories && memories.length > 0
      ? memories.map((m: { category: string; memory: string }) => `  [${m.category}] ${m.memory}`).join('\n')
      : '  No memories stored yet.';

    // ── Load today's workouts ──────────────────────────────────────
    const { data: workouts } = await supabase
      .from('workout_events').select('*').eq('user_id', user_id).eq('event_date', today)
      .order('event_time', { ascending: true });

    const workoutSummary = workouts && workouts.length > 0
      ? workouts.map((w: { event_time: string; workout_type: string; duration_min: number }) =>
          `  ${w.event_time} — ${w.workout_type} (${w.duration_min} min)`).join('\n')
      : '  No workouts scheduled today.';

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const microsContext = micros
      ? micros.map((m: { label: string; current: number; target: number; unit: string }) =>
          `  ${m.label}: ${m.current}/${m.target}${m.unit}`).join('\n')
      : '  No micro data.';

    const systemContext = `You are LIFECODE AI — an elite sports scientist and nutritionist with long-term memory. You remember everything the athlete tells you and use it in every response.

ATHLETE: ${profile?.name}, ${profile?.gender}, ${profile?.age}y, ${profile?.height}cm, ${profile?.weight}kg
SPORT: ${profile?.sport} — Best: ${profile?.result}

═══ LONG-TERM MEMORY (always apply these insights) ═══
${memorySummary}

═══ TODAY'S MEAL LOG ═══
${foodSummary}

TODAY'S TOTALS: ${totals.calories}kcal | P:${totals.protein}g C:${totals.carbs}g F:${totals.fats}g

═══ TODAY'S WORKOUT SCHEDULE ═══
${workoutSummary}

═══ MICRONUTRIENT TRACKING (today's progress) ═══
${microsContext}

═══ RESPONSE RULES ═══
1. Keep responses to 2-4 sentences unless detail is requested
2. Always apply long-term memory insights to your advice
3. Reference workout schedule when giving nutrition timing advice
4. When user logs food → brief acknowledgment mentioning key micronutrients added, then on NEW LINE:
   LOG_FOOD:{"meal":"name","calories":0,"protein":0,"carbs":0,"fats":0}
   And on ANOTHER NEW LINE: LOG_MICROS:{"Vitamin D3":0,"Vitamin K2":0,"Zinc":0,"Magnesium":0,"B-Complex":0,"Omega-3":0,"Vitamin C":0,"Iron":0}
   (fill in realistic micronutrient amounts in the same units as the tracking panel — IU for D3, mcg for K2, mg for others, % for B-Complex)
5. When user shares a personal insight, feeling, preference, or experience → extract it and on NEW LINE: SAVE_MEMORY:{"memory":"exact insight","category":"nutrition|performance|recovery|preference"}
6. When user says they took an energy gel → ALWAYS save: SAVE_MEMORY:{"memory":"Took energy gel before [workout type] at [time] — pre-workout fueling confirmed","category":"nutrition"}
7. NEVER mention saving, logging, database, or memory system — just use the information naturally
8. Be direct, data-driven, coach-like
9. When logging micros, calculate realistic values: e.g. 2 eggs ≈ Vitamin D3: 88 IU, Zinc: 2.5mg, B-Complex: 12%; avocado ≈ Magnesium: 29mg, Vitamin K2: 14mcg`;

    const history = messages.slice(0, -1).map((m: { role: string; text: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    const chat = model.startChat({
      history: [
        { role: 'user',  parts: [{ text: systemContext }] },
        { role: 'model', parts: [{ text: 'Protocol loaded. Long-term memory active. Ready.' }] },
        ...history,
      ],
    });

    const result = await chat.sendMessage(messages[messages.length - 1].text);
    let text = result.response.text();

    // ── Save food log if detected ──────────────────────────────────
    const logMatch = text.match(/LOG_FOOD:(\{[^}]+\})/);
    if (logMatch && user_id) {
      try {
        const food = JSON.parse(logMatch[1]);
        await supabase.from('food_logs').insert({
          user_id, meal: food.meal || 'Unknown',
          calories: food.calories || 0, protein: food.protein || 0,
          carbs: food.carbs || 0, fats: food.fats || 0,
          logged_at: new Date().toISOString(),
        });
      } catch { /* silent */ }
      text = text.replace(/\n?LOG_FOOD:\{[^}]+\}/g, '').trim();
    }

    // ── Extract micronutrient update if detected ───────────────────
    let microsUpdate: Record<string, number> | null = null;
    const microsMatch = text.match(/LOG_MICROS:(\{[^}]+\})/);
    if (microsMatch) {
      try {
        microsUpdate = JSON.parse(microsMatch[1]);
      } catch { /* silent */ }
      text = text.replace(/\n?LOG_MICROS:\{[^}]+\}/g, '').trim();
    }

    // ── Save memory if detected ────────────────────────────────────
    const memMatch = text.match(/SAVE_MEMORY:(\{[^}]+\})/);
    if (memMatch && user_id) {
      try {
        const mem = JSON.parse(memMatch[1]);
        await supabase.from('user_memories').insert({
          user_id, memory: mem.memory, category: mem.category || 'general',
        });
      } catch { /* silent */ }
      text = text.replace(/\n?SAVE_MEMORY:\{[^}]+\}/g, '').trim();
    }

    // Silent mode — don't return AI text to UI, just process side-effects
    if (silent) return NextResponse.json({ ok: true });

    return NextResponse.json({ text, microsUpdate });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ text: 'Connection error — retrying protocol.' }, { status: 500 });
  }
}
