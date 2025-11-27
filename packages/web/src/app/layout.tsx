import type { Metadata } from 'next';

// Note: globals.css is imported in [locale]/layout.tsx to avoid duplication

/**
 * Root Layout
 * Defines the base HTML structure for all pages.
 * The actual locale-specific content and providers are in [locale]/layout.tsx
 *
 * Note: We use a default lang attribute here, but the [locale]/layout.tsx
 * will override it with the correct locale-specific html element.
 */

export const metadata: Metadata = {
  title: {
    template: '%s | TaxasGE',
    default: 'TaxasGE - Plataforma Fiscal de Guinea Ecuatorial',
  },
  description: 'Plataforma digital de gestión fiscal de Guinea Ecuatorial',
  keywords: ['fiscal', 'impuestos', 'Guinea Ecuatorial', 'DGI', 'declaraciones'],
  authors: [{ name: 'TaxasGE' }],
  creator: 'TaxasGE',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://taxasge.gq'),
  openGraph: {
    type: 'website',
    locale: 'es_GQ',
    siteName: 'TaxasGE',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The [locale]/layout.tsx renders its own <html> and <body> tags
  // with the correct locale. This layout acts as a pass-through
  // but provides global metadata.
  return children;
}
