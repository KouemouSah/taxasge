'use client'

import { useState } from 'react'
import { Mail, Bell, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/components/providers/LanguageProvider'

export function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { language } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    
    try {
      // Simuler API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // En production, appeler API newsletter
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          language,
          source: 'homepage',
          interests: ['tax_updates', 'new_features', 'government_news']
        })
      })

      if (response.ok) {
        setIsSubscribed(true)
        setEmail('')
        
        // Analytics tracking
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'newsletter_signup', {
            method: 'homepage',
            language: language
          })
        }
      }
    } catch (error) {
      console.error('Newsletter signup failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const benefits = [
    {
      icon: Bell,
      title: 'Nouvelles Taxes & Réglementations',
      description: 'Soyez informé en premier des nouveaux services fiscaux et changements réglementaires'
    },
    {
      icon: CheckCircle,
      title: 'Mises à Jour TaxasGE',
      description: 'Découvrez les nouvelles fonctionnalités et améliorations de l\'application'
    },
    {
      icon: Mail,
      title: 'Conseils Fiscaux Exclusifs',
      description: 'Recevez des conseils pratiques et des guides pour optimiser vos démarches'
    }
  ]

  if (isSubscribed) {
    return (
      <section className="section-padding bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container-custom">
          <Card className="max-w-2xl mx-auto border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/20 rounded-full">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Inscription Confirmée !
              </h3>
              
              <p className="text-muted-foreground mb-6">
                Merci de votre inscription à la newsletter TaxasGE. Vous recevrez bientôt 
                nos dernières actualités fiscales et mises à jour de l'application.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild>
                  <a href="/search">
                    Explorer les Services
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/calculate">
                    Calculatrice Fiscale
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <section className="section-padding bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Mail className="h-3 w-3 mr-1" />
              Newsletter Officielle
            </Badge>
            
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Restez Informé des Actualités Fiscales
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Recevez les dernières mises à jour sur les services fiscaux, 
              les nouvelles fonctionnalités TaxasGE et les conseils d'experts
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Formulaire d'inscription */}
            <Card className="border-2 border-primary/20">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="newsletter-email" className="block text-sm font-medium text-foreground mb-2">
                      Adresse Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newsletter-email"
                        type="email"
                        placeholder="votre.email@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading || !email.trim()}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Inscription...
                      </>
                    ) : (
                      <>
                        S'Inscrire à la Newsletter
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    En vous inscrivant, vous acceptez de recevoir nos communications. 
                    Vous pouvez vous désabonner à tout moment.
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* Avantages */}
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div 
                  key={benefit.title}
                  className="flex items-start space-x-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <benefit.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      {benefit.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
              
              <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                <div className="flex items-center space-x-2 text-sm text-accent-foreground">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span className="font-medium">
                    Fréquence : 1-2 emails par mois maximum
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-accent-foreground mt-1">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span className="font-medium">
                    Contenu : 100% informatif, 0% spam
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}