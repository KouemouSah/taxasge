'use client'

/**
 * Dashboard Page
 * Main user dashboard with profile info and quick actions
 * Requires authentication
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  User,
  Mail,
  Shield,
  Calendar,
  LogOut,
  Settings,
  FileText,
  CreditCard,
  Bell
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { getAuthData, clearAuthData } from '@/lib/auth/storage'
import { authApi } from '@/lib/api/auth'
import TwoFactorToggle from '@/components/security/TwoFactorToggle'
import type { User as UserType } from '@/types/auth'

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const authData = getAuthData()

    if (!authData) {
      router.push('/auth')
      return
    }

    setUser(authData.user)
    setIsLoading(false)
  }, [router])

  const handleLogout = async () => {
    const authData = getAuthData()

    if (!authData) {
      router.push('/auth')
      return
    }

    try {
      await authApi.logout({
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
      })

      clearAuthData()

      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      })

      router.push('/')
    } catch (error: unknown) {
      // Even if logout fails on backend, clear local storage
      clearAuthData()
      router.push('/')
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Bienvenue, {user.first_name || user.email} !
          </h1>
          <p className="text-muted-foreground">
            Gérez vos services fiscaux en toute simplicité
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations du compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rôle</p>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Statut</p>
                  <Badge variant={user.is_active ? 'default' : 'destructive'}>
                    {user.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email vérifié</p>
                  <Badge variant={user.email_verified ? 'default' : 'outline'}>
                    {user.email_verified ? 'Vérifié' : 'Non vérifié'}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">2FA</p>
                  <Badge variant={user.two_factor_enabled ? 'default' : 'outline'}>
                    {user.two_factor_enabled ? 'Activé' : 'Désactivé'}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Membre depuis</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              {!user.email_verified && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>Action requise:</strong> Vérifiez votre adresse email
                  </p>
                  <Link href="/auth/verify-email">
                    <Button size="sm" variant="outline">
                      Vérifier maintenant
                    </Button>
                  </Link>
                </div>
              )}
              {/* 2FA Security Section */}
              <div className="pt-4 border-t">
                <TwoFactorToggle
                  initialEnabled={user.two_factor_enabled || false}
                  onStatusChange={(enabled) => {
                    setUser(prev => prev ? { ...prev, two_factor_enabled: enabled } : null)
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/profile">
                <Button variant="outline" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Mon profil
                </Button>
              </Link>

              <Link href="/dashboard/sessions">
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="mr-2 h-4 w-4" />
                  Mes sessions
                </Button>
              </Link>

              <Link href="/auth/verify-email">
                <Button variant="outline" className="w-full justify-start" disabled={user.email_verified}>
                  <Mail className="mr-2 h-4 w-4" />
                  Vérifier email
                </Button>
              </Link>

              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Services fiscaux
              </CardTitle>
              <CardDescription>
                Accédez aux services de Guinée Équatoriale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Bientôt disponible
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Paiements
              </CardTitle>
              <CardDescription>
                Gérez vos transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Bientôt disponible
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Vos alertes et mises à jour
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Bientôt disponible
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
