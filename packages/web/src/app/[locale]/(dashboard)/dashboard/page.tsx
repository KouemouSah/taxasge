'use client'

/**
 * Dashboard Page
 * Main user dashboard with quick actions, statistics, and activity tables
 * Uses real API data instead of mocks
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  CreditCard,
  HelpCircle,
  Bell,
  Clock,
  DollarSign,
  FileCheck,
  FilePlus,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { getAuthData } from '@/core/auth/storage'
import type { User } from '@/types/auth'
import { useLocale, useTranslations } from 'next-intl'
import { useDashboardData } from '@/modules/dashboard'
import { DeclarationStatus } from '@/types/declaration'
import { PaymentStatus, getPaymentMethodLabel, getPaymentStatusLabel } from '@/types/payment'

export default function DashboardPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('dashboard')
  const [user, setUser] = useState<User | null>(null)

  // Fetch real dashboard data
  const { stats, recentDeclarations, recentPayments, isLoading, error, refetch } = useDashboardData()

  useEffect(() => {
    const authData = getAuthData()

    if (!authData) {
      router.push(`/${locale}/auth`)
      return
    }

    const userData = {
      ...authData.user,
      is_active: authData.user.status === 'active',
      email_verified: authData.user.email_verified ?? false,
    }

    setUser(userData as User)
  }, [router, locale])

  if (!user) return null

  // Helper to get status badge
  const getDeclarationStatusBadge = (status: DeclarationStatus | string) => {
    switch (status) {
      case DeclarationStatus.ACCEPTED:
        return <Badge className="bg-green-500">Validée</Badge>
      case DeclarationStatus.SUBMITTED:
      case DeclarationStatus.PROCESSING:
        return <Badge className="bg-blue-500">En cours</Badge>
      case DeclarationStatus.DRAFT:
        return <Badge className="bg-yellow-500">Brouillon</Badge>
      case DeclarationStatus.REJECTED:
        return <Badge className="bg-red-500">Rejetée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: PaymentStatus | string) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return <Badge className="bg-green-500">{getPaymentStatusLabel(PaymentStatus.COMPLETED)}</Badge>
      case PaymentStatus.PENDING:
        return <Badge className="bg-yellow-500">{getPaymentStatusLabel(PaymentStatus.PENDING)}</Badge>
      case PaymentStatus.PROCESSING:
        return <Badge className="bg-blue-500">{getPaymentStatusLabel(PaymentStatus.PROCESSING)}</Badge>
      case PaymentStatus.FAILED:
      case PaymentStatus.CANCELLED:
        return <Badge className="bg-red-500">{getPaymentStatusLabel(status as PaymentStatus)}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Calculate progress for declarations (based on status)
  const getDeclarationProgress = (status: DeclarationStatus | string): number => {
    switch (status) {
      case DeclarationStatus.DRAFT:
        return 25
      case DeclarationStatus.SUBMITTED:
        return 50
      case DeclarationStatus.PROCESSING:
        return 75
      case DeclarationStatus.ACCEPTED:
        return 100
      case DeclarationStatus.REJECTED:
        return 100
      default:
        return 0
    }
  }

  // Get declaration type label in Spanish
  const getDeclarationTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'iva_destajo': 'IVA Destajo',
      'iva_real': 'IVA Régimen Real',
      'income_tax': 'Impôt sur le Revenu',
      'corporate_tax': 'Impôt sur les Sociétés',
      'property_tax': 'Taxe Foncière',
      'vat_declaration': 'TVA',
    }
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {t('welcomeMessage', { name: user.first_name || user.email })}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('welcomeSubtitle')}
        </p>
      </div>

      {/* Actions Rapides */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t('quickActions')}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href={`/${locale}/dashboard/declarations/new`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('newDeclaration')}
                </CardTitle>
                <FilePlus className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {t('newDeclarationDesc')}
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href={`/${locale}/dashboard/payments/new`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('newPayment')}
                </CardTitle>
                <CreditCard className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {t('newPaymentDesc')}
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href={`/${locale}/dashboard/support`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('newRequest')}
                </CardTitle>
                <HelpCircle className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {t('newRequestDesc')}
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="#notifications-tab">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('myNotifications')}
                </CardTitle>
                <Bell className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {t('viewAllAlerts')}
                  </p>
                  {stats.unreadNotifications > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stats.unreadNotifications}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>

      {/* Statistiques */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{t('statistics')}</h2>
          {error && (
            <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Réessayer
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('declarationsInProgress')}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.declarationsInProgress}</div>
                  <p className="text-xs text-muted-foreground">
                    À compléter
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Déclarations complètes
              </CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.declarationsCompleted}</div>
                  <p className="text-xs text-muted-foreground">
                    Validées
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Paiements
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {stats.totalPayments.toLocaleString('fr-FR')} FCFA
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paiements complétés
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Notifications
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.unreadNotifications}</div>
                  <p className="text-xs text-muted-foreground">
                    Non lues
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs: Déclarations / Paiements / Notifications */}
      <div>
        <Tabs defaultValue="declarations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="declarations">
              <FileText className="h-4 w-4 mr-2" />
              Déclarations récentes
            </TabsTrigger>
            <TabsTrigger value="paiements">
              <CreditCard className="h-4 w-4 mr-2" />
              Paiements récents
            </TabsTrigger>
            <TabsTrigger value="notifications" id="notifications-tab">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Déclarations Tab */}
          <TabsContent value="declarations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Suivi des déclarations</CardTitle>
                <CardDescription>
                  Vos déclarations fiscales récentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : recentDeclarations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune déclaration trouvée</p>
                    <Link href={`/${locale}/dashboard/declarations/new`}>
                      <Button variant="outline" className="mt-4">
                        <FilePlus className="h-4 w-4 mr-2" />
                        Créer une déclaration
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date création</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Progression</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentDeclarations.map((decl) => (
                        <TableRow key={decl.id}>
                          <TableCell className="font-medium">{decl.declarationNumber || decl.id.slice(0, 8)}</TableCell>
                          <TableCell>{getDeclarationTypeLabel(decl.declarationType)}</TableCell>
                          <TableCell>{new Date(decl.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                          <TableCell>{getDeclarationStatusBadge(decl.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-secondary rounded-full h-2 max-w-[100px]">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${getDeclarationProgress(decl.status)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">{getDeclarationProgress(decl.status)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/${locale}/dashboard/declarations/${decl.id}`}>
                              <Button variant="outline" size="sm">
                                Voir
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Paiements Tab */}
          <TabsContent value="paiements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Suivi des paiements</CardTitle>
                <CardDescription>
                  Historique de vos paiements fiscaux
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : recentPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun paiement trouvé</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Méthode</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.bankReference || payment.id.slice(0, 8)}</TableCell>
                          <TableCell className="font-semibold">
                            {payment.amount.toLocaleString('fr-FR')} {payment.currency}
                          </TableCell>
                          <TableCell>{new Date(payment.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                          <TableCell>{getPaymentMethodLabel(payment.paymentMethod)}</TableCell>
                          <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                          <TableCell className="text-right">
                            <Link href={`/${locale}/dashboard/payments/${payment.id}`}>
                              <Button variant="outline" size="sm">
                                Détails
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Vos alertes et mises à jour récentes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune notification</p>
                    <p className="text-sm mt-2">Les notifications seront disponibles prochainement</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
