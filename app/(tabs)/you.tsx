import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import GradientText from '../../src/components/GradientText';
import Icon from '../../src/components/Icon';
import { colors, fonts, radii, gradients } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getLast7Days() {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export default function YouScreen() {
  const [profile, setProfile] = useState<{ name: string; email: string; sport: string; goal: string; avatar: string } | null>(null);
  const [weekData, setWeekData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [streak, setStreak] = useState(0);
  const [monthPct, setMonthPct] = useState(0);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Profile
    const { data: p } = await supabase
      .from('profiles')
      .select('display_name, full_name, email, sport, goal, avatar_letter')
      .eq('id', user.id)
      .maybeSingle();

    if (p) {
      const name = p.display_name || p.full_name || user.email?.split('@')[0] || 'Athlete';
      setProfile({
        name,
        email: p.email || user.email || '',
        sport: p.sport || '',
        goal: p.goal || '',
        avatar: p.avatar_letter || name.charAt(0).toUpperCase(),
      });
    }

    // Last 30 days of intake_logs
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: logs } = await supabase
      .from('intake_logs')
      .select('pack, taken_at')
      .eq('user_id', user.id)
      .gte('taken_at', thirtyDaysAgo.toISOString())
      .order('taken_at', { ascending: false });

    const allLogs = logs || [];

    // Group by date
    const byDate: Record<string, Set<string>> = {};
    allLogs.forEach((l: any) => {
      const d = l.taken_at.split('T')[0];
      if (!byDate[d]) byDate[d] = new Set();
      byDate[d].add(l.pack);
    });

    // Weekly data (last 7 days)
    const last7 = getLast7Days();
    const week = last7.map(d => {
      const packs = byDate[d];
      if (!packs) return 0;
      const m = packs.has('morning') ? 50 : 0;
      const r = packs.has('recovery') ? 50 : 0;
      return m + r;
    });
    setWeekData(week);

    // Streak: consecutive days with at least one pack taken
    let s = 0;
    const today = new Date().toISOString().split('T')[0];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (ds === today && !byDate[ds]) { continue; } // today might not be done yet
      if (byDate[ds] && byDate[ds].size > 0) { s++; }
      else if (ds !== today) { break; }
    }
    setStreak(s);

    // Month completion %
    const daysWithData = Object.keys(byDate).filter(d => {
      const ago = new Date();
      ago.setDate(ago.getDate() - 30);
      return new Date(d) >= ago;
    });
    const totalPossible = 30 * 2; // morning + recovery each day
    const totalTaken = daysWithData.reduce((acc, d) => acc + byDate[d].size, 0);
    setMonthPct(Math.round((totalTaken / totalPossible) * 100));
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const maxBar = Math.max(...weekData, 1);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.greet}>
          <View style={s.greetRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.day}>Profile</Text>
              <Text style={s.h1} numberOfLines={1} ellipsizeMode="tail">
                {profile?.name || 'Athlete'}
              </Text>
              {profile?.email ? <Text style={s.email}>{profile.email}</Text> : null}
              {profile?.sport ? (
                <View style={s.sportChip}>
                  <Text style={s.sportText}>{profile.sport}</Text>
                </View>
              ) : null}
            </View>
            <View style={s.avatar}>
              <Text style={s.avatarLetter}>{profile?.avatar || 'A'}</Text>
            </View>
          </View>
        </View>

        <View style={s.px}>

          {/* Weekly chart */}
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.eyebrow}>This week</Text>
              <View style={s.chip}>
                <Text style={s.chipText}>{weekData.filter(v => v > 0).length} / 7 days</Text>
              </View>
            </View>
            <View style={s.weekbars}>
              {weekData.map((h, i) => (
                <View key={i} style={s.barWrap}>
                  <View style={[
                    s.bar,
                    { height: `${Math.round((h / maxBar) * 100)}%` as any },
                    h === 0 && s.barEmpty,
                    h > 0 && h < 100 && s.barPartial,
                    h === 100 && s.barFull,
                  ]} />
                </View>
              ))}
            </View>
            <View style={s.lblRow}>
              {DAY_LABELS.map((d, i) => (
                <Text key={i} style={[s.dayLbl, i === (new Date().getDay() + 6) % 7 && { color: colors.morning }]}>
                  {d}
                </Text>
              ))}
            </View>
          </View>

          {/* Streak + month */}
          <View style={[s.card, { flexDirection: 'row', gap: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>Streak</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
                <GradientText colors={gradients.morning} style={s.streakNum}>{streak}</GradientText>
                <Text style={s.streakUnit}>days</Text>
              </View>
            </View>
            <View style={s.divV} />
            <View style={{ flex: 1, paddingLeft: 20 }}>
              <Text style={s.eyebrow}>30-day avg</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
                <GradientText colors={gradients.recovery} style={s.streakNum}>{monthPct}</GradientText>
                <Text style={s.streakUnit}>%</Text>
              </View>
            </View>
          </View>

          {/* Goal card */}
          {profile?.goal && (
            <View style={s.goalCard}>
              <Text style={s.eyebrow}>Current goal</Text>
              <Text style={s.goalText}>{
                profile.goal === 'muscle' ? 'Build muscle' :
                profile.goal === 'fat' ? 'Lose fat' :
                profile.goal === 'endurance' ? 'Improve endurance' :
                profile.goal === 'recovery' ? 'Recover faster' :
                'General performance'
              }</Text>
            </View>
          )}

          {/* Settings */}
          <View style={[s.card, { padding: 0, paddingHorizontal: 22 }]}>
            {[
              { label: 'Notifications', sub: 'Morning · Recovery · AI tips', icon: 'you' },
              { label: 'Edit Profile', sub: 'Sport · Weight · Height · Goal', icon: 'you' },
              { label: 'Upgrade to Elite Lab', sub: 'Upload blood tests · AI biomarker analysis', icon: 'spark' },
            ].map((item, i, arr) => (
              <TouchableOpacity key={i} style={[s.listRow, i < arr.length - 1 && s.listRowBorder]} activeOpacity={0.6}>
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
  greetRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  day: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 1, color: colors.ink3, textTransform: 'uppercase', marginBottom: 4 },
  h1: { fontFamily: fonts.serif, fontSize: 40, color: colors.ink },
  email: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink3, marginTop: 2 },
  sportChip: { marginTop: 8, backgroundColor: 'rgba(226,106,31,0.1)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill },
  sportText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.morning },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(13,13,15,0.08)', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 16 },
  avatarLetter: { fontFamily: fonts.sansSemiBold, fontSize: 20, color: colors.ink },

  card: { backgroundColor: colors.surf, borderRadius: radii.card, padding: 22, borderWidth: 1, borderColor: colors.line, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 24, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.ink3, textTransform: 'uppercase' },
  chip: { backgroundColor: 'rgba(13,13,15,0.06)', borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.ink2 },

  weekbars: { flexDirection: 'row', gap: 6, height: 72, alignItems: 'flex-end', marginBottom: 8 },
  barWrap: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barEmpty: { backgroundColor: 'rgba(13,13,15,0.07)' },
  barPartial: { backgroundColor: colors.morning + '80' },
  barFull: { backgroundColor: colors.morning },
  lblRow: { flexDirection: 'row', gap: 6 },
  dayLbl: { flex: 1, textAlign: 'center', fontFamily: fonts.sansMedium, fontSize: 11, color: colors.ink3 },

  divV: { width: 1, backgroundColor: colors.line, marginVertical: 4 },
  streakNum: { fontFamily: fonts.serifItalic, fontSize: 48, lineHeight: 52 },
  streakUnit: { fontFamily: fonts.sans, fontSize: 18, color: colors.ink3 },

  goalCard: { backgroundColor: colors.surf, borderRadius: radii.card, padding: 22, borderWidth: 1, borderColor: colors.line },
  goalText: { fontFamily: fonts.serifItalic, fontSize: 22, color: colors.ink, marginTop: 8 },

  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  listRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  listLabel: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink },
  listSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3, marginTop: 2 },
  signout: { alignItems: 'center', paddingVertical: 16 },
  signoutText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink3, textDecorationLine: 'underline' },
});
