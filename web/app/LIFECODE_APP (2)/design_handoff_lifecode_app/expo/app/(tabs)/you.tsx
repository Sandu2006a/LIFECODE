import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';
import Eyebrow from '../../components/Eyebrow';
import { supabase } from '../../lib/supabase';

export default function You() {
  const heights = [72, 80, 68, 84, 76, 82, 79];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Sign out failed', error.message);
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        <View style={s.headRow}>
          <View style={{ flex: 1 }}>
            <Eyebrow>Profile</Eyebrow>
            <Text style={s.h1} numberOfLines={1}>Mark</Text>
          </View>
          <View style={s.avatar}><Text style={s.avatarText}>M</Text></View>
        </View>

        <View style={s.card}>
          <View style={s.rowBetween}>
            <Eyebrow>7-day average</Eyebrow>
            <Text style={s.chip}>+4 pts</Text>
          </View>
          <Text style={s.big}>79<Text style={{ fontFamily: fonts.serifItalic, fontSize: 22, color: colors.ink3 }}>/100</Text></Text>
          <View style={s.weekbars}>
            {heights.map((h, i) => (
              <View key={i} style={[s.bar, { height: `${h}%`, backgroundColor: i === 2 ? colors.ink4 : colors.ink }]} />
            ))}
          </View>
          <View style={s.lblRow}>
            {days.map((d, i) => <Text key={i} style={s.dayLbl}>{d}</Text>)}
          </View>
        </View>

        <View style={s.card}>
          <Eyebrow>Streak</Eyebrow>
          <Text style={s.streak}>14 <Text style={{ fontFamily: fonts.serifItalic, fontSize: 18, color: colors.ink3 }}>days</Text></Text>
          <Text style={s.muted}>Best ever. Keep it up.</Text>
        </View>

        {[
          ['Goals', 'Adjust daily nutrient targets'],
          ['Notifications', 'Pack reminders & insights'],
          ['Subscription', 'Manage your Morning + Recovery'],
          ['Data export', 'Download your history'],
        ].map(([t, sub]) => (
          <Pressable key={t} style={s.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.settingTitle}>{t}</Text>
              <Text style={s.settingSub}>{sub}</Text>
            </View>
            <Text style={{ color: colors.ink3, fontSize: 18 }}>›</Text>
          </Pressable>
        ))}

        <Pressable onPress={signOut} style={[s.settingRow, { borderColor: 'transparent' }]}>
          <Text style={[s.settingTitle, { color: colors.morning2 }]}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  h1: { fontFamily: fonts.serif, fontSize: 38, color: colors.ink, letterSpacing: -0.6, marginTop: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontFamily: fonts.serifItalic, fontSize: 22 },
  card: { backgroundColor: colors.surf, borderRadius: 22, padding: 22, marginTop: 14, borderWidth: 1, borderColor: colors.line },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  chip: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink2, backgroundColor: colors.line, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  big: { fontFamily: fonts.serif, fontSize: 56, color: colors.ink, letterSpacing: -1.4, marginBottom: 16 },
  weekbars: { flexDirection: 'row', height: 80, alignItems: 'flex-end', gap: 8 },
  bar: { flex: 1, borderRadius: 4 },
  lblRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  dayLbl: { flex: 1, textAlign: 'center', fontFamily: fonts.sans, fontSize: 11, color: colors.ink3 },
  streak: { fontFamily: fonts.serif, fontSize: 56, color: colors.ink, letterSpacing: -1.4, marginTop: 4 },
  muted: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink3, marginTop: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  settingTitle: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink, fontWeight: '500' },
  settingSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3, marginTop: 2 },
});
