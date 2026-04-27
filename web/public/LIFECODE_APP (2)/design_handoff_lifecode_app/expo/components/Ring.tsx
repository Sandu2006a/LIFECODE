import React, { useEffect } from 'react';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { colors } from '../theme';

const ACircle = Animated.createAnimatedComponent(Circle);

type Kind = 'morning' | 'recovery' | 'neutral';

export default function Ring({ size = 220, stroke = 8, pct, kind = 'neutral' }: { size?: number; stroke?: number; pct: number; kind?: Kind }) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const dash = useSharedValue(C);
  useEffect(() => {
    dash.value = withTiming(C - (pct / 100) * C, { duration: 1400, easing: Easing.bezier(0.2, 0.8, 0.2, 1) });
  }, [pct]);
  const animProps = useAnimatedProps(() => ({ strokeDashoffset: dash.value }));

  const grad = kind === 'morning' ? colors.morningGrad : kind === 'recovery' ? colors.recoveryGrad : colors.neutralGrad;
  const id = `g-${kind}`;

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          {grad.map((c, i) => <Stop key={i} offset={`${(i / (grad.length - 1)) * 100}%`} stopColor={c} />)}
        </LinearGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.line} strokeWidth={stroke} fill="none" />
      <ACircle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={`url(#${id})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${C} ${C}`}
        animatedProps={animProps}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}
