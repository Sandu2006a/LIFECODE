import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  InterTight_300Light,
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
  InterTight_700Bold,
  InterTight_800ExtraBold,
  InterTight_900Black,
} from '@expo-google-fonts/inter-tight';
import { View } from 'react-native';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'InterTight-Light':       InterTight_300Light,
    'InterTight-Regular':     InterTight_400Regular,
    'InterTight-Medium':      InterTight_500Medium,
    'InterTight-SemiBold':    InterTight_600SemiBold,
    'InterTight-Bold':        InterTight_700Bold,
    'InterTight-ExtraBold':   InterTight_800ExtraBold,
    'InterTight-Black':       InterTight_900Black,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#F7F7F5' }} />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="activate"   options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)"     options={{ animation: 'fade' }} />
        <Stack.Screen name="profile"    options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="details"    options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="week"       options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="modal"      options={{ presentation: 'modal', headerShown: true }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
