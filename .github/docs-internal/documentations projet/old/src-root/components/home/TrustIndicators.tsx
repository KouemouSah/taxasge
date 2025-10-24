'use client'

import { Shield, Award, Users, CheckCircle, Globe, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function TrustIndicators() {
  const indicators = [
    {
      icon: Shield,
      title: 'Données Officielles Vérifiées',
      description: 'Toutes les informations fiscales sont validées par la Direction Générale des Impôts',
      badge: 'DGI Certifié',
      color: 'text-green-600'
    },
    {
      icon: Lock,
      title: 'Paiements Sécurisés BANGE',
      description: 'Partenariat officiel avec BANGE pour des transactions 100% sécurisées',
      badge: 'BANGE Partenaire',
      color: 'text-blue-600'
    },
    {
      icon: Globe,
      title: 'Service Public Gratuit',
      description: 'Application officielle de la République de Guinée Équatoriale, gratuite pour tous',
      badge: 'Service Public',
      color: 'text-purple-600'
    },
    {
      icon: Users,
      title: 'Utilisé par 15,000+ Citoyens',
      description: 'Plateforme de confiance utilisée quotidiennement par des milliers de citoyens',
      badge: '15k+ Utilisateurs',
      color: 'text-orange-600'
    },
    {
      icon: CheckCircle,
      title: 'Conformité 100% Garantie',
      description: 'Calculs et procédures conformes aux réglementations fiscales en vigueur',
      badge: '100% Conforme',
      color: 'text-emerald-600'
    },
    {
      icon: Award,
      title: 'Innovation GovTech Leader',
      description: 'Première application fiscale avec IA hors ligne en Afrique Centrale',
      badge: 'Innovation',
      color: 'text-indigo-600'
    }
  ]

  return (
    <section className="section-padding bg-gradient-to-br from-muted/30 to-background">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold text-foreground mb-4">
            Pourquoi Faire Confiance à TaxasGE ?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Une plateforme gouvernementale officielle, sécurisée et innovante pour simplifier 
            vos démarches fiscales en Guinée Équatoriale
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {indicators.map((indicator, index) => (
            <Card 
              key={indicator.title}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors ${indicator.color}`}>
                    <indicator.icon className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {indicator.title}
                      </h3>
                      <Badge variant="secondary" className="text-xs ml-2">
                        {indicator.badge}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {indicator.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-12">
          <div className="bg-primary/5 rounded-2xl p-8 border border-primary/20">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Rejoignez la Révolution Fiscale Numérique
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              TaxasGE transforme vos obligations fiscales en une expérience simple, 
              transparente et accessible. Découvrez pourquoi des milliers de citoyens 
              et d'entreprises nous font confiance.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a 
                href="/search" 
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Commencer Maintenant
              </a>
              <a 
                href="/about" 
                className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                En Savoir Plus
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}