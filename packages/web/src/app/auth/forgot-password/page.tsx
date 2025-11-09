'use client'

/**
 * Forgot Password Page
 * Allows users to request a password reset link via email
 * Backend: POST /api/v1/auth/password/reset/request
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { authApi } from '@/lib/api/auth'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Email requis',
        description: 'Veuillez entrer votre adresse email',
      })
      return
    }

    setIsLoading(true)

    try {
      await authApi.requestPasswordReset({ email })

      setEmailSent(true)
      toast({
        title: 'Email envoyé !',
        description: 'Si votre email existe dans notre système, vous recevrez un lien de réinitialisation.',
      })
    } catch (error: unknown) {
      // For security, we always show success message even if email doesn't exist
      setEmailSent(true)
      toast({
        title: 'Email envoyé !',
        description: 'Si votre email existe dans notre système, vous recevrez un lien de réinitialisation.',
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
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <CardTitle>Email envoyé</CardTitle>
                <CardDescription>
                  Si votre email existe dans notre système, vous recevrez un lien de réinitialisation dans quelques minutes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Le lien de réinitialisation expire dans 1 heure. Vérifiez votre dossier spam si vous ne le voyez pas.
                  </p>
                </div>

                <Link href="/auth">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à la connexion
                  </Button>
                </Link>
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
            <div className="flex justify-center mb-4">
              <Mail className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Mot de passe oublié ?</h1>
            <p className="text-muted-foreground">
              Entrez votre adresse email et nous vous enverrons un lien de réinitialisation
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Réinitialiser le mot de passe</CardTitle>
              <CardDescription>
                Nous vous enverrons un email avec un lien pour réinitialiser votre mot de passe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    autoFocus
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
                      Envoyer le lien de réinitialisation
                    </>
                  )}
                </Button>

                <div className="pt-4 border-t text-center">
                  <Link href="/auth" className="text-sm text-primary hover:underline">
                    <ArrowLeft className="inline mr-1 h-3 w-3" />
                    Retour à la connexion
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
