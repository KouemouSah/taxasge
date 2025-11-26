'use client'

/**
 * Password Reset Request Page
 * Allows users to request a password reset email
 * Backend: POST /auth/password/reset/request
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Mail, ArrowLeft } from "lucide-react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { authApi } from "@/lib/api/auth"

export default function ResetPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await authApi.requestPasswordReset({ email })

      setEmailSent(true)
      toast({
        title: "Email envoyé !",
        description: `Instructions de réinitialisation envoyées à ${result.email}`,
      })
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d&apos;envoyer l&apos;email",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-2">Vérifiez votre email</h1>
              <p className="text-muted-foreground">
                Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Prochaines étapes</CardTitle>
                <CardDescription>
                  Suivez les instructions pour réinitialiser votre mot de passe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <p>1. Ouvrez votre boîte mail</p>
                  <p>2. Cliquez sur le lien dans l&apos;email</p>
                  <p>3. Définissez votre nouveau mot de passe</p>
                </div>

                <div className="pt-4 space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    Le lien expire dans 1 heure
                  </p>

                  <Button
                    variant="outline"
                    onClick={() => setEmailSent(false)}
                    className="w-full"
                  >
                    Renvoyer l&apos;email
                  </Button>

                  <Button
                    variant="link"
                    onClick={() => router.push("/auth")}
                    className="w-full"
                  >
                    Retour à la connexion
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Mot de passe oublié ?</h1>
            <p className="text-muted-foreground">
              Pas de problème ! Entrez votre email et nous vous enverrons un lien de réinitialisation
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Réinitialiser le mot de passe</CardTitle>
              <CardDescription>
                Entrez l&apos;adresse email associée à votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Envoyer le lien
                    </>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Link href="/auth">
                    <Button variant="link" className="text-sm">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Retour à la connexion
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Vous vous souvenez de votre mot de passe ?{" "}
              <Link href="/auth" className="text-primary hover:underline">
                Connectez-vous
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
