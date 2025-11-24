'use client'

/**
 * Déclarations Page
 * Manage tax declarations - create, download forms, submit requests, track status
 *
 * ALIGNED WITH BACKEND:
 * - DeclarationResponse Pydantic model
 * - DeclarationStatus enum (6 statuses)
 * - DeclarationType enum (28 types)
 */

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FilePlus,
  Download,
  Send,
  FileText,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLocale, useTranslations } from 'next-intl'
import { DeclarationStatus, DeclarationType } from '@/types/declaration'
import { useDeclarationLabels } from '@/hooks/use-declaration-labels'

export default function DeclarationsPage() {
  const locale = useLocale()
  const t = useTranslations('declarations')
  const { getStatusLabel, getTypeLabel, getStatusOptions } = useDeclarationLabels()

  const [filterStatut, setFilterStatut] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Mock data - ALIGNED WITH DeclarationResponse backend model
  // TODO: Replace with real API call
  const declarations = [
    {
      id: 'DECL-2025-001',
      declarationType: DeclarationType.INCOME_TAX,
      fiscalYear: 2024,
      declarationDeadline: '2025-03-31',
      createdAt: '2025-01-08T10:00:00Z',
      status: DeclarationStatus.DRAFT,
      netTaxDue: 1250000,
      // Progress calculated from status
    },
    {
      id: 'DECL-2025-002',
      declarationType: DeclarationType.IVA_DESTAJO,
      fiscalYear: 2025,
      fiscalPeriod: 'Q1',
      declarationDeadline: '2025-02-15',
      createdAt: '2025-01-10T14:30:00Z',
      status: DeclarationStatus.SUBMITTED,
      netTaxDue: 890000,
    },
    {
      id: 'DECL-2024-089',
      declarationType: DeclarationType.PROPERTY_TAX,
      fiscalYear: 2024,
      declarationDeadline: '2025-01-31',
      createdAt: '2024-12-28T09:15:00Z',
      status: DeclarationStatus.PROCESSING,
      netTaxDue: 2360000,
    },
    {
      id: 'DECL-2024-088',
      declarationType: DeclarationType.CORPORATE_TAX,
      fiscalYear: 2024,
      declarationDeadline: '2025-01-15',
      createdAt: '2024-12-15T16:45:00Z',
      submittedAt: '2024-12-20T10:00:00Z',
      processedAt: '2024-12-22T14:30:00Z',
      status: DeclarationStatus.ACCEPTED,
      netTaxDue: 5600000,
    },
    {
      id: 'DECL-2024-087',
      declarationType: DeclarationType.PAYROLL_TAX,
      fiscalYear: 2024,
      declarationDeadline: '2024-12-31',
      createdAt: '2024-12-10T11:20:00Z',
      submittedAt: '2024-12-15T09:00:00Z',
      processedAt: '2024-12-18T15:45:00Z',
      status: DeclarationStatus.REJECTED,
      rejectionReason: 'Documents manquants',
      netTaxDue: 450000,
    },
  ]

  /**
   * Get status badge with icon and color
   * Aligned with DeclarationStatus enum
   */
  const getStatutBadge = (status: DeclarationStatus) => {
    const statusLabel = getStatusLabel(status)

    switch (status) {
      case DeclarationStatus.ACCEPTED:
        return (
          <Badge className="bg-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {statusLabel}
          </Badge>
        )
      case DeclarationStatus.PROCESSING:
      case DeclarationStatus.DRAFT:
        return (
          <Badge className="bg-blue-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {statusLabel}
          </Badge>
        )
      case DeclarationStatus.SUBMITTED:
        return (
          <Badge className="bg-yellow-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {statusLabel}
          </Badge>
        )
      case DeclarationStatus.REJECTED:
        return (
          <Badge className="bg-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {statusLabel}
          </Badge>
        )
      case DeclarationStatus.AMENDED:
        return (
          <Badge className="bg-purple-500 flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {statusLabel}
          </Badge>
        )
      default:
        return <Badge variant="outline">{statusLabel}</Badge>
    }
  }

  /**
   * Calculate progress based on status
   */
  const getProgress = (status: DeclarationStatus): number => {
    const progressMap: Record<DeclarationStatus, number> = {
      [DeclarationStatus.DRAFT]: 30,
      [DeclarationStatus.SUBMITTED]: 50,
      [DeclarationStatus.PROCESSING]: 75,
      [DeclarationStatus.ACCEPTED]: 100,
      [DeclarationStatus.REJECTED]: 100,
      [DeclarationStatus.AMENDED]: 100,
    }
    return progressMap[status] || 0
  }

  /**
   * Filter declarations by status and search query
   */
  const filteredDeclarations = declarations.filter((decl) => {
    const matchesStatut = filterStatut === 'all' || decl.status === filterStatut
    const typeLabel = getTypeLabel(decl.declarationType)
    const matchesSearch =
      decl.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      typeLabel.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatut && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('pageSubtitle')}
        </p>
      </div>

      {/* Actions Rapides */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-primary/20">
          <Link href={`/${locale}/dashboard/declarations/new`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('newDeclaration')}</CardTitle>
              <FilePlus className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {t('newDeclarationDesc')}
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('downloadForm')}</CardTitle>
            <Download className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {t('downloadFormDesc')}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href={`/${locale}/dashboard/support`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('submitRequest')}</CardTitle>
              <Send className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {t('submitRequestDesc')}
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Tableau de suivi des déclarations */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t('trackingTitle')}</CardTitle>
              <CardDescription>
                {t('trackingDesc')}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('searchPlaceholder')}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterStatut} onValueChange={setFilterStatut}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrer" />
                </SelectTrigger>
                <SelectContent>
                  {getStatusOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tableReference')}</TableHead>
                  <TableHead>{t('tableType')}</TableHead>
                  <TableHead>{t('tableCreationDate')}</TableHead>
                  <TableHead>{t('tableDeadline')}</TableHead>
                  <TableHead>{t('tableAmount')}</TableHead>
                  <TableHead>{t('tableStatus')}</TableHead>
                  <TableHead>{t('tableProgress')}</TableHead>
                  <TableHead className="text-right">{t('tableActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeclarations.length > 0 ? (
                  filteredDeclarations.map((decl) => {
                    const progress = getProgress(decl.status)
                    return (
                      <TableRow key={decl.id}>
                        <TableCell className="font-medium">{decl.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {getTypeLabel(decl.declarationType)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(decl.createdAt).toLocaleDateString(locale)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(decl.declarationDeadline).toLocaleDateString(locale)}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {decl.netTaxDue?.toLocaleString(locale)} FCFA
                        </TableCell>
                        <TableCell>{getStatutBadge(decl.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-secondary rounded-full h-2 max-w-[80px]">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground min-w-[35px]">
                              {progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm">
                              {t('actionView')}
                            </Button>
                            {(decl.status === DeclarationStatus.DRAFT || decl.status === DeclarationStatus.SUBMITTED) && (
                              <Button variant="default" size="sm">
                                {t('actionContinue')}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {t('noDeclarations')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
