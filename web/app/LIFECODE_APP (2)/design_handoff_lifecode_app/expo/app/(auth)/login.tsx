import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { colors, fonts } from '../../theme';
import GradientText from '../../components/GradientText';

export default function Login() {
  const [email, setEmail] = useState('mark@lifecode.app');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) Alert.alert('Sign in failed', error.message);
  };
  const signUp = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email, password: pw });
    setBusy(false);
    if (error) Alert.alert('Sign up failed', error.message);
    else Alert.alert('Check your email', 'Confirm your address to continue.');
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={s.top}>
          <Text style={s.brand}>LIFECODE</Text>
          <Text style={s.tag}>Code your life.</Text>
        </View>

        <View style={s.hero}>
          <Text style={s.h1}>Welcome</Text>
          <GradientText style={[s.h1, { fontFamily: fonts.serifItalic }]}>back.</GradientText>
          <Text style={s.sub}>Sign in to continue your protocol.</Text>
        </View>

        <View style={s.form}>
          <Text style={s.lbl}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={s.input} placeholderTextColor={colors.ink4} />
          <Text style={[s.lbl, { marginTop: 14 }]}>Password</Text>
          <TextInput value={pw} onChangeText={setPw} secureTextEntry style={s.input} placeholder="••••••••" placeholderTextColor={colors.ink4} />

          <Pressable disabled={busy} onPress={signIn} style={({ pressed }) => [s.cta, pressed && { opacity: 0.85 }]}>
            <Text style={s.ctaText}>{busy ? 'Signing in…' : 'Sign in →'}</Text>
          </Pressable>

          <View style={s.alt}>
            <Text style={s.altMuted}>New here?</Text>
            <Pressable onPress={signUp}><Text style={s.altLink}>Create account</Text></Pressable>
          </View>
        </View>

        <Text style={s.foot}>Face ID · Touch ID supported</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 28 },
  top: { alignItems: 'center', marginTop: 20 },
  brand: { fontFamily: fonts.sans, fontWeight: '600', fontSize: 13, letterSpacing: 3.5, color: colors.ink },
  tag: { marginTop: 6, fontFamily: fonts.serifItalic, fontSize: 18, color: colors.ink2 },
  hero: { marginTop: 56 },
  h1: { fontFamily: fonts.serif, fontSize: 56, lineHeight: 56, letterSpacing: -1.1, color: colors.ink },
  sub: { marginTop: 14, fontFamily: fonts.sans, fontSize: 15, color: colors.ink2, maxWidth: 260 },
  form: { marginTop: 'auto' },
  lbl: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '500', letterSpacing: 0.7, textTransform: 'uppercase', color: colors.ink3, marginBottom: 6 },
  input: { fontFamily: fonts.sans, fontSize: 16, color: colors.ink, borderBottomWidth: 1, borderBottomColor: colors.line2, paddingVertical: 10 },
  cta: { marginTop: 28, backgroundColor: colors.ink, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  ctaText: { color: '#fff', fontFamily: fonts.sans, fontWeight: '500', fontSize: 15 },
  alt: { marginTop: 18, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  altMuted: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink3 },
  altLink: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink, textDecorationLine: 'underline' },
  foot: { marginTop: 18, textAlign: 'center', fontFamily: fonts.sans, fontSize: 11, letterSpacing: 0.9, textTransform: 'uppercase', color: colors.ink4 },
});
