'use client'

/**
 * Page d'authentification unifiée (Login + Register)
 * Design basé sur le template Auth.tsx
 * Backend API: https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/api/v1
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { User, Building2 } from "lucide-react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { authApi } from "@/lib/api/authApi"
import { setAuthData } from "@/lib/auth/storage"
import { loginSchema } from "@/lib/validations/auth"
import { z } from "zod"
export default function AuthPage() {
  const router = useRouter()
  const { toast } = useToast()

  // État Login
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)

  // État Register (simple form, pas two-step UI pour l'instant)
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<"citizen" | "business">("citizen")
  const [_registerLoading, _setRegisterLoading] = useState(false)

  // État erreurs
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({})
  const [_registerErrors, _setRegisterErrors] = useState<Record<string, string>>({})

  // Handler Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginErrors({})
    setLoginLoading(true)

    try {
      // Validation Zod
      const validated = loginSchema.parse({
        email: loginEmail,
        password: loginPassword,
        remember_me: rememberMe,
      })

      // Appel API
      const response = await authApi.login(validated)

      // Stockage tokens + user
      // Check if 2FA is required
      if ('requires_2fa' in response) {
        // TODO: Handle 2FA flow
        toast({
          title: "2FA requis",
          description: response.message,
        })
        return
      }

      // Standard login (no 2FA)
      setAuthData(response)

      // Toast succès
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${response.user.first_name || response.user.email}`,
      })

      // CRITICAL: Check email_verified status (OWASP: Proper session management)
      // Only redirect to verify-email if email NOT verified
      setTimeout(() => {
        if (response.user.email_verified) {
          // Email verified → Dashboard
          router.push("/dashboard")
        } else {
          // Email NOT verified → Verification page
          router.push("/auth/verify-email")
        }
      }, 500)
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        // Erreurs validation
        const errors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message
          }
        })
        setLoginErrors(errors)
      } else {
        // Erreurs API
        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: error instanceof Error ? error.message : "Email ou mot de passe invalide",
        })
      }
    } finally {
      setLoginLoading(false)
    }
  }

  // Handler Register
  // NOTE: Backend utilise two-step (verification_code requis)
  // Pour l'instant, formulaire simple - two-step UI sera ajouté plus tard
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    toast({
      variant: "destructive",
      title: "Fonctionnalité en développement",
      description: "Le formulaire d'inscription two-step est en cours d'implémentation. Utilisez TwoStepRegisterForm component.",
    })

    // TODO: Implémenter formulaire two-step complet ou utiliser TwoStepRegisterForm
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Header Text */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Bienvenue</h1>
            <p className="text-muted-foreground">
              Connectez-vous pour accéder à vos services fiscaux
            </p>
          </div>

          {/* Auth Card */}
          <Card>
            <CardHeader>
              <CardTitle>Authentification</CardTitle>
              <CardDescription>
                Connectez-vous ou créez un nouveau compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Connexion</TabsTrigger>
                  <TabsTrigger value="register">Inscription</TabsTrigger>
                </TabsList>

                {/* TAB LOGIN */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                      {loginErrors.email && (
                        <p className="text-sm text-destructive">{loginErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Mot de passe</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                      {loginErrors.password && (
                        <p className="text-sm text-destructive">{loginErrors.password}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      />
                      <Label
                        htmlFor="remember-me"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Se souvenir de moi
                      </Label>
                    </div>

                    <Button type="submit" className="w-full" disabled={loginLoading}>
                      {loginLoading ? "Connexion..." : "Se connecter"}
                    </Button>

                    <div className="text-center">
                      <Link
                        href="/forgot-password"
                        className="text-sm text-primary hover:underline"
                      >
                        Mot de passe oublié ?
                      </Link>
                    </div>
                  </form>
                </TabsContent>

                {/* TAB REGISTER */}
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    {/* Type de compte - RadioGroup avec icônes */}
                    <div className="space-y-3">
                      <Label>Type de compte</Label>
                      <RadioGroup
                        value={role}
                        onValueChange={(value) => setRole(value as "citizen" | "business")}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div>
                          <RadioGroupItem
                            value="citizen"
                            id="citizen"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="citizen"
                            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                          >
                            <User className="mb-2 h-8 w-8" />
                            <span className="font-medium">Citoyen</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem
                            value="business"
                            id="business"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="business"
                            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                          >
                            <Building2 className="mb-2 h-8 w-8" />
                            <span className="font-medium">Entreprise</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">Prénom</Label>
                        <Input
                          id="first-name"
                          type="text"
                          placeholder="Jean"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                        {({} as any).first_name && (
                          <p className="text-sm text-destructive">{({} as any).first_name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="last-name">Nom</Label>
                        <Input
                          id="last-name"
                          type="text"
                          placeholder="Dupont"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                        {({} as any).last_name && (
                          <p className="text-sm text-destructive">{({} as any).last_name}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                      />
                      {({} as any).email && (
                        <p className="text-sm text-destructive">{({} as any).email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="222123456 ou 555123456"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                      {({} as any).phone && (
                        <p className="text-sm text-destructive">{({} as any).phone}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">Mot de passe</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                      />
                      {({} as any).password && (
                        <p className="text-sm text-destructive">{({} as any).password}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full">
                      Créer un compte
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
