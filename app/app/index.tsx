import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { supabase } from '../src/lib/supabase';

export default function Index() {
  useEffect(() => {
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (!session) {
          router.replace('/activate');
          return;
        }
        try {
          const { data } = await supabase
            .from('profiles')
            .select('onboarding_done')
            .eq('id', session.user.id)
            .maybeSingle();
          router.replace(data?.onboarding_done ? '/(tabs)' : '/onboarding');
        } catch {
          router.replace('/activate');
        }
      })
      .catch(() => router.replace('/activate'));
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafaf7' }}>
      <ActivityIndicator color="#0d0d0f" />
    </View>
  );
}
