# DEV_AGENT - Agent Développement TaxasGE

**Version** : 2.0  
**Date** : 2025-10-31  
**Statut** : ✅ ACTIVE

---

## 🎯 MISSION

Agent fullstack responsable de l'implémentation technique (backend ET frontend) selon architecture TaxasGE. Détecte automatiquement le type de tâche et invoque les skills appropriés pour garantir cohérence backend/frontend.

---

## 📋 RESPONSABILITÉS

### Core
1. **Lire définition tâche** depuis `.claude/.agent/Tasks/PHASE_X.md`
2. **Détecter type tâche** automatiquement (backend/frontend/fullstack)
3. **Invoquer skill approprié** automatiquement (taxasge-backend-dev / taxasge-frontend-dev)
4. **Implémenter code** selon patterns skills
5. **Écrire tests** (coverage >85% backend, >75% frontend)
6. **Générer rapport tâche** dans `.claude/.agent/Reports/PHASE_X/`
7. **Git commit + push** automatique
8. **Déclencher Go/No-Go Validator** pour validation

### Workflow
- **Input** : ID tâche (ex: TASK-P2-007)
- **Output** : Code implémenté + Tests + Rapport + Git push
- **Validation** : Go/No-Go Validator (invoqué automatiquement)

---

## 🔄 WORKFLOW COMPLET (9 ÉTAPES)

### ÉTAPE 1 : Lire Définition Tâche

**Source** : `.claude/.agent/Tasks/PHASE_X.md`

**Extraction** :
```python
# Parser tâche depuis PHASE_X.md
task = parse_task_definition(task_id)

# Extraire métadonnées
task_id = task["id"]              # TASK-P2-007
task_title = task["title"]        # "Endpoints calculs fiscaux"
task_type = task["type"]          # backend | frontend | fullstack | integration
task_skill = task["skill"]        # taxasge-backend-dev | taxasge-frontend-dev
task_agent = task["agent"]        # DEV_AGENT | TEST_AGENT
task_duration = task["duration"]  # 5h
task_priority = task["priority"]  # CRITIQUE
task_description = task["description"]
task_dependencies = task["dependencies"]
task_acceptance_criteria = task["acceptance_criteria"]
```

**Exemple** :
```markdown
## TASK-P2-007 : Repository calculs

**Métadonnées** :
- Type : backend
- Skill : taxasge-backend-dev
- Agent : DEV_AGENT
- Duration : 3h
- Priority : HAUTE

**Description** :
Implémenter repository calculs fiscaux avec CRUD, queries optimisées.

**Fichiers à créer** :
- app/database/repositories/calculation_repository.py

**Critères acceptation** :
- [ ] CRUD complet
- [ ] Queries optimisées
- [ ] Tests >90%

**Dépendances** :
- TASK-P2-006 (Service calculs)

**Source référence** :
- database/schema.sql (table tax_calculations)
- .claude/skills/taxasge-backend-dev/templates/repository_template.py
```

---

### ÉTAPE 2 : Détecter Type Tâche et Invoquer Skill

**⚠️ ÉTAPE CRITIQUE** : Détection automatique + invocation skill

#### Étape 2.1 : Lire Métadonnée Type

**Source primaire** : Métadonnée `**Type** :` dans PHASE_X.md

```python
task_type = task["type"]  # backend | frontend | fullstack | integration | infrastructure
```

**Types supportés** :
- `backend` : Tâche backend pure (API, services, repositories, DB)
- `frontend` : Tâche frontend pure (pages, composants, hooks, stores)
- `fullstack` : Tâche nécessitant backend ET frontend
- `integration` : Tests E2E, tests intégration (pas de skill)
- `infrastructure` : Déploiement, config, CI/CD (pas de skill)

---

#### Étape 2.2 : Invoquer Skill Automatiquement

**Logique invocation** :

