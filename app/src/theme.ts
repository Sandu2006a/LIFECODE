// LIFECODE Design System v2 — Apple Fitness / Whoop inspired
// Light bg, modern brand colors:
//   • Morning   = indigo  (cool, focused, pre-workout clarity)
//   • Recovery  = orange-red (warm, intense, post-workout fire)
//   • Essentials = ink (neutral, food-sourced)

export const colors = {
  // Backgrounds
  bg:    '#F7F7F5',  // warm off-white — premium feel
  bg2:   '#FFFFFF',
  paper: '#FFFFFF',
  surf:  '#FFFFFF',  // cards pop crisp on bg

  // Lines / borders (more subtle than v1)
  line:  'rgba(10,10,11,0.06)',
  line2: 'rgba(10,10,11,0.12)',

  // Ink scale (deeper, more confident black)
  ink:  '#0A0A0B',
  ink2: 'rgba(10,10,11,0.72)',
  ink3: 'rgba(10,10,11,0.48)',
  ink4: 'rgba(10,10,11,0.28)',
  ink5: 'rgba(10,10,11,0.16)',

  // Morning — INDIGO family
  morning:  '#4F46E5',  // indigo-600 (primary)
  morning2: '#312E81',  // indigo-900 (deep accent)
  morning3: '#818CF8',  // indigo-400 (light glow)

  // Recovery — ORANGE-RED family
  recovery:  '#EF4444',  // red-500 (primary)
  recovery2: '#B91C1C',  // red-700 (deep accent)
  recovery3: '#FB923C',  // orange-400 (warm glow)

  // Semantic
  danger:   '#DC2626',  // distinct from recovery — used for errors / destructive actions
  success:  '#10B981',  // emerald-500
  warning:  '#F59E0B',  // amber-500

  // Brand-light tints (used for soft card backgrounds, glow halos)
  morningTint:  'rgba(79,70,229,0.08)',
  recoveryTint: 'rgba(239,68,68,0.08)',
};

export const gradients = {
  // Vertical/horizontal brand gradients (deep → bright → light)
  morning:  ['#312E81', '#4F46E5', '#818CF8'] as string[],
  recovery: ['#B91C1C', '#EF4444', '#FB923C'] as string[],

  // Combined brand sweep — used for avatars, logo elements, anything brand-mixed
  neutral:  ['#4F46E5', '#7C3AED', '#EF4444'] as string[],
  brand:    ['#4F46E5', '#EF4444'] as string[],  // 2-stop avatar gradient

  // Utility
  hydration: ['#818CF8', '#A5B4FC'] as string[],
  ink:       ['#0A0A0B', '#0A0A0B'] as string[],
};

export const spacing = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  '2xl': 18,
  '3xl': 22,
  '4xl': 28,
  '5xl': 36,
};

export const radii = {
  card: 24,    // slightly more generous than v1
  pill: 999,
  xs: 4,
  sm: 8,
  md: 14,
  lg: 18,
};

// All Inter Tight — clean, minimal, geometric. SF Pro–adjacent feel.
// 'serif' / 'serifItalic' kept as legacy aliases (now mapped to bold weights)
// so we don't need to touch every component style.
export const fonts = {
  // Hero / display (huge numbers, big headlines) — heavy weight, very tight tracking
  display:      'InterTight-ExtraBold',  // 800
  displayBlack: 'InterTight-Black',      // 900

  // Legacy display aliases — modern clean weights (no more curly italic serif)
  serif:        'InterTight-Medium',    // 500 — refined body-display weight
  serifItalic:  'InterTight-SemiBold',  // 600 — thinner premium feel (was 700 Bold)

  // UI body
  sans:         'InterTight-Regular',
  sansLight:    'InterTight-Light',
  sansMedium:   'InterTight-Medium',
  sansSemiBold: 'InterTight-SemiBold',
  sansBold:     'InterTight-Bold',
};

// Apple-Fitness-style letter-spacing for tight display text.
// Apply as `letterSpacing: tracking.display` to large numbers.
export const tracking = {
  display:    -1.5,  // huge hero numbers (50px+)
  displayMd:  -0.8,  // section headlines (30-50px)
  displaySm:  -0.3,  // medium emphasis (16-22px)
  body:        0,
  label:       1.8,  // small caps labels
  labelTight:  1.4,
};

export const shadows = {
  // Softer, more diffused — gives "floating" feel without heavy edge
  card: {
    shadowColor: '#0A0A0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  cardHover: {
    shadowColor: '#0A0A0B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 4,
  },
  tabBar: {
    shadowColor: '#0A0A0B',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.10,
    shadowRadius: 36,
    elevation: 10,
  },
};
