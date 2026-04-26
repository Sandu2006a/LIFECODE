import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ring from '../../src/components/Ring';
import Icon from '../../src/components/Icon';
import { colors, fonts, radii, gradients } from '../../src/theme';

const MORNING = [
  { name: 'Vitamin A',   form: 'Retinyl Palmitate (CWD)',    amount: '800 μg' },
  { name: 'Vitamin C',   form: 'Calcium Ascorbate',           amount: '200 mg' },
  { name: 'Vitamin D3',  form: 'Cholecalciferol (Vegan)',     amount: '25 μg'  },
  { name: 'Vitamin E',   form: 'd-alpha-Tocopheryl',          amount: '12 mg'  },
  { name: 'Vitamin K2',  form: 'Menaquinone-7 (MK-7)',        amount: '50 μg'  },
  { name: 'Vitamin B12', form: 'Methylcobalamin',             amount: '100 μg' },
  { name: 'B Complex',   form: 'Methylated B-Complex Premix', amount: '100% RDA' },
  { name: 'Zinc',        form: 'Zinc Bisglycinate',           amount: '10 mg'  },
  { name: 'Copper',      form: 'Copper Bisglycinate',         amount: '0.5 mg' },
  { name: 'Magnesium',   form: 'Magnesium Citrate',           amount: '350 mg' },
  { name: 'Selenium',    form: 'Selenomethionine',            amount: '50 μg'  },
];

const RECOVERY = [
  { name: 'Maltodextrin (Low DE)',  form: 'Carbohydrate Matrix',           amount: '20 000 mg' },
  { name: 'EAA Complex',            form: 'Full Spectrum (all 9 EAAs)',     amount: '7 000 mg'  },
  { name: 'Creatine Monohydrate',   form: 'Micronized (Clinical Grade)',    amount: '5 000 mg'  },
  { name: 'L-Glutamine',            form: 'Free-Form L-Glutamine',          amount: '3 000 mg'  },
  { name: 'HMB (Calcium Salt)',     form: 'Beta-Hydroxy Beta-Methylbutyrate', amount: '1 500 mg' },
  { name: 'Tart Cherry Extract',    form: 'Standardized Anthocyanin',       amount: '500 mg'    },
  { name: 'Himalayan Pink Salt',    form: '84 Trace Minerals',              amount: '300 mg'    },
  { name: 'Magnesium Bisglycinate', form: 'Chelated Magnesium',             amount: '150 mg'    },
  { name: 'L-Theanine',             form: 'Free-Form L-Theanine',           amount: '100 mg'    },
  { name: 'AstraGin®',              form: 'Astragalus + Panax',             amount: '50 mg'     },
];

const MORNING_PCTS  = [88, 70, 80, 93, 80, 75, 100, 70, 65, 42, 60];
const RECOVERY_PCTS = [40, 30, 45, 55, 35, 25, 70, 42, 30, 40];

