import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { colors, fonts, radii } from '../theme';

const GRAD: [string, string, string, string] = ['#FF8A00', '#C62828', '#7C3AED', '#1D4ED8'];

type Props = { status?: string };

export default function LockedScreen({ status }: Props) {
  const isPastDue = status === 'past_due';

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        {/* Brand */}
        <Text style={s.brand}>LIFECODE</Text>

        {/* Lock icon */}
        <View style={s.lockWrap}>
          <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.lockCircle}>
            <Text style={s.lockIcon}>{isPastDue ? '⚠' : '◎'}</Text>
          </LinearGradient>
        </View>

        {/* Copy */}
        <Text style={s.headline}>
          {isPastDue ? 'Payment issue.' : 'Activate your\nProtocol.'}
        </Text>
        <Text style={s.sub}>
          {isPastDue
            ? 'There was a problem with your payment. Update your billing details to keep your Protocol active.'
            : 'Access to the LIFECODE app is reserved for active Protocol members. Already subscribed? Log in with the same email you used at checkout.'}
        </Text>

        {/* Buttons */}
        <View style={s.btns}>
          {isPastDue ? (
            <TouchableOpacity
              style={s.ghostBtn}
              onPress={() => Linking.openURL('https://web-zeta-lyart-53.vercel.app/pricing')}
            >
              <Text style={s.ghostText}>Update billing</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.ghostBtn} onPress={() => router.replace('/login')}>
              <Text style={s.ghostText}>Already a member? Log in</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={async () => {
              await supabase.auth.signOut();
              router.replace('/login');
            }}
          >
            <Text style={s.signOut}>Log in with another email</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.foot}>LIFECODE · Protocol Members Only</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1, paddingHorizontal: 28, paddingTop: 32, paddingBottom: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  brand: {
    fontFamily: fonts.sans, fontSize: 11, letterSpacing: 3.5,
    color: colors.ink3, textTransform: 'uppercase', marginBottom: 48,
  },
  lockWrap: { marginBottom: 32 },
  lockCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  lockIcon: { fontSize: 32, color: '#fff' },
  headline: {
    fontFamily: fonts.serif, fontSize: 38, color: colors.ink,
    lineHeight: 42, letterSpacing: -0.8, textAlign: 'center', marginBottom: 16,
  },
  sub: {
    fontFamily: fonts.sans, fontSize: 14, color: colors.ink2,
    lineHeight: 22, textAlign: 'center', maxWidth: 300, marginBottom: 44,
  },
  btns: { width: '100%', gap: 14 },
  ghostBtn: {
    borderWidth: 1, borderColor: colors.line2, borderRadius: radii.pill,
    paddingVertical: 16, alignItems: 'center',
  },
  ghostText: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  signOut: {
    fontFamily: fonts.sans, fontSize: 14, color: colors.ink3,
    textAlign: 'center', textDecorationLine: 'underline', paddingVertical: 8,
  },
  foot: {
    position: 'absolute', bottom: 32,
    fontFamily: fonts.sans, fontSize: 10, letterSpacing: 1.5,
    color: colors.ink4, textTransform: 'uppercase',
  },
});
