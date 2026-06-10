import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Pressable, Modal, TextInput, Platform, KeyboardAvoidingView, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../src/components/Icon';
import { colors, fonts, gradients, radii, shadows } from '../src/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/lib/supabase';
import { ensureSession, authHeaders } from '../src/lib/session';
import {
  lifecodeFetch, saveProfile, saveProfileName,
  listWorkouts, createWorkout, updateWorkout, deleteWorkout as apiDeleteWorkout,
} from '../src/lib/api';
import { clearCache } from '../src/lib/auth-cache';
import { loadPrefs, savePrefs, DEFAULT_PREFS, type Prefs } from '../src/lib/prefs';

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

// ISO dates (local) for Monday..Sunday of the current week — needed to map
// the day-pill index to the `date` column in the workouts table.
function weekIsoDates(): string[] {
  const today = new Date();
  const offset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  });
}

// Email-prefix → display name. alex.smith@gmail.com → "Alex". Strips digits and
// punctuation, takes the first alpha chunk, capitalizes. Better fallback than
// the generic "Athlete" that infuriated the user across sessions.
function nameFromEmail(email: string): string {
  if (!email) return '';
  const local = email.split('@')[0] || '';
  // Split on anything that isn't a letter; first non-empty chunk wins
  const chunk = local.split(/[^a-zA-Z]+/).find(s => s.length > 0) || local;
  if (!chunk) return '';
  return chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase();
}

