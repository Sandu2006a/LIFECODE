import { Space_Grotesk, DM_Sans } from 'next/font/google';
import './globals.css';
import CookieBanner from '@/components/legal/CookieBanner';

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
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'LIFECODE — Precision Nutrition',
    description: 'We are what we eat.',
    type: 'website',
    images: ['/logo.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmSans.variable}`}>
      <body className="bg-lc-white text-lc-maroon font-body antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
