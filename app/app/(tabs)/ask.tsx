import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Avatar from '../../src/components/Avatar';
import Icon from '../../src/components/Icon';
import { colors, fonts, gradients, radii, shadows } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';
import { fetchDailyTotals, summariseDeficits, DailyTotals } from '../../src/lib/dailyTotals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureSession, authHeaders } from '../../src/lib/session';
import { lifecodeFetch, logMeal } from '../../src/lib/api';

type Message = { id: number; role: 'ai' | 'user'; text: string };

// Direct Gemini call as a backup if the server endpoint is unreachable.
const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY || '';
const GEMINI_URL = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
const PREFERRED_MODEL = 'gemini-2.5-pro';
const FALLBACK_MODEL  = 'gemini-2.5-flash';

function Bubble({ msg }: { msg: Message }) {
  if (msg.role === 'ai') {
    return (
      <View style={b.aiBubble}>
        <Text style={b.aiText}>{msg.text}</Text>
      </View>
    );
  }
  return (
    <View style={b.meWrap}>
      <View style={b.meBubble}>
        <Text style={b.meText}>{msg.text}</Text>
      </View>
    </View>
  );
}

const b = StyleSheet.create({
  aiBubble: { backgroundColor: colors.surf, borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, padding: 14, maxWidth: '85%', marginBottom: 10, ...shadows.card },
  aiText: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink, lineHeight: 22 },
  meWrap: { alignItems: 'flex-end', marginBottom: 10 },
  meBubble: { backgroundColor: colors.ink, borderRadius: radii.card, padding: 14, maxWidth: '85%' },
  meText: { fontFamily: fonts.sans, fontSize: 15, color: '#FAFAFA', lineHeight: 22 },
});

const SUGGESTIONS = [
  'What are my top 3 micronutrient gaps right now?',
  'Suggest one meal that closes my biggest deficit.',
  'I just ate 3 eggs — add them.',
  'How will adding 100g salmon change my rings?',
];

// Display labels + units for Gemini's food-scan keys. Used to format the
// "✓ Logged ..." confirmation bubble so the user sees WHICH micronutrients
// landed in today's totals, not just a count.
const NUTRIENT_DISPLAY: Record<string, { label: string; unit: string }> = {
  vitamin_a:   { label: 'Vit A',   unit: 'μg' },
  vitamin_c:   { label: 'Vit C',   unit: 'mg' },
  vitamin_d3:  { label: 'Vit D3',  unit: 'μg' },
  vitamin_e:   { label: 'Vit E',   unit: 'mg' },
  vitamin_k2:  { label: 'Vit K2',  unit: 'μg' },
  vitamin_b12: { label: 'B12',     unit: 'μg' },
  zinc:        { label: 'Zinc',    unit: 'mg' },
  copper:      { label: 'Copper',  unit: 'mg' },
  magnesium:   { label: 'Mg',      unit: 'mg' },
  selenium:    { label: 'Selenium',unit: 'μg' },
  omega_3:     { label: 'Omega-3', unit: 'mg' },
  calcium:     { label: 'Calcium', unit: 'mg' },
  potassium:   { label: 'K',       unit: 'mg' },
  sodium:      { label: 'Na',      unit: 'mg' },
  iodine:      { label: 'Iodine',  unit: 'μg' },
  iron:        { label: 'Iron',    unit: 'mg' },
  eaa:         { label: 'EAA',     unit: 'mg' },
  glutamine:   { label: 'Glutamine', unit: 'mg' },
  creatine:    { label: 'Creatine',unit: 'mg' },
};

function fmtAmount(v: number): string {
  if (v === 0) return '0';
  if (v < 1)   return v.toFixed(2).replace(/\.?0+$/, '');
  if (v < 10)  return v.toFixed(1).replace(/\.0$/, '');
  return String(Math.round(v));
}

