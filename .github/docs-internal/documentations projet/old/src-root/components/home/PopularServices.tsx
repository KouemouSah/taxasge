'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Calculator, Heart, ExternalLink, Clock, Building } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { formatCurrency } from '@/lib/utils'

interface PopularService {
  id: string
  name: {
    es: string
    fr: string
    en: string
  }
  description: {
    es: string
    fr: string
    en: string
  }
  category: string
  ministry: string
  prices: {
    expedition: number
    renewal?: number
  }
  processingTime: string
  popularity: number
  monthlyViews: number
  isOnlineAvailable: boolean
  isUrgentAvailable: boolean
}

export function PopularServices() {
  const [services, setServices] = useState<PopularService[]>([])
  const [loading, setLoading] = useState(true)
  const { language } = useLanguage()

  useEffect(() => {
    loadPopularServices()
  }, [])

  const loadPopularServices = async () => {
    try {
      // En production, ces données viendraient de l'API
      const mockServices: PopularService[] = [
        {
          id: 'T-001',
          name: {
            es: 'Permiso de Conducir',
            fr: 'Permis de Conduire',
            en: 'Driving License'
          },
          description: {
            es: 'Permiso para conducir vehículos motorizados en Guinea Ecuatorial',
            fr: 'Permis pour conduire des véhicules motorisés en Guinée Équatoriale',
            en: 'License to drive motor vehicles in Equatorial Guinea'
          },
          category: 'Licencias de Transporte',
          ministry: 'Ministerio de Transportes',
          prices: {
            expedition: 15000,
            renewal: 10000
          },
          processingTime: '5-7 días laborables',
          popularity: 0.95,
          monthlyViews: 2341,
          isOnlineAvailable: true,
          isUrgentAvailable: true
        },
        {
          id: 'T-002',
          name: {
            es: 'Patente Comercial',
            fr: 'Patente Commerciale',
            en: 'Commercial License'
          },
          description: {
            es: 'Licencia para ejercer actividades comerciales y empresariales',
            fr: 'Licence pour exercer des activités commerciales et entrepreneuriales',
            en: 'License to conduct commercial and business activities'
          },
          category: 'Licencias Comerciales',
          ministry: 'Ministerio de Comercio',
          prices: {
            expedition: 25000,
            renewal: 15000
          },
          processingTime: '10-15 días laborables',
          popularity: 0.87,
          monthlyViews: 1876,
          isOnlineAvailable: true,
          isUrgentAvailable: false
        },
        {
          id: 'T-003',
          name: {
            es: 'Carta de Residencia',
            fr: 'Carte de Résidence',
            en: 'Residence Card'
          },
          description: {
            es: 'Documento oficial de residencia para extranjeros',
            fr: 'Document officiel de résidence pour les étrangers',
            en: 'Official residence document for foreigners'
          },
          category: 'Documentos de Identidad',
          ministry: 'Ministerio del Interior',
          prices: {
            expedition: 50000,
            renewal: 30000
          },
          processingTime: '15-20 días laborables',
          popularity: 0.82,
          monthlyViews: 1654,
          isOnlineAvailable: false,
          isUrgentAvailable: true
        },
        {
          id: 'T-004',
          name: {
            es: 'Declaración de IVA',
            fr: 'Déclaration de TVA',
            en: 'VAT Declaration'
          },
          description: {
            es: 'Declaración mensual del Impuesto sobre el Valor Añadido',
            fr: 'Déclaration mensuelle de la Taxe sur la Valeur Ajoutée',
            en: 'Monthly Value Added Tax declaration'
          },
          category: 'Declaraciones Fiscales',
          ministry: 'Ministerio de Hacienda',
          prices: {
            expedition: 5000
          },
          processingTime: '3-5 días laborables',
          popularity: 0.78,
          monthlyViews: 1432,
          isOnlineAvailable: true,
          isUrgentAvailable: false
        },
        {
          id: 'T-005',
          name: {
            es: 'Licencia de Exportación',
            fr: 'Licence d\'Exportation',
            en: 'Export License'
          },
          description: {
            es: 'Autorización para exportar productos y mercancías',
            fr: 'Autorisation pour exporter des produits et marchandises',
            en: 'Authorization to export products and goods'
          },
          category: 'Comercio Exterior',
          ministry: 'Ministerio de Comercio',
          prices: {
            expedition: 35000,
            renewal: 20000
          },
          processingTime: '7-10 días laborables',
          popularity: 0.74,
          monthlyViews: 1234,
          isOnlineAvailable: true,
          isUrgentAvailable: true
        },
        {
          id: 'T-006',
          name: {
            es: 'Certificado de Origen',
            fr: 'Certificat d\'Origine',
            en: 'Certificate of Origin'
          },
          description: {
            es: 'Certificado que acredita el origen de productos para exportación',
            fr: 'Certificat attestant l\'origine des produits pour l\'exportation',
            en: 'Certificate attesting the origin of products for export'
          },
          category: 'Certificaciones',
          ministry: 'Ministerio de Comercio',
          prices: {
            expedition: 8000
          },
          processingTime: '2-3 días laborables',
          popularity: 0.71,
          monthlyViews: 987,
          isOnlineAvailable: true,
          isUrgentAvailable: true
        }
      ]

      // Simuler délai API
      await new Promise(resolve => setTimeout(resolve, 800))
      setServices(mockServices)
    } catch (error) {
      console.error('Failed to load popular services:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section-padding bg-background">
      <div className="container-custom">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Badge variant="secondary" className="px-4 py-1.5">
              <TrendingUp className="h-3 w-3 mr-1" />
              Services les Plus Consultés
            </Badge>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
            Services Fiscaux Populaires
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez les services fiscaux les plus consultés et utilisés par 
            les citoyens et entreprises de Guinée Équatoriale
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Card 
              key={service.id}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 h-full"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      {service.id}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-primary/10 text-primary"
                    >
                      #{index + 1}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {service.isOnlineAvailable && (
                      <Badge variant="secondary" className="text-xs">
                        En ligne
                      </Badge>
                    )}
                    {service.isUrgentAvailable && (
                      <Badge variant="destructive" className="text-xs">
                        Urgent
                      </Badge>
                    )}
                  </div>
                </div>
                
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                  {service.name[language] || service.name.es}
                </h3>
                
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {service.description[language] || service.description.es}
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Statistiques de popularité */}
                <div className="flex items-center justify-between mb-4 p-3 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">
                      {service.monthlyViews.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Vues/mois
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-accent">
                      {Math.round(service.popularity * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Popularité
                    </div>
                  </div>
                </div>

                {/* Prix */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Expédition</span>
                    <span className="font-semibold text-lg text-foreground">
                      {formatCurrency(service.prices.expedition)}
                    </span>
                  </div>
                  
                  {service.prices.renewal && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Renouvellement</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(service.prices.renewal)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Métadonnées */}
                <div className="space-y-2 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{service.processingTime}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Building className="h-3 w-3" />
                    <span className="truncate">{service.ministry}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/calculate?service=${service.id}`}>
                      <Calculator className="h-3 w-3 mr-1" />
                      Calculer
                    </Link>
                  </Button>
                  
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/taxes/${service.id}`}>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                  
                  <Button variant="ghost" size="sm">
                    <Heart className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-6">
            Explorez tous les 547 services fiscaux disponibles
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/search">
                Voir Tous les Services
                <TrendingUp className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/hierarchy">
                Explorer par Ministère
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}