'use client'

/**
 * Profile Page
 * User profile management with tabs based on user role:
 * - Citizen: Personal Info, Account Info, Notifications
 * - Business: Personal Info, Company & Account, Notifications
 *
 * Uses real database schema from DATABASE_SCHEMA_REFERENCE.md
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { User, Mail, Phone, MapPin, Calendar, Shield, Edit2, Save, X, Building2, Bell, FileText } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { getAuthData } from '@/lib/auth/storage'
import type { User as UserType } from '@/types/auth'
import { Badge } from '@/components/ui/badge'

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingPersonal, setIsEditingPersonal] = useState(false)
  const [isEditingCompany, setIsEditingCompany] = useState(false)

  // Personal info form state (from users table)
  const [personalForm, setPersonalForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    city: '',
  })

  // Company info form state (from companies table)
  const [companyForm, setCompanyForm] = useState({
    legal_name: '',
    trade_name: '',
    tax_id: '',
    address: '',
    city: '',
    phone: '',
    email: '',
  })

  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_notifications: true,
    push_notifications: true,
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

    // Initialize forms with user data
    setPersonalForm({
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      phone_number: userData.phone_number || '',
      address: userData.address || '',
      city: userData.city || '',
    })

    // Initialize company form if business user and company data exists
    if (userData.role === 'business' && userData.company) {
      setCompanyForm({
        legal_name: userData.company.legal_name || '',
        trade_name: userData.company.trade_name || '',
        tax_id: userData.company.tax_id || '',
        address: userData.company.address || '',
        city: userData.company.city || '',
        phone: userData.company.phone || '',
        email: userData.company.email || '',
      })
    }

    setNotificationPrefs({
      email_notifications: userData.email_notifications ?? true,
      push_notifications: userData.push_notifications ?? true,
    })

    setIsLoading(false)
  }, [router])

  const handleSavePersonal = async () => {
    try {
      // TODO: Implement API call to update user profile
      // const { userApi } = await import('@/lib/api/user')
      // await userApi.updateProfile(personalForm)

      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations personnelles ont été mises à jour avec succès',
      })

      setIsEditingPersonal(false)

      // Update local user state
      if (user) {
        setUser({
          ...user,
          ...personalForm,
        })
      }
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de la mise à jour',
      })
    }
  }

  const handleSaveCompany = async () => {
    try {
      // TODO: Implement API call to update company info
      // const { companyApi } = await import('@/lib/api/company')
      // await companyApi.updateCompany(companyForm)

      toast({
        title: 'Entreprise mise à jour',
        description: 'Les informations de l&apos;entreprise ont été mises à jour avec succès',
      })

      setIsEditingCompany(false)

      // Update local user state
      if (user && user.company) {
        setUser({
          ...user,
          company: {
            ...user.company,
            ...companyForm,
          },
        })
      }
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de la mise à jour',
      })
    }
  }

  const handleSaveNotifications = async () => {
    try {
      // TODO: Implement API call to update notification preferences
      // const { userApi } = await import('@/lib/api/user')
      // await userApi.updateNotificationPreferences(notificationPrefs)

      toast({
        title: 'Préférences mises à jour',
        description: 'Vos préférences de notifications ont été sauvegardées',
      })

      // Update local user state
      if (user) {
        setUser({
          ...user,
          ...notificationPrefs,
        })
      }
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de la mise à jour',
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

  const isBusiness = user.role === 'business'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Mon Profil
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos informations personnelles et vos préférences
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className={`grid w-full ${isBusiness ? 'grid-cols-3' : 'grid-cols-3'}`}>
            <TabsTrigger value="personal">
              <User className="mr-2 h-4 w-4" />
              Informations personnelles
            </TabsTrigger>
            {isBusiness ? (
              <TabsTrigger value="company">
                <Building2 className="mr-2 h-4 w-4" />
                Informations entreprise & compte
              </TabsTrigger>
            ) : (
              <TabsTrigger value="account">
                <Shield className="mr-2 h-4 w-4" />
                Informations du compte
              </TabsTrigger>
            )}
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Informations Personnelles
                    </CardTitle>
                    <CardDescription>
                      Vos informations personnelles et coordonnées
                    </CardDescription>
                  </div>
                  {!isEditingPersonal ? (
                    <Button onClick={() => setIsEditingPersonal(true)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Modifier
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsEditingPersonal(false)}>
                        <X className="mr-2 h-4 w-4" />
                        Annuler
                      </Button>
                      <Button onClick={handleSavePersonal}>
                        <Save className="mr-2 h-4 w-4" />
                        Enregistrer
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Prénom *</Label>
                    {isEditingPersonal ? (
                      <Input
                        id="first_name"
                        value={personalForm.first_name}
                        onChange={(e) => setPersonalForm({ ...personalForm, first_name: e.target.value })}
                        required
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 bg-muted rounded-md">
                        {user.first_name || 'Non renseigné'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nom *</Label>
                    {isEditingPersonal ? (
                      <Input
                        id="last_name"
                        value={personalForm.last_name}
                        onChange={(e) => setPersonalForm({ ...personalForm, last_name: e.target.value })}
                        required
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 bg-muted rounded-md">
                        {user.last_name || 'Non renseigné'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <p className="text-sm py-2 px-3 bg-muted rounded-md">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {user.email_verified ? (
                      <Badge className="bg-green-500">Email vérifié</Badge>
                    ) : (
                      <Badge variant="destructive">Email non vérifié</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Téléphone
                  </Label>
                  {isEditingPersonal ? (
                    <Input
                      id="phone_number"
                      value={personalForm.phone_number}
                      onChange={(e) => setPersonalForm({ ...personalForm, phone_number: e.target.value })}
                      placeholder="+240 XXX XXX XXX"
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-md">
                      {user.phone_number || 'Non renseigné'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Adresse
                  </Label>
                  {isEditingPersonal ? (
                    <Input
                      id="address"
                      value={personalForm.address}
                      onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })}
                      placeholder="Votre adresse"
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-md">
                      {user.address || 'Non renseignée'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  {isEditingPersonal ? (
                    <Input
                      id="city"
                      value={personalForm.city}
                      onChange={(e) => setPersonalForm({ ...personalForm, city: e.target.value })}
                      placeholder="Votre ville"
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-md">
                      {user.city || 'Non renseignée'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company & Account Tab (Business users) */}
          {isBusiness && (
            <TabsContent value="company" className="space-y-4">
              {/* Company Information Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Informations Entreprise
                      </CardTitle>
                      <CardDescription>
                        Détails de votre entreprise
                      </CardDescription>
                    </div>
                    {!isEditingCompany ? (
                      <Button onClick={() => setIsEditingCompany(true)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Modifier
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditingCompany(false)}>
                          <X className="mr-2 h-4 w-4" />
                          Annuler
                        </Button>
                        <Button onClick={handleSaveCompany}>
                          <Save className="mr-2 h-4 w-4" />
                          Enregistrer
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="legal_name">Nom de l&apos;entreprise *</Label>
                    {isEditingCompany ? (
                      <Input
                        id="legal_name"
                        value={companyForm.legal_name}
                        onChange={(e) => setCompanyForm({ ...companyForm, legal_name: e.target.value })}
                        required
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 bg-muted rounded-md">
                        {user.company?.legal_name || 'Non renseigné'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trade_name">Nom commercial</Label>
                    {isEditingCompany ? (
                      <Input
                        id="trade_name"
                        value={companyForm.trade_name}
                        onChange={(e) => setCompanyForm({ ...companyForm, trade_name: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 bg-muted rounded-md">
                        {user.company?.trade_name || 'Non renseigné'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_id" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      NIF ou RC *
                    </Label>
                    {isEditingCompany ? (
                      <Input
                        id="tax_id"
                        value={companyForm.tax_id}
                        onChange={(e) => setCompanyForm({ ...companyForm, tax_id: e.target.value })}
                        required
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 bg-muted rounded-md">
                        {user.company?.tax_id || 'Non renseigné'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_address">Adresse *</Label>
                    {isEditingCompany ? (
                      <Input
                        id="company_address"
                        value={companyForm.address}
                        onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                        required
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 bg-muted rounded-md">
                        {user.company?.address || 'Non renseignée'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_city">Ville *</Label>
                    {isEditingCompany ? (
                      <Input
                        id="company_city"
                        value={companyForm.city}
                        onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                        required
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 bg-muted rounded-md">
                        {user.company?.city || 'Non renseignée'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_phone">Téléphone entreprise *</Label>
                    {isEditingCompany ? (
                      <Input
                        id="company_phone"
                        value={companyForm.phone}
                        onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                        required
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 bg-muted rounded-md">
                        {user.company?.phone || 'Non renseigné'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_email">Email entreprise *</Label>
                    {isEditingCompany ? (
                      <Input
                        id="company_email"
                        type="email"
                        value={companyForm.email}
                        onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                        required
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 bg-muted rounded-md">
                        {user.company?.email || 'Non renseigné'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Account Information Card (for business) */}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Rôle</Label>
                      <p className="text-sm py-2 px-3 bg-muted rounded-md capitalize">
                        {user.role === 'business' ? 'Entreprise' : user.role}
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
                        Authentification 2FA
                      </Label>
                      <div>
                        {user.two_factor_enabled ? (
                          <Badge className="bg-green-500">Activée</Badge>
                        ) : (
                          <Badge variant="outline">Désactivée</Badge>
                        )}
                      </div>
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

                  <div className="pt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/dashboard/settings/security')}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Paramètres de sécurité
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Account Information Tab (Citizen users) */}
          {!isBusiness && (
            <TabsContent value="account" className="space-y-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Rôle</Label>
                      <p className="text-sm py-2 px-3 bg-muted rounded-md capitalize">
                        {user.role === 'citizen' ? 'Citoyen' : user.role}
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
                        Authentification 2FA
                      </Label>
                      <div>
                        {user.two_factor_enabled ? (
                          <Badge className="bg-green-500">Activée</Badge>
                        ) : (
                          <Badge variant="outline">Désactivée</Badge>
                        )}
                      </div>
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

                  <div className="pt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/dashboard/settings/security')}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Paramètres de sécurité
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Paramétrer les Notifications
                </CardTitle>
                <CardDescription>
                  Gérez vos préférences de notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="email_notifications" className="text-base font-medium">
                      Notifications par Email
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Recevoir des notifications importantes par email
                    </p>
                  </div>
                  <Switch
                    id="email_notifications"
                    checked={notificationPrefs.email_notifications}
                    onCheckedChange={(checked) =>
                      setNotificationPrefs({ ...notificationPrefs, email_notifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="push_notifications" className="text-base font-medium">
                      Notifications Push
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Recevoir des notifications push sur vos appareils
                    </p>
                  </div>
                  <Switch
                    id="push_notifications"
                    checked={notificationPrefs.push_notifications}
                    onCheckedChange={(checked) =>
                      setNotificationPrefs({ ...notificationPrefs, push_notifications: checked })
                    }
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={handleSaveNotifications} className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer les préférences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
