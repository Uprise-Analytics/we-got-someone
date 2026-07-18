import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

const BASE_URL = 'https://www.wegotsomeone.co.za'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'We Got Someone | Find Trusted Local Workers in South Africa',
    template: '%s | We Got Someone',
  },
  description: 'Need a painter, cleaner, gardener or plumber? Find trusted local workers near you in South Africa. Direct contact, no agency fees. From R99/month.',
  keywords: ['local workers', 'painters', 'cleaners', 'gardeners', 'plumbers', 'handyman', 'South Africa', 'domestic workers', 'electricians', 'day workers'],
  authors: [{ name: 'We Got Someone', url: BASE_URL }],
  creator: 'We Got Someone',
  publisher: 'We Got Someone',
  category: 'business',

  // Canonical
  alternates: {
    canonical: BASE_URL,
  },

  // Open Graph – shows when shared on WhatsApp, Facebook, LinkedIn etc
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: BASE_URL,
    siteName: 'We Got Someone',
    title: 'We Got Someone | Find Trusted Local Workers in South Africa',
    description: 'Find trusted painters, cleaners, gardeners, plumbers and more near you. Direct contact, no agency fees.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'We Got Someone – Find Trusted Local Workers in South Africa',
      },
    ],
  },

  // Twitter / X card
  twitter: {
    card: 'summary_large_image',
    title: 'We Got Someone | Find Trusted Local Workers in South Africa',
    description: 'Find trusted painters, cleaners, gardeners, plumbers and more near you. Direct contact, no agency fees.',
    images: ['/og-image.png'],
  },

  // Icons
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'manifest', url: '/site.webmanifest' },
    ],
  },

  // PWA / browser chrome
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0D1B2A' },
    { media: '(prefers-color-scheme: light)', color: '#16a34a' },
  ],
  colorScheme: 'light dark',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

// JSON-LD structured data — helps Google show rich results
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'We Got Someone',
  description: 'South African labour marketplace connecting homeowners with trusted local workers. Find painters, cleaners, gardeners, plumbers and more.',
  url: BASE_URL,
  logo: `${BASE_URL}/android-chrome-512x512.png`,
  image: `${BASE_URL}/og-image.png`,
  telephone: '+27-info',
  email: 'info@upriseanalytics.co.za',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'ZA',
  },
  areaServed: {
    '@type': 'Country',
    name: 'South Africa',
  },
  priceRange: 'R99/month',
  sameAs: [],
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/workers?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" className={geist.className}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-gray-900">
        {children}
      </body>
    </html>
  )
}
