import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { colors, fonts, radii } from '../../src/theme';
import { getState } from '../../src/lib/api';
import {
  fetchProtocol, getCachedProtocol, setCachedProtocol,
  computeFallbackProtocol, sortNutrients, applyLiveIntake,
  profileFromState, type NutrientRow, type ProfileSnapshot,
} from '../../src/lib/protocol';

type Cat = 'morning' | 'essentials' | 'recovery';

const CAT_ACCENT: Record<Cat, string> = {
  morning: '#e26a1f',
  essentials: '#0d0d0f',
  recovery: '#4a3aa8',
};
const CAT_LABEL: Record<Cat, string> = {
  morning: 'Morning',
  essentials: 'Essentials',
  recovery: 'Recovery',
};
const CAT_HEAD: Record<Cat, string> = {
  morning: 'Vitamins & Minerals',
  essentials: 'Daily essentials',
  recovery: 'Recovery compounds',
};

function NutrientCard({ row, accent }: { row: NutrientRow; accent: string }) {
  const [open, setOpen] = useState(false);
  const isCovered = row.percent >= 85;
  const isPartial = row.percent >= 30;
  const barColor = isCovered ? '#16a34a' : isPartial ? accent : '#e55';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => setOpen(!open)}
      style={s.card}
    >
      <View style={s.headRow}>
        <Text style={s.idx}>{row.id.startsWith('vitamin_') ? '' : ''}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{row.name}</Text>
          <Text style={s.form}>{row.dailyTarget}{row.unit} target</Text>
        </View>
        <Text style={[s.pct, { color: barColor }]}>{row.percent}%</Text>
        <Text style={[s.chev, open && { transform: [{ rotate: '90deg' }] }]}>›</Text>
      </View>
      <View style={s.barTrack}>
        <View style={[s.barFill, { width: `${row.percent}%` as any, backgroundColor: barColor }]} />
      </View>
      {open && (
        <View style={s.expand}>
          {(row.morningPak + row.recoveryPak) > 0 ? (
            <View style={s.expRow}>
              <Text style={s.expLbl}>From supplements</Text>
              <Text style={s.expVal}>
                {(row.morningPak + row.recoveryPak).toLocaleString()}{row.unit}
              </Text>
            </View>
          ) : (
            <View style={s.expRow}>
              <Text style={s.expLbl}>Source</Text>
              <Text style={s.expVal}>Food only</Text>
            </View>
          )}
          <View style={s.expRow}>
            <Text style={s.expLbl}>Current intake</Text>
            <Text style={s.expVal}>{row.total.toLocaleString()}{row.unit}</Text>
          </View>
          <View style={s.expRow}>
            <Text style={s.expLbl}>Daily target</Text>
            <Text style={s.expVal}>{row.dailyTarget.toLocaleString()}{row.unit}</Text>
          </View>
          {row.gap > 0 && (
            <View style={s.expRow}>
              <Text style={s.expLbl}>Gap</Text>
              <Text style={[s.expVal, { color: '#e55' }]}>{row.gap}{row.unit}</Text>
            </View>
          )}
          {!!row.foodTip && (
            <Text style={s.expTip}>Eat: {row.foodTip}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ProtocolScreen() {
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState('');
  const [nutrients, setNutrients] = useState<NutrientRow[]>([]);
  const [cat, setCat] = useState<Cat>('morning');
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

    const intake = state.today?.intake || [];
    const meals = state.today?.meals || [];
    const morningTaken = intake.some((l: any) => l.pack === 'morning');
    const recoveryTaken = intake.some((l: any) => l.pack === 'recovery');
    setNutrients(applyLiveIntake(staticProtocol, morningTaken, recoveryTaken, meals));

    setLoading(false);
    setRecalculating(false);
  };

  useFocusEffect(useCallback(() => { loadProtocol(); }, []));

  const filtered = nutrients.filter(r =>
    cat === 'morning' ? r.inMorning :
    cat === 'essentials' ? r.inEssentials :
    r.inRecovery
  );
  const sorted = sortNutrients(filtered);
  const overall = filtered.length > 0
    ? Math.round(filtered.reduce((s, r) => s + r.percent, 0) / filtered.length)
    : 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.greet}>
          <Text style={s.day}>Today's protocol</Text>
          <Text style={s.h1}>Track</Text>
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

            {/* 3-segment toggle */}
            <View style={s.seg}>
              {(['morning', 'essentials', 'recovery'] as Cat[]).map(c => {
                const active = cat === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      s.segBtn,
                      active && { backgroundColor: CAT_ACCENT[c] },
                    ]}
                    onPress={() => setCat(c)}
                  >
                    <Text style={[s.segTxt, active && { color: '#fff' }]}>
                      {CAT_LABEL[c]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Overall summary bar */}
            <View style={s.summary}>
              <View>
                <Text style={s.eyebrow}>{CAT_LABEL[cat]} coverage</Text>
                <Text style={[s.summaryPct, { color: CAT_ACCENT[cat] }]}>
                  {overall}<Text style={s.summaryPctUnit}>%</Text>
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 18, marginTop: 14 }}>
                <View style={s.summaryBar}>
                  <View style={[s.summaryBarFill, {
                    width: `${overall}%` as any, backgroundColor: CAT_ACCENT[cat],
                  }]} />
                </View>
                <Text style={s.summaryHint}>{filtered.length} compounds</Text>
              </View>
            </View>

            <View style={s.headRowTop}>
              <Text style={s.eyebrow}>{CAT_HEAD[cat]}</Text>
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

            {sorted.map(row => (
              <NutrientCard key={row.id} row={row} accent={CAT_ACCENT[cat]} />
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
  px: { paddingHorizontal: 22, gap: 12 },

  greet: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 20 },
  day: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 1, color: colors.ink3, textTransform: 'uppercase', marginBottom: 4 },
  h1: { fontFamily: fonts.serif, fontSize: 40, color: colors.ink },

  loadingWrap: { paddingVertical: 80, alignItems: 'center', gap: 16 },
  loadingText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink3, letterSpacing: 0.3 },

  errBanner: { backgroundColor: 'rgba(229,85,85,0.10)', borderWidth: 1, borderColor: 'rgba(229,85,85,0.35)', borderRadius: 12, padding: 12 },
  errBannerText: { fontFamily: fonts.sansMedium, fontSize: 12, color: '#c43030' },

  seg: { flexDirection: 'row', backgroundColor: 'rgba(13,13,15,0.06)', borderRadius: radii.pill, padding: 4 },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: radii.pill, alignItems: 'center' },
  segTxt: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink2 },

  summary: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.surf, borderRadius: radii.card, padding: 18, borderWidth: 1, borderColor: colors.line },
  summaryPct: { fontFamily: fonts.serifItalic, fontSize: 38, lineHeight: 40, marginTop: 4 },
  summaryPctUnit: { fontSize: 18, color: colors.ink3 },
  summaryBar: { height: 6, backgroundColor: 'rgba(13,13,15,0.08)', borderRadius: 3, overflow: 'hidden' },
  summaryBarFill: { height: 6, borderRadius: 3 },
  summaryHint: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3, marginTop: 6 },

  headRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 2 },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.ink3, textTransform: 'uppercase' },
  recalcBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: 'rgba(13,13,15,0.06)' },
  recalcText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.ink2, letterSpacing: 0.5, textTransform: 'uppercase' },

  card: { backgroundColor: colors.surf, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.line },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  idx: { width: 0 },
  name: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  form: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3, marginTop: 2 },
  pct: { fontFamily: fonts.sansBold, fontSize: 14 },
  chev: { fontFamily: fonts.sans, fontSize: 18, color: colors.ink3, marginLeft: 6 },
  barTrack: { height: 5, backgroundColor: 'rgba(13,13,15,0.08)', borderRadius: 3, overflow: 'hidden', marginTop: 10 },
  barFill: { height: 5, borderRadius: 3 },

  expand: { backgroundColor: 'rgba(13,13,15,0.03)', borderRadius: 10, padding: 12, marginTop: 10, gap: 6 },
  expRow: { flexDirection: 'row', justifyContent: 'space-between' },
  expLbl: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.ink3, letterSpacing: 0.5, textTransform: 'uppercase' },
  expVal: { fontFamily: fonts.serifItalic, fontSize: 14, color: colors.ink },
  expTip: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink2, fontStyle: 'italic', marginTop: 4 },

  footnote: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
});