export default function ProfileScreen() {
  const [name, setName] = useState('');
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

  // Settings preferences — persisted to AsyncStorage via prefs.ts
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const setPref = (patch: Partial<Prefs>) => {
    setPrefsState(p => ({ ...p, ...patch }));
    savePrefs(patch).catch(() => {});
  };

  // Profile fields for the Edit Profile sheet
  const [age, setAge]           = useState<number | null>(null);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [gender, setGender]     = useState<string | null>(null);
  const [goal, setGoal]         = useState<string | null>(null);

  // Sheets
  const [editOpen, setEditOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(false);
  const [timeEdit, setTimeEdit] = useState<null | { key: 'morningTime' | 'recoveryTime' | 'summaryTime'; label: string }>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    // Instant paint from local cache while the network round-trips run.
    try {
      const [cn, ce] = await Promise.all([
        AsyncStorage.getItem('lifecode.user_name'),
        AsyncStorage.getItem('lifecode.user_email'),
      ]);
      if (cn && cn !== 'Athlete') setName(n => n || cn);
      if (ce) setEmail(e => e || ce);
    } catch {}
    loadPrefs().then(setPrefsState).catch(() => {});

    const { userId, accessToken } = await ensureSession();
    if (!userId) { console.log('[profile] no auth'); return; }

    const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const wk = weekIsoDates();

    // All independent reads fire in parallel — profile/state, auth user,
    // 30-day intake logs, month meal count, this week's workouts.
    const [stateJson, authUserRes, logsRes, mealsRes, workoutsRes] = await Promise.all([
      accessToken
        ? lifecodeFetch('/api/me/state', {
            headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
          }).then(r => (r.ok ? r.json() : null)).catch(() => null)
        : Promise.resolve(null),
      supabase.auth.getUser(),
      supabase.from('intake_logs').select('pack, taken_at').eq('user_id', userId).gte('taken_at', thirtyAgo.toISOString()),
      supabase.from('meal_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('logged_at', monthStart),
      listWorkouts(wk[0], wk[6]),
    ]);

    let p: any = stateJson?.profile || null;
    const userEmail    = authUserRes?.data?.user?.email || '';
    const userMetaName = authUserRes?.data?.user?.user_metadata?.display_name
                      || authUserRes?.data?.user?.user_metadata?.full_name
                      || '';

    // Fallback to direct supabase if server didn't return profile
    if (!p) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, full_name, email, sport, goal, age, gender, weight_kg, height_cm')
          .eq('id', userId)
          .maybeSingle();
        p = data;
      } catch {}
    }

    // Resolve display name. Priority:
    //  1) profile.display_name / full_name (server-side DB, set at signup)
    //  2) supabase user_metadata (display_name/full_name set during signup)
    //  3) AsyncStorage cache, only if it's a real name (NOT the literal "Athlete"
    //     that earlier sessions accidentally saved as fallback)
    //  4) email-prefix derivation — alex@gmail.com → "Alex"
    //  5) 'You' (never show generic "Athlete" again)
    let cachedName = '';
    try { cachedName = (await AsyncStorage.getItem('lifecode.user_name')) || ''; } catch {}
    const goodCached = cachedName && cachedName !== 'Athlete' ? cachedName : '';

    // Build the email pool — supabase.auth.getUser() is unreliable in Expo Go,
    // but /api/me/state's profile row carries the email column. Use whichever
    // we managed to get; nameFromEmail handles empty input by returning ''.
    const bestEmail = userEmail || p?.email || '';

    const resolvedName =
      p?.display_name ||
      p?.full_name ||
      userMetaName ||
      goodCached ||
      nameFromEmail(bestEmail) ||
      'You';

    setName(resolvedName);
    // Persist whatever we resolved so other screens see it next time, AND
    // backfill profiles.display_name on the server so future sessions never
    // need any of these fallbacks. This is the canonical fix for "profilul
    // arata oricum You sau Athlete" — without it, every reload re-derives
    // the name from scratch and lands on the same wrong fallback.
    if (resolvedName && resolvedName !== 'You') {
      try { await AsyncStorage.setItem('lifecode.user_name', resolvedName); } catch {}
      if (!p?.display_name) saveProfileName(resolvedName).catch(() => {});
    }
    const bestEmailFinal = p?.email || userEmail || '';
    setEmail(bestEmailFinal);
    if (bestEmailFinal) { try { await AsyncStorage.setItem('lifecode.user_email', bestEmailFinal); } catch {} }
    setSport(p?.sport || p?.goal || '');

    // Editable profile fields for the Edit Profile sheet
    setAge(p?.age ?? null);
    setWeightKg(p?.weight_kg ?? null);
    setHeightCm(p?.height_cm ?? null);
    setGender(p?.gender ?? null);
    setGoal(p?.goal ?? null);

    // This week's workouts from the server (persisted across devices/restarts)
    if (workoutsRes.ok) {
      const grouped: Record<number, Workout[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
      for (const w of workoutsRes.workouts) {
        const idx = wk.indexOf(String(w.date).slice(0, 10));
        if (idx < 0) continue;
        grouped[idx].push({
          id: String(w.id),
          type: (WORKOUT_TYPES.some(t => t.id === (w.type as any)) ? w.type : 'strength') as WorkoutType,
          name: w.name || 'Workout',
          time: (w.start_time || '07:30').slice(0, 5),
          dur: w.duration_min || 45,
        });
      }
      Object.values(grouped).forEach(list => list.sort((a, b) => a.time.localeCompare(b.time)));
      setWorkouts(grouped);
    }

    const logs = logsRes?.data || [];
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

    // Meals this month (query already ran in the parallel batch above)
    setMeals(mealsRes?.count || 0);
  }

  async function signOut() {
    try {
      await Promise.all([
        'lifecode.activated_once', 'lifecode.onboarding_done',
        'lifecode.last_uid', 'lifecode.user_name', 'lifecode.user_email',
        'lifecode.name_prompt_done',
      ].map(k => AsyncStorage.removeItem(k)));
    } catch {}
    clearCache();
    try { await supabase.auth.signOut(); } catch {}
    router.replace('/login');
  }

  function confirmResetData() {
    Alert.alert(
      'Reset all data',
      'This clears the app data on this device and signs you out. Your account and logs on the server are kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive',
          onPress: async () => {
            try { await AsyncStorage.clear(); } catch {}
            clearCache();
            try { await supabase.auth.signOut(); } catch {}
            router.replace('/login');
          },
        },
      ],
    );
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

    // Add to selected day (optimistic), then persist to the server
    setWorkouts(prev => {
      const list = prev[selectedDay] || [];
      return { ...prev, [selectedDay]: [...list, parsed].sort((a, b) => a.time.localeCompare(b.time)) };
    });
    setWorkoutInput('');
    setWorkoutParsing(false);
    persistNewWorkout(parsed, selectedDay);
  }

  // Server write for a locally-added workout: swap the temp id for the DB id
  // on success so later edit/delete calls target the right row.
  async function persistNewWorkout(w: Workout, dayIdx: number) {
    const date = weekIsoDates()[dayIdx];
    const r = await createWorkout({ date, type: w.type, name: w.name, start_time: w.time, duration_min: w.dur });
    if (r.ok && r.workout) {
      const serverId = String(r.workout.id);
      setWorkouts(prev => ({
        ...prev,
        [dayIdx]: (prev[dayIdx] || []).map(x => x.id === w.id ? { ...x, id: serverId } : x),
      }));
    } else {
      console.log('[workout] save failed:', r.error);
      setWorkoutError('Saved locally — could not reach the server.');
    }
  }

  function saveWorkout(w: Workout) {
    const isNew = !sheet?.initial;
    setWorkouts(prev => {
      const list = prev[selectedDay] || [];
      const idx = list.findIndex(x => x.id === w.id);
      const next = idx >= 0 ? list.map((x, i) => i === idx ? w : x) : [...list, w];
      return { ...prev, [selectedDay]: next.sort((a, b) => a.time.localeCompare(b.time)) };
    });
    setSheet(null);
    if (isNew) {
      persistNewWorkout(w, selectedDay);
    } else {
      updateWorkout(w.id, { type: w.type, name: w.name, start_time: w.time, duration_min: w.dur })
        .then(r => { if (!r.ok) console.log('[workout] update failed:', r.error); });
    }
  }
  function deleteWorkout() {
    if (!sheet?.initial) return;
    const id = sheet.initial.id;
    setWorkouts(prev => ({ ...prev, [selectedDay]: prev[selectedDay].filter(x => x.id !== id) }));
    setSheet(null);
    apiDeleteWorkout(id).then(r => { if (!r.ok) console.log('[workout] delete failed:', r.error); });
  }

  // Edit Profile sheet save: optimistic local update + server write through
  // /api/save-profile (service role — the only path RLS allows from the app).
  async function handleProfileSave(f: { name: string; age: number | null; weight_kg: number | null; height_cm: number | null; sport: string }) {
    if (f.name) setName(f.name);
    setAge(f.age); setWeightKg(f.weight_kg); setHeightCm(f.height_cm); setSport(f.sport);
    setEditOpen(false);
    if (f.name && f.name !== 'You') {
      try { await AsyncStorage.setItem('lifecode.user_name', f.name); } catch {}
    }
    const r = await saveProfile({
      display_name: f.name || undefined,
      age: f.age, weight_kg: f.weight_kg, height_cm: f.height_cm,
      gender, goal, sport: f.sport || null,
    });
    if (!r.ok) Alert.alert('Could not save profile', r.error || 'Check your connection and try again.');
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
            <Text style={s.idName} numberOfLines={1}>{name || 'You'}</Text>
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
          <SettingsRow icon="user"    bg="grad-morning"  label="Edit profile"    chevron onPress={() => setEditOpen(true)} isFirst />
          <SettingsRow icon="chat"    bg={colors.ink}    label="Email"           value={email || '—'} />
          <SettingsRow icon="shield"  bg={colors.ink}    label="Change password" chevron onPress={() => setPassOpen(true)} />
          <SettingsRow icon="sparkle" bg="grad-recovery" label="Subscription"    value="Pro" isLast />
        </View>

        <Text style={[s.eyebrow, { marginLeft: 4, marginTop: 18, marginBottom: 8 }]}>PREFERENCES</Text>
        <View style={[s.card, { padding: 0, paddingHorizontal: 20 }]}>
          <SettingsRow icon="dumbbell" bg={colors.ink} label="Weight units"  value={prefs.weightUnit} onPress={() => setPref({ weightUnit: prefs.weightUnit === 'kg' ? 'lb' : 'kg' })} isFirst />
          <SettingsRow icon="dumbbell" bg={colors.ink} label="Height units"  value={prefs.heightUnit} onPress={() => setPref({ heightUnit: prefs.heightUnit === 'cm' ? 'ft' : 'cm' })} />
          <SettingsRow icon="chat"     bg={colors.ink} label="Language"      value="English" isLast />
        </View>

        <Text style={[s.eyebrow, { marginLeft: 4, marginTop: 18, marginBottom: 8 }]}>NOTIFICATIONS</Text>
        <View style={[s.card, { padding: 0, paddingHorizontal: 20 }]}>
          <SettingsRow icon="bell"     bg="grad-morning"  label="Push notifications" toggle={prefs.pushEnabled} onToggle={() => setPref({ pushEnabled: !prefs.pushEnabled })} isFirst />
          <SettingsRow icon="sparkle"  bg={colors.ink}    label="Morning reminder"   value={prefs.morningTime}  chevron onPress={() => setTimeEdit({ key: 'morningTime', label: 'Morning reminder' })} />
          <SettingsRow icon="moon"     bg="grad-recovery" label="Recovery reminder"  value={prefs.recoveryTime} chevron onPress={() => setTimeEdit({ key: 'recoveryTime', label: 'Recovery reminder' })} />
          <SettingsRow icon="clock"    bg={colors.ink}    label="Daily summary"      value={prefs.summaryTime}  chevron onPress={() => setTimeEdit({ key: 'summaryTime', label: 'Daily summary' })} isLast />
        </View>

        <Text style={[s.eyebrow, { marginLeft: 4, marginTop: 18, marginBottom: 8 }]}>PRIVACY</Text>
        <View style={[s.card, { padding: 0, paddingHorizontal: 20 }]}>
          <SettingsRow icon="users"  bg={colors.ink} label="Share progress with friends" toggle={prefs.shareEnabled} onToggle={() => setPref({ shareEnabled: !prefs.shareEnabled })} isFirst />
          <SettingsRow icon="flame"  bg={colors.ink} label="Show on leaderboard"         toggle={prefs.leaderboardVisible} onToggle={() => setPref({ leaderboardVisible: !prefs.leaderboardVisible })} isLast />
        </View>

        <Text style={[s.eyebrow, { marginLeft: 4, marginTop: 18, marginBottom: 8 }]}>SUPPORT</Text>
        <View style={[s.card, { padding: 0, paddingHorizontal: 20 }]}>
          <SettingsRow icon="chat"    bg={colors.ink} label="Help center"  chevron onPress={() => Linking.openURL('https://lifecodenutrition.com/contact').catch(() => {})} isFirst />
          <SettingsRow icon="send"    bg={colors.ink} label="Contact us"   chevron onPress={() => Linking.openURL('mailto:lifecodenutrition@gmail.com').catch(() => {})} isLast />
        </View>

        <Text style={[s.eyebrow, { marginLeft: 4, marginTop: 18, marginBottom: 8 }]}>ABOUT</Text>
        <View style={[s.card, { padding: 0, paddingHorizontal: 20 }]}>
          <SettingsRow icon="sparkle" bg={colors.ink} label="App version"     value="1.0.0" isFirst />
          <SettingsRow icon="shield"  bg={colors.ink} label="Terms of Service" chevron onPress={() => Linking.openURL('https://lifecodenutrition.com/about').catch(() => {})} />
          <SettingsRow icon="shield"  bg={colors.ink} label="Privacy Policy"   chevron onPress={() => Linking.openURL('https://lifecodenutrition.com/about').catch(() => {})} isLast />
        </View>

        <View style={s.dangerCard}>
          <TouchableOpacity onPress={signOut} style={s.dangerRow} activeOpacity={0.6}>
            <Text style={s.dangerText}>Sign out</Text>
          </TouchableOpacity>
          <View style={s.dangerDivider} />
          <TouchableOpacity onPress={confirmResetData} style={s.dangerRow} activeOpacity={0.6}>
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

      {editOpen && (
        <EditProfileSheet
          initial={{ name, age, weightKg, heightCm, sport }}
          onClose={() => setEditOpen(false)}
          onSave={handleProfileSave}
        />
      )}

      {passOpen && <PasswordSheet onClose={() => setPassOpen(false)} />}

      {timeEdit && (
        <TimeSheet
          label={timeEdit.label}
          initial={prefs[timeEdit.key]}
          onClose={() => setTimeEdit(null)}
          onSave={t => { setPref({ [timeEdit.key]: t } as Partial<Prefs>); setTimeEdit(null); }}
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

// ── Edit Profile sheet ──
function EditProfileSheet({ initial, onClose, onSave }: {
  initial: { name: string; age: number | null; weightKg: number | null; heightCm: number | null; sport: string };
  onClose: () => void;
  onSave: (f: { name: string; age: number | null; weight_kg: number | null; height_cm: number | null; sport: string }) => void;
}) {
  const [name, setName]     = useState(initial.name === 'You' ? '' : initial.name);
  const [age, setAge]       = useState(initial.age ? String(initial.age) : '');
  const [weight, setWeight] = useState(initial.weightKg ? String(initial.weightKg) : '');
  const [height, setHeight] = useState(initial.heightCm ? String(initial.heightCm) : '');
  const [sport, setSport]   = useState(initial.sport || '');

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable style={ws.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={ws.kavWrap} pointerEvents="box-none">
        <View style={ws.sheet}>
          <View style={ws.handle} />
          <Text style={ws.title}>Edit profile</Text>

          <Text style={ws.fieldLbl}>NAME</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Your name"
            placeholderTextColor={colors.ink3} autoCapitalize="words" style={ws.input} />

          <Text style={ws.fieldLbl}>AGE</Text>
          <TextInput value={age} onChangeText={v => setAge(v.replace(/\D/g, ''))} placeholder="e.g. 24"
            placeholderTextColor={colors.ink3} keyboardType="numeric" maxLength={3} style={ws.input} />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={ws.fieldLbl}>WEIGHT (KG)</Text>
              <TextInput value={weight} onChangeText={setWeight} placeholder="e.g. 80"
                placeholderTextColor={colors.ink3} keyboardType="decimal-pad" maxLength={5} style={ws.input} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ws.fieldLbl}>HEIGHT (CM)</Text>
              <TextInput value={height} onChangeText={v => setHeight(v.replace(/\D/g, ''))} placeholder="e.g. 182"
                placeholderTextColor={colors.ink3} keyboardType="numeric" maxLength={3} style={ws.input} />
            </View>
          </View>

          <Text style={ws.fieldLbl}>SPORT</Text>
          <TextInput value={sport} onChangeText={setSport} placeholder="e.g. Boxing, marathon..."
            placeholderTextColor={colors.ink3} style={ws.input} />

          <View style={ws.actions}>
            <TouchableOpacity style={ws.delBtn} onPress={onClose}>
              <Text style={ws.delText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ws.saveBtn, { flex: 1 }]}
              onPress={() => onSave({
                name: name.trim(),
                age: parseInt(age) || null,
                weight_kg: parseFloat(weight) || null,
                height_cm: parseInt(height) || null,
                sport: sport.trim(),
              })}
            >
              <Text style={ws.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Change Password sheet ──
function PasswordSheet({ onClose }: { onClose: () => void }) {
  const [pass, setPass]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  async function save() {
    if (pass.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (pass !== confirm) { setError('Passwords do not match.'); return; }
    setSaving(true);
    setError('');
    // Expo Go can drop the in-memory session — restore from cached tokens first.
    await ensureSession();
    const { error: err } = await supabase.auth.updateUser({ password: pass });
    setSaving(false);
    if (err) { setError(err.message || 'Could not update password.'); return; }
    onClose();
    Alert.alert('Password updated', 'Use your new password next time you sign in.');
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable style={ws.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={ws.kavWrap} pointerEvents="box-none">
        <View style={ws.sheet}>
          <View style={ws.handle} />
          <Text style={ws.title}>Change password</Text>

          <Text style={ws.fieldLbl}>NEW PASSWORD</Text>
          <TextInput value={pass} onChangeText={v => { setPass(v); setError(''); }} placeholder="Min. 8 characters"
            placeholderTextColor={colors.ink3} secureTextEntry autoCapitalize="none" style={ws.input} />

          <Text style={ws.fieldLbl}>CONFIRM PASSWORD</Text>
          <TextInput value={confirm} onChangeText={v => { setConfirm(v); setError(''); }} placeholder="Repeat password"
            placeholderTextColor={colors.ink3} secureTextEntry autoCapitalize="none" style={ws.input} />

          {!!error && <Text style={s.workoutError}>{error}</Text>}

          <View style={ws.actions}>
            <TouchableOpacity style={ws.delBtn} onPress={onClose}>
              <Text style={ws.delText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ws.saveBtn, { flex: 1 }, saving && { opacity: 0.5 }]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={ws.saveText}>Update password</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Reminder time sheet (15-min steps, persisted to prefs) ──
function TimeSheet({ label, initial, onClose, onSave }: {
  label: string; initial: string; onClose: () => void; onSave: (t: string) => void;
}) {
  const [time, setTime] = useState(initial);

  function adj(delta: number) {
    const [h, m] = time.split(':').map(Number);
    let total = h * 60 + m + delta;
    if (total < 0) total += 24 * 60;
    if (total >= 24 * 60) total -= 24 * 60;
    setTime(`${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`);
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable style={ws.backdrop} onPress={onClose} />
      <View style={ws.kavWrap} pointerEvents="box-none">
        <View style={ws.sheet}>
          <View style={ws.handle} />
          <Text style={ws.title}>{label}</Text>

          <Text style={ws.fieldLbl}>TIME</Text>
          <View style={ws.timeRow}>
            <Text style={ws.timeVal}>{time}</Text>
            <View style={ws.timeCtrl}>
              <TouchableOpacity onPress={() => adj(-15)} style={ws.timeBtn}>
                <Icon name="minus" size={14} color={colors.ink} strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={ws.timeStep}>15 MIN</Text>
              <TouchableOpacity onPress={() => adj(15)} style={ws.timeBtn}>
                <Icon name="plus" size={14} color={colors.ink} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={ws.actions}>
            <TouchableOpacity style={ws.delBtn} onPress={onClose}>
              <Text style={ws.delText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ws.saveBtn, { flex: 1 }]} onPress={() => onSave(time)}>
              <Text style={ws.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
