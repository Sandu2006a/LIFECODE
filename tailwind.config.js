/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,jsx,ts,tsx,mdx}',
    './components/**/*.{js,jsx,ts,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ── LIFECODE brand tokens ─────────────────────── */
        'lc-black':  '#000000',
        'lc-silver': '#E5E5E5',
        'lc-dim':    '#888888',
        'lc-line':   '#1A1A1A',
        'lc-accent': '#C8C8C8',

        /* ── shadcn/radix CSS-variable tokens ──────────── */
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        border: 'hsl(var(--border))',
        ring:   'hsl(var(--ring))',
      },
      fontFamily: {
        sans: ['var(--font-space)', 'system-ui', 'sans-serif'],
        body: ['var(--font-dm)',    'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.25em',
        widest3: '0.35em',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-in':        { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-out':       { from: { opacity: '1' }, to: { opacity: '0' } },
        'zoom-in-95':     { from: { opacity: '0', transform: 'scale(.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'zoom-out-95':    { from: { opacity: '1', transform: 'scale(1)' }, to: { opacity: '0', transform: 'scale(.95)' } },
        'slide-in-from-top-2':    { from: { transform: 'translateY(-8px)' }, to: { transform: 'translateY(0)' } },
        'slide-in-from-bottom-2': { from: { transform: 'translateY(8px)' },  to: { transform: 'translateY(0)' } },
        'slide-in-from-left-2':   { from: { transform: 'translateX(-8px)' }, to: { transform: 'translateX(0)' } },
        'slide-in-from-right-2':  { from: { transform: 'translateX(8px)' },  to: { transform: 'translateX(0)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-in-0':      'fade-in 0.15s ease-out',
        'fade-out-0':     'fade-out 0.15s ease-out',
        'zoom-in-95':     'zoom-in-95 0.15s ease-out',
        'zoom-out-95':    'zoom-out-95 0.15s ease-out',
        'slide-in-from-top-2':    'slide-in-from-top-2 0.15s ease-out',
        'slide-in-from-bottom-2': 'slide-in-from-bottom-2 0.15s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
