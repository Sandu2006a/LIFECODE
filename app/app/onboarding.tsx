import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { getCachedUserId, getCachedTokens } from '../src/lib/auth-cache';
import { fonts, radii } from '../src/theme';

const API_URL = 'https://web-zeta-lyart-53.vercel.app';

const C = {
  bg: '#ffffff', text: '#111111', muted: '#666666', dim: '#999999',
  line: '#E8E0E0', line2: '#F5F0F0', maroon: '#50000B',
  selected: '#111111',
};
const GRAD: [string, string, string] = ['#C62828', '#7C3AED', '#1D4ED8'];

const LEVELS = [
  { key: 'amateur',     label: 'Amateur',     sub: 'I train for health and fun' },
  { key: 'competitive', label: 'Competitive', sub: 'Club or regional competitions' },
  { key: 'elite',       label: 'Elite / Pro', sub: 'National or professional level' },
];

type Data = {
  age: string; gender: 'male' | 'female' | 'other' | '';
  weight: string; height: string; level: string; bestResult: string;
};

const TOTAL = 3;

export default function OnboardingScreen() {
  const [step, setStep]     = useState(0);
  const [data, setData]     = useState<Data>({ age: '', gender: '', weight: '', height: '', level: '', bestResult: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const canNext = () => {
    if (step === 0) return data.age.length > 0 && data.gender.length > 0;
    if (step === 1) return data.weight.length > 0 && data.height.length > 0;
    if (step === 2) return data.level.length > 0;
    return true;
  };

  const next = () => {
    if (step < TOTAL - 1) { setStep(step + 1); return; }
    save();
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      let uid: string | null = null;
      let userName = 'Athlete';

      // 1. Try in-memory session first
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        uid = session.user.id;
        userName = session.user.user_metadata?.display_name
          || session.user.user_metadata?.full_name
          || session.user.email?.split('@')[0] || 'Athlete';
      }

      // 2. Session lost from memory — restore it from the cache saved after verifyOtp
      if (!uid) {
        const tokens = getCachedTokens();
        if (tokens) {
          const { data: restored } = await supabase.auth.setSession(tokens);
          if (restored?.session?.user) {
            uid = restored.session.user.id;
            userName = restored.session.user.user_metadata?.display_name
              || restored.session.user.user_metadata?.full_name
              || restored.session.user.email?.split('@')[0] || 'Athlete';
          }
        }
      }

      // 3. Last resort: use the cached user ID directly
      if (!uid) {
        uid = getCachedUserId();
      }

      if (!uid) {
        setError('Session lost. Please re-enter your activation code.');
        setSaving(false);
        router.replace('/activate');
        return;
      }

      const age      = parseInt(data.age) || null;
      const weight_kg = parseFloat(data.weight) || null;
      const height_cm = parseInt(data.height) || null;

      // Save profile via admin API (bypasses RLS — works even if session is lost)
      fetch(`${API_URL}/api/save-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: uid, age, gender: data.gender || null,
          weight_kg, height_cm, goal: data.level,
        }),
      }).catch(() => {});

      // Also try direct Supabase upsert (works if session is active)
      supabase.from('profiles').upsert({
        id: uid, age, gender: data.gender || null,
        weight_kg, height_cm, goal: data.level,
        onboarding_done: true, updated_at: new Date().toISOString(),
      }, { onConflict: 'id' }).then(({ error }) => {
        if (error) {
          supabase.from('profiles').update({
            age, gender: data.gender || null, weight_kg, height_cm,
            goal: data.level, onboarding_done: true,
            updated_at: new Date().toISOString(),
          }).eq('id', uid).catch(() => {});
        }
      }).catch(() => {});

      // Navigate immediately
      router.replace('/(tabs)');

      // Fire-and-forget: AI generates personalized targets in background
      const ageN    = parseInt(data.age)    || 25;
      const heightN = parseInt(data.height) || 175;
      const weightN = parseFloat(data.weight) || 75;
      const genderS = data.gender || 'male';
      const levelLabel = LEVELS.find(l => l.key === data.level)?.label ?? data.level;

      // Macro targets (calories/protein/carbs/fats)
      fetch(`${API_URL}/api/analyze-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: uid, name: userName,
          age: ageN, height: heightN, weight: weightN, gender: genderS,
          sport: 'General Athletics',
          result: data.bestResult.trim() || levelLabel,
        }),
      }).catch(() => {});

      // Micronutrient targets (vitamin/mineral needs)
      fetch(`${API_URL}/api/analyze-nutrients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: uid, age: ageN, height: heightN,
          weight: weightN, gender: genderS, level: data.level,
        }),
      }).catch(() => {});

    } catch (e: any) {
      console.error('onboarding save error:', e);
      setError('Something went wrong. Try again.');
      setSaving(false);
    }
  };

  const progress = (step + 1) / TOTAL;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        <View style={s.header}>
          <Text style={s.brand}>LIFECODE</Text>
          <Text style={s.stepLabel}>{step + 1} / {TOTAL}</Text>
        </View>

        <View style={s.progTrack}>
          <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[s.progFill, { width: `${progress * 100}%` as any }]} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {step === 0 && (
            <View style={s.stepContent}>
              <Text style={s.question}>About you.</Text>
              <Text style={s.sub}>We calculate your baseline targets from this.</Text>

              <Text style={s.label}>AGE</Text>
              <TextInput style={s.input} value={data.age}
                onChangeText={v => setData({ ...data, age: v.replace(/\D/g, '') })}
                keyboardType="numeric" placeholder="e.g. 24" placeholderTextColor={C.dim} maxLength={3} />

              <Text style={[s.label, { marginTop: 36 }]}>GENDER</Text>
              <View style={s.genderRow}>
                {(['male', 'female', 'other'] as const).map(g => (
                  <TouchableOpacity key={g}
                    style={[s.genderBtn, data.gender === g && s.genderActive]}
                    onPress={() => setData({ ...data, gender: g })} activeOpacity={0.7}>
                    <Text style={[s.genderText, data.gender === g && s.genderTextActive]}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 1 && (
            <View style={s.stepContent}>
              <Text style={s.question}>Your body.</Text>
              <Text style={s.sub}>Used for precise supplement dosing calculations.</Text>

              <Text style={s.label}>WEIGHT (kg)</Text>
              <TextInput style={s.input} value={data.weight}
                onChangeText={v => setData({ ...data, weight: v })}
                keyboardType="decimal-pad" placeholder="e.g. 80" placeholderTextColor={C.dim} maxLength={5} />

              <Text style={[s.label, { marginTop: 36 }]}>HEIGHT (cm)</Text>
              <TextInput style={s.input} value={data.height}
                onChangeText={v => setData({ ...data, height: v.replace(/\D/g, '') })}
                keyboardType="numeric" placeholder="e.g. 182" placeholderTextColor={C.dim} maxLength={3} />
            </View>
          )}

          {step === 2 && (
            <View style={s.stepContent}>
              <Text style={s.question}>Your level.</Text>
              <Text style={s.sub}>Your AI coach calibrates every protocol to your experience.</Text>

              <View style={s.levelList}>
                {LEVELS.map(l => {
                  const active = data.level === l.key;
                  return (
                    <TouchableOpacity key={l.key}
                      style={[s.levelCard, active && s.levelCardActive]}
                      onPress={() => setData({ ...data, level: l.key })} activeOpacity={0.7}>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.levelLabel, active && s.levelLabelActive]}>{l.label}</Text>
                        <Text style={[s.levelSub, active && s.levelSubActive]}>{l.sub}</Text>
                      </View>
                      <View style={[s.levelDot, active && s.levelDotActive]}>
                        {active && <View style={s.levelDotFill} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ marginTop: 8 }}>
                <Text style={s.label}>BEST RESULT IN SPORT <Text style={s.optional}>(optional)</Text></Text>
                <Text style={s.resultHint}>Helps AI personalise your nutrition targets precisely.</Text>
                <View style={s.chatBar}>
                  <TextInput style={s.chatInput} value={data.bestResult}
                    onChangeText={v => setData({ ...data, bestResult: v })}
                    placeholder="e.g. Sub-4h marathon, 120kg squat, 10km in 42 min..."
                    placeholderTextColor={C.dim} multiline maxLength={200} />
                </View>
              </View>
            </View>
          )}

        </ScrollView>

        {!!error && <Text style={s.errorText}>{error}</Text>}

        <View style={s.footer}>
          <TouchableOpacity
            style={[s.cta, (!canNext() || saving) && s.ctaDim]}
            onPress={next} disabled={!canNext() || saving} activeOpacity={0.85}>
            {saving ? (
              <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaGrad}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={[s.ctaText, { marginLeft: 10 }]}>Building protocol...</Text>
              </LinearGradient>
            ) : (
              <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaGrad}>
                <Text style={s.ctaText}>{step < TOTAL - 1 ? 'Continue' : 'Build my protocol'}</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
          {step > 0 && (
            <TouchableOpacity onPress={() => setStep(step - 1)} style={s.backBtn}>
              <Text style={s.backText}>Back</Text>
            </TouchableOpacity>
          )}
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 28, paddingTop: 16, paddingBottom: 12 },
  brand: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 4, color: C.dim, textTransform: 'uppercase' },
  stepLabel: { fontFamily: fonts.sans, fontSize: 13, color: C.dim },
  progTrack: { height: 2, backgroundColor: C.line2, marginHorizontal: 28 },
  progFill: { height: 2, borderRadius: 1 },
  scroll: { paddingHorizontal: 28, paddingTop: 36, paddingBottom: 24 },
  stepContent: { gap: 0 },
  question: { fontFamily: fonts.serif, fontSize: 42, color: C.text, lineHeight: 46, marginBottom: 10 },
  sub: { fontFamily: fonts.sans, fontSize: 15, color: C.muted, lineHeight: 22, marginBottom: 36 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 1.5, color: C.dim, marginBottom: 10, textTransform: 'uppercase' },
  optional: { fontFamily: fonts.sans, fontSize: 10, color: C.dim, textTransform: 'none', letterSpacing: 0 },
  input: { fontFamily: fonts.sans, fontSize: 26, color: C.text, borderBottomWidth: 1.5, borderBottomColor: C.line, paddingVertical: 10 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: { flex: 1, paddingVertical: 16, borderRadius: radii.card, borderWidth: 1.5, borderColor: C.line, alignItems: 'center', backgroundColor: C.bg },
  genderActive: { backgroundColor: C.selected, borderColor: C.selected },
  genderText: { fontFamily: fonts.sansMedium, fontSize: 15, color: C.muted },
  genderTextActive: { color: '#fff' },
  levelList: { gap: 12, marginBottom: 32 },
  levelCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20, borderRadius: radii.card, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.bg },
  levelCardActive: { backgroundColor: C.selected, borderColor: C.selected },
  levelLabel: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: C.text, marginBottom: 3 },
  levelLabelActive: { color: '#fff' },
  levelSub: { fontFamily: fonts.sans, fontSize: 13, color: C.muted },
  levelSubActive: { color: 'rgba(255,255,255,0.65)' },
  levelDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  levelDotActive: { borderColor: 'rgba(255,255,255,0.5)' },
  levelDotFill: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  resultHint: { fontFamily: fonts.sans, fontSize: 13, color: C.muted, lineHeight: 20, marginBottom: 12 },
  chatBar: { backgroundColor: '#FAFAFA', borderWidth: 1.5, borderColor: C.line, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, minHeight: 80 },
  chatInput: { fontFamily: fonts.sans, fontSize: 15, color: C.text, lineHeight: 22 },
  errorText: { fontFamily: fonts.sans, fontSize: 13, color: '#C62828', textAlign: 'center', paddingHorizontal: 28, marginBottom: 8 },
  footer: { paddingHorizontal: 28, paddingBottom: 28, paddingTop: 8, alignItems: 'center' },
  cta: { width: '100%', borderRadius: radii.pill, overflow: 'hidden' },
  ctaDim: { opacity: 0.38 },
  ctaGrad: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  ctaText: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: '#fff' },
  backBtn: { paddingTop: 16 },
  backText: { fontFamily: fonts.sans, fontSize: 14, color: C.dim },
});
