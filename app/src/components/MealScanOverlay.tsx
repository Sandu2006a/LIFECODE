import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Easing, Modal, ActivityIndicator, Image, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from './Icon';
import { colors, fonts } from '../theme';
import { scanMeal, logMeal, ScannedIngredient } from '../lib/api';
import type { DailyTotals } from '../lib/dailyTotals';

type Step = 'cam' | 'scan' | 'review';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  totals?: DailyTotals | null;
}

// Map AI food-scan key → nutrient ID in nutrition.ts.
// Used to look up the athlete's personalized target so the boost preview
// matches what the ring will actually show.
const FOOD_KEY_TO_NUTRIENT_ID: { foodKey: string; label: string; nutrientId: string }[] = [
  { foodKey: 'omega_3',     label: 'Omega-3',   nutrientId: 'omega_3' },
  { foodKey: 'calcium',     label: 'Calcium',   nutrientId: 'calcium' },
  { foodKey: 'potassium',   label: 'Potassium', nutrientId: 'potassium' },
  { foodKey: 'sodium',      label: 'Sodium',    nutrientId: 'sodium' },
  { foodKey: 'iodine',      label: 'Iodine',    nutrientId: 'iodine' },
  { foodKey: 'vitamin_c',   label: 'Vit C',     nutrientId: 'vit_c' },
  { foodKey: 'vitamin_d3',  label: 'Vit D3',    nutrientId: 'vit_d3' },
  { foodKey: 'magnesium',   label: 'Magnesium', nutrientId: 'magnesium_am' },
  { foodKey: 'zinc',        label: 'Zinc',      nutrientId: 'zinc' },
  { foodKey: 'eaa',         label: 'EAA',       nutrientId: 'eaa' },
  { foodKey: 'glutamine',   label: 'Glutamine', nutrientId: 'l_glutamine' },
  { foodKey: 'vitamin_a',   label: 'Vit A',     nutrientId: 'vit_a' },
  { foodKey: 'vitamin_e',   label: 'Vit E',     nutrientId: 'vit_e' },
  { foodKey: 'vitamin_k2',  label: 'Vit K2',    nutrientId: 'vit_k2' },
  { foodKey: 'vitamin_b12', label: 'Vit B12',   nutrientId: 'vit_b12' },
  { foodKey: 'selenium',    label: 'Selenium',  nutrientId: 'selenium' },
  { foodKey: 'copper',      label: 'Copper',    nutrientId: 'copper' },
];

