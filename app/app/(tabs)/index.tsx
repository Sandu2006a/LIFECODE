import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MultiRing from '../../src/components/MultiRing';
import GradientText from '../../src/components/GradientText';
import { colors, fonts, radii, gradients } from '../../src/theme';
import { lastNDays, shortDayLabel, localDateString } from '../../src/lib/dates';
import { logIntake, getState } from '../../src/lib/api';
import {
  fetchProtocol, getCachedProtocol, setCachedProtocol,
  computeFallbackProtocol, profileFromState, type NutrientRow,
} from '../../src/lib/protocol';

const GRAD: [string, string, string] = ['#C62828', '#7C3AED', '#1D4ED8'];

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type DayPct = { date: string; label: string; dayNum: number; pct: number };

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
  const [displayName, setDisplayName] = useState('Athlete');
  const [morningTaken, setMorningTaken] = useState(false);
  const [recoveryTaken, setRecoveryTaken] = useState(false);
  const [weekDays, setWeekDays] = useState<DayPct[]>([]);
  const [packError, setPackError] = useState('');
  const [protocol, setProtocol] = useState<NutrientRow[]>([]);

  const today = new Date();
  const dateLabel = `${DAYS_SHORT[today.getDay()]} · ${MONTHS[today.getMonth()]} ${today.getDate()}`;
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const loadData = async () => {
    try {
      const state = await getState();
      if (!state) return;

      const p = state.profile;
      const fallbackName = p?.display_name || p?.full_name
        || (p?.email ? String(p.email).split('@')[0] : '')
        || 'Athlete';
      setDisplayName(fallbackName);

      const intake = state.today?.intake || [];
      const packs = intake.map((l: any) => l.pack);
      const mTaken = packs.includes('morning');
      const rTaken = packs.includes('recovery');
      setMorningTaken(mTaken);
      setRecoveryTaken(rTaken);

      // Weekly chips (purely pack-based since we removed meals)
      const days = lastNDays(7);
      const weekPacks: Record<string, { morning: boolean; recovery: boolean }> = {};
      for (const d of days) weekPacks[localDateString(d)] = { morning: false, recovery: false };
      for (const it of (state.week?.intake || [])) {
        const ds = localDateString(new Date(it.taken_at));
        if (!weekPacks[ds]) continue;
        if (it.pack === 'morning') weekPacks[ds].morning = true;
        if (it.pack === 'recovery') weekPacks[ds].recovery = true;
      }
      const week: DayPct[] = days.map(d => {
        const ds = localDateString(d);
        const b = weekPacks[ds];
        const pct = (b.morning ? 50 : 0) + (b.recovery ? 50 : 0);
        return {
          date: ds, label: shortDayLabel(d), dayNum: d.getDate(), pct,
        };
      });
      setWeekDays(week);

      // Protocol: cached first, then API, then local fallback
      if (p) {
        const snap = profileFromState(state);
        const cached = await getCachedProtocol(snap);
        if (cached && cached.length > 0) {
          setProtocol(cached);
        } else {
          const r = await fetchProtocol(false);
          if (r.nutrients && r.nutrients.length > 0) {
            setProtocol(r.nutrients);
            await setCachedProtocol(snap, r.nutrients);
          } else {
            const fb = computeFallbackProtocol(snap);
            setProtocol(fb);
            await setCachedProtocol(snap, fb);
          }
        }
      }
    } catch {}
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

  const firstName = displayName.split(' ')[0];
  const todayStr = localDateString();

  // Suggestions: nutrients with status 'gap' or low 'partial' (top 4)
  const suggestions = protocol
    .filter(r => r.status === 'gap' || (r.status === 'partial' && r.percent < 60))
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 4);

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
                        backgroundColor: d.pct >= 100 ? '#16a34a' : d.pct >= 50 ? colors.morning : colors.ink4,
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

          {/* AI Suggestions (read-only tips, no log) */}
          {suggestions.length > 0 && (
            <View style={s.card}>
              <View style={s.row}>
                <Text style={s.eyebrow}>AI Suggestions</Text>
                <View style={[s.chip, { backgroundColor: 'rgba(226,106,31,0.10)' }]}>
                  <Text style={[s.chipText, { color: colors.morning }]}>{suggestions.length} gaps</Text>
                </View>
              </View>
              {suggestions.map(sug => {
                const accent = sug.status === 'gap' ? '#e55' : colors.morning;
                return (
                  <View key={sug.id} style={s.suggRow}>
                    <View style={[s.suggDot, { backgroundColor: accent }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.suggTitle}>
                        {sug.name} <Text style={[s.suggPct, { color: accent }]}>{sug.percent}%</Text>
                      </Text>
                      <Text style={s.suggBody}>
                        Gap: {sug.gap}{sug.unit} · Eat: {sug.foodTip}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

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

          {/* Coach insight */}
          <View style={s.aiTip}>
            <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.aiIcon}>
              <Text style={s.aiIconText}>AI</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={s.aiTitle}>Coach Insight</Text>
              <Text style={s.aiMsg}>
                Tap Track to see your full personalized protocol — every nutrient calibrated to your sport, weight, and training load. Open Ask anytime for tactical advice.
              </Text>
            </View>
          </View>

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
  suggDot: { width: 8, height: 8, borderRadius: 4 },
  suggTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  suggPct: { fontFamily: fonts.sansMedium, fontSize: 13 },
  suggBody: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3, marginTop: 3, lineHeight: 16 },

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

  errBanner: { backgroundColor: 'rgba(229,85,85,0.10)', borderWidth: 1, borderColor: 'rgba(229,85,85,0.35)', borderRadius: 12, padding: 12 },
  errBannerText: { fontFamily: fonts.sansMedium, fontSize: 13, color: '#c43030' },
});
