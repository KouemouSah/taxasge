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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { User, Mail, Phone, MapPin, Calendar, Shield, Edit2, Save, X, Building2, Bell, FileText, CreditCard, Languages } from 'lucide-react'
import { getAuthData } from '@/core/auth/storage'
import type { User as UserType } from '@/types/auth'
import { Badge } from '@/components/ui/badge'
import { useLocale, useTranslations } from 'next-intl'

export default function ProfilePage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('profile')
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
    document_type: '',
    document_number: '',
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

  // Notification preferences and language
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_notifications: true,
    push_notifications: true,
    preferred_language: 'es',
  })

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

    setUser(userData as UserType)

    // Initialize forms with user data
    setPersonalForm({
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      phone_number: userData.phone_number || '',
      document_type: userData.document_type || '',
      document_number: userData.document_number || '',
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
      preferred_language: userData.preferred_language || 'es',
    })

    setIsLoading(false)
  }, [router, locale])

  const handleSavePersonal = async () => {
    try {
      // TODO: Implement API call to update user profile
      // const { userApi } = await import('@/lib/api/user')
      // await userApi.updateProfile(personalForm)

      toast({
        title: t('profileUpdated'),
        description: t('profileUpdatedMessage'),
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
        title: t('updateError'),
        description: error instanceof Error ? error.message : t('updateErrorMessage'),
      })
    }
  }

  const handleSaveCompany = async () => {
    try {
      // TODO: Implement API call to update company info
      // const { companyApi } = await import('@/lib/api/company')
      // await companyApi.updateCompany(companyForm)

      toast({
        title: t('companyUpdated'),
        description: t('companyUpdatedMessage'),
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
        title: t('updateError'),
        description: error instanceof Error ? error.message : t('updateErrorMessage'),
      })
    }
  }

  const handleSaveNotifications = async () => {
    try {
      // TODO: Implement API call to update notification preferences
      // const { userApi } = await import('@/lib/api/user')
      // await userApi.updateNotificationPreferences(notificationPrefs)

      toast({
        title: t('preferencesUpdated'),
        description: t('preferencesUpdatedMessage'),
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
        title: t('updateError'),
        description: error instanceof Error ? error.message : t('updateErrorMessage'),
      })
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  const isBusiness = user.role === 'business'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {t('pageTitle')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('pageSubtitle')}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className={`grid w-full ${isBusiness ? 'grid-cols-3' : 'grid-cols-3'}`}>
          <TabsTrigger value="personal">
            <User className="mr-2 h-4 w-4" />
            {t('personalTab')}
          </TabsTrigger>
          {isBusiness ? (
            <TabsTrigger value="company">
              <Building2 className="mr-2 h-4 w-4" />
              {t('companyTab')}
            </TabsTrigger>
          ) : (
            <TabsTrigger value="account">
              <Shield className="mr-2 h-4 w-4" />
              {t('accountTab')}
            </TabsTrigger>
          )}
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            {t('notificationsTab')}
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
                    {t('personalInfoTitle')}
                  </CardTitle>
                  <CardDescription>
                    {t('personalInfoDesc')}
                  </CardDescription>
                </div>
                {!isEditingPersonal ? (
                  <Button onClick={() => setIsEditingPersonal(true)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    {t('editButton')}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditingPersonal(false)}>
                      <X className="mr-2 h-4 w-4" />
                      {t('cancelButton')}
                    </Button>
                    <Button onClick={handleSavePersonal}>
                      <Save className="mr-2 h-4 w-4" />
                      {t('saveButton')}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">{t('firstNameRequired')}</Label>
                  {isEditingPersonal ? (
                    <Input
                      id="first_name"
                      value={personalForm.first_name}
                      onChange={(e) => setPersonalForm({ ...personalForm, first_name: e.target.value })}
                      required
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-md">
                      {user.first_name || t('notProvided')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">{t('lastNameRequired')}</Label>
                  {isEditingPersonal ? (
                    <Input
                      id="last_name"
                      value={personalForm.last_name}
                      onChange={(e) => setPersonalForm({ ...personalForm, last_name: e.target.value })}
                      required
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-md">
                      {user.last_name || t('notProvided')}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t('email')}
                </Label>
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {user.email}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {user.email_verified ? (
                    <Badge className="bg-green-500">{t('emailVerified')}</Badge>
                  ) : (
                    <Badge variant="destructive">{t('emailNotVerified')}</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t('phone')}
                </Label>
                {isEditingPersonal ? (
                  <Input
                    id="phone_number"
                    value={personalForm.phone_number}
                    onChange={(e) => setPersonalForm({ ...personalForm, phone_number: e.target.value })}
                    placeholder={t('phonePlaceholder')}
                  />
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted rounded-md">
                    {user.phone_number || t('notProvided')}
                  </p>
                )}
              </div>

              {/* Document d'identité en 2 colonnes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="document_type" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {t('documentType')}
                  </Label>
                  {isEditingPersonal ? (
                    <Select
                      value={personalForm.document_type}
                      onValueChange={(value) => setPersonalForm({ ...personalForm, document_type: value })}
                    >
                      <SelectTrigger id="document_type">
                        <SelectValue placeholder={t('documentTypePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CNI">{t('documentTypeCNI')}</SelectItem>
                        <SelectItem value="PASSPORT">{t('documentTypePassport')}</SelectItem>
                        <SelectItem value="RESIDENCE_PERMIT">{t('documentTypeResidencePermit')}</SelectItem>
                        <SelectItem value="DRIVER_LICENSE">{t('documentTypeDriverLicense')}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-md">
                      {user.document_type ? (
                        user.document_type === 'CNI' ? t('documentTypeCNI') :
                        user.document_type === 'PASSPORT' ? t('documentTypePassport') :
                        user.document_type === 'RESIDENCE_PERMIT' ? t('documentTypeResidencePermit') :
                        user.document_type === 'DRIVER_LICENSE' ? t('documentTypeDriverLicense') :
                        user.document_type
                      ) : t('notProvided')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document_number">{t('documentNumber')}</Label>
                  {isEditingPersonal ? (
                    <Input
                      id="document_number"
                      value={personalForm.document_number}
                      onChange={(e) => setPersonalForm({ ...personalForm, document_number: e.target.value })}
                      placeholder={t('documentNumberPlaceholder')}
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-md">
                      {user.document_number || t('notProvided')}
                    </p>
                  )}
                </div>
              </div>

              {/* Adresse et Ville en 2 colonnes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t('address')}
                  </Label>
                  {isEditingPersonal ? (
                    <Input
                      id="address"
                      value={personalForm.address}
                      onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })}
                      placeholder={t('addressPlaceholder')}
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-md">
                      {user.address || t('notProvidedFeminine')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">{t('city')}</Label>
                  {isEditingPersonal ? (
                    <Input
                      id="city"
                      value={personalForm.city}
                      onChange={(e) => setPersonalForm({ ...personalForm, city: e.target.value })}
                      placeholder={t('cityPlaceholder')}
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-md">
                      {user.city || t('notProvidedFeminine')}
                    </p>
                  )}
                </div>
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
                      {t('companyInfoTitle')}
                    </CardTitle>
                    <CardDescription>
                      {t('companyInfoDesc')}
                    </CardDescription>
                  </div>
                  {!isEditingCompany ? (
                    <Button onClick={() => setIsEditingCompany(true)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      {t('editButton')}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsEditingCompany(false)}>
                        <X className="mr-2 h-4 w-4" />
                        {t('cancelButton')}
                      </Button>
                      <Button onClick={handleSaveCompany}>
                        <Save className="mr-2 h-4 w-4" />
                        {t('saveButton')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Organisation en 2 colonnes : Identité | Contact */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Colonne 1 : Identité de l'entreprise */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {t('identitySection')}
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="legal_name">{t('legalName')}</Label>
                      {isEditingCompany ? (
                        <Input
                          id="legal_name"
                          value={companyForm.legal_name}
                          onChange={(e) => setCompanyForm({ ...companyForm, legal_name: e.target.value })}
                          required
                        />
                      ) : (
                        <p className="text-sm py-2 px-3 bg-muted rounded-md">
                          {user.company?.legal_name || t('notProvided')}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trade_name">{t('tradeName')}</Label>
                      {isEditingCompany ? (
                        <Input
                          id="trade_name"
                          value={companyForm.trade_name}
                          onChange={(e) => setCompanyForm({ ...companyForm, trade_name: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm py-2 px-3 bg-muted rounded-md">
                          {user.company?.trade_name || t('notProvided')}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tax_id" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {t('taxId')}
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
                          {user.company?.tax_id || t('notProvided')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Colonne 2 : Contact */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {t('contactSection')}
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="company_address">{t('companyAddress')}</Label>
                      {isEditingCompany ? (
                        <Input
                          id="company_address"
                          value={companyForm.address}
                          onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                          required
                        />
                      ) : (
                        <p className="text-sm py-2 px-3 bg-muted rounded-md">
                          {user.company?.address || t('notProvidedFeminine')}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_city">{t('companyCity')}</Label>
                      {isEditingCompany ? (
                        <Input
                          id="company_city"
                          value={companyForm.city}
                          onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                          required
                        />
                      ) : (
                        <p className="text-sm py-2 px-3 bg-muted rounded-md">
                          {user.company?.city || t('notProvidedFeminine')}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_phone">{t('companyPhone')}</Label>
                      {isEditingCompany ? (
                        <Input
                          id="company_phone"
                          value={companyForm.phone}
                          onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                          required
                        />
                      ) : (
                        <p className="text-sm py-2 px-3 bg-muted rounded-md">
                          {user.company?.phone || t('notProvided')}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_email">{t('companyEmail')}</Label>
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
                          {user.company?.email || t('notProvided')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Information Card (for business) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t('accountInfoTitle')}
                </CardTitle>
                <CardDescription>
                  {t('accountInfoDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('role')}</Label>
                    <p className="text-sm py-2 px-3 bg-muted rounded-md capitalize">
                      {user.role === 'business' ? t('roleBusiness') : user.role}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('accountStatus')}</Label>
                    <div>
                      {user.is_active ? (
                        <Badge className="bg-green-500">{t('accountStatusActive')}</Badge>
                      ) : (
                        <Badge variant="destructive">{t('accountStatusInactive')}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {t('creationDate')}
                    </Label>
                    <p className="text-sm py-2 px-3 bg-muted rounded-md">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString(locale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : t('notAvailable')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {t('twoFactorAuth')}
                    </Label>
                    <div>
                      {user.two_factor_enabled ? (
                        <Badge className="bg-green-500">{t('twoFactorEnabled')}</Badge>
                      ) : (
                        <Badge variant="outline">{t('twoFactorDisabled')}</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {user.last_login && (
                  <div className="space-y-2">
                    <Label>{t('lastLogin')}</Label>
                    <p className="text-sm py-2 px-3 bg-muted rounded-md">
                      {new Date(user.last_login).toLocaleString(locale, {
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
                    onClick={() => router.push(`/${locale}/dashboard/settings/security`)}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    {t('securitySettingsButton')}
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
                  {t('accountInfoTitle')}
                </CardTitle>
                <CardDescription>
                  {t('accountInfoDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('role')}</Label>
                    <p className="text-sm py-2 px-3 bg-muted rounded-md capitalize">
                      {user.role === 'citizen' ? t('roleCitizen') : user.role}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('accountStatus')}</Label>
                    <div>
                      {user.is_active ? (
                        <Badge className="bg-green-500">{t('accountStatusActive')}</Badge>
                      ) : (
                        <Badge variant="destructive">{t('accountStatusInactive')}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {t('creationDate')}
                    </Label>
                    <p className="text-sm py-2 px-3 bg-muted rounded-md">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString(locale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : t('notAvailable')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {t('twoFactorAuth')}
                    </Label>
                    <div>
                      {user.two_factor_enabled ? (
                        <Badge className="bg-green-500">{t('twoFactorEnabled')}</Badge>
                      ) : (
                        <Badge variant="outline">{t('twoFactorDisabled')}</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {user.last_login && (
                  <div className="space-y-2">
                    <Label>{t('lastLogin')}</Label>
                    <p className="text-sm py-2 px-3 bg-muted rounded-md">
                      {new Date(user.last_login).toLocaleString(locale, {
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
                    onClick={() => router.push(`/${locale}/dashboard/settings/security`)}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    {t('securitySettingsButton')}
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
                {t('notificationsTitle')}
              </CardTitle>
              <CardDescription>
                {t('notificationsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Préférence de langue */}
              <div className="space-y-3 pb-6 border-b">
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary" />
                  <Label htmlFor="preferred_language" className="text-base font-medium">
                    {t('preferredLanguage')}
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('preferredLanguageDesc')}
                </p>
                <Select
                  value={notificationPrefs.preferred_language}
                  onValueChange={(value) => setNotificationPrefs({ ...notificationPrefs, preferred_language: value })}
                >
                  <SelectTrigger id="preferred_language" className="max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">{t('languageSpanish')}</SelectItem>
                    <SelectItem value="fr">{t('languageFrench')}</SelectItem>
                    <SelectItem value="en">{t('languageEnglish')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between space-x-4">
                <div className="flex-1">
                  <Label htmlFor="email_notifications" className="text-base font-medium">
                    {t('emailNotifications')}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('emailNotificationsDesc')}
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
                    {t('pushNotifications')}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('pushNotificationsDesc')}
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
                  {t('savePreferences')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
