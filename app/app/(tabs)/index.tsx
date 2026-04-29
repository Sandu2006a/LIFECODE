import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MultiRing from '../../src/components/MultiRing';
import GradientText from '../../src/components/GradientText';
import { colors, fonts, radii, gradients } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';
import { getCachedTokens, getCachedUserId } from '../../src/lib/auth-cache';

const GRAD: [string, string, string] = ['#C62828', '#7C3AED', '#1D4ED8'];
const API_URL = 'https://web-zeta-lyart-53.vercel.app';

function MacroBar({ label, value, unit, color, pct }: { label: string; value: number; unit: string; color: string; pct: number }) {
  return (
    <View style={mb.wrap}>
      <View style={mb.top}>
        <Text style={mb.label}>{label}</Text>
        <Text style={[mb.val, { color }]}>{value > 0 ? `${value} ${unit}` : '—'}</Text>
      </View>
      <View style={mb.track}>
        <View style={[mb.fill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}
const mb = StyleSheet.create({
  wrap: { marginBottom: 12 },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.8, color: colors.ink3, textTransform: 'uppercase' },
  val: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
  track: { height: 4, backgroundColor: 'rgba(13,13,15,0.08)', borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
});

function ProgressBar({ pct, kind }: { pct: number; kind: 'morning' | 'recovery' }) {
  return (
    <View style={bar.track}>
      <View style={[bar.fill, {
        width: `${pct}%` as any,
        backgroundColor: kind === 'morning' ? colors.morning : colors.recovery,
      }]} />
    </View>
  );
}
const bar = StyleSheet.create({
  track: { height: 4, backgroundColor: 'rgba(13,13,15,0.08)', borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
});

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Profile = {
  display_name: string;
  goal: string;
  calories_target: number;
  protein_target: number;
  carbs_target: number;
  fats_target: number;
};

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [morningTaken, setMorningTaken] = useState(false);
  const [recoveryTaken, setRecoveryTaken] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [aiTip, setAiTip] = useState('');

  const today = new Date();
  const dateLabel = `${DAYS_SHORT[today.getDay()]} · ${MONTHS[today.getMonth()]} ${today.getDate()}`;
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let user = session?.user ?? null;
      if (!user) { const { data: { user: u } } = await supabase.auth.getUser(); user = u ?? null; }
      if (!user) {
        const tokens = getCachedTokens();
        if (tokens) { const { data } = await supabase.auth.setSession(tokens); user = data?.session?.user ?? null; }
      }
      if (!user) { setLoadingTargets(false); return; }
      setUserId(user.id);

      const todayStr = today.toISOString().split('T')[0];

      const { data: p } = await supabase
        .from('profiles')
        .select('display_name, full_name, goal, calories_target, protein_target, carbs_target, fats_target, age, gender, weight_kg, height_cm, micro_targets')
        .eq('id', user.id)
        .maybeSingle();

      if (p) {
        setProfile({
          display_name: p.display_name || p.full_name || user.email?.split('@')[0] || 'Athlete',
          goal: p.goal || '',
          calories_target: p.calories_target || 0,
          protein_target: p.protein_target || 0,
          carbs_target: p.carbs_target || 0,
          fats_target: p.fats_target || 0,
        });

        if (p.calories_target && p.calories_target > 0) {
          const name = p.display_name || p.full_name || 'Athlete';
          const firstName = name.split(' ')[0];
          setAiTip(buildTip(firstName, p.goal, p.calories_target, p.protein_target));
        }

        // Auto-trigger AI macro analysis if targets missing but physical data exists
        if ((!p.calories_target || p.calories_target === 0) && p.age && p.weight_kg && p.height_cm) {
          const nm = p.display_name || p.full_name || user.email?.split('@')[0] || 'Athlete';
          const lvlMap: Record<string, string> = { amateur: 'Amateur', competitive: 'Competitive', elite: 'Elite / Pro' };
          const lvl = lvlMap[p.goal || ''] || 'Competitive';
          fetch(`${API_URL}/api/analyze-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id, name: nm,
              age: p.age, height: p.height_cm, weight: p.weight_kg,
              gender: p.gender || 'male', sport: 'General Athletics', result: lvl,
            }),
          }).then(r => r.json()).then(d => {
            if (d.targets?.calories_target) {
              setProfile(prev => prev ? {
                ...prev,
                calories_target: d.targets.calories_target,
                protein_target: d.targets.protein_target,
                carbs_target: d.targets.carbs_target,
                fats_target: d.targets.fats_target,
              } : null);
              setAiTip(buildTip(nm.split(' ')[0], p.goal || '', d.targets.calories_target, d.targets.protein_target));
            }
          }).catch(() => {});
        }

        // Auto-trigger micro nutrient analysis if not personalized yet
        if (!p.micro_targets && p.age && p.weight_kg && p.height_cm) {
          fetch(`${API_URL}/api/analyze-nutrients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id, age: p.age, height: p.height_cm,
              weight: p.weight_kg, gender: p.gender || 'male', level: p.goal || 'competitive',
            }),
          }).catch(() => {});
        }
      }
      setLoadingTargets(false);

      const { data: logs } = await supabase
        .from('intake_logs')
        .select('pack')
        .eq('user_id', user.id)
        .gte('taken_at', `${todayStr}T00:00:00.000Z`)
        .lte('taken_at', `${todayStr}T23:59:59.999Z`);

      const packs = (logs || []).map((l: any) => l.pack);
      setMorningTaken(packs.includes('morning'));
      setRecoveryTaken(packs.includes('recovery'));
    } catch {
      setLoadingTargets(false);
    }
  };

  const buildTip = (name: string, goal: string, cal: number, prot: number) => {
    const goalMap: Record<string, string> = {
      amateur: 'your health and fitness goals',
      competitive: 'your competition performance',
      elite: 'your elite-level training demands',
    };
    const goalText = goalMap[goal] || 'your performance goals';
    return `${name}, your AI-calibrated daily target is ${cal} kcal with ${prot}g protein — optimised for ${goalText}. Hit both packs today to stay on track.`;
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const morningPct = morningTaken ? 100 : 0;
  const recoveryPct = recoveryTaken ? 100 : 0;
  const overall = Math.round((morningPct + recoveryPct) / 2);

  const markTaken = async (pack: 'morning' | 'recovery') => {
    const already = pack === 'morning' ? morningTaken : recoveryTaken;
    if (already) return;
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
    if (!uid) return;
    await supabase.from('intake_logs').insert({ user_id: uid, pack, taken_at: new Date().toISOString() });
    if (pack === 'morning') setMorningTaken(true);
    else setRecoveryTaken(true);
  };

  const firstName = (profile?.display_name || 'Athlete').split(' ')[0];
  const hasTargets = profile && profile.calories_target > 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.ink3} />}
      >
        <View style={s.greet}>
          <Text style={s.day}>{dateLabel}</Text>
          <Text style={s.h1}>{greeting},{'\n'}</Text>
          <GradientText colors={GRAD} style={s.h1Italic}>{firstName}.</GradientText>
        </View>

        <View style={s.px}>

          {/* Protocol score card */}
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.eyebrow}>Today's protocol</Text>
              <View style={s.chip}>
                <Text style={s.chipText}>
                  {overall === 100 ? 'Complete ✓' : overall === 0 ? 'Not started' : 'In progress'}
                </Text>
              </View>
            </View>

            <View style={s.ringStage}>
              <MultiRing size={236} items={[
                { label: 'Morning',  pct: morningPct,  gradient: gradients.morning },
                { label: 'Recovery', pct: recoveryPct, gradient: gradients.recovery },
              ]} />
              <View style={s.ringCenter}>
                <GradientText colors={GRAD} style={s.huge}>{overall}</GradientText>
                <Text style={s.hugeUnit}>%</Text>
              </View>
            </View>

            <View style={s.macroRow}>
              {[
                { label: 'Morning',  val: morningPct,  color: colors.morning },
                { label: 'Recovery', val: recoveryPct, color: colors.recovery },
              ].map((m) => (
                <View key={m.label} style={s.macroItem}>
                  <Text style={s.eyebrow}>{m.label}</Text>
                  <Text style={[s.macroNum, { color: m.color }]}>{m.val}%</Text>
                </View>
              ))}
            </View>
          </View>

          {/* AI Nutrition Targets */}
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.eyebrow}>AI Nutrition Targets</Text>
              {hasTargets && (
                <View style={[s.chip, { backgroundColor: 'rgba(198,40,40,0.08)' }]}>
                  <Text style={[s.chipText, { color: '#C62828' }]}>AI-set</Text>
                </View>
              )}
            </View>

            {loadingTargets ? (
              <ActivityIndicator color={colors.ink3} style={{ paddingVertical: 20 }} />
            ) : hasTargets ? (
              <>
                <MacroBar
                  label="Calories"
                  value={profile!.calories_target}
                  unit="kcal"
                  color="#C62828"
                  pct={75}
                />
                <MacroBar
                  label="Protein"
                  value={profile!.protein_target}
                  unit="g"
                  color="#7C3AED"
                  pct={60}
                />
                <MacroBar
                  label="Carbohydrates"
                  value={profile!.carbs_target}
                  unit="g"
                  color="#1D4ED8"
                  pct={50}
                />
                <MacroBar
                  label="Fats"
                  value={profile!.fats_target}
                  unit="g"
                  color="#059669"
                  pct={45}
                />
                <Text style={s.targetNote}>Daily targets calibrated by AI to your profile.</Text>
              </>
            ) : (
              <View style={s.noTargets}>
                <Text style={s.noTargetsText}>
                  Your AI nutrition targets are being calculated.{'\n'}Pull to refresh in a moment.
                </Text>
              </View>
            )}
          </View>

          {/* Morning pack */}
          <TouchableOpacity
            style={[s.packCard, { borderColor: morningTaken ? 'rgba(226,106,31,0.35)' : 'rgba(226,106,31,0.1)' }]}
            onPress={() => markTaken('morning')}
            activeOpacity={0.8}
          >
            <View style={s.row}>
              <Text style={s.packTime}>Take before 10:00</Text>
              <Text style={[s.eyebrow, { color: colors.morning }]}>Morning</Text>
            </View>
            <Text style={s.packTitle}>Morning Pack <Text style={s.em}>—</Text></Text>
            <Text style={s.packSub}>{morningTaken ? 'Taken today ✓' : 'Tap to mark as taken'}</Text>
            <View style={{ marginTop: 16 }}><ProgressBar pct={morningPct} kind="morning" /></View>
          </TouchableOpacity>

          {/* Recovery pack */}
          <TouchableOpacity
            style={[s.packCard, { borderColor: recoveryTaken ? 'rgba(74,58,168,0.35)' : 'rgba(74,58,168,0.1)' }]}
            onPress={() => markTaken('recovery')}
            activeOpacity={0.8}
          >
            <View style={s.row}>
              <Text style={s.packTime}>Within 45 min of training</Text>
              <Text style={[s.eyebrow, { color: colors.recovery }]}>Recovery</Text>
            </View>
            <Text style={s.packTitle}>Recovery Pack <Text style={s.em}>—</Text></Text>
            <Text style={s.packSub}>{recoveryTaken ? 'Taken today ✓' : 'Tap to mark as taken'}</Text>
            <View style={{ marginTop: 16 }}><ProgressBar pct={recoveryPct} kind="recovery" /></View>
          </TouchableOpacity>

          {/* AI Tip */}
          {!!aiTip && (
            <View style={s.aiTip}>
              <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.aiIcon}>
                <Text style={s.aiIconText}>AI</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={s.aiTitle}>Coach Insight</Text>
                <Text style={s.aiMsg}>{aiTip}</Text>
              </View>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 32 },
  px: { paddingHorizontal: 22, gap: 14 },

  greet: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 20 },
  day: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 1, color: colors.ink3, textTransform: 'uppercase', marginBottom: 4 },
  h1: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 44, color: colors.ink },
  h1Italic: { fontFamily: fonts.serifItalic, fontSize: 40, lineHeight: 44 },

  card: { backgroundColor: colors.surf, borderRadius: radii.card, padding: 22, paddingTop: 26, borderWidth: 1, borderColor: colors.line, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 24, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.ink3, textTransform: 'uppercase' },
  chip: { backgroundColor: 'rgba(13,13,15,0.06)', borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.ink2 },

  ringStage: { alignItems: 'center', justifyContent: 'center', marginVertical: 4 },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  huge: { fontFamily: fonts.serifItalic, fontSize: 52, lineHeight: 56 },
  hugeUnit: { fontFamily: fonts.serifItalic, fontSize: 24, color: colors.ink3 },

  macroRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 4, marginTop: 8 },
  macroItem: { gap: 4, alignItems: 'center' },
  macroNum: { fontFamily: fonts.serifItalic, fontSize: 22 },

  targetNote: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3, marginTop: 4, textAlign: 'right' },
  noTargets: { paddingVertical: 16, alignItems: 'center' },
  noTargetsText: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink3, textAlign: 'center', lineHeight: 22 },

  packCard: { backgroundColor: colors.surf, borderRadius: radii.card, padding: 22, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 24, elevation: 2 },
  packTime: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3 },
  packTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.ink, marginTop: 12 },
  em: { fontFamily: fonts.serifItalic },
  packSub: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink2, marginTop: 4 },

  aiTip: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: colors.surf, borderRadius: radii.card, padding: 16, borderWidth: 1, borderColor: colors.line },
  aiIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  aiIconText: { fontFamily: fonts.sansBold, fontSize: 10, color: '#fff', letterSpacing: 0.5 },
  aiTitle: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.5, color: colors.ink3, marginBottom: 4, textTransform: 'uppercase' },
  aiMsg: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink2, lineHeight: 20 },
});
