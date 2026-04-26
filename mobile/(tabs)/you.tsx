import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientText from '../../src/components/GradientText';
import Icon from '../../src/components/Icon';
import { colors, fonts, radii, gradients } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';
import { router } from 'expo-router';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const HEIGHTS = [72, 80, 68, 84, 76, 82, 79];

const SETTINGS = [
  { label: 'Notifications', sub: 'Morning · Recovery · AI tips' },
  { label: 'Settings',      sub: 'Account · Plan · Privacy' },
  { label: 'Upgrade to Pro', sub: 'Connect blood-test results' },
];

export default function YouScreen() {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.name ?? data.user?.email?.split('@')[0] ?? 'Athlete';
      setUserName(name);
      setUserEmail(data.user?.email ?? '');
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const initial = userName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.greet}>
          <View style={s.greetRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.day}>Profile</Text>
              <Text style={s.h1} numberOfLines={1} ellipsizeMode="tail">{userName}</Text>
              {userEmail ? <Text style={s.email}>{userEmail}</Text> : null}
            </View>
            <View style={s.avatar}>
              <Text style={s.avatarLetter}>{initial || 'A'}</Text>
            </View>
          </View>
        </View>

        <View style={s.px}>

          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.eyebrow}>7-day average</Text>
              <View style={s.chip}><Text style={s.chipText}>+4 pts</Text></View>
            </View>
            <View style={s.scoreRow}>
              <GradientText colors={gradients.neutral} style={s.score}>79</GradientText>
              <Text style={s.scoreOf}>/100</Text>
            </View>
            <View style={s.weekbars}>
              {HEIGHTS.map((h, i) => (
                <View key={i} style={s.barWrap}>
                  <View style={[s.bar, { height: `${h}%` as any, backgroundColor: i === 2 ? 'rgba(13,13,15,0.18)' : colors.morning }]} />
                </View>
              ))}
            </View>
            <View style={s.lblRow}>
              {DAYS.map((d, i) => <Text key={i} style={s.dayLbl}>{d}</Text>)}
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.eyebrow}>Streak</Text>
            <View style={[s.row, { marginBottom: 0, marginTop: 8 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <GradientText colors={gradients.neutral} style={s.streakNum}>12</GradientText>
                <Text style={s.streakUnit}>days</Text>
              </View>
              <View style={[s.chip, { backgroundColor: `rgba(226,106,31,0.1)` }]}>
                <Text style={[s.chipText, { color: colors.morning }]}>Morning · 12d</Text>
              </View>
            </View>
          </View>

          <View style={[s.card, { padding: 0, paddingHorizontal: 22 }]}>
            {SETTINGS.map((item, i) => (
              <TouchableOpacity key={i} style={[s.listRow, i < SETTINGS.length - 1 && s.listRowBorder]} activeOpacity={0.6}>
                <View style={{ flex: 1 }}>
                  <Text style={s.listLabel}>{item.label}</Text>
                  <Text style={s.listSub}>{item.sub}</Text>
                </View>
                <Icon name="chevron-right" size={16} color={colors.ink3} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={s.signout} onPress={handleSignOut}>
            <Text style={s.signoutText}>Sign out</Text>
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
  greetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  day: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 1, color: colors.ink3, textTransform: 'uppercase', marginBottom: 4 },
  h1: { fontFamily: fonts.serif, fontSize: 40, color: colors.ink },
  email: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink3, marginTop: 2 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(13,13,15,0.08)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarLetter: { fontFamily: fonts.sansSemiBold, fontSize: 20, color: colors.ink },
  card: { backgroundColor: colors.surf, borderRadius: radii.card, padding: 22, borderWidth: 1, borderColor: colors.line, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 24, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.ink3, textTransform: 'uppercase' },
  chip: { backgroundColor: 'rgba(13,13,15,0.06)', borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.ink2 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 18 },
  score: { fontFamily: fonts.serifItalic, fontSize: 64, lineHeight: 68 },
  scoreOf: { fontFamily: fonts.sans, fontSize: 18, color: colors.ink3 },
  weekbars: { flexDirection: 'row', gap: 4, height: 60, alignItems: 'flex-end' },
  barWrap: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 3 },
  lblRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
  dayLbl: { flex: 1, textAlign: 'center', fontFamily: fonts.sansMedium, fontSize: 11, color: colors.ink3 },
  streakNum: { fontFamily: fonts.serifItalic, fontSize: 48, lineHeight: 52 },
  streakUnit: { fontFamily: fonts.sans, fontSize: 18, color: colors.ink3 },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  listRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  listLabel: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink },
  listSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3, marginTop: 2 },
  signout: { alignItems: 'center', paddingVertical: 16 },
  signoutText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink3, textDecorationLine: 'underline' },
});
