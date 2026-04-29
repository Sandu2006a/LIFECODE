import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../../src/components/Icon';
import { colors, fonts, radii } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';
import { getCachedTokens, getCachedUserId } from '../../src/lib/auth-cache';
import {
  MORNING_NUTRIENTS, RECOVERY_NUTRIENTS, DEFAULT_TARGETS, calcProgress,
} from '../../src/lib/nutrients';

type Message = { id: number; role: 'ai' | 'user'; text: string };

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

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
  aiBubble: { backgroundColor: colors.surf, borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, padding: 14, maxWidth: '86%', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  aiText: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink, lineHeight: 22 },
  meWrap: { alignItems: 'flex-end', marginBottom: 10 },
  meBubble: { backgroundColor: 'rgba(13,13,15,0.07)', borderRadius: radii.card, padding: 14, maxWidth: '86%' },
  meText: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink, lineHeight: 22 },
});

type ContextData = {
  name: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  goal: string;
  caloriesTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatsTarget: number;
  microTargets: Record<string, number>;
  morningTaken: boolean;
  recoveryTaken: boolean;
  todayMeals: { meal_name: string; quantity_g: number; nutrients: any }[];
  progress: Record<string, { current: number; target: number; pct: number }>;
};

async function buildContext(userId: string): Promise<ContextData | null> {
  const today = new Date().toISOString().split('T')[0];

  const [profileRes, logsRes, mealsRes] = await Promise.all([
    supabase.from('profiles').select(
      'display_name,full_name,age,gender,weight_kg,height_cm,goal,calories_target,protein_target,carbs_target,fats_target,micro_targets'
    ).eq('id', userId).maybeSingle(),
    supabase.from('intake_logs').select('pack')
      .eq('user_id', userId)
      .gte('taken_at', `${today}T00:00:00.000Z`)
      .lte('taken_at', `${today}T23:59:59.999Z`),
    supabase.from('meal_logs').select('meal_name,quantity_g,nutrients,logged_at')
      .eq('user_id', userId)
      .gte('logged_at', `${today}T00:00:00.000Z`)
      .lte('logged_at', `${today}T23:59:59.999Z`),
  ]);

  const p = profileRes.data;
  if (!p) return null;

  const packs = (logsRes.data || []).map((l: any) => l.pack);
  const morningTaken = packs.includes('morning');
  const recoveryTaken = packs.includes('recovery');

  const todayMeals = mealsRes.data || [];
  const microTargets: Record<string, number> = p.micro_targets || DEFAULT_TARGETS;

  const mealNutrients: Record<string, number> = {};
  for (const meal of todayMeals) {
    for (const [k, v] of Object.entries(meal.nutrients || {})) {
      mealNutrients[k] = (mealNutrients[k] || 0) + (v as number);
    }
  }

  const progress = calcProgress(morningTaken, recoveryTaken, mealNutrients, microTargets);

  return {
    name: p.display_name || p.full_name || 'Athlete',
    age: p.age || 0,
    gender: p.gender || '',
    weight: p.weight_kg || 0,
    height: p.height_cm || 0,
    goal: p.goal || '',
    caloriesTarget: p.calories_target || 0,
    proteinTarget: p.protein_target || 0,
    carbsTarget: p.carbs_target || 0,
    fatsTarget: p.fats_target || 0,
    microTargets,
    morningTaken,
    recoveryTaken,
    todayMeals,
    progress,
  };
}

