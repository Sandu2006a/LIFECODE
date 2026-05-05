import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import MultiRing from '../../src/components/MultiRing';
import GradientText from '../../src/components/GradientText';
import { colors, fonts, radii, gradients } from '../../src/theme';
import { lastNDays, shortDayLabel, localDateString } from '../../src/lib/dates';
import { logIntake, getState, scanMeal } from '../../src/lib/api';
import {
  fetchProtocol, getCachedProtocol, setCachedProtocol,
  computeFallbackProtocol, profileFromState, applyLiveIntake, pakSummary,
  type NutrientRow,
} from '../../src/lib/protocol';

const GRAD: [string, string, string] = ['#C62828', '#7C3AED', '#1D4ED8'];
const GRAD_ESS: [string, string] = ['#0d0d0f', '#3a3a3c'];

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type DayPct = { date: string; label: string; dayNum: number; pct: number };
type ScanResult = { meal: string; quantity_g: number; gains: { name: string; value: string; kind: 'morning' | 'essentials' | 'recovery' }[] };

function ProgressBar({ pct, kind }: { pct: number; kind: 'morning' | 'essentials' | 'recovery' }) {
  const color = kind === 'morning' ? colors.morning : kind === 'essentials' ? colors.ink : colors.recovery;
  return (
    <View style={bar.track}>
      <View style={[bar.fill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}
const bar = StyleSheet.create({
  track: { height: 5, backgroundColor: 'rgba(13,13,15,0.08)', borderRadius: 3, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3 },
});

const ID_TO_KIND: Record<string, 'morning' | 'essentials' | 'recovery'> = {};

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [displayName, setDisplayName] = useState('Athlete');
  const [morningTaken, setMorningTaken] = useState(false);
  const [essentialsTaken, setEssentialsTaken] = useState(false);
  const [recoveryTaken, setRecoveryTaken] = useState(false);
  const [weekDays, setWeekDays] = useState<DayPct[]>([]);
  const [packError, setPackError] = useState('');
  const [protocol, setProtocol] = useState<NutrientRow[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState('');

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
      const eTaken = packs.includes('essentials');
      const rTaken = packs.includes('recovery');
      setMorningTaken(mTaken);
      setEssentialsTaken(eTaken);
      setRecoveryTaken(rTaken);

      // Protocol: cached first, then API, then local fallback
      let staticProtocol: NutrientRow[] = [];
      if (p) {
        const snap = profileFromState(state);
        const cached = await getCachedProtocol(snap);
        if (cached && cached.length > 0) {
          staticProtocol = cached;
        } else {
          const r = await fetchProtocol(false);
          if (r.nutrients && r.nutrients.length > 0) {
            staticProtocol = r.nutrients;
            await setCachedProtocol(snap, r.nutrients);
          } else {
            staticProtocol = computeFallbackProtocol(snap);
            await setCachedProtocol(snap, staticProtocol);
          }
        }
      }

      const todayMeals = state.today?.meals || [];
      const live = applyLiveIntake(staticProtocol, mTaken, rTaken, todayMeals, eTaken);
      setProtocol(live);

      // Weekly chips: real per-day coverage
      const days = lastNDays(7);
      const weekPacks: Record<string, { morning: boolean; essentials: boolean; recovery: boolean }> = {};
      const weekMealsByDay: Record<string, any[]> = {};
      for (const d of days) {
        const k = localDateString(d);
        weekPacks[k] = { morning: false, essentials: false, recovery: false };
        weekMealsByDay[k] = [];
      }
      for (const it of (state.week?.intake || [])) {
        const ds = localDateString(new Date(it.taken_at));
        if (!weekPacks[ds]) continue;
        if (it.pack === 'morning') weekPacks[ds].morning = true;
        if (it.pack === 'essentials') weekPacks[ds].essentials = true;
        if (it.pack === 'recovery') weekPacks[ds].recovery = true;
      }
      for (const m of (state.week?.meals || [])) {
        const ds = localDateString(new Date(m.logged_at));
        if (weekMealsByDay[ds]) weekMealsByDay[ds].push(m);
      }
      const week: DayPct[] = days.map(d => {
        const ds = localDateString(d);
        const b = weekPacks[ds];
        const meals = weekMealsByDay[ds];
        const dayLive = applyLiveIntake(staticProtocol, b.morning, b.recovery, meals, b.essentials);
        const pct = dayLive.length > 0
          ? Math.round(dayLive.reduce((s, r) => s + r.percent, 0) / dayLive.length)
          : 0;
        return { date: ds, label: shortDayLabel(d), dayNum: d.getDate(), pct };
      });
      setWeekDays(week);
    } catch {}
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  // Per-pak coverage
  const morningSum = pakSummary(protocol, 'morning');
  const essentialsSum = pakSummary(protocol, 'essentials');
  const recoverySum = pakSummary(protocol, 'recovery');
  const morningPct = morningSum.percent;
  const essentialsPct = essentialsSum.percent;
  const recoveryPct = recoverySum.percent;
  const overall = protocol.length > 0
    ? Math.round(protocol.reduce((s, r) => s + r.percent, 0) / protocol.length)
    : 0;

  const markTaken = async (pack: 'morning' | 'essentials' | 'recovery') => {
    const already = pack === 'morning' ? morningTaken : pack === 'essentials' ? essentialsTaken : recoveryTaken;
    if (already) return;
    setPackError('');
    const result = await logIntake(pack);
    if (!result.ok) {
      setPackError(`Save failed: ${result.error}`);
      return;
    }
    if (pack === 'morning') setMorningTaken(true);
    else if (pack === 'essentials') setEssentialsTaken(true);
    else setRecoveryTaken(true);
    loadData();
  };

  const handleScan = async () => {
    setScanError('');
    setScanResult(null);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        // Fall back to library if camera denied
        const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!libPerm.granted) {
          setScanError('Camera/photo permission denied.');
          return;
        }
      }
      const result = perm.granted
        ? await ImagePicker.launchCameraAsync({
            base64: true, quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images,
          })
        : await ImagePicker.launchImageLibraryAsync({
            base64: true, quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images,
          });
      if (result.canceled || !result.assets?.[0]?.base64) return;
      const asset = result.assets[0];
      setScanning(true);
      const resp = await scanMeal(asset.base64!, asset.mimeType || 'image/jpeg');
      setScanning(false);
      if (!resp.ok) {
        setScanError(`Scan failed: ${resp.error}`);
        return;
      }
      // Build gain chips by mapping nutrient ids to category
      const gains: ScanResult['gains'] = [];
      const idMap: Record<string, 'morning' | 'essentials' | 'recovery'> = {};
      for (const r of protocol) {
        if (r.inMorning) idMap[r.id] = 'morning';
        else if (r.inEssentials) idMap[r.id] = 'essentials';
        else if (r.inRecovery) idMap[r.id] = 'recovery';
      }
      const labelMap: Record<string, string> = {
        vitamin_a: 'Vit A', vitamin_c: 'Vit C', vitamin_d3: 'Vit D3',
        vitamin_e: 'Vit E', vitamin_k2: 'Vit K2', vitamin_b12: 'B12',
        vitamin_b6: 'B6', folate: 'Folate', b_complex: 'B-Complex',
        zinc: 'Zinc', copper: 'Cu', magnesium: 'Mg', selenium: 'Se',
        iron: 'Iron', calcium: 'Ca', omega_3: 'Omega-3', potassium: 'K+',
        iodine: 'Iodine', sodium: 'Na', coq10: 'CoQ10', choline: 'Choline',
        eaa: 'EAA', creatine: 'Creatine', glutamine: 'Glutamine',
      };
      const unitMap: Record<string, string> = {
        vitamin_a: 'μg', vitamin_c: 'mg', vitamin_d3: 'μg', vitamin_e: 'mg',
        vitamin_k2: 'μg', vitamin_b12: 'μg', vitamin_b6: 'mg', folate: 'μg',
        b_complex: '%', zinc: 'mg', copper: 'mg', magnesium: 'mg',
        selenium: 'μg', iron: 'mg', calcium: 'mg', omega_3: 'mg',
        potassium: 'mg', iodine: 'μg', sodium: 'mg', coq10: 'mg',
        choline: 'mg', eaa: 'mg', creatine: 'mg', glutamine: 'mg',
      };
      const top = Object.entries(resp.nutrients || {})
        .map(([k, v]) => [k, Number(v) || 0] as [string, number])
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4);
      for (const [k, v] of top) {
        gains.push({
          name: labelMap[k] || k,
          value: `+${Math.round(v)}${unitMap[k] || ''}`,
          kind: idMap[k] || 'essentials',
        });
      }
      setScanResult({ meal: resp.meal || 'Scanned meal', quantity_g: resp.quantity_g || 100, gains });
      await loadData();
    } catch (e: any) {
      setScanning(false);
      setScanError(e?.message || 'Scan error.');
    }
  };

  const firstName = displayName.split(' ')[0];
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

          {/* Big multi-ring nutrient load */}
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.eyebrow}>Nutrient load</Text>
              <View style={s.chip}><Text style={s.chipText}>{overall}% covered</Text></View>
            </View>

            <View style={s.ringStage}>
              <MultiRing size={224} items={[
                { label: 'Morning',    pct: morningPct,    gradient: gradients.morning },
                { label: 'Essentials', pct: essentialsPct, gradient: GRAD_ESS },
                { label: 'Recovery',   pct: recoveryPct,   gradient: gradients.recovery },
              ]} />
              <View style={s.ringCenter}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <GradientText colors={GRAD} style={s.huge}>{overall}</GradientText>
                  <Text style={s.hugeUnit}>%</Text>
                </View>
                <Text style={s.ringLbl}>covered</Text>
              </View>
            </View>

            <View style={s.legendRow}>
              <View style={s.legendCell}>
                <View style={[s.legendDot, { backgroundColor: colors.morning }]} />
                <Text style={s.legendLbl}>Morning</Text>
                <Text style={[s.legendPct, { color: colors.morning }]}>{morningPct}%</Text>
              </View>
              <View style={s.legendCell}>
                <View style={[s.legendDot, { backgroundColor: colors.ink }]} />
                <Text style={s.legendLbl}>Essentials</Text>
                <Text style={s.legendPct}>{essentialsPct}%</Text>
              </View>
              <View style={s.legendCell}>
                <View style={[s.legendDot, { backgroundColor: colors.recovery }]} />
                <Text style={s.legendLbl}>Recovery</Text>
                <Text style={[s.legendPct, { color: colors.recovery }]}>{recoveryPct}%</Text>
              </View>
            </View>
          </View>

          {/* Scan a meal CTA */}
          <TouchableOpacity
            style={[s.scanCta, scanning && { opacity: 0.7 }]}
            onPress={handleScan}
            disabled={scanning}
            activeOpacity={0.85}
          >
            <View style={s.scanIcon}>
              {scanning
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={{ color: '#fff', fontSize: 22, lineHeight: 22 }}>📷</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.scanTitle}>{scanning ? 'Analyzing meal…' : 'Scan a meal'}</Text>
              <Text style={s.scanSub}>{scanning ? 'Recognizing micronutrients' : 'AI reads the photo · updates your rings'}</Text>
            </View>
            <Text style={s.scanArrow}>{scanning ? '···' : '+'}</Text>
          </TouchableOpacity>

          {!!scanError && (
            <View style={s.errBanner}><Text style={s.errBannerText}>{scanError}</Text></View>
          )}

          {scanResult && (
            <View style={s.card}>
              <View style={s.row}>
                <Text style={s.eyebrow}>Just logged</Text>
                <Text style={s.mutedSm}>just now</Text>
              </View>
              <Text style={s.scanMeal}>{scanResult.meal}{scanResult.quantity_g ? ` · ${scanResult.quantity_g}g` : ''}</Text>
              <View style={s.gainRow}>
                {scanResult.gains.map((g, i) => {
                  const c = g.kind === 'morning' ? colors.morning : g.kind === 'essentials' ? colors.ink : colors.recovery;
                  return (
                    <View key={i} style={[s.gainChip, { borderColor: c, backgroundColor: c + '12' }]}>
                      <Text style={[s.gainVal, { color: c }]}>{g.value}</Text>
                      <Text style={s.gainName}>{g.name}</Text>
                    </View>
                  );
                })}
              </View>
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
              <Text style={s.packTime}>{morningTaken ? 'Taken ✓' : 'Take before 10:00'}</Text>
              <Text style={[s.eyebrow, { color: colors.morning }]}>Morning</Text>
            </View>
            <Text style={s.packTitle}>Morning Pack <Text style={s.em}>—</Text></Text>
            <Text style={s.packSub}>Activate. Focus. Perform.</Text>
            <View style={{ marginTop: 16 }}><ProgressBar pct={morningTaken ? 100 : morningPct} kind="morning" /></View>
          </TouchableOpacity>

          {/* Essentials pack */}
          <TouchableOpacity
            style={[s.packCard, { borderColor: essentialsTaken ? 'rgba(13,13,15,0.35)' : 'rgba(13,13,15,0.1)' }]}
            onPress={() => markTaken('essentials')}
            activeOpacity={0.8}
          >
            <View style={s.row}>
              <Text style={s.packTime}>{essentialsTaken ? 'Taken ✓' : 'Anytime · with food'}</Text>
              <Text style={[s.eyebrow, { color: colors.ink }]}>Essentials</Text>
            </View>
            <Text style={s.packTitle}>Essentials Pack <Text style={s.em}>—</Text></Text>
            <Text style={s.packSub}>Iron · Calcium · Omega-3 · daily core.</Text>
            <View style={{ marginTop: 16 }}><ProgressBar pct={essentialsTaken ? 100 : essentialsPct} kind="essentials" /></View>
          </TouchableOpacity>

          {/* Recovery pack */}
          <TouchableOpacity
            style={[s.packCard, { borderColor: recoveryTaken ? 'rgba(74,58,168,0.35)' : 'rgba(74,58,168,0.1)' }]}
            onPress={() => markTaken('recovery')}
            activeOpacity={0.8}
          >
            <View style={s.row}>
              <Text style={s.packTime}>{recoveryTaken ? 'Taken ✓' : 'Within 45 min of training'}</Text>
              <Text style={[s.eyebrow, { color: colors.recovery }]}>Recovery</Text>
            </View>
            <Text style={s.packTitle}>Recovery Pack <Text style={s.em}>—</Text></Text>
            <Text style={s.packSub}>Recover. Restore. Reset.</Text>
            <View style={{ marginTop: 16 }}><ProgressBar pct={recoveryTaken ? 100 : recoveryPct} kind="recovery" /></View>
          </TouchableOpacity>

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
  mutedSm: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3 },

  ringStage: { alignItems: 'center', justifyContent: 'center', marginVertical: 4 },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  huge: { fontFamily: fonts.serifItalic, fontSize: 52, lineHeight: 56 },
  hugeUnit: { fontFamily: fonts.serifItalic, fontSize: 24, color: colors.ink3, marginLeft: 2 },
  ringLbl: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 1.2, color: colors.ink3, textTransform: 'uppercase', marginTop: 4 },

  legendRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, marginTop: 14 },
  legendCell: { alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLbl: { fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 0.6, color: colors.ink3, textTransform: 'uppercase' },
  legendPct: { fontFamily: fonts.serifItalic, fontSize: 18, color: colors.ink },

  scanCta: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.ink, borderRadius: radii.card,
    paddingHorizontal: 18, paddingVertical: 16,
  },
  scanIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  scanTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: '#fff' },
  scanSub: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  scanArrow: { fontFamily: fonts.sansBold, fontSize: 24, color: '#fff', marginLeft: 4 },

  scanMeal: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink, marginBottom: 10 },
  gainRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gainChip: { flexDirection: 'row', alignItems: 'baseline', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill, borderWidth: 1 },
  gainVal: { fontFamily: fonts.sansBold, fontSize: 13 },
  gainName: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink2 },

  packCard: { backgroundColor: colors.surf, borderRadius: radii.card, padding: 22, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 24, elevation: 2 },
  packTime: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3 },
  packTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.ink, marginTop: 12 },
  em: { fontFamily: fonts.serifItalic },
  packSub: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink2, marginTop: 4 },

  errBanner: { backgroundColor: 'rgba(229,85,85,0.10)', borderWidth: 1, borderColor: 'rgba(229,85,85,0.35)', borderRadius: 12, padding: 12 },
  errBannerText: { fontFamily: fonts.sansMedium, fontSize: 13, color: '#c43030' },
});
