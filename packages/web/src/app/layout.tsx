import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import { Providers } from '@/components/providers/Providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: '%s | TaxasGE',
    default: 'TaxasGE - Gestión Fiscal Guinea Ecuatorial',
  },
  description: 'Plataforma digital de gestión fiscal de Guinea Ecuatorial. Consulta servicios fiscales, calcula tasas y gestiona trámites gubernamentales.',
  keywords: [
    'Guinea Ecuatorial',
    'gestión fiscal',
    'servicios fiscales',
    'tasas',
    'trámites',
    'gobierno',
    'impuestos',
    'calculadora fiscal'
  ],
  authors: [{ name: 'KOUEMOU SAH Jean Emac', url: 'https://github.com/KouemouSah' }],
  creator: 'TaxasGE Team',
  publisher: 'TaxasGE',
  metadataBase: new URL('https://taxasge.gq'),
  openGraph: {
    type: 'website',
    locale: 'es_GQ',
    url: 'https://taxasge.gq',
    siteName: 'TaxasGE',
    title: 'TaxasGE - Gestión Fiscal Guinea Ecuatorial',
    description: 'Plataforma digital de gestión fiscal de Guinea Ecuatorial',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TaxasGE - Gestión Fiscal Guinea Ecuatorial',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaxasGE - Gestión Fiscal Guinea Ecuatorial',
    description: 'Plataforma digital de gestión fiscal de Guinea Ecuatorial',
    images: ['/og-image.jpg'],
    creator: '@taxasge',
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
    icon: '/icons/icon-192x192.png',
    shortcut: '/icons/icon-72x72.png',
    apple: '/icons/icon-152x152.png',
  },
  verification: {
    google: 'google-site-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1a365d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TaxasGE" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#1a365d" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#1a365d" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.className
        )}
        suppressHydrationWarning
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <div className="flex-1">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}