function IngredientRow({ idx, item, kind, pct }: { idx: number; item: typeof MORNING[0]; kind: string; pct: number }) {
  const [open, setOpen] = useState(false);
  const accentColor = kind === 'morning' ? colors.morning : colors.recovery;
  const fillColor = kind === 'morning' ? colors.morning : colors.recovery;

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => setOpen(!open)} style={ir.row}>
      <View style={ir.head}>
        <Text style={ir.idx}>{String(idx).padStart(2, '0')}</Text>
        <View style={{ flex: 1 }}>
          <Text style={ir.name}>{item.name}</Text>
          <Text style={ir.form}>{item.form} · {item.amount}</Text>
        </View>
        <Text style={[ir.pct, { color: accentColor }]}>{pct}%</Text>
        <Text style={[ir.chev, { transform: [{ rotate: open ? '90deg' : '0deg' }] }]}>›</Text>
      </View>
      <View style={ir.barTrack}>
        <View style={[ir.barFill, { width: `${pct}%` as any, backgroundColor: fillColor }]} />
      </View>
      {open && (
        <View style={ir.expand}>
          <View style={ir.expandRow}>
            <Text style={ir.expandLabel}>Goal</Text>
            <Text style={ir.expandVal}>{item.amount}</Text>
          </View>
          <View style={[ir.expandRow, { marginTop: 6 }]}>
            <Text style={ir.expandLabel}>Today</Text>
            <Text style={ir.expandVal}>{pct}%</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const ir = StyleSheet.create({
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(13,13,15,0.06)' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  idx: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.ink3, width: 22 },
  name: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
  form: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3, marginTop: 1 },
  pct: { fontFamily: fonts.sansSemiBold, fontSize: 14, marginLeft: 8, minWidth: 36, textAlign: 'right' },
  chev: { fontFamily: fonts.sans, fontSize: 18, color: colors.ink3, marginLeft: 4 },
  barTrack: { height: 3, backgroundColor: 'rgba(13,13,15,0.08)', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  barFill: { height: 3, borderRadius: 2 },
  expand: { backgroundColor: 'rgba(13,13,15,0.03)', borderRadius: 8, padding: 12, marginTop: 8 },
  expandRow: { flexDirection: 'row', justifyContent: 'space-between' },
  expandLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.5, color: colors.ink3 },
  expandVal: { fontFamily: fonts.serifItalic, fontSize: 14, color: colors.ink },
});

export default function TrackScreen() {
  const [cat, setCat] = useState<'morning' | 'recovery'>('morning');
  const [val, setVal] = useState('');
  const [logged, setLogged] = useState<string[]>([]);

  const list = cat === 'morning' ? MORNING : RECOVERY;
  const basePcts = cat === 'morning' ? MORNING_PCTS : RECOVERY_PCTS;
  const bump = logged.length * 5;
  const pcts = basePcts.map(p => Math.min(100, p + bump));
  const overall = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  const grad = cat === 'morning' ? gradients.morning : gradients.recovery;

  const submit = () => {
    if (!val.trim()) return;
    setLogged(prev => [...prev, val.trim()]);
    setVal('');
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={s.greet}>
            <Text style={s.day}>Today's protocol</Text>
            <Text style={s.h1}>Track</Text>
          </View>

          <View style={s.px}>
            <View style={s.seg}>
              <TouchableOpacity
                style={[s.segBtn, cat === 'morning' && { backgroundColor: colors.morning }]}
                onPress={() => setCat('morning')}
              >
                <Text style={[s.segTxt, cat === 'morning' && { color: '#fff' }]}>Morning Pack</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.segBtn, cat === 'recovery' && { backgroundColor: colors.recovery }]}
                onPress={() => setCat('recovery')}
              >
                <Text style={[s.segTxt, cat === 'recovery' && { color: '#fff' }]}>Recovery Pack</Text>
              </TouchableOpacity>
            </View>

            <View style={s.ringStage}>
              <Ring size={170} stroke={6} pct={overall} gradient={grad} id={`ring-${cat}`} />
              <View style={s.ringCenter}>
                <Text style={[s.bigNum, { color: cat === 'morning' ? colors.morning : colors.recovery }]}>
                  {overall}<Text style={s.bigUnit}>%</Text>
                </Text>
                <Text style={s.eyebrow}>{cat === 'morning' ? 'Morning' : 'Recovery'}</Text>
              </View>
            </View>

            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                placeholder="Add what you ate…"
                placeholderTextColor={colors.ink3}
                value={val}
                onChangeText={setVal}
                onSubmitEditing={submit}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[s.sendBtn, { backgroundColor: val.trim() ? colors.ink : colors.ink4 }]}
                onPress={submit}
                disabled={!val.trim()}
              >
                <Icon name="arrow" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            {logged.length > 0 && (
              <View style={s.loggedList}>
                {logged.map((l, i) => (
                  <View key={i} style={s.loggedChip}>
                    <Text style={s.loggedChipText}>✓ {l}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={s.ingHead}>
              <Text style={s.eyebrow}>{cat === 'morning' ? 'Vitamins & Minerals' : 'Recovery Compounds'}</Text>
              <Text style={s.mutedSm}>{list.length} compounds</Text>
            </View>

            <View>
              {list.map((it, i) => (
                <IngredientRow key={i} idx={i + 1} item={it} kind={cat} pct={pcts[i] || 0} />
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 32 },
  px: { paddingHorizontal: 22 },

  greet: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 20 },
  day: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 1, color: colors.ink3, textTransform: 'uppercase', marginBottom: 4 },
  h1: { fontFamily: fonts.serif, fontSize: 40, color: colors.ink },

  seg: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13,13,15,0.06)',
    borderRadius: radii.pill,
    padding: 4,
    marginBottom: 22,
  },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: radii.pill, alignItems: 'center' },
  segTxt: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink2 },

  ringStage: { alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  bigNum: { fontFamily: fonts.serifItalic, fontSize: 40 },
  bigUnit: { fontSize: 22 },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.ink3, textTransform: 'uppercase', marginTop: 4 },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.line2,
    paddingVertical: 10,
  },
  sendBtn: { width: 36, height: 36, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },

  loggedList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  loggedChip: { backgroundColor: 'rgba(13,13,15,0.06)', borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  loggedChipText: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink2 },

  ingHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, marginTop: 8 },
  mutedSm: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3 },
});
