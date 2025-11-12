'use client'

/**
 * Dashboard Page
 * Main user dashboard with quick actions, statistics, and activity tables
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  FileText,
  CreditCard,
  HelpCircle,
  Bell,
  Clock,
  DollarSign,
  FileCheck,
  FilePlus
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { getAuthData } from '@/lib/auth/storage'
import type { User } from '@/types/auth'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const authData = getAuthData()

    if (!authData) {
      router.push('/auth')
      return
    }

    const userData = {
      ...authData.user,
      is_active: authData.user.status === 'active',
      email_verified: authData.user.email_verified ?? false,
    }

    setUser(userData as User)
  }, [router])

  if (!user) return null

  // Mock data - À remplacer par de vraies données API
  const stats = {
    declarationsEnCours: 3,
    declarationsCompletes: 12,
    totalPaiements: 4500000,
    notificationsNonLues: 5,
  }

  const declarationsEnCours = [
    {
      id: 'DECL-2025-001',
      type: 'Impôt sur le Revenu',
      dateCreation: '2025-01-08',
      statut: 'En cours',
      progression: 60,
    },
    {
      id: 'DECL-2025-002',
      type: 'TVA Trimestrielle',
      dateCreation: '2025-01-10',
      statut: 'En attente',
      progression: 30,
    },
    {
      id: 'DECL-2024-089',
      type: 'Taxe Foncière',
      dateCreation: '2024-12-28',
      statut: 'Validation',
      progression: 85,
    },
  ]

  const paiementsRecents = [
    {
      id: 'PAY-2025-045',
      montant: 1250000,
      date: '2025-01-11',
      statut: 'Complété',
      methode: 'Virement',
    },
    {
      id: 'PAY-2025-044',
      montant: 890000,
      date: '2025-01-09',
      statut: 'En attente',
      methode: 'Mobile Money',
    },
    {
      id: 'PAY-2025-043',
      montant: 2360000,
      date: '2025-01-05',
      statut: 'Complété',
      methode: 'Carte bancaire',
    },
  ]

  const notifications = [
    {
      id: 1,
      titre: 'Déclaration validée',
      message: 'Votre déclaration DECL-2024-088 a été validée',
      date: '2025-01-11',
      lu: false,
    },
    {
      id: 2,
      titre: 'Paiement en attente',
      message: 'Le paiement PAY-2025-044 nécessite une confirmation',
      date: '2025-01-10',
      lu: false,
    },
    {
      id: 3,
      titre: 'Nouvelle notification',
      message: 'Des mises à jour sont disponibles pour votre profil',
      date: '2025-01-09',
      lu: true,
    },
  ]

  const getStatutBadge = (statut: string) => {
    switch (statut.toLowerCase()) {
      case 'complété':
      case 'validation':
        return <Badge className="bg-green-500">{statut}</Badge>
      case 'en cours':
        return <Badge className="bg-blue-500">{statut}</Badge>
      case 'en attente':
        return <Badge className="bg-yellow-500">{statut}</Badge>
      default:
        return <Badge variant="outline">{statut}</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Bienvenue, {user.first_name || user.email} !
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos services fiscaux en toute simplicité
          </p>
        </div>

        {/* Actions Rapides */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Actions Rapides</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/dashboard/declarations/new">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Nouvelle Déclaration
                  </CardTitle>
                  <FilePlus className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Créer une déclaration fiscale
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/dashboard/payments/new">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Nouveau Paiement
                  </CardTitle>
                  <CreditCard className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Effectuer un paiement
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/dashboard/support">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Nouvelle Requête
                  </CardTitle>
                  <HelpCircle className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Contacter le support
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="#notifications-tab">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Mes Notifications
                  </CardTitle>
                  <Bell className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      Voir toutes les alertes
                    </p>
                    {stats.notificationsNonLues > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {stats.notificationsNonLues}
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
          <h2 className="text-xl font-semibold mb-4">Statistiques</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Déclarations en cours
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.declarationsEnCours}</div>
                <p className="text-xs text-muted-foreground">
                  À compléter
                </p>
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
                <div className="text-2xl font-bold">{stats.declarationsCompletes}</div>
                <p className="text-xs text-muted-foreground">
                  Validées cette année
                </p>
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
                <div className="text-2xl font-bold">
                  {stats.totalPaiements.toLocaleString('fr-FR')} FCFA
                </div>
                <p className="text-xs text-muted-foreground">
                  Cette année
                </p>
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
                <div className="text-2xl font-bold">{stats.notificationsNonLues}</div>
                <p className="text-xs text-muted-foreground">
                  Non lues
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs: Déclarations / Paiements / Notifications */}
        <Tabs defaultValue="declarations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="declarations">
              <FileText className="h-4 w-4 mr-2" />
              Déclarations en cours
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
                  Vos déclarations fiscales en cours de traitement
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                    {declarationsEnCours.map((decl) => (
                      <TableRow key={decl.id}>
                        <TableCell className="font-medium">{decl.id}</TableCell>
                        <TableCell>{decl.type}</TableCell>
                        <TableCell>{new Date(decl.dateCreation).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>{getStatutBadge(decl.statut)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-secondary rounded-full h-2 max-w-[100px]">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${decl.progression}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{decl.progression}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            Voir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                    {paiementsRecents.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.id}</TableCell>
                        <TableCell className="font-semibold">
                          {payment.montant.toLocaleString('fr-FR')} FCFA
                        </TableCell>
                        <TableCell>{new Date(payment.date).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>{payment.methode}</TableCell>
                        <TableCell>{getStatutBadge(payment.statut)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            Détails
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      notif.lu ? 'bg-card' : 'bg-primary/5 border-primary/20'
                    }`}
                  >
                    <Bell className={`h-5 w-5 mt-0.5 ${notif.lu ? 'text-muted-foreground' : 'text-primary'}`} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{notif.titre}</p>
                        {!notif.lu && <Badge variant="default" className="text-xs">Nouveau</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{notif.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notif.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
