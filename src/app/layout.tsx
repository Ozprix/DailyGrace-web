
import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/theme-context';
import { AuthProvider } from '@/contexts/auth-context';
import { ContentProvider } from '@/contexts/content-context';
import { Toaster } from '@/components/ui/toaster';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';
import AnalyticsInitializer from '@/components/analytics/analytics-initializer';
import { SkipLink } from '@/components/accessibility/skip-link';
import { ErrorBoundary } from '@/components/error-boundary/error-boundary';

// Font optimization
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});

// SEO and PWA metadata
export const metadata: Metadata = {
  title: {
    default: 'Daily Grace - Your Spiritual Companion',
    template: '%s | Daily Grace'
  },
  description: 'Your daily companion for spiritual growth, prayer, and reflection. Join our community of believers on a journey of faith.',
  keywords: ['daily devotional', 'prayer', 'bible study', 'spiritual growth', 'christian app', 'faith', 'meditation'],
  authors: [{ name: 'Daily Grace Team' }],
  creator: 'Daily Grace',
  publisher: 'Daily Grace',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://dailygrace.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://dailygrace.app',
    title: 'Daily Grace - Your Spiritual Companion',
    description: 'Your daily companion for spiritual growth, prayer, and reflection.',
    siteName: 'Daily Grace',
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'Daily Grace App Icon',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily Grace - Your Spiritual Companion',
    description: 'Your daily companion for spiritual growth, prayer, and reflection.',
    images: ['/icons/icon-512x512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

// Structured data for SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Daily Grace',
  description: 'Your daily companion for spiritual growth, prayer, and reflection.',
  url: 'https://dailygrace.app',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  author: {
    '@type': 'Organization',
    name: 'Daily Grace',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
        
        {/* DNS prefetch for analytics */}
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Daily Grace" />
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        
        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        
        {/* Sentry metadata */}
        <meta name="sentry-trace" content="sentry-trace" />
        <meta name="sentry-baggage" content="sentry-baggage" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <ContentProvider>
                <SkipLink />
                <main id="main-content" className="relative">
                  {children}
                </main>
                <Toaster />
                <PWAInstallPrompt />
                <AnalyticsInitializer />
              </ContentProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
