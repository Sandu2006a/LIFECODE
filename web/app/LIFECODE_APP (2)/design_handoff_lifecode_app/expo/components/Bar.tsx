import React, { useEffect } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { colors } from '../theme';

type Kind = 'morning' | 'recovery' | 'neutral';

export default function Bar({ pct, kind = 'neutral' }: { pct: number; kind?: Kind }) {
  const w = useSharedValue(0);
  useEffect(() => { w.value = withTiming(pct, { duration: 700, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }); }, [pct]);
  const style = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  const grad = kind === 'morning' ? colors.morningGrad : kind === 'recovery' ? colors.recoveryGrad : colors.neutralGrad;
  return (
    <View style={{ height: 4, backgroundColor: colors.line, borderRadius: 999, overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%' }, style]}>
        <LinearGradient colors={grad as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}
