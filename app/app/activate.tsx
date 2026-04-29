import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
  Animated, Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { cacheAuth } from '../src/lib/auth-cache';
import { colors, fonts, radii, gradients } from '../src/theme';

const API_URL = 'https://web-zeta-lyart-53.vercel.app';
const CODE_LEN = 5;

export default function ActivateScreen() {
  const [digits, setDigits]     = useState<string[]>(Array(CODE_LEN).fill(''));
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [welcomed, setWelcomed] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId,   setUserId]   = useState('');

  const refs  = useRef<(TextInput | null)[]>([]);
  const fadeA  = useRef(new Animated.Value(0)).current;
  const scaleA = useRef(new Animated.Value(0.88)).current;

  const handleDigit = (val: string, idx: number) => {
    const ch = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(-1);
    const next = [...digits];
    next[idx] = ch;
    setDigits(next);
    setError('');
    if (ch && idx < CODE_LEN - 1) refs.current[idx + 1]?.focus();
    if (ch && idx === CODE_LEN - 1) tryActivate(next.join(''));
  };

  const handleBack = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0)
      refs.current[idx - 1]?.focus();
  };

  const tryActivate = async (code: string) => {
    if (code.length < CODE_LEN) return;
    Keyboard.dismiss();
    setLoading(true);
    setError('');

    try {
      // Step 1: validate code with server
      const res = await fetch(`${API_URL}/api/app/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid code. Try again.');
        setLoading(false);
        return;
      }

      // Step 2: sign in using token_hash (most reliable method)
      const { data: authData, error: otpErr } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: 'magiclink',
      });

      if (otpErr || !authData?.session) {
        console.error('verifyOtp error:', otpErr?.message);
        setError('Could not sign in. Try again.');
        setLoading(false);
        return;
      }

      // Step 3: cache session tokens so onboarding can restore them if needed
      const uid = authData.user?.id ?? '';
      if (uid && authData.session) {
        cacheAuth(uid, authData.session.access_token, authData.session.refresh_token);
      }

      setUserId(uid);
      setUserName((data.name || 'Athlete').split(' ')[0]);
      setLoading(false);
      showWelcome(uid);

    } catch (e: any) {
      console.error('activate error:', e);
      setError('Network error. Check your connection.');
      setLoading(false);
    }
  };

  const showWelcome = (uid: string) => {
    setWelcomed(true);
    Animated.parallel([
      Animated.timing(fadeA,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleA, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(async () => {
        if (!uid) { router.replace('/onboarding'); return; }
        try {
          const { data: profile } = await supabase
            .from('profiles').select('onboarding_done').eq('id', uid).maybeSingle();
          router.replace(profile?.onboarding_done ? '/(tabs)' : '/onboarding');
        } catch {
          router.replace('/onboarding');
        }
      }, 2600);
    });
  };

  if (welcomed) {
    return (
      <SafeAreaView style={s.safe}>
        <LinearGradient colors={['#fafaf7', '#fff8f3', '#fafaf7']} style={s.welcomeBg}>
          <Animated.View style={[s.welcomeBox, { opacity: fadeA, transform: [{ scale: scaleA }] }]}>
            <Text style={s.brand}>LIFECODE</Text>
            <View style={{ height: 40 }} />
            <Text style={s.welcomeGreet}>Welcome,</Text>
            <Text style={s.welcomeName}>{userName}.</Text>
            <View style={{ height: 24 }} />
            <Text style={s.welcomeSub}>Your protocol is activated.{'\n'}Let's build your profile.</Text>
            <View style={{ height: 48 }} />
            <ActivityIndicator color={colors.morning} size="small" />
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const code = digits.join('');

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        <Text style={s.brand}>LIFECODE</Text>

        <View style={s.heroBlock}>
          <Text style={s.title}>Enter your{'\n'}access code.</Text>
          <Text style={s.sub}>Check the email you used on our website.{'\n'}The code is 5 characters.</Text>
        </View>

        <View style={s.codeRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={r => { refs.current[i] = r; }}
              style={[s.box, d ? s.boxFilled : null, error ? s.boxError : null]}
              value={d}
              onChangeText={v => handleDigit(v, i)}
              onKeyPress={e => handleBack(e, i)}
              maxLength={1}
              autoCapitalize="characters"
              autoCorrect={false}
              selectTextOnFocus
            />
          ))}
        </View>

        {!!error && <Text style={s.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[s.btn, (loading || code.length < CODE_LEN) && s.btnDim]}
          onPress={() => tryActivate(code)}
          disabled={loading || code.length < CODE_LEN}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : (
              <LinearGradient
                colors={gradients.morning as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.btnGrad}
              >
                <Text style={s.btnText}>Activate →</Text>
              </LinearGradient>
            )
          }
        </TouchableOpacity>

        <Text style={s.hint}>No code yet? Visit our website to register.</Text>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-evenly', paddingTop: 16, paddingBottom: 48 },
  brand:     { textAlign: 'center', fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 4, color: colors.ink3, textTransform: 'uppercase' },

  heroBlock: { gap: 12 },
  title:     { fontFamily: fonts.serif, fontSize: 46, color: colors.ink, lineHeight: 50 },
  sub:       { fontFamily: fonts.sans,  fontSize: 15, color: colors.ink2, lineHeight: 24 },

  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  box: {
    width: 56, height: 70, borderRadius: 18,
    borderWidth: 1.5, borderColor: colors.line2,
    backgroundColor: '#fff',
    textAlign: 'center',
    fontFamily: fonts.sansBold, fontSize: 28, color: colors.ink,
  },
  boxFilled: { borderColor: colors.morning, backgroundColor: '#fff9f5' },
  boxError:  { borderColor: '#e55', backgroundColor: '#fff5f5' },
  errorText: { fontFamily: fonts.sans, fontSize: 14, color: '#e55', textAlign: 'center' },

  btn:     { borderRadius: radii.pill, overflow: 'hidden' },
  btnDim:  { opacity: 0.38 },
  btnGrad: { paddingVertical: 18, alignItems: 'center' },
  btnText: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: '#fff' },

  hint:     { fontFamily: fonts.sans, fontSize: 13, color: colors.ink3, textAlign: 'center' },

  welcomeBg:    { flex: 1, alignItems: 'flex-start', justifyContent: 'center', paddingHorizontal: 36 },
  welcomeBox:   { width: '100%' },
  welcomeGreet: { fontFamily: fonts.serif,       fontSize: 52, color: colors.ink2,    lineHeight: 56 },
  welcomeName:  { fontFamily: fonts.serifItalic, fontSize: 64, color: colors.morning, lineHeight: 68 },
  welcomeSub:   { fontFamily: fonts.sans,        fontSize: 16, color: colors.ink2,    lineHeight: 26 },
});
