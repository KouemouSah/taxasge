'use client'

/**
 * Email Verification Page
 * Allows users to enter their 6-digit verification code
 * Backend: POST /auth/email/verify
 */

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, Mail } from "lucide-react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { authApi } from "@/lib/api/authApi"
import { getAuthData } from "@/lib/auth/storage"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [verificationCode, setVerificationCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [isMounted, setIsMounted] = useState(false)
  const [context, setContext] = useState<string>('registration') // registration | password_change | password_reset

  useEffect(() => {
    setIsMounted(true)

    // Get context from URL
    const urlContext = searchParams?.get('context') || 'registration'
    setContext(urlContext)

    // Handle different contexts
    if (urlContext === 'password_change') {
      // Password change context - get email from sessionStorage
      const email = sessionStorage.getItem('password_change_email')
      if (!email) {
        toast({
          variant: 'destructive',
          title: 'Session expirée',
          description: 'Veuillez recommencer le changement de mot de passe',
        })
        router.push('/dashboard/settings/security')
        return
      }
      setUserEmail(email)
    } else {
      // Original logic for registration context
      const pendingData = localStorage.getItem('pending_registration')
      if (!pendingData) {
        // No pending registration - check if user is already authenticated
        const authData = getAuthData()
        if (!authData) {
          router.push("/auth")
          return
        }
        setUserEmail(authData.user?.email)
      } else {
        // Has pending registration data - parse and set email
        try {
          const data = JSON.parse(pendingData)
          setUserEmail(data.email)
        } catch {
          router.push("/auth")
        }
      }
    }
  }, [router, searchParams, toast])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    if (verificationCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Code invalide",
        description: "Le code doit contenir exactement 6 chiffres",
      })
      return
    }

    setIsLoading(true)

    try {
      // Handle password change context
      if (context === 'password_change') {
        const email = sessionStorage.getItem('password_change_email')
        const newPassword = sessionStorage.getItem('password_change_new_password')

        if (!email || !newPassword) {
          toast({
            variant: 'destructive',
            title: 'Session expirée',
            description: 'Veuillez recommencer le changement de mot de passe',
          })
          router.push('/dashboard/settings/security')
          return
        }

        // Verify password change
        const { authApi: passwordApi } = await import('@/lib/api/auth')
        await passwordApi.verifyPasswordChange({
          email,
          verification_code: verificationCode,
          new_password: newPassword,
        })

        // Clear session storage
        sessionStorage.removeItem('password_change_email')
        sessionStorage.removeItem('password_change_new_password')

        toast({
          title: 'Mot de passe changé !',
          description: 'Votre mot de passe a été changé avec succès.',
        })

        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
        return
      }

      // Original registration/email verification logic
      const pendingData = localStorage.getItem('pending_registration')

      if (pendingData) {
        // NEW USER REGISTRATION - Complete registration with verification code
        const registrationData = JSON.parse(pendingData)

        const response = await authApi.register({
          email: registrationData.email,
          verification_code: verificationCode,
          password: registrationData.password,
          first_name: registrationData.first_name,
          last_name: registrationData.last_name,
          phone: registrationData.phone,
          role: registrationData.role,
        })

        // Store auth tokens
        const { setAuthData } = await import("@/lib/auth/storage")
        setAuthData(response)

        // Clear pending registration data
        localStorage.removeItem('pending_registration')

        toast({
          title: "Compte créé !",
          description: `Bienvenue ${registrationData.first_name} ${registrationData.last_name}`,
        })

        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      } else {
        // EXISTING USER - Email verification only
        const authData = getAuthData()

        if (!authData?.access_token) {
          toast({
            variant: "destructive",
            title: "Non authentifié",
            description: "Veuillez vous connecter d'abord",
          })
          router.push("/auth")
          return
        }

        await authApi.verifyEmail({ verification_code: verificationCode }, authData.access_token)

        toast({
          title: "Email vérifié !",
          description: "Votre adresse email a été vérifiée avec succès.",
        })

        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      }
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur de vérification",
        description: error instanceof Error ? error.message : "Code de vérification invalide",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)

    try {
      // Check if this is from registration or existing user
      const pendingData = localStorage.getItem('pending_registration')

      if (pendingData) {
        // NEW USER - Resend verification code for registration
        const registrationData = JSON.parse(pendingData)
        await authApi.requestVerificationCode(registrationData.email)

        toast({
          title: "Code renvoyé !",
          description: `Un nouveau code a été envoyé à ${registrationData.email}`,
        })
      } else {
        // EXISTING USER - Resend email verification
        const authData = getAuthData()

        if (!authData?.access_token) {
          toast({
            variant: "destructive",
            title: "Non authentifié",
            description: "Veuillez vous connecter d'abord",
          })
          return
        }

        const result = await authApi.resendEmailVerification(authData.access_token)

        toast({
          title: "Email renvoyé !",
          description: `Un nouveau code a été envoyé à ${result.email}`,
        })
      }
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de renvoyer l'email",
      })
    } finally {
      setIsResending(false)
    }
  }

  // Show loading state during SSR
  if (!isMounted) {
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
              <Mail className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Vérifiez votre email</h1>
            <p className="text-muted-foreground">
              Nous avons envoyé un code de vérification à <strong>{userEmail}</strong>
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Code de vérification</CardTitle>
              <CardDescription>
                Entrez le code à 6 chiffres que vous avez reçu par email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code de vérification</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                    disabled={isLoading}
                    className="text-center text-2xl tracking-widest"
                  />
                  <p className="text-sm text-muted-foreground">
                    Le code expire après 10 minutes
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || verificationCode.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Vérifier mon email
                    </>
                  )}
                </Button>

                <div className="space-y-2 pt-4 border-t">
                  <p className="text-sm text-center text-muted-foreground">
                    Vous n&apos;avez pas reçu le code ?
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResend}
                    disabled={isResending}
                    className="w-full"
                  >
                    {isResending ? "Envoi en cours..." : "Renvoyer le code"}
                  </Button>
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
