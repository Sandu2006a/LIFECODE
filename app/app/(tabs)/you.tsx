import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import GradientText from '../../src/components/GradientText';
import Icon from '../../src/components/Icon';
import { colors, fonts, radii, gradients } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';
import { getCachedTokens } from '../../src/lib/auth-cache';

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

function DNAHelix({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <Defs>
        <SvgGradient id="helixA" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#c43d1f" />
          <Stop offset="100%" stopColor="#f5a623" />
        </SvgGradient>
        <SvgGradient id="helixB" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#2a2a8e" />
          <Stop offset="100%" stopColor="#7a8fd9" />
        </SvgGradient>
      </Defs>
      <Line x1="20" y1="11" x2="36" y2="11" stroke="#c43d1f" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
      <Line x1="15" y1="20" x2="41" y2="20" stroke="#4a3aa8" strokeWidth="1.4" strokeLinecap="round" />
      <Line x1="13" y1="28" x2="43" y2="28" stroke="#e26a1f" strokeWidth="1.4" strokeLinecap="round" />
      <Line x1="15" y1="36" x2="41" y2="36" stroke="#2a2a8e" strokeWidth="1.4" strokeLinecap="round" />
      <Line x1="20" y1="45" x2="36" y2="45" stroke="#c43d1f" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
      <Path d="M14 8 C 14 22, 42 22, 42 28 C 42 34, 14 34, 14 48" stroke="url(#helixA)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <Path d="M42 8 C 42 22, 14 22, 14 28 C 14 34, 42 34, 42 48" stroke="url(#helixB)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

type Subscription = {
  plan: string;
  status: string;
  price: string;
  currentPeriodEnd: string | null;
  memberSince: string | null;
};

export default function YouScreen() {
  const [profile, setProfile] = useState<{ name: string; email: string; sport: string; goal: string; avatar: string } | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [weekData, setWeekData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [streak, setStreak] = useState(0);
  const [monthPct, setMonthPct] = useState(0);
  const [mealsScanned, setMealsScanned] = useState(0);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    let user = session?.user ?? null;
    if (!user) { const { data: { user: u } } = await supabase.auth.getUser(); user = u ?? null; }
    if (!user) {
      const tokens = getCachedTokens();
      if (tokens) { const { data } = await supabase.auth.setSession(tokens); user = data?.session?.user ?? null; }
    }
    if (!user) return;

    const { data: p } = await supabase
      .from('profiles')
      .select('display_name, full_name, email, sport, goal, avatar_letter, created_at')
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

    // Subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, status, current_period_end, created_at')
      .eq('user_id', user.id)
      .maybeSingle();

    const planMap: Record<string, string> = {
      essentials: 'Essentials',
      protocol: 'Athlete Pro',
      elite_lab: 'Elite Lab',
    };
    const priceMap: Record<string, string> = {
      essentials: '€39',
      protocol: '€89',
      elite_lab: '€199',
    };
    setSubscription({
      plan: planMap[sub?.plan || ''] || 'Athlete Pro',
      status: sub?.status || 'active',
      price: priceMap[sub?.plan || ''] || '€89',
      currentPeriodEnd: sub?.current_period_end || null,
      memberSince: sub?.created_at || (p as any)?.created_at || null,
    });

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

    const byDate: Record<string, Set<string>> = {};
    allLogs.forEach((l: any) => {
      const d = l.taken_at.split('T')[0];
      if (!byDate[d]) byDate[d] = new Set();
      byDate[d].add(l.pack);
    });

    const last7 = getLast7Days();
    const week = last7.map(d => {
      const packs = byDate[d];
      if (!packs) return 0;
      let pct = 0;
      if (packs.has('morning')) pct += 33;
      if (packs.has('essentials')) pct += 33;
      if (packs.has('recovery')) pct += 34;
      return pct;
    });
    setWeekData(week);

    let s = 0;
    const today = new Date().toISOString().split('T')[0];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (ds === today && !byDate[ds]) { continue; }
      if (byDate[ds] && byDate[ds].size > 0) { s++; }
      else if (ds !== today) { break; }
    }
    setStreak(s);

    const totalPossible = 30 * 3;
    const totalTaken = Object.values(byDate).reduce((acc, set) => acc + set.size, 0);
    setMonthPct(Math.round((totalTaken / totalPossible) * 100));

    // Meals scanned
    const { count } = await supabase
      .from('meal_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    setMealsScanned(count || 0);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/activate');
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getDate()} · ${d.getFullYear()}`;
  };

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

          {/* Premium subscription card */}
          {subscription && (
            <View style={s.subCard}>
              <LinearGradient
                colors={['#1a1a1f', '#0d0d0f']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.subBg}
              />
              <View style={s.subTop}>
                <View style={s.subBrand}>
                  <DNAHelix size={28} />
                </View>
                <View style={[s.subPill, subscription.status === 'active' && s.subPillActive]}>
                  <Text style={s.subPillText}>{subscription.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={s.subLbl}>Current subscription</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={s.subPlan}>{subscription.plan.split(' ')[0]} </Text>
                <Text style={s.subPlanItalic}>{subscription.plan.split(' ').slice(1).join(' ')}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
                <Text style={s.subPrice}>{subscription.price}</Text>
                <Text style={s.subPer}>/month</Text>
              </View>
              <View style={s.subIncl}>
                <Text style={s.subInclItem}>+ Morning Pack</Text>
                <Text style={s.subInclItem}>+ Essentials</Text>
                <Text style={s.subInclItem}>+ Recovery</Text>
              </View>
              <View style={s.subFoot}>
                <View style={{ flex: 1 }}>
                  <Text style={s.subFootLbl}>Next delivery</Text>
                  <Text style={s.subFootVal}>{formatDate(subscription.currentPeriodEnd)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.subFootLbl}>Member since</Text>
                  <Text style={s.subFootVal}>{formatDate(subscription.memberSince)}</Text>
                </View>
                <TouchableOpacity style={s.subManage}>
                  <Text style={s.subManageText}>Manage ›</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

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
                    { height: `${Math.max(h, 4)}%` as any },
                    h === 0 && s.barEmpty,
                    h > 0 && h < 100 && s.barPartial,
                    h >= 100 && s.barFull,
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

          {/* Stats row */}
          <View style={s.statsRow}>
            <View style={s.statCell}>
              <GradientText colors={gradients.morning} style={s.statNum}>{streak}</GradientText>
              <Text style={s.statLbl}>Day streak</Text>
            </View>
            <View style={s.statCell}>
              <GradientText colors={gradients.recovery} style={s.statNum}>{monthPct}</GradientText>
              <Text style={s.statLbl}>30-day avg %</Text>
            </View>
            <View style={s.statCell}>
              <Text style={[s.statNum, { color: colors.ink }]}>{mealsScanned}</Text>
              <Text style={s.statLbl}>Meals logged</Text>
            </View>
          </View>

          {/* Goal card */}
          {profile?.goal && (
            <View style={s.goalCard}>
              <Text style={s.eyebrow}>Current goal</Text>
              <Text style={s.goalText}>{
                profile.goal === 'amateur' ? 'Amateur — Health & Fun' :
                profile.goal === 'competitive' ? 'Competitive — Club / Regional' :
                profile.goal === 'elite' ? 'Elite / Pro — National Level' :
                profile.goal || 'General performance'
              }</Text>
            </View>
          )}

          {/* Settings */}
          <View style={[s.card, { padding: 0, paddingHorizontal: 22 }]}>
            {[
              { label: 'Athlete profile', sub: 'Sport · weight · training load' },
              { label: 'Notifications', sub: 'Morning · Recovery · AI tips' },
              { label: 'Connect blood test', sub: 'Personalize doses from biomarkers' },
              { label: 'Privacy & data', sub: 'Your numbers, your call' },
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

  // Premium subscription card
  subCard: { borderRadius: 22, overflow: 'hidden', position: 'relative', padding: 24, paddingBottom: 22 },
  subBg: { ...StyleSheet.absoluteFillObject },
  subTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  subBrand: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  subPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  subPillActive: { backgroundColor: 'rgba(34,197,94,0.18)', borderColor: 'rgba(34,197,94,0.45)' },
  subPillText: { fontFamily: fonts.sansBold, fontSize: 10, color: '#fff', letterSpacing: 1 },
  subLbl: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 1.4, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 },
  subPlan: { fontFamily: fonts.serif, fontSize: 32, color: '#fff' },
  subPlanItalic: { fontFamily: fonts.serifItalic, fontSize: 32, color: '#f5a623' },
  subPrice: { fontFamily: fonts.serifItalic, fontSize: 38, color: '#fff' },
  subPer: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(255,255,255,0.55)', marginLeft: 4 },
  subIncl: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  subInclItem: { fontFamily: fonts.sansMedium, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  subFoot: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  subFootLbl: { fontFamily: fonts.sansSemiBold, fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' },
  subFootVal: { fontFamily: fonts.sansMedium, fontSize: 12, color: '#fff', marginTop: 3 },
  subManage: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)' },
  subManageText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: '#fff', letterSpacing: 0.5 },

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

  statsRow: { flexDirection: 'row', gap: 10 },
  statCell: { flex: 1, alignItems: 'center', backgroundColor: colors.surf, borderRadius: 16, paddingVertical: 16, borderWidth: 1, borderColor: colors.line },
  statNum: { fontFamily: fonts.serifItalic, fontSize: 30, lineHeight: 34 },
  statLbl: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.ink3, marginTop: 4, letterSpacing: 0.3 },

  goalCard: { backgroundColor: colors.surf, borderRadius: radii.card, padding: 22, borderWidth: 1, borderColor: colors.line },
  goalText: { fontFamily: fonts.serifItalic, fontSize: 22, color: colors.ink, marginTop: 8 },

  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  listRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  listLabel: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink },
  listSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3, marginTop: 2 },
  signout: { alignItems: 'center', paddingVertical: 16 },
  signoutText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink3, textDecorationLine: 'underline' },
});
