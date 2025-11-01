# 📘 GUIDE MIGRATION D'UNE PAGE TEMPLATE

**Version** : 1.0  
**Date** : 31 Octobre 2025  
**Statut** : ✅ ACTIF  
**Objectif** : Méthodologie étape par étape pour migrer une page React Router → Next.js App Router


## ⚠️ DEUX MODES DE TRAVAIL

┌────────────────────────────────────────────────────────────────┐
│  📋 MODE 1 : MIGRATION                                         │
│  Page existe dans C:/taxasge/.github/docs-internal/Documentations/FRONTEND/template/src/pages/                                │
├────────────────────────────────────────────────────────────────┤
│  Action : Transformer template existant → Next.js              │
│                                                                 │
│  ✅ COPIER UI du template source (structure, styles, layout)   │
│  ✅ ADAPTER code technique (routing Next.js, API integration)  │
│  ✅ GARDER apparence identique (design, couleurs, espaces)     │
│  ❌ NE PAS modifier visuellement sauf en cas de précision utilisateur                              │
│                                                                 │
│  Exemple : Login (template C:/taxasge/.github/docs-internal/Documentations/FRONTEND/template/src/pages/Auth.tsx existe)       │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  🆕 MODE 2 : CRÉATION                                          │
│  Page n'existe PAS dans C:/taxasge/.github/docs-internal/Documentations/FRONTEND/template/src/pages/                         │
├────────────────────────────────────────────────────────────────┤
│  Action : Créer nouvelle page en respectant design system      │
│                                                                 │
│  ✅ IDENTIFIER page référence similaire (voir tableau)         │
│  ✅ RÉUTILISER structure HTML + classes Tailwind référence     │
│  ✅ COPIER layout, composants, styles de la référence          │
│  ✅ ADAPTER contenu spécifique (textes, champs, endpoints)     │
│  ❌ NE PAS inventer nouveau design                             │
│                                                                 │
│  Exemple : Forgot Password (pas de template, réf: Auth.tsx)    │
└────────────────────────────────────────────────────────────────┘

