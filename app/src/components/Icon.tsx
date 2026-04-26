import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 20, color = '#0d0d0f', strokeWidth = 1.5 }: IconProps) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' };
  const sp = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (name) {
    case 'home':
      return <Svg {...props}><Path {...sp} d="M3 12l9-8 9 8"/><Path {...sp} d="M5 10v10h14V10"/></Svg>;
    case 'track':
      return <Svg {...props}><Circle {...sp} cx="12" cy="12" r="9"/><Circle {...sp} cx="12" cy="12" r="6"/><Circle {...sp} cx="12" cy="12" r="3"/></Svg>;
    case 'chat':
      return <Svg {...props}><Path {...sp} d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></Svg>;
    case 'you':
      return <Svg {...props}><Circle {...sp} cx="12" cy="8" r="4"/><Path {...sp} d="M4 21c0-4 4-7 8-7s8 3 8 7"/></Svg>;
    case 'plus':
      return <Svg {...props}><Path {...sp} d="M12 5v14M5 12h14"/></Svg>;
    case 'send':
      return <Svg {...props}><Path {...sp} d="M5 12l14-7-7 14-2-5-5-2z"/></Svg>;
    case 'spark':
      return <Svg {...props}><Path {...sp} d="M12 2l1.8 6.5L20 10l-6.2 1.5L12 18l-1.8-6.5L4 10l6.2-1.5z"/></Svg>;
    case 'mic':
      return <Svg {...props}><Rect {...sp} x="9" y="3" width="6" height="12" rx="3"/><Path {...sp} d="M5 11a7 7 0 0 0 14 0M12 18v3"/></Svg>;
    case 'arrow':
      return <Svg {...props}><Path {...sp} d="M5 12h14M13 6l6 6-6 6"/></Svg>;
    case 'chevron-down':
      return <Svg {...props}><Path {...sp} d="M6 9l6 6 6-6"/></Svg>;
    case 'chevron-right':
      return <Svg {...props}><Path {...sp} d="M9 6l6 6-6 6"/></Svg>;
    default:
      return null;
  }
}
