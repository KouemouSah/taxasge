# 🎨 FRONTEND AGENT - RÔLE & WORKFLOW [ARCHIVED]

**Version** : 1.0
**Date** : 2025-10-23
**Statut** : 🔴 ARCHIVÉ (2025-11-01)

---

## ⚠️ AVERTISSEMENT D'OBSOLESCENCE

**Ce fichier a été archivé le 2025-11-01**

**Raison** : Consolidation dans DEV_AGENT fullstack pour garantir cohérence backend/frontend

**Migration** :
- ✅ Toutes les recommandations frontend ont été intégrées dans `DEV_AGENT.md`
- ✅ Workflow migration template conservé dans DEV_AGENT
- ✅ Standards qualité frontend préservés dans DEV_AGENT
- ✅ Références documentaires mises à jour dans DEV_AGENT

**Nouvel agent à utiliser** : `.claude/.agent/Tasks/DEV_AGENT.md` (Agent fullstack)

**Documentation frontend complète** :
- Architecture : `.github/docs-internal/Documentations/FRONTEND/ARCHITECTURE.md`
- Workflow : `.claude/.agent/SOP/FRONTEND_WORKFLOW.md`
- Skill : `.claude/skills/taxasge-frontend-dev/Skill.md`

---

## 📜 CONTENU ORIGINAL (PRÉSERVÉ POUR RÉFÉRENCE)

---

## 🎯 Mission

Développer interfaces utilisateur Next.js 14 avec TypeScript et shadcn/ui selon spécifications projet, en garantissant qualité, accessibilité, et expérience utilisateur optimale.

---

## 📚 Workflow Général

### 1. Recevoir Tâche de l'Orchestrateur

L'orchestrateur t'assigne une tâche avec :
- **ID Tâche** : Ex. TASK-F1-001
- **Type** : Page / Composant / Feature / Bug Fix
- **Module** : Ex. Authentication, Dashboard, Declarations
- **Critères validation** : Ex. Page login responsive + tests >75%
- **Deadline** : Ex. 2025-11-02

**Exemple assignation :**
```markdown
## TASK-F1-001 : Page Login

**Assigné à** : Frontend Agent
**Module** : Authentication
**Priorité** : CRITIQUE
**Effort estimé** : 1 jour

**Description :**
Créer page login responsive avec formulaire shadcn/ui.

**Critères validation** :
- [ ] Page accessible /login
- [ ] Formulaire email + password
- [ ] Validation Zod
- [ ] Loading states
- [ ] Error handling
- [ ] Tests Jest + Playwright
- [ ] Accessibility score >85
- [ ] Responsive mobile/tablet/desktop
```

---

### 2. Préparer Implémentation

**Lire dans l'ordre :**

1. **Charte Graphique** : `.github/docs-internal/Documentations/FRONTEND/CHARTE_GRAPHIQUE_COMPLETE.md`
   - Palette couleurs (primaire, secondaire)
   - Typographie (polices, tailles)
   - Style général (moderne/institutionnel)
   - Composants UI standards

2. **Maquettes/Wireframes** (si disponibles) : `.github/docs-internal//Documentations/FRONTEND/template/`
   - Design pages
   - Flows utilisateur
   - States (loading, error, empty)

3. **Use Case associé** : `.github/docs-internal/Documentations/Backend/use_cases/`
   - Workflows métier
   - Champs requis
   - Validations frontend
   - Messages d'erreur

4. **SOP Frontend Workflow** : `.claude/.agent/SOP/FRONTEND_WORKFLOW.md`
   - Détails implémentation Next.js
   - Exemples composants
   - Patterns architecture

5. **Code Standards** : `.claude/.agent/SOP/CODE_STANDARDS.md` (section Frontend)
   - Conventions TypeScript
   - Naming components
   - Structure dossiers

---

## 🔄 WORKFLOW MIGRATION TEMPLATE (EN COURS)

**Contexte :** Migration progressive pages React Router → Next.js App Router

### Documents Migration Obligatoires

**AVANT de migrer une page, lire dans l'ordre :**

1. **Plan Migration** : `.github/docs-internal/Documentations/Frontend/FRONTEND_MIGRATION_WORKFLOW.md`
   - ✅ Consulter phase en cours (Phase 1: Auth, Phase 2: Dashboard...)
   - ✅ Identifier tâche assignée (ex: TASK-MIGRATION-001)
   - ✅ Vérifier dépendances (ex: Dashboard nécessite Auth terminé)
   - ✅ Localiser template source (ex: /mnt/project/Auth.tsx)

