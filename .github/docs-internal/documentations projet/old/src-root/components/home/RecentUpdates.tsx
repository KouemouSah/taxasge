'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, ArrowRight, Plus, Edit, Trash2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { formatRelativeTime, formatCurrency } from '@/lib/utils'

interface Update {
  id: string
  type: 'new_service' | 'price_update' | 'procedure_change' | 'system_update'
  title: {
    es: string
    fr: string
    en: string
  }
  description: {
    es: string
    fr: string
    en: string
  }
  serviceId?: string
  serviceName?: {
    es: string
    fr: string
    en: string
  }
  changes?: {
    field: string
    oldValue?: any
    newValue?: any
  }[]
  date: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  affectedUsers?: number
}

export function RecentUpdates() {
  const [updates, setUpdates] = useState<Update[]>([])
  const [loading, setLoading] = useState(true)
  const { language } = useLanguage()

  useEffect(() => {
    loadRecentUpdates()
  }, [])

  const loadRecentUpdates = async () => {
    try {
      // En production, ces données viendraient de l'API
      const mockUpdates: Update[] = [
        {
          id: 'upd-001',
          type: 'price_update',
          title: {
            es: 'Actualización de Tarifas - Permiso de Conducir',
            fr: 'Mise à Jour Tarifs - Permis de Conduire',
            en: 'Price Update - Driving License'
          },
          description: {
            es: 'Los costos del permiso de conducir han sido actualizados según la nueva reglamentación fiscal.',
            fr: 'Les coûts du permis de conduire ont été mis à jour selon la nouvelle réglementation fiscale.',
            en: 'Driving license costs have been updated according to new fiscal regulations.'
          },
          serviceId: 'T-001',
          serviceName: {
            es: 'Permiso de Conducir',
            fr: 'Permis de Conduire',
            en: 'Driving License'
          },
          changes: [
            {
              field: 'expedition_amount',
              oldValue: 12000,
              newValue: 15000
            },
            {
              field: 'renewal_amount',
              oldValue: 8000,
              newValue: 10000
            }
          ],
          date: '2024-12-15T10:30:00Z',
          priority: 'high',
          affectedUsers: 15000
        },
        {
          id: 'upd-002',
          type: 'new_service',
          title: {
            es: 'Nuevo Servicio: Certificado Digital de Residencia',
            fr: 'Nouveau Service : Certificat Numérique de Résidence',
            en: 'New Service: Digital Residence Certificate'
          },
          description: {
            es: 'Nuevo certificado digital de residencia disponible para trámites en línea.',
            fr: 'Nouveau certificat numérique de résidence disponible pour les démarches en ligne.',
            en: 'New digital residence certificate available for online procedures.'
          },
          serviceId: 'T-548',
          serviceName: {
            es: 'Certificado Digital de Residencia',
            fr: 'Certificat Numérique de Résidence',
            en: 'Digital Residence Certificate'
          },
          date: '2024-12-10T14:15:00Z',
          priority: 'medium',
          affectedUsers: 8000
        },
        {
          id: 'upd-003',
          type: 'system_update',
          title: {
            es: 'Mejoras en la Calculadora Fiscal',
            fr: 'Améliorations de la Calculatrice Fiscale',
            en: 'Tax Calculator Improvements'
          },
          description: {
            es: 'Nueva interfaz de calculadora con soporte para cálculos complejos y export mejorado.',
            fr: 'Nouvelle interface de calculatrice avec support pour calculs complexes et export amélioré.',
            en: 'New calculator interface with complex calculations support and improved export.'
          },
          date: '2024-12-08T09:00:00Z',
          priority: 'medium',
          affectedUsers: 25000
        },
        {
          id: 'upd-004',
          type: 'procedure_change',
          title: {
            es: 'Simplificación Procedimiento - Patente Comercial',
            fr: 'Simplification Procédure - Patente Commerciale',
            en: 'Procedure Simplification - Commercial License'
          },
          description: {
            es: 'El procedimiento para obtener la patente comercial ha sido simplificado, reduciendo los pasos de 8 a 5.',
            fr: 'La procédure pour obtenir la patente commerciale a été simplifiée, réduisant les étapes de 8 à 5.',
            en: 'The commercial license procedure has been simplified, reducing steps from 8 to 5.'
          },
          serviceId: 'T-002',
          serviceName: {
            es: 'Patente Comercial',
            fr: 'Patente Commerciale',
            en: 'Commercial License'
          },
          changes: [
            {
              field: 'procedure_steps',
              oldValue: 8,
              newValue: 5
            },
            {
              field: 'processing_time',
              oldValue: '15-20 días',
              newValue: '10-15 días'
            }
          ],
          date: '2024-12-05T16:45:00Z',
          priority: 'high',
          affectedUsers: 12000
        },
        {
          id: 'upd-005',
          type: 'system_update',
          title: {
            es: 'Integración Pago BANGE Disponible',
            fr: 'Intégration Paiement BANGE Disponible',
            en: 'BANGE Payment Integration Available'
          },
          description: {
            es: 'Ya puedes pagar tus impuestos directamente desde la aplicación con BANGE.',
            fr: 'Vous pouvez maintenant payer vos impôts directement depuis l\'application avec BANGE.',
            en: 'You can now pay your taxes directly from the app with BANGE.'
          },
          date: '2024-12-01T12:00:00Z',
          priority: 'critical',
          affectedUsers: 50000
        }
      ]

      // Simuler délai API
      await new Promise(resolve => setTimeout(resolve, 600))
      setUpdates(mockUpdates)
    } catch (error) {
      console.error('Failed to load recent updates:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUpdateIcon = (type: Update['type']) => {
    switch (type) {
      case 'new_service':
        return Plus
      case 'price_update':
        return Edit
      case 'procedure_change':
        return FileText
      case 'system_update':
        return AlertCircle
      default:
        return Calendar
    }
  }

  const getUpdateColor = (priority: Update['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-blue-500'
      case 'low':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getPriorityLabel = (priority: Update['priority']) => {
    switch (priority) {
      case 'critical':
        return 'Critique'
      case 'high':
        return 'Important'
      case 'medium':
        return 'Moyen'
      case 'low':
        return 'Info'
      default:
        return 'Info'
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
          
          <div className="max-w-4xl mx-auto space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
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
    <section className="section-padding bg-background">
      <div className="container-custom">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Calendar className="h-3 w-3 mr-1" />
            Dernières Actualités
          </Badge>
          
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
            Mises à Jour Récentes
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Restez informé des dernières modifications des services fiscaux, 
            nouvelles fonctionnalités et améliorations de la plateforme
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {updates.map((update, index) => {
              const UpdateIcon = getUpdateIcon(update.type)
              
              return (
                <Card 
                  key={update.id}
                  className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Icône et priorité */}
                      <div className="relative">
                        <div className={`${getUpdateColor(update.priority)} p-3 rounded-xl text-white`}>
                          <UpdateIcon className="h-6 w-6" />
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-2 -right-2 text-xs"
                        >
                          {getPriorityLabel(update.priority)}
                        </Badge>
                      </div>
                      
                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                              {update.title[language] || update.title.es}
                            </h3>
                            
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>{formatRelativeTime(update.date)}</span>
                              {update.affectedUsers && (
                                <span>
                                  {update.affectedUsers.toLocaleString()} utilisateurs concernés
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {update.serviceId && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/taxes/${update.serviceId}`}>
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                        
                        <p className="text-muted-foreground leading-relaxed mb-4">
                          {update.description[language] || update.description.es}
                        </p>
                        
                        {/* Détails des changements */}
                        {update.changes && update.changes.length > 0 && (
                          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                            <h4 className="text-sm font-medium text-foreground mb-2">
                              Changements détaillés :
                            </h4>
                            {update.changes.map((change, changeIndex) => (
                              <div key={changeIndex} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground capitalize">
                                  {change.field.replace('_', ' ')} :
                                </span>
                                <div className="flex items-center space-x-2">
                                  {change.oldValue && (
                                    <>
                                      <span className="line-through text-muted-foreground">
                                        {typeof change.oldValue === 'number' && change.field.includes('amount') 
                                          ? formatCurrency(change.oldValue)
                                          : change.oldValue
                                        }
                                      </span>
                                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    </>
                                  )}
                                  <span className="font-medium text-foreground">
                                    {typeof change.newValue === 'number' && change.field.includes('amount')
                                      ? formatCurrency(change.newValue)
                                      : change.newValue
                                    }
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Service lié */}
                        {update.serviceName && (
                          <div className="flex items-center space-x-2 mt-3">
                            <span className="text-sm text-muted-foreground">Service :</span>
                            <Link 
                              href={`/taxes/${update.serviceId}`}
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              {update.serviceName[language] || update.serviceName.es}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Voir toutes les mises à jour */}
          <div className="text-center mt-12">
            <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Restez Toujours Informé
                </h3>
                <p className="text-muted-foreground mb-6">
                  Suivez toutes les actualités fiscales et mises à jour de TaxasGE
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button size="lg" asChild>
                    <Link href="/updates">
                      Voir Toutes les Mises à Jour
                      <Calendar className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/newsletter">
                      S'Abonner aux Notifications
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}