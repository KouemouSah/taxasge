# 🎨 WORKFLOW FRONTEND - NEXT.JS + TYPESCRIPT

**Version** : 1.0
**Date** : 2025-10-23
**Stack** : Next.js 14, TypeScript, shadcn/ui, Tailwind CSS

---

## 🎯 Objectif

Ce document détaille le workflow complet pour développer des pages et composants frontend selon les standards TaxasGE.

---

## 📁 STRUCTURE PROJET FRONTEND

```
packages/web/
├── src/
│   ├── app/                           → Pages Next.js App Router
│   │   ├── (auth)/                    → Groupe auth (layout partagé)
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/               → Groupe dashboard
│   │   │   ├── page.tsx
│   │   │   ├── declarations/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── layout.tsx
│   │   ├── layout.tsx                 → Root layout
│   │   ├── globals.css
│   │   └── providers.tsx              → Providers (React Query, etc.)
│   │
│   ├── components/
│   │   ├── ui/                        → shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── form.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── layout/                    → Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Navigation.tsx
│   │   ├── auth/                      → Domaine auth
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── PasswordReset.tsx
│   │   ├── declarations/              → Domaine déclarations
│   │   │   ├── DeclarationForm.tsx
│   │   │   ├── DeclarationList.tsx
│   │   │   └── DeclarationCard.tsx
│   │   └── shared/                    → Composants partagés
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── PageHeader.tsx
│   │
│   ├── lib/
│   │   ├── api.ts                     → Client API backend
│   │   ├── utils.ts                   → Utilitaires (cn, formatDate, etc.)
│   │   ├── constants.ts               → Constantes app
│   │   └── validations/               → Schemas Zod
│   │       ├── auth.ts
│   │       ├── declarations.ts
│   │       └── documents.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                 → Hook authentification
│   │   ├── useDeclarations.ts         → Hook déclarations
│   │   ├── useDocuments.ts            → Hook documents
│   │   └── usePagination.ts           → Hook pagination
│   │
│   ├── types/
│   │   ├── api.ts                     → Types API responses
│   │   ├── models.ts                  → Types métier
│   │   └── components.ts              → Types composants
│   │
│   └── styles/
│       └── globals.css                → Styles Tailwind
│
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── tests/
│   ├── unit/                          → Tests Jest
│   │   └── components/
│   └── e2e/                           → Tests Playwright
│       └── auth.spec.ts
│
├── .env.local                         → Variables environnement local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🔄 WORKFLOW DÉVELOPPEMENT PAGE

### Étape 1 : Planification (5 min)

**Questions à répondre :**
1. Cette page est-elle publique ou protégée ?
2. Quel layout utiliser ? (auth, dashboard, public)
3. Quels composants réutiliser ?
4. Quelles données API charger ?
5. Quelles validations formulaire ?

**Checklist planification :**
- [ ] Route définie (ex: `/declarations/new`)
- [ ] Layout identifié
- [ ] Composants listés
- [ ] API endpoints listés
- [ ] Validations Zod identifiées

---

### Étape 2 : Créer Structure Page (10 min)

**Template page basique :**
```typescript
// app/(dashboard)/declarations/new/page.tsx
import { Metadata } from 'next'
import { DeclarationForm } from '@/components/declarations/DeclarationForm'
import { PageHeader } from '@/components/shared/PageHeader'

export const metadata: Metadata = {
  title: 'Nouvelle Déclaration | TaxasGE',
  description: 'Créez une nouvelle déclaration fiscale',
}

export default function NewDeclarationPage() {
  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Nouvelle Déclaration"
        description="Remplissez le formulaire ci-dessous pour créer votre déclaration"
      />

      <div className="mt-6">
        <DeclarationForm />
      </div>
    </div>
  )
}
```

**Template page avec data fetching (Server Component) :**
```typescript
// app/(dashboard)/declarations/[id]/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DeclarationDetails } from '@/components/declarations/DeclarationDetails'

interface PageProps {
  params: {
    id: string
  }
}

async function getDeclaration(id: string) {
  const res = await fetch(`${process.env.API_URL}/api/v1/declarations/${id}`, {
    cache: 'no-store', // ou 'force-cache' selon besoin
  })

  if (!res.ok) {
    return null
  }

  return res.json()
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const declaration = await getDeclaration(params.id)

  return {
    title: `Déclaration ${declaration?.reference || params.id} | TaxasGE`,
  }
}

