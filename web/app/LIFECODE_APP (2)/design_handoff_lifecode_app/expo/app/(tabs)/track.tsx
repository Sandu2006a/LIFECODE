import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';
import { MORNING_INGREDIENTS, RECOVERY_INGREDIENTS } from '../../lib/data';
import Bar from '../../components/Bar';
import Eyebrow from '../../components/Eyebrow';
import { supabase } from '../../lib/supabase';

type Kind = 'morning' | 'recovery';

export default function Track() {
  const [kind, setKind] = useState<Kind>('morning');
  const [val, setVal] = useState('');
  const [logged, setLogged] = useState<string[]>([]);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const list = kind === 'morning' ? MORNING_INGREDIENTS : RECOVERY_INGREDIENTS;
  const base = useMemo(() =>
    kind === 'morning'
      ? [88, 70, 80, 93, 80, 75, 100, 70, 65, 42, 60]
      : [40, 30, 45, 55, 35, 25, 70, 42, 30, 40], [kind]);
  const bump = logged.length * 5;
  const pcts = base.map((p) => Math.min(100, p + bump));

  const submit = async () => {
    const t = val.trim();
    if (!t) return;
    setLogged([...logged, t]);
    setVal('');
    // persist
    const { data: u } = await supabase.auth.getUser();
    if (u?.user) {
      await supabase.from('food_logs').insert({ user_id: u.user.id, text: t, pack: kind, logged_at: new Date().toISOString() });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <Eyebrow>Today's protocol</Eyebrow>
        <Text style={s.h1}>Track</Text>
        <View style={s.seg}>
          {(['morning', 'recovery'] as Kind[]).map((k) => (
            <Pressable key={k} onPress={() => setKind(k)} style={[s.segBtn, kind === k && s.segBtnOn]}>
              <Text style={[s.segText, { color: kind === k ? (k === 'morning' ? colors.morning : colors.recovery) : colors.ink3 }]}>
                {k === 'morning' ? 'Morning Pack' : 'Recovery Pack'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 200 }}>
        {list.map((ing, i) => {
          const pct = pcts[i] ?? 50;
          const open = openIdx === i;
          return (
            <Pressable key={i} onPress={() => setOpenIdx(open ? null : i)} style={s.row}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Text style={s.idx}>{String(i + 1).padStart(2, '0')}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{ing.name}</Text>
                  <Text style={s.form}>{ing.form} · {ing.amount}</Text>
                </View>
                <Text style={[s.pct, { color: kind === 'morning' ? colors.morning : colors.recovery }]}>{pct}%</Text>
              </View>
              <View style={{ marginTop: 10 }}><Bar pct={pct} kind={kind} /></View>
              {open && (
                <View style={s.expand}>
                  <View style={s.expRow}><Text style={s.expLbl}>Goal</Text><Text style={s.expVal}>{ing.amount}</Text></View>
                  <View style={s.expRow}><Text style={s.expLbl}>Today</Text><Text style={s.expVal}>{pct}%</Text></View>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={s.composer}>
        {logged.length > 0 && (
          <View style={s.chips}>
            {logged.slice(-3).map((l, i) => (
              <View key={i} style={s.loggedChip}><Text style={s.loggedText} numberOfLines={1}>{l}</Text></View>
            ))}
          </View>
        )}
        <View style={s.inputRow}>
          <TextInput value={val} onChangeText={setVal} onSubmitEditing={submit} placeholder="Add what you ate…" placeholderTextColor={colors.ink3} style={s.input} />
          <Pressable onPress={submit} style={s.send}><Text style={{ color: '#fff', fontSize: 18 }}>↑</Text></Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: fonts.serif, fontSize: 38, color: colors.ink, marginTop: 4, letterSpacing: -0.6 },
  seg: { flexDirection: 'row', marginTop: 14, marginBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  segBtnOn: { borderBottomWidth: 2, borderBottomColor: colors.ink },
  segText: { fontFamily: fonts.sans, fontWeight: '500', fontSize: 13 },
  row: { backgroundColor: colors.surf, borderRadius: 18, padding: 16, marginTop: 10, borderWidth: 1, borderColor: colors.line },
  idx: { fontFamily: fonts.sans, fontWeight: '600', fontSize: 11, color: colors.ink3, letterSpacing: 0.4, marginTop: 2 },
  name: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '500', color: colors.ink },
  form: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3, marginTop: 2 },
  pct: { fontFamily: fonts.serifItalic, fontSize: 18 },
  expand: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  expRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  expLbl: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3, letterSpacing: 0.4, textTransform: 'uppercase' },
  expVal: { fontFamily: fonts.serifItalic, fontSize: 14, color: colors.ink },
  composer: { position: 'absolute', left: 0, right: 0, bottom: 80, paddingHorizontal: 24 },
  chips: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  loggedChip: { backgroundColor: colors.ink, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, maxWidth: 200 },
  loggedText: { color: '#fff', fontFamily: fonts.sans, fontSize: 11 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surf, borderRadius: 999, paddingLeft: 16, paddingRight: 6, paddingVertical: 6, borderWidth: 1, borderColor: colors.line2 },
  input: { flex: 1, fontFamily: fonts.serifItalic, fontSize: 14, color: colors.ink, paddingVertical: 8 },
  send: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
});