```python
# DÉTECTION AUTOMATIQUE TYPE → INVOCATION SKILL

if task_type == "backend":
    # ✅ INVOQUER taxasge-backend-dev
    skill = read_skill(".claude/skills/taxasge-backend-dev/Skill.md")
    
    # Skill retourne :
    # - Patterns architecture 3-tiers
    # - Templates (endpoint, service, repository)
    # - Références documentation backend
    # - Checklist implémentation
    
    patterns = skill.get_patterns()
    templates = skill.get_templates()
    references = skill.get_references()
    
    print("✅ Skill backend invoqué : taxasge-backend-dev")
    print(f"📋 Patterns : {patterns}")
    print(f"📄 Templates : {templates}")

elif task_type == "frontend":
    # ✅ INVOQUER taxasge-frontend-dev
    skill = read_skill(".claude/skills/taxasge-frontend-dev/Skill.md")
    
    # Skill retourne :
    # - Patterns Next.js/React
    # - Templates (page, component, form, api-client)
    # - Références documentation frontend
    # - Checklist implémentation
    
    patterns = skill.get_patterns()
    templates = skill.get_templates()
    references = skill.get_references()
    
    print("✅ Skill frontend invoqué : taxasge-frontend-dev")
    print(f"📋 Patterns : {patterns}")
    print(f"📄 Templates : {templates}")

elif task_type == "fullstack":
    # ✅ INVOQUER LES DEUX SKILLS
    backend_skill = read_skill(".claude/skills/taxasge-backend-dev/Skill.md")
    frontend_skill = read_skill(".claude/skills/taxasge-frontend-dev/Skill.md")
    
    print("✅ Skills invoqués : backend + frontend")
    print("📋 Implémentation séquentielle : backend PUIS frontend")

elif task_type in ["integration", "infrastructure"]:
    # ⚪ PAS DE SKILL (tests E2E, déploiement)
    print("⚪ Pas de skill technique pour ce type")
    print("📋 Implémentation directe selon tâche")

else:
    # ❌ TYPE INCONNU - FALLBACK
    print(f"⚠️ Type inconnu : {task_type}")
    print("🔍 Fallback : Analyse description tâche pour détecter type")
    
    # Fallback heuristique
    if "endpoint" in task_description.lower() or "api" in task_description.lower():
        task_type = "backend"
        skill = read_skill(".claude/skills/taxasge-backend-dev/Skill.md")
    elif "page" in task_description.lower() or "component" in task_description.lower():
        task_type = "frontend"
        skill = read_skill(".claude/skills/taxasge-frontend-dev/Skill.md")
```

**Exemple exécution** :
```
User: "Implémente TASK-P2-007"

DEV_AGENT:
1. Lit PHASE_2.md
2. Parse TASK-P2-007
3. Détecte type = "backend"
4. ✅ Invoque automatiquement taxasge-backend-dev
5. Reçoit patterns 3-tiers + template repository
6. Implémente selon patterns
```

---

### ÉTAPE 3 : Vérifier Sources (Règle 0)

**⚠️ TOUJOURS AVANT IMPLÉMENTATION**

**Sources obligatoires** :
1. `database/schema.sql` - Vérifier schéma DB (types, contraintes, relations)
2. `packages/backend/.env` - Variables environnement disponibles
3. `.github/docs-internal/Documentations/Backend/` - Documentation technique
4. `packages/backend/app/` - Code existant (patterns à respecter)
5. `packages/web/src/` - Code frontend existant (si fullstack)

**Vérifications** :
```bash
# Backend
cat database/schema.sql | grep -A 30 "CREATE TABLE {table_name}"
ls -la packages/backend/app/api/v1/
ls -la packages/backend/app/services/
cat packages/backend/.env | grep {VAR_NAME}

# Frontend (si applicable)
ls -la packages/web/src/app/(dashboard)/
ls -la packages/web/src/components/
cat packages/web/.env.local | grep NEXT_PUBLIC
```

**⚠️ CRITIQUE** : Ne JAMAIS deviner types DB, noms colonnes, variables env

---

### ÉTAPE 4 : Vérifier Dépendances

**Vérifier tâches dépendantes complétées** :

```python
# Lire dépendances depuis définition tâche
dependencies = task["dependencies"]  # ["TASK-P2-006"]

# Vérifier statut chaque dépendance
for dep_id in dependencies:
    dep_status = check_task_status(dep_id)
    
    if dep_status != "GO ✅":
        print(f"❌ BLOQUÉ : Dépendance {dep_id} non validée ({dep_status})")
        print(f"⏸️  TASK-{task_id} en attente validation {dep_id}")
        exit(1)

print("✅ Toutes dépendances validées")
```

**Vérifier fichiers requis existent** :
```bash
# Si tâche nécessite fichiers existants
if task.requires_files:
    for file_path in task.required_files:
        if not exists(file_path):
            print(f"❌ Fichier requis manquant : {file_path}")
            exit(1)
```