DIR  = "C:/taxasge/.github/docs-internal/Documentations/FRONTEND/template/src/pages/" 
---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Étape 1 : Analyser Template Source](#étape-1--analyser-template-source)
3. [Étape 2 : Créer Structure Next.js](#étape-2--créer-structure-nextjs)
4. [Étape 3 : Adapter Imports Routing](#étape-3--adapter-imports-routing)
5. [Étape 4 : Intégrer API Backend](#étape-4--intégrer-api-backend)
6. [Étape 5 : Adapter Formulaires](#étape-5--adapter-formulaires)
7. [Étape 6 : Tester](#étape-6--tester)
8. [Étape 7 : Valider et Documenter](#étape-7--valider-et-documenter)
9. [Patterns de Transformation](#patterns-de-transformation)
10. [Checklist Complète](#checklist-complète)

---

## 🎯 VUE D'ENSEMBLE

### Principe Méthodologie

Cette méthodologie en **7 étapes** permet de migrer **une page** React Router vers Next.js App Router de manière systématique et fiable.

### Temps Estimé par Page

- **Page simple** (ex: Landing, About) : 2-3h
- **Page avec formulaire** (ex: Login, Register) : 4-6h
- **Page avec API multiple** (ex: Dashboard, Admin) : 6-8h

### Prérequis

Avant de commencer :
- ✅ Backend API opérationnel (endpoints disponibles)
- ✅ Design system configuré (Tailwind, shadcn/ui)
- ✅ Composants UI installés
- ✅ Workflow migration lu (FRONTEND_MIGRATION_WORKFLOW.md)

---

## 📂 ÉTAPE 1 : ANALYSER TEMPLATE SOURCE

**Durée** : 10-15 minutes  
**Objectif** : Comprendre structure et dépendances de la page template

### 1.1 Localiser Template Source

```bash
# Templates sources disponibles dans :
DIR/ [PageName].tsx

# Exemples :
/mnt/project/Auth.tsx              # Pages login + register
/mnt/project/Services.tsx          # Page grid services
/mnt/project/Dashboard.tsx         # Dashboard layout
/mnt/project/Profile.tsx           # Page profil
```

### 1.2 Analyser Structure Template

**Questions à se poser** :

#### Q1 : Quels composants UI shadcn/ui sont utilisés ?

```tsx
// Exemple Auth.tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// ✅ Liste à noter : Button, Input, Card, Tabs
```

**Action** : Lister tous composants shadcn/ui utilisés

---

#### Q2 : Y a-t-il du routing ?

```tsx
// ❌ React Router (À adapter)
import { Link, useNavigate } from "react-router-dom"

<Link to="/dashboard">Dashboard</Link>

const navigate = useNavigate()
navigate("/services")
```

**Action** : 
- ✅ Noter tous `<Link to>` à transformer en `<Link href>`
- ✅ Noter tous `useNavigate()` à transformer en `useRouter()`

---

#### Q3 : Y a-t-il des formulaires ?

```tsx
// Formulaire avec state
const [email, setEmail] = useState("")
const [password, setPassword] = useState("")

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  // Appel API
}
```

**Action** :
- ✅ Noter champs formulaire (email, password, etc.)
- ✅ Identifier validation existante (ou à ajouter avec Zod)
- ✅ Noter bouton submit et loading states

---

#### Q4 : Y a-t-il des appels API ?

```tsx
// Appel API dans template
const handleLogin = async () => {
  const response = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}
```

**Action** :
- ✅ Noter endpoints utilisés (POST /api/login)
- ✅ Noter données envoyées/reçues
- ✅ Identifier où créer fonctions API (lib/api/endpoints/)

---

#### Q5 : Client Component ou Server Component ?

**Client Component si utilise** :
- ✅ `useState`, `useEffect`, `useRef`
- ✅ Event handlers (`onClick`, `onChange`)
- ✅ Hooks personnalisés (`useAuth`, etc.)
- ✅ Browser APIs (localStorage, etc.)

**Server Component si** :
- ✅ Pas d'interactivité
- ✅ Fetch données uniquement
- ✅ Pas de state

**Action** : Déterminer si besoin `'use client'` en haut du fichier

---

### 1.3 Exemple Analyse : Auth.tsx

```tsx
// ❌ TEMPLATE SOURCE : DIR/Auth.tsx

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const Auth = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  const handleLogin = async () => {
    // Appel API
    navigate("/dashboard")
  }
  
  return (
    <Tabs defaultValue="login">
      <TabsList>
        <TabsTrigger value="login">Connexion</TabsTrigger>
        <TabsTrigger value="signup">Inscription</TabsTrigger>
      </TabsList>
      
      <TabsContent value="login">
        <form onSubmit={handleLogin}>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit">Se connecter</Button>
          <Link to="/forgot-password">Mot de passe oublié ?</Link>
        </form>
      </TabsContent>
    </Tabs>
  )
}

export default Auth
```

**📊 Résultat Analyse** :

| Aspect | Constat | Action |
|--------|---------|--------|
| **Composants UI** | Button, Input, Tabs | ✅ Déjà disponibles shadcn/ui |
| **Routing** | `Link to`, `useNavigate` | ⚠️ À adapter (next/link, useRouter) |
| **Formulaire** | Email + password, submit | ⚠️ Ajouter validation Zod |
| **API** | Appel login (fetch) | ⚠️ Créer lib/api/endpoints/auth.ts |
| **State** | useState, event handlers | ⚠️ Client Component ('use client') |
| **Layout** | Tabs login/signup | ✅ Structure à conserver |

**Décision** : Client Component avec validation Zod et API integration

---

## 🏗️ ÉTAPE 2 : CRÉER STRUCTURE NEXT.JS

**Durée** : 15-20 minutes  
**Objectif** : Créer fichiers et dossiers Next.js appropriés

### 2.1 Déterminer Emplacement Page

**Règles Next.js App Router** :

```
app/
├── page.tsx                           # Route : /
├── about/page.tsx                     # Route : /about
├── services/
│   ├── page.tsx                       # Route : /services
│   └── [id]/page.tsx                  # Route : /services/[id] (dynamic)
├── auth/
│   ├── login/page.tsx                 # Route : /auth/login
│   └── register/page.tsx              # Route : /auth/register
└── dashboard/
    ├── layout.tsx                     # Layout dashboard (avec sidebar)
    ├── page.tsx                       # Route : /dashboard
    └── profile/page.tsx               # Route : /dashboard/profile
```

### 2.2 Créer Fichier Page

**Template de base Next.js** :

```tsx
// ✅ STRUCTURE NEXT.JS PAGE

// 1. Si interactivité (useState, event handlers) → Ajouter 'use client'
'use client'

// 2. Imports
import { useState } from 'react'
import Link from 'next/link'                    // ← next/link (PAS react-router-dom)
import { useRouter } from 'next/navigation'     // ← next/navigation (PAS react-router-dom)

// 3. Imports composants UI
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// 4. Export default avec nom descriptif
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  
  return (
    <div>
      <h1>Connexion</h1>
      {/* Contenu page */}
    </div>
  )
}
```

### 2.3 Séparer en Composants (Recommandé)

**Bonne pratique** : Séparer logique métier dans composants dédiés

```
app/auth/login/
└── page.tsx                    # Page simple (wrapper)

components/auth/
└── LoginForm.tsx               # Composant formulaire (logique)
```

**Exemple** :

```tsx
// ✅ app/auth/login/page.tsx (Simple, propre)
import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Connexion | TaxasGE',
  description: 'Connectez-vous à votre espace fiscal',
}

export default function LoginPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Connexion</h1>
      <LoginForm />
    </div>
  )
}
```

```tsx
// ✅ components/auth/LoginForm.tsx (Logique métier)
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Logique login
    router.push('/dashboard')
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input 
        type="email" 
        placeholder="Email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input 
        type="password" 
        placeholder="Mot de passe" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" className="w-full">
        Se connecter
      </Button>
    </form>
  )
}
```

**Avantages** :
- ✅ Page légère (SEO metadata)
- ✅ Logique métier isolée (testable)
- ✅ Réutilisable (LoginForm peut être utilisé ailleurs)
- ✅ 'use client' seulement où nécessaire

---

## 🔄 ÉTAPE 3 : ADAPTER IMPORTS ROUTING

**Durée** : 10-15 minutes  
**Objectif** : Transformer tous éléments routing React Router → Next.js

### 3.1 Imports à Changer

**Tableau transformations obligatoires** :

| React Router | Next.js | Import de |
|-------------|---------|-----------|
| `import { Link } from 'react-router-dom'` | `import Link from 'next/link'` | `'next/link'` |
| `import { useNavigate } from 'react-router-dom'` | `import { useRouter } from 'next/navigation'` | `'next/navigation'` ⚠️ |
| `import { useLocation } from 'react-router-dom'` | `import { usePathname } from 'next/navigation'` | `'next/navigation'` |
| `import { useParams } from 'react-router-dom'` | `import { useParams } from 'next/navigation'` | `'next/navigation'` |

**⚠️ ATTENTION** : Next.js a 2 packages routing !
- ❌ `'next/router'` : Pages Router (ancien, ne PAS utiliser)
- ✅ `'next/navigation'` : App Router (nouveau, utiliser)

---

### 3.2 Composant Link

**Transformation** :

```tsx
// ❌ AVANT (React Router)
import { Link } from "react-router-dom"

<Link to="/dashboard">Dashboard</Link>
<Link to="/services">Services</Link>
<Link to={`/service/${id}`}>Détail</Link>
```

```tsx
// ✅ APRÈS (Next.js)
import Link from "next/link"

<Link href="/dashboard">Dashboard</Link>
<Link href="/services">Services</Link>
<Link href={`/service/${id}`}>Détail</Link>
```

**Changements** :
- ✅ Import différent : `from "next/link"` (natif Next.js)
- ✅ Prop différente : `href` au lieu de `to`
- ✅ Syntaxe identique pour le reste

---

### 3.3 Navigation Programmatique

**Transformation** :

```tsx
// ❌ AVANT (React Router)
import { useNavigate } from "react-router-dom"

function Component() {
  const navigate = useNavigate()
  
  const handleClick = () => {
    navigate('/dashboard')                    // Navigation simple
    navigate('/services', { replace: true })  // Remplacer historique
    navigate(-1)                              // Retour arrière
  }
}
```

```tsx
// ✅ APRÈS (Next.js)
import { useRouter } from "next/navigation"   // ⚠️ 'next/navigation' PAS 'next/router'

function Component() {
  const router = useRouter()
  
  const handleClick = () => {
    router.push('/dashboard')                 // Navigation simple
    router.replace('/services')               // Remplacer historique
    router.back()                             // Retour arrière
  }
}
```

**Changements** :
- ✅ Import : `useRouter` de `'next/navigation'`
- ✅ Méthode : `router.push()` au lieu de `navigate()`
- ✅ Replace : `router.replace()` au lieu de `navigate(path, { replace: true })`
- ✅ Back : `router.back()` au lieu de `navigate(-1)`

---

### 3.4 Paramètres URL (Dynamic Routes)

**Transformation** :

```tsx
// ❌ AVANT (React Router)
import { useParams } from "react-router-dom"

function ServiceDetail() {
  const { id } = useParams()  // /service/123 → id = "123"
  
  return <div>Service ID: {id}</div>
}
```

```tsx
// ✅ APRÈS (Next.js)
import { useParams } from "next/navigation"

function ServiceDetail() {
  const params = useParams()
  const id = params.id        // /service/123 → id = "123"
  
  return <div>Service ID: {id}</div>
}
```

**Changements** :
- ✅ Import identique mais de `'next/navigation'`
- ✅ Retourne objet `params` (pas destructuration directe)
- ✅ Accès via `params.id` ou `params.slug`

---

### 3.5 Pathname Actuel

**Transformation** :

```tsx
// ❌ AVANT (React Router)
import { useLocation } from "react-router-dom"

function Navigation() {
  const location = useLocation()
  const isActive = location.pathname === '/services'
  
  return <div>Current: {location.pathname}</div>
}
```

```tsx
// ✅ APRÈS (Next.js)
import { usePathname } from "next/navigation"

function Navigation() {
  const pathname = usePathname()
  const isActive = pathname === '/services'
  
  return <div>Current: {pathname}</div>
}
```

**Changements** :
- ✅ Hook différent : `usePathname` au lieu de `useLocation`
- ✅ Retourne string directement (pas objet)

---

### 3.6 Exemple Complet Transformation

```tsx
// ❌ AVANT (React Router)
import { Link, useNavigate, useParams, useLocation } from "react-router-dom"

const ServiceDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  
  const handleBack = () => navigate(-1)
  const handleGoToServices = () => navigate('/services')
  
  return (
    <div>
      <p>Current: {location.pathname}</p>
      <p>Service ID: {id}</p>
      <button onClick={handleBack}>Retour</button>
      <button onClick={handleGoToServices}>Services</button>
      <Link to="/dashboard">Dashboard</Link>
    </div>
  )
}
```

```tsx
// ✅ APRÈS (Next.js)
'use client'

import Link from "next/link"
import { useRouter, useParams, usePathname } from "next/navigation"

export default function ServiceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  
  const handleBack = () => router.back()
  const handleGoToServices = () => router.push('/services')
  
  return (
    <div>
      <p>Current: {pathname}</p>
      <p>Service ID: {params.id}</p>
      <button onClick={handleBack}>Retour</button>
      <button onClick={handleGoToServices}>Services</button>
      <Link href="/dashboard">Dashboard</Link>
    </div>
  )
}
```

---

## 🔗 ÉTAPE 4 : INTÉGRER API BACKEND

**Durée** : 30-60 minutes  
**Objectif** : Créer fonctions API et intégrer avec backend FastAPI

### 4.1 Créer API Client (Une fois pour tout le projet)

```typescript
// ✅ lib/api/client.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // Important pour cookies
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new APIError(
      error.detail || 'Erreur serveur',
      response.status,
      error
    )
  }
  
  return response.json()
}
```

---

### 4.2 Créer Endpoints par Fonctionnalité

**Structure recommandée** :

```
lib/api/endpoints/
├── auth.ts           # login, register, logout
├── users.ts          # getCurrentUser, updateProfile
├── declarations.ts   # getDeclarations, createDeclaration
└── services.ts       # getServices, getServiceById
```

---

### 4.3 Exemple Endpoint Auth

```typescript
// ✅ lib/api/endpoints/auth.ts

import { apiClient, APIError } from '../client'

// Types
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
    role: string
  }
}

// Fonctions API
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  return apiClient<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  return apiClient<AuthResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function logout(): Promise<void> {
  return apiClient('/api/v1/auth/logout', {
    method: 'POST',
  })
}
```

---

### 4.4 Utiliser dans Composant

```tsx
// ✅ components/auth/LoginForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/api/endpoints/auth'
import { APIError } from '@/lib/api/client'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await login({ email, password })
      
      // Success
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${response.user.first_name}`,
      })
      
      router.push('/dashboard')
      
    } catch (error) {
      // Error handling
      if (error instanceof APIError) {
        if (error.status === 401) {
          toast({
            title: "Erreur",
            description: "Identifiants invalides",
            variant: "destructive",
          })
        } else if (error.status === 500) {
          toast({
            title: "Erreur serveur",
            description: "Veuillez réessayer plus tard",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Erreur réseau",
          description: "Vérifiez votre connexion",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input 
        type="email" 
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        required
      />
      <Input 
        type="password" 
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        required
      />
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Connexion...' : 'Se connecter'}
      </Button>
    </form>
  )
}
```

**Points clés** :
- ✅ Gestion loading state (désactiver champs pendant appel)
- ✅ Gestion erreurs spécifiques (401, 500, network)
- ✅ Toast notifications (success + error)
- ✅ Redirect après success
- ✅ Types TypeScript stricts

---

## 📝 ÉTAPE 5 : ADAPTER FORMULAIRES

**Durée** : 30-45 minutes  
**Objectif** : Ajouter validation Zod et react-hook-form

### 5.1 Créer Schema Zod

```typescript
// ✅ lib/validations/auth.ts

import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Email invalide'),
  password: z
    .string()
    .min(8, 'Minimum 8 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[0-9]/, 'Au moins un chiffre'),
})

export const registerSchema = z.object({
  firstName: z
    .string()
    .min(2, 'Minimum 2 caractères')
    .max(50, 'Maximum 50 caractères'),
  lastName: z
    .string()
    .min(2, 'Minimum 2 caractères')
    .max(50, 'Maximum 50 caractères'),
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Email invalide'),
  password: z
    .string()
    .min(8, 'Minimum 8 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[0-9]/, 'Au moins un chiffre'),
  confirmPassword: z
    .string()
    .min(1, 'Confirmation requise'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"], // Erreur affichée sur confirmPassword
})

// Types inférés
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
```

---

### 5.2 Utiliser avec react-hook-form

```tsx
// ✅ components/auth/LoginForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginFormData } from '@/lib/validations/auth'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })
  
  async function onSubmit(data: LoginFormData) {
    try {
      await login(data)
      // Success handling
    } catch (error) {
      // Error handling
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full">
          Se connecter
        </Button>
        
      </form>
    </Form>
  )
}
```

**Avantages react-hook-form + Zod** :
- ✅ Validation automatique (client-side)
- ✅ Messages d'erreur sous champs
- ✅ Performance (re-render minimal)
- ✅ Type-safe (TypeScript)
- ✅ Accessibilité (ARIA automatic)

---

## 🧪 ÉTAPE 6 : TESTER

**Durée** : 1-2 heures  
**Objectif** : Tests unitaires (Jest) + E2E (Playwright)

### 6.1 Tests Unitaires (Jest)

```tsx
// ✅ components/auth/LoginForm.spec.tsx

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock login API
jest.mock('@/lib/api/endpoints/auth', () => ({
  login: jest.fn(),
}))

import { login } from '@/lib/api/endpoints/auth'

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('renders login form', () => {
    render(<LoginForm />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
  })
  
  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    
    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email invalide/i)).toBeInTheDocument()
    })
  })
  
  it('validates password length', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    
    await user.type(passwordInput, '123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/minimum 8 caractères/i)).toBeInTheDocument()
    })
  })
  
  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const mockLogin = login as jest.Mock
    mockLogin.mockResolvedValue({ user: { id: '1', email: 'test@test.com' } })
    
    render(<LoginForm />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@test.com')
    await user.type(screen.getByLabelText(/mot de passe/i), 'Password123')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'Password123',
      })
    })
  })
})
```

---

### 6.2 Tests E2E (Playwright)

```typescript
// ✅ e2e/auth/login.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
  })
  
  test('displays login form', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible()
  })
  
  test('shows validation errors for invalid email', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByRole('button', { name: /se connecter/i }).click()
    
    await expect(page.getByText(/email invalide/i)).toBeVisible()
  })
  
  test('successful login redirects to dashboard', async ({ page }) => {
    // Arrange: Mock API response
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          access_token: 'mock-token',
          user: { id: '1', email: 'test@test.com', first_name: 'Test' },
        }),
      })
    })
    
    // Act: Fill form and submit
    await page.getByLabel(/email/i).fill('test@test.com')
    await page.getByLabel(/mot de passe/i).fill('Password123')
    await page.getByRole('button', { name: /se connecter/i }).click()
    
    // Assert: Redirected to dashboard
    await expect(page).toHaveURL('/dashboard')
  })
  
  test('shows error message for invalid credentials', async ({ page }) => {
    // Arrange: Mock API error
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ detail: 'Identifiants invalides' }),
      })
    })
    
    // Act
    await page.getByLabel(/email/i).fill('test@test.com')
    await page.getByLabel(/mot de passe/i).fill('WrongPassword')
    await page.getByRole('button', { name: /se connecter/i }).click()
    
    // Assert: Toast error visible
    await expect(page.getByText(/identifiants invalides/i)).toBeVisible()
  })
})
```

---

### 6.3 Exécuter Tests

```bash
cd packages/web