function buildSystemPrompt(ctx: ContextData): string {
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const goalLabel: Record<string, string> = {
    amateur: 'Amateur — trains for health and fun',
    competitive: 'Competitive — club/regional level athlete',
    elite: 'Elite / Pro — national or professional level',
  };

  const microLines = (nutrients: typeof MORNING_NUTRIENTS) =>
    nutrients.map(n => {
      const pr = ctx.progress[n.key];
      if (!pr) return '';
      const status = pr.pct >= 100 ? '✓ COMPLETE' : pr.pct >= 50 ? 'partial' : 'LOW';
      return `  ${n.name}: ${pr.current}/${pr.target} ${n.unit} (${pr.pct}%) ${status}`;
    }).filter(Boolean).join('\n');

  const mealLines = ctx.todayMeals.length > 0
    ? ctx.todayMeals.map(m => `  • ${m.meal_name} — ${m.quantity_g}g`).join('\n')
    : '  None logged yet';

  return `You are the LIFECODE AI — the precision sports performance coach of ${ctx.name}.

CRITICAL INSTRUCTION: Before answering ANY question, analyze ALL the data below. Reference specific numbers and gaps in your response. Never give generic advice — always personalize to ${ctx.name}'s exact data.

━━━ ATHLETE PROFILE ━━━
Name: ${ctx.name} | Age: ${ctx.age} | Gender: ${ctx.gender}
Weight: ${ctx.weight}kg | Height: ${ctx.height}cm
Level: ${goalLabel[ctx.goal] || ctx.goal || 'Not set'}

━━━ DAILY NUTRITION TARGETS (AI-calibrated) ━━━
Calories: ${ctx.caloriesTarget > 0 ? ctx.caloriesTarget + ' kcal' : 'Not set yet'}
Protein: ${ctx.proteinTarget > 0 ? ctx.proteinTarget + 'g' : 'Not set'}
Carbs: ${ctx.carbsTarget > 0 ? ctx.carbsTarget + 'g' : 'Not set'}
Fats: ${ctx.fatsTarget > 0 ? ctx.fatsTarget + 'g' : 'Not set'}

━━━ TODAY'S PROTOCOL — ${date} ━━━
Morning Pack: ${ctx.morningTaken ? 'TAKEN ✓ (all 11 vitamins & minerals at full dose)' : 'NOT TAKEN ✗ — all morning micronutrients at 0%'}
Recovery Pack: ${ctx.recoveryTaken ? 'TAKEN ✓ (all 10 compounds at full dose)' : 'NOT TAKEN ✗ — all recovery compounds at 0%'}

━━━ MICRONUTRIENT STATUS TODAY ━━━
MORNING PACK — Vitamins & Minerals:
${microLines(MORNING_NUTRIENTS)}

RECOVERY PACK — Performance Compounds:
${microLines(RECOVERY_NUTRIENTS)}

━━━ MEALS LOGGED TODAY ━━━
${mealLines}

━━━ LIFECODE SUPPLEMENT FORMULAS ━━━
Morning Pack (daily): Vitamin A 800μg | Vitamin C 200mg | Vitamin D3 25μg | Vitamin E 12mg | Vitamin K2 50μg | B12 100μg | B-Complex 100% RDA | Zinc 10mg | Copper 0.5mg | Magnesium Citrate 350mg | Selenium 50μg
Recovery Pack (post-workout): Maltodextrin 20g | EAA 7g | Creatine 5g | L-Glutamine 3g | HMB 1.5g | Tart Cherry 500mg | Himalayan Salt 300mg | Mg Bisglycinate 150mg | L-Theanine 100mg | AstraGin 50mg

━━━ COACHING INSTRUCTIONS ━━━
1. Analyze ${ctx.name}'s specific data FIRST — identify which nutrients are LOW, OK, or COMPLETE
2. Give direct, data-driven answers referencing actual percentages and numbers
3. If a nutrient is low, identify the gap and suggest food sources
4. Be concise (2-4 sentences) unless the user asks for more detail
5. Use ${ctx.name}'s name when addressing them
6. If morning/recovery pack not taken, always mention this as the first priority`;
}

