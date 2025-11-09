'use client'

/**
 * Page d'authentification unifiée (Login + Register)
 * Design basé sur le template Auth.tsx
 * Backend API: https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/api/v1
 */

import { useState, useEffect } from "react"
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
  const [accountLocked, setAccountLocked] = useState(false)
  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState(0)

  // État Register
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<"citizen" | "business">("citizen")
  const [registerLoading, setRegisterLoading] = useState(false)

  // État erreurs
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({})
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({})

  // Lockout countdown timer
  useEffect(() => {
    // Check for existing lockout on mount
    const checkLockout = () => {
      const lockoutData = localStorage.getItem('account_lockout')
      if (lockoutData) {
        try {
          const { lockedUntil, email } = JSON.parse(lockoutData)
          const lockedUntilDate = new Date(lockedUntil)
          const now = new Date()

          if (now < lockedUntilDate) {
            // Still locked
            const remainingSeconds = Math.floor((lockedUntilDate.getTime() - now.getTime()) / 1000)
            setAccountLocked(true)
            setLockoutSecondsRemaining(remainingSeconds)
            setLoginEmail(email)
          } else {
            // Lockout expired
            localStorage.removeItem('account_lockout')
            setAccountLocked(false)
            setLockoutSecondsRemaining(0)
          }
        } catch {
          // Invalid data, remove it
          localStorage.removeItem('account_lockout')
        }
      }
    }

    checkLockout()

    // Countdown interval
    const interval = setInterval(() => {
      setLockoutSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Lockout expired
          setAccountLocked(false)
          localStorage.removeItem('account_lockout')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

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

      // Redirect to dashboard
      // Note: Email verification is mandatory during registration,
      // so all accounts are pre-verified. No need to check email_verified here.
      setTimeout(() => {
        router.push("/dashboard")
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
        const errorMessage = error instanceof Error ? error.message : "Email ou mot de passe invalide"

        // Check for account lockout error
        const lockoutMatch = errorMessage.match(/Account locked\. Try again in (\d+) minutes?\./)
        if (lockoutMatch) {
          const remainingMinutes = parseInt(lockoutMatch[1])
          const remainingSeconds = remainingMinutes * 60
          const lockedUntil = new Date(Date.now() + remainingSeconds * 1000)

          // Store lockout info in localStorage
          localStorage.setItem('account_lockout', JSON.stringify({
            email: loginEmail,
            lockedUntil: lockedUntil.toISOString()
          }))

          // Update UI state
          setAccountLocked(true)
          setLockoutSecondsRemaining(remainingSeconds)

          toast({
            variant: "destructive",
            title: "Compte verrouillé",
            description: `Votre compte est temporairement verrouillé. Réessayez dans ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`,
          })
        } else {
          toast({
            variant: "destructive",
            title: "Erreur de connexion",
            description: errorMessage,
          })
        }
      }
    } finally {
      setLoginLoading(false)
    }
  }

  // Handler Register: Send verification code and redirect to verify-email page
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterErrors({})
    setRegisterLoading(true)

    try {
      // Validate all required fields
      if (!registerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail)) {
        setRegisterErrors({ email: "Email invalide" })
        setRegisterLoading(false)
        return
      }
      if (!firstName || firstName.length < 2) {
        setRegisterErrors({ first_name: "Prénom requis (min 2 caractères)" })
        setRegisterLoading(false)
        return
      }
      if (!lastName || lastName.length < 2) {
        setRegisterErrors({ last_name: "Nom requis (min 2 caractères)" })
        setRegisterLoading(false)
        return
      }
      if (!phone || !/^(222|555|551|333)\d{6}$/.test(phone)) {
        setRegisterErrors({ phone: "Téléphone invalide (222/555/551/333 + 6 chiffres)" })
        setRegisterLoading(false)
        return
      }
      if (!registerPassword || registerPassword.length < 8) {
        setRegisterErrors({ password: "Mot de passe invalide (min 8 caractères)" })
        setRegisterLoading(false)
        return
      }

      // Password strength validation
      if (!/[A-Z]/.test(registerPassword)) {
        setRegisterErrors({ password: "Le mot de passe doit contenir au moins une majuscule" })
        setRegisterLoading(false)
        return
      }
      if (!/[a-z]/.test(registerPassword)) {
        setRegisterErrors({ password: "Le mot de passe doit contenir au moins une minuscule" })
        setRegisterLoading(false)
        return
      }
      if (!/[0-9]/.test(registerPassword)) {
        setRegisterErrors({ password: "Le mot de passe doit contenir au moins un chiffre" })
        setRegisterLoading(false)
        return
      }
      if (!/[^A-Za-z0-9]/.test(registerPassword)) {
        setRegisterErrors({ password: "Le mot de passe doit contenir au moins un caractère spécial" })
        setRegisterLoading(false)
        return
      }

      // Store registration data in localStorage for use on verify-email page
      localStorage.setItem('pending_registration', JSON.stringify({
        email: registerEmail,
        password: registerPassword,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        role: role,
      }))

      // Request verification code (automatically sends email)
      await authApi.requestVerificationCode(registerEmail)

      // Redirect to verify-email page immediately
      router.push("/auth/verify-email")

      // Show success toast after redirect starts
      toast({
        title: "Code envoyé !",
        description: `Un code de vérification a été envoyé à ${registerEmail}`,
      })
    } catch (error: unknown) {
      // If email sending fails, show appropriate error message
      const errorMsg = error instanceof Error ? error.message : "Échec de l'inscription"

      // Check if error is email-related
      if (errorMsg.includes('email') || errorMsg.includes('SMTP') || errorMsg.includes('envoi')) {
        toast({
          variant: "destructive",
          title: "Impossible de vérifier votre email",
          description: "Consultez votre support pour accepter les emails et revenez.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Erreur d'inscription",
          description: errorMsg,
        })
      }
    } finally {
      setRegisterLoading(false)
    }
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
                    {/* Account Lockout Warning */}
                    {accountLocked && lockoutSecondsRemaining > 0 && (
                      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                        <h3 className="font-semibold text-destructive mb-2">Compte temporairement verrouillé</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Trop de tentatives de connexion échouées. Veuillez réessayer dans:
                        </p>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-destructive">
                            {Math.floor(lockoutSecondsRemaining / 60)}:{String(lockoutSecondsRemaining % 60).padStart(2, '0')}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">minutes restantes</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        disabled={accountLocked}
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
                        disabled={accountLocked}
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
                        disabled={accountLocked}
                      />
                      <Label
                        htmlFor="remember-me"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Se souvenir de moi
                      </Label>
                    </div>

                    <Button type="submit" className="w-full" disabled={loginLoading || accountLocked}>
                      {loginLoading ? "Connexion..." : accountLocked ? "Compte verrouillé" : "Se connecter"}
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
                        {registerErrors.first_name && (
                          <p className="text-sm text-destructive">{registerErrors.first_name}</p>
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
                        {registerErrors.last_name && (
                          <p className="text-sm text-destructive">{registerErrors.last_name}</p>
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
                      {registerErrors.email && (
                        <p className="text-sm text-destructive">{registerErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="222123456, 555123456, 551123456 ou 333123456"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                      {registerErrors.phone && (
                        <p className="text-sm text-destructive">{registerErrors.phone}</p>
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
                      {registerErrors.password && (
                        <p className="text-sm text-destructive">{registerErrors.password}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
                      </p>
                    </div>

                    <Button type="submit" className="w-full" disabled={registerLoading}>
                      {registerLoading ? "Création..." : "Créer un compte"}
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
