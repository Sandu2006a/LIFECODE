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

const SITE = 'https://lifecodenutrition.com';

export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'LIFECODE — Precision Nutrition for Athletes',
    template: '%s · LIFECODE Nutrition',
  },
  description:
    'LIFECODE is precision sports nutrition built by athletes for athletes. Daily Morning Essentials, Daily After Training Repair and AI-tracked micronutrients calibrated to your sport, weight and training load. Engineered at the molecular level.',
  keywords: [
    'LIFECODE',
    'LIFECODE Nutrition',
    'lifecodenutrition',
    'precision nutrition',
    'sports nutrition',
    'athlete supplements',
    'Daily Morning Essentials',
    'Daily After Training Repair',
    'micronutrient tracking',
    'training nutrition',
    'AI nutrition',
    'EAA',
    'creatine',
    'magnesium',
    'vitamin D3',
  ],
  authors: [{ name: 'LIFECODE' }],
  creator: 'LIFECODE',
  publisher: 'LIFECODE',
  category: 'Health',
  applicationName: 'LIFECODE',
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
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
    title: 'LIFECODE — Precision Nutrition for Athletes',
    description:
      'Sports nutrition engineered at the molecular level. Daily Morning Essentials + Daily After Training Repair + AI tracking.',
    type: 'website',
    url: SITE,
    siteName: 'LIFECODE Nutrition',
    locale: 'en_US',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'LIFECODE Nutrition',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LIFECODE — Precision Nutrition',
    description: 'Sports nutrition engineered at the molecular level.',
    images: ['/logo.png'],
  },
  verification: {
    // Add Google Search Console verification token here once you have it.
    // google: 'paste-token-from-search-console-here',
  },
};

const ORG_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE}/#organization`,
  name: 'LIFECODE Nutrition',
  alternateName: ['LIFECODE', 'LifeCode Nutrition'],
  url: SITE,
  logo: `${SITE}/logo.png`,
  description:
    'LIFECODE is precision sports nutrition: Daily Morning Essentials, Daily After Training Repair and AI-tracked micronutrients calibrated to your sport, weight and training load.',
  sameAs: [],
  founders: [{ '@type': 'Person', name: 'LIFECODE Founders' }],
};

const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  url: SITE,
  name: 'LIFECODE Nutrition',
  description: 'Precision sports nutrition for athletes.',
  publisher: { '@id': `${SITE}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
        />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
