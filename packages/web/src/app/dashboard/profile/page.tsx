'use client'

/**
 * Profile Page
 * User profile management with personal information and account details
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { User, Mail, Phone, MapPin, Calendar, Shield, Edit2, Save, X } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { getAuthData } from '@/lib/auth/storage'
import type { User as UserType } from '@/types/auth'
import { Badge } from '@/components/ui/badge'

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
  })

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

    setUser(userData as UserType)
    setFormData({
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      phone: userData.phone || '',
      address: userData.address || '',
    })
    setIsLoading(false)
  }, [router])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        address: user.address || '',
      })
    }
    setIsEditing(false)
  }

  const handleSave = async () => {
    try {
      // TODO: Implement API call to update user profile
      // const { userApi } = await import('@/lib/api/user')
      // await userApi.updateProfile(formData)

      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été mises à jour avec succès',
      })

      setIsEditing(false)

      // Update local user state
      if (user) {
        setUser({
          ...user,
          ...formData,
        })
      }
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de la mise à jour du profil',
      })
    }
  }

  if (isLoading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Mon Profil
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez vos informations personnelles et vos préférences
            </p>
          </div>
          {!isEditing ? (
            <Button onClick={handleEdit}>
              <Edit2 className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </Button>
            </div>
          )}
        </div>

        {/* Profile Information */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations Personnelles
              </CardTitle>
              <CardDescription>
                Vos informations personnelles et coordonnées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom</Label>
                {isEditing ? (
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted rounded-md">
                    {user.first_name || 'Non renseigné'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Nom</Label>
                {isEditing ? (
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted rounded-md">
                    {user.last_name || 'Non renseigné'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {user.email}
                </p>
                {user.email_verified ? (
                  <Badge className="bg-green-500">Email vérifié</Badge>
                ) : (
                  <Badge variant="destructive">Email non vérifié</Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Téléphone
                </Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+240 XXX XXX XXX"
                  />
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted rounded-md">
                    {user.phone || 'Non renseigné'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adresse
                </Label>
                {isEditing ? (
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Votre adresse"
                  />
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted rounded-md">
                    {user.address || 'Non renseignée'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Informations du Compte
              </CardTitle>
              <CardDescription>
                Détails et sécurité de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rôle</Label>
                <p className="text-sm py-2 px-3 bg-muted rounded-md capitalize">
                  {user.role || 'Utilisateur'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Statut du compte</Label>
                <div>
                  {user.is_active ? (
                    <Badge className="bg-green-500">Actif</Badge>
                  ) : (
                    <Badge variant="destructive">Inactif</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date de création
                </Label>
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Non disponible'}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Authentification à deux facteurs
                </Label>
                <div>
                  {user.two_factor_enabled ? (
                    <Badge className="bg-green-500">Activée</Badge>
                  ) : (
                    <Badge variant="outline">Désactivée</Badge>
                  )}
                </div>
              </div>

              {user.last_login && (
                <div className="space-y-2">
                  <Label>Dernière connexion</Label>
                  <p className="text-sm py-2 px-3 bg-muted rounded-md">
                    {new Date(user.last_login).toLocaleString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>
              Gérez votre compte et vos paramètres de sécurité
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/dashboard/settings/security')}
            >
              <Shield className="mr-2 h-4 w-4" />
              Paramètres de sécurité
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/dashboard/settings')}
            >
              <User className="mr-2 h-4 w-4" />
              Paramètres du compte
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
