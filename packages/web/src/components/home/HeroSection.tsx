'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Calculator, MessageCircle, Star, TrendingUp, Shield, FileText, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/components/providers/LanguageProvider'

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const { t } = useLanguage()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const quickSearches = [
    'Permis de conduire',
    'Patente commerciale',
    'Carte de séjour',
    'Déclaration TVA',
    'Licence d\'exportation'
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />

      <div className="container mx-auto px-4 relative">
        <div className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge nouveau */}
            <div className="flex justify-center mb-6">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
                <Star className="h-3 w-3 mr-1" />
                Application Officielle République de Guinée Équatoriale
              </Badge>
            </div>

            {/* Titre principal */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in-up">
              {t('hero.title')}
            </h1>

            {/* Sous-titre */}
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up">
              {t('hero.subtitle')}
            </p>

            {/* Statistiques impressionnantes */}
            <div className="flex flex-wrap justify-center items-center gap-6 mb-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                <span className="font-medium">547 Services Fiscaux</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-accent rounded-full animate-pulse" />
                <span className="font-medium">8 Ministères</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-secondary rounded-full animate-pulse" />
                <span className="font-medium">100% Gratuit</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-medium">Mode Hors Ligne</span>
              </div>
            </div>

            {/* Barre de recherche principale */}
            <div className="max-w-2xl mx-auto mb-8">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t('hero.search.placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-32 py-4 text-lg border-2 border-border focus:border-primary rounded-xl shadow-lg"
                  />
                  <Button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6"
                    disabled={!searchQuery.trim()}
                  >
                    Rechercher
                  </Button>
                </div>
              </form>

              {/* Suggestions de recherche */}
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Recherches populaires :</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {quickSearches.map((search) => (
                    <Button
                      key={search}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery(search)
                        router.push(`/search?q=${encodeURIComponent(search)}`)
                      }}
                      className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {search}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions principales */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/search" className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Explorer les Services</span>
                </Link>
              </Button>

              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/calculate" className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Calculatrice Fiscale</span>
                </Link>
              </Button>

              <Button size="lg" variant="ghost" asChild className="w-full sm:w-auto">
                <Link href="/chat" className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Assistant IA</span>
                </Link>
              </Button>
            </div>

            {/* Indicateurs de confiance */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Données Officielles Vérifiées</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-primary" />
                <span>Procédures Complètes</span>
              </div>
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span>Support Multilingue</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gradient overlay bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
