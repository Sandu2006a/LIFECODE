import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
  Animated, Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { colors, fonts, radii, gradients } from '../src/theme';

const CODE_LENGTH = 5;

export default function ActivateScreen() {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [welcomed, setWelcomed] = useState(false);
  const [userName, setUserName] = useState('');

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // Load the user's name for the welcome message
    supabase.auth.getUser().then(({ data: { user } }) => {
      const name = user?.user_metadata?.display_name
        || user?.user_metadata?.full_name
        || user?.email?.split('@')[0]
        || 'Athlete';
      setUserName(name.split(' ')[0]);
    });
  }, []);

  const handleDigit = (val: string, idx: number) => {
    const ch = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(-1);
    const next = [...digits];
    next[idx] = ch;
    setDigits(next);
    setError('');

    if (ch && idx < CODE_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }

    if (ch && idx === CODE_LENGTH - 1) {
      const code = [...next.slice(0, CODE_LENGTH - 1), ch].join('');
      if (code.length === CODE_LENGTH) verify(code);
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const verify = async (code?: string) => {
    const enteredCode = (code ?? digits.join('')).toUpperCase();
    if (enteredCode.length < CODE_LENGTH) {
      setError('Please enter all 5 characters.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Session expired. Please log in again.'); setLoading(false); return; }

      // Check code in activation_codes table
      const { data: codeRow, error: queryErr } = await supabase
        .from('activation_codes')
        .select('id, used')
        .eq('code', enteredCode)
        .eq('used', false)
        .maybeSingle();

      if (queryErr || !codeRow) {
        setError('Invalid or already used code. Check your email and try again.');
        setLoading(false);
        return;
      }

      // Mark as used and link to this user
      await supabase
        .from('activation_codes')
        .update({ used: true, user_id: user.id })
        .eq('id', codeRow.id);

      setLoading(false);
      showWelcome();
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  };

  const showWelcome = () => {
    setWelcomed(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => router.replace('/onboarding'), 2200);
    });
  };

  if (welcomed) {
    return (
      <SafeAreaView style={s.safe}>
        <LinearGradient colors={['#fafaf7', '#fff3ec', '#fafaf7']} style={s.welcomeBg}>
          <Animated.View style={[s.welcomeBox, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <Text style={s.welcomeEyebrow}>LIFECODE</Text>
            <Text style={s.welcomeTitle}>Welcome,{'\n'}
              <Text style={s.welcomeName}>{userName}.</Text>
            </Text>
            <Text style={s.welcomeSub}>Your protocol is activated.{'\n'}Let's build your profile.</Text>
            <View style={s.welcomeDot}>
              <ActivityIndicator color={colors.morning} size="small" />
            </View>
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        <View style={s.top}>
          <Text style={s.brand}>LIFECODE</Text>
        </View>

        <View style={s.hero}>
          <Text style={s.title}>Enter your{'\n'}activation code.</Text>
          <Text style={s.sub}>Check the email you used to register.{'\n'}The code is 5 characters long.</Text>
        </View>

        {/* Code boxes */}
        <View style={s.codeRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={r => { inputRefs.current[i] = r; }}
              style={[s.box, d ? s.boxFilled : null, error ? s.boxError : null]}
              value={d}
              onChangeText={v => handleDigit(v, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              maxLength={1}
              autoCapitalize="characters"
              autoCorrect={false}
              keyboardType="default"
              returnKeyType="done"
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[s.cta, (loading || digits.join('').length < CODE_LENGTH) && s.ctaDim]}
          onPress={() => verify()}
          disabled={loading || digits.join('').length < CODE_LENGTH}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : (
              <LinearGradient
                colors={gradients.morning as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.ctaGrad}
              >
                <Text style={s.ctaText}>Activate →</Text>
              </LinearGradient>
            )
          }
        </TouchableOpacity>

        <Text style={s.hint}>
          No email?{' '}
          <Text style={s.hintLink} onPress={async () => {
            await supabase.auth.signOut();
            router.replace('/login');
          }}>Sign out and try again</Text>
        </Text>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-around', paddingTop: 24, paddingBottom: 48 },

  top: { alignItems: 'center' },
  brand: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 3.5, color: colors.ink3, textTransform: 'uppercase' },

  hero: { gap: 12 },
  title: { fontFamily: fonts.serif, fontSize: 44, color: colors.ink, lineHeight: 48 },
  sub: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink2, lineHeight: 23 },

  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  box: {
    width: 54, height: 68,
    borderRadius: 16,
    borderWidth: 1.5, borderColor: colors.line2,
    backgroundColor: '#fff',
    textAlign: 'center',
    fontFamily: fonts.sansBold, fontSize: 26, color: colors.ink,
  },
  boxFilled: { borderColor: colors.morning, backgroundColor: '#fff9f5' },
  boxError: { borderColor: '#e55', backgroundColor: '#fff5f5' },

  error: { fontFamily: fonts.sans, fontSize: 14, color: '#e55', textAlign: 'center', marginTop: -8 },

  cta: { borderRadius: radii.pill, overflow: 'hidden' },
  ctaDim: { opacity: 0.4 },
  ctaGrad: { paddingVertical: 18, alignItems: 'center' },
  ctaText: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: '#fff' },

  hint: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink3, textAlign: 'center' },
  hintLink: { color: colors.ink2, textDecorationLine: 'underline' },

  // Welcome screen
  welcomeBg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  welcomeBox: { alignItems: 'center', paddingHorizontal: 40, gap: 18 },
  welcomeEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 3.5, color: colors.ink3, textTransform: 'uppercase' },
  welcomeTitle: { fontFamily: fonts.serif, fontSize: 56, color: colors.ink, textAlign: 'center', lineHeight: 60 },
  welcomeName: { fontFamily: fonts.serifItalic, fontSize: 56, color: colors.morning, lineHeight: 60 },
  welcomeSub: { fontFamily: fonts.sans, fontSize: 16, color: colors.ink2, textAlign: 'center', lineHeight: 26 },
  welcomeDot: { marginTop: 16 },
});
