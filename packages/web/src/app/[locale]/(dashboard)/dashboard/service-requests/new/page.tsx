'use client'

/**
 * New Service Request Page
 * Workflow selection and request creation wizard
 */

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Search,
  FileText,
  Loader2,
  AlertCircle,
  ChevronRight,
  User,
  Globe,
  Car,
  FileSignature,
  Building,
  Calendar,
  CreditCard,
  CheckCircle,
  BadgeCheck,
} from 'lucide-react'
import { useServiceRequests } from '@/modules/service-requests'
import type { WorkflowConfig } from '@/modules/service-requests'

// Category icons and labels
const CATEGORY_CONFIG: Record<
  string,
  { icon: React.ElementType; labelEs: string; labelFr: string; labelEn: string }
> = {
  IDENTIDAD: {
    icon: BadgeCheck,
    labelEs: 'Identidad',
    labelFr: 'Identité',
    labelEn: 'Identity',
  },
  EXTRANJERIA: {
    icon: Globe,
    labelEs: 'Extranjería',
    labelFr: 'Immigration',
    labelEn: 'Immigration',
  },
  VEHICULOS: {
    icon: Car,
    labelEs: 'Vehículos',
    labelFr: 'Véhicules',
    labelEn: 'Vehicles',
  },
  CONTRATOS: {
    icon: FileSignature,
    labelEs: 'Contratos',
    labelFr: 'Contrats',
    labelEn: 'Contracts',
  },
  CONDUCCION: {
    icon: BadgeCheck,
    labelEs: 'Conducción',
    labelFr: 'Conduite',
    labelEn: 'Driving',
  },
  FUNCION_PUBLICA: {
    icon: Building,
    labelEs: 'Función Pública',
    labelFr: 'Fonction Publique',
    labelEn: 'Public Service',
  },
}

// Sub-type labels
const SUB_TYPE_LABELS: Record<string, { es: string; fr: string; en: string }> = {
  expedicion: { es: 'Nueva Expedición', fr: 'Nouvelle Émission', en: 'New Issuance' },
  renovacion: { es: 'Renovación', fr: 'Renouvellement', en: 'Renewal' },
  duplicado: { es: 'Duplicado', fr: 'Duplicata', en: 'Duplicate' },
  EXPEDICION: { es: 'Nueva Expedición', fr: 'Nouvelle Émission', en: 'New Issuance' },
  RENOVACION: { es: 'Renovación', fr: 'Renouvellement', en: 'Renewal' },
  DUPLICADO: { es: 'Duplicado', fr: 'Duplicata', en: 'Duplicate' },
}