export default function MealScanOverlay({ visible, onClose, onSaved, totals }: Props) {
  const [step, setStep] = useState<Step>('cam');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<ScannedIngredient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const scanAnim = useRef(new Animated.Value(0)).current;
  const dotPulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!visible) {
      setStep('cam');
      setPhotoUri(null);
      setDescription('');
      setIngredients([]);
      setError(null);
      setSaving(false);
    }
  }, [visible]);

  useEffect(() => {
    if (step !== 'scan') return;
    const a1 = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      ])
    );
    const a2 = Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(dotPulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    a1.start(); a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, [step]);

  // Quality 0.35 — aggressive enough that even a 12MP phone photo compresses
  // to well under Vercel's 4.5MB body limit (typical: 400-800KB base64),
  // while keeping enough detail for Gemini Vision to identify foods.
  // ImagePicker doesn't expose a resize option, so quality is our only knob.
  const IMG_OPTS = {
    quality: 0.35,
    base64: true,
    exif: false,
  } as const;

  async function pickFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      ...IMG_OPTS,
    });
    if (res.canceled) return;
    const asset = res.assets[0];
    setPhotoUri(asset.uri);
    runAnalysis(asset.base64 || '');
  }

  async function captureFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      pickFromGallery();
      return;
    }
    const res = await ImagePicker.launchCameraAsync(IMG_OPTS);
    if (res.canceled) return;
    const asset = res.assets[0];
    setPhotoUri(asset.uri);
    runAnalysis(asset.base64 || '');
  }

  async function runAnalysis(base64: string) {
    setStep('scan');
    setError(null);

    if (!base64) {
      setError('Could not read image data.');
      setStep('review');
      return;
    }

    try {
      const res = await scanMeal(base64, 'image/jpeg');
      if (!res.ok) {
        setError(res.error || 'Could not analyze the meal.');
        setIngredients([]);
        setDescription('Unknown meal');
      } else {
        setDescription(res.description || 'Scanned meal');
        setIngredients(res.ingredients || []);
      }
    } catch (e: any) {
      setError(e?.message || 'Network error.');
    }
    setStep('review');
  }

  // Text-only flow: user types what they ate, AI analyzes via /api/scan-meal-text
  // (or fallback: route as a single "ingredient" via scan endpoint).
  async function runTextAnalysis(meal: string) {
    if (!meal.trim()) return;
    setStep('scan');
    setError(null);
    setPhotoUri(null);
    try {
      // We reuse the scan-meal endpoint by sending the text in a synthetic prompt
      // through Gemini text mode. The server's INGREDIENT_INSTRUCTIONS prompt accepts
      // either an image OR a text description if no image is passed.
      // Simpler approach: hit /api/meal directly which does Gemini-text analysis
      // and INSERTS the meal — bypassing the review screen.
      const res = await logMeal(meal.trim(), 100, undefined);
      if (!res.ok) {
        setError(res.error || 'Could not analyze the meal.');
        setIngredients([]);
        setDescription(meal);
        setStep('review');
        return;
      }
      const nutrients = res.nutrients || {};
      setDescription(meal);
      setIngredients([{ name: meal, quantity_g: 100, nutrients }]);
      // The meal was already saved server-side. Tell the parent to refresh,
      // then jump straight to a "saved" state.
      onSaved?.();
      setStep('review');
    } catch (e: any) {
      setError(e?.message || 'Network error.');
      setStep('review');
    }
  }

  function totalNutrients(ings: ScannedIngredient[]): Record<string, number> {
    const totals: Record<string, number> = {};
    for (const ing of ings) {
      for (const [k, v] of Object.entries(ing.nutrients || {})) {
        const num = Number(v);
        if (!Number.isFinite(num) || num <= 0) continue;
        totals[k] = (totals[k] || 0) + num;
      }
    }
    return totals;
  }

  async function saveMeal() {
    if (saving || ingredients.length === 0) return;
    setSaving(true);
    try {
      const totals = totalNutrients(ingredients);
      const totalQty = ingredients.reduce((s, i) => s + (i.quantity_g || 0), 0) || 100;
      const res = await logMeal(description || 'Scanned meal', totalQty, totals);
      if (!res.ok) {
        setError(res.error || 'Could not save meal.');
        setSaving(false);
        return;
      }
      onSaved?.();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Could not save meal.');
      setSaving(false);
    }
  }

  const mealTotals = totalNutrients(ingredients);
  const totalQty = ingredients.reduce((s, i) => s + (i.quantity_g || 0), 0);
  const boost = buildBoost(mealTotals, totals || null);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      {step === 'cam' && (
        <CameraView
          onClose={onClose}
          onCapture={captureFromCamera}
          onGallery={pickFromGallery}
          onTextSubmit={runTextAnalysis}
        />
      )}

      {step === 'scan' && (
        <ScanView photoUri={photoUri} onClose={onClose} scanAnim={scanAnim} dotPulse={dotPulse} />
      )}

      {step === 'review' && (
        <ReviewView
          photoUri={photoUri}
          description={description}
          ingredients={ingredients}
          totals={mealTotals}
          totalQty={totalQty}
          boost={boost}
          error={error}
          saving={saving}
          onClose={onClose}
          onRetake={() => { setStep('cam'); setPhotoUri(null); setIngredients([]); }}
          onCommit={saveMeal}
          onRemoveIngredient={(idx) => setIngredients(prev => prev.filter((_, i) => i !== idx))}
        />
      )}
    </Modal>
  );
}

function buildBoost(mealNutrients: Record<string, number>, dailyTotals: DailyTotals | null): { label: string; pct: number }[] {
  const out: { label: string; pct: number }[] = [];
  for (const ref of FOOD_KEY_TO_NUTRIENT_ID) {
    let v = Number(mealNutrients[ref.foodKey]) || 0;
    if (v <= 0) continue;

    // Normalize units the same way nutrition.ts does for food contribution
    // (eaa, glutamine, creatine arrive in mg but target is in g)
    if (ref.nutrientId === 'eaa' || ref.nutrientId === 'l_glutamine' || ref.nutrientId === 'creatine') {
      v = v / 1000;
    }

    // Use the athlete's REAL personalized target so this matches the ring
    const row = dailyTotals?.rows.find(r => r.id === ref.nutrientId);
    const target = row?.target;
    if (!target || target <= 0) continue;

    const pct = Math.round((v / target) * 100);
    if (pct >= 3) out.push({ label: ref.label, pct: Math.min(150, pct) });
    if (out.length >= 4) break;
  }
  return out;
}

