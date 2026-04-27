import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

type Kind = 'morning' | 'recovery' | 'neutral';

export default function GradientText({ children, style, kind = 'neutral' }: { children: React.ReactNode; style?: StyleProp<TextStyle>; kind?: Kind }) {
  const grad = kind === 'morning' ? colors.morningGrad : kind === 'recovery' ? colors.recoveryGrad : colors.neutralGrad;
  return (
    <MaskedView maskElement={<Text style={style}>{children}</Text>}>
      <LinearGradient colors={grad as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}
