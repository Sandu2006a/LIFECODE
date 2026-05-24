import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../src/components/Icon';
import { colors, fonts, gradients, radii, shadows } from '../src/theme';
import { supabase } from '../src/lib/supabase';
import { fetchDailyTotals, DailyTotals, Section, NutrientTarget } from '../src/lib/dailyTotals';
import { ensureSession } from '../src/lib/session';

type Tab = Section;

const TABS: { id: Tab; label: string }[] = [
  { id: 'morning',    label: 'Morning'    },
  { id: 'essentials', label: 'Essentials' },
  { id: 'recovery',   label: 'Recovery'   },
];

const SECTION_HELP: Record<Tab, string> = {
  morning:    'Activation + focus + sustained energy. Mostly Morning Pack + dietary intake.',
  essentials: 'Critical micros not in current packs. From food + 3rd-party supplements.',
  recovery:   'Repair + sleep + cortisol. Mostly Recovery Pack + PM stack.',
};

export default function DetailsScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const dateParam = typeof params.date === 'string' ? params.date : undefined;
  const [tab, setTab] = useState<Tab>('morning');
  const [totals, setTotals] = useState<DailyTotals | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { userId } = await ensureSession();
      if (!userId) { console.log('[details] no auth session'); return; }
      const t = await fetchDailyTotals(userId, dateParam);
      setTotals(t);
    } catch (e: any) {
      console.log('[details] load failed:', e?.message);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const sectionPct = totals
    ? tab === 'morning' ? totals.morningPct
    : tab === 'essentials' ? totals.essentialsPct
    : totals.recoveryPct
    : 0;

  const rows = totals?.bySection[tab] || [];
  const tabGradient = tab === 'morning' ? gradients.morning : tab === 'recovery' ? gradients.recovery : null;
  const accentColor = tab === 'morning' ? colors.morning : tab === 'recovery' ? colors.recovery : colors.ink;

  const profileSummary = totals
    ? `${totals.profile.weightKg}kg · ${totals.profile.age}yo · ${totals.profile.sex} · ${totals.profile.sportType.toLowerCase()} · ${totals.profile.intensity.toLowerCase()} · ${totals.profile.trainingHours}h/wk`
    : '';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.top}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <Icon name="x" size={18} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Nutrient details</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={s.tabBar}>
        {TABS.map(t => {
          const active = t.id === tab;
          const isMorning  = t.id === 'morning';
          const isRecovery = t.id === 'recovery';
          return (
            <TouchableOpacity
              key={t.id}
              style={[s.tab, active && s.tabActive]}
              onPress={() => setTab(t.id)}
              activeOpacity={0.7}
            >
              {active && (isMorning || isRecovery) && (
                <LinearGradient
                  colors={(isMorning ? gradients.morning : gradients.recovery) as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
                />
              )}
              {active && !isMorning && !isRecovery && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.ink, borderRadius: 999 }]} />
              )}
              <Text style={[s.tabText, active && s.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.ink3} />}
      >
        <View style={s.overview}>
          <Text style={s.eyebrow}>{tab.toUpperCase()} COVERAGE</Text>
          <View style={s.overviewRow}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Text style={s.overviewPct}>{sectionPct}</Text>
              <Text style={s.overviewPctUnit}>%</Text>
            </View>
            <Text style={s.overviewHelper}>{SECTION_HELP[tab]}</Text>
          </View>
          <View style={s.overviewBar}>
            {tabGradient ? (
              <LinearGradient
                colors={tabGradient as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[s.overviewBarFill, { width: `${sectionPct}%` as any }]}
              />
            ) : (
              <View style={[s.overviewBarFill, { width: `${sectionPct}%` as any, backgroundColor: colors.ink }]} />
            )}
          </View>
          {!!profileSummary && (
            <View style={s.profileChip}>
              <Icon name="user" size={11} color={colors.ink3} strokeWidth={2} />
              <Text style={s.profileChipText}>{profileSummary}</Text>
            </View>
          )}
        </View>

        <View style={s.list}>
          {rows.length === 0 ? (
            <Text style={{ padding: 20, textAlign: 'center', color: colors.ink3, fontFamily: fonts.sans }}>Loading…</Text>
          ) : rows.map((row, idx) => (
            <NutrientRow key={row.id} row={row} accent={accentColor} gradient={tabGradient} isLast={idx === rows.length - 1} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function NutrientRow({ row, accent, gradient, isLast }: { row: NutrientTarget; accent: string; gradient: string[] | null; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  const fromPack = row.fromMorningPack + row.fromRecoveryPack;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(!open)} style={[s.row, !isLast && s.rowBorder]}>
      <View style={s.rowHead}>
        <View style={{ flex: 1 }}>
          <Text style={s.rowName}>{row.name}</Text>
          <Text style={s.rowSub}>{fmt(row.consumed)} / {fmt(row.target)} {row.unit}</Text>
        </View>
        <Text style={[s.rowPct, { color: accent }]}>{row.pct}%</Text>
        <Text style={[s.chev, { transform: [{ rotate: open ? '90deg' : '0deg' }] }]}>›</Text>
      </View>
      <View style={s.barTrack}>
        {gradient ? (
          <LinearGradient
            colors={gradient as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[s.barFill, { width: `${row.pct}%` as any }]}
          />
        ) : (
          <View style={[s.barFill, { width: `${row.pct}%` as any, backgroundColor: accent }]} />
        )}
      </View>
      {open && (
        <View style={s.expand}>
          {row.morningPack > 0 && (
            <View style={s.expandRow}>
              <Text style={s.expandLbl}>Morning Pack</Text>
              <Text style={[s.expandVal, row.fromMorningPack > 0 && { color: colors.morning }]}>
                {row.fromMorningPack > 0 ? `+${fmt(row.fromMorningPack)}` : `${fmt(row.morningPack)}`} {row.unit}{row.fromMorningPack > 0 ? '' : ' (not taken)'}
              </Text>
            </View>
          )}
          {row.recoveryPack > 0 && (
            <View style={s.expandRow}>
              <Text style={s.expandLbl}>Recovery Pack</Text>
              <Text style={[s.expandVal, row.fromRecoveryPack > 0 && { color: colors.recovery }]}>
                {row.fromRecoveryPack > 0 ? `+${fmt(row.fromRecoveryPack)}` : `${fmt(row.recoveryPack)}`} {row.unit}{row.fromRecoveryPack > 0 ? '' : ' (not taken)'}
              </Text>
            </View>
          )}
          <View style={s.expandRow}>
            <Text style={s.expandLbl}>From food</Text>
            <Text style={s.expandVal}>{fmt(row.fromFood)} {row.unit}</Text>
          </View>
          <View style={s.expandRow}>
            <Text style={s.expandLbl}>Target (personalised)</Text>
            <Text style={s.expandVal}>{fmt(row.target)} {row.unit}</Text>
          </View>
          {!!row.foodTip && <Text style={s.foodTip}>💡 {row.foodTip}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

function fmt(v: number): string {
  if (v === 0) return '0';
  if (v < 1)  return v.toFixed(2).replace(/\.?0+$/, '');
  if (v < 10) return v.toFixed(1).replace(/\.0$/, '');
  return Math.round(v).toString();
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 12 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surf, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: fonts.serifItalic, fontSize: 20, color: colors.ink },

  tabBar: { flexDirection: 'row', marginHorizontal: 22, marginBottom: 12, padding: 4, backgroundColor: 'rgba(13,13,15,0.05)', borderRadius: 999, gap: 4 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 999, overflow: 'hidden' },
  tabActive: {},
  tabText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink2 },
  tabTextActive: { color: '#fff', fontFamily: fonts.sansSemiBold },

  scroll: { paddingHorizontal: 22, paddingBottom: 40, gap: 14 },

  overview: { backgroundColor: colors.surf, borderRadius: radii.card, padding: 18, borderWidth: 1, borderColor: colors.line, gap: 12, ...shadows.card },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 2.2, color: colors.ink3, textTransform: 'uppercase' },
  overviewRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 },
  overviewPct: { fontFamily: fonts.serifItalic, fontSize: 56, lineHeight: 56, color: colors.ink, letterSpacing: -2 },
  overviewPctUnit: { fontFamily: fonts.serifItalic, fontSize: 22, color: colors.ink3, marginTop: 8 },
  overviewHelper: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.ink3, marginBottom: 8 },
  overviewBar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(13,13,15,0.06)', overflow: 'hidden' },
  overviewBarFill: { height: '100%', borderRadius: 3 },
  profileChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4 },
  profileChipText: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3, letterSpacing: 0.2 },

  warn: { backgroundColor: '#FEF2F2', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(220,38,38,0.25)', gap: 4 },
  warnTitle: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: '#DC2626' },
  warnText: { fontFamily: fonts.sans, fontSize: 12, color: '#7F1D1D' },

  list: { backgroundColor: colors.surf, borderRadius: radii.card, paddingHorizontal: 18, borderWidth: 1, borderColor: colors.line, ...shadows.card },
  row: { paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(13,13,15,0.05)' },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowName: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
  rowSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3, marginTop: 2 },
  rowPct: { fontFamily: fonts.sansSemiBold, fontSize: 14, minWidth: 42, textAlign: 'right' },
  chev: { fontFamily: fonts.sans, fontSize: 18, color: colors.ink3, marginLeft: 2 },

  barTrack: { height: 4, backgroundColor: 'rgba(13,13,15,0.06)', borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2 },

  expand: { backgroundColor: 'rgba(13,13,15,0.03)', borderRadius: 10, padding: 12, marginTop: 10, gap: 6 },
  expandRow: { flexDirection: 'row', justifyContent: 'space-between' },
  expandLbl: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.5, color: colors.ink3 },
  expandVal: { fontFamily: fonts.serifItalic, fontSize: 13, color: colors.ink },
  foodTip: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink2, marginTop: 4, fontStyle: 'italic' },
});