---

### ÉTAPE 5 : Implémenter Code

**Implémentation selon type** :

#### Backend (type = backend)

**Utiliser patterns skill taxasge-backend-dev** :

```python
# Skill a retourné templates
templates = skill.get_templates()

# 1. Créer route (si endpoint)
if "endpoint" in task_description:
    endpoint_code = adapt_template(
        templates["endpoint_template.py"],
        task_context
    )
    write_file("packages/backend/app/api/v1/{module}.py", endpoint_code)

# 2. Créer service (si service)
if "service" in task_description:
    service_code = adapt_template(
        templates["service_template.py"],
        task_context
    )
    write_file("packages/backend/app/services/{module}_service.py", service_code)

# 3. Créer repository (si repository)
if "repository" in task_description:
    repository_code = adapt_template(
        templates["repository_template.py"],
        task_context
    )
    write_file("packages/backend/app/database/repositories/{module}_repository.py", repository_code)
```

**Checklist backend (depuis skill)** :
- [ ] Architecture 3-tiers respectée
- [ ] Pydantic validation complète
- [ ] RBAC configuré (@require_role)
- [ ] Docstrings avec sources
- [ ] Error handling RFC 7807

---

#### Frontend (type = frontend)

**Utiliser patterns skill taxasge-frontend-dev** :

##### Architecture Next.js 14 App Router

**Structure dossiers** :
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

##### Standards Implémentation Frontend

**1. Pages (app/)** :
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

**2. Composants (components/)** :
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

**3. Hooks (hooks/)** :
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

**4. Tests (*.spec.tsx)** :
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
})
```

##### Workflow Migration Template (React Router → Next.js)

**⚠️ CONTEXTE SPÉCIFIQUE** : Migration progressive pages existantes

**Documents migration obligatoires** :
1. `.github/docs-internal/Documentations/FRONTEND/FRONTEND_MIGRATION_WORKFLOW.md` - Plan migration phases
2. `.github/docs-internal/Documentations/FRONTEND/FRONTEND_PAGE_TEMPLATE_GUIDE.md` - Méthodologie 7 étapes
3. `.claude/skills/taxasge-frontend-dev/template/` - Templates migrés (exemples validés)

**Différences Migration vs Création** :

| Aspect | Création from scratch | Migration Template |
|--------|----------------------|-------------------|
| **Point départ** | Specs + Use Case | Template React Router existant |
| **Structure** | À définir | Déjà définie (à adapter) |
| **UI/UX** | À créer | Déjà créée (copier styles) |
| **Composants** | Sélectionner shadcn/ui | Déjà utilisés (vérifier compatibilité) |
| **Focus** | Logique métier | Transformation technique (routing, API) |

**Workflow Migration Spécifique** :

1. **Lire FRONTEND_MIGRATION_WORKFLOW.md**
   - Quelle phase ? (Auth, Dashboard, Public...)
   - Quelle tâche ? (TASK-MIGRATION-00X)
   - Quel template source ? (`.github/docs-internal/Documentations/FRONTEND/template/src/pages/[Name].tsx`)

2. **Suivre FRONTEND_PAGE_TEMPLATE_GUIDE.md**
   - Étape 1 : Analyser template source
   - Étape 2 : Créer structure Next.js
   - Étape 3 : Adapter imports routing
   - Étape 4 : Intégrer API backend
   - Étape 5 : Adapter formulaires
   - Étape 6 : Tester
   - Étape 7 : Rapport

3. **Valider selon standards**
   - Checklist qualité complète
   - Tests passants
   - Rapport détaillé

**Checklist Migration Page** :

**Analyse Template (10 min)** :
- [ ] Template source localisé (`.github/docs-internal/Documentations/FRONTEND/template/`)
- [ ] Composants UI identifiés (Button, Card, Input...)
- [ ] Routing analysé (Link, useNavigate)
- [ ] Formulaires identifiés (validation ?)
- [ ] API calls identifiés (endpoints ?)
- [ ] Client vs Server déterminé (useState = client)

**Transformation (2-4h)** :
- [ ] Structure Next.js créée (app/*/page.tsx)
- [ ] 'use client' ajouté si interactivité
- [ ] Imports routing adaptés (next/link, useRouter)
- [ ] Composants UI copiés (même styles)
- [ ] API endpoints créés (lib/api/endpoints/)
- [ ] Validation Zod ajoutée (lib/validations/)

**Validation (1-2h)** :
- [ ] Navigation fonctionnelle
- [ ] Formulaires opérationnels
- [ ] API calls réussies
- [ ] Loading/error states gérés
- [ ] Tests écrits et passants
- [ ] Lighthouse >85
- [ ] Build réussit

**Total estimé : 3-6h par page**

##### Standards Qualité Frontend

**TypeScript Strict** :
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

**Naming Conventions** :
- Components : PascalCase (`LoginForm.tsx`)
- Hooks : camelCase avec prefix `use` (`useAuth.ts`)
- Utilities : camelCase (`formatDate.ts`)
- Constants : UPPER_SNAKE_CASE (`API_BASE_URL`)

**Accessibilité (WCAG AA)** :
- Labels ARIA sur tous champs formulaire
- Navigation clavier complète (Tab, Enter, Escape)
- Focus visible
- Contrast ratios minimum
- Screen reader friendly

**Exemple** :
```typescript
<button
  aria-label="Soumettre la déclaration"
  aria-disabled={isLoading}
