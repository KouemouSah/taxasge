'use client'

/**
 * Security Settings Page
 * Centralized security management:
 * - Password change
 * - Two-Factor Authentication (2FA)
 * - Active sessions
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Shield, Key, Lock } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { getAuthData } from '@/lib/auth/storage'
import TwoFactorToggle from '@/components/security/TwoFactorToggle'
import type { User as UserType } from '@/types/auth'

export default function SecuritySettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false)

  useEffect(() => {
    const authData = getAuthData()

    if (!authData) {
      router.push('/auth')
      return
    }

    setUser(authData.user)
    setIsLoading(false)
  }, [router])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas',
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Mot de passe trop court',
        description: 'Le mot de passe doit contenir au moins 8 caractères',
      })
      return
    }

    // Password strength validation
    if (!/[A-Z]/.test(newPassword)) {
      toast({
        variant: 'destructive',
        title: 'Mot de passe faible',
        description: 'Le mot de passe doit contenir au moins une majuscule',
      })
      return
    }
    if (!/[a-z]/.test(newPassword)) {
      toast({
        variant: 'destructive',
        title: 'Mot de passe faible',
        description: 'Le mot de passe doit contenir au moins une minuscule',
      })
      return
    }
    if (!/[0-9]/.test(newPassword)) {
      toast({
        variant: 'destructive',
        title: 'Mot de passe faible',
        description: 'Le mot de passe doit contenir au moins un chiffre',
      })
      return
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      toast({
        variant: 'destructive',
        title: 'Mot de passe faible',
        description: 'Le mot de passe doit contenir au moins un caractère spécial',
      })
      return
    }

    setPasswordChangeLoading(true)

    try {
      // Step 1: Request password change (sends verification code)
      const { authApi } = await import('@/lib/api/auth')
      const response = await authApi.requestPasswordChange({
        current_password: currentPassword,
      })

      // Step 2: Store new password and email in sessionStorage for verification step
      sessionStorage.setItem('password_change_email', response.email)
      sessionStorage.setItem('password_change_new_password', newPassword)

      toast({
        title: 'Code de vérification envoyé',
        description: `Un code de vérification a été envoyé à ${response.email}`,
      })

      // Step 3: Redirect to verify-email page with password_change context
      router.push('/auth/verify-email?context=password_change')

    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec du changement de mot de passe',
      })
      setPasswordChangeLoading(false)
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Paramètres de sécurité
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez votre mot de passe et vos options de sécurité
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">
                <Key className="mr-2 h-4 w-4" />
                Mot de passe
              </TabsTrigger>
              <TabsTrigger value="2fa">
                <Shield className="mr-2 h-4 w-4" />
                Authentification 2FA
              </TabsTrigger>
            </TabsList>

            {/* Password Tab */}
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Changer le mot de passe
                  </CardTitle>
                  <CardDescription>
                    Modifiez votre mot de passe. Un code de vérification sera envoyé à votre email.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Mot de passe actuel</Label>
                      <Input
                        id="current-password"
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nouveau mot de passe</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={passwordChangeLoading}>
                      {passwordChangeLoading ? 'Changement en cours...' : 'Changer le mot de passe'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 2FA Tab */}
            <TabsContent value="2fa">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Authentification à deux facteurs
                  </CardTitle>
                  <CardDescription>
                    Ajoutez une couche de sécurité supplémentaire à votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TwoFactorToggle
                    initialEnabled={user.two_factor_enabled || false}
                    onStatusChange={(enabled) => {
                      setUser(prev => prev ? { ...prev, two_factor_enabled: enabled } : null)
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>
    </DashboardLayout>
  )
}
