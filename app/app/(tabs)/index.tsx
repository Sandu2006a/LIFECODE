import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MultiRing from '../../src/components/MultiRing';
import GradientText from '../../src/components/GradientText';
import { colors, fonts, radii, gradients } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';
import { ensureSession, authHeaders } from '../../src/lib/session';
import { lastNDays, shortDayLabel, localDateString } from '../../src/lib/dates';
import {
  MORNING_NUTRIENTS, RECOVERY_NUTRIENTS, DEFAULT_TARGETS, calcProgress,
} from '../../src/lib/nutrients';
import { getSuggestions, type Suggestion } from '../../src/lib/suggestions';
import { logIntake, logMeal, getState } from '../../src/lib/api';

const GRAD: [string, string, string] = ['#C62828', '#7C3AED', '#1D4ED8'];
const API_URL = 'https://web-zeta-lyart-53.vercel.app';

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

type DayPct = { date: string; label: string; dayNum: number; pct: number };

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

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [morningTaken, setMorningTaken] = useState(false);
  const [recoveryTaken, setRecoveryTaken] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [aiTip, setAiTip] = useState('');
  const [weekDays, setWeekDays] = useState<DayPct[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [progress, setProgress] = useState<Record<string, { current: number; target: number; pct: number }>>({});
  const [microTargets, setMicroTargets] = useState<Record<string, number>>(DEFAULT_TARGETS);

  // quick-log modal state
  const [logOpen, setLogOpen] = useState(false);
  const [logFood, setLogFood] = useState('');
  const [logQty, setLogQty] = useState('');
  const [logBusy, setLogBusy] = useState(false);
  const [logError, setLogError] = useState('');

  const today = new Date();
  const dateLabel = `${DAYS_SHORT[today.getDay()]} · ${MONTHS[today.getMonth()]} ${today.getDate()}`;
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const computeDayPct = (
    morning: boolean,
    recovery: boolean,
    nutrients: Record<string, number>,
    targets: Record<string, number>
  ): number => {
    const prog = calcProgress(morning, recovery, nutrients, targets);
    const all = [...MORNING_NUTRIENTS, ...RECOVERY_NUTRIENTS];
    const sum = all.reduce((s, n) => s + (prog[n.key]?.pct ?? 0), 0);
    return Math.round(sum / all.length);
  };

  const loadData = async () => {
    try {
      const { userId: uid, accessToken } = await ensureSession();
      if (!uid) { setLoadingTargets(false); return; }
      setUserId(uid);

      const headers = authHeaders(accessToken);
      const state = await getState();
      if (!state) { setLoadingTargets(false); return; }

      const intakeRes = { data: state.today?.intake || [] };
      const mealsRes = { data: state.today?.meals || [] };

      const p = state.profile;
      if (p) {
        setProfile({
          display_name: p.display_name || p.full_name || 'Athlete',
          goal: p.goal || '',
          calories_target: p.calories_target || 0,
          protein_target: p.protein_target || 0,
          carbs_target: p.carbs_target || 0,
          fats_target: p.fats_target || 0,
        });

        if (p.calories_target && p.calories_target > 0) {
          const name = p.display_name || p.full_name || 'Athlete';
          setAiTip(buildTip(name.split(' ')[0], p.goal, p.calories_target, p.protein_target));
        }

        if ((!p.calories_target || p.calories_target === 0) && p.age && p.weight_kg && p.height_cm) {
          const nm = p.display_name || p.full_name || 'Athlete';
          const lvlMap: Record<string, string> = { amateur: 'Amateur', competitive: 'Competitive', elite: 'Elite / Pro' };
          const lvl = lvlMap[p.goal || ''] || 'Competitive';
          fetch(`${API_URL}/api/analyze-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({
              user_id: uid, name: nm,
              age: p.age, height: p.height_cm, weight: p.weight_kg,
              gender: p.gender || 'male', sport: (p as any).sport || 'General Athletics', result: lvl,
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

        if (!p.micro_targets && p.age && p.weight_kg && p.height_cm) {
          fetch(`${API_URL}/api/analyze-nutrients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({
              user_id: uid, age: p.age, height: p.height_cm,
              weight: p.weight_kg, gender: p.gender || 'male', level: p.goal || 'competitive',
            }),
          }).then(r => r.json()).then(d => {
            if (d.targets) setMicroTargets(d.targets);
          }).catch(() => {});
        }
      }

      const targets: Record<string, number> = (p && (p as any).micro_targets) || DEFAULT_TARGETS;
      setMicroTargets(targets);

      const packs = (intakeRes.data || []).map((l: any) => l.pack);
      const mTaken = packs.includes('morning');
      const rTaken = packs.includes('recovery');
      setMorningTaken(mTaken);
      setRecoveryTaken(rTaken);

      const meals = mealsRes.data || [];
      const accumulated: Record<string, number> = {};
      for (const meal of meals) {
        for (const [k, v] of Object.entries(meal.nutrients || {})) {
          accumulated[k] = (accumulated[k] || 0) + (v as number);
        }
      }
      const prog = calcProgress(mTaken, rTaken, accumulated, targets);
      setProgress(prog);
      setSuggestions(getSuggestions(prog, 4));

      // Weekly view: from state.week
      const days = lastNDays(7);
      const dayBuckets: Record<string, { morning: boolean; recovery: boolean; nutrients: Record<string, number> }> = {};
      for (const d of days) {
        dayBuckets[localDateString(d)] = { morning: false, recovery: false, nutrients: {} };
      }
      for (const it of (state.week?.intake || [])) {
        const ds = localDateString(new Date(it.taken_at));
        if (!dayBuckets[ds]) continue;
        if (it.pack === 'morning') dayBuckets[ds].morning = true;
        if (it.pack === 'recovery') dayBuckets[ds].recovery = true;
      }
      for (const m of (state.week?.meals || [])) {
        const ds = localDateString(new Date(m.logged_at));
        if (!dayBuckets[ds]) continue;
        for (const [k, v] of Object.entries(m.nutrients || {})) {
          dayBuckets[ds].nutrients[k] = (dayBuckets[ds].nutrients[k] || 0) + (v as number);
        }
      }
      const week: DayPct[] = days.map(d => {
        const ds = localDateString(d);
        const b = dayBuckets[ds];
        return {
          date: ds,
          label: shortDayLabel(d),
          dayNum: d.getDate(),
          pct: computeDayPct(b.morning, b.recovery, b.nutrients, targets),
        };
      });
      setWeekDays(week);

      setLoadingTargets(false);
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

  const [packError, setPackError] = useState('');
  const markTaken = async (pack: 'morning' | 'recovery') => {
    const already = pack === 'morning' ? morningTaken : recoveryTaken;
    if (already) return;
    setPackError('');
    const result = await logIntake(pack);
    if (!result.ok) {
      setPackError(`Save failed: ${result.error}`);
      return;
    }
    if (pack === 'morning') setMorningTaken(true);
    else setRecoveryTaken(true);
    loadData();
  };

  const openQuickLog = (s: Suggestion) => {
    setLogFood(s.food);
    setLogQty(String(s.defaultQty));
    setLogError('');
    setLogOpen(true);
  };

  const submitQuickLog = async () => {
    const name = logFood.trim();
    if (!name) { setLogError('Enter a food name.'); return; }
    const qty = parseInt(logQty) || 100;
    setLogBusy(true);
    setLogError('');
    const result = await logMeal(name, qty);
    setLogBusy(false);
    if (!result.ok) {
      setLogError(`Save failed: ${result.error}`);
      return;
    }
    setLogOpen(false);
    setLogFood(''); setLogQty('');
    await loadData();
  };

  const firstName = (profile?.display_name || 'Athlete').split(' ')[0];
  const hasTargets = profile && profile.calories_target > 0;
  const todayStr = localDateString();

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

          {/* Weekly chips */}
          {weekDays.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.weekRow}>
              {weekDays.map(d => {
                const isToday = d.date === todayStr;
                return (
                  <View key={d.date} style={[s.weekChip, isToday && s.weekChipToday]}>
                    <Text style={[s.weekDay, isToday && s.weekDayToday]}>{d.label}</Text>
                    <Text style={[s.weekNum, isToday && s.weekNumToday]}>{d.dayNum}</Text>
                    <View style={s.weekBar}>
                      <View style={[s.weekFill, {
                        width: `${d.pct}%` as any,
                        backgroundColor: d.pct >= 80 ? '#16a34a' : d.pct >= 50 ? colors.morning : colors.ink4,
                      }]} />
                    </View>
                    <Text style={[s.weekPct, isToday && s.weekPctToday]}>{d.pct}%</Text>
                  </View>
                );
              })}
            </ScrollView>
          )}

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

          {/* Smart suggestions */}
          {suggestions.length > 0 && (
            <View style={s.card}>
              <View style={s.row}>
                <Text style={s.eyebrow}>AI Suggestions</Text>
                <View style={[s.chip, { backgroundColor: 'rgba(226,106,31,0.10)' }]}>
                  <Text style={[s.chipText, { color: colors.morning }]}>Tap to log</Text>
                </View>
              </View>
              {suggestions.map(sug => (
                <TouchableOpacity key={sug.nutrientKey} style={s.suggRow} onPress={() => openQuickLog(sug)} activeOpacity={0.7}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.suggTitle}>
                      {sug.nutrientName} <Text style={s.suggPct}>{sug.pct}%</Text>
                    </Text>
                    <Text style={s.suggBody}>
                      Try {sug.defaultQty}g {sug.food} → +{sug.estimatedGain}{sug.unit} ({sug.reason})
                    </Text>
                  </View>
                  <View style={s.suggArrow}><Text style={s.suggArrowTxt}>+</Text></View>
                </TouchableOpacity>
              ))}
            </View>
          )}

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
                <MacroBar label="Calories" value={profile!.calories_target} unit="kcal" color="#C62828" pct={75} />
                <MacroBar label="Protein" value={profile!.protein_target} unit="g" color="#7C3AED" pct={60} />
                <MacroBar label="Carbohydrates" value={profile!.carbs_target} unit="g" color="#1D4ED8" pct={50} />
                <MacroBar label="Fats" value={profile!.fats_target} unit="g" color="#059669" pct={45} />
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

          {!!packError && (
            <View style={s.errBanner}>
              <Text style={s.errBannerText}>{packError}</Text>
            </View>
          )}

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

      {/* Quick-log modal */}
      <Modal visible={logOpen} transparent animationType="slide" onRequestClose={() => setLogOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalRoot}>
          <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={() => setLogOpen(false)} />
          <View style={s.modalCard}>
            <Text style={s.modalEyebrow}>Quick Log</Text>
            <Text style={s.modalTitle}>What did you eat?</Text>
            <View style={s.modalInputRow}>
              <TextInput
                style={s.modalInput}
                placeholder="e.g. orange"
                placeholderTextColor={colors.ink3}
                value={logFood}
                onChangeText={v => { setLogFood(v); setLogError(''); }}
                editable={!logBusy}
              />
              <TextInput
                style={s.modalInputQty}
                placeholder="g"
                placeholderTextColor={colors.ink3}
                value={logQty}
                onChangeText={setLogQty}
                keyboardType="numeric"
                editable={!logBusy}
                maxLength={5}
              />
            </View>
            {!!logError && <Text style={s.modalErr}>{logError}</Text>}
            <TouchableOpacity
              style={[s.modalBtn, { backgroundColor: logFood.trim() && !logBusy ? colors.ink : colors.ink4 }]}
              onPress={submitQuickLog}
              disabled={!logFood.trim() || logBusy}
            >
              {logBusy ? <ActivityIndicator color="#fff" /> : <Text style={s.modalBtnTxt}>Analyze & log</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLogOpen(false)} style={{ paddingVertical: 8 }}>
              <Text style={s.modalCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  weekRow: { gap: 8, paddingBottom: 4 },
  weekChip: { width: 56, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 14, backgroundColor: colors.surf, borderWidth: 1, borderColor: colors.line, alignItems: 'center', gap: 4 },
  weekChipToday: { borderColor: colors.ink, borderWidth: 1.5 },
  weekDay: { fontFamily: fonts.sansSemiBold, fontSize: 9, letterSpacing: 0.6, color: colors.ink3, textTransform: 'uppercase' },
  weekDayToday: { color: colors.ink },
  weekNum: { fontFamily: fonts.serifItalic, fontSize: 18, color: colors.ink2 },
  weekNumToday: { color: colors.ink },
  weekBar: { height: 3, width: '100%', backgroundColor: 'rgba(13,13,15,0.06)', borderRadius: 2, overflow: 'hidden', marginTop: 2 },
  weekFill: { height: 3, borderRadius: 2 },
  weekPct: { fontFamily: fonts.sansMedium, fontSize: 10, color: colors.ink3 },
  weekPctToday: { color: colors.ink2 },

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

  suggRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(13,13,15,0.05)', gap: 12 },
  suggTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  suggPct: { color: colors.morning, fontFamily: fonts.sansMedium, fontSize: 13 },
  suggBody: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3, marginTop: 3, lineHeight: 16 },
  suggArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(226,106,31,0.10)', alignItems: 'center', justifyContent: 'center' },
  suggArrowTxt: { fontFamily: fonts.sansSemiBold, fontSize: 18, color: colors.morning, marginTop: -2 },

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

  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCard: { backgroundColor: colors.surf, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 28, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 14 },
  modalEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.ink3, textTransform: 'uppercase' },
  modalTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.ink },
  modalInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 6 },
  modalInput: { flex: 1, fontFamily: fonts.sans, fontSize: 16, color: colors.ink, paddingVertical: 6 },
  modalInputQty: { width: 60, textAlign: 'right', fontFamily: fonts.sans, fontSize: 16, color: colors.ink, paddingVertical: 6 },
  modalErr: { fontFamily: fonts.sans, fontSize: 13, color: '#e55' },
  modalBtn: { paddingVertical: 14, borderRadius: radii.pill, alignItems: 'center' },
  modalBtnTxt: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: '#fff', letterSpacing: 0.5 },
  modalCancel: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink3, textAlign: 'center' },

  errBanner: { backgroundColor: 'rgba(229,85,85,0.10)', borderWidth: 1, borderColor: 'rgba(229,85,85,0.35)', borderRadius: 12, padding: 12 },
  errBannerText: { fontFamily: fonts.sansMedium, fontSize: 13, color: '#c43030' },
});
