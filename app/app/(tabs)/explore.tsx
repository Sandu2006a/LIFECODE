import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Ring from '../../src/components/Ring';
import { colors, fonts, radii, gradients } from '../../src/theme';
import { getState } from '../../src/lib/api';
import {
  fetchProtocol, getCachedProtocol, setCachedProtocol,
  computeFallbackProtocol, sortNutrients, pakSummary, applyLiveIntake,
  profileFromState, type NutrientRow, type ProfileSnapshot,
} from '../../src/lib/protocol';

type Filter = 'all' | 'morning' | 'recovery';

const STATUS_COLOR: Record<NutrientRow['status'], string> = {
  covered: '#16a34a',
  partial: '#e26a1f',
  gap: '#e55',
};
const STATUS_LABEL: Record<NutrientRow['status'], string> = {
  covered: 'covered',
  partial: 'partial',
  gap: 'gap',
};

function PakCard({
  label, percent, count, active, accent, gradient, onPress,
}: {
  label: string;
  percent: number;
  count: number;
  active: boolean;
  accent: string;
  gradient: string[];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[s.pak, { borderColor: active ? accent : colors.line }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Text style={[s.pakLabel, { color: accent }]}>{label}</Text>
      <View style={s.pakRingWrap}>
        <Ring size={92} stroke={5} pct={percent} gradient={gradient} id={`pak-${label}`} />
        <View style={s.pakRingCenter}>
          <Text style={[s.pakPct, { color: accent }]}>{percent}%</Text>
        </View>
      </View>
      <Text style={s.pakSub}>{count} nutrients</Text>
      {active && <View style={[s.pakActiveDot, { backgroundColor: accent }]} />}
    </TouchableOpacity>
  );
}

function NutrientCard({ row, filter }: { row: NutrientRow; filter: Filter }) {
  const isOrphan = !row.inMorning && !row.inRecovery;
  const barColor = isOrphan ? '#e55' : STATUS_COLOR[row.status];
  const widthPct = isOrphan ? 0 : row.percent;
  const sourceLabel =
    row.inMorning && row.inRecovery ? 'Both Paks' :
    row.inMorning ? 'Morning Pak' :
    row.inRecovery ? 'Recovery Pak' :
    'Not in supplements';

  const accent =
    filter === 'morning' && row.inMorning ? colors.morning :
    filter === 'recovery' && row.inRecovery ? colors.recovery :
    null;

  return (
    <View style={[s.nutCard, accent && { borderColor: accent, borderWidth: 1.5 }]}>
      <View style={s.nutHeadRow}>
        <Text style={s.nutName}>{row.name}</Text>
        <Text style={s.nutAmount}>
          {row.total.toLocaleString()} / {row.dailyTarget.toLocaleString()} {row.unit}
        </Text>
      </View>

      <View style={s.barTrack}>
        <View style={[s.barFill, { width: `${widthPct}%` as any, backgroundColor: barColor }]} />
      </View>

      <View style={s.nutMetaRow}>
        <Text style={s.nutMeta}>
          <Text style={[s.nutPct, { color: barColor }]}>{widthPct}%</Text>
          {'  ·  '}{sourceLabel}{!isOrphan && row.gap > 0 ? `  ·  Gap: ${row.gap}${row.unit}` : ''}
        </Text>
        <View style={[s.nutBadge, { backgroundColor: barColor + '22', borderColor: barColor }]}>
          <Text style={[s.nutBadgeText, { color: barColor }]}>
            {isOrphan ? 'gap' : STATUS_LABEL[row.status]}
          </Text>
        </View>
      </View>

      {!!row.foodTip && (
        <Text style={s.nutTip}>Eat: {row.foodTip}</Text>
      )}
    </View>
  );
}

export default function ProtocolScreen() {
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState('');
  const [nutrients, setNutrients] = useState<NutrientRow[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [snap, setSnap] = useState<ProfileSnapshot | null>(null);

  const loadProtocol = async (force = false) => {
    setError('');
    if (force) setRecalculating(true); else setLoading(true);

    const state = await getState();
    if (!state || !state.profile) {
      setError('Complete your profile first.');
      setLoading(false); setRecalculating(false);
      return;
    }
    const profileSnap = profileFromState(state);
    setSnap(profileSnap);

    let staticProtocol: NutrientRow[] | null = null;

    if (!force) {
      const cached = await getCachedProtocol(profileSnap);
      if (cached && cached.length > 0) staticProtocol = cached;
    }

    if (!staticProtocol) {
      const result = await fetchProtocol(force);
      if (result.nutrients && result.nutrients.length > 0) {
        staticProtocol = result.nutrients;
        await setCachedProtocol(profileSnap, result.nutrients);
      } else {
        staticProtocol = computeFallbackProtocol(profileSnap);
        await setCachedProtocol(profileSnap, staticProtocol);
        if (result.error) setError(`AI offline — using local calc (${result.error})`);
      }
    }

    // Apply today's pack + food intake to compute live percent / total / status
    const intake = state.today?.intake || [];
    const meals = state.today?.meals || [];
    const morningTaken = intake.some((l: any) => l.pack === 'morning');
    const recoveryTaken = intake.some((l: any) => l.pack === 'recovery');
    setNutrients(applyLiveIntake(staticProtocol, morningTaken, recoveryTaken, meals));

    setLoading(false);
    setRecalculating(false);
  };

  useFocusEffect(useCallback(() => { loadProtocol(); }, []));

  const visible = filter === 'all'
    ? nutrients
    : nutrients.filter(r => filter === 'morning' ? r.inMorning : r.inRecovery);
  const sorted = sortNutrients(visible);

  const morningSum = pakSummary(nutrients, 'morning');
  const recoverySum = pakSummary(nutrients, 'recovery');

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.greet}>
          <Text style={s.day}>Daily Protocol</Text>
          <Text style={s.h1}>Your <Text style={s.h1Italic}>nutrients.</Text></Text>
        </View>

        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={colors.ink2} size="large" />
            <Text style={s.loadingText}>Calculating your protocol...</Text>
          </View>
        ) : (
          <View style={s.px}>

            {!!error && (
              <View style={s.errBanner}><Text style={s.errBannerText}>{error}</Text></View>
            )}

            {/* Two pak cards */}
            <View style={s.pakRow}>
              <PakCard
                label="MORNING PAK"
                percent={morningSum.percent}
                count={morningSum.count}
                active={filter === 'morning'}
                accent={colors.morning}
                gradient={gradients.morning}
                onPress={() => setFilter(filter === 'morning' ? 'all' : 'morning')}
              />
              <PakCard
                label="RECOVERY PAK"
                percent={recoverySum.percent}
                count={recoverySum.count}
                active={filter === 'recovery'}
                accent={colors.recovery}
                gradient={gradients.recovery}
                onPress={() => setFilter(filter === 'recovery' ? 'all' : 'recovery')}
              />
            </View>

            {filter !== 'all' && (
              <TouchableOpacity onPress={() => setFilter('all')} style={s.clearFilter}>
                <Text style={s.clearFilterText}>Showing only {filter} pak · tap to show all</Text>
              </TouchableOpacity>
            )}

            {/* Header */}
            <View style={s.listHeader}>
              <Text style={s.eyebrow}>
                {filter === 'all' ? `All Nutrients (${sorted.length})` :
                 filter === 'morning' ? `Morning Pak (${sorted.length})` :
                 `Recovery Pak (${sorted.length})`}
              </Text>
              <TouchableOpacity
                onPress={() => loadProtocol(true)}
                disabled={recalculating}
                style={[s.recalcBtn, recalculating && { opacity: 0.5 }]}
              >
                {recalculating
                  ? <ActivityIndicator size="small" color={colors.ink} />
                  : <Text style={s.recalcText}>Recalculate</Text>}
              </TouchableOpacity>
            </View>

            {/* Nutrient list */}
            {sorted.map(row => (
              <NutrientCard key={row.id} row={row} filter={filter} />
            ))}

            {snap && (
              <Text style={s.footnote}>
                Calibrated for {snap.sport} · {snap.level} · {snap.weight}kg · {snap.frequency}×/week
              </Text>
            )}

          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 48 },
  px: { paddingHorizontal: 22, gap: 14 },

  greet: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 20 },
  day: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 1, color: colors.ink3, textTransform: 'uppercase', marginBottom: 4 },
  h1: { fontFamily: fonts.serif, fontSize: 40, color: colors.ink },
  h1Italic: { fontFamily: fonts.serifItalic },

  loadingWrap: { paddingVertical: 80, alignItems: 'center', gap: 16 },
  loadingText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink3, letterSpacing: 0.3 },

  errBanner: { backgroundColor: 'rgba(229,85,85,0.10)', borderWidth: 1, borderColor: 'rgba(229,85,85,0.35)', borderRadius: 12, padding: 12 },
  errBannerText: { fontFamily: fonts.sansMedium, fontSize: 12, color: '#c43030' },

  pakRow: { flexDirection: 'row', gap: 10 },
  pak: { flex: 1, backgroundColor: colors.surf, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 14, borderWidth: 1, alignItems: 'center', position: 'relative' },
  pakLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 },
  pakRingWrap: { width: 92, height: 92, alignItems: 'center', justifyContent: 'center' },
  pakRingCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  pakPct: { fontFamily: fonts.serifItalic, fontSize: 22 },
  pakSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3, marginTop: 8 },
  pakActiveDot: { position: 'absolute', top: 10, right: 10, width: 6, height: 6, borderRadius: 3 },

  clearFilter: { alignSelf: 'center', paddingVertical: 4 },
  clearFilterText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.ink3, letterSpacing: 0.3 },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.ink3, textTransform: 'uppercase' },
  recalcBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: 'rgba(13,13,15,0.06)' },
  recalcText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.ink2, letterSpacing: 0.5, textTransform: 'uppercase' },

  nutCard: { backgroundColor: colors.surf, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 8 },
  nutHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  nutName: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  nutAmount: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink3 },
  barTrack: { height: 6, backgroundColor: 'rgba(13,13,15,0.08)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  nutMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nutMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3, flex: 1 },
  nutPct: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
  nutBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, marginLeft: 8 },
  nutBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  nutTip: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink2, fontStyle: 'italic' },

  footnote: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
});