// ── Camera placeholder (uses ImagePicker.launchCameraAsync for actual capture) ──
function CameraView({ onClose, onCapture, onGallery, onTextSubmit }: { onClose: () => void; onCapture: () => void; onGallery: () => void; onTextSubmit: (meal: string) => void }) {
  const [typeOpen, setTypeOpen] = useState(false);
  const [typedMeal, setTypedMeal] = useState('');

  return (
    <View style={cam.bg}>
      <SafeAreaView style={cam.safe} edges={['top', 'bottom']}>
        <View style={cam.topRow}>
          <TouchableOpacity onPress={onClose} style={cam.tBtn}>
            <Icon name="x" size={18} color="#fafaf7" strokeWidth={2} />
          </TouchableOpacity>
          <View style={cam.tBtn}>
            <Icon name="camera" size={18} color="#fafaf7" strokeWidth={2} />
          </View>
        </View>

        <View style={cam.vp}>
          <View style={[cam.gridV, { left: '33.33%' }]} />
          <View style={[cam.gridV, { left: '66.66%' }]} />
          <View style={[cam.gridH, { top: '33.33%' }]} />
          <View style={[cam.gridH, { top: '66.66%' }]} />
          <View style={[cam.corner, cam.cTL]} />
          <View style={[cam.corner, cam.cTR]} />
          <View style={[cam.corner, cam.cBL]} />
          <View style={[cam.corner, cam.cBR]} />
          <Text style={cam.hint}>Tap shutter to scan a meal</Text>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Manual entry bar — type what you ate when photo doesn't capture it well */}
          <View style={cam.typeBar}>
            <Icon name="chat" size={16} color="rgba(255,255,255,0.6)" strokeWidth={2} />
            <TextInput
              style={cam.typeInput}
              value={typedMeal}
              onChangeText={setTypedMeal}
              placeholder="Or describe your meal — e.g. 200g chicken, rice, broccoli"
              placeholderTextColor="rgba(255,255,255,0.4)"
              returnKeyType="send"
              onSubmitEditing={() => {
                if (typedMeal.trim()) { onTextSubmit(typedMeal.trim()); setTypedMeal(''); }
              }}
              onFocus={() => setTypeOpen(true)}
              onBlur={() => setTypeOpen(false)}
            />
            {typedMeal.trim().length > 0 && (
              <TouchableOpacity
                onPress={() => { onTextSubmit(typedMeal.trim()); setTypedMeal(''); }}
                style={cam.typeSend}
                activeOpacity={0.85}
              >
                <Icon name="arrow-up" size={14} color="#fff" strokeWidth={2.4} />
              </TouchableOpacity>
            )}
          </View>

          {!typeOpen && (
            <View style={cam.bottomRow}>
              <TouchableOpacity onPress={onGallery}>
                <Text style={cam.sideLabel}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onCapture} style={cam.shutterWrap} activeOpacity={0.7}>
                <View style={cam.shutterInner} />
              </TouchableOpacity>
              <View style={{ width: 60 }} />
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function ScanView({ photoUri, onClose, scanAnim, dotPulse }: { photoUri: string | null; onClose: () => void; scanAnim: Animated.Value; dotPulse: Animated.Value }) {
  const translate = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 230] });
  return (
    <View style={scan.bg}>
      <SafeAreaView style={cam.safe} edges={['top', 'bottom']}>
        <View style={cam.topRow}>
          <TouchableOpacity onPress={onClose} style={cam.tBtn}>
            <Icon name="x" size={18} color="#fafaf7" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={scan.step}>ANALYZING</Text>
        </View>

        <View style={scan.photoWrap}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={scan.photo} resizeMode="cover" />
          ) : (
            <View style={[scan.photo, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />
          )}
          <Animated.View style={[scan.scanline, { transform: [{ translateY: translate }] }]}>
            <LinearGradient
              colors={['rgba(129,140,248,0)', 'rgba(129,140,248,0.85)', 'rgba(129,140,248,0)']}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        <View style={scan.bottom}>
          <Text style={scan.h2}>Reading your <Text style={{ fontFamily: fonts.serifItalic }}>meal…</Text></Text>
          <Animated.View style={{ opacity: dotPulse }}>
            <Text style={scan.stepText}>Calculating nutrients</Text>
          </Animated.View>
          <ActivityIndicator color="#fafaf7" />
        </View>
      </SafeAreaView>
    </View>
  );
}