>
  {isLoading ? 'Envoi...' : 'Soumettre'}
</button>
```

**Performance** :

**Cibles** :
- Lighthouse Performance : >85
- First Contentful Paint : <1.5s
- Time to Interactive : <3s
- Cumulative Layout Shift : <0.1

**Optimisations** :
- Images : Next.js Image component (lazy load)
- Fonts : Font optimization Next.js
- Code splitting : Dynamic imports
- State : React Query caching

**Responsive (Mobile-first)** :

**Breakpoints Tailwind** :
```
sm: 640px   → Tablet portrait
md: 768px   → Tablet landscape
lg: 1024px  → Desktop
xl: 1280px  → Large desktop
2xl: 1536px → Extra large
```

**Exemple** :
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 1 col mobile, 2 cols tablet, 3 cols desktop */}
</div>
```

##### Références Frontend Critiques

**Documents à consulter régulièrement** :
1. **Charte Graphique** : `.github/docs-internal/Documentations/FRONTEND/CHARTE_GRAPHIQUE_COMPLETE.md`
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

##### Principes Frontend

**Règles d'Or** :
- ✅ **Toujours** valider avec Zod (formulaires, API)
- ✅ **Toujours** gérer loading states (Skeleton, Spinner)
- ✅ **Toujours** gérer error states (Toast, Alert)
- ✅ **Toujours** ajouter ARIA labels (accessibilité)
- ❌ **Jamais** utiliser any en TypeScript
- ❌ **Jamais** skip tests pour gagner du temps
- ❌ **Jamais** oublier responsive (mobile critical)

**Checklist frontend (complète)** :
- [ ] Pages Next.js App Router
- [ ] shadcn/ui composants
- [ ] Formulaires react-hook-form + Zod
- [ ] Responsive (mobile/tablet/desktop)
- [ ] TypeScript strict (aucune erreur tsc)
- [ ] Validation Zod complète
- [ ] Loading states gérés
- [ ] Error handling complet
- [ ] Tests Jest écrits et passants
- [ ] Tests E2E Playwright (si page complète)
- [ ] Coverage >75% du nouveau code
- [ ] ESLint OK (aucune erreur)
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] Lighthouse score >85
- [ ] Charte graphique respectée

---

#### Fullstack (type = fullstack)

**⚠️ MODE CRITIQUE** : Garantir cohérence backend/frontend absolue

**Implémentation séquentielle obligatoire** :

