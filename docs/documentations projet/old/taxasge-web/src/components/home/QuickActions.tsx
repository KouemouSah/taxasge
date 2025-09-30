'use client'

import Link from 'next/link'
import { Search, Calculator, Heart, MessageCircle, FileText, TrendingUp, Users, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/providers/LanguageProvider'

export function QuickActions() {
  const { t } = useLanguage()

  const primaryActions = [
    {
      title: t('actions.search'),
      description: 'Recherchez parmi 547 services fiscaux officiels',
      icon: Search,
      href: '/search',
      color: 'bg-primary',
      stats: '547 services'
    },
    {
      title: t('actions.calculate'),
      description: 'Calculez vos montants fiscaux en temps réel',
      icon: Calculator,
      href: '/calculate',
      color: 'bg-accent',
      stats: '100% précis'
    },
    {
      title: t('actions.favorites'),
      description: 'Accédez rapidement à vos services favoris',
      icon: Heart,
      href: '/favorites',
      color: 'bg-secondary',
      stats: 'Sauvegarde locale'
    },
    {
      title: t('actions.assistant'),
      description: 'Posez vos questions à notre IA fiscale',
      icon: MessageCircle,
      href: '/chat',
      color: 'bg-purple-500',
      stats: 'IA hors ligne'
    },
  ]

  const secondaryActions = [
    {
      title: 'Procédures Complètes',
      description: 'Guides étape par étape pour chaque service',
      icon: FileText,
      href: '/procedures',
      stats: '100% détaillées'
    },
    {
      title: 'Tendances Fiscales',
      description: 'Analyses et statistiques des services populaires',
      icon: TrendingUp,
      href: '/trends',
      stats: 'Données temps réel'
    },
    {
      title: 'Communauté',
      description: 'Partagez et discutez avec d\'autres utilisateurs',
      icon: Users,
      href: '/community',
      stats: '1000+ membres'
    },
    {
      title: 'Sécurité & Conformité',
      description: 'Informations sur la protection de vos données',
      icon: Shield,
      href: '/security',
      stats: 'Certifié sécurisé'
    },
  ]

  return (
    <section className="section-padding bg-background">
      <div className="container-custom">
        {/* Actions principales */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Accès Rapide aux Services
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour gérer vos obligations fiscales en Guinée Équatoriale
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {primaryActions.map((action, index) => (
              <Card 
                key={action.href}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Icône avec background coloré */}
                    <div className={`${action.color} p-4 rounded-2xl text-white group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className="h-8 w-8" />
                    </div>
                    
                    {/* Contenu */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {action.description}
                      </p>
                    </div>
                    
                    {/* Statistique */}
                    <div className="w-full">
                      <div className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {action.stats}
                      </div>
                    </div>
                    
                    {/* Bouton d'action */}
                    <Button 
                      asChild 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      variant="outline"
                    >
                      <Link href={action.href}>
                        Accéder
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Actions secondaires */}
        <div>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-display font-bold text-foreground mb-2">
              Fonctionnalités Avancées
            </h3>
            <p className="text-muted-foreground">
              Découvrez toutes les capacités de TaxasGE
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {secondaryActions.map((action) => (
              <Card 
                key={action.href}
                className="group hover:shadow-md transition-all duration-200 hover:border-primary/30"
              >
                <CardContent className="p-4">
                  <Link href={action.href} className="block">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                        <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                          {action.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {action.description}
                        </p>
                        <div className="text-xs font-medium text-primary mt-2">
                          {action.stats}
                        </div>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}