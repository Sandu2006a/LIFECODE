import { Barlow_Condensed, Inter } from 'next/font/google';
import './globals.css';
import CookieBanner from '@/components/legal/CookieBanner';

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm',
  display: 'swap',
});

export const metadata = {
  title: 'LIFECODE — Precision Nutrition',
  description:
    'Ultra-premium sports nutrition engineered at the molecular level. Morning Mix, Training Gel, Recovery Salts.',
  icons: {
    icon: [
      { url: '/logo.png', sizes: '512x512', type: 'image/png' },
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: { url: '/logo.png', sizes: '180x180' },
    shortcut: '/logo.png',
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
    <html lang="en" className={`${barlowCondensed.variable} ${inter.variable}`}>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-GCG0P5WJVP" />
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-GCG0P5WJVP');
        `}} />
      </head>
      <body className="bg-lc-white text-lc-maroon font-body antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
