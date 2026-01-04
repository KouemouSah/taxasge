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
  ChevronDown,
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

// Sub-type labels
// Sub-type labels including passport-specific types (NUEVO, PERDIDA, ROBO, DETERIORO)
// These must match pasaporte_workflow.py allowed_sub_types
const SUB_TYPE_LABELS: Record<string, { es: string; fr: string; en: string; desc_es: string; desc_fr: string; desc_en: string }> = {
  // Generic types (used by SolicitudType enum)
  expedicion: {
    es: 'Nueva Expedicion', fr: 'Nouvelle Emission', en: 'New Issuance',
    desc_es: 'Primera vez que solicitas este documento',
    desc_fr: "Premiere demande de ce document",
    desc_en: 'First time requesting this document'
  },
  renovacion: {
    es: 'Renovacion', fr: 'Renouvellement', en: 'Renewal',
    desc_es: 'Ya tienes este documento y esta por vencer o vencido',
    desc_fr: "Vous avez deja ce document qui expire ou est expire",
    desc_en: 'You already have this document and it is expiring or expired'
  },
  duplicado: {
    es: 'Duplicado', fr: 'Duplicata', en: 'Duplicate',
    desc_es: 'Necesitas una copia por perdida o deterioro',
    desc_fr: "Vous avez besoin d'une copie pour perte ou deterioration",
    desc_en: 'You need a copy due to loss or damage'
  },
  // Passport-specific sub-types (from pasaporte_workflow.py)
  NUEVO: {
    es: 'Nuevo Pasaporte', fr: 'Nouveau Passeport', en: 'New Passport',
    desc_es: 'Primera vez que solicitas pasaporte (requiere certificado de nacimiento)',
    desc_fr: "Premiere demande de passeport (certificat de naissance requis)",
    desc_en: 'First passport request (birth certificate required)'
  },
  RENOVACION: {
    es: 'Renovacion', fr: 'Renouvellement', en: 'Renewal',
    desc_es: 'Tu pasaporte esta por vencer o ya vencio',
    desc_fr: "Votre passeport expire bientot ou est deja expire",
    desc_en: 'Your passport is expiring or has expired'
  },
  PERDIDA: {
    es: 'Perdida', fr: 'Perte', en: 'Loss',
    desc_es: 'Perdiste tu pasaporte (requiere denuncia policial)',
    desc_fr: "Vous avez perdu votre passeport (declaration de perte requise)",
    desc_en: 'You lost your passport (police report required)'
  },
  ROBO: {
    es: 'Robo', fr: 'Vol', en: 'Theft',
    desc_es: 'Te robaron tu pasaporte (requiere denuncia policial)',
    desc_fr: "Votre passeport a ete vole (declaration de vol requise)",
    desc_en: 'Your passport was stolen (police report required)'
  },
  DETERIORO: {
    es: 'Deterioro', fr: 'Deterioration', en: 'Damage',
    desc_es: 'Tu pasaporte esta danado (debes presentar el pasaporte danado)',
    desc_fr: "Votre passeport est endommage (vous devez presenter le passeport endommage)",
    desc_en: 'Your passport is damaged (you must present the damaged passport)'
  },
  // Uppercase generic (for backward compatibility)
  EXPEDICION: {
    es: 'Nueva Expedicion', fr: 'Nouvelle Emission', en: 'New Issuance',
    desc_es: 'Primera vez que solicitas este documento',
    desc_fr: "Premiere demande de ce document",
    desc_en: 'First time requesting this document'
  },
  DUPLICADO: {
    es: 'Duplicado', fr: 'Duplicata', en: 'Duplicate',
    desc_es: 'Necesitas una copia por perdida o deterioro',
    desc_fr: "Vous avez besoin d'une copie pour perte ou deterioration",
    desc_en: 'You need a copy due to loss or damage'
  },
}

export default function NewServiceRequestPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as string) || 'es'
  const t = useTranslations('service_requests')

  // State
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>([])
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
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

  // Group workflows by category
  const workflowsByCategory = useMemo(() => {
    const groups: Record<string, WorkflowConfig[]> = {}
    workflows.forEach((w) => {
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

  // Get sub-type label
  const getSubTypeLabel = (subType: string): string => {
    const labels = SUB_TYPE_LABELS[subType]
    if (!labels) return subType
    return locale === 'es' ? labels.es : locale === 'fr' ? labels.fr : labels.en
  }

  // Handle category click
  const handleCategoryClick = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category)
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
        // Workflows with dedicated wizard go directly to wizard page
        const workflowsWithWizard = ['PASAPORTE']
        if (workflowsWithWizard.includes(workflowCode)) {
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
                    {SUB_TYPE_LABELS[subType]
                      ? locale === 'es'
                        ? SUB_TYPE_LABELS[subType].desc_es
                        : locale === 'fr'
                          ? SUB_TYPE_LABELS[subType].desc_fr
                          : SUB_TYPE_LABELS[subType].desc_en
                      : subType}
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
                  {locale === 'es' ? 'Iniciando...' : locale === 'fr' ? 'Demarrage...' : 'Starting...'}
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
                  ? 'Demarrage de votre demande...'
                  : 'Starting your request...'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