# Tests unitaires Jest
npm run test

# Avec coverage
npm run test:coverage

# Tests E2E Playwright
npm run test:e2e

# Mode watch (développement)
npm run test:watch
```

---

## ✅ ÉTAPE 7 : VALIDER ET DOCUMENTER

**Durée** : 30 minutes  
**Objectif** : Validation complète et rapport

### 7.1 Checklist Validation

**Fonctionnel** :
- [ ] Page accessible à URL correcte
- [ ] Tous liens cliquables et fonctionnels
- [ ] Formulaires soumettent données à API
- [ ] Loading states visibles pendant appels API
- [ ] Error handling complet (401, 500, network)
- [ ] Toast notifications (success + error)
- [ ] Redirections fonctionnelles

**Technique** :
- [ ] TypeScript compile sans erreurs (`npm run type-check`)
- [ ] ESLint passe (`npm run lint`)
- [ ] Tests Jest : 100% passants
- [ ] Tests Playwright : 100% passants
- [ ] Coverage : >80% (`npm run test:coverage`)
- [ ] Build réussit (`npm run build`)

**UI/UX** :
- [ ] Responsive : Mobile (375px), Tablet (768px), Desktop (1024px+)
- [ ] Lighthouse Performance : >85
- [ ] Lighthouse Accessibility : >85
- [ ] ARIA labels présents sur tous champs
- [ ] Keyboard navigation fonctionnelle (Tab, Enter, Escape)
- [ ] Focus visible sur tous éléments interactifs

**Design** :
- [ ] Charte graphique respectée (couleurs, typographie)
- [ ] Espacements cohérents
- [ ] Composants shadcn/ui utilisés correctement
- [ ] Animations fluides

---

### 7.2 Générer Rapport

**Template rapport** :

```markdown
## TASK-MIGRATION-XXX : [Nom Page]

