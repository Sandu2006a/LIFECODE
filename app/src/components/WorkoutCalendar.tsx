import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { colors, fonts, radii } from '../theme';
import {
  listWorkouts, createWorkout, updateWorkout, deleteWorkout,
  type Workout,
} from '../lib/api';

const TYPES: { id: Workout['type']; label: string; sub: string; color: string }[] = [
  { id: 'strength', label: 'Strength', sub: 'Lift · push · pull', color: '#e26a1f' },
  { id: 'cardio',   label: 'Cardio',   sub: 'Run · bike · row',  color: '#4a3aa8' },
  { id: 'mobility', label: 'Mobility', sub: 'Yoga · stretch',    color: '#0d0d0f' },
  { id: 'class',    label: 'Class',    sub: 'HIIT · group',      color: '#7a8fd9' },
];
const TYPE_ACCENT: Record<Workout['type'], string> = {
  strength: '#e26a1f', cardio: '#4a3aa8', mobility: '#0d0d0f', class: '#7a8fd9',
};
const TYPE_LABEL: Record<Workout['type'], string> = {
  strength: 'Strength', cardio: 'Cardio', mobility: 'Mobility', class: 'Class',
};
const WEEK_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const FULL_DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmtKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseKey = (key: string) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); };
const startOfWeek = (date: Date) => {
  const d = new Date(date);
  const dow = d.getDay();
  const diff = (dow === 0 ? -6 : 1 - dow);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

type EditingState = { date: string; workout?: Workout } | null;

export default function WorkoutCalendar() {
  const [today] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selected, setSelected] = useState(() => fmtKey(new Date()));
  const [workoutsByDate, setWorkoutsByDate] = useState<Record<string, Workout[]>>({});
  const [editing, setEditing] = useState<EditingState>(null);
  const [loading, setLoading] = useState(true);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const reload = useCallback(async () => {
    setLoading(true);
    const from = fmtKey(weekDays[0]);
    const to = fmtKey(weekDays[6]);
    const r = await listWorkouts(from, to);
    if (r.ok) {
      const grouped: Record<string, Workout[]> = {};
      for (const w of r.workouts) {
        if (!grouped[w.date]) grouped[w.date] = [];
        grouped[w.date].push(w);
      }
      setWorkoutsByDate(grouped);
    }
    setLoading(false);
  }, [weekStart]);

  useEffect(() => { reload(); }, [reload]);

  const navWeek = (delta: number) => {
    const ws = new Date(weekStart);
    ws.setDate(ws.getDate() + delta * 7);
    setWeekStart(ws);
  };

  const weekTotal = weekDays.reduce((s, d) => s + (workoutsByDate[fmtKey(d)] || []).reduce((a, w) => a + w.duration_min, 0), 0);
  const weekCount = weekDays.reduce((s, d) => s + (workoutsByDate[fmtKey(d)] || []).length, 0);
  const weekHours = Math.round(weekTotal / 60 * 10) / 10;
  const monthLbl = `${MONTHS_FULL[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
  const todayKey = fmtKey(today);

  const selectedDate = parseKey(selected);
  const selectedWorkouts = workoutsByDate[selected] || [];
  const selectedDuration = selectedWorkouts.reduce((a, w) => a + w.duration_min, 0);

  return (
    <View style={s.card}>
      <View style={s.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Training <Text style={s.titleItalic}>week</Text></Text>
          <Text style={s.meta}>{monthLbl} · {weekCount} workouts · {weekHours}h</Text>
        </View>
        <View style={s.nav}>
          <TouchableOpacity style={s.navBtn} onPress={() => navWeek(-1)}>
            <Text style={s.navTxt}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.navBtn} onPress={() => navWeek(1)}>
            <Text style={s.navTxt}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.weekRow}>
        {weekDays.map((d, i) => {
          const key = fmtKey(d);
          const isSel = key === selected;
          const isToday = key === todayKey;
          const list = workoutsByDate[key] || [];
          return (
            <TouchableOpacity
              key={key}
              style={[s.day, isSel && s.daySelected, isToday && !isSel && s.dayToday]}
              onPress={() => setSelected(key)}
              activeOpacity={0.7}
            >
              <Text style={[s.dayLbl, isSel && s.dayLblSel]}>{WEEK_LETTERS[i]}</Text>
              <Text style={[s.dayNum, isSel && s.dayNumSel]}>{d.getDate()}</Text>
              <View style={s.dotsRow}>
                {list.length === 0
                  ? <View style={[s.dot, s.dotEmpty]} />
                  : list.slice(0, 3).map((w, j) => (
                      <View key={j} style={[s.dot, { backgroundColor: isSel ? '#fff' : TYPE_ACCENT[w.type] }]} />
                    ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.detailHead}>
        <Text style={s.detailDate}>
          {FULL_DAY[selectedDate.getDay()]} <Text style={s.detailDateItalic}>· {MONTHS_SHORT[selectedDate.getMonth()]} {selectedDate.getDate()}</Text>
        </Text>
        <Text style={s.detailMeta}>
          {selectedWorkouts.length ? `${selectedWorkouts.length} · ${selectedDuration} min` : 'Rest day'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.ink3} style={{ paddingVertical: 12 }} />
      ) : (
        <View style={{ gap: 8 }}>
          {selectedWorkouts.map(w => (
            <TouchableOpacity
              key={w.id}
              style={s.row}
              onPress={() => setEditing({ date: selected, workout: w })}
              activeOpacity={0.7}
            >
              <View style={[s.rowAccent, { backgroundColor: TYPE_ACCENT[w.type] }]} />
              <View style={s.rowTimeCol}>
                <Text style={s.rowTime}>{w.start_time || '—'}</Text>
                <Text style={s.rowTimeSub}>{w.duration_min} min</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowName}>{w.name || TYPE_LABEL[w.type]}</Text>
                <Text style={[s.rowType, { color: TYPE_ACCENT[w.type] }]}>{TYPE_LABEL[w.type]}</Text>
              </View>
              <Text style={s.rowChev}>›</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={s.addBtn} onPress={() => setEditing({ date: selected })} activeOpacity={0.7}>
            <Text style={s.addPlus}>+</Text>
            <Text style={s.addText}>Add workout</Text>
          </TouchableOpacity>
        </View>
      )}

      {editing && (
        <WorkoutSheet
          state={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await reload(); }}
        />
      )}
    </View>
  );
}

function WorkoutSheet({ state, onClose, onSaved }: { state: { date: string; workout?: Workout }; onClose: () => void; onSaved: () => Promise<void> | void }) {
  const init = state.workout;
  const [type, setType] = useState<Workout['type']>(init?.type || 'strength');
  const [name, setName] = useState(init?.name || '');
  const [time, setTime] = useState(init?.start_time || '07:00');
  const [duration, setDuration] = useState(init?.duration_min || 60);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const [h, m] = (time.split(':').map(Number)) as [number, number];

  const setHour = (delta: number) => {
    const nh = (h + delta + 24) % 24;
    setTime(`${String(nh).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };
  const setMin = (delta: number) => {
    let total = h * 60 + m + delta * 5;
    total = (total + 24 * 60) % (24 * 60);
    const nh = Math.floor(total / 60), nm = total % 60;
    setTime(`${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`);
  };

  const save = async () => {
    setBusy(true); setErr('');
    const finalName = (name || '').trim() || TYPES.find(t => t.id === type)!.label;
    const r = init?.id
      ? await updateWorkout(init.id, { type, name: finalName, start_time: time, duration_min: duration })
      : await createWorkout({ date: state.date, type, name: finalName, start_time: time, duration_min: duration });
    setBusy(false);
    if (!r.ok) { setErr(r.error || 'save failed'); return; }
    await onSaved();
  };

  const remove = async () => {
    if (!init?.id) return;
    setBusy(true); setErr('');
    const r = await deleteWorkout(init.id);
    setBusy(false);
    if (!r.ok) { setErr(r.error || 'delete failed'); return; }
    await onSaved();
  };

  const dateObj = parseKey(state.date);
  const placeholders: Record<string, string> = {
    strength: 'e.g. Lower · power',
    cardio: 'e.g. Zone 2 run',
    mobility: 'e.g. Evening flow',
    class: 'e.g. HIIT class',
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={ws.root}>
        <TouchableOpacity style={ws.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={ws.sheet}>
          <View style={ws.handle} />
          <View style={ws.head}>
            <View style={{ flex: 1 }}>
              <Text style={ws.title}>
                {init ? 'Edit ' : 'New '}<Text style={ws.titleItalic}>workout</Text>
              </Text>
              <Text style={ws.sub}>{FULL_DAY[dateObj.getDay()]} · {MONTHS_SHORT[dateObj.getMonth()]} {dateObj.getDate()}</Text>
            </View>
            <TouchableOpacity style={ws.close} onPress={onClose}>
              <Text style={ws.closeX}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled">
            <Text style={ws.fieldLbl}>Type</Text>
            <View style={ws.types}>
              {TYPES.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[ws.typeBtn, type === t.id && { borderColor: t.color, backgroundColor: t.color + '0E' }]}
                  onPress={() => setType(t.id)}
                  activeOpacity={0.7}
                >
                  <View style={[ws.typeSw, { backgroundColor: t.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={ws.typeLbl}>{t.label}</Text>
                    <Text style={ws.typeSub}>{t.sub}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={ws.fieldLbl}>Name</Text>
            <TextInput
              style={ws.nameInput}
              value={name}
              onChangeText={setName}
              placeholder={placeholders[type]}
              placeholderTextColor={colors.ink3}
              editable={!busy}
            />

            <Text style={ws.fieldLbl}>Start time</Text>
            <View style={ws.time}>
              <View style={ws.timeSeg}>
                <TouchableOpacity style={ws.timeBtn} onPress={() => setHour(-1)} disabled={busy}><Text style={ws.timeBtnTxt}>−</Text></TouchableOpacity>
                <Text style={ws.timeVal}>{String(h).padStart(2, '0')}</Text>
                <TouchableOpacity style={ws.timeBtn} onPress={() => setHour(1)} disabled={busy}><Text style={ws.timeBtnTxt}>+</Text></TouchableOpacity>
              </View>
              <Text style={ws.timeSep}>:</Text>
              <View style={ws.timeSeg}>
                <TouchableOpacity style={ws.timeBtn} onPress={() => setMin(-1)} disabled={busy}><Text style={ws.timeBtnTxt}>−</Text></TouchableOpacity>
                <Text style={ws.timeVal}>{String(m).padStart(2, '0')}</Text>
                <TouchableOpacity style={ws.timeBtn} onPress={() => setMin(1)} disabled={busy}><Text style={ws.timeBtnTxt}>+</Text></TouchableOpacity>
              </View>
            </View>

            <Text style={ws.fieldLbl}>Duration</Text>
            <View style={ws.durRow}>
              {[20, 30, 45, 60, 75, 90, 120].map(d => (
                <TouchableOpacity
                  key={d}
                  style={[ws.durChip, duration === d && ws.durChipOn]}
                  onPress={() => setDuration(d)}
                  disabled={busy}
                >
                  <Text style={[ws.durChipTxt, duration === d && ws.durChipTxtOn]}>{d}m</Text>
                </TouchableOpacity>
              ))}
            </View>

            {!!err && <Text style={ws.err}>{err}</Text>}

            <View style={ws.actions}>
              {init?.id && (
                <TouchableOpacity style={ws.delBtn} onPress={remove} disabled={busy}>
                  <Text style={ws.delTxt}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[ws.saveBtn, busy && { opacity: 0.5 }]} onPress={save} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={ws.saveTxt}>{init ? 'Save changes' : 'Add to calendar'}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.surf, borderRadius: radii.card, padding: 22, borderWidth: 1, borderColor: colors.line, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 24, elevation: 2 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontFamily: fonts.serif, fontSize: 22, color: colors.ink },
  titleItalic: { fontFamily: fonts.serifItalic },
  meta: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3, marginTop: 4 },
  nav: { flexDirection: 'row', gap: 6 },
  navBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(13,13,15,0.06)', alignItems: 'center', justifyContent: 'center' },
  navTxt: { fontSize: 18, color: colors.ink, lineHeight: 18, marginTop: -2 },

  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  day: { width: 40, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 10, alignItems: 'center', gap: 4 },
  daySelected: { backgroundColor: colors.ink },
  dayToday: { borderWidth: 1, borderColor: colors.ink2 },
  dayLbl: { fontFamily: fonts.sansSemiBold, fontSize: 9, color: colors.ink3, letterSpacing: 0.5 },
  dayLblSel: { color: 'rgba(255,255,255,0.6)' },
  dayNum: { fontFamily: fonts.serifItalic, fontSize: 18, color: colors.ink2 },
  dayNumSel: { color: '#fff' },
  dotsRow: { flexDirection: 'row', gap: 3, height: 6, alignItems: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2 },
  dotEmpty: { backgroundColor: 'rgba(13,13,15,0.12)' },

  detailHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  detailDate: { fontFamily: fonts.serif, fontSize: 18, color: colors.ink },
  detailDateItalic: { fontFamily: fonts.serifItalic, color: colors.ink3 },
  detailMeta: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink3, letterSpacing: 0.4 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(13,13,15,0.03)', overflow: 'hidden' },
  rowAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  rowTimeCol: { width: 50, paddingLeft: 4 },
  rowTime: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  rowTimeSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3, marginTop: 2 },
  rowName: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
  rowType: { fontFamily: fonts.sansSemiBold, fontSize: 10, marginTop: 2, letterSpacing: 0.5, textTransform: 'uppercase' },
  rowChev: { fontSize: 18, color: colors.ink3 },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line2, marginTop: 4 },
  addPlus: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.ink3, lineHeight: 18, marginTop: -2 },
  addText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink3, letterSpacing: 0.3 },
});

