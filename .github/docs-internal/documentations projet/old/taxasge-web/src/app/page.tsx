import { Metadata } from 'next'
import { HeroSection } from '@/components/home/HeroSection'
import { QuickActions } from '@/components/home/QuickActions'
import { PopularServices } from '@/components/home/PopularServices'
import { RecentUpdates } from '@/components/home/RecentUpdates'
import { StatsSection } from '@/components/home/StatsSection'
import { FeaturesSection } from '@/components/home/FeaturesSection'

export const metadata: Metadata = {
  title: 'TaxasGE - Services Fiscaux Guinée Équatoriale Officiel',
  description: 'Accédez aux 547 services fiscaux officiels de Guinée Équatoriale. Calculatrice gratuite, recherche avancée, assistant IA et procédures complètes. Service public numérique.',
  openGraph: {
    title: 'TaxasGE - Application Fiscale Officielle',
    description: '547 services fiscaux avec calculatrice et assistant IA',
    images: ['/og-home.png'],
  },
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section avec recherche prominente */}
      <HeroSection />
      
      {/* Actions rapides */}
      <QuickActions />
      
      {/* Statistiques impressionnantes */}
      <StatsSection />
      
      {/* Services populaires */}
      <PopularServices />
      
      {/* Fonctionnalités clés */}
      <FeaturesSection />
      
      {/* Mises à jour récentes */}
      <RecentUpdates />
    </div>
  )
}