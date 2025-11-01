import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'TaxasGE - Plateforme Fiscale',
  description: 'Plataforma digital de gestión fiscal de Guinea Ecuatorial',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
