import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { colors, fonts, radii, gradients } from '../src/theme';

const SPORTS = ['Running', 'Cycling', 'Gym / Weights', 'CrossFit', 'Football', 'Basketball', 'Swimming', 'Other'];
const GOALS  = [
  { key: 'muscle',    label: 'Build muscle' },
  { key: 'fat',       label: 'Lose fat' },
  { key: 'endurance', label: 'Improve endurance' },
  { key: 'recovery',  label: 'Recover faster' },
  { key: 'performance', label: 'General performance' },
];

type Data = {
  sport: string;
  age: string;
  gender: 'male' | 'female' | 'other' | '';
  weight: string;
  height: string;
  goal: string;
};

const TOTAL = 4;

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Data>({ sport: '', age: '', gender: '', weight: '', height: '', goal: '' });
  const [saving, setSaving] = useState(false);

  const progress = (step + 1) / TOTAL;

  const canNext = () => {
    if (step === 0) return data.sport.length > 0;
    if (step === 1) return data.age.length > 0 && data.gender.length > 0;
    if (step === 2) return data.weight.length > 0 && data.height.length > 0;
    if (step === 3) return data.goal.length > 0;
    return true;
  };

  const next = () => {
    if (step < TOTAL - 1) { setStep(step + 1); return; }
    save();
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('profiles').update({
        sport:          data.sport,
        age:            parseInt(data.age) || null,
        gender:         data.gender || null,
        weight_kg:      parseFloat(data.weight) || null,
        height_cm:      parseInt(data.height) || null,
        goal:           data.goal,
        onboarding_done: true,
        updated_at:     new Date().toISOString(),
      }).eq('id', user.id);

      router.replace('/(tabs)');
    } catch (e) {
      console.error('onboarding save error:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.brand}>LIFECODE</Text>
          <Text style={s.stepLabel}>{step + 1} / {TOTAL}</Text>
        </View>

        {/* Progress bar */}
        <View style={s.progTrack}>
          <LinearGradient
            colors={gradients.morning as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[s.progFill, { width: `${progress * 100}%` as any }]}
          />
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {step === 0 && (
            <View style={s.stepContent}>
              <Text style={s.question}>What's your sport?</Text>
              <Text style={s.sub}>We'll optimise your protocol timing and dosing.</Text>
              <View style={s.grid}>
                {SPORTS.map(sp => (
                  <TouchableOpacity
                    key={sp}
                    style={[s.pill, data.sport === sp && s.pillActive]}
                    onPress={() => setData({ ...data, sport: sp })}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.pillText, data.sport === sp && s.pillTextActive]}>{sp}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 1 && (
            <View style={s.stepContent}>
              <Text style={s.question}>About you.</Text>
              <Text style={s.sub}>Helps us calculate your baseline targets.</Text>

              <Text style={s.label}>AGE</Text>
              <TextInput
                style={s.input}
                value={data.age}
                onChangeText={v => setData({ ...data, age: v.replace(/\D/g, '') })}
                keyboardType="numeric"
                placeholder="e.g. 24"
                placeholderTextColor={colors.ink4}
                maxLength={3}
              />

              <Text style={[s.label, { marginTop: 28 }]}>GENDER</Text>
              <View style={s.genderRow}>
                {(['male', 'female', 'other'] as const).map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[s.genderBtn, data.gender === g && s.genderBtnActive]}
                    onPress={() => setData({ ...data, gender: g })}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.genderText, data.gender === g && s.genderTextActive]}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={s.stepContent}>
              <Text style={s.question}>Your body.</Text>
              <Text style={s.sub}>Used for personalised supplement dosing.</Text>

              <Text style={s.label}>WEIGHT (kg)</Text>
              <TextInput
                style={s.input}
                value={data.weight}
                onChangeText={v => setData({ ...data, weight: v })}
                keyboardType="decimal-pad"
                placeholder="e.g. 80"
                placeholderTextColor={colors.ink4}
                maxLength={5}
              />

              <Text style={[s.label, { marginTop: 28 }]}>HEIGHT (cm)</Text>
              <TextInput
                style={s.input}
                value={data.height}
                onChangeText={v => setData({ ...data, height: v.replace(/\D/g, '') })}
                keyboardType="numeric"
                placeholder="e.g. 182"
                placeholderTextColor={colors.ink4}
                maxLength={3}
              />
            </View>
          )}

          {step === 3 && (
            <View style={s.stepContent}>
              <Text style={s.question}>Your goal.</Text>
              <Text style={s.sub}>Your AI coach will align every suggestion to this.</Text>
              <View style={s.goalList}>
                {GOALS.map(g => (
                  <TouchableOpacity
                    key={g.key}
                    style={[s.goalRow, data.goal === g.key && s.goalRowActive]}
                    onPress={() => setData({ ...data, goal: g.key })}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.goalText, data.goal === g.key && s.goalTextActive]}>{g.label}</Text>
                    {data.goal === g.key && (
                      <View style={s.goalCheck}>
                        <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        </ScrollView>

        {/* Footer CTA */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.cta, (!canNext() || saving) && s.ctaDim]}
            onPress={next}
            disabled={!canNext() || saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : (
                <LinearGradient
                  colors={gradients.morning as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.ctaGrad}
                >
                  <Text style={s.ctaText}>
                    {step < TOTAL - 1 ? 'Continue →' : 'Build my protocol →'}
                  </Text>
                </LinearGradient>
              )
            }
          </TouchableOpacity>

          {step > 0 && (
            <TouchableOpacity onPress={() => setStep(step - 1)} style={{ paddingTop: 14 }}>
              <Text style={s.back}>← Back</Text>
            </TouchableOpacity>
          )}
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 28, paddingTop: 16, paddingBottom: 12 },
  brand: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 3, color: colors.ink3, textTransform: 'uppercase' },
  stepLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink3 },

  progTrack: { height: 2, backgroundColor: 'rgba(13,13,15,0.08)', marginHorizontal: 28 },
  progFill: { height: 2, borderRadius: 1 },

  scroll: { paddingHorizontal: 28, paddingTop: 32, paddingBottom: 24 },

  stepContent: { gap: 0 },
  question: { fontFamily: fonts.serif, fontSize: 38, color: colors.ink, lineHeight: 42, marginBottom: 8 },
  sub: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink2, lineHeight: 22, marginBottom: 32 },

  label: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.ink3, marginBottom: 8 },
  input: {
    fontFamily: fonts.sans, fontSize: 22, color: colors.ink,
    borderBottomWidth: 1, borderBottomColor: colors.line2,
    paddingVertical: 10,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: radii.pill, borderWidth: 1, borderColor: colors.line2,
    backgroundColor: colors.surf,
  },
  pillActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  pillText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink2 },
  pillTextActive: { color: '#fff' },

  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: {
    flex: 1, paddingVertical: 14, borderRadius: radii.card,
    borderWidth: 1, borderColor: colors.line2,
    alignItems: 'center', backgroundColor: colors.surf,
  },
  genderBtnActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  genderText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink2 },
  genderTextActive: { color: '#fff' },

  goalList: { gap: 10 },
  goalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 18,
    borderRadius: radii.card, borderWidth: 1, borderColor: colors.line2,
    backgroundColor: colors.surf,
  },
  goalRowActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  goalText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink },
  goalTextActive: { color: '#fff' },
  goalCheck: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },

  footer: { paddingHorizontal: 28, paddingBottom: 32, paddingTop: 8, gap: 0, alignItems: 'center' },
  cta: { width: '100%', borderRadius: radii.pill, overflow: 'hidden' },
  ctaDim: { opacity: 0.4 },
  ctaGrad: { paddingVertical: 18, alignItems: 'center' },
  ctaText: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: '#fff' },
  back: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink3, textDecorationLine: 'underline' },
});
