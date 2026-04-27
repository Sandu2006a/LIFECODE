import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

export default function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={s.t}>{children}</Text>;
}
const s = StyleSheet.create({
  t: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '500', letterSpacing: 1, textTransform: 'uppercase', color: colors.ink3 },
});