const ws = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.surf, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 28, borderTopLeftRadius: 26, borderTopRightRadius: 26 },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(13,13,15,0.18)', marginBottom: 12 },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: { fontFamily: fonts.serif, fontSize: 24, color: colors.ink },
  titleItalic: { fontFamily: fonts.serifItalic },
  sub: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3, marginTop: 2 },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(13,13,15,0.06)', alignItems: 'center', justifyContent: 'center' },
  closeX: { fontFamily: fonts.sans, fontSize: 22, color: colors.ink, lineHeight: 22, marginTop: -2 },

  fieldLbl: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.ink3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 14 },
  types: { gap: 8 },
  typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.line },
  typeSw: { width: 12, height: 12, borderRadius: 6 },
  typeLbl: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  typeSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3, marginTop: 2 },

  nameInput: { fontFamily: fonts.serifItalic, fontSize: 18, color: colors.ink, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line2 },

  time: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  timeSeg: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(13,13,15,0.04)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12 },
  timeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  timeBtnTxt: { fontSize: 18, color: colors.ink, lineHeight: 18, marginTop: -2 },
  timeVal: { fontFamily: fonts.serifItalic, fontSize: 28, color: colors.ink, minWidth: 38, textAlign: 'center' },
  timeSep: { fontFamily: fonts.serifItalic, fontSize: 24, color: colors.ink3 },

  durRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  durChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(13,13,15,0.04)', borderWidth: 1, borderColor: colors.line },
  durChipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  durChipTxt: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink2 },
  durChipTxtOn: { color: '#fff' },

  err: { fontFamily: fonts.sansMedium, fontSize: 12, color: '#c43030', marginTop: 12 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  delBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, backgroundColor: 'rgba(229,85,85,0.10)', borderWidth: 1, borderColor: 'rgba(229,85,85,0.35)' },
  delTxt: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: '#c43030', letterSpacing: 0.4 },
  saveBtn: { flex: 1, backgroundColor: colors.ink, paddingVertical: 14, borderRadius: 999, alignItems: 'center' },
  saveTxt: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: '#fff', letterSpacing: 0.4 },
});