**Date** : 2025-10-31  
**Assigné à** : Frontend Agent  
**Statut** : ✅ TERMINÉ

---

### 📋 Description

Migration page [PageName] de React Router vers Next.js App Router.

**Template source** : `DIR/[PageName].tsx`  
**Destination** : `app/[path]/page.tsx`  
**Backend API** : `[Endpoints utilisés]`

---

### 🔄 Transformations Effectuées

1. **Routing adapté**
   - `<Link to>` → `<Link href>`
   - `useNavigate()` → `useRouter()`
   
2. **Structure Next.js créée**
   - Page : `app/[path]/page.tsx`
   - Composant : `components/[category]/[Component].tsx`
   
3. **API intégrée**
   - Endpoints : `lib/api/endpoints/[resource].ts`
   - Gestion erreurs complète
   
4. **Validation ajoutée**
   - Schema Zod : `lib/validations/[resource].ts`
   - react-hook-form intégré

5. **Tests écrits**
   - Tests Jest : `[Component].spec.tsx`
   - Tests E2E : `e2e/[path]/[test].spec.ts`

---

### 📊 Fichiers Créés/Modifiés

**Créés** :
- ✅ `app/[path]/page.tsx`
- ✅ `components/[category]/[Component].tsx`
- ✅ `lib/api/endpoints/[resource].ts`
- ✅ `lib/validations/[resource].ts`
- ✅ `components/[category]/[Component].spec.tsx`
- ✅ `e2e/[path]/[test].spec.ts`

