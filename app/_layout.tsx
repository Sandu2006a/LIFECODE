import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import {
  InterTight_300Light,
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
  InterTight_700Bold,
} from '@expo-google-fonts/inter-tight';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';

type Status = 'loading' | 'login' | 'activate' | 'onboarding' | 'home';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'InstrumentSerif-Regular': InstrumentSerif_400Regular,
    'InstrumentSerif-Italic': InstrumentSerif_400Regular_Italic,
    'InterTight-Light': InterTight_300Light,
    'InterTight-Regular': InterTight_400Regular,
    'InterTight-Medium': InterTight_500Medium,
    'InterTight-SemiBold': InterTight_600SemiBold,
    'InterTight-Bold': InterTight_700Bold,
  });

  const [status, setStatus] = useState<Status>('loading');

  const resolve = async (userId: string | null) => {
    if (!userId) { setStatus('login'); return; }

    try {
      const [{ data: codeRow }, { data: profile }] = await Promise.all([
        supabase.from('activation_codes').select('id').eq('user_id', userId).eq('used', true).maybeSingle(),
        supabase.from('profiles').select('onboarding_done').eq('id', userId).maybeSingle(),
      ]);

      if (!codeRow) { setStatus('activate'); return; }
      if (!profile?.onboarding_done) { setStatus('onboarding'); return; }
      setStatus('home');
    } catch {
      setStatus('activate');
    }
  };

  useEffect(() => {
    if (!fontsLoaded) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      resolve(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      resolve(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, [fontsLoaded]);

  // Navigate when status changes, but only after stack is mounted
  useEffect(() => {
    if (status === 'loading') return;
    const routes: Record<Exclude<Status, 'loading'>, string> = {
      login: '/login',
      activate: '/activate',
      onboarding: '/onboarding',
      home: '/(tabs)',
    };
    router.replace(routes[status] as any);
  }, [status]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafaf7' }}>
        <ActivityIndicator color="#0d0d0f" />
      </View>
    );
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="activate" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
