import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';
import Ring from '../../components/Ring';
import Bar from '../../components/Bar';
import Eyebrow from '../../components/Eyebrow';
import GradientText from '../../components/GradientText';

export default function Today() {
  const today = new Date();
  const dayStr = today.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        <Text style={s.day}>{dayStr}</Text>
        <Text style={s.h1}>Good morning,</Text>
        <GradientText style={[s.h1, { fontFamily: fonts.serifItalic }]} kind="morning">Mark.</GradientText>

        <View style={[s.card, { marginTop: 22 }]}>
          <View style={s.rowBetween}><Eyebrow>Today's code</Eyebrow><Text style={s.chip}>+6 vs yesterday</Text></View>
          <View style={{ alignItems: 'center', marginTop: 14, marginBottom: 10 }}>
            <Ring pct={82} />
            <View style={{ position: 'absolute', top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={s.huge}>82<Text style={{ fontFamily: fonts.serifItalic, fontSize: 32 }}>%</Text></Text>
              <Eyebrow>Daily target</Eyebrow>
            </View>
          </View>
          <View style={s.macros}>
            {[['Vit','78%'],['Min','64%'],['AA','91%'],['Water','45%']].map(([k,v]) => (
              <View key={k} style={{ alignItems: 'center', flex: 1 }}>
                <Eyebrow>{k}</Eyebrow>
                <Text style={s.macroV}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.card}>
          <Text style={[s.timeDone]}>Morning · taken at 7:30</Text>
          <Text style={s.prodTitle}>Morning Pack <Text style={{ fontFamily: fonts.serifItalic }}>—</Text></Text>
          <Text style={s.prodSub}>Start your day right.</Text>
          <View style={{ marginTop: 14 }}><Bar pct={100} kind="morning" /></View>
        </View>

        <View style={s.card}>
          <Text style={s.time}>Tonight · 20:00</Text>
          <Text style={s.prodTitle}>Recovery Pack <Text style={{ fontFamily: fonts.serifItalic }}>—</Text></Text>
          <Text style={s.prodSub}>Recover. Restore. Reset.</Text>
          <View style={{ marginTop: 14 }}><Bar pct={0} kind="recovery" /></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  day: { fontFamily: fonts.sans, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.ink3 },
  h1: { fontFamily: fonts.serif, fontSize: 38, color: colors.ink, lineHeight: 44, letterSpacing: -0.6, marginTop: 4 },
  card: { backgroundColor: colors.surf, borderRadius: 22, padding: 22, marginTop: 14, borderWidth: 1, borderColor: colors.line, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 24, shadowOffset: { width: 0, height: 4 } },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink2, backgroundColor: colors.line, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  huge: { fontFamily: fonts.serif, fontSize: 64, color: colors.ink, letterSpacing: -2 },
  macros: { flexDirection: 'row', marginTop: 8 },
  macroV: { fontFamily: fonts.serifItalic, fontSize: 24, color: colors.ink },
  time: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3, letterSpacing: 0.6, textTransform: 'uppercase' },
  timeDone: { fontFamily: fonts.sans, fontSize: 11, color: colors.morning, letterSpacing: 0.6, textTransform: 'uppercase' },
  prodTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.ink, marginTop: 10 },
  prodSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink2, marginTop: 2 },
});
