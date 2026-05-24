import React from 'react';
import Svg, { Path, Circle, Rect, Polygon } from 'react-native-svg';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 20, color = '#0d0d0f', strokeWidth = 1.8 }: IconProps) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' };
  const sp = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (name) {
    case 'home':
      return <Svg {...props}><Path {...sp} d="M3 12l9-8 9 8"/><Path {...sp} d="M5 10v10h14V10"/></Svg>;
    case 'users':
      return <Svg {...props}><Circle {...sp} cx="9" cy="8" r="3.5"/><Path {...sp} d="M3 21c0-3 3-5.5 6-5.5s6 2.5 6 5.5"/><Circle {...sp} cx="17" cy="9" r="2.5"/><Path {...sp} d="M14.5 21c0-2 1.5-4 3.5-4s3.5 2 3.5 4"/></Svg>;
    case 'chat':
      return <Svg {...props}><Path {...sp} d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></Svg>;
    case 'you':
    case 'user':
      return <Svg {...props}><Circle {...sp} cx="12" cy="8" r="4"/><Path {...sp} d="M4 21c0-4 4-7 8-7s8 3 8 7"/></Svg>;
    case 'track':
      return <Svg {...props}><Circle {...sp} cx="12" cy="12" r="9"/><Circle {...sp} cx="12" cy="12" r="6"/><Circle {...sp} cx="12" cy="12" r="3"/></Svg>;
    case 'plus':
      return <Svg {...props}><Path {...sp} d="M12 5v14M5 12h14"/></Svg>;
    case 'minus':
      return <Svg {...props}><Path {...sp} d="M5 12h14"/></Svg>;
    case 'send':
      return <Svg {...props}><Path {...sp} d="M5 12l14-7-7 14-2-5-5-2z"/></Svg>;
    case 'spark':
    case 'sparkle':
      return <Svg {...props}><Path {...sp} d="M12 2l1.8 6.5L20 10l-6.2 1.5L12 18l-1.8-6.5L4 10l6.2-1.5z"/></Svg>;
    case 'mic':
      return <Svg {...props}><Rect {...sp} x="9" y="3" width="6" height="12" rx="3"/><Path {...sp} d="M5 11a7 7 0 0 0 14 0M12 18v3"/></Svg>;
    case 'arrow':
      return <Svg {...props}><Path {...sp} d="M5 12h14M13 6l6 6-6 6"/></Svg>;
    case 'arrow-up':
      return <Svg {...props}><Path {...sp} d="M12 19V5M5 12l7-7 7 7"/></Svg>;
    case 'chevron':
    case 'chevron-right':
      return <Svg {...props}><Path {...sp} d="M9 6l6 6-6 6"/></Svg>;
    case 'chevron-down':
      return <Svg {...props}><Path {...sp} d="M6 9l6 6 6-6"/></Svg>;
    case 'calendar':
      return <Svg {...props}><Rect {...sp} x="3" y="4" width="18" height="18" rx="3"/><Path {...sp} d="M16 2v4M8 2v4M3 10h18"/></Svg>;
    case 'dumbbell':
      return <Svg {...props}><Path {...sp} d="M6 4h2v16H6zM16 4h2v16h-2zM8 8h8M8 16h8M2 8h4M18 8h4M2 16h4M18 16h4"/></Svg>;
    case 'clock':
      return <Svg {...props}><Circle {...sp} cx="12" cy="12" r="9"/><Path {...sp} d="M12 7v5l3 3"/></Svg>;
    case 'pill':
      return <Svg {...props}><Path {...sp} d="M9 3h6a6 6 0 0 1 0 12H9A6 6 0 0 1 9 3z"/><Path {...sp} d="M12 3v12"/></Svg>;
    case 'check':
      return <Svg {...props}><Path {...sp} d="M5 12l5 5L19 7"/></Svg>;
    case 'trash':
      return <Svg {...props}><Path {...sp} d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></Svg>;
    case 'x':
    case 'close':
      return <Svg {...props}><Path {...sp} d="M6 6l12 12M18 6L6 18"/></Svg>;
    case 'camera':
      return <Svg {...props}><Path {...sp} d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><Circle {...sp} cx="12" cy="13" r="4"/></Svg>;
    case 'flash':
      return <Svg {...props}><Polygon stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" points="13 2 4 14 10 14 11 22 20 10 14 10 13 2"/></Svg>;
    case 'flame':
      return <Svg {...props}><Path {...sp} d="M12 22c4 0 7-3 7-7 0-3-2-5-3-8-1 2-3 3-3 5 0-2-1-3-2-4-1 2-3 3-3 7 0 4 3 7 4 7z"/></Svg>;
    case 'moon':
      return <Svg {...props}><Path {...sp} d="M20 14a8 8 0 0 1-10-10 8 8 0 1 0 10 10z"/></Svg>;
    case 'bell':
      return <Svg {...props}><Path {...sp} d="M6 9a6 6 0 0 1 12 0c0 6 3 7 3 7H3s3-1 3-7M10 20a2 2 0 0 0 4 0"/></Svg>;
    case 'shield':
      return <Svg {...props}><Path {...sp} d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z"/></Svg>;
    case 'heart':
      return <Svg {...props}><Path {...sp} d="M12 20s-7-4-9-9c-1-3 1-6 4-6 2 0 4 1 5 3 1-2 3-3 5-3 3 0 5 3 4 6-2 5-9 9-9 9z"/></Svg>;
    case 'pencil':
      return <Svg {...props}><Path {...sp} d="M3 21l4-1 11-11-3-3L4 17l-1 4zM14 6l3 3"/></Svg>;
    default:
      return null;
  }
}
