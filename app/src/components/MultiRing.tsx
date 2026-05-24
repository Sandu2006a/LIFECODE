import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface RingItem {
  label?: string;
  pct: number;
  gradient?: string[];
  color?: string;
}

interface MultiRingProps {
  size?: number;
  items?: RingItem[];
  stroke?: number;
  gap?: number;
}

export default function MultiRing({ size = 240, items = [], stroke = 16, gap = 6 }: MultiRingProps) {
  const cx = size / 2;
  const cy = size / 2;
  const n = Math.max(items.length, 1);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        {items.map((it, i) =>
          it.gradient ? (
            <LinearGradient key={i} id={`mring-${size}-${i}`} x1="0" y1="0" x2="1" y2="1">
              {it.gradient.map((g, j) => (
                <Stop key={j} offset={`${(j / (it.gradient!.length - 1)) * 100}%`} stopColor={g} />
              ))}
            </LinearGradient>
          ) : null
        )}
      </Defs>
      {items.map((it, i) => {
        const r = size / 2 - stroke / 2 - i * (stroke + gap);
        if (r <= 0) return null;
        const C = 2 * Math.PI * r;
        const dash = (Math.max(0, Math.min(100, it.pct)) / 100) * C;
        return (
          <React.Fragment key={i}>
            <Circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke="rgba(13,13,15,0.06)"
              strokeWidth={stroke}
            />
            <Circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={it.gradient ? `url(#mring-${size}-${i})` : (it.color ?? '#0d0d0f')}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${C}`}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}
