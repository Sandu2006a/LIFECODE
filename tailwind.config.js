/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx,mdx}',
    './components/**/*.{js,jsx,ts,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'lc-black':  '#000000',
        'lc-silver': '#E5E5E5',
        'lc-dim':    '#888888',
        'lc-line':   '#1A1A1A',
        'lc-accent': '#C8C8C8',
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
    },
  },
  plugins: [],
};
