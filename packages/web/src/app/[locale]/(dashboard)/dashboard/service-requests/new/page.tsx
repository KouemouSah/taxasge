'use client'

/**
 * New Service Request Page
 * Workflow selection and request creation wizard
 * UX: Category-first collapsible approach
 */

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Search,
  FileText,
  Loader2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  User,
  Globe,
  Car,
  FileSignature,
  Building,
  Calendar,
  CreditCard,
  BadgeCheck,
} from 'lucide-react'
import { useServiceRequests, wizardSessionApi } from '@/modules/service-requests'
import type { WorkflowConfig } from '@/modules/service-requests'
import { FEATURE_CACHE_FIRST_WIZARD } from '@/core/config/features'

// Category icons, labels and descriptions
const CATEGORY_CONFIG: Record<
  string,
  { icon: React.ElementType; labelEs: string; labelFr: string; labelEn: string; descEs: string; descFr: string; descEn: string }
> = {
  IDENTIDAD: {
    icon: BadgeCheck,
    labelEs: 'Identidad',
    labelFr: 'Identite',
    labelEn: 'Identity',
    descEs: 'DIP, Certificados de nacimiento, etc.',
    descFr: 'DIP, Certificats de naissance, etc.',
    descEn: 'ID, Birth certificates, etc.',
  },
  EXTRANJERIA: {
    icon: Globe,
    labelEs: 'Extranjeria',
    labelFr: 'Immigration',
    labelEn: 'Immigration',
    descEs: 'Visados, Permisos de residencia',
    descFr: 'Visas, Permis de sejour',
    descEn: 'Visas, Residence permits',
  },
  VEHICULOS: {
    icon: Car,
    labelEs: 'Vehiculos',
    labelFr: 'Vehicules',
    labelEn: 'Vehicles',
    descEs: 'Matriculacion, Transferencias',
    descFr: 'Immatriculation, Transferts',
    descEn: 'Registration, Transfers',
  },
  CONTRATOS: {
    icon: FileSignature,
    labelEs: 'Contratos',
    labelFr: 'Contrats',
    labelEn: 'Contracts',
    descEs: 'Legalizacion de contratos',
    descFr: 'Legalisation de contrats',
    descEn: 'Contract legalization',
  },
  CONDUCCION: {
    icon: BadgeCheck,
    labelEs: 'Conduccion',
    labelFr: 'Conduite',
    labelEn: 'Driving',
    descEs: 'Permisos de conducir',
    descFr: 'Permis de conduire',
    descEn: 'Driving licenses',
  },
  FUNCION_PUBLICA: {
    icon: Building,
    labelEs: 'Funcion Publica',
    labelFr: 'Fonction Publique',
    labelEn: 'Public Service',
    descEs: 'Certificados de funcionarios',
    descFr: 'Certificats de fonctionnaires',
    descEn: 'Civil servant certificates',
  },
}

// Sub-type labels moved to SELECTION steps in each workflow definition.
// The wizard SELECTION step renders options with labels and descriptions from backend config.

