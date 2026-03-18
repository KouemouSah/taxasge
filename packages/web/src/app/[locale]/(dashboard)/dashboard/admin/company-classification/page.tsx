'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  Building2, Upload, BarChart3, RefreshCw, Download,
  CheckCircle2, XCircle, Clock, AlertTriangle, FileUp,
  ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown,
  MessageSquare, Bot, Eye, MapPin,
} from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  classificationApi,
  type ClassificationStats,
  type CsvImportResult,
  type DraftItem,
} from '@/modules/companies/services/classification-api'

// ── Helpers ──────────────────────────────────────────────────────────────────

const REGIME_COLORS: Record<string, string> = {
  bundle: 'bg-green-100 text-green-800',
  declarativo: 'bg-blue-100 text-blue-800',
  mixto: 'bg-purple-100 text-purple-800',
  exento: 'bg-gray-100 text-gray-700',
  pendiente: 'bg-yellow-100 text-yellow-800',
}

const STATUS_KEYS: Record<string, string> = {
  pending_review: 'pendingReview',
  auto_approved: 'autoApproved',
  approved: 'approved',
  rejected: 'rejected',
  needs_info: 'needsInfo',
  error: 'error',
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof Clock }> = {
  pending_review: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  auto_approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
  needs_info: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  error: { color: 'bg-red-100 text-red-800', icon: XCircle },
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 90 ? 'bg-green-100 text-green-800' :
    pct >= 70 ? 'bg-yellow-100 text-yellow-800' :
    'bg-red-100 text-red-800'
  return <Badge className={`${color} text-xs`}>{pct}%</Badge>
}

