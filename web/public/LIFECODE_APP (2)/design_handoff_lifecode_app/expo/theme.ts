// LIFECODE design tokens — keep in sync with web prototype app.css
export const colors = {
  bg: '#fafaf7',
  bg2: '#ffffff',
  paper: '#fdfdfa',
  surf: '#ffffff',
  line: 'rgba(20,20,20,0.08)',
  line2: 'rgba(20,20,20,0.14)',
  ink: '#0d0d0f',
  ink2: 'rgba(13,13,15,0.70)',
  ink3: 'rgba(13,13,15,0.45)',
  ink4: 'rgba(13,13,15,0.28)',

  morning: '#e26a1f',
  morning2: '#c43d1f',
  morning3: '#f5a623',
  morningGrad: ['#c43d1f', '#e26a1f', '#f5a623'] as const,

  recovery: '#4a3aa8',
  recovery2: '#2a2a8e',
  recovery3: '#7a8fd9',
  recoveryGrad: ['#2a2a8e', '#4a3aa8', '#7a8fd9'] as const,

  neutralGrad: ['#c43d1f', '#e26a1f', '#4a3aa8', '#7a8fd9'] as const,
};

export const fonts = {
  serif: 'InstrumentSerif',
  serifItalic: 'InstrumentSerif-Italic',
  sans: 'InterTight',
};

export const radii = { card: 22, pill: 999, sm: 12 };
export const spacing = { 1: 4, 2: 6, 3: 8, 4: 10, 5: 14, 6: 18, 7: 22, 8: 28 };