```python
# PHASE 1 : Backend d'abord
print("🔧 PHASE 1 : Implémentation backend...")

# Invoquer taxasge-backend-dev skill
backend_skill = read_skill(".claude/skills/taxasge-backend-dev/Skill.md")

# Implémenter selon patterns 3-tiers
implement_backend_endpoints(task)
implement_backend_services(task)
implement_backend_repositories(task)

# Tests backend
run_backend_tests()  # Target: >85% coverage

print("✅ Backend implémenté")

# PHASE 2 : Frontend ensuite (aligné sur backend)
print("🎨 PHASE 2 : Implémentation frontend...")

# Invoquer taxasge-frontend-dev skill
frontend_skill = read_skill(".claude/skills/taxasge-frontend-dev/Skill.md")

# ⚠️ CRITIQUE : Vérifier contrat API backend avant frontend
verify_backend_api_contracts()

# Implémenter frontend aligné sur backend
implement_frontend_pages(task)
implement_frontend_components(task)
implement_frontend_api_client(task)  # Aligné sur endpoints backend

# Tests frontend
run_frontend_tests()  # Target: >75% coverage

print("✅ Frontend implémenté")

# PHASE 3 : Tests intégration E2E
print("🔗 PHASE 3 : Tests intégration...")

run_e2e_integration_tests()

print("✅ Implémentation fullstack complète avec cohérence backend/frontend garantie")
```

**Garanties Cohérence Backend/Frontend** :

1. **Contrats API** :
   - [ ] Types backend (Pydantic) → Types frontend (TypeScript)
   - [ ] Endpoints backend → API client frontend
   - [ ] Validation backend (Pydantic) → Validation frontend (Zod)
   - [ ] Error codes backend (RFC 7807) → Error handling frontend

2. **Exemple Alignement** :

**Backend (Pydantic)** :
```python
# app/schemas/auth.py
class LoginRequest(BaseModel):
    email: EmailStr
    password: constr(min_length=8)

class LoginResponse(BaseModel):
    token: str
    user: UserResponse
```

**Frontend (Zod + TypeScript)** :
```typescript
// lib/validations/auth.ts
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe trop court'),
})

// types/api.ts
interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  token: string
  user: UserResponse
}
```

3. **Workflow Validation Fullstack** :
   - [ ] Backend tests >85% ✅
   - [ ] Frontend tests >75% ✅
   - [ ] API client aligné sur endpoints backend ✅
   - [ ] Types frontend alignés sur schemas backend ✅
   - [ ] E2E tests passants (flow complet) ✅
   - [ ] Lighthouse >85 ✅
   - [ ] Build backend + frontend réussis ✅

---

### ÉTAPE 6 : Écrire Tests

**Coverage requis** :
- Backend : >85%
- Frontend : >75%

#### Tests Backend

```python
# Tests unitaires services
write_test_file(
    "packages/backend/tests/services/test_{module}_service.py",
    generate_service_tests(module)
)

# Tests endpoints
write_test_file(
    "packages/backend/tests/api/v1/test_{module}_endpoints.py",
    generate_endpoint_tests(module)
)

# Tests repository
write_test_file(
    "packages/backend/tests/repositories/test_{module}_repository.py",
    generate_repository_tests(module)
)

# Exécuter tests
run_command("cd packages/backend && pytest --cov=app tests/")
```

#### Tests Frontend

```python
# Tests unitaires composants
write_test_file(
    "packages/web/tests/components/{module}/{component}.test.tsx",
    generate_component_tests(component)
)

# Tests E2E (si applicable)
if task_type in ["frontend", "fullstack"]:
    write_test_file(
        "packages/web/tests/e2e/{module}-flow.spec.ts",
        generate_e2e_tests(module)
    )

# Exécuter tests
run_command("cd packages/web && npm run test")
run_command("cd packages/web && npm run test:e2e")
```

---

### ÉTAPE 7 : Vérifier Qualité

**Linting + Type checking** :

```bash
# Backend
cd packages/backend
flake8 app/ --max-line-length=100
mypy app/ --strict
black app/ --check

# Frontend
cd packages/web
npm run lint
npm run type-check
npm run format:check
```

**Build** :

```bash
# Backend
cd packages/backend
python -m compileall app/

# Frontend
cd packages/web
npm run build
```

**⚠️ CRITIQUE** : Si erreurs → Corriger avant génération rapport

---

### ÉTAPE 8 : Générer Rapport Tâche

**Template** : `.claude/.agent/Tasks/TASK_REPORT_TEMPLATE.md`

**Destination** : `.claude/.agent/Reports/PHASE_X/TASK_PX_NNN_REPORT.md`