function StatusBadge({ status, t }: { status: string; t: ReturnType<typeof useTranslations> }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending_review
  const Icon = cfg.icon
  const key = STATUS_KEYS[status]
  const label = key ? t(`companyClassification.${key}`) : status.replace(/_/g, ' ')
  return (
    <Badge className={`${cfg.color} text-xs gap-1`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

/** Extract display fields from company_data JSONB */
function getCompanyField(cd: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    if (cd[k]) return String(cd[k])
  }
  return '-'
}

// ── Draft Detail Sheet ──────────────────────────────────────────────────────

function DraftDetailSheet({
  draft, open, onClose, t, locale,
}: {
  draft: DraftItem | null
  open: boolean
  onClose: () => void
  t: ReturnType<typeof useTranslations>
  locale: string
}) {
  if (!draft) return null
  const cd = draft.companyData || {}
  const details = draft.classificationDetails || {}

  const fields: [string, string][] = [
    [t('companyClassification.detailNif'), getCompanyField(cd, 'nif')],
    [t('companyClassification.detailName'), getCompanyField(cd, 'legalName', 'legal_name', 'nombre_empresa')],
    [t('companyClassification.formaJuridica'), getCompanyField(cd, 'formaJuridica', 'forma_juridica')],
    [t('companyClassification.detailSector'), getCompanyField(cd, 'sectorActividad', 'sector_actividad')],
    [t('companyClassification.detailSubsector'), getCompanyField(cd, 'subsectorActividad', 'subsector_actividad')],
    [t('companyClassification.detailActivity'), getCompanyField(cd, 'objetoSocial', 'objeto_social')],
    [t('companyClassification.detailCapital'), getCompanyField(cd, 'capitalSocial', 'capital_social')],
    [t('companyClassification.detailEmployees'), getCompanyField(cd, 'employeeCount', 'employee_count', 'numero_empleados')],
    [t('companyClassification.detailCity'), getCompanyField(cd, 'localidad', 'city_name')],
    [t('companyClassification.detailRepresentative'), getCompanyField(cd, 'representanteLegal', 'representante_legal')],
  ]

  const zonePricing = details.zonePricing as Record<string, unknown> | undefined

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {t('companyClassification.draftDetail')}
          </SheetTitle>
          <SheetDescription>
            {getCompanyField(cd, 'legalName', 'legal_name', 'nombre_empresa')}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Classification result */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{t('companyClassification.classificationResult')}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">{t('companyClassification.regime')}</p>
                {draft.regimenFiscal ? (
                  <Badge className={REGIME_COLORS[draft.regimenFiscal] || 'bg-gray-100'}>
                    {draft.regimenFiscal}
                  </Badge>
                ) : <span className="text-sm">-</span>}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('companyClassification.confidence')}</p>
                <ConfidenceBadge value={draft.classificationConfidence} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('companyClassification.status')}</p>
                <StatusBadge status={draft.status} t={t} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('companyClassification.source')}</p>
                <Badge variant="outline" className="text-xs">{draft.sourceType}</Badge>
              </div>
            </div>
            {draft.classificationReason && (
              <div>
                <p className="text-xs text-muted-foreground">{t('companyClassification.detailReason')}</p>
                <p className="text-sm">{draft.classificationReason}</p>
              </div>
            )}
          </div>

          {/* Company data */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{t('companyClassification.companyData')}</h4>
            <div className="space-y-1">
              {fields.map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm py-1 border-b border-muted last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right max-w-[60%] truncate">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Zone pricing info */}
          {zonePricing && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {t('companyClassification.zonePricing')}
              </h4>
              <div className="text-sm space-y-1">
                {zonePricing.zoneCode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('companyClassification.zoneCode')}</span>
                    <Badge variant="outline">{String(zonePricing.zoneCode)}</Badge>
                  </div>
                )}
                {zonePricing.zoneTier && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('companyClassification.zoneTier')}</span>
                    <span className="font-medium">{String(zonePricing.zoneTier)}</span>
                  </div>
                )}
                {zonePricing.totalAmount != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('companyClassification.totalAmount')}</span>
                    <span className="font-bold">
                      {Number(zonePricing.totalAmount).toLocaleString(locale)} XAF
                    </span>
                  </div>
                )}
                {Array.isArray(zonePricing.feeTypesAvailable) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('companyClassification.feeTypes')}</span>
                    <span>{(zonePricing.feeTypesAvailable as string[]).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Classification details - flags & rules */}
          {(details.rulesApplied || details.flags) && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">{t('companyClassification.detailClassification')}</h4>
              {Array.isArray(details.rulesApplied) && details.rulesApplied.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('companyClassification.rulesApplied')}</p>
                  <div className="flex flex-wrap gap-1">
                    {(details.rulesApplied as string[]).map((r, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{r}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(details.flags) && details.flags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('companyClassification.flags')}</p>
                  <div className="flex flex-wrap gap-1">
                    {(details.flags as string[]).map((f, i) => (
                      <Badge key={i} variant="destructive" className="text-xs">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {details.commerceType && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('companyClassification.commerceType')}</span>
                  <Badge className="bg-blue-100 text-blue-800">{String(details.commerceType)}</Badge>
                </div>
              )}
            </div>
          )}

          {/* Reviewer notes */}
          {draft.reviewerNotes && (
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">{t('companyClassification.reviewerNotes')}</h4>
              <p className="text-sm bg-muted p-2 rounded">{draft.reviewerNotes}</p>
            </div>
          )}

          {/* Dates */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>{t('companyClassification.date')}: {draft.createdAt ? new Date(draft.createdAt).toLocaleString(locale) : '-'}</p>
            {draft.reviewedAt && <p>{t('companyClassification.reviewedAt')}: {new Date(draft.reviewedAt).toLocaleString(locale)}</p>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Confirmation Dialog ─────────────────────────────────────────────────────

type ConfirmAction = 'approve' | 'reject' | 'request_info'

function ConfirmActionDialog({
  action, open, onConfirm, onCancel, t,
}: {
  action: ConfirmAction | null
  open: boolean
  onConfirm: (notes: string) => void
  onCancel: () => void
  t: ReturnType<typeof useTranslations>
}) {
  const [notes, setNotes] = useState('')

  useEffect(() => { if (!open) setNotes('') }, [open])

  const config: Record<ConfirmAction, { title: string; desc: string; confirmLabel: string; variant: string }> = {
    approve: {
      title: t('companyClassification.confirmApproveTitle'),
      desc: t('companyClassification.confirmApproveDesc'),
      confirmLabel: t('companyClassification.approve'),
      variant: 'text-green-600',
    },
    reject: {
      title: t('companyClassification.confirmRejectTitle'),
      desc: t('companyClassification.confirmRejectDesc'),
      confirmLabel: t('companyClassification.reject'),
      variant: 'text-red-600',
    },
    request_info: {
      title: t('companyClassification.confirmInfoTitle'),
      desc: t('companyClassification.confirmInfoDesc'),
      confirmLabel: t('companyClassification.requestInfo'),
      variant: 'text-orange-600',
    },
  }

  const cfg = action ? config[action] : config.approve

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{cfg.title}</AlertDialogTitle>
          <AlertDialogDescription>{cfg.desc}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Label htmlFor="action-notes" className="text-sm">
            {t('companyClassification.notesOptional')}
          </Label>
          <Textarea
            id="action-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('companyClassification.notesPlaceholder')}
            className="mt-1"
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {t('companyClassification.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cfg.variant}
            onClick={() => onConfirm(notes)}
          >
            {cfg.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ── Stats Tab ────────────────────────────────────────────────────────────────

function StatsTab({ stats, t }: { stats: ClassificationStats | null; t: ReturnType<typeof useTranslations> }) {
  if (!stats) return <div className="p-8 text-center text-muted-foreground">{t('companyClassification.loading')}</div>

  const regimeEntries = Object.entries(stats.byRegimen || {})

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('companyClassification.totalCompanies')}</p>
            <p className="text-2xl font-bold">{stats.totalCompanies}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('companyClassification.drafts')}</p>
            <p className="text-2xl font-bold">{stats.totalDrafts}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.draftsPending} {t('companyClassification.pending')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('companyClassification.autoApprovalRate')}</p>
            <p className="text-2xl font-bold">{(stats.autoApprovalRate * 100).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('companyClassification.avgConfidence')}</p>
            <p className="text-2xl font-bold">{(stats.avgConfidence * 100).toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('companyClassification.regimeDistribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          {regimeEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('companyClassification.noData')}</p>
          ) : (
            <div className="space-y-3">
              {regimeEntries.map(([regime, count]) => {
                const total = stats.totalCompanies || 1
                const pct = ((count / total) * 100).toFixed(1)
                return (
                  <div key={regime} className="flex items-center gap-3">
                    <Badge className={`${REGIME_COLORS[regime] || 'bg-gray-100'} min-w-[100px] justify-center`}>
                      {regime}
                    </Badge>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium min-w-[80px] text-right">
                      {count} ({pct}%)
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{t('companyClassification.approvedCount')}</p>
            <p className="text-lg font-bold text-green-600">{stats.draftsApproved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{t('companyClassification.autoApprovedLabel')}</p>
            <p className="text-lg font-bold text-green-600">{stats.draftsAutoApproved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{t('companyClassification.pendingCount')}</p>
            <p className="text-lg font-bold text-yellow-600">{stats.draftsPending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{t('companyClassification.rejectedCount')}</p>
            <p className="text-lg font-bold text-red-600">{stats.draftsRejected}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{t('companyClassification.needsInfoCount')}</p>
            <p className="text-lg font-bold text-orange-600">{stats.draftsNeedsInfo}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── Import Tab ───────────────────────────────────────────────────────────────

function ImportTab({ t }: { t: ReturnType<typeof useTranslations> }) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<CsvImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleDownloadTemplate = () => {
    const url = classificationApi.getCsvTemplateUrl()
    const a = document.createElement('a')
    a.href = url
    a.download = 'company_import_template.csv'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t('companyClassification.error'),
        description: t('companyClassification.fileTooLarge'),
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    setResult(null)
    try {
      const res = await classificationApi.importCsv(file)
      setResult(res)
      toast({
        title: t('companyClassification.importComplete'),
        description: `${res.imported}/${res.total}`,
      })
    } catch {
      toast({ title: t('companyClassification.error'), description: t('companyClassification.errorImporting'), variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {t('companyClassification.importCsv')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('companyClassification.importDesc')}
          </p>
          <div className="p-3 bg-muted/50 rounded text-xs text-muted-foreground space-y-1">
            <p className="font-medium">{t('companyClassification.requiredColumns')}:</p>
            <p><code>legal_name</code>, <code>forma_juridica</code></p>
            <p className="font-medium mt-2">{t('companyClassification.optionalColumns')}:</p>
            <p><code>nif</code>, <code>registration_number</code>, <code>sector_actividad</code>, <code>subsector_actividad</code>, <code>objeto_social</code>, <code>commerce_type</code>, <code>capital_social</code>, <code>employee_count</code>, <code>localidad</code>, <code>provincia</code>, <code>domicilio_fiscal</code>, <code>representante_legal</code>, <code>telefono</code>, <code>email</code></p>
            <p className="mt-1 text-xs italic">{t('companyClassification.identifierHint')}</p>
            <p className="mt-2">{t('companyClassification.maxFileSize')}: 10 MB | {t('companyClassification.encoding')}: UTF-8</p>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              {t('companyClassification.downloadTemplate')}
            </Button>
            <Input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="max-w-xs"
              aria-label={t('companyClassification.importCsv')}
            />
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('companyClassification.processing')}
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4 mr-2" />
                  {t('companyClassification.import')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('companyClassification.importResult')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground">{t('companyClassification.totalRows')}</p>
                <p className="text-lg font-bold">{result.total}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('companyClassification.imported')}</p>
                <p className="text-lg font-bold text-green-600">{result.imported}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('companyClassification.autoApprovedCount')}</p>
                <p className="text-lg font-bold text-green-600">{result.autoApproved}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('companyClassification.pendingReviewCount')}</p>
                <p className="text-lg font-bold text-yellow-600">{result.pendingReview}</p>
              </div>
            </div>
            {(result.validationErrors.length > 0 || result.parseErrors.length > 0) && (
              <div className="mt-3 p-3 bg-red-50 rounded text-sm text-red-700 max-h-40 overflow-y-auto">
                {[...result.parseErrors, ...result.validationErrors].map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function CompanyClassificationPage() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const { toast } = useToast()

  // Drafts state
  const [drafts, setDrafts] = useState<DraftItem[]>([])
  const [draftsTotal, setDraftsTotal] = useState(0)
  const [draftsPage, setDraftsPage] = useState(1)
  const [draftsStatus, setDraftsStatus] = useState<string>('')
  const [draftsLoading, setDraftsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const PAGE_SIZE = 20

  // Stats state
  const [stats, setStats] = useState<ClassificationStats | null>(null)
  const [activeTab, setActiveTab] = useState('drafts')

  // Detail sheet state
  const [selectedDraft, setSelectedDraft] = useState<DraftItem | null>(null)

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<{
    action: ConfirmAction
    draftId: string
  } | null>(null)

  // Fetch drafts
  const fetchDrafts = useCallback(async () => {
    setDraftsLoading(true)
    try {
      const res = await classificationApi.getDrafts({
        status: draftsStatus || undefined,
        page: draftsPage,
        pageSize: PAGE_SIZE,
      })
      setDrafts(res.items)
      setDraftsTotal(res.total)
    } catch {
      toast({ title: t('companyClassification.error'), description: t('companyClassification.errorLoading'), variant: 'destructive' })
    } finally {
      setDraftsLoading(false)
    }
  }, [draftsPage, draftsStatus, toast, t])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await classificationApi.getStats()
      setStats(res)
    } catch {
      // Silent — stats are non-critical
    }
  }, [])

  useEffect(() => {
    fetchDrafts()
  }, [fetchDrafts])

  useEffect(() => {
    if (activeTab === 'stats') fetchStats()
  }, [activeTab, fetchStats])

  // Confirmed action handler
  const handleConfirmedAction = async (notes: string) => {
    if (!confirmAction) return
    const { action, draftId } = confirmAction
    setConfirmAction(null)
    setActionLoading(draftId)

    try {
      if (action === 'approve') {
        const result = await classificationApi.approveDraft(draftId, notes || undefined)
        toast({
          title: t('companyClassification.draftApproved'),
          description: t('companyClassification.companyCreated'),
        })
        if (result.licenseWarning) {
          toast({
            title: t('companyClassification.licenseWarning'),
            description: result.licenseWarning,
            variant: 'destructive',
          })
        }
      } else if (action === 'reject') {
        await classificationApi.rejectDraft(draftId, notes || undefined)
        toast({ title: t('companyClassification.draftRejected') })
      } else if (action === 'request_info') {
        await classificationApi.requestInfo(draftId, notes || t('companyClassification.moreInfoNeeded'))
        toast({ title: t('companyClassification.infoRequested') })
      }
      fetchDrafts()
    } catch {
      const errKey = action === 'approve' ? 'errorApproving' : action === 'reject' ? 'errorRejecting' : 'errorLoading'
      toast({ title: t('companyClassification.error'), description: t(`companyClassification.${errKey}`), variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const totalPages = Math.ceil(draftsTotal / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            {t('companyClassification.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('companyClassification.subtitle')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDrafts}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('companyClassification.refresh')}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="drafts" className="gap-1">
            <Building2 className="h-4 w-4" />
            {t('companyClassification.draftsTab')} ({draftsTotal})
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-1">
            <Upload className="h-4 w-4" />
            {t('companyClassification.importTab')}
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1">
            <BarChart3 className="h-4 w-4" />
            {t('companyClassification.statsTab')}
          </TabsTrigger>
        </TabsList>

        {/* Drafts Tab */}
        <TabsContent value="drafts" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 items-center">
            <Select value={draftsStatus} onValueChange={(v) => { setDraftsStatus(v === 'all' ? '' : v); setDraftsPage(1) }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('companyClassification.allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('companyClassification.allStatuses')}</SelectItem>
                <SelectItem value="pending_review">{t('companyClassification.pendingReview')}</SelectItem>
                <SelectItem value="auto_approved">{t('companyClassification.autoApproved')}</SelectItem>
                <SelectItem value="approved">{t('companyClassification.approved')}</SelectItem>
                <SelectItem value="rejected">{t('companyClassification.rejected')}</SelectItem>
                <SelectItem value="needs_info">{t('companyClassification.needsInfo')}</SelectItem>
                <SelectItem value="error">{t('companyClassification.error')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('companyClassification.company')}</TableHead>
                    <TableHead>{t('companyClassification.formaJuridica')}</TableHead>
                    <TableHead>{t('companyClassification.regime')}</TableHead>
                    <TableHead>{t('companyClassification.confidence')}</TableHead>
                    <TableHead>{t('companyClassification.zone')}</TableHead>
                    <TableHead>{t('companyClassification.source')}</TableHead>
                    <TableHead>{t('companyClassification.status')}</TableHead>
                    <TableHead>{t('companyClassification.date')}</TableHead>
                    <TableHead className="text-right">{t('companyClassification.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {draftsLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                        {t('companyClassification.loading')}
                      </TableCell>
                    </TableRow>
                  ) : drafts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {t('companyClassification.noDrafts')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    drafts.map((draft) => {
                      const cd = draft.companyData || {}
                      const details = draft.classificationDetails || {}
                      const zonePricing = details.zonePricing as Record<string, unknown> | undefined
                      const isActionPending = actionLoading === draft.id
                      const canAct = draft.status === 'pending_review' || draft.status === 'auto_approved' || draft.status === 'needs_info'
                      return (
                        <TableRow
                          key={draft.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedDraft(draft)}
                        >
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {getCompanyField(cd, 'legalName', 'legal_name', 'nombre_empresa')}
                          </TableCell>
                          <TableCell className="text-sm">
                            {getCompanyField(cd, 'formaJuridica', 'forma_juridica')}
                          </TableCell>
                          <TableCell>
                            {draft.regimenFiscal ? (
                              <Badge className={REGIME_COLORS[draft.regimenFiscal] || 'bg-gray-100'}>
                                {draft.regimenFiscal}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <ConfidenceBadge value={draft.classificationConfidence} />
                          </TableCell>
                          <TableCell>
                            {zonePricing?.zone_code ? (
                              <Badge variant="outline" className="text-xs gap-1">
                                <MapPin className="h-3 w-3" />
                                {String(zonePricing.zoneCode)}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {draft.sourceType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={draft.status} t={t} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {draft.createdAt
                              ? new Date(draft.createdAt).toLocaleDateString(locale)
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                title={t('companyClassification.draftDetail')}
                                onClick={() => setSelectedDraft(draft)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              {canAct && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-green-600"
                                    title={t('companyClassification.approve')}
                                    onClick={() => setConfirmAction({ action: 'approve', draftId: draft.id })}
                                    disabled={isActionPending}
                                  >
                                    <ThumbsUp className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-red-600"
                                    title={t('companyClassification.reject')}
                                    onClick={() => setConfirmAction({ action: 'reject', draftId: draft.id })}
                                    disabled={isActionPending}
                                  >
                                    <ThumbsDown className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-orange-600"
                                    title={t('companyClassification.requestInfo')}
                                    onClick={() => setConfirmAction({ action: 'request_info', draftId: draft.id })}
                                    disabled={isActionPending}
                                  >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {draftsTotal} — {draftsPage}/{totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDraftsPage((p) => Math.max(1, p - 1))}
                  disabled={draftsPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDraftsPage((p) => Math.min(totalPages, p + 1))}
                  disabled={draftsPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import">
          <ImportTab t={t} />
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <StatsTab stats={stats} t={t} />
        </TabsContent>
      </Tabs>

      {/* Draft Detail Sheet */}
      <DraftDetailSheet
        draft={selectedDraft}
        open={selectedDraft !== null}
        onClose={() => setSelectedDraft(null)}
        t={t}
        locale={locale}
      />

      {/* Confirmation Dialog */}
      <ConfirmActionDialog
        action={confirmAction?.action ?? null}
        open={confirmAction !== null}
        onConfirm={handleConfirmedAction}
        onCancel={() => setConfirmAction(null)}
        t={t}
      />
    </div>
  )
}