export default function AskScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [val, setVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingContext, setLoadingContext] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      let user = session?.user ?? null;
      if (!user) { const { data: { user: u } } = await supabase.auth.getUser(); user = u ?? null; }
      if (!user) {
        const tokens = getCachedTokens();
        if (tokens) { const { data } = await supabase.auth.setSession(tokens); user = data?.session?.user ?? null; }
      }
      if (!user) { setLoadingContext(false); return; }
      setUserId(user.id);

      const ctx = await buildContext(user.id);
      if (ctx) {
        setSystemPrompt(buildSystemPrompt(ctx));
        const firstName = ctx.name.split(' ')[0];
        const missing = [];
        if (!ctx.morningTaken) missing.push('morning pack');
        if (!ctx.recoveryTaken) missing.push('recovery pack');
        const lowNutrients = Object.entries(ctx.progress)
          .filter(([, pr]) => pr.pct < 40 && pr.target > 0)
          .map(([k]) => [...MORNING_NUTRIENTS, ...RECOVERY_NUTRIENTS].find(n => n.key === k)?.name)
          .filter(Boolean).slice(0, 3);

        let intro = `Hi ${firstName}! I've analyzed your full profile and today's data. `;
        if (missing.length > 0) {
          intro += `Your ${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} not taken yet today — that's your priority. `;
        } else {
          intro += `Both packs taken — great work! `;
        }
        if (lowNutrients.length > 0) {
          intro += `Nutrients needing attention: ${lowNutrients.join(', ')}. Ask me anything.`;
        } else {
          intro += `Ask me anything about your nutrition, recovery, or training.`;
        }

        setMessages([{ id: 1, role: 'ai', text: intro }]);
      } else {
        setMessages([{ id: 1, role: 'ai', text: "Hi! I'm your LIFECODE AI coach. Complete your profile to unlock personalized insights. Ask me anything about nutrition and performance." }]);
      }
      setLoadingContext(false);
    })();
  }, []);

  const send = async () => {
    const text = val.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setVal('');
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const history = messages
        .filter(m => m.id !== 1)
        .concat(userMsg)
        .map(m => ({
          role: m.role === 'ai' ? 'model' : 'user',
          parts: [{ text: m.text }],
        }));

      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: history,
          generationConfig: { temperature: 0.6, maxOutputTokens: 600 },
        }),
      });

      const data = await res.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Unable to respond right now.';

      // Save conversation
      if (userId) {
        supabase.from('conversations').insert([
          { user_id: userId, role: 'user', content: text },
          { user_id: userId, role: 'assistant', content: aiText },
        ]).catch(() => {});
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: aiText }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: 'Connection error — please try again.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        <View style={s.greet}>
          <Text style={s.day}>AI Coach</Text>
          <Text style={s.h1}>Ask <Text style={s.h1Italic}>anything.</Text></Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={s.stream}
          showsVerticalScrollIndicator={false}
        >
          {loadingContext ? (
            <View style={s.contextLoading}>
              <ActivityIndicator color={colors.ink3} size="small" />
              <Text style={s.contextLoadingText}>Loading your data...</Text>
            </View>
          ) : (
            messages.map(msg => <Bubble key={msg.id} msg={msg} />)
          )}
          {loading && (
            <View style={b.aiBubble}>
              <ActivityIndicator size="small" color={colors.ink3} />
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
            onSubmitEditing={send}
            returnKeyType="send"
            multiline
            editable={!loading && !loadingContext}
          />
          <TouchableOpacity
            style={[s.sendBtn, { backgroundColor: val.trim() && !loading ? colors.ink : colors.ink4 }]}
            onPress={send}
            disabled={!val.trim() || loading}
          >
            <Icon name="send" size={15} color="#fff" />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  greet: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 12 },
  day: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 1, color: colors.ink3, textTransform: 'uppercase', marginBottom: 4 },
  h1: { fontFamily: fonts.serif, fontSize: 40, color: colors.ink },
  h1Italic: { fontFamily: fonts.serifItalic },
  stream: { paddingHorizontal: 22, paddingBottom: 16 },
  contextLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  contextLoadingText: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink3 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
  composerInput: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.ink, maxHeight: 100, paddingTop: 0 },
  sendBtn: { width: 36, height: 36, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
});
