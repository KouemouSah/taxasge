'use client'

/**
 * Documents Upload Page
 * Full page for uploading required documents based on workflow configuration
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  Loader2,
  XCircle,
  ExternalLink,
  Trash2,
  ArrowRight,
} from 'lucide-react'
import { useServiceRequests } from '@/modules/service-requests'
import type { WorkflowConfig } from '@/modules/service-requests'

// Document requirement interface matching workflow
interface DocumentRequirement {
  documentCode: string
  documentNameEs: string
  isRequired: boolean
  instructionsEs?: string
  acceptedFormats?: string[]
}

export default function DocumentsUploadPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const requestId = params.id as string
  const t = useTranslations('service_requests')

  const {
    currentRequest,
    documents,
    isLoading,
    error,
    loadRequest,
    loadDocuments,
    loadWorkflows,
    uploadDocument,
    clearError,
  } = useServiceRequests()

  // Local state for workflows
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>([])

  // Upload state
  const [uploadingDocCode, setUploadingDocCode] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Load request and documents on mount
  useEffect(() => {
    if (requestId) {
      loadRequest(requestId)
      loadDocuments()
      loadWorkflows().then(setWorkflows)
    }
  }, [requestId, loadRequest, loadDocuments, loadWorkflows])

  // Get required documents based on workflow and sub_type
  const getRequiredDocuments = useCallback((): DocumentRequirement[] => {
    if (!currentRequest || !workflows) return []

    const workflow = workflows.find(w => w.workflowCode === currentRequest.workflowCode)
    if (!workflow) {
      // Fallback to generic document list
      return [
        { documentCode: 'dip_gq', documentNameEs: 'DIP Guinea Ecuatorial', isRequired: true },
        { documentCode: 'foto_carnet', documentNameEs: 'Fotografía tipo carnet', isRequired: true },
      ]
    }

    // Use workflow's required documents filtered by sub_type
    // For now return basic requirements - the workflow should provide this
    const subType = currentRequest.subType?.toUpperCase() || 'EXPEDICION'

    // Map common workflow codes to their document requirements
    const workflowDocuments: Record<string, Record<string, DocumentRequirement[]>> = {
      'PASAPORTE_NUEVO': {
        'NUEVO': [
          { documentCode: 'dip', documentNameEs: 'Documento de Identidad Personal (DIP)', isRequired: true, instructionsEs: 'Escanee ambas caras de su DIP' },
          { documentCode: 'certificado_nacimiento', documentNameEs: 'Certificado de Nacimiento', isRequired: true, instructionsEs: 'Certificación literal de inscripción de nacimiento' },
          { documentCode: 'photo_carnet', documentNameEs: 'Fotografías tipo pasaporte (x2)', isRequired: true, instructionsEs: '2 fotos de 35x45mm, fondo blanco, rostro visible' },
        ],
        'RENOVACION': [
          { documentCode: 'dip', documentNameEs: 'Documento de Identidad Personal (DIP)', isRequired: true },
          { documentCode: 'pasaporte_antiguo', documentNameEs: 'Pasaporte Antiguo', isRequired: true, instructionsEs: 'Escanee la página de datos de su pasaporte actual' },
          { documentCode: 'photo_carnet', documentNameEs: 'Fotografías tipo pasaporte (x2)', isRequired: true },
        ],
        'PERDIDA': [
          { documentCode: 'dip', documentNameEs: 'Documento de Identidad Personal (DIP)', isRequired: true },
          { documentCode: 'denuncia_policial', documentNameEs: 'Denuncia Policial', isRequired: true, instructionsEs: 'Denuncia de pérdida de la Policía Nacional' },
          { documentCode: 'photo_carnet', documentNameEs: 'Fotografías tipo pasaporte (x2)', isRequired: true },
        ],
        'ROBO': [
          { documentCode: 'dip', documentNameEs: 'Documento de Identidad Personal (DIP)', isRequired: true },
          { documentCode: 'denuncia_policial', documentNameEs: 'Denuncia Policial', isRequired: true, instructionsEs: 'Denuncia de robo de la Policía Nacional' },
          { documentCode: 'photo_carnet', documentNameEs: 'Fotografías tipo pasaporte (x2)', isRequired: true },
        ],
        'DETERIORO': [
          { documentCode: 'dip', documentNameEs: 'Documento de Identidad Personal (DIP)', isRequired: true },
          { documentCode: 'pasaporte_antiguo', documentNameEs: 'Pasaporte Deteriorado', isRequired: true, instructionsEs: 'Escanee la página de datos de su pasaporte deteriorado' },
          { documentCode: 'photo_carnet', documentNameEs: 'Fotografías tipo pasaporte (x2)', isRequired: true },
        ],
      },
      'RESIDENCIA': {
        'EXPEDICION': [
          { documentCode: 'pasaporte', documentNameEs: 'Pasaporte Válido', isRequired: true },
          { documentCode: 'foto_carnet', documentNameEs: 'Fotografía tipo carnet', isRequired: true },
          { documentCode: 'contrato_trabajo', documentNameEs: 'Contrato de Trabajo', isRequired: false },
        ],
        'RENOVACION': [
          { documentCode: 'pasaporte', documentNameEs: 'Pasaporte Válido', isRequired: true },
          { documentCode: 'carnet_residencia_antiguo', documentNameEs: 'Carnet de Residencia Actual', isRequired: true },
          { documentCode: 'foto_carnet', documentNameEs: 'Fotografía tipo carnet', isRequired: true },
        ],
      },
    }

    // Get base workflow code (without subtype suffix)
    const baseCode = currentRequest.workflowCode.toUpperCase().split('_').slice(0, -1).join('_') || currentRequest.workflowCode.toUpperCase()
    const workflowDocs = workflowDocuments[currentRequest.workflowCode.toUpperCase()] || workflowDocuments[baseCode]

    if (workflowDocs && workflowDocs[subType]) {
      return workflowDocs[subType]
    }

    // Default fallback
    return [
      { documentCode: 'dip', documentNameEs: 'Documento de Identidad Personal (DIP)', isRequired: true },
      { documentCode: 'foto_carnet', documentNameEs: 'Fotografía tipo carnet', isRequired: true },
    ]
  }, [currentRequest, workflows])

  // Check if document is already uploaded
  const isDocumentUploaded = (docCode: string): boolean => {
    return documents.some(d => d.documentCode === docCode || d.documentCode?.toLowerCase() === docCode.toLowerCase())
  }

  // Get uploaded document for a code
  const getUploadedDocument = (docCode: string) => {
    return documents.find(d => d.documentCode === docCode || d.documentCode?.toLowerCase() === docCode.toLowerCase())
  }

  // Handle file upload
  const handleFileUpload = useCallback(async (docCode: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingDocCode(docCode)
    setUploadError(null)
    setUploadSuccess(null)
    setUploadProgress(10)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 90))
      }, 200)

      await uploadDocument(docCode, file)

      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadSuccess(docCode)

      // Refresh documents
      await loadDocuments()

      setTimeout(() => {
        setUploadProgress(0)
        setUploadingDocCode(null)
      }, 1000)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t('error_upload_failed') || 'Error al subir el documento')
      setUploadProgress(0)
      setUploadingDocCode(null)
    }
  }, [uploadDocument, loadDocuments, t])

  // Calculate progress
  const requiredDocs = getRequiredDocuments()
  const uploadedCount = requiredDocs.filter(doc => isDocumentUploaded(doc.documentCode)).length
  const totalRequired = requiredDocs.filter(doc => doc.isRequired).length
  const allRequiredUploaded = requiredDocs.every(doc => !doc.isRequired || isDocumentUploaded(doc.documentCode))

  // Loading state
  if (isLoading && !currentRequest) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back')}
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => { clearError(); loadRequest(requestId); }}>
          {t('retry')}
        </Button>
      </div>
    )
  }

  if (!currentRequest) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back')}
        </Button>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('no_requests_found')}</AlertTitle>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/${locale}/dashboard/service-requests/${requestId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('upload_documents') || 'Subir Documentos'}
            </h1>
            <p className="text-muted-foreground">
              {currentRequest.requestNumber} - {currentRequest.workflowCode}
            </p>
          </div>
        </div>
        <Badge variant={allRequiredUploaded ? 'default' : 'secondary'}>
          {uploadedCount} / {totalRequired} {t('required') || 'requeridos'}
        </Badge>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('upload_progress') || 'Progreso de carga'}</span>
              <span>{Math.round((uploadedCount / Math.max(totalRequired, 1)) * 100)}%</span>
            </div>
            <Progress value={(uploadedCount / Math.max(totalRequired, 1)) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Sub-type info */}
      {currentRequest.subType && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>{t('sub_type') || 'Tipo de solicitud'}: {currentRequest.subType}</AlertTitle>
          <AlertDescription>
            {t('documents_for_subtype') || 'Los documentos requeridos dependen del tipo de solicitud seleccionado.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Error message */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* Documents List */}
      <div className="space-y-4">
        {requiredDocs.map((doc) => {
          const isUploaded = isDocumentUploaded(doc.documentCode)
          const uploadedDoc = getUploadedDocument(doc.documentCode)
          const isCurrentlyUploading = uploadingDocCode === doc.documentCode
          const justUploaded = uploadSuccess === doc.documentCode

          return (
            <Card
              key={doc.documentCode}
              className={isUploaded ? 'border-green-200 bg-green-50/50' : doc.isRequired ? 'border-orange-200' : ''}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${isUploaded ? 'bg-green-100' : 'bg-muted'}`}>
                      {isUploaded ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{doc.documentNameEs}</h3>
                        {doc.isRequired && (
                          <Badge variant="outline" className="text-xs">
                            {t('required') || 'Requerido'}
                          </Badge>
                        )}
                      </div>

                      {doc.instructionsEs && (
                        <p className="text-sm text-muted-foreground mb-2">{doc.instructionsEs}</p>
                      )}

                      {isUploaded && uploadedDoc && (
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          <span>{uploadedDoc.fileName}</span>
                          {uploadedDoc.fileUrl && (
                            <a
                              href={uploadedDoc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {t('view') || 'Ver'}
                            </a>
                          )}
                        </div>
                      )}

                      {isCurrentlyUploading && (
                        <div className="mt-2 space-y-2">
                          <Progress value={uploadProgress} className="h-2" />
                          <p className="text-sm text-muted-foreground">{t('uploading') || 'Subiendo...'} {uploadProgress}%</p>
                        </div>
                      )}

                      {justUploaded && !isCurrentlyUploading && (
                        <div className="mt-2 flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">{t('upload_success') || 'Documento subido correctamente'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {!isUploaded ? (
                      <div>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          ref={el => { fileInputRefs.current[doc.documentCode] = el }}
                          onChange={(e) => handleFileUpload(doc.documentCode, e)}
                          disabled={isCurrentlyUploading}
                        />
                        <Button
                          onClick={() => fileInputRefs.current[doc.documentCode]?.click()}
                          disabled={isCurrentlyUploading}
                          variant={doc.isRequired ? 'default' : 'outline'}
                        >
                          {isCurrentlyUploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          {t('upload') || 'Subir'}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRefs.current[doc.documentCode]?.click()}
                      >
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          ref={el => { fileInputRefs.current[doc.documentCode] = el }}
                          onChange={(e) => handleFileUpload(doc.documentCode, e)}
                        />
                        {t('replace') || 'Reemplazar'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/dashboard/service-requests/${requestId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back_to_request') || 'Volver a la solicitud'}
        </Button>

        {allRequiredUploaded && (
          <Button onClick={() => router.push(`/${locale}/dashboard/service-requests/${requestId}`)}>
            {t('continue') || 'Continuar'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Accepted formats info */}
      <p className="text-xs text-center text-muted-foreground">
        {t('accepted_formats') || 'Formatos aceptados'}: PDF, JPG, PNG. {t('max_size') || 'Tamaño máximo'}: 5MB
      </p>
    </div>
  )
}