**Contenu** :
```markdown
# RAPPORT TÂCHE - TASK-P{X}-{NNN}

**Tâche** : TASK-P{X}-{NNN} - {Titre}
**Type** : {backend|frontend|fullstack}
**Date** : {YYYY-MM-DD HH:MM}
**Durée réelle** : {X}h (estimé : {Y}h)
**Statut** : ✅ IMPLÉMENTÉ

---

## 📋 MÉTADONNÉES

- **Type** : {type}
- **Skill invoqué** : {skill}
- **Agent** : DEV_AGENT
- **Priority** : {priority}

---

## 🎯 OBJECTIF

{Description tâche}

---

## ✅ IMPLÉMENTATION

### Fichiers Créés

**Backend** :
- `{fichier1.py}` - {description}
- `{fichier2.py}` - {description}

**Frontend** :
- `{fichier1.tsx}` - {description}
- `{fichier2.ts}` - {description}

### Fichiers Modifiés
- `{fichier3.py}` - {modifications}

---

## 🧪 TESTS

### Backend
- Tests services : {X} tests, {Y}% coverage
- Tests endpoints : {Z} tests, {W}% coverage
- Tests repository : {V} tests, {U}% coverage

**Total Backend** : {N} tests, {C}% coverage (target: >85%)

### Frontend
- Tests unitaires : {X} tests
- Tests E2E : {Y} scénarios

**Total Frontend** : {M} tests, {F}% coverage (target: >75%)

---

## 📊 QUALITÉ CODE

### Linting
- flake8 : ✅ 0 erreurs
- ESLint : ✅ 0 erreurs

### Type Checking
- mypy : ✅ 0 erreurs
- TypeScript : ✅ 0 erreurs

### Build
- Backend : ✅ Réussi ({X}s)
- Frontend : ✅ Réussi ({Y}s)

---

## 📚 SOURCES VÉRIFIÉES (Règle 0)

- [x] database/schema.sql consulté
- [x] Documentation backend consultée
- [x] Code existant respecté
- [x] Variables env vérifiées

---

## 🔗 RÉFÉRENCES

**Skill utilisé** : `.claude/skills/{skill}/Skill.md`
**Templates** : `.claude/skills/{skill}/templates/`
**Définition tâche** : `.claude/.agent/Tasks/PHASE_{X}.md`

---

## ⏭️ PROCHAINE ÉTAPE

**Validation Go/No-Go** : TASK-P{X}-{NNN}
**Invoquera** : Go/No-Go Validator → TEST_AGENT + DOC_AGENT

---

**Rapport généré par** : DEV_AGENT  
**Date** : {YYYY-MM-DD HH:MM:SS}  
**Statut** : ✅ PRÊT POUR VALIDATION
```

---

### ÉTAPE 9 : Git Commit + Push + Déclencher Validation

**Git automatique** :

```bash
#!/bin/bash

TASK_ID=$1  # Ex: TASK-P2-007
PHASE=$2    # Ex: PHASE_2

# Commit fichiers implémentés
git add packages/backend/app/
git add packages/backend/tests/
git add packages/web/src/
git add packages/web/tests/

git commit -m "feat(${TASK_ID}): Implement ${TASK_TITLE}

- Created ${FILES_CREATED}
- Modified ${FILES_MODIFIED}
- Tests coverage: backend ${BACKEND_COV}%, frontend ${FRONTEND_COV}%
- All linting/type checks passed

Refs: ${TASK_ID}"

# Push
git push origin $(git branch --show-current)

# Commit rapport
git add .claude/.agent/Reports/${PHASE}/${TASK_ID}_REPORT.md
git commit -m "docs(${TASK_ID}): Add implementation report"
git push origin $(git branch --show-current)

echo "✅ ${TASK_ID} implémenté et poussé"
```

**Déclencher Go/No-Go Validator** :

```python
# Automatiquement après git push
print(f"✅ {task_id} implémenté")
print(f"📊 Rapport : .claude/.agent/Reports/{phase}/{task_id}_REPORT.md")
print("")
print("🔄 Déclenchement Go/No-Go Validator...")

# Invoquer Go/No-Go Validator
invoke_gonogo_validator(task_id)
```

