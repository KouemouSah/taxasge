'use client'

/**
 * Email Verification Page
 * Allows users to enter their 6-digit verification code
 * Backend: POST /auth/email/verify
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, Mail } from "lucide-react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { authApi } from "@/lib/api/auth"
import { getAuthData } from "@/lib/auth/storage"

export default function VerifyEmailPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [verificationCode, setVerificationCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const authData = getAuthData()

    if (!authData) {
      router.push("/auth")
      return
    }

    setUserEmail(authData.user?.email)
  }, [router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

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
      await authApi.verifyEmail({ verification_code: verificationCode })

      toast({
        title: "Email vérifié !",
        description: "Votre adresse email a été vérifiée avec succès.",
      })

      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
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
    const authData = getAuthData()

    if (!authData?.access_token) {
      toast({
        variant: "destructive",
        title: "Non authentifié",
        description: "Veuillez vous connecter d'abord",
      })
      return
    }

    setIsResending(true)

    try {
      const result = await authApi.resendEmailVerification()

      toast({
        title: "Email renvoyé !",
        description: `Un nouveau code a été envoyé à ${result.email}`,
      })
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

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => router.push("/dashboard")}
                    className="text-sm"
                  >
                    Je le ferai plus tard
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