function formatLoggedSummary(meal: string, qty: number, nutrients: Record<string, number>): string {
  const entries = Object.entries(nutrients)
    .map(([k, v]) => ({ k, v: Number(v) || 0 }))
    .filter(e => e.v > 0 && NUTRIENT_DISPLAY[e.k])
    // Rank by "interestingness": higher relative weight to vitamins/minerals
    // that typically show up in micrograms (D3, B12, K2, Iodine, Selenium).
    .sort((a, b) => b.v - a.v);

  if (entries.length === 0) return `✓ Logged ${meal} (${qty}g).`;

  const top = entries.slice(0, 4).map(({ k, v }) => {
    const d = NUTRIENT_DISPLAY[k];
    return `+${d.label} ${fmtAmount(v)}${d.unit}`;
  });
  const extra = entries.length > 4 ? ` · +${entries.length - 4} more` : '';
  return `✓ Logged ${meal} (${qty}g)\n${top.join(' · ')}${extra}`;
}

export default function AskScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [val, setVal] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const [profile, setProfile] = useState<{ name: string; avatarLetter: string; sport: string; age: number; weight_kg: number; height_cm: number; gender: string; goal: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [totals, setTotals] = useState<DailyTotals | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);

      const { data: p } = await supabase
        .from('profiles')
        .select('display_name, full_name, sport, age, weight_kg, height_cm, gender, goal, avatar_letter')
        .eq('id', data.user.id)
        .maybeSingle();

      let cachedName = '';
      try { cachedName = (await AsyncStorage.getItem('lifecode.user_name')) || ''; } catch {}
      const metaName = data.user.user_metadata?.display_name
                    || data.user.user_metadata?.full_name
                    || '';
      const name =
        p?.display_name || p?.full_name ||
        metaName || cachedName ||
        data.user.email?.split('@')[0] || 'Athlete';
      const prof = {
        name,
        avatarLetter: (p?.avatar_letter || name.charAt(0) || 'A').toUpperCase(),
        sport: p?.sport || '',
        age: p?.age || 0,
        weight_kg: p?.weight_kg || 0,
        height_cm: p?.height_cm || 0,
        gender: p?.gender || '',
        goal: p?.goal || '',
      };
      setProfile(prof);

      // Prime today's nutrient snapshot
      try { setTotals(await fetchDailyTotals(data.user.id)); } catch {}

      setMessages([{
        id: 1,
        role: 'ai',
        text: `Hi ${name}. Ask me how you're tracking today — I can see your packs, meals, and where you're short.`,
      }]);
    });
  }, []);

  const buildSystemPrompt = (p: typeof profile, t: DailyTotals | null) => {
    const base = !p
      ? `You are the LIFECODE AI — a precision performance nutrition coach for serious athletes. Keep answers short, confident, and science-based.`
      : `You are the LIFECODE AI — the personal coach of ${p.name}, a ${p.age}yo ${p.gender} ${p.sport} athlete weighing ${p.weight_kg}kg at ${p.height_cm}cm. Their goal: ${p.goal}.`;

    const supplements = `
LIFECODE supplements:
- Morning Pack: Vit A, C, D3, E, K2, B12, Zinc, Copper, Magnesium, Selenium.
- Recovery Pack: EAA 7g, Creatine 5g, Glutamine 3g, Sodium.
- Essentials (food only): Iron, Calcium, Omega-3, Potassium, Iodine, CoQ10, Choline, Vit B6, Folate.`;

    const todayBlock = t
      ? `\nTODAY'S DATA (use this to answer questions like "how am I doing", "am I deficient in...", "what should I eat"):\n${summariseDeficits(t)}`
      : '';

    return `${base}${supplements}${todayBlock}

When the user asks how they feel, are deficient, or what to add: read TODAY'S DATA above and call out the specific low nutrients with their % numbers. Suggest concrete foods or a pack. Keep answers 2-4 sentences unless detail is requested. Always be specific with numbers when available.`;
  };

  const sendText = async (textArg?: string) => {
    const text = (textArg ?? val).trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setVal('');
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Refresh today's data so the AI sees the most recent meal/pack state
    let freshTotals = totals;
    if (userId) {
      try { freshTotals = await fetchDailyTotals(userId); setTotals(freshTotals); } catch {}
    }

    const history = [...messages.filter(m => m.id !== 1), userMsg]
      .map(m => ({ role: m.role === 'ai' ? 'model' : 'user', parts: [{ text: m.text }] }));

    // STRATEGY 1 (preferred): hit our own server at lifecodenutrition.com/api/chat
    // — the Gemini key lives server-side, no env wiring on device needed.
    // The server also returns `logFood` when the user mentions eating something —
    // we then call /api/meal to save it with full micronutrient analysis.
    type ChatResult =
      | { ok: true; text: string; logFood: { meal: string; quantity_g: number } | null }
      | { ok: false; error: string };
    async function callServerChat(): Promise<ChatResult> {
      try {
        const { accessToken, userId: uid } = await ensureSession();
        const res = await lifecodeFetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
          body: JSON.stringify({
            user_id: uid,
            profile: profile ? {
              name:   profile.name,
              gender: profile.gender,
              age:    profile.age,
              height: profile.height_cm,
              weight: profile.weight_kg,
              sport:  profile.sport,
              result: profile.sport,
            } : null,
            messages: [...messages.filter(m => m.id !== 1), userMsg]
              .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', text: m.text })),
            // Send ALL nutrients with category + pct + food sources so the AI
            // can speak about ring impact, prioritize the lowest %, and
            // recommend specific foods to close each gap.
            micros: freshTotals?.rows
              ?.filter(r => r.target > 0)
              ?.map(r => ({
                label:    r.name,
                category: r.category,                       // 'morning' | 'essentials' | 'recovery'
                current:  Math.round(r.consumed * 100) / 100,
                target:   Math.round(r.target   * 100) / 100,
                unit:     r.unit,
                pct:      r.pct,
                foodTip:  r.foodTip || '',
              })) || [],
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, error: data?.error || data?.text || `HTTP ${res.status}` };
        }
        if (typeof data.text === 'string' && data.text.trim().length > 0) {
          return {
            ok: true,
            text: data.text,
            logFood: data.logFood && data.logFood.meal ? data.logFood : null,
          };
        }
        return { ok: false, error: 'Empty server response' };
      } catch (e: any) {
        return { ok: false, error: e?.message || 'network error' };
      }
    }

    // STRATEGY 2 (fallback): hit Gemini directly with the device-side key.
    const directBody = JSON.stringify({
      system_instruction: { parts: [{ text: buildSystemPrompt(profile, freshTotals) }] },
      contents: history,
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    });

    async function callGemini(model: string): Promise<{ ok: true; text: string } | { ok: false; status: number; error: string }> {
      try {
        const res = await fetch(GEMINI_URL(model), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: directBody,
        });
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, status: res.status, error: data?.error?.message || `HTTP ${res.status}` };
        }
        const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiText) {
          const blocked = data?.promptFeedback?.blockReason;
          return { ok: false, status: 0, error: blocked ? `Response blocked: ${blocked}` : 'Empty response from AI.' };
        }
        return { ok: true, text: aiText };
      } catch (e: any) {
        return { ok: false, status: -1, error: e?.message || 'Network error' };
      }
    }

    try {
      // 1) Try server endpoint
      let aiText = '';
      let logFood: { meal: string; quantity_g: number } | null = null;
      const server = await callServerChat();
      if (server.ok) {
        aiText = server.text;
        logFood = server.logFood;
      } else {
        console.log('[ask] server /api/chat failed:', server.error);
        // 2) Fall back to direct Gemini (Pro → Flash) — text only, no meal logging here
        if (!GEMINI_KEY) {
          aiText = `⚠ Server unreachable (${server.error}) and no Gemini key on device. Check your internet connection.`;
        } else {
          let result = await callGemini(PREFERRED_MODEL);
          if (!result.ok && (result.status === 403 || result.status === 404 || result.status === 429)) {
            console.log('[ask] Pro failed, falling back to Flash:', result.error);
            result = await callGemini(FALLBACK_MODEL);
          }
          aiText = result.ok ? result.text : `⚠ AI error: ${result.error}`;
        }
      }

      if (userId && aiText && !aiText.startsWith('⚠')) {
        try {
          await supabase.from('conversations').insert([
            { user_id: userId, role: 'user',      content: text },
            { user_id: userId, role: 'assistant', content: aiText },
          ]);
        } catch {}
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: aiText }]);

      // Server detected a meal mention — save it with full micronutrient analysis.
      if (logFood && logFood.meal) {
        setMessages(prev => [...prev, { id: Date.now() + 2, role: 'ai', text: `⏳ Logging ${logFood!.meal}…` }]);
        try {
          const r = await logMeal(logFood.meal, logFood.quantity_g || 100, undefined);
          if (r.ok) {
            // Build a human-readable top-3 list — same format the photo-scan
            // review screen uses. Makes the "logged" confirmation feel real:
            // the user can see WHICH micronutrients hit their day.
            const summary = formatLoggedSummary(logFood.meal, logFood.quantity_g || 100, r.nutrients || {});
            setMessages(prev => {
              const next = [...prev];
              const idx = next.findIndex(m => m.text.startsWith('⏳ Logging'));
              if (idx >= 0) next[idx] = { ...next[idx], text: summary };
              else next.push({ id: Date.now() + 3, role: 'ai', text: summary });
              return next;
            });
            // Refresh totals locally so the next message sees the new state,
            // AND drop a flag so the home tab's useFocusEffect knows to reload
            // (otherwise the rings wouldn't update until app restart).
            if (userId) {
              try { const t = await fetchDailyTotals(userId); setTotals(t); } catch {}
              try { await AsyncStorage.setItem('lifecode.last_meal_logged_at', String(Date.now())); } catch {}
            }
          } else {
            setMessages(prev => {
              const next = [...prev];
              const idx = next.findIndex(m => m.text.startsWith('⏳ Logging'));
              const errText = `⚠ Could not log meal: ${r.error || 'unknown error'}`;
              if (idx >= 0) next[idx] = { ...next[idx], text: errText };
              else next.push({ id: Date.now() + 3, role: 'ai', text: errText });
              return next;
            });
          }
        } catch (e: any) {
          console.log('[ask] logMeal threw:', e?.message);
        }
      }
    } catch (e: any) {
      console.log('[ask] outer error:', e?.message);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: `Connection error — ${e?.message || 'try again'}.` }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        <View style={s.head}>
          <View style={{ flex: 1 }}>
            <Text style={s.date}>AI COACH</Text>
            <Text style={s.h1}>Ask <Text style={{ fontFamily: fonts.serifItalic }}>anything.</Text></Text>
          </View>
          <Pressable onPress={() => router.push('/profile')} hitSlop={10}>
            <Avatar name={profile?.avatarLetter || 'A'} size={38} gradient={gradients.brand} border={2} borderColor="#fff" />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={s.stream}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}
          {loading && (
            <View style={b.aiBubble}>
              <ActivityIndicator size="small" color={colors.ink3} />
            </View>
          )}
          {messages.length <= 1 && !loading && (
            <View style={s.suggestions}>
              {SUGGESTIONS.map(q => (
                <TouchableOpacity key={q} style={s.suggestBtn} onPress={() => sendText(q)}>
                  <Text style={s.suggestText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={s.composer}>
          <TextInput
            style={s.composerInput}
            placeholder="Ask your coach…"
            placeholderTextColor={colors.ink3}
            value={val}
            onChangeText={setVal}
            onSubmitEditing={() => sendText()}
            returnKeyType="send"
            multiline
            editable={!loading}
          />
          <TouchableOpacity
            style={[s.sendBtn, { backgroundColor: val.trim() && !loading ? colors.ink : colors.ink4 }]}
            onPress={() => sendText()}
            disabled={!val.trim() || loading}
          >
            <Icon name="arrow-up" size={16} color="#fff" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 10, paddingBottom: 14 },
  date: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 2.4, color: colors.ink3 },
  h1: { fontFamily: fonts.serif, fontSize: 34, color: colors.ink, marginTop: 4 },
  stream: { paddingHorizontal: 22, paddingBottom: 16 },
  suggestions: { gap: 8, marginTop: 12 },
  suggestBtn: { borderWidth: 1, borderColor: colors.line2, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'flex-start' },
  suggestText: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink2 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22, paddingVertical: 12, paddingBottom: 100, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
  composerInput: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.ink, maxHeight: 100, paddingTop: 0 },
  sendBtn: { width: 36, height: 36, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
});