**Modifiés** :
- ⚙️ `[Fichiers modifiés]`

---

### 🧪 Métriques

**Tests** :
- Jest : 15/15 passants (100%)
- Playwright : 8/8 passants (100%)
- Coverage : 87%

**Performance** :
- Lighthouse Performance : 92
- Lighthouse Accessibility : 95
- Lighthouse Best Practices : 100
- Lighthouse SEO : 100

**Build** :
- ✅ TypeScript compile sans erreurs
- ✅ ESLint passe
- ✅ Build réussit

---

### 📸 Captures Écran

[Ajouter captures mobile + desktop]

---

### ⚠️ Problèmes Rencontrés

1. **[Problème 1]**
   - **Solution** : [Solution appliquée]

2. **[Problème 2]**
   - **Solution** : [Solution appliquée]

---

### 🚀 Prochaines Étapes

- [Action suivante si applicable]

---

**Rapport généré par** : Frontend Agent  
**Date** : 2025-10-31
```

---

## 🔧 PATTERNS DE TRANSFORMATION

### Pattern 1 : Page Simple (Sans Formulaire)

```tsx
// ❌ TEMPLATE SOURCE
import { Link } from "react-router-dom"

const About = () => {
  return (
    <div>
      <h1>À propos</h1>
      <p>Contenu...</p>
      <Link to="/">Accueil</Link>
    </div>
  )
}

