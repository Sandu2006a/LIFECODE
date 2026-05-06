import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts, radii } from '../../src/theme';
import Icon from '../../src/components/Icon';

// ─── Types ───────────────────────────────────────────────────
type Workout = {
  id: string;
  name: string;
  startTime: string; // "HH:MM"
  endTime: string;
};

type WorkoutMap = Record<string, Workout[]>; // key = "YYYY-MM-DD"

// ─── Helpers ──────────────────────────────────────────────────
const STORAGE_KEY = 'lc_workouts_v1';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekDays(anchor: Date): Date[] {
  const day = anchor.getDay(); // 0=Sun
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((day + 6) % 7)); // start Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function fmtTime(t: string) { return t || '--:--'; }

function recoveryTime(workouts: Workout[]) {
  if (!workouts.length) return '19:30';
  const latest = workouts.reduce((acc, w) => {
    const [h, m] = w.endTime.split(':').map(Number);
    const mins = h * 60 + m;
    return mins > acc ? mins : acc;
  }, 0);
  const after = latest + 15;
  return `${String(Math.floor(after / 60)).padStart(2, '0')}:${String(after % 60).padStart(2, '0')}`;
}

function validateTime(t: string) {
  return /^\d{2}:\d{2}$/.test(t) && Number(t.split(':')[0]) < 24 && Number(t.split(':')[1]) < 60;
}