function ReviewView({
  photoUri, description, ingredients, totals, totalQty, boost, error, saving,
  onClose, onRetake, onCommit, onRemoveIngredient,
}: {
  photoUri: string | null;
  description: string;
  ingredients: ScannedIngredient[];
  totals: Record<string, number>;
  totalQty: number;
  boost: { label: string; pct: number }[];
  error: string | null;
  saving: boolean;
  onClose: () => void;
  onRetake: () => void;
  onCommit: () => void;
  onRemoveIngredient: (idx: number) => void;
}) {
  return (
    <SafeAreaView style={rv.safe} edges={['top']}>
      <View style={rv.top}>
        <TouchableOpacity onPress={onClose} style={rv.iconBtn}>
          <Icon name="x" size={18} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={rv.topTitle}>Review meal</Text>
        <TouchableOpacity onPress={onRetake} style={rv.iconBtn}>
          <Icon name="camera" size={16} color={colors.ink} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={rv.body} showsVerticalScrollIndicator={false}>
        <View style={rv.photoWrap}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={rv.photo} resizeMode="cover" />
          ) : (
            <LinearGradient colors={['#fff3ec', '#ffe8d6']} style={rv.photo} />
          )}
        </View>

        {error && (
          <View style={rv.errorChip}>
            <Text style={rv.errorText}>{error}</Text>
          </View>
        )}

        <Text style={rv.mealName}>{description || 'Scanned meal'}</Text>
        {totalQty > 0 && <Text style={rv.mealMeta}>~{totalQty}g · {ingredients.length} {ingredients.length === 1 ? 'ingredient' : 'ingredients'} · micronutrients only</Text>}

        <View style={rv.card}>
          <Text style={rv.eyebrow}>INGREDIENTS</Text>
          {ingredients.length === 0 ? (
            <Text style={rv.emptyText}>No ingredients detected. Try again with better lighting.</Text>
          ) : (
            <View style={{ marginTop: 10 }}>
              {ingredients.map((i, idx) => (
                <View key={idx} style={[rv.ingRow, idx < ingredients.length - 1 && rv.ingRowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={rv.ingName}>{i.name}</Text>
                    <Text style={rv.ingMeta}>{i.quantity_g}g · {countNutrients(i.nutrients)} nutrients</Text>
                  </View>
                  <TouchableOpacity onPress={() => onRemoveIngredient(idx)} style={rv.ingX}>
                    <Icon name="x" size={12} color={colors.ink2} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {boost.length > 0 && (
          <View style={rv.boost}>
            <LinearGradient
              colors={['rgba(79,70,229,0.20)', 'rgba(239,68,68,0.10)', 'transparent']}
              start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[rv.eyebrow, { color: 'rgba(250,250,247,0.55)' }]}>LIFECODE BOOST</Text>
            <Text style={rv.boostH}>This meal codes for…</Text>
            <View style={rv.boostChips}>
              {boost.map((b, i) => (
                <View key={i} style={rv.boostChip}>
                  <Text style={rv.boostChipPct}>+{b.pct}%</Text>
                  <Text style={rv.boostChipLbl}>{b.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={rv.helper}>Your nutrient totals update on Summary after saving.</Text>
      </ScrollView>

      <View style={rv.bottomBar}>
        <TouchableOpacity
          onPress={onCommit}
          disabled={saving || ingredients.length === 0}
          style={[rv.addBtn, (saving || ingredients.length === 0) && { opacity: 0.5 }]}
          activeOpacity={0.85}
        >
          {saving ? <ActivityIndicator color="#fff" /> : (
            <>
              <Text style={rv.addBtnText}>Add to <Text style={{ fontFamily: fonts.serifItalic }}>today</Text></Text>
              <Icon name="arrow" size={16} color="#fff" strokeWidth={2} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function countNutrients(n: Record<string, number>): number {
  return Object.values(n || {}).filter(v => Number(v) > 0).length;
}

// ── Styles ──

const cam = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#0a0a0a' },
  safe: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 8 },
  tBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  vp: { flex: 1, marginHorizontal: 22, marginVertical: 20, position: 'relative', overflow: 'hidden', borderRadius: 24, backgroundColor: '#070707' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.18)' },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.18)' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#fff', borderWidth: 0 },
  cTL: { top: 14, left: 14, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 4 },
  cTR: { top: 14, right: 14, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 4 },
  cBL: { bottom: 14, left: 14, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 4 },
  cBR: { bottom: 14, right: 14, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 4 },
  hint: { position: 'absolute', bottom: 28, alignSelf: 'center', color: '#fff', fontFamily: fonts.serifItalic, fontSize: 18 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 38, paddingBottom: 18 },
  sideLabel: { color: '#fff', fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  shutterWrap: { width: 74, height: 74, borderRadius: 37, borderWidth: 5, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },

  typeBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 22, marginBottom: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  typeInput: {
    flex: 1, color: '#fff', fontFamily: fonts.sans, fontSize: 14,
    paddingVertical: 0,
  },
  typeSend: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#4F46E5',
    alignItems: 'center', justifyContent: 'center',
  },
});

const scan = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#0a0a0a' },
  step: { color: 'rgba(250,250,247,0.6)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontFamily: fonts.sansMedium, alignSelf: 'center', marginTop: 10 },
  photoWrap: { width: 230, height: 230, alignSelf: 'center', borderRadius: 24, overflow: 'hidden', marginTop: 36, backgroundColor: '#1a1a1a', position: 'relative' },
  photo: { width: '100%', height: '100%' },
  scanline: { position: 'absolute', left: 0, right: 0, height: 50 },
  bottom: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 40, gap: 14 },
  h2: { fontFamily: fonts.serif, color: '#fff', fontSize: 26 },
  stepText: { color: 'rgba(250,250,247,0.7)', fontFamily: fonts.sansMedium, fontSize: 13 },
});

const rv = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 12 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surf, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: fonts.serifItalic, fontSize: 20, color: colors.ink },
  body: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 110, gap: 14 },

  photoWrap: { borderRadius: 24, height: 200, overflow: 'hidden', backgroundColor: '#fff3ec' },
  photo: { width: '100%', height: '100%' },

  errorChip: { padding: 12, borderRadius: 14, backgroundColor: '#ffe8d6', borderWidth: 1, borderColor: 'rgba(220,38,38,0.3)' },
  errorText: { fontFamily: fonts.sansMedium, fontSize: 12, color: '#DC2626' },

  mealName: { fontFamily: fonts.serifItalic, fontSize: 26, color: colors.ink, marginTop: 4 },
  mealMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3, marginTop: -8 },

  card: { backgroundColor: colors.surf, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: colors.line },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 2, color: colors.ink3, textTransform: 'uppercase' },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink3, paddingTop: 10 },
  ingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  ingRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(13,13,15,0.05)' },
  ingName: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
  ingMeta: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3, marginTop: 2 },
  ingX: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: colors.line2, alignItems: 'center', justifyContent: 'center' },

  boost: { borderRadius: 22, padding: 18, backgroundColor: '#0d0d0f', overflow: 'hidden', gap: 6 },
  boostH: { fontFamily: fonts.serifItalic, fontSize: 20, color: '#fafaf7' },
  boostChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  boostChip: { flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)' },
  boostChipPct: { fontFamily: fonts.serifItalic, fontSize: 14, color: '#fafaf7' },
  boostChipLbl: { fontFamily: fonts.sansMedium, fontSize: 11, color: 'rgba(250,250,247,0.7)' },

  helper: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink3, textAlign: 'center', marginTop: 8 },

  bottomBar: { position: 'absolute', left: 22, right: 22, bottom: 22 },
  addBtn: { height: 54, borderRadius: 999, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  addBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: '#fff' },
});
