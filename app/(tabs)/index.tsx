import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import MultiRing from '../../src/components/MultiRing';
import GradientText from '../../src/components/GradientText';
import Icon from '../../src/components/Icon';
import { colors, fonts, radii, gradients } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';
import { getDailySuggestions, Suggestion } from '../../src/lib/gemini';

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

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<{ display_name: string; goal: string; sport: string } | null>(null);
  const [morningTaken, setMorningTaken] = useState(false);
  const [recoveryTaken, setRecoveryTaken] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const today = new Date();
  const dateLabel = `${DAYS_SHORT[today.getDay()]} · ${MONTHS[today.getMonth()]} ${today.getDate()}`;
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const todayStr = today.toISOString().split('T')[0];

    // Load profile
    const { data: p } = await supabase
      .from('profiles')
      .select('display_name, full_name, goal, sport')
      .eq('id', user.id)
      .maybeSingle();

    if (p) setProfile({
      display_name: p.display_name || p.full_name || 'Athlete',
      goal: p.goal || 'performance',
      sport: p.sport || '',
    });

    // Load today's supplement intake
    const { data: logs } = await supabase
      .from('intake_logs')
      .select('pack')
      .eq('user_id', user.id)
      .gte('taken_at', `${todayStr}T00:00:00.000Z`)
      .lte('taken_at', `${todayStr}T23:59:59.999Z`);

    const packs = (logs || []).map((l: any) => l.pack);
    setMorningTaken(packs.includes('morning'));
    setRecoveryTaken(packs.includes('recovery'));
  };

  const loadSuggestion = async (profileData: typeof profile) => {
    if (!profileData) return;
    const suggestions = await getDailySuggestions({
      goals: [profileData.goal],
      sport: profileData.sport,
    });
    if (suggestions.length > 0) setSuggestion(suggestions[0]);
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  useEffect(() => {
    if (profile) loadSuggestion(profile);
  }, [profile]);

  const morningPct = morningTaken ? 100 : 0;
  const recoveryPct = recoveryTaken ? 100 : 0;
  const overall = Math.round((morningPct + recoveryPct) / 2);

  const markTaken = async (pack: 'morning' | 'recovery') => {
    if (!userId) return;
    const already = pack === 'morning' ? morningTaken : recoveryTaken;
    if (already) return;
    await supabase.from('intake_logs').insert({ user_id: userId, pack, taken_at: new Date().toISOString() });
    if (pack === 'morning') setMorningTaken(true);
    else setRecoveryTaken(true);
  };

  const name = profile?.display_name || 'Athlete';
  const firstName = name.split(' ')[0];

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
          <GradientText colors={gradients.morning} style={s.h1Italic}>{firstName}.</GradientText>
        </View>

        <View style={s.px}>

          {/* Protocol score card */}
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.eyebrow}>Today's protocol</Text>
              <View style={s.chip}>
                <Text style={s.chipText}>{overall === 100 ? 'Complete ✓' : overall === 0 ? 'Not started' : 'In progress'}</Text>
              </View>
            </View>

            <View style={s.ringStage}>
              <MultiRing size={236} items={[
                { label: 'Morning',   pct: morningPct,  gradient: gradients.morning },
                { label: 'Recovery',  pct: recoveryPct, gradient: gradients.recovery },
              ]} />
              <View style={s.ringCenter}>
                <GradientText colors={gradients.neutral} style={s.huge}>{overall}</GradientText>
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

          {/* AI suggestion */}
          {suggestion && (
            <View style={s.aiTip}>
              <View style={s.aiIcon}><Icon name="spark" size={14} color={colors.ink2} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.aiTitle}>{suggestion.title}</Text>
                <Text style={s.aiMsg}>{suggestion.message}</Text>
              </View>
            </View>
          )}

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

  packCard: { backgroundColor: colors.surf, borderRadius: radii.card, padding: 22, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 24, elevation: 2 },
  packTime: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3 },
  packTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.ink, marginTop: 12 },
  em: { fontFamily: fonts.serifItalic },
  packSub: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink2, marginTop: 4 },

  aiTip: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: colors.surf, borderRadius: radii.card, padding: 16, borderWidth: 1, borderColor: colors.line },
  aiIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(13,13,15,0.05)', alignItems: 'center', justifyContent: 'center' },
  aiTitle: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 0.5, color: colors.ink3, marginBottom: 3 },
  aiMsg: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink2, lineHeight: 20 },
});
