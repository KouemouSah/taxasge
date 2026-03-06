/**
 * Generic Agent Request Detail Page
 *
 * Dynamic detail view for service requests with:
 * - Tab RESUMEN: Form data displayed according to workflow schema
 * - Tab DOCUMENTOS: List of uploaded documents with preview
 * - Tab TRAITEMENT: Agent verification checklist and actions
 *
 * @module agent/[entityCode]/request/[requestId]
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Icons
import {
  ArrowLeft,
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Calendar,
  Clock,
  MapPin,
  ClipboardCheck,
  FileImage,
  Save,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// API
import {
  agentRequestsApi,
  getDocumentDownloadUrl,
  type ServiceRequestDetail,
  type FormDisplaySchema,
  type AgentChecklistItem,
} from '@/modules/agent-dashboard/services/agent-requests-api';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get value from nested object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj as unknown);
}

/**
 * Format value based on field type
 */
function formatFieldValue(
  value: unknown,
  type: string,
  defaultValue?: string
): string {
  if (value === undefined || value === null || value === '') {
    return defaultValue || '-';
  }

  switch (type) {
    case 'date':
      try {
        return new Date(String(value)).toLocaleDateString('es-ES');
      } catch {
        return String(value);
      }
    case 'datetime':
      try {
        return new Date(String(value)).toLocaleString('es-ES');
      } catch {
        return String(value);
      }
    case 'status':
      return String(value).toUpperCase();
    default:
      return String(value);
  }
}

/**
 * Get status badge variant
 */
function getStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const statusUpper = status.toUpperCase();
  if (
    statusUpper.includes('COMPLETED') ||
    statusUpper.includes('APPROVED') ||
    statusUpper.includes('VERIFIED')
  ) {
    return 'default';
  }
  if (statusUpper.includes('REJECTED') || statusUpper.includes('FAILED')) {
    return 'destructive';
  }
  if (statusUpper.includes('PENDING') || statusUpper.includes('DRAFT')) {
    return 'secondary';
  }
  return 'outline';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AgentRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('agentDashboard');
  const queryClient = useQueryClient();

  const requestId = params.requestId as string;
  const entitySlug = (params.entityCode as string) || '';
  const locale = useLocale();

  // State
  const [activeTab, setActiveTab] = useState('resumen');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [checklistNotes, setChecklistNotes] = useState('');
  const [hasChecklistChanges, setHasChecklistChanges] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{
    url: string;
    name: string;
    mimeType: string;
  } | null>(null);

  // Navigation state - loaded from sessionStorage
  const [requestIds, setRequestIds] = useState<string[]>([]);

  // Load request IDs from sessionStorage on mount
  useEffect(() => {
    const storedIds = sessionStorage.getItem('agent-request-ids');
    if (storedIds) {
      try {
        setRequestIds(JSON.parse(storedIds));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Navigation helpers
  const currentIndex = requestIds.indexOf(requestId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < requestIds.length - 1;

  const navigateTo = useCallback((targetId: string) => {
    const basePath = `/${locale}/dashboard/agent/${entitySlug}/request/${targetId}`;
    router.push(basePath);
  }, [router, locale, entitySlug]);

  const goToPrev = useCallback(() => {
    if (hasPrev) {
      navigateTo(requestIds[currentIndex - 1]);
    }
  }, [hasPrev, requestIds, currentIndex, navigateTo]);

  const goToNext = useCallback(() => {
    if (hasNext) {
      navigateTo(requestIds[currentIndex + 1]);
    }
  }, [hasNext, requestIds, currentIndex, navigateTo]);

  // Fetch request detail
  const {
    data: request,
    isLoading: isLoadingRequest,
    error: requestError,
  } = useQuery({
    queryKey: ['agent-request-detail', requestId],
    queryFn: () => agentRequestsApi.getRequestDetail(requestId),
    enabled: !!requestId,
  });

  // Fetch workflow schema
  const { data: workflowSchema, isLoading: isLoadingSchema } = useQuery({
    queryKey: ['workflow-schema', request?.workflowCode],
    queryFn: () => agentRequestsApi.getWorkflowSchema(request!.workflowCode),
    enabled: !!request?.workflowCode,
  });

  // Initialize checklist from request data
  useEffect(() => {
    if (request?.verificationDetails?.checklist) {
      setChecklist(request.verificationDetails.checklist);
    } else if (workflowSchema?.agentChecklist) {
      // Initialize with all items unchecked
      const initial: Record<string, boolean> = {};
      workflowSchema.agentChecklist.forEach((item) => {
        initial[item.id] = false;
      });
      setChecklist(initial);
    }
    if (request?.verificationDetails?.notes) {
      setChecklistNotes(request.verificationDetails.notes);
    }
  }, [request, workflowSchema]);

  // Update verification mutation
  const updateVerificationMutation = useMutation({
    mutationFn: (data: { checklist: Record<string, boolean>; notes?: string }) =>
      agentRequestsApi.updateVerification(requestId, {
        checklist: data.checklist,
        notes: data.notes,
      }),
    onSuccess: () => {
      setHasChecklistChanges(false);
      queryClient.invalidateQueries({ queryKey: ['agent-request-detail', requestId] });
    },
  });

  // Decision mutation
  const decisionMutation = useMutation({
    mutationFn: (data: {
      decision: 'approve' | 'reject';
      comments?: string;
      rejectionReason?: string;
    }) =>
      agentRequestsApi.makeDecision(requestId, data.decision, {
        comments: data.comments,
        rejectionReason: data.rejectionReason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-request-detail', requestId] });
      router.back();
    },
  });

  // Handle checklist change
  const handleChecklistChange = useCallback((itemId: string, checked: boolean) => {
    setChecklist((prev) => ({ ...prev, [itemId]: checked }));
    setHasChecklistChanges(true);
  }, []);

  // Save checklist
  const handleSaveChecklist = useCallback(() => {
    updateVerificationMutation.mutate({
      checklist,
      notes: checklistNotes,
    });
  }, [checklist, checklistNotes, updateVerificationMutation]);

  // Handle approve - direct action without dialog
  const handleApprove = useCallback(() => {
    // Check if all required items are checked
    if (workflowSchema?.agentChecklist) {
      const allRequiredChecked = workflowSchema.agentChecklist
        .filter((item) => item.required)
        .every((item) => checklist[item.id]);

      if (!allRequiredChecked) {
        alert(t('detail.checklistIncomplete') || 'Por favor complete todos los items requeridos de la verificación.');
        return;
      }
    }
    // Direct approve action
    decisionMutation.mutate({
      decision: 'approve',
      comments: checklistNotes,
    });
  }, [workflowSchema, checklist, t, decisionMutation, checklistNotes]);

  // Handle reject - show inline input
  const handleReject = useCallback(() => {
    setShowRejectInput(true);
  }, []);

  // Confirm reject
  const confirmReject = useCallback(() => {
    if (!rejectReason.trim()) {
      return;
    }
    decisionMutation.mutate({
      decision: 'reject',
      rejectionReason: rejectReason,
      comments: checklistNotes,
    });
  }, [decisionMutation, rejectReason, checklistNotes]);

  // Loading state
  if (isLoadingRequest || isLoadingSchema) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (requestError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-3 py-6">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <div>
            <p className="font-medium text-red-700">
              {t('detail.loadError') || 'Error al cargar la solicitud'}
            </p>
            <p className="text-sm text-red-600">
              {requestError instanceof Error ? requestError.message : 'Error desconocido'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!request) {
    return null;
  }

  const formDisplaySchema = workflowSchema?.formDisplaySchema;
  const agentChecklistItems = workflowSchema?.agentChecklist || [];

  // Get photo URL if defined in schema
  const photoUrl = formDisplaySchema?.photoField
    ? (getNestedValue(request.formData, formDisplaySchema.photoField) as string)
    : null;

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{request.reference}</h1>
          <p className="text-muted-foreground">
            {workflowSchema?.name || request.workflowCode}
          </p>
        </div>
        <Badge variant={getStatusBadgeVariant(request.status)}>{request.status}</Badge>

        {/* Navigation Prev/Next */}
        {requestIds.length > 0 && (
          <div className="flex items-center gap-1 ml-4 border-l pl-4">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrev}
              disabled={!hasPrev}
              title={t('detail.previousRequest') || 'Solicitud anterior'}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {currentIndex + 1} / {requestIds.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              disabled={!hasNext}
              title={t('detail.nextRequest') || 'Solicitud siguiente'}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resumen" className="gap-2">
            <FileText className="h-4 w-4" />
            {t('detail.tabs.resumen') || 'Resumen'}
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-2">
            <FileImage className="h-4 w-4" />
            {t('detail.tabs.documentos') || 'Documentos'}
          </TabsTrigger>
          <TabsTrigger value="traitement" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            {t('detail.tabs.traitement') || 'Traitement'}
          </TabsTrigger>
        </TabsList>

        {/* Tab RESUMEN */}
        <TabsContent value="resumen" className="mt-6">
          <ResumenTab
            request={request}
            formDisplaySchema={formDisplaySchema}
            photoUrl={photoUrl}
          />
        </TabsContent>

        {/* Tab DOCUMENTOS */}
        <TabsContent value="documentos" className="mt-6">
          <DocumentosTab
            requestId={requestId}
            documents={request.providedDocuments || []}
            onPreview={setPreviewDocument}
          />
        </TabsContent>

        {/* Tab TRAITEMENT */}
        <TabsContent value="traitement" className="mt-6">
          <TraitementTab
            checklistItems={agentChecklistItems}
            checklist={checklist}
            notes={checklistNotes}
            hasChanges={hasChecklistChanges}
            isSaving={updateVerificationMutation.isPending}
            isDeciding={decisionMutation.isPending}
            onChecklistChange={handleChecklistChange}
            onNotesChange={setChecklistNotes}
            onSave={handleSaveChecklist}
            onApprove={handleApprove}
            onReject={handleReject}
            onConfirmReject={confirmReject}
            showRejectInput={showRejectInput}
            rejectReason={rejectReason}
            onRejectReasonChange={setRejectReason}
            onCancelReject={() => {
              setShowRejectInput(false);
              setRejectReason('');
            }}
            canMakeDecision={request.status === 'SUBMITTED' || request.status === 'UNDER_REVIEW'}
          />
        </TabsContent>
      </Tabs>

      {/* Document Preview Dialog */}
      {previewDocument && (
        <Dialog open={!!previewDocument} onOpenChange={() => setPreviewDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{previewDocument.name}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center min-h-[400px] bg-gray-100 rounded">
              {previewDocument.mimeType.startsWith('image/') ? (
                <img
                  src={previewDocument.url}
                  alt={previewDocument.name}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : previewDocument.mimeType === 'application/pdf' ? (
                <iframe
                  src={previewDocument.url}
                  className="w-full h-[70vh]"
                  title={previewDocument.name}
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4" />
                  <p>{t('detail.previewNotAvailable') || 'Vista previa no disponible'}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Tab RESUMEN - Display form data according to schema
 */
function ResumenTab({
  request,
  formDisplaySchema,
  photoUrl,
}: {
  request: ServiceRequestDetail;
  formDisplaySchema: FormDisplaySchema | null | undefined;
  photoUrl: string | null;
}) {
  const t = useTranslations('agentDashboard');

  if (!formDisplaySchema) {
    // Fallback: display raw form_data
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('detail.formData') || 'Datos del Formulario'}</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto max-h-[500px]">
            {JSON.stringify(request.formData, null, 2)}
          </pre>
        </CardContent>
      </Card>
    );
  }

  // Group sections by column
  const leftSections = formDisplaySchema.sections.filter((s) => s.column === 'left');
  const rightSections = formDisplaySchema.sections.filter((s) => s.column === 'right');

  return (
    <div className="space-y-6">
      {/* Title */}
      <h2 className="text-xl font-semibold">{formDisplaySchema.title}</h2>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Photo if available */}
          {photoUrl && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-center">
                  <div className="w-32 h-40 relative border rounded overflow-hidden">
                    <Image
                      src={photoUrl}
                      alt="Photo"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {leftSections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              request={request}
            />
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {rightSections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              request={request}
            />
          ))}
        </div>
      </div>

      {/* Appointment Info if available */}
      {(request.citaDate || request.citaLocation) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('detail.appointment') || 'Cita'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {request.citaDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{request.citaDate}</span>
                </div>
              )}
              {request.citaTime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{request.citaTime}</span>
                </div>
              )}
              {request.citaLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{request.citaLocation}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Section Card Component
 */
function SectionCard({
  section,
  request,
}: {
  section: { id: string; title: string; fields: Array<{
    key: string;
    label: string;
    type: string;
    source?: string;
    default?: string;
  }> };
  request: ServiceRequestDetail;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{section.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {section.fields.map((field) => {
            let value: unknown;

            // Get value based on source
            if (field.source === 'request') {
              value = getNestedValue(request as unknown as Record<string, unknown>, field.key);
            } else if (field.source === 'appointment') {
              // Map appointment fields
              if (field.key === 'cita_location') {
                value = request.citaLocation;
              } else if (field.key === 'cita_date') {
                value = request.citaDate;
              }
            } else {
              // Default: get from form_data
              value = getNestedValue(request.formData, field.key);
            }

            const displayValue = formatFieldValue(value, field.type, field.default);

            return (
              <div key={field.key} className="flex justify-between items-start py-1">
                <span className="text-sm text-muted-foreground">{field.label}</span>
                <span className="text-sm font-medium text-right max-w-[60%]">
                  {field.type === 'status' ? (
                    <Badge variant={getStatusBadgeVariant(displayValue)}>
                      {displayValue}
                    </Badge>
                  ) : (
                    displayValue
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Tab DOCUMENTOS - List of uploaded documents with preview
 */
function DocumentosTab({
  requestId,
  documents,
  onPreview,
}: {
  requestId: string;
  documents: Array<{
    id: string;
    documentCode: string;
    documentName: string;
    filePath: string;
    fileName: string;
    mimeType: string;
    validationStatus?: string;
  }>;
  onPreview: (doc: { url: string; name: string; mimeType: string } | null) => void;
}) {
  const t = useTranslations('agentDashboard');
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);

  const handlePreview = useCallback(async (doc: typeof documents[0]) => {
    setLoadingDoc(doc.id);
    try {
      const url = await getDocumentDownloadUrl(requestId, doc.documentCode);
      onPreview({
        url,
        name: doc.fileName,
        mimeType: doc.mimeType,
      });
    } catch (error) {
      console.error('Failed to get document URL:', error);
      alert(t('detail.documentUrlError') || 'Error al cargar el documento');
    } finally {
      setLoadingDoc(null);
    }
  }, [requestId, onPreview, t]);

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileImage className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold">{t('detail.noDocuments') || 'Sin documentos'}</h3>
          <p className="text-muted-foreground text-sm">
            {t('detail.noDocumentsDescription') || 'No hay documentos cargados para esta solicitud'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="h-5 w-5" />
          {t('detail.documents') || 'Documentos'} ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">{doc.documentName}</p>
                  <p className="text-sm text-muted-foreground">{doc.fileName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {doc.validationStatus && (
                  <Badge
                    variant={
                      doc.validationStatus === 'validated'
                        ? 'default'
                        : doc.validationStatus === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {doc.validationStatus === 'validated' && (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    )}
                    {doc.validationStatus === 'rejected' && (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {doc.validationStatus}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreview(doc)}
                  disabled={loadingDoc === doc.id}
                >
                  {loadingDoc === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Tab TRAITEMENT - Agent verification checklist and actions
 */
function TraitementTab({
  checklistItems,
  checklist,
  notes,
  hasChanges,
  isSaving,
  isDeciding,
  onChecklistChange,
  onNotesChange,
  onSave,
  onApprove,
  onReject,
  onConfirmReject,
  showRejectInput,
  rejectReason,
  onRejectReasonChange,
  onCancelReject,
  canMakeDecision,
}: {
  checklistItems: AgentChecklistItem[];
  checklist: Record<string, boolean>;
  notes: string;
  hasChanges: boolean;
  isSaving: boolean;
  isDeciding: boolean;
  onChecklistChange: (itemId: string, checked: boolean) => void;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  onApprove: () => void;
  onReject: () => void;
  onConfirmReject: () => void;
  showRejectInput: boolean;
  rejectReason: string;
  onRejectReasonChange: (reason: string) => void;
  onCancelReject: () => void;
  canMakeDecision: boolean;
}) {
  const t = useTranslations('agentDashboard');

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = checklistItems.length;
  const requiredItems = checklistItems.filter((item) => item.required);
  const allRequiredChecked = requiredItems.every((item) => checklist[item.id]);

  return (
    <div className="space-y-6">
      {/* Verification Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              {t('detail.verificationChecklist') || 'Verificación Rápida'}
            </span>
            <Badge variant={allRequiredChecked ? 'default' : 'secondary'}>
              {completedCount}/{totalCount}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checklistItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {t('detail.noChecklistItems') || 'No hay items de verificación configurados'}
            </p>
          ) : (
            <div className="space-y-4">
              {checklistItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <Checkbox
                    id={item.id}
                    checked={checklist[item.id] || false}
                    onCheckedChange={(checked) =>
                      onChecklistChange(item.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={item.id}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      {item.label}
                      {item.required && (
                        <span className="text-red-500 text-xs">*</span>
                      )}
                    </Label>
                  </div>
                  {checklist[item.id] ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : item.required ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  ) : null}
                </div>
              ))}
            </div>
          )}

          <Separator className="my-4" />

          {/* Notes */}
          <div>
            <Label htmlFor="checklist-notes">
              {t('detail.notes') || 'Notas del agente'}
            </Label>
            <Textarea
              id="checklist-notes"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder={t('detail.notesPlaceholder') || 'Añadir notas...'}
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Save Button */}
          <div className="mt-4">
            <Button
              onClick={onSave}
              disabled={!hasChanges || isSaving}
              className="w-full"
              variant="outline"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t('detail.saveChecklist') || 'Guardar Verificación'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {canMakeDecision && (
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.actions') || 'Acciones'}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Reject Input - shown when reject is clicked */}
            {showRejectInput ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reject-reason">
                    {t('detail.rejectReason') || 'Motivo del rechazo'}
                  </Label>
                  <Textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(e) => onRejectReasonChange(e.target.value)}
                    placeholder={t('detail.rejectReasonPlaceholder') || 'Indique el motivo...'}
                    className="mt-2"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={onCancelReject}
                    className="flex-1"
                    disabled={isDeciding}
                  >
                    {t('common.cancel') || 'Cancelar'}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={onConfirmReject}
                    className="flex-1"
                    disabled={!rejectReason.trim() || isDeciding}
                  >
                    {isDeciding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('detail.confirmReject') || 'Confirmar Rechazo'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-4">
                  <Button
                    onClick={onApprove}
                    disabled={!allRequiredChecked || isDeciding}
                    className="flex-1"
                  >
                    {isDeciding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    {t('detail.approve') || 'Aprobar'}
                  </Button>
                  <Button
                    onClick={onReject}
                    variant="destructive"
                    className="flex-1"
                    disabled={isDeciding}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    {t('detail.reject') || 'Rechazar'}
                  </Button>
                </div>
                {!allRequiredChecked && (
                  <p className="text-sm text-yellow-600 mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {t('detail.completeRequiredItems') ||
                      'Complete todos los items requeridos antes de aprobar'}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
