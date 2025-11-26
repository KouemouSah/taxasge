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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { authApi } from "@/lib/api/authApi"
import { setAuthData } from "@/lib/auth/storage"
import { loginSchema, registerSchema } from "@/lib/validations/auth"
import { z } from "zod"

export default function AuthPage() {
  const router = useRouter()
  const { toast } = useToast()

  // État Login
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)

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
      setAuthData(response.access_token, response.refresh_token, response.user)

      // Toast succès
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${response.user.first_name || response.user.email}`,
      })

      // Redirection dashboard
      setTimeout(() => {
        router.push("/dashboard")
      }, 500)
    } catch (error: any) {
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
          description: error.message || "Email ou mot de passe invalide",
        })
      }
    } finally {
      setLoginLoading(false)
    }
  }

  // Handler Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterErrors({})
    setRegisterLoading(true)

    try {
      // Validation Zod
      const validated = registerSchema.parse({
        email: registerEmail,
        password: registerPassword,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        role: role,
      })

      // Appel API
      const response = await authApi.register(validated)

      // Stockage tokens + user
      setAuthData(response.access_token, response.refresh_token, response.user)

      // Toast succès
      toast({
        title: "Compte créé avec succès",
        description: `Bienvenue ${response.user.first_name} ${response.user.last_name}`,
      })

      // Redirection dashboard
      setTimeout(() => {
        router.push("/dashboard")
      }, 500)
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        // Erreurs validation
        const errors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message
          }
        })
        setRegisterErrors(errors)
      } else {
        // Erreurs API
        toast({
          variant: "destructive",
          title: "Erreur d'inscription",
          description: error.message || "Une erreur est survenue lors de l'inscription",
        })
      }
    } finally {
      setRegisterLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Simple */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            TaxasGE
          </Link>
        </div>
      </header>

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
                        href="#"
                        className="text-sm text-primary hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          toast({
                            title: "Fonctionnalité à venir",
                            description: "La réinitialisation du mot de passe sera bientôt disponible",
                          })
                        }}
                      >
                        Mot de passe oublié ?
                      </Link>
                    </div>
                  </form>
                </TabsContent>

                {/* TAB REGISTER */}
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
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
                      <Label htmlFor="phone">Téléphone (E.164)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+240222123456"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                      {registerErrors.phone && (
                        <p className="text-sm text-destructive">{registerErrors.phone}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Format: +240... (Guinée Équatoriale), +33... (France), +221... (Sénégal)
                      </p>
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
                        Min. 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Type de compte</Label>
                      <Select value={role} onValueChange={(value: "citizen" | "business") => setRole(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="citizen">Citoyen</SelectItem>
                          <SelectItem value="business">Entreprise</SelectItem>
                        </SelectContent>
                      </Select>
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

      {/* Footer Simple */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 TaxasGE - Gestión Fiscal de Guinea Ecuatorial</p>
        </div>
      </footer>
    </div>
  )
}
