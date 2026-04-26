import React from 'react';
import { Text, TextStyle } from 'react-native';

interface GradientTextProps {
  colors: string[];
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

// Simplified version without MaskedView for Expo Go compatibility
// Uses the first color from the gradient as the text color
export default function GradientText({ colors, style, children }: GradientTextProps) {
  return (
    <Text style={[style, { color: colors[0] }]}>{children}</Text>
  );
}
