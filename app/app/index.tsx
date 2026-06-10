import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/lib/supabase';
import { getCachedTokens } from '../src/lib/auth-cache';

// Auth gate.
//  • Valid session → /(tabs).  We never re-ask for onboarding data once the user
//    has a session — they signed in, that's enough.
//  • No session    → /login (email + password; /activate still reachable from there).
export default function Index() {
  useEffect(() => {
    (async () => {
      try {
        let { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const tokens = getCachedTokens();
          if (tokens) {
            const { data } = await supabase.auth.setSession(tokens);
            session = data?.session ?? null;
          }
        }
        if (!session) {
          router.replace('/login');
          return;
        }
        // Session exists → trust the user. Mark device as known and route in.
        try {
          await AsyncStorage.setItem('lifecode.activated_once', '1');
          await AsyncStorage.setItem('lifecode.onboarding_done', '1');
          await AsyncStorage.setItem('lifecode.last_uid', session.user.id);
        } catch {}
        router.replace('/(tabs)');
      } catch {
        router.replace('/login');
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F7F5' }}>
      <ActivityIndicator color="#0A0A0B" />
    </View>
  );
}