export default About
```

```tsx
// ✅ NEXT.JS (Server Component)
import Link from "next/link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: 'À propos | TaxasGE',
}

export default function AboutPage() {
  return (
    <div>
      <h1>À propos</h1>
      <p>Contenu...</p>
      <Link href="/">Accueil</Link>
    </div>
  )
}
```

---

### Pattern 2 : Page avec State Local

```tsx
// ❌ TEMPLATE SOURCE
import { useState } from "react"
import { Button } from "@/components/ui/button"

const Counter = () => {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <p>Count: {count}</p>
      <Button onClick={() => setCount(count + 1)}>+</Button>
    </div>
  )
}

export default Counter
```

```tsx
// ✅ NEXT.JS (Client Component)
'use client'                    // ← IMPORTANT

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function CounterPage() {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <p>Count: {count}</p>
      <Button onClick={() => setCount(count + 1)}>+</Button>
    </div>
  )
}
```

---

### Pattern 3 : Page avec API Fetch

```tsx
// ❌ TEMPLATE SOURCE
import { useEffect, useState } from "react"

const Services = () => {
  const [services, setServices] = useState([])
  
  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(setServices)
  }, [])
  
  return (
    <div>
      {services.map(service => (
        <div key={service.id}>{service.name}</div>
      ))}
    </div>
  )
}
```

```tsx
// ✅ NEXT.JS (Server Component - Préféré)
import { getServices } from '@/lib/api/endpoints/services'

