import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import GradientText from '../src/components/GradientText';
import { colors, fonts, radii, gradients } from '../src/theme';
import { supabase } from '../src/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type Mode = 'login' | 'signup';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      Alert.alert('Missing fields', 'Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        router.replace('/(tabs)');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name, display_name: name } },
        });
        if (error) throw error;
        if (data.session) {
          router.replace('/onboarding');
        } else {
          Alert.alert('Check your email', 'We sent a confirmation link to ' + email);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'lifecode://auth',
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, 'lifecode://');
        if (result.type === 'success' && result.url) {
          const params = new URL(result.url);
          const accessToken = params.searchParams.get('access_token');
          const refreshToken = params.searchParams.get('refresh_token');
          if (accessToken && refreshToken) {
            const { error: sessionErr } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            if (sessionErr) throw sessionErr;
            router.replace('/(tabs)');
          }
        }
      }
    } catch (err: any) {
      Alert.alert('Google sign-in failed', err.message ?? 'Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.kav}>
        <View style={s.container}>

          <View style={s.top}>
            <Text style={s.brand}>LIFECODE</Text>
            <Text style={s.tagItalic}>Code your life.</Text>
          </View>

          <View style={s.hero}>
            <Text style={s.heroTitle}>
              {mode === 'login' ? 'Welcome\n' : 'Join\n'}
              <GradientText colors={gradients.morning} style={s.heroItalic}>
                {mode === 'login' ? 'back.' : 'LIFECODE.'}
              </GradientText>
            </Text>
            <Text style={s.heroSub}>
              {mode === 'login'
                ? 'Sign in to continue your protocol.'
                : 'Create your account to start tracking.'}
            </Text>
          </View>

          <View style={s.form}>
            {mode === 'signup' && (
              <>
                <Text style={s.label}>NAME</Text>
                <TextInput
                  style={s.input}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholder="Your name"
                  placeholderTextColor={colors.ink4}
                />
              </>
            )}

            <Text style={[s.label, mode === 'signup' && { marginTop: 14 }]}>EMAIL</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
              placeholderTextColor={colors.ink4}
            />

            <Text style={[s.label, { marginTop: 14 }]}>PASSWORD</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.ink4}
            />

            <TouchableOpacity
              style={[s.cta, loading && s.ctaDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.ctaText}>{mode === 'login' ? 'Sign in →' : 'Create account →'}</Text>
              }
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={s.divLine} />
              <Text style={s.divText}>or</Text>
              <View style={s.divLine} />
            </View>

            <TouchableOpacity
              style={[s.googleBtn, googleLoading && s.ctaDisabled]}
              onPress={handleGoogle}
              activeOpacity={0.85}
              disabled={googleLoading}
            >
              {googleLoading
                ? <ActivityIndicator color={colors.ink} />
                : (
                  <>
                    <Text style={s.googleG}>G</Text>
                    <Text style={s.googleText}>Continue with Google</Text>
                  </>
                )
              }
            </TouchableOpacity>

            <View style={s.alt}>
              <Text style={s.altText}>
                {mode === 'login' ? 'New here? ' : 'Already have an account? '}
              </Text>
              <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                <Text style={s.altLink}>
                  {mode === 'login' ? 'Create account' : 'Sign in'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={s.foot}>FACE ID · TOUCH ID SUPPORTED</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  kav: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between', paddingTop: 24, paddingBottom: 32 },

  top: { alignItems: 'center', gap: 4 },
  brand: { fontFamily: fonts.sansSemiBold, fontSize: 13, letterSpacing: 3.5, color: colors.ink },
  tagItalic: { fontFamily: fonts.serifItalic, fontSize: 14, color: colors.ink2 },

  hero: { gap: 8 },
  heroTitle: { fontFamily: fonts.serif, fontSize: 52, lineHeight: 52 * 0.98, color: colors.ink },
  heroItalic: { fontFamily: fonts.serifItalic, fontSize: 52, lineHeight: 52 * 0.98 },
  heroSub: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink2 },

  form: { gap: 2 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.ink3, marginBottom: 6 },
  input: {
    fontFamily: fonts.sans, fontSize: 16, color: colors.ink,
    borderBottomWidth: 1, borderBottomColor: colors.line2,
    paddingVertical: 10, marginBottom: 4,
  },
  cta: {
    backgroundColor: colors.ink, borderRadius: radii.pill,
    paddingVertical: 16, alignItems: 'center', marginTop: 28,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: '#fff' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 4 },
  divLine: { flex: 1, height: 1, backgroundColor: colors.line2 },
  divText: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink3 },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderColor: colors.line2, borderRadius: radii.pill,
    paddingVertical: 14, marginTop: 4,
  },
  googleG: { fontFamily: fonts.sansBold, fontSize: 16, color: '#4285F4' },
  googleText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink },

  alt: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  altText: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink2 },
  altLink: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink, textDecorationLine: 'underline' },

  foot: { textAlign: 'center', fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.ink4 },
});
