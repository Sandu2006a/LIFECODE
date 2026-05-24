import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Pressable, Modal, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../src/components/Icon';
import { colors, fonts, gradients, radii, shadows } from '../src/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/lib/supabase';
import { ensureSession, authHeaders } from '../src/lib/session';
import { lifecodeFetch } from '../src/lib/api';

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type WorkoutType = 'strength' | 'cardio' | 'mobility' | 'class';
type Workout = { id: string; type: WorkoutType; name: string; time: string; dur: number };

const WORKOUT_TYPES: { id: WorkoutType; label: string; color: string; gradient?: string[] }[] = [
  { id: 'strength', label: 'Strength', color: colors.morning },
  { id: 'cardio',   label: 'Cardio',   color: colors.recovery },
  { id: 'mobility', label: 'Mobility', color: colors.ink },
  { id: 'class',    label: 'Class',    color: colors.morning, gradient: gradients.brand },
];

function getThisWeek(): { d: number; today: boolean }[] {
  const today = new Date();
  const offset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { d: d.getDate(), today: i === offset };
  });
}

const DUR_OPTIONS = [20, 30, 45, 60, 75, 90, 120];

export default function ProfileScreen() {
  const [name, setName] = useState('Athlete');
  const [email, setEmail] = useState('');
  const [sport, setSport] = useState('');

  const [selectedDay, setSelectedDay] = useState(((new Date().getDay() + 6) % 7));
  const [workouts, setWorkouts] = useState<Record<number, Workout[]>>({ 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] });
  const [sheet, setSheet] = useState<{ initial: Workout | null } | null>(null);

  const [streak, setStreak] = useState(0);
  const [recoveries, setRecoveries] = useState(0);
  const [meals, setMeals] = useState(0);
  const [scoreData, setScoreData] = useState([0, 0, 0, 0, 0, 0, 0]);

  // Workout chat bar state
  const [workoutInput, setWorkoutInput] = useState('');
  const [workoutParsing, setWorkoutParsing] = useState(false);
  const [workoutError, setWorkoutError] = useState('');

  // Settings preferences (local UI state — operations wired in a later pass)
  const [weightUnit, setWeightUnit]               = useState<'kg' | 'lb'>('kg');
  const [heightUnit, setHeightUnit]               = useState<'cm' | 'ft'>('cm');
  const [pushEnabled, setPushEnabled]             = useState(true);
  const [shareEnabled, setShareEnabled]           = useState(true);
  const [leaderboardVisible, setLeaderboardVisible] = useState(true);
  const [codeRevealed, setCodeRevealed]           = useState(false);
  const [morningTime]                              = useState('07:00');
  const [recoveryTime]                             = useState('19:00');
  const [summaryTime]                              = useState('21:00');

  useEffect(() => { load(); }, []);

  async function load() {
    const { userId, accessToken } = await ensureSession();
    if (!userId) { console.log('[profile] no auth'); return; }

    // Read profile via server (service role → bypasses RLS)
    let p: any = null;
    let userEmail = '';
    let userMetaName = '';
    try {
      if (accessToken) {
        const res = await lifecodeFetch('/api/me/state', {
          headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
        });
        if (res.ok) {
          const json = await res.json();
          p = json?.profile || null;
        }
      }
      // Pull email + user_metadata name from supabase auth (the activate response
      // wrote the display_name into user_metadata).
      const { data: ud } = await supabase.auth.getUser();
      userEmail    = ud?.user?.email || '';
      userMetaName = ud?.user?.user_metadata?.display_name
                  || ud?.user?.user_metadata?.full_name
                  || '';
    } catch (e: any) { console.log('[profile] server fetch failed:', e?.message); }

    // Fallback to direct supabase if server didn't return profile
    if (!p) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, full_name, email, sport, goal')
          .eq('id', userId)
          .maybeSingle();
        p = data;
      } catch {}
    }

    // Resolve display name. Priority:
    //  1) profile.display_name / full_name (server-side DB)
    //  2) supabase user_metadata (set by Supabase admin during signup)
    //  3) AsyncStorage cache (saved by activate.tsx on every successful code entry)
    //  4) email prefix
    //  5) 'Athlete' (last resort)
    let cachedName = '';
    try { cachedName = (await AsyncStorage.getItem('lifecode.user_name')) || ''; } catch {}
    const resolvedName =
      p?.display_name ||
      p?.full_name ||
      userMetaName ||
      cachedName ||
      userEmail.split('@')[0] ||
      'Athlete';

    setName(resolvedName);
    setEmail(p?.email || userEmail || '');
    setSport(p?.sport || p?.goal || '');

    // 30 days for streak + chart
    const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
    const { data: logs } = await supabase
      .from('intake_logs')
      .select('pack, taken_at')
      .eq('user_id', userId)
      .gte('taken_at', thirtyAgo.toISOString());

    const byDate: Record<string, Set<string>> = {};
    (logs || []).forEach((l: any) => {
      const d = l.taken_at.split('T')[0];
      if (!byDate[d]) byDate[d] = new Set();
      byDate[d].add(l.pack);
    });

    const todayIso = new Date().toISOString().split('T')[0];
    let st = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      if (iso === todayIso && !byDate[iso]) continue;
      if (byDate[iso] && byDate[iso].size > 0) st++;
      else if (iso !== todayIso) break;
    }
    setStreak(st);
    setRecoveries(Object.values(byDate).filter(s => s.has('recovery')).length);

    // 7-day score chart (this week, % of 2 packs)
    const offset = (new Date().getDay() + 6) % 7;
    const monday = new Date(); monday.setDate(monday.getDate() - offset);
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const s = byDate[iso];
      const m = s?.has('morning') ? 50 : 0;
      const r = s?.has('recovery') ? 50 : 0;
      return m + r;
    });
    setScoreData(week);

    // Meals this month
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { count } = await supabase
      .from('meal_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('logged_at', monthStart);
    setMeals(count || 0);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/activate');
  }

  const dayWorkouts = workouts[selectedDay] || [];
  const week = getThisWeek();
  const avgScore = Math.round(scoreData.reduce((a, b) => a + b, 0) / 7);

  // AI parses natural-language workout description into structured fields.
  async function parseAndAddWorkout(raw: string) {
    const text = raw.trim();
    if (!text || workoutParsing) return;
    setWorkoutParsing(true);
    setWorkoutError('');

    const fallback = (): Workout => {
      // Local rule-based fallback if Gemini isn't reachable
      const lower = text.toLowerCase();
      let type: WorkoutType = 'strength';
      if (/(run|cardio|cycl|bike|swim|jog|sprint)/.test(lower)) type = 'cardio';
      else if (/(yoga|stretch|mobility|recovery)/.test(lower)) type = 'mobility';
      else if (/(class|crossfit|hiit|group)/.test(lower)) type = 'class';
      else if (/(box|mma|jiu|judo|fight|kick)/.test(lower)) type = 'cardio';
      const durMatch = lower.match(/(\d{2,3})\s*(min|m)\b/) || lower.match(/(\d+(?:\.\d+)?)\s*h(our|r)?/);
      let dur = 45;
      if (durMatch) {
        const n = parseFloat(durMatch[1]);
        dur = durMatch[0].includes('h') ? Math.round(n * 60) : Math.round(n);
      }
      const timeMatch = lower.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/);
      let time = '07:30';
      if (timeMatch) {
        let h = parseInt(timeMatch[1] || '0');
        const m = parseInt(timeMatch[2] || '0');
        const ampm = timeMatch[3];
        if (ampm === 'pm' && h < 12) h += 12;
        if (ampm === 'am' && h === 12) h = 0;
        if (h >= 0 && h <= 23) time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
      return { id: String(Date.now()), type, name: text, time, dur };
    };

    let parsed: Workout = fallback();

    const key = process.env.EXPO_PUBLIC_GEMINI_KEY || '';
    if (key) {
      try {
        const prompt = `Extract a workout from the user text. Return ONLY this JSON (no markdown, no prose):
{"type":"strength|cardio|mobility|class","name":"short workout name (1-3 words)","time":"HH:MM 24h","duration_min":<integer>}

Rules:
- type: strength = lifting/powerlifting; cardio = running/cycling/swimming/boxing/MMA; mobility = yoga/stretching/foam; class = HIIT/crossfit/group sessions
- Default time when not specified: 07:30
- Default duration when not specified: 45

User text: "${text}"`;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
          }),
        });
        const data = await res.json();
        const raw2 = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const match = raw2.match(/\{[\s\S]*?\}/);
        if (match) {
          const obj = JSON.parse(match[0]);
          parsed = {
            id: String(Date.now()),
            type: (['strength','cardio','mobility','class'] as const).includes(obj.type) ? obj.type : 'strength',
            name: String(obj.name || text).slice(0, 50),
            time: /^\d{2}:\d{2}$/.test(obj.time) ? obj.time : parsed.time,
            dur:  Number.isFinite(Number(obj.duration_min)) ? Math.max(5, Math.min(240, Number(obj.duration_min))) : parsed.dur,
          };
        }
      } catch (e: any) {
        console.log('[workout] gemini parse failed, using fallback:', e?.message);
      }
    }

    // Add to selected day
    setWorkouts(prev => {
      const list = prev[selectedDay] || [];
      return { ...prev, [selectedDay]: [...list, parsed].sort((a, b) => a.time.localeCompare(b.time)) };
    });
    setWorkoutInput('');
    setWorkoutParsing(false);
  }

  function saveWorkout(w: Workout) {
    setWorkouts(prev => {
      const list = prev[selectedDay] || [];
      const idx = list.findIndex(x => x.id === w.id);
      const next = idx >= 0 ? list.map((x, i) => i === idx ? w : x) : [...list, w];
      return { ...prev, [selectedDay]: next.sort((a, b) => a.time.localeCompare(b.time)) };
    });
    setSheet(null);
  }
  function deleteWorkout() {
    if (!sheet?.initial) return;
    setWorkouts(prev => ({ ...prev, [selectedDay]: prev[selectedDay].filter(x => x.id !== sheet.initial!.id) }));
    setSheet(null);
  }

  const avatarLetter = (name?.[0] || 'A').toUpperCase();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header with close — shows the athlete's actual name, not generic "You" */}
        <View style={s.head}>
          <View style={{ flex: 1 }}>
            <Text style={s.date}>YOUR PROFILE</Text>
            <Text style={s.h1} numberOfLines={1}>{(name && name !== 'Athlete') ? name.split(' ')[0] : 'You'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
            <Icon name="x" size={18} color={colors.ink} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Identity strip */}
        <View style={s.idCard}>
          <View style={s.idAvatar}>
            <LinearGradient colors={gradients.brand as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <Text style={s.idLetter}>{avatarLetter}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.idName} numberOfLines={1}>{name}</Text>
            {!!email && <Text style={s.idEmail} numberOfLines={1}>{email}</Text>}
            {!!sport && (
              <View style={s.sportChip}>
                <Text style={s.sportText}>{sport}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Premium */}
        <View style={s.premium}>
          <LinearGradient
            colors={['rgba(79,70,229,0.45)', 'rgba(239,68,68,0.22)', 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[s.eyebrow, { color: 'rgba(250,250,247,0.55)' }]}>SUBSCRIPTION</Text>
          <Text style={s.premiumTitle}>LIFECODE <Text style={{ fontFamily: fonts.serifItalic }}>Pro</Text></Text>
          <Text style={s.premiumPrice}>€129<Text style={s.premiumPriceSm}>/mo</Text></Text>
          <TouchableOpacity style={s.manageBtn}>
            <Text style={s.manageBtnText}>MANAGE</Text>
          </TouchableOpacity>
        </View>

        {/* Training week */}
        <View style={s.card}>
          <View style={s.eyebrowRow}>
            <Text style={s.eyebrow}>TRAINING WEEK</Text>
            <Text style={s.eyebrowSm}>{monthRange()}</Text>
          </View>

          <View style={s.dayPills}>
            {week.map((d, i) => {
              const dayW = workouts[i] || [];
              const types = [...new Set(dayW.map(w => w.type))].slice(0, 3);
              const selected = i === selectedDay;
              return (
                <TouchableOpacity
                  key={i}
                  style={[s.dayPill, selected && s.dayPillSelected]}
                  onPress={() => setSelectedDay(i)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.dayL, selected && { color: 'rgba(255,255,255,0.6)' }]}>{WEEK_LABELS[i]}</Text>
                  <Text style={[s.dayN, selected && { color: '#fff' }, d.today && !selected && { textDecorationLine: 'underline' }]}>{d.d}</Text>
                  <View style={s.dotsRow}>
                    {types.map(t => {
                      const meta = WORKOUT_TYPES.find(x => x.id === t)!;
                      return <View key={t} style={[s.dot, { backgroundColor: meta.color }]} />;
                    })}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ marginTop: 14 }}>
            {dayWorkouts.length === 0 ? (
              <Text style={s.emptyDay}>No workouts scheduled.</Text>
            ) : dayWorkouts.map(w => {
              const meta = WORKOUT_TYPES.find(x => x.id === w.type)!;
              return (
                <TouchableOpacity key={w.id} style={s.workoutRow} onPress={() => setSheet({ initial: w })} activeOpacity={0.7}>
                  <View style={[s.workoutStripe, { backgroundColor: meta.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.workoutTime}>{w.time} · {w.dur} MIN</Text>
                    <Text style={s.workoutName}>{w.name}</Text>
                    <Text style={s.workoutMeta}>{meta.label}</Text>
                  </View>
                  <Icon name="chevron" size={16} color={colors.ink3} strokeWidth={1.8} />
                </TouchableOpacity>
              );
            })}
            {/* AI chat bar — type "boxing 1h at 7pm" → Gemini parses → saves */}
            <View style={s.workoutChat}>
              <Icon name="chat" size={14} color={colors.ink3} strokeWidth={2} />
              <TextInput
                style={s.workoutChatInput}
                value={workoutInput}
                onChangeText={setWorkoutInput}
                placeholder="Type: boxing 1h at 7pm, or strength 45min"
                placeholderTextColor={colors.ink3}
                returnKeyType="send"
                onSubmitEditing={() => parseAndAddWorkout(workoutInput)}
                editable={!workoutParsing}
              />
              {workoutParsing ? (
                <Icon name="clock" size={14} color={colors.ink3} strokeWidth={2} />
              ) : workoutInput.trim().length > 0 ? (
                <TouchableOpacity onPress={() => parseAndAddWorkout(workoutInput)} style={s.workoutChatSend} activeOpacity={0.85}>
                  <Icon name="arrow-up" size={12} color="#fff" strokeWidth={2.4} />
                </TouchableOpacity>
              ) : null}
            </View>
            {workoutError ? <Text style={s.workoutError}>{workoutError}</Text> : null}
          </View>
        </View>

        {/* 7-day score */}
        <View style={s.card}>
          <View style={s.eyebrowRow}>
            <Text style={s.eyebrow}>7-DAY SCORE</Text>
            <Text style={s.numSerif}>avg {avgScore}</Text>
          </View>
          <View style={s.chart}>
            {scoreData.map((v, i) => (
              <View key={i} style={s.chartCol}>
                <View style={[s.chartBar, { height: `${Math.max(4, v)}%` as any }]} />
                <Text style={s.chartLbl}>{WEEK_LABELS[i]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <StatPill value={String(streak)}     label="STREAK"     />
          <StatPill value={String(recoveries)} label="RECOVERIES" />
          <StatPill value={String(meals)}      label="MEALS"      />
        </View>

        {/* Settings — grouped sections */}
        <Text style={[s.eyebrow, { marginLeft: 4, marginTop: 4, marginBottom: 8 }]}>ACCOUNT</Text>
        <View style={[s.card, { padding: 0, paddingHorizontal: 20 }]}>
          <SettingsRow icon="user"   bg="grad-morning"  label="Edit profile"   chevron isFirst />
          <SettingsRow icon="chat"   bg={colors.ink}    label="Email"          value={email || '—'} chevron />
          <SettingsRow icon="track"  bg={colors.ink}    label="Lifecode code"  value={codeRevealed ? 'A6F2K' : '• • • • •'} onPress={() => setCodeRevealed(v => !v)} />
          <SettingsRow icon="sparkle" bg="grad-recovery" label="Subscription" value="Pro" chevron isLast />
        </View>

        <Text style={[s.eyebrow, { marginLeft: 4, marginTop: 18, marginBottom: 8 }]}>PREFERENCES</Text>
        <View style={[s.card, { padding: 0, paddingHorizontal: 20 }]}>
          <SettingsRow icon="dumbbell" bg={colors.ink} label="Weight units"  value={weightUnit} onPress={() => setWeightUnit(weightUnit === 'kg' ? 'lb' : 'kg')} isFirst />
          <SettingsRow icon="dumbbell" bg={colors.ink} label="Height units"  value={heightUnit} onPress={() => setHeightUnit(heightUnit === 'cm' ? 'ft' : 'cm')} />
          <SettingsRow icon="chat"     bg={colors.ink} label="Language"      value="English" chevron isLast />
        </View>

        <Text style={[s.eyebrow, { marginLeft: 4, marginTop: 18, marginBottom: 8 }]}>NOTIFICATIONS</Text>
        <View style={[s.card, { padding: 0, paddingHorizontal: 20 }]}>
          <SettingsRow icon="bell"     bg="grad-morning"  label="Push notifications" toggle={pushEnabled} onToggle={() => setPushEnabled(v => !v)} isFirst />
          <SettingsRow icon="sparkle"  bg={colors.ink}    label="Morning reminder"   value={morningTime}  chevron />
          <SettingsRow icon="moon"     bg="grad-recovery" label="Recovery reminder"  value={recoveryTime} chevron />
          <SettingsRow icon="clock"    bg={colors.ink}    label="Daily summary"      value={summaryTime}  chevron isLast />
        </View>

        <Text style={[s.eyebrow, { marginLeft: 4, marginTop: 18, marginBottom: 8 }]}>PRIVACY</Text>
        <View style={[s.card, { padding: 0, paddingHorizontal: 20 }]}>
          <SettingsRow icon="users"  bg={colors.ink} label="Share progress with friends" toggle={shareEnabled} onToggle={() => setShareEnabled(v => !v)} isFirst />
          <SettingsRow icon="flame"  bg={colors.ink} label="Show on leaderboard"         toggle={leaderboardVisible} onToggle={() => setLeaderboardVisible(v => !v)} />
          <SettingsRow icon="shield" bg={colors.ink} label="Data &amp; permissions"      chevron isLast />
        </View>

        <Text style={[s.eyebrow, { marginLeft: 4, marginTop: 18, marginBottom: 8 }]}>SUPPORT</Text>
        <View style={[s.card, { padding: 0, paddingHorizontal: 20 }]}>
          <SettingsRow icon="chat"    bg={colors.ink} label="Help center"  chevron isFirst />
          <SettingsRow icon="send"    bg={colors.ink} label="Contact us"   chevron />
          <SettingsRow icon="heart"   bg={colors.ink} label="Rate the app" chevron isLast />
        </View>

        <Text style={[s.eyebrow, { marginLeft: 4, marginTop: 18, marginBottom: 8 }]}>ABOUT</Text>
        <View style={[s.card, { padding: 0, paddingHorizontal: 20 }]}>
          <SettingsRow icon="sparkle" bg={colors.ink} label="App version"     value="1.0.0" isFirst />
          <SettingsRow icon="shield"  bg={colors.ink} label="Terms of Service" chevron />
          <SettingsRow icon="shield"  bg={colors.ink} label="Privacy Policy"   chevron isLast />
        </View>

        <View style={s.dangerCard}>
          <TouchableOpacity onPress={signOut} style={s.dangerRow} activeOpacity={0.6}>
            <Text style={s.dangerText}>Sign out</Text>
          </TouchableOpacity>
          <View style={s.dangerDivider} />
          <TouchableOpacity style={s.dangerRow} activeOpacity={0.6}>
            <Text style={s.dangerTextRed}>Reset all data</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footerNote}>LIFECODE · v1.0.0</Text>
      </ScrollView>

      {sheet && (
        <WorkoutSheet
          initial={sheet.initial}
          onClose={() => setSheet(null)}
          onSave={saveWorkout}
          onDelete={deleteWorkout}
        />
      )}
    </SafeAreaView>
  );
}

function monthRange(): string {
  const today = new Date();
  const offset = (today.getDay() + 6) % 7;
  const monday = new Date(today); monday.setDate(today.getDate() - offset);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const M = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${M[monday.getMonth()]} ${monday.getDate()} — ${sunday.getDate()}`;
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statVal}>{value}</Text>
      <Text style={s.statKey}>{label}</Text>
    </View>
  );
}

type SettingsRowProps = {
  icon: string;
  bg: string;
  label: string;
  value?: string;
  chevron?: boolean;
  toggle?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
};

function SettingsRow({ icon, bg, label, value, chevron, toggle, onToggle, onPress, isFirst, isLast }: SettingsRowProps) {
  const isGrad = bg.startsWith('grad-');
  const gradient = bg === 'grad-morning' ? gradients.morning : bg === 'grad-recovery' ? gradients.recovery : [];
  const isToggle = typeof toggle === 'boolean';
  return (
    <TouchableOpacity
      style={[s.settingsRow, !isFirst && s.settingsRowBorder]}
      activeOpacity={0.6}
      onPress={isToggle ? onToggle : onPress}
    >
      <View style={[s.settingsIco, !isGrad && { backgroundColor: bg }]}>
        {isGrad && (
          <LinearGradient colors={gradient as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill as any} />
        )}
        <Icon name={icon} size={14} color="#fff" strokeWidth={2} />
      </View>
      <Text style={s.settingsLbl}>{label}</Text>

      {!!value && <Text style={s.settingsVal}>{value}</Text>}

      {isToggle ? (
        <View style={[s.toggleTrack, toggle && s.toggleTrackOn]}>
          <View style={[s.toggleThumb, toggle && s.toggleThumbOn]} />
        </View>
      ) : (chevron || (!value && !isToggle)) ? (
        <Icon name="chevron" size={16} color={colors.ink3} strokeWidth={1.8} />
      ) : null}
    </TouchableOpacity>
  );
}

// ── Workout sheet ──
function WorkoutSheet({ initial, onClose, onSave, onDelete }: { initial: Workout | null; onClose: () => void; onSave: (w: Workout) => void; onDelete: () => void }) {
  const [type, setType] = useState<WorkoutType>(initial?.type || 'strength');
  const [name, setName] = useState(initial?.name || '');
  const [time, setTime] = useState(initial?.time || '07:30');
  const [dur, setDur]   = useState(initial?.dur  || 45);

  function adjTime(delta: number) {
    const [h, m] = time.split(':').map(Number);
    let total = h * 60 + m + delta;
    if (total < 0) total += 24 * 60;
    if (total >= 24 * 60) total -= 24 * 60;
    setTime(`${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`);
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable style={ws.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={ws.kavWrap} pointerEvents="box-none">
        <View style={ws.sheet}>
          <View style={ws.handle} />
          <Text style={ws.title}>{initial ? 'Edit workout' : 'Add workout'}</Text>

          <Text style={ws.fieldLbl}>TYPE</Text>
          <View style={ws.chips}>
            {WORKOUT_TYPES.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[ws.chip, type === t.id && ws.chipActive]}
                onPress={() => setType(t.id)}
              >
                <View style={[ws.chipDot, { backgroundColor: t.color }]} />
                <Text style={[ws.chipText, type === t.id && { color: '#fff' }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={ws.fieldLbl}>NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Upper push"
            placeholderTextColor={colors.ink3}
            style={ws.input}
          />

          <Text style={ws.fieldLbl}>TIME</Text>
          <View style={ws.timeRow}>
            <Text style={ws.timeVal}>{time}</Text>
            <View style={ws.timeCtrl}>
              <TouchableOpacity onPress={() => adjTime(-5)} style={ws.timeBtn}>
                <Icon name="minus" size={14} color={colors.ink} strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={ws.timeStep}>5 MIN</Text>
              <TouchableOpacity onPress={() => adjTime(5)} style={ws.timeBtn}>
                <Icon name="plus" size={14} color={colors.ink} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={ws.fieldLbl}>DURATION</Text>
          <View style={ws.durRow}>
            {DUR_OPTIONS.map(v => (
              <TouchableOpacity key={v} style={[ws.durChip, dur === v && ws.durChipActive]} onPress={() => setDur(v)}>
                <Text style={[ws.durText, dur === v && { color: '#fff' }]}>{v}m</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={ws.actions}>
            {initial && (
              <TouchableOpacity style={ws.delBtn} onPress={onDelete}>
                <Text style={ws.delText}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[ws.saveBtn, initial ? { flex: 1 } : { flex: 1 }]}
              onPress={() => onSave({ id: initial?.id || String(Date.now()), type, name: name || 'Workout', time, dur })}
            >
              <Text style={ws.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 40, gap: 14 },

  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, marginTop: 4 },
  date: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 2.4, color: colors.ink3 },
  h1: { fontFamily: fonts.serifItalic, fontSize: 34, color: colors.ink, marginTop: 4, letterSpacing: -0.8 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surf, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },

  idCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radii.card, backgroundColor: colors.surf, borderWidth: 1, borderColor: colors.line, ...shadows.card },
  idAvatar: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  idLetter: { fontFamily: fonts.sansSemiBold, fontSize: 22, color: '#fff' },
  idName: { fontFamily: fonts.serifItalic, fontSize: 22, color: colors.ink },
  idEmail: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3, marginTop: 2 },
  sportChip: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(79,70,229,0.10)' },
  sportText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.morning },

  premium: { backgroundColor: colors.ink, borderRadius: 24, padding: 22, overflow: 'hidden', gap: 6 },
  premiumTitle: { fontFamily: fonts.serif, fontSize: 30, color: '#FAFAFA' },
  premiumPrice: { fontFamily: fonts.serifItalic, fontSize: 48, color: '#FAFAFA', marginTop: 6, letterSpacing: -1.5 },
  premiumPriceSm: { fontFamily: fonts.sans, fontSize: 16, color: 'rgba(250,250,250,0.7)' },
  manageBtn: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, marginTop: 8 },
  manageBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1.6, color: '#fff' },

  card: { backgroundColor: colors.surf, borderRadius: radii.card, padding: 20, borderWidth: 1, borderColor: colors.line, ...shadows.card },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 2.2, color: colors.ink3, textTransform: 'uppercase' },
  eyebrowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrowSm: { fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 2.2, color: colors.ink3 },
  numSerif: { fontFamily: fonts.serifItalic, fontSize: 18, color: colors.ink },

  dayPills: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, gap: 4 },
  dayPill: { flex: 1, alignItems: 'center', borderRadius: 14, paddingVertical: 8, gap: 4, borderWidth: 1, borderColor: colors.line },
  dayPillSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  dayL: { fontFamily: fonts.sansSemiBold, fontSize: 9, letterSpacing: 1.4, color: colors.ink3, textTransform: 'uppercase' },
  dayN: { fontFamily: fonts.serifItalic, fontSize: 16, color: colors.ink },
  dotsRow: { flexDirection: 'row', gap: 3, height: 5, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 2.5 },

  emptyDay: { paddingVertical: 16, textAlign: 'center', color: colors.ink3, fontSize: 13, fontFamily: fonts.sans },
  workoutRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(13,13,15,0.04)' },
  workoutStripe: { width: 3, height: 36, borderRadius: 2 },
  workoutTime: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 1.6, color: colors.ink3 },
  workoutName: { fontFamily: fonts.serifItalic, fontSize: 20, color: colors.ink, marginTop: 2 },
  workoutMeta: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3 },
  addWorkout: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 14, paddingVertical: 12, borderRadius: 18, borderWidth: 1.5, borderColor: colors.line2, borderStyle: 'dashed' },
  addWorkoutText: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.ink2 },
  workoutChat: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.line2 },
  workoutChatInput: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.ink, paddingVertical: 0 },
  workoutChatSend: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  workoutError: { fontFamily: fonts.sans, fontSize: 11, color: '#DC2626', marginTop: 6, textAlign: 'center' },

  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 140, marginTop: 14 },
  chartCol: { flex: 1, alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' },
  chartBar: { width: 18, borderRadius: 999, backgroundColor: colors.ink, minHeight: 4 },
  chartLbl: { fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 1, color: colors.ink3 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, alignItems: 'center', backgroundColor: colors.surf, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 2 },
  statVal: { fontFamily: fonts.serifItalic, fontSize: 30, color: colors.ink },
  statKey: { fontFamily: fonts.sansSemiBold, fontSize: 9, letterSpacing: 1.8, color: colors.ink3 },

  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  settingsRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(13,13,15,0.05)' },
  settingsIco: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  settingsLbl: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
  settingsVal: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink3, marginRight: 4 },

  toggleTrack: { width: 38, height: 22, borderRadius: 999, backgroundColor: 'rgba(13,13,15,0.12)', padding: 2, justifyContent: 'center' },
  toggleTrackOn: { backgroundColor: colors.ink },
  toggleThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
  toggleThumbOn: { alignSelf: 'flex-end' },

  dangerCard: { marginTop: 18, backgroundColor: colors.surf, borderRadius: radii.card, paddingHorizontal: 20, borderWidth: 1, borderColor: colors.line, ...shadows.card },
  dangerRow: { paddingVertical: 16, alignItems: 'center' },
  dangerDivider: { height: 1, backgroundColor: 'rgba(13,13,15,0.05)' },
  dangerText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink2 },
  dangerTextRed: { fontFamily: fonts.sansMedium, fontSize: 15, color: '#DC2626' },

  footerNote: { textAlign: 'center', fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 2, color: colors.ink4, marginTop: 16, marginBottom: 8 },

  signOut: { alignItems: 'center', paddingVertical: 18 },
  signOutText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink3, textDecorationLine: 'underline' },
});

const ws = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.42)' },
  kavWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surf, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 28, gap: 12 },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: colors.ink4, marginBottom: 6 },
  title: { fontFamily: fonts.serifItalic, fontSize: 26, color: colors.ink },
  fieldLbl: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 2.2, color: colors.ink3, marginTop: 6 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.line2 },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.ink2 },

  input: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, fontFamily: fonts.sans, fontSize: 14, color: colors.ink },

  timeRow: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeVal: { fontFamily: fonts.serifItalic, fontSize: 26, color: colors.ink },
  timeCtrl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.line2, alignItems: 'center', justifyContent: 'center' },
  timeStep: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 1.8, color: colors.ink3 },

  durRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  durChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.line2 },
  durChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  durText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink2 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  delBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.line2 },
  delText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink2 },
  saveBtn: { backgroundColor: colors.ink, paddingVertical: 12, borderRadius: 999, alignItems: 'center' },
  saveText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: '#fff' },
});
