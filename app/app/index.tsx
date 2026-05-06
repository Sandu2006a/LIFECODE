import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { getCachedTokens } from '../src/lib/auth-cache';

export default function Index() {
  useEffect(() => {
    (async () => {
      try {
        let { data: { session } } = await supabase.auth.getSession();
        // Fall back to cached tokens (other-device sign-in or AsyncStorage hiccup)
        if (!session) {
          const tokens = getCachedTokens();
          if (tokens) {
            const { data } = await supabase.auth.setSession(tokens);
            session = data?.session ?? null;
          }
        }
        if (!session) {
          router.replace('/activate');
          return;
        }
        // Profile filled = skip onboarding. We treat the profile as ready when
        // either onboarding_done is true OR all three core fields exist
        // (age + weight + height). This handles older profiles that never got
        // the onboarding_done flag flipped.
        const { data } = await supabase
          .from('profiles')
          .select('onboarding_done, age, weight_kg, height_cm')
          .eq('id', session.user.id)
          .maybeSingle();

        const filled = !!(data?.onboarding_done ||
          (data?.age && data?.weight_kg && data?.height_cm));
        router.replace(filled ? '/(tabs)' : '/onboarding');
      } catch {
        router.replace('/activate');
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafaf7' }}>
      <ActivityIndicator color="#0d0d0f" />
    </View>
  );
}
