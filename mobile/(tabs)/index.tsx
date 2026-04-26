import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MultiRing from '../../src/components/MultiRing';
import GradientText from '../../src/components/GradientText';
import Icon from '../../src/components/Icon';
import { colors, fonts, radii, gradients } from '../../src/theme';

function ProgressBar({ pct, kind }: { pct: number; kind: 'morning' | 'recovery' }) {
  const fillColor = kind === 'morning' ? colors.morning : colors.recovery;
  return (
    <View style={bar.track}>
      <View style={[bar.fill, { width: `${pct}%` as any, backgroundColor: fillColor }]} />
    </View>
  );
}

const bar = StyleSheet.create({
  track: { height: 4, backgroundColor: 'rgba(13,13,15,0.08)', borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
});

export default function HomeScreen() {
  const [pcts, setPcts] = useState({ m: 0, r: 0, h: 0, n: 0 });

  useEffect(() => {
    const t = setTimeout(() => setPcts({ m: 88, r: 0, h: 62, n: 74 }), 80);
    return () => clearTimeout(t);
  }, []);

  const overall = Math.round((pcts.m + pcts.r + pcts.h + pcts.n) / 4);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.greet}>
          <Text style={s.day}>Wed · April 26</Text>
          <Text style={s.h1}>Good morning,{'\n'}</Text>
          <GradientText colors={gradients.morning} style={s.h1Italic}>Mark.</GradientText>
        </View>

        <View style={s.px}>

          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.eyebrow}>Today's protocol</Text>
              <View style={s.chip}><Text style={s.chipText}>+6 vs yesterday</Text></View>
            </View>

            <View style={s.ringStage}>
              <MultiRing size={236} items={[
                { label: 'Morning',   pct: pcts.m, gradient: gradients.morning },
                { label: 'Recovery',  pct: pcts.r, gradient: gradients.recovery },
                { label: 'Hydration', pct: pcts.h, gradient: gradients.hydration },
                { label: 'Nutrition', pct: pcts.n, gradient: [colors.morning, colors.recovery] },
              ]} />
              <View style={s.ringCenter}>
                <GradientText colors={gradients.neutral} style={s.huge}>
                  {overall}
                </GradientText>
                <Text style={s.hugeUnit}>%</Text>
              </View>
            </View>

            <View style={s.macroRow}>
              {[
                { label: 'Morning',   val: pcts.m, color: colors.morning },
                { label: 'Recovery',  val: pcts.r, color: colors.recovery },
                { label: 'Hydration', val: pcts.h, color: colors.ink },
              ].map((m) => (
                <View key={m.label} style={s.macroItem}>
                  <Text style={s.eyebrow}>{m.label}</Text>
                  <Text style={[s.macroNum, { color: m.color }]}>{m.val}%</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[s.packCard, { borderColor: 'rgba(226,106,31,0.18)' }]}>
            <View style={s.row}>
              <Text style={s.packTime}>Taken at 7:30</Text>
              <Text style={[s.eyebrow, { color: colors.morning }]}>Morning</Text>
            </View>
            <Text style={s.packTitle}>Morning Pack <Text style={s.em}>—</Text></Text>
            <Text style={s.packSub}>Start your day right.</Text>
            <View style={{ marginTop: 16 }}><ProgressBar pct={100} kind="morning" /></View>
          </View>

          <View style={[s.packCard, { borderColor: 'rgba(74,58,168,0.18)' }]}>
            <View style={s.row}>
              <Text style={s.packTime}>Tonight · 20:00</Text>
              <Text style={[s.eyebrow, { color: colors.recovery }]}>Recovery</Text>
            </View>
            <Text style={s.packTitle}>Recovery Pack <Text style={s.em}>—</Text></Text>
            <Text style={s.packSub}>Recover. Restore. Reset.</Text>
            <View style={{ marginTop: 16 }}><ProgressBar pct={0} kind="recovery" /></View>
          </View>

          <View style={s.aiTip}>
            <View style={s.aiIcon}><Icon name="spark" size={14} color={colors.ink2} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.aiTitle}>Suggestion</Text>
              <Text style={s.aiMsg}>
                An orange at 11 closes{' '}
                <Text style={{ color: colors.morning, fontFamily: fonts.sansBold }}>vitamin C</Text>.
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

  card: {
    backgroundColor: colors.surf,
    borderRadius: radii.card,
    padding: 22,
    paddingTop: 26,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.ink3, textTransform: 'uppercase' },
  chip: { backgroundColor: 'rgba(13,13,15,0.06)', borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.ink2 },

  ringStage: { alignItems: 'center', justifyContent: 'center', marginVertical: 4 },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  huge: { fontFamily: fonts.serifItalic, fontSize: 52, lineHeight: 56 },
  hugeUnit: { fontFamily: fonts.serifItalic, fontSize: 24, color: colors.ink3 },

  macroRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 8 },
  macroItem: { gap: 4 },
  macroNum: { fontFamily: fonts.serifItalic, fontSize: 22 },

  packCard: {
    backgroundColor: colors.surf,
    borderRadius: radii.card,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 2,
  },
  packTime: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3 },
  packTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.ink, marginTop: 12 },
  em: { fontFamily: fonts.serifItalic },
  packSub: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink2, marginTop: 4 },

  aiTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surf,
    borderRadius: radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  aiIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(13,13,15,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  aiTitle: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 0.5, color: colors.ink3, marginBottom: 3 },
  aiMsg: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink2, lineHeight: 20 },
});