export default function NewServiceRequestPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as string) || 'es'
  const t = useTranslations('service_requests')

  // State
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowConfig | null>(null)
  const [selectedSubType, setSelectedSubType] = useState<string>('')
  const [showSubTypeDialog, setShowSubTypeDialog] = useState(false)
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

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(workflows.map((w) => w.category))
    return ['all', ...Array.from(cats)]
  }, [workflows])

  // Filter workflows
  const filteredWorkflows = useMemo(() => {
    let result = workflows

    if (selectedCategory !== 'all') {
      result = result.filter((w) => w.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (w) =>
          w.workflowCode.toLowerCase().includes(query) ||
          w.serviceNameEs.toLowerCase().includes(query) ||
          w.entityCode.toLowerCase().includes(query)
      )
    }

    return result
  }, [workflows, selectedCategory, searchQuery])

  // Get category label
  const getCategoryLabel = (category: string): string => {
    if (category === 'all') {
      return locale === 'es' ? 'Todos' : locale === 'fr' ? 'Tous' : 'All'
    }
    const config = CATEGORY_CONFIG[category]
    if (!config) return category
    return locale === 'es' ? config.labelEs : locale === 'fr' ? config.labelFr : config.labelEn
  }

  // Get sub-type label
  const getSubTypeLabel = (subType: string): string => {
    const labels = SUB_TYPE_LABELS[subType]
    if (!labels) return subType
    return locale === 'es' ? labels.es : locale === 'fr' ? labels.fr : labels.en
  }

  // Handle workflow selection
  const handleWorkflowSelect = (workflow: WorkflowConfig) => {
    setSelectedWorkflow(workflow)

    // If workflow has sub-types, show dialog
    if (workflow.allowedSubTypes && workflow.allowedSubTypes.length > 1) {
      setSelectedSubType(workflow.allowedSubTypes[0])
      setShowSubTypeDialog(true)
    } else {
      // Start workflow directly with first sub-type
      const subType = workflow.allowedSubTypes?.[0] || 'expedicion'
      startNewRequest(workflow.workflowCode, subType)
    }
  }

  // Start new request
  const startNewRequest = async (workflowCode: string, subType: string) => {
    setIsStarting(true)
    try {
      const request = await startWorkflow({
        workflowCode,
        subType,
      })

      if (request) {
        // Redirect to the request detail page
        router.push(`/${locale}/dashboard/service-requests/${request.id}`)
      }
    } catch (err) {
      console.error('Failed to start workflow:', err)
    } finally {
      setIsStarting(false)
      setShowSubTypeDialog(false)
    }
  }

  // Handle sub-type confirmation
  const handleSubTypeConfirm = () => {
    if (selectedWorkflow && selectedSubType) {
      startNewRequest(selectedWorkflow.workflowCode, selectedSubType)
    }
  }

  // Get workflow features icons
  const getWorkflowFeatures = (workflow: WorkflowConfig) => {
    const features: { icon: React.ElementType; label: string }[] = []

    if (workflow.requiresAgentReview) {
      features.push({
        icon: User,
        label: locale === 'es' ? 'Revisión de agente' : locale === 'fr' ? 'Révision agent' : 'Agent review',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('newRequest')}</h1>
            <p className="text-muted-foreground">
              {locale === 'es'
                ? 'Selecciona el tipo de trámite que deseas realizar'
                : locale === 'fr'
                  ? 'Sélectionnez le type de démarche que vous souhaitez effectuer'
                  : 'Select the type of service you want to request'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
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
          placeholder={t('search_placeholder') || 'Buscar trámite...'}
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

      {/* Category Tabs and Workflows */}
      {workflows.length > 0 && (
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            {categories.map((cat) => {
              const Icon = cat === 'all' ? FileText : CATEGORY_CONFIG[cat]?.icon || FileText
              return (
                <TabsTrigger key={cat} value={cat} className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4" />
                  {getCategoryLabel(cat)}
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {cat === 'all'
                      ? workflows.length
                      : workflows.filter((w) => w.category === cat).length}
                  </Badge>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {filteredWorkflows.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">
                  {locale === 'es'
                    ? 'No se encontraron trámites'
                    : locale === 'fr'
                      ? 'Aucune démarche trouvée'
                      : 'No services found'}
                </p>
                <p className="text-sm">
                  {locale === 'es'
                    ? 'Intenta con otros filtros o términos de búsqueda'
                    : locale === 'fr'
                      ? 'Essayez avec d\'autres filtres ou termes de recherche'
                      : 'Try different filters or search terms'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredWorkflows.map((workflow) => {
                  const CategoryIcon = CATEGORY_CONFIG[workflow.category]?.icon || FileText
                  const features = getWorkflowFeatures(workflow)

                  return (
                    <Card
                      key={workflow.workflowCode}
                      className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group"
                      onClick={() => handleWorkflowSelect(workflow)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                              <CategoryIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base line-clamp-2">
                                {workflow.serviceNameEs}
                              </CardTitle>
                              <CardDescription className="text-xs mt-0.5">
                                {workflow.entityCode}
                              </CardDescription>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <Badge variant="outline" className="text-xs">
                            {getCategoryLabel(workflow.category)}
                          </Badge>
                          {workflow.allowedSubTypes?.length > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              {workflow.allowedSubTypes.length} tipos
                            </Badge>
                          )}
                        </div>

                        {features.length > 0 && (
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {features.slice(0, 3).map((feature, index) => {
                              const FeatureIcon = feature.icon
                              return (
                                <div key={index} className="flex items-center gap-1">
                                  <FeatureIcon className="h-3 w-3" />
                                  <span>{feature.label}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        <div className="mt-4 pt-3 border-t">
                          <Button variant="ghost" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {locale === 'es' ? 'Iniciar trámite' : locale === 'fr' ? 'Commencer' : 'Start'}
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Sub-Type Selection Dialog */}
      <Dialog open={showSubTypeDialog} onOpenChange={setShowSubTypeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {locale === 'es'
                ? 'Tipo de Solicitud'
                : locale === 'fr'
                  ? 'Type de Demande'
                  : 'Request Type'}
            </DialogTitle>
            <DialogDescription>
              {selectedWorkflow?.serviceNameEs}
            </DialogDescription>
          </DialogHeader>

          <RadioGroup value={selectedSubType} onValueChange={setSelectedSubType} className="space-y-3">
            {selectedWorkflow?.allowedSubTypes?.map((subType) => (
              <div
                key={subType}
                className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                  selectedSubType === subType
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedSubType(subType)}
              >
                <RadioGroupItem value={subType} id={subType} />
                <Label htmlFor={subType} className="cursor-pointer flex-1">
                  <span className="font-medium">{getSubTypeLabel(subType)}</span>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {subType === 'expedicion' || subType === 'EXPEDICION'
                      ? locale === 'es'
                        ? 'Primera vez que solicitas este documento'
                        : locale === 'fr'
                          ? 'Première demande de ce document'
                          : 'First time requesting this document'
                      : subType === 'renovacion' || subType === 'RENOVACION'
                        ? locale === 'es'
                          ? 'Ya tienes este documento y está por vencer o vencido'
                          : locale === 'fr'
                            ? 'Vous avez déjà ce document qui expire ou est expiré'
                            : 'You already have this document and it\'s expiring or expired'
                        : locale === 'es'
                          ? 'Necesitas una copia por pérdida o deterioro'
                          : locale === 'fr'
                            ? 'Vous avez besoin d\'une copie pour perte ou détérioration'
                            : 'You need a copy due to loss or damage'}
                  </p>
                </Label>
                {selectedSubType === subType && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
            ))}
          </RadioGroup>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowSubTypeDialog(false)}>
              {locale === 'es' ? 'Cancelar' : locale === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button onClick={handleSubTypeConfirm} disabled={!selectedSubType || isStarting}>
              {isStarting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {locale === 'es' ? 'Iniciando...' : locale === 'fr' ? 'Démarrage...' : 'Starting...'}
                </>
              ) : (
                <>
                  {locale === 'es' ? 'Continuar' : locale === 'fr' ? 'Continuer' : 'Continue'}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Starting Loading Overlay */}
      {isStarting && !showSubTypeDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">
              {locale === 'es'
                ? 'Iniciando tu solicitud...'
                : locale === 'fr'
                  ? 'Démarrage de votre demande...'
                  : 'Starting your request...'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
