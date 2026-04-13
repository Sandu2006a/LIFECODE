import { Space_Grotesk, DM_Sans } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm',
  display: 'swap',
});

export const metadata = {
  title: 'LIFECODE — Precision Nutrition',
  description:
    'Ultra-premium sports nutrition engineered at the molecular level. Morning Mix, Training Gel, Recovery Salts.',
  openGraph: {
    title: 'LIFECODE — Precision Nutrition',
    description: 'We are what we eat.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmSans.variable}`}>
      <body className="bg-lc-black text-lc-silver font-body antialiased">
        {children}
      </body>
    </html>
  );
}