// ─── Main ─────────────────────────────────────────────────────
export default function WorkoutsScreen() {
  const [map, setMap] = useState<WorkoutMap>({});
  const [selected, setSelected] = useState<Date>(new Date());
  const [week, setWeek] = useState<Date[]>(getWeekDays(new Date()));
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:00');
  const [saving, setSaving] = useState(false);

  const selectedKey = toKey(selected);
  const todayKey = toKey(new Date());
  const dayWorkouts = map[selectedKey] || [];

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) setMap(JSON.parse(raw));
    });
  }, []);

  async function save(updated: WorkoutMap) {
    setMap(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function openAdd() {
    setName('');
    setStartTime('07:00');
    setEndTime('08:00');
    setModalOpen(true);
  }

  async function addWorkout() {
    if (!name.trim()) return Alert.alert('Name required', 'Enter a workout name.');
    if (!validateTime(startTime) || !validateTime(endTime)) {
      return Alert.alert('Invalid time', 'Use HH:MM format (e.g. 07:30).');
    }
    setSaving(true);
    const workout: Workout = {
      id: Date.now().toString(),
      name: name.trim(),
      startTime,
      endTime,
    };
    const updated = { ...map, [selectedKey]: [...(map[selectedKey] || []), workout] };
    await save(updated);
    setSaving(false);
    setModalOpen(false);
  }

  async function deleteWorkout(id: string) {
    Alert.alert('Delete workout?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const filtered = (map[selectedKey] || []).filter(w => w.id !== id);
          const updated = { ...map, [selectedKey]: filtered };
          await save(updated);
        },
      },
    ]);
  }

  function prevWeek() {
    const anchor = new Date(week[0]);
    anchor.setDate(anchor.getDate() - 7);
    setWeek(getWeekDays(anchor));
  }
  function nextWeek() {
    const anchor = new Date(week[0]);
    anchor.setDate(anchor.getDate() + 7);
    setWeek(getWeekDays(anchor));
  }

  const recTime = recoveryTime(dayWorkouts);
  const hasWorkout = dayWorkouts.length > 0;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Workouts</Text>
          <TouchableOpacity onPress={openAdd} style={s.addBtn} activeOpacity={0.8}>
            <Icon name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Week navigation */}
        <View style={s.weekNav}>
          <TouchableOpacity onPress={prevWeek} style={s.weekArrow}>
            <Icon name="chevron-right" size={16} color={colors.ink3} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={s.weekLabel}>
            {MONTHS[week[0].getMonth()]} {week[0].getDate()} – {MONTHS[week[6].getMonth()]} {week[6].getDate()}
          </Text>
          <TouchableOpacity onPress={nextWeek} style={s.weekArrow}>
            <Icon name="chevron-right" size={16} color={colors.ink3} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Week row */}
        <View style={s.weekRow}>
          {week.map((d, i) => {
            const key = toKey(d);
            const isSelected = key === selectedKey;
            const isToday = key === todayKey;
            const hasItems = (map[key] || []).length > 0;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => setSelected(d)}
                style={[s.dayCell, isSelected && s.dayCellActive]}
                activeOpacity={0.7}
              >
                <Text style={[s.dayLabel, isSelected && s.dayLabelActive]}>
                  {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'][i]}
                </Text>
                <Text style={[s.dayNum, isSelected && s.dayNumActive, isToday && !isSelected && s.dayNumToday]}>
                  {d.getDate()}
                </Text>
                {hasItems && <View style={[s.dot, isSelected && s.dotActive]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected day label */}
        <Text style={s.dayTitle}>
          {DAYS[selected.getDay()]}, {MONTHS[selected.getMonth()]} {selected.getDate()}
        </Text>

        {/* Workouts */}
        {dayWorkouts.length === 0 ? (
          <View style={s.emptyCard}>
            <Icon name="dumbbell" size={28} color={colors.ink4} />
            <Text style={s.emptyText}>No workout scheduled</Text>
            <TouchableOpacity onPress={openAdd} style={s.emptyAddBtn} activeOpacity={0.8}>
              <Text style={s.emptyAddText}>+ Add workout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          dayWorkouts.map(w => (
            <View key={w.id} style={s.workoutCard}>
              <View style={s.workoutLeft}>
                <View style={s.workoutIconWrap}>
                  <Icon name="dumbbell" size={18} color={colors.morning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.workoutName}>{w.name}</Text>
                  <View style={s.timeRow}>
                    <Icon name="clock" size={12} color={colors.ink3} />
                    <Text style={s.timeText}>{fmtTime(w.startTime)} – {fmtTime(w.endTime)}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => deleteWorkout(w.id)} hitSlop={12}>
                <Icon name="trash" size={17} color={colors.ink4} />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Recovery Pack recommendation */}
        <View style={s.recoveryCard}>
          <View style={s.recoveryHeader}>
            <View style={s.recoveryIconWrap}>
              <Icon name="pill" size={18} color={colors.recovery} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.recoveryTitle}>Recovery Pack</Text>
              <Text style={s.recoverySub}>
                {hasWorkout
                  ? `Take 15 min after your last session — ${recTime}`
                  : 'No workout today — take at 19:30, before bed'}
              </Text>
            </View>
            <View style={s.recoveryTimePill}>
              <Text style={s.recoveryTimeText}>{recTime}</Text>
            </View>
          </View>
          {hasWorkout && (
            <View style={s.recoveryHint}>
              <Icon name="check" size={13} color={colors.recovery} />
              <Text style={s.recoveryHintText}>
                Linked to your workout — optimal 45-min window
              </Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Add Workout Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalBg}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setModalOpen(false)} />
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Add Workout</Text>

            <Text style={s.label}>Workout name</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Morning Run, Gym, Swim"
              placeholderTextColor={colors.ink4}
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <View style={s.timeRow2}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Start time</Text>
                <TextInput
                  style={s.input}
                  placeholder="07:00"
                  placeholderTextColor={colors.ink4}
                  value={startTime}
                  onChangeText={setStartTime}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.label}>End time</Text>
                <TextInput
                  style={s.input}
                  placeholder="08:00"
                  placeholderTextColor={colors.ink4}
                  value={endTime}
                  onChangeText={setEndTime}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            </View>

            <View style={s.recoveryPreview}>
              <Icon name="pill" size={14} color={colors.recovery} />
              <Text style={s.recoveryPreviewText}>
                Recovery Pack will be scheduled at{' '}
                <Text style={{ color: colors.recovery, fontFamily: fonts.sansBold }}>
                  {(() => {
                    if (!validateTime(endTime)) return '--:--';
                    const [h, m] = endTime.split(':').map(Number);
                    const after = h * 60 + m + 15;
                    return `${String(Math.floor(after / 60)).padStart(2, '0')}:${String(after % 60).padStart(2, '0')}`;
                  })()}
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              style={[s.saveBtn, saving && { opacity: 0.6 }]}
              onPress={addWorkout}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Add Workout'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6,
  },
  title: { fontFamily: fonts.sansBold, fontSize: 26, color: colors.ink, letterSpacing: -0.5 },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.morning, alignItems: 'center', justifyContent: 'center',
  },

  // Week nav
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  weekArrow: { padding: 6 },
  weekLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink2, letterSpacing: 0.2 },

  // Week row
  weekRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 20, gap: 4 },
  dayCell: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 14, backgroundColor: 'transparent',
  },
  dayCellActive: { backgroundColor: colors.ink },
  dayLabel: { fontFamily: fonts.sansMedium, fontSize: 10, color: colors.ink3, marginBottom: 4, letterSpacing: 0.3 },
  dayLabelActive: { color: 'rgba(255,255,255,0.6)' },
  dayNum: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  dayNumActive: { color: '#fff' },
  dayNumToday: { color: colors.morning },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.morning, marginTop: 4 },
  dotActive: { backgroundColor: '#fff' },

  // Day title
  dayTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink2, paddingHorizontal: 20, marginBottom: 14, letterSpacing: 0.1 },

  // Empty
  emptyCard: {
    marginHorizontal: 20, padding: 28, borderRadius: radii.card,
    backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', gap: 8, marginBottom: 16,
  },
  emptyText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink3 },
  emptyAddBtn: {
    marginTop: 4, paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: radii.pill, backgroundColor: colors.morning,
  },
  emptyAddText: { fontFamily: fonts.sansBold, fontSize: 13, color: '#fff' },

  // Workout card
  workoutCard: {
    marginHorizontal: 20, marginBottom: 10, padding: 16,
    borderRadius: radii.card, backgroundColor: colors.bg2,
    borderWidth: 1, borderColor: colors.line,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  workoutLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  workoutIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(226,106,31,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  workoutName: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink, marginBottom: 3 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timeText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink3 },

  // Recovery card
  recoveryCard: {
    marginHorizontal: 20, marginTop: 6, padding: 16,
    borderRadius: radii.card, backgroundColor: '#f5f3ff',
    borderWidth: 1, borderColor: 'rgba(74,58,168,0.15)',
  },
  recoveryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recoveryIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(74,58,168,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  recoveryTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink, marginBottom: 2 },
  recoverySub: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink2, lineHeight: 17, flex: 1 },
  recoveryTimePill: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radii.pill, backgroundColor: colors.recovery,
  },
  recoveryTimeText: { fontFamily: fonts.sansBold, fontSize: 13, color: '#fff' },
  recoveryHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(74,58,168,0.1)',
  },
  recoveryHintText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.recovery, flex: 1 },

  // Modal
  modalBg: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontFamily: fonts.sansBold, fontSize: 20, color: colors.ink, marginBottom: 20, letterSpacing: -0.3 },
  label: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink3, marginBottom: 6, letterSpacing: 0.2, textTransform: 'uppercase' },
  input: {
    borderWidth: 1, borderColor: colors.line2, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: fonts.sans, fontSize: 15, color: colors.ink, backgroundColor: colors.bg,
    marginBottom: 16,
  },
  timeRow2: { flexDirection: 'row' },
  recoveryPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(74,58,168,0.06)', borderRadius: 10,
    padding: 12, marginBottom: 20,
  },
  recoveryPreviewText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink2, flex: 1 },
  saveBtn: {
    backgroundColor: colors.ink, borderRadius: radii.pill,
    paddingVertical: 16, alignItems: 'center',
  },
  saveBtnText: { fontFamily: fonts.sansBold, fontSize: 15, color: '#fff', letterSpacing: 0.2 },
});
