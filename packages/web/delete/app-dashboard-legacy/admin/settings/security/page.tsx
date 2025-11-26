'use client'

/**
 * Admin Security Settings Page
 * Centralized security management for admin users:
 * - Password change
 * - Two-Factor Authentication (2FA)
 *
 * @module dashboard/admin/settings/security
 * @author Claude Code
 * @date 2025-11-19
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Shield, Lock, AlertTriangle } from 'lucide-react'
import { getAuthData } from '@/lib/auth/storage'
import TwoFactorToggle from '@/components/security/TwoFactorToggle'
import type { User as UserType } from '@/types/auth'

export default function AdminSecuritySettingsPage() {
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

    // Verify user is admin
    if (authData.user.role !== 'admin') {
      router.push('/dashboard')
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Paramètres de sécurité
        </h1>
        <p className="text-muted-foreground mt-2">
          Gérez votre mot de passe et vos options de sécurité admin
        </p>
      </div>

      {/* Security Warning for Admin */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <AlertTriangle className="h-5 w-5" />
            Compte administrateur
          </CardTitle>
          <CardDescription className="text-orange-600">
            Vous êtes connecté avec un compte administrateur. Assurez-vous d&apos;utiliser un mot de passe fort et d&apos;activer la 2FA.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 2 Blocs côte à côte : Mot de passe | Authentification 2FA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloc 1 : Mot de passe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Mot de passe
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

        {/* Bloc 2 : Authentification 2FA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Authentification 2FA
            </CardTitle>
            <CardDescription>
              Ajoutez une couche de sécurité supplémentaire à votre compte admin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Recommandé pour les admins :</strong> L&apos;activation de la 2FA est fortement recommandée pour protéger votre compte administrateur.
              </p>
            </div>
            <TwoFactorToggle
              initialEnabled={user.two_factor_enabled || false}
              onStatusChange={(enabled) => {
                setUser(prev => prev ? { ...prev, two_factor_enabled: enabled } : null)
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
