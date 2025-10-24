'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Users, Calculator, Building } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface Stat {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'stable'
  icon: any
  description: string
}

export function StatsSection() {
  const { t } = useLanguage()
  const [stats, setStats] = useState<Stat[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simuler chargement des statistiques
    const loadStats = async () => {
      // En production, ces données viendraient de l'API
      const mockStats: Stat[] = [
        {
          label: t('stats.services'),
          value: '547',
          change: '+12 ce mois',
          trend: 'up',
          icon: Building,
          description: 'Services fiscaux officiels disponibles'
        },
        {
          label: t('stats.ministries'),
          value: '8',
          change: 'Tous connectés',
          trend: 'stable',
          icon: Building,
          description: 'Ministères avec services digitalisés'
        },
        {
          label: t('stats.users'),
          value: '15,247',
          change: '+1,234 ce mois',
          trend: 'up',
          icon: Users,
          description: 'Utilisateurs actifs mensuels'
        },
        {
          label: t('stats.calculations'),
          value: '89,432',
          change: '+5,678 cette semaine',
          trend: 'up',
          icon: Calculator,
          description: 'Calculs fiscaux effectués'
        },
      ]

      // Simuler délai API
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStats(mockStats)
      setIsLoading(false)
    }

    loadStats()
  }, [t])

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-8 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            TaxasGE en Chiffres
          </h2>
          <p className="text-lg text-muted-foreground">
            L&apos;impact de la digitalisation des services fiscaux
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card
              key={stat.label}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>

                  <Badge
                    variant={stat.trend === 'up' ? 'default' : stat.trend === 'down' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    <TrendingUp className={`h-3 w-3 mr-1 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                    {stat.change}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {stat.label}
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {stat.description}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Rejoignez des milliers d&apos;utilisateurs qui simplifient leurs démarches fiscales
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">
                Créer un Compte Gratuit
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/demo">
                Voir la Démonstration
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
