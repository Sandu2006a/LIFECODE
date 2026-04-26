import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface RingProps {
  size?: number;
  stroke?: number;
  pct?: number;
  gradient?: string[];
  color?: string;
  id?: string;
}

export default function Ring({ size = 220, stroke = 8, pct = 60, gradient, color = '#0d0d0f', id = 'ring' }: RingProps) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;

  const animPct = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animPct, {
      toValue: pct,
      duration: 1400,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const dash = animPct.interpolate({
    inputRange: [0, 100],
    outputRange: [0, C],
  });

  const gid = `${id}-grad`;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gradient && (
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            {gradient.map((g, j) => (
              <Stop key={j} offset={`${(j / (gradient.length - 1)) * 100}%`} stopColor={g} />
            ))}
          </LinearGradient>
        </Defs>
      )}
      <Circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="rgba(13,13,15,0.08)"
        strokeWidth={stroke}
      />
      <Circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={gradient ? `url(#${gid})` : color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * C} ${C}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </Svg>
  );
}
