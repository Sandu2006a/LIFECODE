import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

function getGenAI() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
}

// Robust JSON extractor — handles spaces, newlines, any formatting
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

    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });

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

4. *** MANDATORY FOOD TRACKING ***
   Trigger: whenever user says they ate, drank, or consumed ANYTHING (a lemon, a meal, a snack, water with lemon, anything).
   Write your normal response FIRST (2-3 sentences). Then append EXACTLY these two lines — no extra text, no explanation:
   LOG_FOOD:{"meal":"[exact food name]","calories":[N],"protein":[N],"carbs":[N],"fats":[N]}
   LOG_MICROS:{"Vit A":[N],"Vit C":[N],"Vit D3":[N],"Vit E":[N],"Vit K2":[N],"Vit B12":[N],"B-Complex":[N],"Magnesium":[N],"Zinc":[N],"Copper":[N],"Selenium":[N],"Iodine":[N],"Chromium":[N],"Electrolytes":[N],"Creatine":0,"EAA Complex":0,"L-Glutamine":0,"HMB":0,"L-Theanine":0,"Taurine":[N],"Rhodiola":0,"Tart Cherry":0}
   All [N] = numeric values only (no units inside JSON). Use 0 for nutrients absent in that food.
   Units: Vit A mcg | Vit C mg | Vit D3 mcg | Vit E mg | Vit K2 mcg | Vit B12 mcg | B-Complex % | Magnesium mg | Zinc mg | Copper mg | Selenium mcg | Iodine mcg | Chromium mcg | Electrolytes mg | Taurine mg
   EXAMPLE — user says "I ate a lemon":
   Response text here.
   LOG_FOOD:{"meal":"lemon","calories":17,"protein":1,"carbs":5,"fats":0}
   LOG_MICROS:{"Vit A":2,"Vit C":53,"Vit D3":0,"Vit E":0,"Vit K2":0,"Vit B12":0,"B-Complex":2,"Magnesium":7,"Zinc":0,"Copper":0,"Selenium":0,"Iodine":0,"Chromium":0,"Electrolytes":116,"Creatine":0,"EAA Complex":0,"L-Glutamine":0,"HMB":0,"L-Theanine":0,"Taurine":0,"Rhodiola":0,"Tart Cherry":0}

5. When user shares a personal insight, feeling, preference, or experience → extract it and on NEW LINE: SAVE_MEMORY:{"memory":"exact insight","category":"nutrition|performance|recovery|preference"}
6. NEVER mention saving, logging, database, or memory system — just use the information naturally
7. Be direct, data-driven, coach-like
8. More food reference values: 2 eggs ≈ Vit D3:2, Zinc:2.5, B-Complex:12, Vit B12:1.2 | avocado ≈ Magnesium:29, Vit K2:14, Vit C:10 | chicken breast 150g ≈ Vit B12:0.3, Zinc:1, Selenium:27, Taurine:200 | spinach 100g ≈ Vit K2:145, Vit C:28, Magnesium:78, Vit A:469 | salmon 150g ≈ Vit D3:11, Vit B12:3.2, Selenium:40, Electrolytes:80 | banana ≈ Vit B12:0, Magnesium:27, Vit C:9, B-Complex:15 | orange ≈ Vit C:70, Vit A:14, Magnesium:10, B-Complex:6`;

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
    const foodData = extractJSONBlock(text, 'LOG_FOOD:') as { meal?: string; calories?: number; protein?: number; carbs?: number; fats?: number } | null;
    if (foodData && user_id) {
      try {
        await supabase.from('food_logs').insert({
          user_id, meal: foodData.meal || 'Unknown',
          calories: foodData.calories || 0, protein: foodData.protein || 0,
          carbs: foodData.carbs || 0, fats: foodData.fats || 0,
          logged_at: new Date().toISOString(),
        });
      } catch { /* silent */ }
    }
    text = stripMarker(text, 'LOG_FOOD:');

    // ── Extract micronutrient update if detected ───────────────────
    let microsUpdate: Record<string, number> | null = null;
    const microsData = extractJSONBlock(text, 'LOG_MICROS:') as Record<string, number> | null;
    if (microsData) microsUpdate = microsData;
    text = stripMarker(text, 'LOG_MICROS:');

    // ── Save memory if detected ────────────────────────────────────
    const memData = extractJSONBlock(text, 'SAVE_MEMORY:') as { memory?: string; category?: string } | null;
    if (memData && user_id) {
      try {
        await supabase.from('user_memories').insert({
          user_id, memory: memData.memory, category: memData.category || 'general',
        });
      } catch { /* silent */ }
    }
    text = stripMarker(text, 'SAVE_MEMORY:');

    if (silent) return NextResponse.json({ ok: true });

    return NextResponse.json({ text, microsUpdate });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ text: 'Connection error — retrying protocol.' }, { status: 500 });
  }
}