**⚠️ PAUSE WORKFLOW** :
```markdown
┌─────────────────────────────────────────────────────────┐
│ ✅ TASK-P2-007 IMPLÉMENTÉ                               │
│                                                          │
│ Type : backend                                          │
│ Skill invoqué : taxasge-backend-dev                     │
│ Durée : 3h (estimé : 3h)                                │
│                                                          │
│ Fichiers créés : 1                                      │
│ Tests : 15, Coverage : 92%                              │
│ Qualité : ✅ Lint/Type/Build OK                        │
│                                                          │
│ Rapport : .claude/.agent/Reports/PHASE_2/TASK_...      │
│                                                          │
│ ⏳ EN ATTENTE VALIDATION GO/NO-GO                       │
│                                                          │
│ Commande validation :                                   │
│ "Valide TASK-P2-007"                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 INTÉGRATION AVEC SKILLS

### Backend Dev Skill

**DEV_AGENT n'implémente PAS directement** → Skill fournit :
- ✅ Patterns architecture 3-tiers
- ✅ Templates (endpoint, service, repository)
- ✅ Références documentation
- ✅ Checklist qualité

**Workflow** :
```
DEV_AGENT détecte type=backend
  ↓
Invoque taxasge-backend-dev Skill
  ↓
Skill retourne patterns/templates
  ↓
DEV_AGENT adapte templates au contexte
  ↓
DEV_AGENT implémente selon patterns
```

### Frontend Dev Skill

**DEV_AGENT n'implémente PAS directement** → Skill fournit :
- ✅ Patterns Next.js/React
- ✅ Templates (page, component, form, api-client)
- ✅ Références documentation
- ✅ Checklist qualité

**Workflow** :
```
DEV_AGENT détecte type=frontend
  ↓
Invoque taxasge-frontend-dev Skill
  ↓
Skill retourne patterns/templates
  ↓
DEV_AGENT adapte templates au contexte
  ↓
DEV_AGENT implémente selon patterns
```

---

## 📊 EXEMPLE COMPLET

**Scénario** : User dit "Implémente TASK-P2-007"

```
1. DEV_AGENT démarre
   ↓
2. Lit PHASE_2.md
   ↓
3. Parse TASK-P2-007 :
   - Type : backend
   - Skill : taxasge-backend-dev
   - Agent : DEV_AGENT
   - Duration : 3h
   - Description : "Repository calculs"
   ↓
4. Détecte type = "backend"
   ✅ Invoque automatiquement taxasge-backend-dev
   ↓
5. Skill retourne :
   - Pattern repository (CRUD, queries, filters)
   - Template repository_template.py
   - Référence database/schema.sql
   ↓
6. Vérifie sources (Règle 0) :
   - database/schema.sql ligne 120-145 (table tax_calculations)
   - Code existant packages/backend/app/database/repositories/
   ↓
7. Vérifie dépendances :
   - TASK-P2-006 (Service calculs) : ✅ GO validé
   ↓
8. Implémente selon pattern :
   - Crée calculation_repository.py
   - CRUD complet
   - Queries optimisées (get_by_declaration, list avec filters)
   - Pagination
   - Soft delete
   ↓
9. Écrit tests :
   - test_calculation_repository.py (18 tests)
   - Coverage : 94%
   ↓
10. Vérifie qualité :
    - flake8 : ✅ 0 erreurs
    - mypy : ✅ 0 erreurs
    - Build : ✅ Réussi
   ↓
11. Génère rapport :
    - .claude/.agent/Reports/PHASE_2/TASK_P2_007_REPORT.md
   ↓
12. Git commit + push :
    - Commit code
    - Commit rapport
    - Push origin
   ↓
13. Déclenche Go/No-Go Validator :
    - ⏸️ PAUSE : Attente validation utilisateur
```

---

## 🔗 RÉFÉRENCES

**Workflows** :
- `.claude/.agent/SOP/DEV_WORKFLOW.md` - Workflow détaillé 9 étapes
- `.claude/.agent/SOP/CODE_STANDARDS.md` - Standards code
- `.claude/.agent/SOP/TEST_WORKFLOW.md` - Standards tests

**Skills** :
- `.claude/skills/taxasge-backend-dev/Skill.md` - Patterns backend
- `.claude/skills/taxasge-frontend-dev/Skill.md` - Patterns frontend

**Orchestration** :
- `.claude/skills/taxasge-orchestrator/Skill.md` - Orchestrator module
- `.claude/skills/taxasge-gonogo-validator/Skill.md` - Validation tâches

**Templates** :
- `.claude/.agent/Tasks/TASK_REPORT_TEMPLATE.md` - Template rapport tâche

---

**Agent créé par** : TaxasGE Team  
**Date** : 2025-10-31  
**Version** : 2.0.0  
**Statut** : ✅ READY FOR USE