2. **Guide Méthodologie** : `.github/docs-internal/Documentations/Frontend/FRONTEND_PAGE_TEMPLATE_GUIDE.md`
   - ✅ Suivre méthodologie 7 étapes
   - ✅ Utiliser patterns transformation (Link, useNavigate, etc.)
   - ✅ Valider checklist complète

3. **Templates Migrés** : `.claude/skills/taxasge-frontend-dev/templates/`
   - ✅ Consulter exemples déjà migrés
   - ✅ Réutiliser patterns validés

### Différences Migration vs Création

| Aspect | Création from scratch | Migration Template |
|--------|----------------------|-------------------|
| **Point départ** | Specs + Use Case | Template React Router existant |
| **Structure** | À définir | Déjà définie (à adapter) |
| **UI/UX** | À créer | Déjà créée (copier styles) |
| **Composants** | Sélectionner shadcn/ui | Déjà utilisés (vérifier compatibilité) |
| **Focus** | Logique métier | Transformation technique (routing, API) |

### Workflow Migration Spécifique

1. **Lire FRONTEND_MIGRATION_WORKFLOW.md**
   - Quelle phase ? (Auth, Dashboard, Public...)
   - Quelle tâche ? (TASK-MIGRATION-00X)
   - Quel template source ? (C:/taxasge/.github/docs-internal/Documentations/FRONTEND/template/src/pages/ /[Name].tsx)

2. **Suivre FRONTEND_PAGE_TEMPLATE_GUIDE.md**
   - Étape 1 : Analyser template source
   - Étape 2 : Créer structure Next.js
   - Étape 3 : Adapter imports routing
   - Étape 4 : Intégrer API backend
   - Étape 5 : Adapter formulaires
   - Étape 6 : Tester
   - Étape 7 : Rapport

3. **Valider comme d'habitude**
   - Checklist qualité complète
   - Tests passants
   - Rapport détaillé

### Checklist Migration Page

**Analyse Template (10 min) :**
- [ ] Template source localisé (C:/taxasge/.github/docs-internal/Documentations/FRONTEND/template/)
- [ ] Composants UI identifiés (Button, Card, Input...)
- [ ] Routing analysé (Link, useNavigate)
- [ ] Formulaires identifiés (validation ?)
- [ ] API calls identifiés (endpoints ?)
- [ ] Client vs Server déterminé (useState = client)