export default function NewServiceRequestPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as string) || 'es'
  const t = useTranslations('service_requests')

  // State
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>([])
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  // Dialog state removed — SELECTION step in wizard handles sub_type choice
  // Dialog state removed — SELECTION step in wizard handles sub_type choice
  const [isStarting, setIsStarting] = useState(false)

  const { loadWorkflows, startWorkflow, isLoading, error, clearError } = useServiceRequests()

  // Load workflows on mount
  useEffect(() => {
    const loadData = async () => {
      const data = await loadWorkflows()
      setWorkflows(data)
    }
    loadData()
  }, [loadWorkflows])

  // Group workflows by category
  // FUNCION_PUBLICA is excluded - only accessible via /funcionario menu
  const workflowsByCategory = useMemo(() => {
    const groups: Record<string, WorkflowConfig[]> = {}
    workflows.forEach((w) => {
      // Exclude FUNCION_PUBLICA - accessible only through dedicated funcionario menu
      if (w.category === 'FUNCION_PUBLICA') {
        return
      }
      if (!groups[w.category]) {
        groups[w.category] = []
      }
      groups[w.category].push(w)
    })
    return groups
  }, [workflows])

  // Filter workflows by search, grouped by category
  const filteredWorkflowsByCategory = useMemo(() => {
    if (!searchQuery.trim()) return workflowsByCategory
    const query = searchQuery.toLowerCase()
    const filtered: Record<string, WorkflowConfig[]> = {}
    Object.entries(workflowsByCategory).forEach(([category, wfs]) => {
      const matchingWfs = wfs.filter(
        (w) =>
          w.workflowCode.toLowerCase().includes(query) ||
          w.serviceNameEs.toLowerCase().includes(query) ||
          w.entityCode.toLowerCase().includes(query)
      )
      if (matchingWfs.length > 0) {
        filtered[category] = matchingWfs
      }
    })
    return filtered
  }, [workflowsByCategory, searchQuery])

  // Get category label
  const getCategoryLabel = (category: string): string => {
    const config = CATEGORY_CONFIG[category]
    if (!config) return category
    return locale === 'es' ? config.labelEs : locale === 'fr' ? config.labelFr : config.labelEn
  }

  // Get category description
  const getCategoryDesc = (category: string): string => {
    const config = CATEGORY_CONFIG[category]
    if (!config) return ''
    return locale === 'es' ? config.descEs : locale === 'fr' ? config.descFr : config.descEn
  }

  // Handle category click
  const handleCategoryClick = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category)
  }

  // Handle workflow selection — start wizard directly, SELECTION step handles sub_type
  const handleWorkflowSelect = (workflow: WorkflowConfig) => {
    startNewRequest(workflow.workflowCode)
  }

  // Start new request
  const startNewRequest = async (workflowCode: string) => {
    setIsStarting(true)
    try {
      // Cache-first wizard: create session in Redis, no DB writes
      if (FEATURE_CACHE_FIRST_WIZARD) {
        const session = await wizardSessionApi.createSession({
          workflow_code: workflowCode,
          solicitud_type: 'expedicion',
        })
        if (session) {
          router.push(`/${locale}/dashboard/service-requests/wizard/session/${session.sessionId}`)
        }
        return
      }

      // Legacy flow: create DB record, then redirect
      const request = await startWorkflow({
        workflowCode,
      })

      if (request) {
        // Workflows with dedicated wizard go directly to wizard page
        const workflowPrefixesWithWizard = ['PASAPORTE']
        const hasWizard = workflowPrefixesWithWizard.some(prefix => workflowCode.startsWith(prefix))

        if (hasWizard) {
          router.push(`/${locale}/dashboard/service-requests/${request.id}/wizard`)
        } else {
          // Other workflows go to detail page
          router.push(`/${locale}/dashboard/service-requests/${request.id}`)
        }
      }
    } catch (err) {
      console.error('Failed to start workflow:', err)
    } finally {
      setIsStarting(false)
    }
  }

  // Get workflow features icons
  const getWorkflowFeatures = (workflow: WorkflowConfig) => {
    const features: { icon: React.ElementType; label: string }[] = []

    if (workflow.requiresAgentReview) {
      features.push({
        icon: User,
        label: locale === 'es' ? 'Revision de agente' : locale === 'fr' ? 'Revision agent' : 'Agent review',
      })
    }
    if (workflow.requiresAppointment) {
      features.push({
        icon: Calendar,
        label: locale === 'es' ? 'Requiere cita' : locale === 'fr' ? 'Rendez-vous requis' : 'Appointment required',
      })
    }
    if (workflow.requiresNotaIngreso) {
      features.push({
        icon: CreditCard,
        label: locale === 'es' ? 'Nota de ingreso' : locale === 'fr' ? 'Note de versement' : 'Payment note',
      })
    }

    return features
  }

  const categoriesWithWorkflows = Object.keys(filteredWorkflowsByCategory)

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/${locale}/dashboard/service-requests`)}
        className="text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('back')}
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('newRequest')}</h1>
        <p className="text-muted-foreground">
          {locale === 'es'
            ? 'Selecciona una categoria para ver los tramites disponibles'
            : locale === 'fr'
              ? 'Selectionnez une categorie pour voir les demarches disponibles'
              : 'Select a category to see available services'}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {typeof error === 'string' ? error : 'Une erreur est survenue'}
            <Button variant="link" size="sm" onClick={clearError} className="ml-2">
              {t('close')}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t('search_placeholder') || 'Buscar tramite...'}
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {isLoading && workflows.length === 0 && (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">{t('loading')}</p>
          </div>
        </div>
      )}

      {/* Category Grid with Collapsible Cards */}
      {workflows.length > 0 && (
        <div className="space-y-4">
          {categoriesWithWorkflows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {locale === 'es'
                  ? 'No se encontraron tramites'
                  : locale === 'fr'
                    ? 'Aucune demarche trouvee'
                    : 'No services found'}
              </p>
              <p className="text-sm">
                {locale === 'es'
                  ? 'Intenta con otros terminos de busqueda'
                  : locale === 'fr'
                    ? "Essayez avec d'autres termes de recherche"
                    : 'Try different search terms'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoriesWithWorkflows.map((category) => {
                const CategoryIcon = CATEGORY_CONFIG[category]?.icon || FileText
                const workflowsInCategory = filteredWorkflowsByCategory[category] || []
                const isExpanded = expandedCategory === category

                return (
                  <Collapsible
                    key={category}
                    open={isExpanded}
                    onOpenChange={() => handleCategoryClick(category)}
                  >
                    <Card className={`transition-all ${isExpanded ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${isExpanded ? 'bg-primary text-primary-foreground' : 'bg-primary/10'}`}>
                                <CategoryIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{getCategoryLabel(category)}</CardTitle>
                                <CardDescription className="text-sm">{getCategoryDesc(category)}</CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{workflowsInCategory.length}</Badge>
                              <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="space-y-2 border-t pt-4">
                            {workflowsInCategory.map((workflow) => {
                              const features = getWorkflowFeatures(workflow)

                              return (
                                <div
                                  key={workflow.workflowCode}
                                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors group"
                                  onClick={() => handleWorkflowSelect(workflow)}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{workflow.serviceNameEs}</p>
                                    <p className="text-sm text-muted-foreground truncate">{workflow.entityCode}</p>
                                    {features.length > 0 && (
                                      <div className="flex gap-2 mt-1">
                                        {features.slice(0, 2).map((feature, idx) => {
                                          const FeatureIcon = feature.icon
                                          return (
                                            <span key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                                              <FeatureIcon className="h-3 w-3" />
                                              {feature.label}
                                            </span>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary flex-shrink-0 ml-2" />
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Starting Loading Overlay */}
      {isStarting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">
              {locale === 'es'
                ? 'Iniciando tu solicitud...'
                : locale === 'fr'
                  ? 'Demarrage de votre demande...'
                  : 'Starting your request...'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
