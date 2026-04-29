import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { InterTight_300Light, InterTight_400Regular, InterTight_500Medium, InterTight_600SemiBold, InterTight_700Bold } from '@expo-google-fonts/inter-tight';
import { View } from 'react-native';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'InstrumentSerif-Regular': InstrumentSerif_400Regular,
    'InstrumentSerif-Italic':  InstrumentSerif_400Regular_Italic,
    'InterTight-Light':    InterTight_300Light,
    'InterTight-Regular':  InterTight_400Regular,
    'InterTight-Medium':   InterTight_500Medium,
    'InterTight-SemiBold': InterTight_600SemiBold,
    'InterTight-Bold':     InterTight_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#fafaf7' }} />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="activate"   options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)"     options={{ animation: 'fade' }} />
        <Stack.Screen name="modal"      options={{ presentation: 'modal', headerShown: true }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
