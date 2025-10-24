import './globals.css';
import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { Providers } from './providers';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TAXASGE - Services Fiscaux de Guinée Équatoriale',
    template: '%s | TAXASGE'
  },
  description: 'Plateforme officielle des services fiscaux de la République de Guinée Équatoriale. Consultez les 547 services fiscaux, calculez vos taxes et effectuez vos déclarations en ligne.',
  keywords: [
    'TAXASGE',
    'services fiscaux',
    'Guinée Équatoriale',
    'GQ',
    'DGI',
    'déclarations fiscales',
    'taxes',
    'impôts',
    'République de Guinée Équatoriale',
    'ministères',
    'secteurs'
  ],
  authors: [{ name: 'Direction Générale des Impôts - Guinée Équatoriale' }],
  creator: 'DGI Guinée Équatoriale',
  publisher: 'République de Guinée Équatoriale',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://taxasge.gq.gov'),
  alternates: {
    canonical: '/',
    languages: {
      'es': '/es',
      'fr': '/fr',
      'pt': '/pt',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_GQ',
    url: 'https://taxasge.gq.gov',
    siteName: 'TAXASGE',
    title: 'TAXASGE - Services Fiscaux de Guinée Équatoriale',
    description: 'Plateforme officielle des services fiscaux de la République de Guinée Équatoriale',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TAXASGE - Services Fiscaux de Guinée Équatoriale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TAXASGE - Services Fiscaux de Guinée Équatoriale',
    description: 'Plateforme officielle des services fiscaux de la République de Guinée Équatoriale',
    images: ['/twitter-image.png'],
    creator: '@DGIGuineeEquatoriale',
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
      { url: '/logo.png', sizes: 'any', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png', sizes: 'any', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || 'https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app'} />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            expand={true}
            richColors
            closeButton
          />
        </Providers>
      </body>
    </html>
  );
}
