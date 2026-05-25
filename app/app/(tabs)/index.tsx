import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MultiRing from '../../src/components/MultiRing';
import Avatar from '../../src/components/Avatar';
import Icon from '../../src/components/Icon';
import MealScanOverlay from '../../src/components/MealScanOverlay';
import { colors, fonts, gradients, radii, shadows } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchDailyTotals, recomputeWithPacks, fetchWeekPcts, DailyTotals } from '../../src/lib/dailyTotals';
import { logIntake, untakeIntake } from '../../src/lib/api';
import { ensureSession } from '../../src/lib/session';

const DAYS_SHORT  = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS      = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type DayData = { date: string; pcts: [number, number, number] };

function weekDays(): { date: Date; iso: string }[] {
  const out: { date: Date; iso: string }[] = [];
  const today = new Date();
  const offset = (today.getDay() + 6) % 7;
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
  const [name, setName] = useState('');
  const [avatarLetter, setAvatarLetter] = useState('A');
  const [userId, setUserId] = useState<string | null>(null);
  const [totals, setTotals] = useState<DailyTotals | null>(null);
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [mealsScanned, setMealsScanned] = useState(0);
  const [streak, setStreak] = useState(0);

  // One-time name setup. Shows on first home load if we couldn't resolve a
  // real name from profiles / user_metadata / a non-'Athlete' cache.
  const [askName, setAskName] = useState(false);
  const [draftName, setDraftName] = useState('');
  // Synchronous gate — guarantees the modal cannot re-open after Save/Skip
  // even if useFocusEffect re-fires before AsyncStorage.setItem resolves.
  const namePromptHandled = useRef(false);

  const today    = new Date();
  const dateLbl  = `${DAYS_SHORT[today.getDay()]} · ${MONTHS[today.getMonth()]} ${today.getDate()}`;
  const todayIso = today.toISOString().split('T')[0];

  const loadData = async () => {
    try {
      // Use ensureSession which combines live session + cached tokens.
      // supabase.auth.getUser() can return null in Expo Go after reload even
      // when the user IS authenticated (AsyncStorage hiccup).
      const { userId: uid } = await ensureSession();
      if (!uid) { console.log('[home] no auth session'); return; }
      setUserId(uid);
      const userEmail = (await supabase.auth.getUser()).data?.user?.email || '';

      try {
        const { data: p } = await supabase
          .from('profiles')
          .select('display_name, full_name, avatar_letter')
          .eq('id', uid)
          .maybeSingle();
        let cachedName = '';
        try { cachedName = (await AsyncStorage.getItem('lifecode.user_name')) || ''; } catch {}
        // Reject the legacy 'Athlete' fallback that earlier sessions may have cached
        const goodCached = cachedName && cachedName !== 'Athlete' ? cachedName : '';
        let metaName = '';
        try {
          const { data: ud } = await supabase.auth.getUser();
          metaName = ud?.user?.user_metadata?.display_name
                  || ud?.user?.user_metadata?.full_name
                  || '';
        } catch {}
        // alex.smith@gmail.com → "Alex" — much better than "Athlete" when no name is set
        const localPart = (userEmail.split('@')[0] || '').split(/[^a-zA-Z]+/).find(s => s.length > 0) || '';
        const emailName = localPart ? localPart.charAt(0).toUpperCase() + localPart.slice(1).toLowerCase() : '';

        // Strong name sources first: the user explicitly set this somewhere.
        const strongName = p?.display_name || p?.full_name || metaName || goodCached || '';
        const displayName = strongName || emailName || 'You';
        setName(displayName);
        setAvatarLetter((p?.avatar_letter || displayName.charAt(0) || 'A').toUpperCase());

        // Prompt for a name ONCE if we couldn't resolve a strong one.
        // Multiple gates so the modal never spams:
        //  1. namePromptHandled.current — synchronous, blocks further opens
        //     this session even before any async write completes.
        //  2. lifecode.name_prompt_done in AsyncStorage — persists across
        //     app restarts.
        if (!strongName && !namePromptHandled.current) {
          let asked = '';
          try { asked = (await AsyncStorage.getItem('lifecode.name_prompt_done')) || ''; } catch {}
          if (asked) {
            namePromptHandled.current = true;  // sync up the ref for this session
          } else {
            setDraftName(emailName);
            setAskName(true);
          }
        }

        if (strongName) {
          try { await AsyncStorage.setItem('lifecode.user_name', strongName); } catch {}
        }
      } catch (e: any) { console.log('[home] profile read failed:', e?.message); }

      try {
        const t = await fetchDailyTotals(uid);
        setTotals(t);
      } catch (e: any) {
        console.log('[home] fetchDailyTotals threw:', e?.message);
      }

      try {
        // Real per-day percentages computed server-side via /api/me/state.
        // Each day's rings reflect actual pack+food consumption, not just binary 100/0.
        const weekPcts = await fetchWeekPcts();
        const wd: DayData[] = weekPcts.map(d => ({
          date: d.iso,
          pcts: [d.morningPct, d.essentialsPct, d.recoveryPct],
        }));
        setWeekData(wd);
      } catch (e: any) { console.log('[home] week aggregate failed:', e?.message); }

      try {
        const sixtyAgo = new Date(); sixtyAgo.setDate(sixtyAgo.getDate() - 60);
        const { data: allLogs } = await supabase
          .from('intake_logs').select('taken_at')
          .eq('user_id', uid)
          .gte('taken_at', sixtyAgo.toISOString());
        const all: Record<string, boolean> = {};
        (allLogs || []).forEach((l: any) => { all[l.taken_at.split('T')[0]] = true; });

        let s = 0;
        for (let i = 0; i < 60; i++) {
          const d = new Date(); d.setDate(d.getDate() - i);
          const iso = d.toISOString().split('T')[0];
          if (iso === todayIso && !all[iso]) continue;
          if (all[iso]) s++;
          else if (iso !== todayIso) break;
        }
        setStreak(s);
      } catch (e: any) { console.log('[home] streak failed:', e?.message); }

      try {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const { count } = await supabase
          .from('meal_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid)
          .gte('logged_at', monthStart);
        setMealsScanned(count || 0);
      } catch (e: any) { console.log('[home] meal count failed:', e?.message); }
    } catch (e: any) {
      console.log('[home] loadData outer error:', e?.message);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  // Midnight rollover: poll every 30s, reload when the calendar day changes
  // so the rings reset and a fresh week-cell appears.
  const lastDateRef = useRef(todayIso);
  useEffect(() => {
    const tick = setInterval(() => {
      const now = new Date().toISOString().split('T')[0];
      if (now !== lastDateRef.current) {
        lastDateRef.current = now;
        loadData();
      }
    }, 30_000);
    return () => clearInterval(tick);
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const markTaken = async (pack: 'morning' | 'recovery') => {
    if (!userId) { console.log('[home] markTaken: no userId yet'); return; }
    const already = pack === 'morning'
      ? !!totals?.morningTaken
      : !!totals?.recoveryTaken;
    const nextMorning  = pack === 'morning'  ? !already : !!totals?.morningTaken;
    const nextRecovery = pack === 'recovery' ? !already : !!totals?.recoveryTaken;

    // INSTANT visual feedback: locally recompute every ring + pct using the
    // existing rows + new pack state. No DB round-trip needed for the UI.
    if (totals) {
      setTotals(recomputeWithPacks(totals, nextMorning, nextRecovery));
    }

    try {
      if (already) {
        // Untick: server-side DELETE so RLS doesn't block us.
        const r = await untakeIntake(pack);
        if (!r.ok) console.log('[home] intake un-take server error:', r.error);
      } else {
        // Take pack: server-side POST (service role, bypasses RLS).
        const r = await logIntake(pack);
        if (!r.ok) console.log('[home] intake server error:', r.error);
      }
    } catch (e: any) {
      console.log('[home] markTaken threw:', e?.message);
    }
    // Re-sync with the DB in the background so week/streak counters stay accurate
    loadData();
  };

  const morningPct    = totals?.morningPct    ?? 0;
  const essentialsPct = totals?.essentialsPct ?? 0;
  const recoveryPct   = totals?.recoveryPct   ?? 0;
  const totalPct      = totals?.totalPct      ?? 0;
  const morningTaken  = totals?.morningTaken  ?? false;
  const recoveryTaken = totals?.recoveryTaken ?? false;
  const takenCount    = (morningTaken ? 1 : 0) + (recoveryTaken ? 1 : 0);

  const todayWeekIdx = (today.getDay() + 6) % 7;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.ink3} />}
      >
        <View style={s.head}>
          <View style={{ flex: 1 }}>
            <Text style={s.date}>{dateLbl}</Text>
            <Text style={s.h1}>Today</Text>
          </View>
          <Pressable onPress={() => router.push('/profile')} hitSlop={10}>
            <Avatar name={avatarLetter} size={38} gradient={gradients.brand} border={2} borderColor="#fff" />
          </Pressable>
        </View>

        <TouchableOpacity style={s.card} onPress={() => router.push('/details')} activeOpacity={0.85}>
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
                { pct: morningPct,    gradient: gradients.morning  },
                { pct: essentialsPct, color: colors.ink            },
                { pct: recoveryPct,   gradient: gradients.recovery },
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
            <LegendCol pct={morningPct}    name="Morning"    gradient={gradients.morning}  />
            <LegendCol pct={essentialsPct} name="Essentials" color={colors.ink}            />
            <LegendCol pct={recoveryPct}   name="Recovery"   gradient={gradients.recovery} />
          </View>
          <View style={s.tapHint}>
            <Text style={s.tapHintText}>TAP FOR DETAILS</Text>
            <Icon name="chevron" size={12} color={colors.ink3} strokeWidth={2} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.ctaDark} onPress={() => setScanOpen(true)} activeOpacity={0.85}>
          <View>
            <Text style={s.ctaDarkEyebrow}>AI MEAL SCAN</Text>
            <Text style={s.ctaDarkTitle}>Log a <Text style={{ fontFamily: fonts.serifItalic }}>meal</Text></Text>
          </View>
          <View style={s.ctaDarkBubble}>
            <Icon name="camera" size={18} color="#fff" strokeWidth={1.8} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={() => router.push('/week')} activeOpacity={0.85}>
          <View style={s.eyebrowRow}>
            <Text style={s.eyebrow}>THIS WEEK</Text>
            <Text style={s.eyebrowStat}>
              <Text style={s.numSerif}>{weekData.filter(d => d.pcts[0] > 0 || d.pcts[1] > 0 || d.pcts[2] > 0).length}</Text>
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
                  <MultiRing size={30} stroke={2.5} gap={1} items={[
                    { pct: d.pcts[0], gradient: gradients.morning  },
                    { pct: d.pcts[1], color: colors.ink            },
                    { pct: d.pcts[2], gradient: gradients.recovery },
                  ]} />
                  {isToday ? (
                    <View style={s.todayPill}><Text style={[s.weekNum, { color: '#fff' }]}>{dayNum}</Text></View>
                  ) : (
                    <Text style={s.weekNum}>{dayNum}</Text>
                  )}
                </View>
              );
            })}
          </View>
          <View style={s.tapHint}>
            <Text style={s.tapHintText}>TAP TO REVIEW PAST DAYS</Text>
            <Icon name="chevron" size={12} color={colors.ink3} strokeWidth={2} />
          </View>
        </TouchableOpacity>

        <Text style={[s.eyebrow, { marginLeft: 4, marginBottom: 8, marginTop: 4 }]}>AWARDS &amp; STREAKS</Text>
        <View style={s.awards}>
          <AwardCard icon="flame"   bg={colors.ink}    big={streak}                                          title="Day"      em="streak"  sub={streak > 0 ? `${streak} days running` : 'Start your streak'} />
          <AwardCard icon="sparkle" bg="grad-morning"  big={morningPct === 100 ? '✓' : `${morningPct}%`}     title="Morning"  em="coded"   sub={morningPct >= 85 ? 'Fully coded' : 'Add food + pack'} />
          <AwardCard icon="moon"    bg="grad-recovery" big={recoveryPct === 100 ? '✓' : `${recoveryPct}%`}   title="Recovery" em="coded"   sub={recoveryPct >= 85 ? 'Closed tonight' : 'Add food + pack'} />
          <AwardCard icon="camera"  bg={colors.ink}    big={totals?.mealsCount ?? 0}                          title="Meals"    em="scanned" sub="Today" />
        </View>

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
              name="code·charge"
              time="AM"
              meta="Vit A · C · D3 · E · K2 · B12 · B-Complex · Zn · Cu · Mg · Se"
              onPress={() => markTaken('morning')}
            />
            <PackRow
              done={recoveryTaken}
              gradient={gradients.recovery}
              name="code·build"
              time="PM"
              meta="Malto 20g · EAA 7g · Creatine 5g · Glutamine 3g · HMB · Tart Cherry · Pink Salt · Mg · L-Theanine · AstraGin"
              onPress={() => markTaken('recovery')}
            />
          </View>
        </View>
      </ScrollView>

      <MealScanOverlay visible={scanOpen} onClose={() => setScanOpen(false)} onSaved={loadData} totals={totals} />

      {/* One-time name setup. Shown only when we couldn't resolve a strong
          name from the user's account; dismissible and never shown again. */}
      <Modal visible={askName} animationType="fade" transparent onRequestClose={() => {
        namePromptHandled.current = true;
        setAskName(false);
        AsyncStorage.setItem('lifecode.name_prompt_done', '1').catch(() => {});
      }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={ns.backdrop}>
          <View style={ns.card}>
            <Text style={ns.title}>What should we call you?</Text>
            <Text style={ns.sub}>Used in your dashboard, AI coach, and welcome screen.</Text>
            <TextInput
              style={ns.input}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Your name"
              placeholderTextColor={colors.ink3}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={() => saveAskedName(draftName)}
              maxLength={40}
            />
            <View style={ns.row}>
              <TouchableOpacity
                style={[ns.btn, ns.btnGhost]}
                onPress={() => {
                  namePromptHandled.current = true;
                  setAskName(false);
                  AsyncStorage.setItem('lifecode.name_prompt_done', '1').catch(() => {});
                }}
              >
                <Text style={ns.btnGhostText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[ns.btn, ns.btnPrimary]} onPress={() => saveAskedName(draftName)}>
                <Text style={ns.btnPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );

  async function saveAskedName(value: string) {
    // Set the synchronous gate FIRST. Even if the user is mashing buttons
    // and useFocusEffect re-runs loadData immediately, the ref already
    // blocks the modal from re-opening this session.
    namePromptHandled.current = true;
    setAskName(false);

    const trimmed = value.trim();
    AsyncStorage.setItem('lifecode.name_prompt_done', '1').catch(() => {});
    if (!trimmed) return;

    setName(trimmed);
    setAvatarLetter((trimmed.charAt(0) || 'A').toUpperCase());
    AsyncStorage.setItem('lifecode.user_name', trimmed).catch(() => {});
    if (userId) {
      try {
        await supabase.from('profiles').upsert(
          { id: userId, display_name: trimmed },
          { onConflict: 'id' },
        );
      } catch {}
    }
  }
}

