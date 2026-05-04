import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Ring from '../../src/components/Ring';
import Icon from '../../src/components/Icon';
import { colors, fonts, radii, gradients } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';
import { getCachedTokens, getCachedUserId } from '../../src/lib/auth-cache';
import {
  MORNING_NUTRIENTS, RECOVERY_NUTRIENTS, DEFAULT_TARGETS,
  calcProgress, formatAmount,
} from '../../src/lib/nutrients';
import type { Nutrient } from '../../src/lib/nutrients';

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

type Progress = Record<string, { current: number; target: number; pct: number }>;

async function analyzeMealWithAI(mealName: string, quantityG: number): Promise<Record<string, number>> {
  const prompt = `You are a sports nutrition AI with access to USDA and European food composition databases.

MEAL: "${mealName}"
QUANTITY: ${quantityG}g

Calculate the micronutrient content of this specific food at this quantity.
Base your calculations on standard food composition data. Adjust all values proportionally for ${quantityG}g (standard reference is 100g).

Return ONLY valid JSON. Include only nutrients with meaningful amounts (>0). Use these exact keys and units:
- vitamin_a (μg retinol equivalents)
- vitamin_c (mg)
- vitamin_d3 (μg)
- vitamin_e (mg)
- vitamin_k2 (μg — only for fermented foods, cheese, natto; 0 otherwise)
- vitamin_b12 (μg — only animal products)
- b_complex (% RDA contribution from this food)
- zinc (mg)
- copper (mg)
- magnesium_citrate (mg — use total magnesium from food)
- selenium (μg)
- eaa (g — essential amino acids, for protein foods)
- sodium (mg)

Example for "chicken breast 200g": {"vitamin_b12":0.6,"zinc":4.4,"selenium":68,"magnesium_citrate":62,"copper":0.2,"eaa":38,"b_complex":25}
Example for "orange 150g": {"vitamin_c":106,"vitamin_a":9,"b_complex":15,"magnesium_citrate":18}

JSON only, no explanation:`;

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 300 },
    }),
  });

  const data = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try { return JSON.parse(match[0]); } catch { return {}; }
}

function NutrientRow({
  nutrient, prog, delta, deltaOpacity, kind,
}: {
  nutrient: Nutrient;
  prog: { current: number; target: number; pct: number } | undefined;
  delta: number;
  deltaOpacity: Animated.Value;
  kind: 'morning' | 'recovery';
}) {
  const [open, setOpen] = useState(false);
  const accent = kind === 'morning' ? colors.morning : colors.recovery;
  const pct = prog?.pct ?? 0;
  const current = prog?.current ?? 0;
  const target = prog?.target ?? DEFAULT_TARGETS[nutrient.key] ?? nutrient.supplement;

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => setOpen(o => !o)} style={nr.row}>
      <View style={nr.head}>
        <Text style={nr.idx}>{String(MORNING_NUTRIENTS.indexOf(nutrient) !== -1
          ? MORNING_NUTRIENTS.indexOf(nutrient) + 1
          : RECOVERY_NUTRIENTS.indexOf(nutrient) + 1).padStart(2, '0')}</Text>
        <View style={{ flex: 1 }}>
          <Text style={nr.name}>{nutrient.name}</Text>
          <Text style={nr.form}>{nutrient.form}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[nr.pct, { color: accent }]}>{pct}%</Text>
          <Text style={nr.amount}>{formatAmount(current, nutrient.unit)}/{formatAmount(target, nutrient.unit)} {nutrient.unit}</Text>
        </View>
        {delta > 0 && (
          <Animated.Text style={[nr.delta, { opacity: deltaOpacity }]}>
            +{formatAmount(delta, nutrient.unit)}{nutrient.unit}
          </Animated.Text>
        )}
      </View>
      <View style={nr.barTrack}>
        <View style={[nr.barFill, { width: `${pct}%` as any, backgroundColor: accent }]} />
      </View>
      {open && (
        <View style={nr.expand}>
          <View style={nr.expandRow}>
            <Text style={nr.expandLabel}>Supplement</Text>
            <Text style={nr.expandVal}>{formatAmount(nutrient.supplement, nutrient.unit)} {nutrient.unit}</Text>
          </View>
          <View style={nr.expandRow}>
            <Text style={nr.expandLabel}>From food</Text>
            <Text style={nr.expandVal}>{formatAmount(Math.max(0, current - nutrient.supplement), nutrient.unit)} {nutrient.unit}</Text>
          </View>
          <View style={nr.expandRow}>
            <Text style={nr.expandLabel}>Daily target</Text>
            <Text style={nr.expandVal}>{formatAmount(target, nutrient.unit)} {nutrient.unit}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const nr = StyleSheet.create({
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(13,13,15,0.06)' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  idx: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.ink3, width: 22 },
  name: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
  form: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3, marginTop: 1 },
  pct: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  amount: { fontFamily: fonts.sans, fontSize: 10, color: colors.ink3, marginTop: 1 },
  delta: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: '#22c55e', marginLeft: 4, minWidth: 50, textAlign: 'right' },
  barTrack: { height: 3, backgroundColor: 'rgba(13,13,15,0.08)', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  barFill: { height: 3, borderRadius: 2 },
  expand: { backgroundColor: 'rgba(13,13,15,0.03)', borderRadius: 8, padding: 12, marginTop: 8, gap: 6 },
  expandRow: { flexDirection: 'row', justifyContent: 'space-between' },
  expandLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.5, color: colors.ink3 },
  expandVal: { fontFamily: fonts.serifItalic, fontSize: 13, color: colors.ink },
});