export default async function ServicesPage() {
  const services = await getServices()
  
  return (
    <div>
      {services.map(service => (
        <div key={service.id}>{service.name}</div>
      ))}
    </div>
  )
}
```

**Avantages Server Component** :
- ✅ Fetch côté serveur (plus rapide)
- ✅ SEO optimal
- ✅ Pas de loading state nécessaire
- ✅ Credentials sécurisés

---

### Pattern 4 : Dynamic Route

```tsx
// ❌ TEMPLATE SOURCE (React Router)
// Route : /service/:id
import { useParams } from "react-router-dom"

const ServiceDetail = () => {
  const { id } = useParams()
  
  return <div>Service {id}</div>
}
```

```tsx
// ✅ NEXT.JS
// Fichier : app/service/[id]/page.tsx
import { useParams } from "next/navigation"

export default function ServiceDetailPage() {
  const params = useParams()
  
  return <div>Service {params.id}</div>
}
```

---

## ✅ CHECKLIST COMPLÈTE

### Phase Analyse (15 min)
- [ ] Template source localisé (`DIR/[Name].tsx`)
- [ ] Composants UI identifiés
- [ ] Routing analysé (`Link`, `useNavigate`)
- [ ] Formulaires identifiés
- [ ] Appels API identifiés
- [ ] Type composant déterminé (Client vs Server)

### Phase Création Structure (20 min)
- [ ] Fichier page.tsx créé (`app/[path]/page.tsx`)
- [ ] Composant métier créé si nécessaire (`components/[category]/[Name].tsx`)
- [ ] `'use client'` ajouté si interactivité

### Phase Adaptation (30 min)
- [ ] Imports routing adaptés (`next/link`, `next/navigation`)
- [ ] `<Link to>` → `<Link href>`
- [ ] `useNavigate()` → `useRouter()`
- [ ] Composants UI shadcn/ui réutilisés

### Phase API (45 min)
- [ ] Fichier endpoints créé (`lib/api/endpoints/[resource].ts`)
- [ ] Fonctions API typées (TypeScript)
- [ ] Gestion erreurs complète (try/catch, APIError)
- [ ] Intégration dans composant
- [ ] Loading states gérés
- [ ] Toast notifications ajoutés

### Phase Validation (45 min)
- [ ] Schema Zod créé (`lib/validations/[resource].ts`)
- [ ] react-hook-form intégré
- [ ] Validation fonctionnelle
- [ ] Messages d'erreur sous champs

### Phase Tests (2h)
- [ ] Tests unitaires Jest écrits
- [ ] Tests E2E Playwright écrits
- [ ] Tous tests passent (100%)
- [ ] Coverage >80%

### Phase Validation Finale (30 min)
- [ ] TypeScript compile (`npm run type-check`)
- [ ] ESLint passe (`npm run lint`)
- [ ] Build réussit (`npm run build`)
- [ ] Lighthouse >85 (perf + accessibility)
- [ ] Responsive vérifié (mobile, tablet, desktop)
- [ ] Keyboard navigation testée
- [ ] ARIA labels vérifiés

### Phase Documentation (15 min)
- [ ] Rapport tâche généré
- [ ] Captures écran ajoutées
- [ ] Problèmes documentés
- [ ] Tableau progression mis à jour

---

**Document créé par** : Claude (Agent IA)  
**Date** : 31 Octobre 2025  
**Version** : 1.0  
**Statut** : ✅ ACTIF - Guide opérationnel
