import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated, Keyboard, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/lib/supabase';
import { cacheAuth, checkOnboardingDone } from '../src/lib/auth-cache';
import { lifecodeFetch } from '../src/lib/api';
import { colors, fonts, radii, gradients } from '../src/theme';

type Mode = 'login' | 'signup';

// Friendly auth error copy — supabase messages are too technical for the UI.
function prettyAuthError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'Wrong email or password.';
  if (/email not confirmed/i.test(msg)) return 'This account needs activation — use your access code instead.';
  if (/rate limit/i.test(msg)) return 'Too many attempts. Wait a minute and try again.';
  return msg || 'Something went wrong. Try again.';
}

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Welcome moment (same feel as activate.tsx)
  const [welcomed, setWelcomed] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');
  const fadeA  = useRef(new Animated.Value(0)).current;
  const scaleA = useRef(new Animated.Value(0.88)).current;

  const canSubmit =
    email.trim().includes('@') &&
    password.length >= (mode === 'signup' ? 8 : 1) &&
    (mode === 'login' || name.trim().length > 0);

  // Common post-auth bookkeeping: cache tokens, persist flags + name, then
  // route. `dest` decides where the welcome animation lands.
  async function finishAuth(session: any, displayName: string, dest: '/(tabs)' | '/onboarding') {
    const uid = session?.user?.id ?? '';
    if (uid && session) {
      cacheAuth(uid, session.access_token, session.refresh_token);
    }
    try {
      await AsyncStorage.setItem('lifecode.activated_once', '1');
      await AsyncStorage.setItem('lifecode.last_uid', uid);
      if (dest === '/(tabs)') await AsyncStorage.setItem('lifecode.onboarding_done', '1');
      if (displayName && displayName !== 'Athlete') {
        await AsyncStorage.setItem('lifecode.user_name', displayName);
        await AsyncStorage.setItem('lifecode.name_prompt_done', '1');
      }
    } catch {}

    setWelcomeName((displayName || 'Athlete').split(' ')[0]);
    setLoading(false);
    setWelcomed(true);
    Animated.parallel([
      Animated.timing(fadeA,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleA, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => router.replace(dest), 1400);
    });
  }

  function resolveName(user: any): string {
    return user?.user_metadata?.display_name
      || user?.user_metadata?.full_name
      || (user?.email?.split('@')[0] || '').replace(/^./, (c: string) => c.toUpperCase())
      || 'Athlete';
  }

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    Keyboard.dismiss();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        // Server creates the account confirmed (no email roundtrip), then we
        // sign in with the same credentials.
        const res = await lifecodeFetch('/api/app/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
          timeoutMs: 20_000,
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'Could not create account.');
          setLoading(false);
          return;
        }
      }

      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authErr || !data?.session) {
        setError(prettyAuthError(authErr?.message || ''));
        setLoading(false);
        return;
      }

      const displayName = mode === 'signup' ? name.trim() : resolveName(data.user);

      if (mode === 'signup') {
        await finishAuth(data.session, displayName, '/onboarding');
      } else {
        const done = await checkOnboardingDone(data.user?.id ?? '', data.session.access_token);
        await finishAuth(data.session, displayName, done ? '/(tabs)' : '/onboarding');
      }
    } catch (e: any) {
      const msg = e?.name === 'AbortError'
        ? 'Connection timed out. Try mobile data or VPN.'
        : (e?.message || 'Network error. Check your connection.');
      setError(msg);
      setLoading(false);
    }
  };

  if (welcomed) {
    return (
      <SafeAreaView style={s.safe}>
        <LinearGradient colors={['#F7F7F5', '#FDF2F2', '#F7F7F5']} style={s.welcomeBg}>
          <Animated.View style={[s.welcomeBox, { opacity: fadeA, transform: [{ scale: scaleA }] }]}>
            <Text style={s.brand}>LIFECODE</Text>
            <View style={{ height: 40 }} />
            <Text style={s.welcomeGreet}>{mode === 'signup' ? 'Welcome,' : 'Welcome back,'}</Text>
            <Text style={s.welcomeName}>{welcomeName}.</Text>
            <View style={{ height: 24 }} />
            <Text style={s.welcomeSub}>
              {mode === 'signup'
                ? "Your account is ready.\nLet's build your profile."
                : 'Your protocol is loading.'}
            </Text>
            <View style={{ height: 48 }} />
            <ActivityIndicator color={colors.morning} size="small" />
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.kav}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled" bounces={false}>

          <Text style={s.brand}>LIFECODE</Text>

          <View style={s.hero}>
            <Text style={s.heroTitle}>
              {mode === 'login' ? 'Welcome\nback.' : 'Join\nLIFECODE.'}
            </Text>
            <Text style={s.heroSub}>
              {mode === 'login'
                ? 'Sign in to continue your protocol.'
                : 'Create your account in seconds — no code needed.'}
            </Text>
          </View>

          <View style={s.form}>
            {mode === 'signup' && (
              <>
                <Text style={s.label}>NAME</Text>
                <TextInput
                  style={s.input}
                  value={name}
                  onChangeText={v => { setName(v); setError(''); }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholder="Your name"
                  placeholderTextColor={colors.ink4}
                  returnKeyType="next"
                />
              </>
            )}

            <Text style={[s.label, mode === 'signup' && { marginTop: 18 }]}>EMAIL</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={v => { setEmail(v); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="you@example.com"
              placeholderTextColor={colors.ink4}
              returnKeyType="next"
            />

            <Text style={[s.label, { marginTop: 18 }]}>PASSWORD</Text>
            <View style={s.passRow}>
              <TextInput
                style={[s.input, { flex: 1, marginBottom: 0 }]}
                value={password}
                onChangeText={v => { setPassword(v); setError(''); }}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'}
                placeholderTextColor={colors.ink4}
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.showBtn} activeOpacity={0.6}>
                <Text style={s.showText}>{showPass ? 'HIDE' : 'SHOW'}</Text>
              </TouchableOpacity>
            </View>

            {!!error && <Text style={s.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[s.cta, (!canSubmit || loading) && s.ctaDim]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={!canSubmit || loading}
            >
              <LinearGradient
                colors={gradients.morning as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.ctaGrad}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.ctaText}>{mode === 'login' ? 'Sign in →' : 'Create account →'}</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            <View style={s.alt}>
              <Text style={s.altText}>
                {mode === 'login' ? 'New here? ' : 'Already have an account? '}
              </Text>
              <TouchableOpacity onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
                <Text style={s.altLink}>{mode === 'login' ? 'Create account' : 'Sign in'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={() => router.push('/activate')} style={s.codeLink} activeOpacity={0.6}>
            <Text style={s.codeLinkText}>Have an access code from your email? <Text style={s.codeLinkBold}>Activate →</Text></Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  kav: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 28, justifyContent: 'space-evenly', paddingTop: 16, paddingBottom: 36 },

  brand: { textAlign: 'center', fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 4, color: colors.ink3, textTransform: 'uppercase' },

  hero: { gap: 12 },
  heroTitle: { fontFamily: fonts.serif, fontSize: 46, color: colors.ink, lineHeight: 50, letterSpacing: -1 },
  heroSub: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink2, lineHeight: 24 },

  form: { gap: 0 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 1.8, color: colors.ink3, marginBottom: 6 },
  input: {
    fontFamily: fonts.sans, fontSize: 17, color: colors.ink,
    borderBottomWidth: 1.5, borderBottomColor: colors.line2,
    paddingVertical: 10, marginBottom: 4,
  },
  passRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  showBtn: { paddingVertical: 8 },
  showText: { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 1.4, color: colors.ink3 },

  errorText: { fontFamily: fonts.sans, fontSize: 13, color: '#DC2626', marginTop: 14, textAlign: 'center' },

  cta: { borderRadius: radii.pill, overflow: 'hidden', marginTop: 26 },
  ctaDim: { opacity: 0.38 },
  ctaGrad: { paddingVertical: 17, alignItems: 'center' },
  ctaText: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: '#fff' },

  alt: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  altText: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink2 },
  altLink: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },

  codeLink: { alignItems: 'center', paddingVertical: 8 },
  codeLinkText: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink3 },
  codeLinkBold: { fontFamily: fonts.sansSemiBold, color: colors.ink2 },

  welcomeBg:    { flex: 1, alignItems: 'flex-start', justifyContent: 'center', paddingHorizontal: 36 },
  welcomeBox:   { width: '100%' },
  welcomeGreet: { fontFamily: fonts.serif,       fontSize: 48, color: colors.ink2,    lineHeight: 54 },
  welcomeName:  { fontFamily: fonts.serifItalic, fontSize: 62, color: colors.morning, lineHeight: 68, letterSpacing: -2 },
  welcomeSub:   { fontFamily: fonts.sans,        fontSize: 16, color: colors.ink2,    lineHeight: 26 },
});