export default function TrackScreen() {
  const [cat, setCat] = useState<'morning' | 'recovery'>('morning');
  const [userId, setUserId] = useState<string | null>(null);
  const [morningTaken, setMorningTaken] = useState(false);
  const [recoveryTaken, setRecoveryTaken] = useState(false);
  const [mealNutrients, setMealNutrients] = useState<Record<string, number>>({});
  const [targets, setTargets] = useState<Record<string, number>>(DEFAULT_TARGETS);
  const [progress, setProgress] = useState<Progress>({});
  const [todayMeals, setTodayMeals] = useState<any[]>([]);

  const [mealInput, setMealInput] = useState('');
  const [mealQty, setMealQty] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [mealError, setMealError] = useState('');

  const [mealDeltas, setMealDeltas] = useState<Record<string, number>>({});
  const deltaOpacity = useRef(new Animated.Value(0)).current;

  const today = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    let user = session?.user ?? null;
    let accessToken = session?.access_token ?? null;
    if (!user) { const { data: { user: u } } = await supabase.auth.getUser(); user = u ?? null; }
    if (!user) {
      const tokens = getCachedTokens();
      if (tokens) {
        const { data } = await supabase.auth.setSession(tokens);
        user = data?.session?.user ?? null;
        accessToken = data?.session?.access_token ?? null;
      }
    }
    if (!user) return;
    setUserId(user.id);
    const authH = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

    const [profileRes, logsRes, mealsRes] = await Promise.all([
      supabase.from('profiles').select('micro_targets, age, gender, weight_kg, height_cm, goal').eq('id', user.id).maybeSingle(),
      supabase.from('intake_logs').select('pack')
        .eq('user_id', user.id)
        .gte('taken_at', `${today}T00:00:00.000Z`)
        .lte('taken_at', `${today}T23:59:59.999Z`),
      supabase.from('meal_logs').select('meal_name, quantity_g, nutrients, logged_at')
        .eq('user_id', user.id)
        .gte('logged_at', `${today}T00:00:00.000Z`)
        .lte('logged_at', `${today}T23:59:59.999Z`)
        .order('logged_at', { ascending: false }),
    ]);

    const t: Record<string, number> = profileRes.data?.micro_targets || DEFAULT_TARGETS;
    setTargets(t);

    const packs = (logsRes.data || []).map((l: any) => l.pack);
    const mTaken = packs.includes('morning');
    const rTaken = packs.includes('recovery');
    setMorningTaken(mTaken);
    setRecoveryTaken(rTaken);

    const meals = mealsRes.data || [];
    setTodayMeals(meals);

    const accumulated: Record<string, number> = {};
    for (const meal of meals) {
      for (const [k, v] of Object.entries(meal.nutrients || {})) {
        accumulated[k] = (accumulated[k] || 0) + (v as number);
      }
    }
    setMealNutrients(accumulated);
    setProgress(calcProgress(mTaken, rTaken, accumulated, t));

    // Auto-trigger personalized micro target calculation if not done yet
    const pp = profileRes.data;
    if (!pp?.micro_targets && pp?.age && pp?.weight_kg && pp?.height_cm) {
      fetch('https://web-zeta-lyart-53.vercel.app/api/analyze-nutrients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authH },
        body: JSON.stringify({
          user_id: user.id, age: pp.age, height: pp.height_cm,
          weight: pp.weight_kg, gender: pp.gender || 'male',
          level: pp.goal || 'competitive',
        }),
      }).then(r => r.json()).then(d => {
        if (d.targets) {
          setTargets(d.targets);
          setProgress(calcProgress(mTaken, rTaken, accumulated, d.targets));
        }
      }).catch(() => {});
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleLogMeal = async () => {
    if (!mealInput.trim()) { setMealError('Enter meal name.'); return; }
    const qty = parseInt(mealQty) || 100;
    setAnalyzing(true);
    setMealError('');

    try {
      const nutrients = await analyzeMealWithAI(mealInput.trim(), qty);

      let uid = userId;
      if (!uid) {
        const { data: { session } } = await supabase.auth.getSession();
        uid = session?.user?.id ?? null;
      }
      if (!uid) {
        const tokens = getCachedTokens();
        if (tokens) { const { data } = await supabase.auth.setSession(tokens); uid = data?.session?.user?.id ?? null; }
      }
      if (!uid) uid = getCachedUserId();

      if (uid) {
        await supabase.from('meal_logs').insert({
          user_id: uid,
          meal_name: mealInput.trim(),
          quantity_g: qty,
          nutrients,
          logged_at: new Date().toISOString(),
        });
      }

      const newAccumulated = { ...mealNutrients };
      for (const [k, v] of Object.entries(nutrients)) {
        newAccumulated[k] = (newAccumulated[k] || 0) + (v as number);
      }
      setMealNutrients(newAccumulated);
      setProgress(calcProgress(morningTaken, recoveryTaken, newAccumulated, targets));
      setTodayMeals(prev => [{
        meal_name: mealInput.trim(), quantity_g: qty,
        nutrients, logged_at: new Date().toISOString(),
      }, ...prev]);

      const filtered: Record<string, number> = {};
      for (const [k, v] of Object.entries(nutrients)) {
        if ((v as number) > 0) filtered[k] = v as number;
      }
      setMealDeltas(filtered);
      deltaOpacity.setValue(1);
      setTimeout(() => {
        Animated.timing(deltaOpacity, {
          toValue: 0, duration: 600, useNativeDriver: true,
        }).start(() => setMealDeltas({}));
      }, 1500);

      setMealInput('');
      setMealQty('');
    } catch {
      setMealError('Analysis failed. Check connection.');
    } finally {
      setAnalyzing(false);
    }
  };

  const nutrients = cat === 'morning' ? MORNING_NUTRIENTS : RECOVERY_NUTRIENTS;
  const grad = cat === 'morning' ? gradients.morning : gradients.recovery;
  const overall = nutrients.length > 0
    ? Math.round(nutrients.reduce((sum, n) => sum + (progress[n.key]?.pct ?? 0), 0) / nutrients.length)
    : 0;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* Meal bar — pinned at top */}
        <View style={s.mealBar}>
          <TextInput
            style={s.mealBarInput}
            placeholder="Log a meal... (e.g. chicken breast)"
            placeholderTextColor={colors.ink3}
            value={mealInput}
            onChangeText={v => { setMealInput(v); setMealError(''); }}
            editable={!analyzing}
            returnKeyType="done"
          />
          <TextInput
            style={s.mealBarGrams}
            placeholder="g"
            placeholderTextColor={colors.ink3}
            value={mealQty}
            onChangeText={setMealQty}
            keyboardType="numeric"
            editable={!analyzing}
            maxLength={5}
          />
          <TouchableOpacity
            style={[s.mealBarBtn, { backgroundColor: mealInput.trim() && !analyzing ? colors.ink : colors.ink4 }]}
            onPress={handleLogMeal}
            disabled={!mealInput.trim() || analyzing}
          >
            {analyzing
              ? <ActivityIndicator size="small" color="#fff" />
              : <Icon name="send" size={15} color="#fff" />}
          </TouchableOpacity>
        </View>
        {!!mealError && <Text style={s.errText}>{mealError}</Text>}

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={s.greet}>
            <Text style={s.day}>Today's protocol</Text>
            <Text style={s.h1}>Track</Text>
          </View>

          <View style={s.px}>

            {/* Logged meals */}
            {todayMeals.length > 0 && (
              <View style={s.mealsSection}>
                <Text style={[s.eyebrow, { marginBottom: 8 }]}>Logged Today</Text>
                {todayMeals.map((m, i) => (
                  <View key={i} style={s.mealChip}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.mealChipName}>{m.meal_name}</Text>
                      <Text style={s.mealChipQty}>{m.quantity_g}g</Text>
                    </View>
                    <Text style={s.mealChipTime}>{formatTime(m.logged_at)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Segment */}
            <View style={s.seg}>
              <TouchableOpacity
                style={[s.segBtn, cat === 'morning' && { backgroundColor: colors.morning }]}
                onPress={() => setCat('morning')}
              >
                <Text style={[s.segTxt, cat === 'morning' && { color: '#fff' }]}>Morning Pack</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.segBtn, cat === 'recovery' && { backgroundColor: colors.recovery }]}
                onPress={() => setCat('recovery')}
              >
                <Text style={[s.segTxt, cat === 'recovery' && { color: '#fff' }]}>Recovery Pack</Text>
              </TouchableOpacity>
            </View>

            {/* Ring */}
            <View style={s.ringStage}>
              <Ring size={170} stroke={6} pct={overall} gradient={grad} id={`ring-${cat}`} />
              <View style={s.ringCenter}>
                <Text style={[s.bigNum, { color: cat === 'morning' ? colors.morning : colors.recovery }]}>
                  {overall}<Text style={s.bigUnit}>%</Text>
                </Text>
                <Text style={s.eyebrow}>{cat === 'morning' ? 'Morning' : 'Recovery'}</Text>
              </View>
            </View>

            {/* Status chip */}
            <View style={s.statusRow}>
              <View style={[s.statusChip, {
                backgroundColor: (cat === 'morning' ? morningTaken : recoveryTaken)
                  ? 'rgba(34,197,94,0.1)' : 'rgba(13,13,15,0.06)',
              }]}>
                <Text style={[s.statusText, {
                  color: (cat === 'morning' ? morningTaken : recoveryTaken) ? '#16a34a' : colors.ink3,
                }]}>
                  {(cat === 'morning' ? morningTaken : recoveryTaken)
                    ? 'Pack taken today ✓'
                    : 'Not taken yet — log from dashboard'}
                </Text>
              </View>
            </View>

            {/* Nutrient rows */}
            <View style={s.ingHead}>
              <Text style={s.eyebrow}>{cat === 'morning' ? 'Vitamins & Minerals' : 'Recovery Compounds'}</Text>
              <Text style={s.mutedSm}>{nutrients.length} compounds · tap to expand</Text>
            </View>

            <View>
              {nutrients.map((n) => (
                <NutrientRow
                  key={n.key}
                  nutrient={n}
                  prog={progress[n.key]}
                  delta={mealDeltas[n.key] ?? 0}
                  deltaOpacity={deltaOpacity}
                  kind={cat}
                />
              ))}
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 48 },
  px: { paddingHorizontal: 22 },

  greet: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 20 },
  day: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 1, color: colors.ink3, textTransform: 'uppercase', marginBottom: 4 },
  h1: { fontFamily: fonts.serif, fontSize: 40, color: colors.ink },

  mealBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 22, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.line,
    backgroundColor: colors.bg,
  },
  mealBarInput: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.ink, paddingTop: 0 },
  mealBarGrams: {
    fontFamily: fonts.sans, fontSize: 15, color: colors.ink,
    width: 48, textAlign: 'center', paddingTop: 0,
  },
  mealBarBtn: { width: 36, height: 36, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  errText: { fontFamily: fonts.sans, fontSize: 13, color: '#e55', paddingHorizontal: 22, paddingBottom: 6, backgroundColor: colors.bg },

  seg: { flexDirection: 'row', backgroundColor: 'rgba(13,13,15,0.06)', borderRadius: radii.pill, padding: 4, marginBottom: 22 },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: radii.pill, alignItems: 'center' },
  segTxt: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink2 },

  ringStage: { alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  bigNum: { fontFamily: fonts.serifItalic, fontSize: 40 },
  bigUnit: { fontSize: 22 },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.ink3, textTransform: 'uppercase' },

  statusRow: { alignItems: 'center', marginBottom: 20 },
  statusChip: { borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 6 },
  statusText: { fontFamily: fonts.sansMedium, fontSize: 13 },

  ingHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, marginTop: 4 },
  mutedSm: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3 },

  mealsSection: { marginBottom: 20 },
  mealChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surf, borderRadius: radii.card,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: colors.line,
  },
  mealChipName: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
  mealChipQty: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3, marginTop: 2 },
  mealChipTime: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3 },
});
