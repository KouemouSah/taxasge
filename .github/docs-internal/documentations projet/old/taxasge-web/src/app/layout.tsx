import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@/components/analytics/Analytics'
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt'
import { OfflineIndicator } from '@/components/offline/OfflineIndicator'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'TaxasGE - Services Fiscaux Guinée Équatoriale Officiel',
    template: '%s | TaxasGE - Guinée Équatoriale'
  },
  description: 'Application officielle des 547 services fiscaux de Guinée Équatoriale. Calculatrice, recherche avancée, assistant IA et procédures complètes. Service public gratuit.',
  keywords: [
    'taxes guinée équatoriale',
    'impôts GQ', 
    'services fiscaux',
    'calculatrice fiscale',
    'DGI guinée équatoriale',
    'assistant fiscal IA',
    'procédures administratives',
    'république guinée équatoriale'
  ],
  authors: [{ name: 'KOUEMOU SAH Jean Emac' }],
  creator: 'République de Guinée Équatoriale - DGI',
  publisher: 'Direction Générale des Impôts',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://taxasge.gq'),
  alternates: {
    canonical: '/',
    languages: {
      'es-GQ': '/',
      'fr-GQ': '/fr',
      'en': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_GQ',
    url: '/',
    title: 'TaxasGE - Services Fiscaux Guinée Équatoriale',
    description: '547 services fiscaux officiels avec calculatrice et assistant IA. Application gouvernementale gratuite.',
    siteName: 'TaxasGE',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TaxasGE - Application Fiscale Officielle Guinée Équatoriale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaxasGE - Services Fiscaux Guinée Équatoriale',
    description: '547 services fiscaux avec calculatrice et IA',
    images: ['/twitter-image.png'],
    creator: '@TaxasGE_GQ',
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
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/safari-pinned-tab.svg', color: '#059669' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TaxasGE',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Preconnect pour performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        
        {/* DNS prefetch pour services externes */}
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        
        {/* Viewport meta pour PWA */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="theme-color" content="#059669" />
        <meta name="color-scheme" content="light dark" />
        
        {/* PWA meta tags */}
        <meta name="application-name" content="TaxasGE" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TaxasGE" />
        
        {/* Microsoft tiles */}
        <meta name="msapplication-TileColor" content="#059669" />
        <meta name="msapplication-TileImage" content="/icons/mstile-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Structured data pour SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "TaxasGE",
              "description": "Application officielle des services fiscaux de Guinée Équatoriale",
              "url": "https://taxasge.gq",
              "applicationCategory": "GovernmentApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "XAF"
              },
              "provider": {
                "@type": "GovernmentOrganization",
                "name": "Direction Générale des Impôts",
                "url": "https://dgi.gq.gov"
              },
              "areaServed": {
                "@type": "Country",
                "name": "Guinée Équatoriale"
              },
              "inLanguage": ["es", "fr", "en"]
            })
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <Providers>
          {/* Indicateur de connexion */}
          <OfflineIndicator />
          
          {/* Header navigation */}
          <Header />
          
          {/* Contenu principal */}
          <main className="min-h-screen bg-background">
            {children}
          </main>
          
          {/* Footer */}
          <Footer />
          
          {/* Toast notifications */}
          <Toaster />
          
          {/* PWA install prompt */}
          <PWAInstallPrompt />
          
          {/* Analytics */}
          <Analytics />
        </Providers>
        
        {/* Service Worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('✅ SW registered: ', registration.scope);
                    })
                    .catch(function(registrationError) {
                      console.log('❌ SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}