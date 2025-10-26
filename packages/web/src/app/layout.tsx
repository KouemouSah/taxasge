import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TaxasGE - Auth',
  description: 'Module d\'authentification TaxasGE',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}