export default async function DeclarationPage({ params }: PageProps) {
  const declaration = await getDeclaration(params.id)

  if (!declaration) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <DeclarationDetails declaration={declaration} />
    </div>
  )
}
```

---

### Étape 3 : Créer Composants (1-2 heures)

**Template composant UI simple :**
```typescript
// components/shared/PageHeader.tsx
interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
```

**Template composant formulaire (avec Zod + React Hook Form) :**
```typescript
// components/declarations/DeclarationForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { declarationSchema } from '@/lib/validations/declarations'

type DeclarationFormData = z.infer<typeof declarationSchema>

export function DeclarationForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<DeclarationFormData>({
    resolver: zodResolver(declarationSchema),
    defaultValues: {
      tax_service_id: '',
      amount: 0,
      period: '',
    },
  })

  async function onSubmit(data: DeclarationFormData) {
    setIsSubmitting(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/declarations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création')
      }

      const declaration = await response.json()

      toast({
        title: 'Succès',
        description: 'Déclaration créée avec succès',
      })

      router.push(`/declarations/${declaration.id}`)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la déclaration',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="tax_service_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Fiscal</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un service" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">IVA (TVA)</SelectItem>
                  <SelectItem value="2">IRPF</SelectItem>
                  <SelectItem value="3">Impôt Pétroliers</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choisissez le type de déclaration fiscale
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Montant (FCFA)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Période</FormLabel>
              <FormControl>
                <Input
                  type="month"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Période fiscale concernée
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Création...' : 'Créer la déclaration'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

---

### Étape 4 : Créer Validations Zod (30 min)

```typescript
// lib/validations/declarations.ts
import { z } from 'zod'

export const declarationSchema = z.object({
  tax_service_id: z.string().min(1, 'Service fiscal requis'),
  amount: z.number().min(0, 'Montant doit être positif'),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Format période invalide (YYYY-MM)'),
  notes: z.string().optional(),
})

export type DeclarationFormData = z.infer<typeof declarationSchema>
```

---

### Étape 5 : Créer Hooks Custom (30 min)

```typescript
// hooks/useDeclarations.ts
'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Declaration {
  id: string
  tax_service_id: string
  amount: number
  status: 'draft' | 'submitted' | 'validated' | 'rejected'
  created_at: string
}

export function useDeclarations() {
  const queryClient = useQueryClient()

  const { data: declarations, isLoading, error } = useQuery({
    queryKey: ['declarations'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/declarations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch declarations')
      }

      return response.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Declaration>) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/declarations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create declaration')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['declarations'] })
    },
  })

  return {
    declarations,
    isLoading,
    error,
    createDeclaration: createMutation.mutate,
    isCreating: createMutation.isPending,
  }
}
```

---

### Étape 6 : Écrire Tests (1 heure)

**Tests unitaires Jest :**
```typescript
// tests/unit/components/declarations/DeclarationForm.spec.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeclarationForm } from '@/components/declarations/DeclarationForm'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}))

// Mock toast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe('DeclarationForm', () => {
  it('renders form fields', () => {
    render(<DeclarationForm />)

    expect(screen.getByLabelText(/service fiscal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/montant/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/période/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<DeclarationForm />)

    // Soumettre formulaire vide
    await user.click(screen.getByRole('button', { name: /créer/i }))

    await waitFor(() => {
      expect(screen.getByText(/service fiscal requis/i)).toBeInTheDocument()
    })
  })

  it('validates amount is positive', async () => {
    const user = userEvent.setup()
    render(<DeclarationForm />)

    const amountInput = screen.getByLabelText(/montant/i)
    await user.type(amountInput, '-100')
    await user.click(screen.getByRole('button', { name: /créer/i }))

    await waitFor(() => {
      expect(screen.getByText(/montant doit être positif/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: '123', status: 'draft' }),
      })
    ) as jest.Mock

    render(<DeclarationForm />)

    // Remplir formulaire
    await user.selectOptions(screen.getByLabelText(/service fiscal/i), '1')
    await user.type(screen.getByLabelText(/montant/i), '50000')
    await user.type(screen.getByLabelText(/période/i), '2025-10')

    // Soumettre
    await user.click(screen.getByRole('button', { name: /créer/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/declarations'),
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })
})
```

**Tests E2E Playwright :**
```typescript
// tests/e2e/declarations.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Declarations Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('create new declaration', async ({ page }) => {
    // Naviguer vers nouvelle déclaration
    await page.goto('http://localhost:3000/declarations/new')

    // Remplir formulaire
    await page.selectOption('[name="tax_service_id"]', '1')
    await page.fill('[name="amount"]', '50000')
    await page.fill('[name="period"]', '2025-10')

    // Soumettre
    await page.click('button[type="submit"]')

    // Vérifier redirection
    await expect(page).toHaveURL(/\/declarations\/\d+/)

    // Vérifier toast succès
    await expect(page.locator('text=Déclaration créée avec succès')).toBeVisible()
  })

  test('validates form fields', async ({ page }) => {
    await page.goto('http://localhost:3000/declarations/new')

    // Soumettre sans remplir
    await page.click('button[type="submit"]')

    // Vérifier erreurs validation
    await expect(page.locator('text=Service fiscal requis')).toBeVisible()
  })
})
```

---

### Étape 7 : Vérifier Accessibilité (30 min)

**Checklist WCAG AA :**
```typescript
// Exemple composant accessible
export function AccessibleButton() {
  return (
    <button
      type="button"
      aria-label="Soumettre la déclaration"
      aria-describedby="submit-help"
      className="..."
    >
      Soumettre
      <span id="submit-help" className="sr-only">
        Envoie votre déclaration pour validation
      </span>
    </button>
  )
}
```

**Tests accessibilité automatisés :**
```bash
npm install --save-dev @axe-core/playwright

# tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility', () => {
  test('login page should not have accessibility violations', async ({ page }) => {
    await page.goto('http://localhost:3000/login')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
```

---

### Étape 8 : Optimisation Performance (30 min)

**Images Next.js :**
```typescript
import Image from 'next/image'

export function OptimizedImage() {
  return (
    <Image
      src="/images/logo.png"
      alt="TaxasGE Logo"
      width={200}
      height={50}
      priority // Si above the fold
    />
  )
}
```

**Dynamic imports (code splitting) :**
```typescript
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('@/components/charts/HeavyChart'), {
  loading: () => <p>Chargement...</p>,
  ssr: false, // Si component nécessite window/document
})

export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <HeavyChart data={data} />
    </div>
  )
}
```

**React Query caching :**
```typescript
export function useDeclarations() {
  return useQuery({
    queryKey: ['declarations'],
    queryFn: fetchDeclarations,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}
```

---

## 🎨 PATTERNS COMMUNS

### Pattern 1 : Loading States

```typescript
export function DeclarationsList() {
  const { declarations, isLoading } = useDeclarations()

  if (isLoading) {
    return <DeclarationsListSkeleton />
  }

  return (
    <div className="space-y-4">
      {declarations.map((decl) => (
        <DeclarationCard key={decl.id} declaration={decl} />
      ))}
    </div>
  )
}

function DeclarationsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  )
}
```

### Pattern 2 : Error Handling

```typescript
export function DeclarationsList() {
  const { declarations, isLoading, error } = useDeclarations()

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>
          Impossible de charger les déclarations. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    )
  }

  // ...
}
```

### Pattern 3 : Empty States

```typescript
export function DeclarationsList() {
  const { declarations } = useDeclarations()

  if (declarations.length === 0) {
    return (
      <div className="text-center py-12">
        <FileX className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Aucune déclaration</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Créez votre première déclaration fiscale
        </p>
        <Button className="mt-4" asChild>
          <Link href="/declarations/new">Nouvelle déclaration</Link>
        </Button>
      </div>
    )
  }

  // ...
}
```

---

## ✅ CHECKLIST COMPLÈTE

**Avant commit :**
- [ ] TypeScript compile sans erreur (`npm run type-check`)
- [ ] ESLint passe (`npm run lint`)
- [ ] Tests unitaires passent (`npm run test`)
- [ ] Tests E2E passent (`npm run test:e2e`)
- [ ] Build réussit (`npm run build`)
- [ ] Lighthouse score >85
- [ ] Aucune erreur console
- [ ] Responsive testé (mobile, tablet, desktop)
- [ ] Accessibility validée (ARIA, keyboard)
- [ ] Loading states implémentés
- [ ] Error handling complet
- [ ] Empty states gérés

---

**Workflow créé par :** Claude Code Expert IA
**Date :** 2025-10-23
**Statut :** ✅ VALIDÉ - Prêt pour utilisation