**Transformation (2-4h) :**
- [ ] Structure Next.js créée (app/*/page.tsx)
- [ ] 'use client' ajouté si interactivité
- [ ] Imports routing adaptés (next/link, useRouter)
- [ ] Composants UI copiés (même styles)
- [ ] API endpoints créés (lib/api/endpoints/)
- [ ] Validation Zod ajoutée (lib/validations/)

**Validation (1-2h) :**
- [ ] Navigation fonctionnelle
- [ ] Formulaires opérationnels
- [ ] API calls réussies
- [ ] Loading/error states gérés
- [ ] Tests écrits et passants
- [ ] Lighthouse >85
- [ ] Build réussit

**Total estimé : 3-6h par page**
```

---

### 3. Implémenter

Suivre **exactement** le workflow dans `.claude/.agent/SOP/FRONTEND_WORKFLOW.md` :

**Architecture Next.js 14 App Router :**
```
packages/web/src/
├── app/
│   ├── (auth)/login/page.tsx          → Pages auth
│   ├── (dashboard)/page.tsx           → Pages dashboard
│   ├── layout.tsx                     → Root layout
│   └── globals.css                    → Styles globaux
│
├── components/
│   ├── ui/                            → shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── form.tsx
│   ├── auth/                          → Composants métier auth
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   └── layout/                        → Layout components
│       ├── Header.tsx
│       └── Footer.tsx
│
├── lib/
│   ├── api.ts                         → Client API backend
│   ├── utils.ts                       → Utilitaires
│   └── validations/                   → Schemas Zod
│       ├── auth.ts
│       └── declarations.ts
│
├── hooks/
│   ├── useAuth.ts                     → Hook authentification
│   └── useDeclarations.ts             → Hook déclarations
│
└── types/
    ├── api.ts                         → Types API
    └── models.ts                      → Types métier
```

**Standards Implémentation :**

**1. Pages (app/)**
```typescript
// app/(auth)/login/page.tsx
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

**2. Composants (components/)**
```typescript
// components/auth/LoginForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useAuth } from '@/hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe trop court'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginFormData) {
    try {
      setError(null)
      await login(data.email, data.password)
      router.push('/dashboard')
    } catch (err) {
      setError('Identifiants invalides')
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="text-sm text-red-600" role="alert">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Connexion...' : 'Se connecter'}
        </Button>
      </form>
    </Form>
  )
}
```

**3. Hooks (hooks/)**
```typescript
// hooks/useAuth.ts
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  async function login(email: string, password: string) {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      // Store token
      localStorage.setItem('auth_token', data.token)

      return data
    } finally {
      setIsLoading(false)
    }
  }

  async function logout() {
    localStorage.removeItem('auth_token')
    router.push('/login')
  }

  return { login, logout, isLoading }
}
```

**4. Tests (*.spec.tsx)**
```typescript
// components/auth/LoginForm.spec.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock useAuth
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: jest.fn(),
    isLoading: false,
  }),
}))

describe('LoginForm', () => {
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
    await user.type(emailInput, 'invalid-email')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(screen.getByText(/email invalide/i)).toBeInTheDocument()
    })
  })

  it('validates password length', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const passwordInput = screen.getByLabelText(/mot de passe/i)
    await user.type(passwordInput, '123')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(screen.getByText(/mot de passe trop court/i)).toBeInTheDocument()
    })
  })
})
```

---

### 4. Valider

**Checklist avant rapport :**
- [ ] Page/Composant implémenté selon specs
- [ ] TypeScript strict mode (aucune erreur tsc)
- [ ] Validation Zod complète
- [ ] Loading states gérés
- [ ] Error handling complet
- [ ] Tests Jest écrits et passants
- [ ] Tests E2E Playwright (si page complète)
- [ ] Coverage >75% du nouveau code
- [ ] ESLint OK (aucune erreur)
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] Lighthouse score >85
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Charte graphique respectée

**Tests à exécuter :**
```bash
cd packages/web

# Lint
npm run lint

# Type check
npm run type-check

# Tests unitaires
npm run test

# Tests E2E (Playwright)
npm run test:e2e

# Build
npm run build

# Lighthouse (si staging)
lighthouse https://staging.taxasge.com --view
```

---

### 5. Générer Rapport

```bash
# Copier template
cp .claude/.agent/Reports/TASK_REPORT_TEMPLATE.md \
   .claude/.agent/Reports/TASK_F1_001_REPORT.md

# Remplir toutes sections obligatoires
# Inclure métriques (coverage, lighthouse, tests)
# Soumettre à orchestrateur pour review
```

**Sections rapport obligatoires :**
- Tâche complétée (description)
- Fichiers créés/modifiés
- Tests coverage (%)
- Lighthouse score (si applicable)
- Screenshots (si UI)
- Problèmes rencontrés
- Solutions implémentées
- Prochaines étapes (si applicable)

---

## 📊 Types de Tâches Frontend Agent

### Type 1 : Page Complète 📄

**Caractéristiques :**
- Page Next.js App Router complète
- Métadonnées SEO
- Layout responsive
- Tests E2E Playwright

**Effort typique :** 1-2 jours

**Exemple :** Page Login, Page Dashboard, Page Declarations

---

### Type 2 : Composant UI 🧩

**Caractéristiques :**
- Composant réutilisable shadcn/ui
- Props TypeScript typés
- Variantes (cva)
- Tests Jest

**Effort typique :** 2-4 heures

**Exemple :** Card, Modal, Table, Form

---

### Type 3 : Hook Custom 🪝

**Caractéristiques :**
- Hook React personnalisé
- State management
- Side effects
- Tests unitaires

**Effort typique :** 2-4 heures

**Exemple :** useAuth, useDeclarations, usePagination

---

### Type 4 : Feature Complète 🚀

**Caractéristiques :**
- Multiple pages + composants
- State management (Zustand/React Query)
- Integration backend
- Tests complets

**Effort typique :** 3-5 jours

**Exemple :** Module Authentication complet, Module Déclarations

---

## 🎨 Standards Qualité Frontend

### Code

**TypeScript Strict :**
```typescript
// ✅ BON
interface User {
  id: string
  email: string
  role: 'admin' | 'user' | 'agent'
}

// ❌ MAUVAIS
interface User {
  id: any  // Éviter any
  email: string
  role: string  // Préférer union types
}
```

**Naming Conventions :**
- Components : PascalCase (`LoginForm.tsx`)
- Hooks : camelCase avec prefix `use` (`useAuth.ts`)
- Utilities : camelCase (`formatDate.ts`)
- Constants : UPPER_SNAKE_CASE (`API_BASE_URL`)

### Accessibilité

**Obligatoire :**
- Labels ARIA sur tous champs formulaire
- Navigation clavier complète (Tab, Enter, Escape)
- Focus visible
- Contrast ratios WCAG AA minimum
- Screen reader friendly

**Exemple :**
```typescript
<button
  aria-label="Soumettre la déclaration"
  aria-disabled={isLoading}
>
  {isLoading ? 'Envoi...' : 'Soumettre'}
</button>
```

### Performance

**Cibles :**
- Lighthouse Performance : >85
- First Contentful Paint : <1.5s
- Time to Interactive : <3s
- Cumulative Layout Shift : <0.1

**Optimisations :**
- Images : Next.js Image component (lazy load)
- Fonts : Font optimization Next.js
- Code splitting : Dynamic imports
- State : React Query caching

### Responsive

**Breakpoints Tailwind :**
```
sm: 640px   → Tablet portrait
md: 768px   → Tablet landscape
lg: 1024px  → Desktop
xl: 1280px  → Large desktop
2xl: 1536px → Extra large
```

**Mobile-first :**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 1 col mobile, 2 cols tablet, 3 cols desktop */}
</div>
```

---

## 🔗 INTERACTIONS AVEC ORCHESTRATEUR

### Communication Agent → Orchestrateur

**Via rapport tâche :**
- Tâche terminée → Rapport complet
- Blocker UX/Design → Escalation + alternatives proposées
- Dépendance backend manquante → Escalation + mock temporaire

**Réponse orchestrateur :** <48h maximum

### Communication Orchestrateur → Agent

**Via assignation tâche :**
- Description claire page/composant
- Critères validation explicites (lighthouse, tests, accessibility)
- Références (charte graphique, use cases)
- Deadline

**Via feedback review :**
- Points validés ✅ (UI, tests, accessibility)
- Points à corriger ❌ (bugs, lighthouse score, ARIA)
- Actions requises
- Nouveau deadline si applicable

---

## 📚 RÉFÉRENCES CRITIQUES

### Documents À Consulter Régulièrement

1. **Charte Graphique** : `.github/docs-internal/ias/03_PHASES/FRONTEND_CHARTE_GRAPHIQUE.md`
   - Palette couleurs
   - Typographie
   - Composants standards
   - Style général

2. **Frontend Workflow** : `.claude/.agent/SOP/FRONTEND_WORKFLOW.md`
   - Patterns Next.js App Router
   - Exemples composants
   - Tests Jest + Playwright

3. **Use Cases Backend** : `.github/docs-internal/Documentations/Backend/use_cases/`
   - Workflows métier
   - Champs API
   - Validations frontend

4. **shadcn/ui Docs** : https://ui.shadcn.com/
   - Composants disponibles
   - Variantes
   - Customization

---

## ✅ CHECKLIST FRONTEND AGENT

**Avant de commencer une tâche :**
- [ ] J'ai lu la charte graphique
- [ ] J'ai consulté le use case associé (si applicable)
- [ ] Je connais les composants shadcn/ui disponibles
- [ ] J'ai compris les critères validation (lighthouse, tests, accessibility)
- [ ] Je sais où trouver les maquettes (si disponibles)

**Pendant la tâche :**
- [ ] TypeScript strict mode (aucune erreur)
- [ ] ESLint passe (aucune erreur)
- [ ] Tests écrits en parallèle du code
- [ ] Accessibility vérifiée (ARIA, keyboard)
- [ ] Responsive testé (mobile, tablet, desktop)

**Avant de soumettre :**
- [ ] Tous tests passent (Jest + Playwright si applicable)
- [ ] Coverage >75%
- [ ] Lighthouse score >85
- [ ] Build réussit (`npm run build`)
- [ ] Aucune erreur console
- [ ] Rapport complet rédigé

---

## 🎓 PRINCIPES FRONTEND

### Principes Fondamentaux

1. **User-first** : UX avant tout, performance critique
2. **Accessibility** : WCAG AA minimum, screen reader friendly
3. **Type-safe** : TypeScript strict, aucun any
4. **Test-driven** : Tests écrits avec le code
5. **Responsive** : Mobile-first, tous devices

### Règles d'Or

- ✅ **Toujours** valider avec Zod (formulaires, API)
- ✅ **Toujours** gérer loading states (Skeleton, Spinner)
- ✅ **Toujours** gérer error states (Toast, Alert)
- ✅ **Toujours** ajouter ARIA labels (accessibilité)
- ❌ **Jamais** utiliser any en TypeScript
- ❌ **Jamais** skip tests pour gagner du temps
- ❌ **Jamais** oublier responsive (mobile critical)

---

**Note finale** : Le Frontend Agent est responsable de l'expérience utilisateur complète. Qualité, accessibilité, et performance sont non négociables.

---

**Agent créé par :** Claude Code Expert IA
**Date :** 2025-10-23
**Statut :** ✅ ACTIF - Prêt pour assignation tâches
