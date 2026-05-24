import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MultiRing from '../../src/components/MultiRing';
import Avatar from '../../src/components/Avatar';
import Icon from '../../src/components/Icon';
import MealScanOverlay from '../../src/components/MealScanOverlay';
import { colors, fonts, gradients, radii, shadows } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';

const DAYS_SHORT  = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS      = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type DayData = { date: string; pcts: [number, number] };

function weekDays(): { date: Date; iso: string }[] {
  const out: { date: Date; iso: string }[] = [];
  const today = new Date();
  const offset = (today.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - offset);
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    out.push({ date: d, iso: d.toISOString().split('T')[0] });
  }
  return out;
}

export default function SummaryScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [name, setName] = useState('Athlete');
  const [avatarLetter, setAvatarLetter] = useState('A');
  const [userId, setUserId] = useState<string | null>(null);
  const [morningTaken, setMorningTaken] = useState(false);
  const [recoveryTaken, setRecoveryTaken] = useState(false);
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [mealsScanned, setMealsScanned] = useState(0);
  const [streak, setStreak] = useState(0);

  const today    = new Date();
  const dateLbl  = `${DAYS_SHORT[today.getDay()]} · ${MONTHS[today.getMonth()]} ${today.getDate()}`;
  const todayIso = today.toISOString().split('T')[0];

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: p } = await supabase
      .from('profiles')
      .select('display_name, full_name, avatar_letter')
      .eq('id', user.id)
      .maybeSingle();

    const displayName = p?.display_name || p?.full_name || user.email?.split('@')[0] || 'Athlete';
    setName(displayName);
    setAvatarLetter((p?.avatar_letter || displayName.charAt(0) || 'A').toUpperCase());

    // Pack intake — this week
    const week = weekDays();
    const weekStart = week[0].iso + 'T00:00:00.000Z';
    const weekEnd   = week[6].iso + 'T23:59:59.999Z';

    const { data: logs } = await supabase
      .from('intake_logs')
      .select('pack, taken_at')
      .eq('user_id', user.id)
      .gte('taken_at', weekStart)
      .lte('taken_at', weekEnd);

    const byDate: Record<string, Set<string>> = {};
    (logs || []).forEach((l: any) => {
      const d = l.taken_at.split('T')[0];
      if (!byDate[d]) byDate[d] = new Set();
      byDate[d].add(l.pack);
    });

    const wd: DayData[] = week.map(w => {
      const s = byDate[w.iso];
      const m = s?.has('morning')  ? 100 : 0;
      const r = s?.has('recovery') ? 100 : 0;
      return { date: w.iso, pcts: [m, r] };
    });
    setWeekData(wd);

    const todaySet = byDate[todayIso];
    setMorningTaken(!!todaySet?.has('morning'));
    setRecoveryTaken(!!todaySet?.has('recovery'));

    // Streak: consecutive days back from today with at least one pack
    let streakCount = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      if (iso === todayIso && !byDate[iso]) continue;
      if (byDate[iso] && byDate[iso].size > 0) streakCount++;
      else if (iso !== todayIso) break;
    }
    setStreak(streakCount);

    // Meals scanned this month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const { count } = await supabase
      .from('meals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('logged_at', monthStart);
    setMealsScanned(count || 0);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const refresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const markTaken = async (pack: 'morning' | 'recovery') => {
    if (!userId) return;
    const already = pack === 'morning' ? morningTaken : recoveryTaken;
    if (already) {
      // Toggle off: remove today's log
      const startIso = todayIso + 'T00:00:00.000Z';
      const endIso   = todayIso + 'T23:59:59.999Z';
      await supabase.from('intake_logs').delete().eq('user_id', userId).eq('pack', pack).gte('taken_at', startIso).lte('taken_at', endIso);
      if (pack === 'morning') setMorningTaken(false); else setRecoveryTaken(false);
      return;
    }
    await supabase.from('intake_logs').insert({ user_id: userId, pack, taken_at: new Date().toISOString() });
    if (pack === 'morning') setMorningTaken(true);
    else setRecoveryTaken(true);
  };

  const morningPct  = morningTaken  ? 100 : 0;
  const recoveryPct = recoveryTaken ? 100 : 0;
  const totalPct    = Math.round((morningPct + recoveryPct) / 2);
  const takenCount  = (morningTaken ? 1 : 0) + (recoveryTaken ? 1 : 0);

  const todayWeekIdx = (today.getDay() + 6) % 7;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.ink3} />}
      >
        {/* Header */}
        <View style={s.head}>
          <View style={{ flex: 1 }}>
            <Text style={s.date}>{dateLbl}</Text>
            <Text style={s.h1}>Today</Text>
          </View>
          <Pressable onPress={() => router.push('/profile')} hitSlop={10}>
            <Avatar name={avatarLetter} size={38} gradient={['#e26a1f', '#4a3aa8']} border={2} borderColor="#fff" />
          </Pressable>
        </View>

        {/* Life Ring */}
        <View style={s.card}>
          <View style={s.eyebrowRow}>
            <Text style={s.eyebrow}>LIFE RING</Text>
            <Text style={s.eyebrowStat}>
              <Text style={s.numSerif}>{totalPct}</Text>
              <Text style={s.eyebrowSm}>% coded</Text>
            </Text>
          </View>
          <View style={s.ringStage}>
            <MultiRing
              size={220}
              stroke={16}
              gap={6}
              items={[
                { pct: morningPct,  gradient: gradients.morning  },
                { pct: recoveryPct, gradient: gradients.recovery },
              ]}
            />
            <View style={s.ringCenter}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Text style={s.bigPct}>{totalPct}</Text>
                <Text style={s.bigPctUnit}>%</Text>
              </View>
              <Text style={s.codedLbl}>CODED</Text>
            </View>
          </View>
          <View style={s.legend}>
            <LegendCol pct={morningPct}  name="Morning"    gradient={gradients.morning}  />
            <LegendCol pct={recoveryPct} name="Recovery"   gradient={gradients.recovery} />
          </View>
        </View>

        {/* Log a meal */}
        <TouchableOpacity style={s.ctaDark} onPress={() => setScanOpen(true)} activeOpacity={0.85}>
          <View>
            <Text style={s.ctaDarkEyebrow}>AI MEAL SCAN</Text>
            <Text style={s.ctaDarkTitle}>Log a <Text style={{ fontFamily: fonts.serifItalic }}>meal</Text></Text>
          </View>
          <View style={s.ctaDarkBubble}>
            <Icon name="camera" size={18} color="#fff" strokeWidth={1.8} />
          </View>
        </TouchableOpacity>

        {/* This week */}
        <View style={s.card}>
          <View style={s.eyebrowRow}>
            <Text style={s.eyebrow}>THIS WEEK</Text>
            <Text style={s.eyebrowStat}>
              <Text style={s.numSerif}>{weekData.filter(d => d.pcts[0] > 0 || d.pcts[1] > 0).length}</Text>
              <Text style={s.eyebrowSm}>/7 days</Text>
            </Text>
          </View>
          <View style={s.weekRow}>
            {weekData.map((d, i) => {
              const isToday = i === todayWeekIdx;
              const dayNum = new Date(d.date + 'T00:00:00').getDate();
              return (
                <View key={d.date} style={s.weekCell}>
                  <Text style={s.weekLbl}>{WEEK_LABELS[i]}</Text>
                  <MultiRing size={30} stroke={3} gap={1.5} items={[
                    { pct: d.pcts[0], gradient: gradients.morning  },
                    { pct: d.pcts[1], gradient: gradients.recovery },
                  ]} />
                  {isToday ? (
                    <View style={s.todayPill}>
                      <Text style={[s.weekNum, { color: '#fff' }]}>{dayNum}</Text>
                    </View>
                  ) : (
                    <Text style={s.weekNum}>{dayNum}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Awards & Streaks */}
        <Text style={[s.eyebrow, { marginLeft: 4, marginBottom: 8, marginTop: 4 }]}>AWARDS &amp; STREAKS</Text>
        <View style={s.awards}>
          <AwardCard icon="flame"   bg={colors.ink}     iconColor="#fff" big={streak}        title="Day"      em="streak"  sub={streak > 0 ? `Best: ${streak} days` : 'Start your streak'} />
          <AwardCard icon="sparkle" bg="grad-morning"   iconColor="#fff" big={morningPct === 100 ? 1 : 0} title="Morning" em="perfect" sub={morningPct === 100 ? '100% today' : 'Mark Morning'} />
          <AwardCard icon="moon"    bg="grad-recovery"  iconColor="#fff" big={recoveryPct === 100 ? 1 : 0} title="Recovery" em="streak"  sub={recoveryPct === 100 ? 'Closed tonight' : 'Mark Recovery'} />
          <AwardCard icon="camera"  bg={colors.ink}     iconColor="#fff" big={mealsScanned}  title="Meals"    em="scanned" sub="This month" />
        </View>

        {/* Taken today */}
        <View style={s.card}>
          <View style={s.eyebrowRow}>
            <Text style={s.eyebrow}>TAKEN TODAY</Text>
            <Text style={s.eyebrowStat}>
              <Text style={s.numSerif}>{takenCount}</Text>
              <Text style={s.eyebrowSm}> / 2</Text>
            </Text>
          </View>
          <View style={{ gap: 12, marginTop: 6 }}>
            <PackRow
              done={morningTaken}
              gradient={gradients.morning}
              name="Morning pack"
              time="8:00"
              meta="Vit D · B-Complex · Zinc · Magnesium"
              onPress={() => markTaken('morning')}
            />
            <PackRow
              done={recoveryTaken}
              gradient={gradients.recovery}
              name="Recovery pack"
              time="post-workout"
              meta="EAA · Creatine · HMB · Tart Cherry"
              onPress={() => markTaken('recovery')}
            />
          </View>
        </View>
      </ScrollView>

      <MealScanOverlay visible={scanOpen} onClose={() => setScanOpen(false)} onSaved={loadData} />
    </SafeAreaView>
  );
}

function LegendCol({ pct, name, gradient }: { pct: number; name: string; gradient: string[] }) {
  return (
    <View style={s.legendCol}>
      <LinearGradient colors={gradient as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.swatch} />
      <Text style={s.legendVal}>{pct}%</Text>
      <Text style={s.legendName}>{name}</Text>
    </View>
  );
}

function AwardCard({ icon, bg, iconColor, big, title, em, sub }: { icon: string; bg: string; iconColor: string; big: number | string; title: string; em: string; sub: string }) {
  const isGrad = bg.startsWith('grad-');
  const gradient: string[] = bg === 'grad-morning' ? gradients.morning : bg === 'grad-recovery' ? gradients.recovery : [];
  return (
    <View style={s.award}>
      <View style={[s.awardIco, !isGrad && { backgroundColor: bg }]}>
        {isGrad && (
          <LinearGradient colors={gradient as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill as any} />
        )}
        <Icon name={icon} size={16} color={iconColor} strokeWidth={1.8} />
      </View>
      <Text style={s.awardBig}>{big}</Text>
      <Text style={s.awardTitle}>
        {title} <Text style={{ fontFamily: fonts.serifItalic }}>{em}</Text>
      </Text>
      <Text style={s.awardSub}>{sub}</Text>
    </View>
  );
}

function PackRow({ done, gradient, name, time, meta, onPress }: { done: boolean; gradient: string[]; name: string; time: string; meta: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={s.packRow}>
      <View style={s.packPillWrap}>
        <LinearGradient
          colors={gradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={s.packPill}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.packName}>{name}</Text>
        <Text style={s.packMeta}>
          <Text style={{ fontFamily: fonts.serifItalic }}>{time}</Text> · {meta}
        </Text>
      </View>
      <View style={[s.checkCircle, done && { backgroundColor: colors.ink, borderColor: colors.ink }]}>
        {done && <Icon name="check" size={14} color="#fff" strokeWidth={2.5} />}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 110, gap: 14 },

  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, marginTop: 4 },
  date: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 2.4, color: colors.ink3 },
  h1: { fontFamily: fonts.serifItalic, fontSize: 34, lineHeight: 36, color: colors.ink, marginTop: 4 },

  card: { backgroundColor: colors.surf, borderRadius: radii.card, padding: 20, borderWidth: 1, borderColor: colors.line, ...shadows.card },
  eyebrowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 2.2, color: colors.ink3, textTransform: 'uppercase' },
  eyebrowStat: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.ink3, letterSpacing: 0.2 },
  eyebrowSm: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.ink3 },
  numSerif: { fontFamily: fonts.serifItalic, fontSize: 14, color: colors.ink },

  ringStage: { alignItems: 'center', justifyContent: 'center', marginVertical: 8, height: 220 },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  bigPct: { fontFamily: fonts.serifItalic, fontSize: 54, lineHeight: 54, color: colors.ink },
  bigPctUnit: { fontFamily: fonts.serifItalic, fontSize: 22, color: colors.ink, marginTop: 6 },
  codedLbl: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 2.4, color: colors.ink3, marginTop: 2 },

  legend: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 6 },
  legendCol: { alignItems: 'center', gap: 4 },
  swatch: { width: 30, height: 6, borderRadius: 3 },
  legendVal: { fontFamily: fonts.serifItalic, fontSize: 18, color: colors.ink },
  legendName: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3 },

  ctaDark: { backgroundColor: colors.ink, borderRadius: radii.card, paddingHorizontal: 22, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ctaDarkEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 2.2, color: 'rgba(250,250,247,0.55)' },
  ctaDarkTitle: { fontFamily: fonts.sansSemiBold, fontSize: 22, color: '#fafaf7', marginTop: 4 },
  ctaDarkBubble: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' },

  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  weekCell: { alignItems: 'center', gap: 6, flex: 1 },
  weekLbl: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 1.6, color: colors.ink3 },
  weekNum: { fontFamily: fonts.serifItalic, fontSize: 14, color: colors.ink },
  todayPill: { backgroundColor: colors.ink, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1 },

  awards: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  award: { width: '47.5%', backgroundColor: colors.surf, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 6 },
  awardIco: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  awardBig: { fontFamily: fonts.serifItalic, fontSize: 32, lineHeight: 34, color: colors.ink, marginTop: 4 },
  awardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  awardSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3 },

  packRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  packPillWrap: { width: 8, height: 38, borderRadius: 4, overflow: 'hidden' },
  packPill: { flex: 1 },
  packName: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  packMeta: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3, marginTop: 2 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: colors.line2, alignItems: 'center', justifyContent: 'center' },
});