function LegendCol({ pct, name, gradient, color }: { pct: number; name: string; gradient?: string[]; color?: string }) {
  return (
    <View style={s.legendCol}>
      {gradient ? (
        <LinearGradient colors={gradient as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.swatch} />
      ) : (
        <View style={[s.swatch, { backgroundColor: color || colors.ink }]} />
      )}
      <Text style={s.legendVal}>{pct}%</Text>
      <Text style={s.legendName}>{name}</Text>
    </View>
  );
}

function AwardCard({ icon, bg, big, title, em, sub }: { icon: string; bg: string; big: number | string; title: string; em: string; sub: string }) {
  const isGrad = bg.startsWith('grad-');
  const gradient: string[] = bg === 'grad-morning' ? gradients.morning : bg === 'grad-recovery' ? gradients.recovery : [];
  return (
    <View style={s.award}>
      <View style={[s.awardIco, !isGrad && { backgroundColor: bg }]}>
        {isGrad && (
          <LinearGradient colors={gradient as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill as any} />
        )}
        <Icon name={icon} size={16} color="#fff" strokeWidth={1.8} />
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
  h1: { fontFamily: fonts.serifItalic, fontSize: 34, lineHeight: 36, color: colors.ink, marginTop: 4, letterSpacing: -0.8 },

  card: { backgroundColor: colors.surf, borderRadius: radii.card, padding: 20, borderWidth: 1, borderColor: colors.line, ...shadows.card },
  eyebrowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 2.2, color: colors.ink3, textTransform: 'uppercase' },
  eyebrowStat: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.ink3, letterSpacing: 0.2 },
  eyebrowSm: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.ink3 },
  numSerif: { fontFamily: fonts.serifItalic, fontSize: 14, color: colors.ink },

  ringStage: { alignItems: 'center', justifyContent: 'center', marginVertical: 8, height: 220 },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  bigPct: { fontFamily: fonts.serifItalic, fontSize: 56, lineHeight: 56, color: colors.ink, letterSpacing: -2 },
  bigPctUnit: { fontFamily: fonts.serifItalic, fontSize: 22, color: colors.ink3, marginTop: 8, letterSpacing: -0.5 },
  codedLbl: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 2.4, color: colors.ink3, marginTop: 2 },

  legend: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 6 },
  legendCol: { alignItems: 'center', gap: 4, flex: 1 },
  swatch: { width: 30, height: 6, borderRadius: 3 },
  legendVal: { fontFamily: fonts.serifItalic, fontSize: 18, color: colors.ink },
  legendName: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3 },

  tapHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(13,13,15,0.04)' },
  tapHintText: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 2, color: colors.ink3 },

  ctaDark: { backgroundColor: colors.ink, borderRadius: radii.card, paddingHorizontal: 22, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ctaDarkEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 2.2, color: 'rgba(250,250,250,0.55)' },
  ctaDarkTitle: { fontFamily: fonts.sansSemiBold, fontSize: 22, color: '#FAFAFA', marginTop: 4 },
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

const ns = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,10,11,0.55)', justifyContent: 'center', paddingHorizontal: 22 },
  card: { backgroundColor: colors.surf, borderRadius: radii.card, padding: 22, gap: 14 },
  title: { fontFamily: fonts.serifItalic, fontSize: 24, color: colors.ink, letterSpacing: -0.5 },
  sub: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink3, marginTop: -6 },
  input: {
    fontFamily: fonts.sansSemiBold, fontSize: 18, color: colors.ink,
    borderBottomWidth: 1.5, borderBottomColor: colors.line2,
    paddingVertical: 10, marginTop: 6,
  },
  row: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 999, alignItems: 'center' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line2 },
  btnGhostText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink3, letterSpacing: 1.2 },
  btnPrimary: { backgroundColor: colors.ink },
  btnPrimaryText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: '#fff', letterSpacing: 1.2 },
});
