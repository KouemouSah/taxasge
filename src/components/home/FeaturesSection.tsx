'use client'

import { 
  Search, 
  Calculator, 
  MessageCircle, 
  Wifi, 
  Shield, 
  Smartphone,
  Globe,
  TrendingUp,
  FileText,
  Users,
  Zap,
  Award
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function FeaturesSection() {
  const coreFeatures = [
    {
      icon: Search,
      title: 'Recherche Intelligente',
      description: 'Trouvez instantanément parmi 547 services fiscaux avec notre moteur de recherche avancé et suggestions intelligentes.',
      highlights: ['Recherche vocale', 'Filtres avancés', 'Suggestions IA'],
      color: 'bg-blue-500'
    },
    {
      icon: Calculator,
      title: 'Calculatrice Fiscale',
      description: 'Calculez précisément vos montants fiscaux avec notre calculatrice officielle. Export PDF et historique inclus.',
      highlights: ['Calculs officiels', 'Export PDF', 'Historique'],
      color: 'bg-green-500'
    },
    {
      icon: MessageCircle,
      title: 'Assistant IA Hors Ligne',
      description: 'Chatbot intelligent embarqué (TensorFlow Lite) qui répond à vos questions fiscales même sans connexion.',
      highlights: ['100% hors ligne', 'Trilingue ES/FR/EN', '0.41MB seulement'],
      color: 'bg-purple-500'
    },
    {
      icon: Wifi,
      title: 'Mode Offline Complet',
      description: 'Toutes les fonctionnalités disponibles sans connexion internet. Synchronisation automatique au retour en ligne.',
      highlights: ['Données locales', 'Sync automatique', 'Performance optimale'],
      color: 'bg-orange-500'
    }
  ]

  const advancedFeatures = [
    {
      icon: Shield,
      title: 'Sécurité Maximale',
      description: 'Chiffrement bout en bout, authentification sécurisée et conformité RGPD.',
      stats: '100% Sécurisé'
    },
    {
      icon: Globe,
      title: 'Multilingue',
      description: 'Interface complète en Espagnol, Français et Anglais.',
      stats: '3 Langues'
    },
    {
      icon: Smartphone,
      title: 'Progressive Web App',
      description: 'Installable comme une app native, notifications push incluses.',
      stats: 'PWA Complète'
    },
    {
      icon: TrendingUp,
      title: 'Analytics Avancées',
      description: 'Tableaux de bord et statistiques pour optimiser votre conformité fiscale.',
      stats: 'Insights IA'
    },
    {
      icon: FileText,
      title: 'Documentation Complète',
      description: 'Procédures détaillées, documents requis et guides étape par étape.',
      stats: '100% Détaillé'
    },
    {
      icon: Users,
      title: 'Support Communauté',
      description: 'Forum d\'entraide et support technique dédié.',
      stats: '24/7 Support'
    }
  ]

  const technicalSpecs = [
    {
      icon: Zap,
      title: 'Performance Exceptionnelle',
      description: 'Temps de réponse < 300ms, Core Web Vitals excellents',
      metric: '< 300ms',
      color: 'text-yellow-600'
    },
    {
      icon: Award,
      title: 'Qualité Certifiée',
      description: 'Score Lighthouse >90, accessibilité WCAG AA',
      metric: '>90 Score',
      color: 'text-emerald-600'
    },
    {
      icon: Shield,
      title: 'Fiabilité Garantie',
      description: 'Uptime 99.9%, sauvegarde automatique, récupération d\'erreur',
      metric: '99.9% Uptime',
      color: 'text-blue-600'
    }
  ]

  return (
    <section className="section-padding bg-muted/30">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Award className="h-3 w-3 mr-1" />
            Fonctionnalités Avancées
          </Badge>
          
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
            Une Plateforme Fiscale Révolutionnaire
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            TaxasGE combine les dernières technologies pour offrir une expérience 
            fiscale simple, rapide et accessible à tous les citoyens et entreprises
          </p>
        </div>

        {/* Fonctionnalités principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {coreFeatures.map((feature, index) => (
            <Card 
              key={feature.title}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/30"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  <div className={`${feature.color} p-4 rounded-2xl text-white group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-3">
                      {feature.title}
                    </h3>
                    
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {feature.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {feature.highlights.map((highlight) => (
                        <Badge 
                          key={highlight}
                          variant="outline" 
                          className="text-xs group-hover:border-primary/50 transition-colors"
                        >
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Fonctionnalités avancées */}
        <div className="mb-16">
          <h3 className="text-2xl font-display font-bold text-foreground text-center mb-8">
            Fonctionnalités Avancées
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {advancedFeatures.map((feature, index) => (
              <Card 
                key={feature.title}
                className="group hover:shadow-md transition-all duration-200 hover:border-primary/30"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {feature.title}
                        </h4>
                        <Badge variant="secondary" className="text-xs ml-2">
                          {feature.stats}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Spécifications techniques */}
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8 border border-primary/20">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-display font-bold text-foreground mb-2">
              Excellence Technique
            </h3>
            <p className="text-muted-foreground">
              Des performances de niveau mondial pour une expérience utilisateur exceptionnelle
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {technicalSpecs.map((spec, index) => (
              <div 
                key={spec.title}
                className="text-center p-6 bg-background/50 rounded-xl border border-border hover:border-primary/30 transition-colors"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`inline-flex p-3 rounded-full bg-muted mb-4 ${spec.color}`}>
                  <spec.icon className="h-6 w-6" />
                </div>
                
                <div className={`text-2xl font-bold mb-2 ${spec.color}`}>
                  {spec.metric}
                </div>
                
                <h4 className="font-semibold text-foreground mb-2">
                  {spec.title}
                </h4>
                
                <p className="text-sm text-muted-foreground">
                  {spec.description}
                </p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button size="lg" asChild>
              <a href="/technical-specs">
                Voir les Spécifications Complètes
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}