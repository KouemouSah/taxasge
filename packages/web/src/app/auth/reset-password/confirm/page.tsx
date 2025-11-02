'use client'

/**
 * Password Reset Confirm Page
 * Allows users to set a new password using their reset token
 * Backend: POST /auth/password/reset/confirm
 * URL: /auth/reset-password/confirm?token=xxx
 */

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, Lock } from "lucide-react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { authApi } from "@/lib/api/auth"

function ResetPasswordConfirmContent() {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  const [token, setToken] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      toast({
        variant: "destructive",
        title: "Token manquant",
        description: "Le lien de réinitialisation est invalide",
      })
      router.push("/auth/reset-password")
    } else {
      setToken(tokenParam)
    }
  }, [searchParams, router, toast])

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push("Au moins 8 caractères")
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Au moins une majuscule")
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Au moins une minuscule")
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Au moins un chiffre")
    }

    return errors
  }

  const handlePasswordChange = (value: string) => {
    setNewPassword(value)
    setPasswordErrors(validatePassword(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Token invalide",
      })
      return
    }

    const errors = validatePassword(newPassword)
    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Mot de passe faible",
        description: errors.join(", "),
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
      })
      return
    }

    setIsLoading(true)

    try {
      await authApi.confirmPasswordReset({
        token,
        new_password: newPassword,
      })

      toast({
        title: "Mot de passe réinitialisé !",
        description: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
      })

      setTimeout(() => {
        router.push("/auth")
      }, 2000)
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de réinitialiser le mot de passe",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2">Nouveau mot de passe</h1>
            <p className="text-muted-foreground">
              Choisissez un mot de passe fort et sécurisé
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Définir un nouveau mot de passe</CardTitle>
              <CardDescription>
                Votre mot de passe doit respecter les critères de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  {newPassword && (
                    <div className="text-sm space-y-1">
                      <p className={passwordErrors.length === 0 ? "text-green-600" : "text-muted-foreground"}>
                        Critères de sécurité:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li className={newPassword.length >= 8 ? "text-green-600" : "text-muted-foreground"}>
                          8 caractères minimum {newPassword.length >= 8 && "✓"}
                        </li>
                        <li className={/[A-Z]/.test(newPassword) ? "text-green-600" : "text-muted-foreground"}>
                          Une majuscule {/[A-Z]/.test(newPassword) && "✓"}
                        </li>
                        <li className={/[a-z]/.test(newPassword) ? "text-green-600" : "text-muted-foreground"}>
                          Une minuscule {/[a-z]/.test(newPassword) && "✓"}
                        </li>
                        <li className={/[0-9]/.test(newPassword) ? "text-green-600" : "text-muted-foreground"}>
                          Un chiffre {/[0-9]/.test(newPassword) && "✓"}
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  {confirmPassword && (
                    <p className={newPassword === confirmPassword ? "text-green-600 text-sm" : "text-destructive text-sm"}>
                      {newPassword === confirmPassword ? "✓ Les mots de passe correspondent" : "✗ Les mots de passe ne correspondent pas"}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || passwordErrors.length > 0 || newPassword !== confirmPassword}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Réinitialisation...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Réinitialiser le mot de passe
                    </>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Link href="/auth">
                    <Button variant="link" className="text-sm">
                      Annuler et retourner à la connexion
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordConfirmContent />
    </Suspense>
  )
}
