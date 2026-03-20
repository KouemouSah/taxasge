# BUNDLE_WORKFLOW_WIZARD_DESIGN.md

## Design complet du Wizard BundleWorkflow (Frontend + Backend)
## Date : 2026-03-20
## Statut : SPEC DESIGN pour Session 7B
## Auteur : Claude Code (expert UX+Backend)

---

## TABLE DES MATIÈRES

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture technique](#2-architecture-technique)
3. [Step 0 : Identification de l'entreprise](#3-step-0--identification-de-lentreprise)
4. [Step 1 : Upload certificado (conditionnel)](#4-step-1--upload-certificado-conditionnel)
5. [Step 2 : Revue des obligations](#5-step-2--revue-des-obligations)
6. [Step 3 : Paiement](#6-step-3--paiement)
7. [Step 4 : Confirmation](#7-step-4--confirmation)
8. [Responsive mobile](#8-responsive-mobile)
9. [Validations client + serveur](#9-validations-client--serveur)
10. [Composants React : réutilisation vs création](#10-composants-react--réutilisation-vs-création)
11. [Plan d'implémentation](#11-plan-dimplémentation)

---

## 1. VUE D'ENSEMBLE

### Flux principal (5 steps)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────────┐ │
│  │ Step 0 │───▶│ Step 1 │───▶│ Step 2 │───▶│ Step 3 │───▶│  Step 4    │ │
│  │Identif.│    │Upload  │    │Oblig.  │    │Paiement│    │Confirmation│ │
│  │Empresa │    │(cond.) │    │Review  │    │        │    │            │ │
│  └────────┘    └────────┘    └────────┘    └────────┘    └────────────┘ │
│       │                                                                  │
│       ├── Empresa EXISTANTE → Skip Step 1 → Step 2                      │
│       └── Empresa NOUVELLE → Step 1 (upload obligatoire) → Step 2       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Différences clés avec les wizards existants (Pasaporte, Residencia)

| Aspect | Pasaporte/Residencia | BundleWorkflow |
|--------|---------------------|----------------|
| **Point d'entrée** | Sélection type (EXPEDICION/RENOVACION) | Recherche entreprise (NIF/PE/nom) |
| **Documents** | 5-14 documents OCR | 0-1 document (certificado padrón, conditionnel) |
| **Form review** | 2-3 pages données personnelles | 1 page revue obligations (table interactive) |
| **Paiement** | 1 montant fixe | N montants dynamiques (mode A: par ligne, mode B: consolidé) |
| **RDV** | OUI (cita obligatoire) | NON |
| **Post-paiement** | Agent review + émission document | Multi-routing (Tesoro + Ayuntamiento + Cámara) |
| **Récurrence** | Ponctuel | Annuel (renouvellement chaque année) |

### Stepper visuel

```
Desktop:
┌─────────────────────────────────────────────────────────────────┐
│  (1)────────(2)────────(3)────────(4)────────(5)                │
│  Empresa   Documentos  Obligaciones  Pago    Confirmación      │
│  ●─────────○───────────○────────────○────────○                 │
│  actif     skip/futur  futur        futur    futur             │
└─────────────────────────────────────────────────────────────────┘

Mobile:
┌──────────────────────────┐
│  Paso 1 de 5             │
│  ● ○ ○ ○ ○              │
│  Identificación Empresa  │
└──────────────────────────┘
```

---

## 2. ARCHITECTURE TECHNIQUE

### Intégration dans le wizard existant

**DÉCISION CRITIQUE : Réutiliser la page wizard session existante ou créer une page dédiée ?**

**ANALYSE :**
- La page `[sessionId]/page.tsx` (~1200 lignes) gère DÉJÀ tous les step types (selection, document_upload, form_review, payment, confirmation)
- Le BundleWorkflow a des steps NON-STANDARD :
  - Step 0 : `SELECTION` mais avec recherche entreprise (pas un simple radio group)
  - Step 2 : `FORM_REVIEW` mais avec table obligations interactive (pas un formulaire dynamique)
  - Step 3 : `PAYMENT` mais avec mode A/B (pas un montant fixe)

**CONTRE-PROPOSITION : Page dédiée `/dashboard/bundle-payment/[sessionId]`**

Raisons :
1. La logique de recherche entreprise (autocomplete + fallback upload) n'a RIEN en commun avec les SELECTION steps existants (radio groups)
2. La table obligations avec checkboxes + mode A/B est un composant métier unique
3. Le paiement multi-montants (N service_payments) est structurellement différent du paiement unique
4. Forcer le BundleWorkflow dans le wizard générique impliquerait 200+ lignes de `if (workflowCode === 'BUNDLE_PAYMENT')` → dette technique
5. Le wizard générique est déjà à 1200 lignes — ne pas l'alourdir

**MAIS** : Réutiliser les COMPOSANTS du wizard existant (hooks, types, API client, SessionTimer, DocumentUploader)

### Architecture composants

```
packages/web/src/
├── app/[locale]/(dashboard)/dashboard/
│   └── bundle-payment/
│       ├── page.tsx                          ← Point d'entrée (sélection workflow)
│       └── [sessionId]/
│           └── page.tsx                      ← Wizard BundleWorkflow (page dédiée)
│
└── modules/bundle-workflow/                  ← NOUVEAU module
    ├── components/
    │   ├── CompanyIdentificationStep.tsx     ← Step 0 (recherche + "Mis empresas" + card)
    │   ├── CompanyUploadStep.tsx             ← Step 1 (upload certificado)
    │   ├── ObligationsReviewStep.tsx         ← Step 2 (table + mode A/B)
    │   ├── BundlePaymentStep.tsx             ← Step 3 (paiement multi-montants)
    │   ├── BundleConfirmationStep.tsx        ← Step 4 (résumé + PDF)
    │   ├── MyCompanyCard.tsx                 ← Card "Mis empresas" (badge obligations)
    │   ├── ObligationRow.tsx                 ← Ligne obligation (checkbox + montant)
    │   ├── PaymentModeSwitcher.tsx           ← Toggle Mode A / Mode B
    │   ├── LicenseVerificationLoader.tsx     ← Vérification/création licence (auto)
    │   ├── CompanyInfoCard.tsx               ← Card résumé entreprise sélectionnée
    │   └── BundleStepper.tsx                 ← Stepper spécialisé 5 étapes
    │
    ├── hooks/
    │   ├── useBundleWizard.ts               ← Hook principal (état wizard + API)
    │   └── useBundlePayment.ts              ← Hook paiement multi-obligations
    │
    ├── services/
    │   └── bundle-workflow-api.ts            ← API client endpoints spécifiques
    │
    └── types/
        └── index.ts                          ← Types BundleWorkflow
```

### Réutilisation des composants existants

```
RÉUTILISER (import direct) :
├── SessionTimer                    ← modules/service-requests/components/
├── DocumentUploader                ← modules/service-requests/components/
├── DocumentPreviewDialog           ← modules/service-requests/components/
├── CompanySearchSelect             ← modules/companies/components/
├── CompanyCard                     ← modules/companies/components/
├── useWizardSession (partiel)      ← modules/service-requests/hooks/
│   (createSession, getSession, previewDocument, confirmDocument,
│    deleteDocument, cancelSession, timeRemaining, isExpiring, isExpired)
├── wizardSessionApi (partiel)      ← modules/service-requests/services/
│   (createSession, getSession, previewDocument, confirmDocument,
│    deleteDocument, cancelSession)
├── bundleApi                       ← modules/fiscal-services/services/
├── licenseApi                      ← modules/fiscal-services/services/
├── companiesApi                    ← modules/companies/services/
├── formatCurrency/formatXAF        ← utilitaires existants
├── Card, Badge, Button, etc.       ← components/ui/ (Shadcn)
└── Checkbox, RadioGroup, Table     ← components/ui/ (Shadcn)

CRÉER (nouveau) :
├── CompanyIdentificationStep       ← Recherche + "Mis empresas" + sélection
├── MyCompanyCard                   ← Card user company (badge obligations + éligibilité)
├── CompanyUploadStep               ← Upload certificado (wrapper DocumentUploader)
├── ObligationsReviewStep           ← Table obligations + mode A/B
├── BundlePaymentStep               ← Paiement multi-montants
├── BundleConfirmationStep          ← Résumé + PDF
├── ObligationRow                   ← Ligne table obligation
├── PaymentModeSwitcher             ← Toggle A/B
├── LicenseVerificationLoader       ← Auto-vérification/création licence
├── CompanyInfoCard                 ← Résumé entreprise (enrichi vs CompanyCard)
├── BundleStepper                   ← Stepper 5 étapes
├── useBundleWizard                 ← Hook orchestrateur
├── useBundlePayment                ← Hook paiement spécifique
└── bundle-workflow-api.ts          ← API client BundleWorkflow
```

### Types TypeScript (nouveau module)

```typescript
// modules/bundle-workflow/types/index.ts

// ── Enums ──────────────────────────────────────────────────────

export type PaymentMode = 'per_line' | 'consolidated'
export type PaymentMethodBundle = 'mobile_money' | 'cash'
export type BundleWizardStep =
  | 'company_identification'
  | 'document_upload'
  | 'obligations_review'
  | 'payment'
  | 'confirmation'

// ── Request types ──────────────────────────────────────────────

export interface BundleInitiateRequest {
  company_id: string
  fiscal_year?: number  // default: current year
}

export interface BundleInitiateFromUploadRequest {
  session_id: string  // wizard session with extracted document
}

export interface SelectObligationsRequest {
  license_id: string
  processing_mode: PaymentMode
  selected_obligation_ids?: string[]  // Mode A only
}

export interface BundlePaymentRequest {
  license_id: string
  processing_mode: PaymentMode
  payment_method: PaymentMethodBundle
  phone_number?: string  // Required for mobile_money
  selected_obligation_ids?: string[]  // Mode A only
}

// ── Response types ─────────────────────────────────────────────

export interface BundleInitiateResponse {
  license_id: string
  company: CompanySummary
  bundle: BundleSummary
  zone: ZoneSummary
  fiscal_year: number
  license_status: LicenseStatus
  obligations: ObligationItem[]
  total_amount: number
  amount_paid: number
  amount_remaining: number
  currency: string
  already_complete: boolean  // true if all obligations paid
  processing_modes_available: PaymentMode[]
}

export interface CompanySummary {
  id: string
  legal_name: string
  tax_id: string
  registration_number: string
  commerce_type: string
  regimen_fiscal: string
  localidad: string
  provincia: string
  zone_code: string
  is_verified: boolean
  registered_by_current_user: boolean
}

export interface BundleSummary {
  id: string
  bundle_code: string
  commerce_type: string
  name_es: string
}

export interface ZoneSummary {
  id: string
  zone_code: string
  zone_tier: string
  name_es: string
}

export interface ObligationItem {
  id: string
  bundle_item_id: string
  fiscal_service_name: string
  fee_type: 'tesoro' | 'municipal' | 'chamber'
  ministry_name: string
  amount: number
  penalty_amount: number
  total: number  // amount + penalty
  status: ObligationStatus
  is_payable: boolean  // true if status in ['pending', 'overdue']
  due_date: string
  paid_at?: string
}

export interface BundlePaymentResponse {
  success: boolean
  service_request_id: string
  payments: PaymentDetail[]
  redirect_url?: string  // BANGE redirect (mobile_money)
  message: string
}

export interface PaymentDetail {
  payment_id: string
  obligation_id: string
  fee_type: string
  amount: number
  status: string
}

// ── "Mis empresas" types ───────────────────────────────────────

export interface MyCompanyWithStatus {
  company: CompanySummary
  pending_obligations: number      // 0 = al día, >0 = pendientes
  license_status: LicenseStatus | null  // null = pas de licence cette année
  license_id: string | null
  is_eligible: boolean             // regimen_fiscal === 'bundle'
  fiscal_year: number
}

// ── UI State types ─────────────────────────────────────────────

export interface BundleWizardState {
  currentStep: BundleWizardStep
  company: CompanySummary | null
  companyExists: boolean
  licenseData: BundleInitiateResponse | null
  selectedMode: PaymentMode
  selectedObligationIds: Set<string>
  paymentMethod: PaymentMethodBundle | null
  phoneNumber: string
  isLoading: boolean
  error: string | null
}
```

### Flux de données (séquence API)

```
Step 0: Identification entreprise
  ├── [AU MOUNT] GET /bundle-workflow/my-companies-status  (NOUVEAU)
  │   → MyCompanyWithStatus[] (max 5, triées par urgence)
  │   → Affiché dans section "Mis empresas"
  │
  ├── [SI RECHERCHE] GET /companies/admin/search?q=...     (existant, CompanySearchSelect)
  │   → CompanySearchResult[]
  │
  ├── User sélectionne (depuis "Mis empresas" OU résultats) → company_id
  └── Ou: aucun résultat → Step 1 (upload)

Step 1: Upload certificado (conditionnel)
  ├── POST /wizard-sessions/{id}/documents/preview   (existant)
  │   → Extraction GeminiDocumentProcessor
  ├── POST /wizard-sessions/{id}/documents/confirm    (existant)
  │   → company_data mappé depuis extraction
  └── POST /bundle-workflow/initiate-from-upload      (NOUVEAU)
      → Crée company + classifie + ouvre licence

Step 2: Revue obligations
  ├── POST /bundle-workflow/initiate                   (NOUVEAU)
  │   → BundleInitiateResponse (licence + obligations + tarifs)
  ├── User choisit mode A ou B
  ├── User sélectionne obligations (mode A)
  └── POST /bundle-workflow/select-obligations          (NOUVEAU)
      → Validation + calcul montant sélectionné

Step 3: Paiement
  └── POST /bundle-workflow/initiate-payment            (NOUVEAU)
      → Crée N service_payments
      → Si mobile_money: redirect_url BANGE
      → Si cash: status=submitted → agent queue

Step 4: Confirmation
  └── Pas d'appel API (données locales + redirect)
```

---

## 3. STEP 0 : IDENTIFICATION DE L'ENTREPRISE

### Design ASCII détaillé — État initial (avec "Mis empresas")

L'écran initial affiche DEUX zones :
1. **Barre de recherche** (pour chercher n'importe quelle entreprise)
2. **"Mis empresas"** (liste des entreprises de l'utilisateur, max 5, triées par urgence)

La section "Mis empresas" apparaît **au mount** (pré-fetch `GET /companies`).
Click direct sur une carte = sélection immédiate (skip recherche).

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ⏱ 28:45                                                    [Cancelar] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  (●)────────(○)────────(○)────────(○)────────(○)                       │
│  Empresa    Documentos  Obligaciones  Pago    Confirmación             │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ╔═════════════════════════════════════════════════════════════════╗    │
│  ║  IDENTIFICACIÓN DE LA EMPRESA                                   ║    │
│  ║                                                                  ║    │
│  ║  Busque su empresa o seleccione una de la lista.                ║    │
│  ║                                                                  ║    │
│  ║  ┌─────────────────────────────────────────────────────┐        ║    │
│  ║  │ 🔍 Buscar por NIF, PE-XXXX o nombre...  [________] │        ║    │
│  ║  └─────────────────────────────────────────────────────┘        ║    │
│  ║                                                                  ║    │
│  ║  ── Mis empresas ───────────────────────────────────────────    ║    │
│  ║                                                                  ║    │
│  ║  ┌─────────────────────────────────────────────────────┐        ║    │
│  ║  │ 🏢 Tienda El Sol              PE-001234 · Malabo   │        ║    │
│  ║  │    Abacerías · Autónomo                   ✅ Verif. │        ║    │
│  ║  │    ⚠ 3 obligaciones pendientes 2026      [Pagar →] │        ║    │
│  ║  ├─────────────────────────────────────────────────────┤        ║    │
│  ║  │ 🏢 Taller García              PE-005678 · Bata     │        ║    │
│  ║  │    Talleres · Autónomo                   ✅ Verif.  │        ║    │
│  ║  │    ✅ Al día 2026                        [Pagar →]  │        ║    │
│  ║  ├─────────────────────────────────────────────────────┤        ║    │
│  ║  │ 🏢 Import-Export SA           NIF-B98765            │        ║    │
│  ║  │    Sociedad Anónima                   ⊘ No elegible │        ║    │
│  ║  │    Régimen declarativo (use Declaraciones)          │        ║    │
│  ║  └─────────────────────────────────────────────────────┘        ║    │
│  ║                                                                  ║    │
│  ║  ¿No encuentra su empresa? Búsquela arriba o                   ║    │
│  ║  registre una nueva con el certificado del Padrón.              ║    │
│  ║                                                                  ║    │
│  ╚═════════════════════════════════════════════════════════════════╝    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                                              [Siguiente →]      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Section "Mis empresas" — Règles d'affichage

| Règle | Détail |
|-------|--------|
| **Source** | `GET /companies` (user-scoped, via `user_company_roles`) |
| **Limite** | Max 5 entreprises affichées |
| **Tri** | 1. Obligations pendantes (desc), 2. Dernière activité (desc) |
| **Non-éligibles** | `regimen_fiscal !== 'bundle'` → affichées grisées avec badge "No elegible", non-cliquables, tooltip "Régimen declarativo" |
| **Badge status** | Pré-fetch `licenseApi` pour compter obligations pendantes de l'année en cours |
| **Si > 5** | Lien "Ver todas mis empresas (12)" → scrollable ou modal |
| **Si 0 entreprises** | Section "Mis empresas" masquée, seule la barre de recherche apparaît |
| **Click** | Sélection directe → même effet que "Seleccionar" dans les résultats de recherche |

### Design ASCII — État recherche active (résultats)

Quand l'utilisateur tape dans la barre de recherche, la section "Mis empresas" est
remplacée par les résultats de recherche (comportement dropdown standard).

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ╔═════════════════════════════════════════════════════════════════╗    │
│  ║  IDENTIFICACIÓN DE LA EMPRESA                                   ║    │
│  ║                                                                  ║    │
│  ║  ┌─────────────────────────────────────────────────────┐        ║    │
│  ║  │ 🔍 Tienda                               [________] │        ║    │
│  ║  └─────────────────────────────────────────────────────┘        ║    │
│  ║                                                                  ║    │
│  ║  ── Resultados de búsqueda (2) ─────────────────────────────   ║    │
│  ║                                                                  ║    │
│  ║  ┌─────────────────────────────────────────────────────┐        ║    │
│  ║  │ 🏢 Tienda El Sol                                    │        ║    │
│  ║  │    PE-001234 · Malabo · Zone A1                     │        ║    │
│  ║  │    Abacerías · Autónomo                    ✅ Verif. │        ║    │
│  ║  │                                    [Seleccionar →]  │        ║    │
│  ║  ├─────────────────────────────────────────────────────┤        ║    │
│  ║  │ 🏢 Tienda La Estrella                               │        ║    │
│  ║  │    PE-003456 · Ebebiyín · Zone C1                   │        ║    │
│  ║  │    Abacerías · Autónomo                    ⏳ Pend.  │        ║    │
│  ║  │                                    [Seleccionar →]  │        ║    │
│  ║  └─────────────────────────────────────────────────────┘        ║    │
│  ║                                                                  ║    │
│  ╚═════════════════════════════════════════════════════════════════╝    │
└─────────────────────────────────────────────────────────────────────────┘
```

### État : Entreprise sélectionnée

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ╔═════════════════════════════════════════════════════════════════╗    │
│  ║  IDENTIFICACIÓN DE LA EMPRESA                                   ║    │
│  ║                                                                  ║    │
│  ║  ┌─────────────────────────────────────────────────────┐        ║    │
│  ║  │ 🔍 Tienda El Sol                        [✕ Borrar] │        ║    │
│  ║  └─────────────────────────────────────────────────────┘        ║    │
│  ║                                                                  ║    │
│  ║  ┌─────────────────────────────────────────────────────┐        ║    │
│  ║  │ ╔═══════════════════════════════════════════════╗   │        ║    │
│  ║  │ ║  🏢 Tienda El Sol                             ║   │        ║    │
│  ║  │ ║                                                ║   │        ║    │
│  ║  │ ║  NIF:      NIF-A12345678                      ║   │        ║    │
│  ║  │ ║  Registro: PE-001234                          ║   │        ║    │
│  ║  │ ║  Tipo:     Autónomo · Abacerías               ║   │        ║    │
│  ║  │ ║  Zona:     A1 (Malabo Centro)                 ║   │        ║    │
│  ║  │ ║  Régimen:  Bundle ✅                          ║   │        ║    │
│  ║  │ ║  Estado:   Verificada ✅                      ║   │        ║    │
│  ║  │ ╚═══════════════════════════════════════════════╝   │        ║    │
│  ║  │                                                     │        ║    │
│  ║  │  ⚠ Esta empresa fue registrada por otro usuario.   │        ║    │
│  ║  │    Puede continuar como representante o tercero.    │        ║    │
│  ║  └─────────────────────────────────────────────────────┘        ║    │
│  ║                                                                  ║    │
│  ╚═════════════════════════════════════════════════════════════════╝    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                                              [Siguiente →]      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### État : Aucun résultat (fallback upload)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ╔═════════════════════════════════════════════════════════════════╗    │
│  ║  IDENTIFICACIÓN DE LA EMPRESA                                   ║    │
│  ║                                                                  ║    │
│  ║  ┌─────────────────────────────────────────────────────┐        ║    │
│  ║  │ 🔍 PE-009999                             [________] │        ║    │
│  ║  └─────────────────────────────────────────────────────┘        ║    │
│  ║                                                                  ║    │
│  ║  ┌─────────────────────────────────────────────────────┐        ║    │
│  ║  │                                                     │        ║    │
│  ║  │  🔍 No se encontró ninguna empresa con ese          │        ║    │
│  ║  │     criterio de búsqueda.                           │        ║    │
│  ║  │                                                     │        ║    │
│  ║  │  ¿Es una empresa nueva? Suba el certificado         │        ║    │
│  ║  │  del Padrón Empresarial para registrarla             │        ║    │
│  ║  │  automáticamente.                                    │        ║    │
│  ║  │                                                     │        ║    │
│  ║  │  ┌───────────────────────────────────────┐          │        ║    │
│  ║  │  │  📄 Registrar nueva empresa            │          │        ║    │
│  ║  │  │     (requiere certificado del Padrón)  │          │        ║    │
│  ║  │  └───────────────────────────────────────┘          │        ║    │
│  ║  │                                                     │        ║    │
│  ║  └─────────────────────────────────────────────────────┘        ║    │
│  ║                                                                  ║    │
│  ╚═════════════════════════════════════════════════════════════════╝    │
└─────────────────────────────────────────────────────────────────────────┘
```

### États du composant CompanyIdentificationStep

| État | Déclencheur | Affichage |
|------|------------|-----------|
| **loading_my_companies** | Montage initial, fetch en cours | Skeleton loader (3 cards) dans section "Mis empresas" |
| **idle** | Fetch terminé | Barre de recherche + section "Mis empresas" (0-5 cards) |
| **idle_no_companies** | Fetch terminé, 0 entreprises | Barre de recherche seule (section "Mis empresas" masquée) |
| **searching** | Input ≥ 2 chars (debounce 300ms) | Skeleton loader remplace "Mis empresas" |
| **results** | API retourne ≥ 1 résultats | Liste cliquable avec CompanyInfoCard mini (remplace "Mis empresas") |
| **selected** | Click sur un résultat OU sur une carte "Mis empresas" | CompanyInfoCard complète + badge tiers si applicable |
| **no_results** | API retourne 0 résultats + input ≥ 3 chars | Message + bouton "Registrar nueva empresa" |
| **not_autonomo** | Entreprise sélectionnée avec `regimen_fiscal !== 'bundle'` | Alert error "Este flujo es solo para empresas autónomas" |
| **error** | Erreur API | Alert avec message + retry button |

**Transition recherche ↔ "Mis empresas" :**
- Input vide → affiche "Mis empresas"
- Input ≥ 2 chars → remplace par résultats recherche
- Clear input (✕) → retour à "Mis empresas"
- Click entreprise (de n'importe quelle source) → état "selected"

### Validations Step 0

| Validation | Côté | Règle | Message |
|-----------|------|-------|---------|
| Entreprise sélectionnée | Client | `company !== null` | "Debe seleccionar o registrar una empresa" |
| Régime fiscal bundle | Client + Serveur | `company.regimen_fiscal === 'bundle'` | "Este flujo es solo para empresas autónomas del Padrón" |
| Entreprise active | Serveur | `company.is_active === true` | "Esta empresa está inactiva" |
| NIF valide | Serveur | Format NIF GE | "El NIF no tiene un formato válido" |

### Composant : `CompanyIdentificationStep.tsx`

```typescript
interface MyCompanyWithStatus {
  company: CompanySummary
  pendingObligations: number  // 0 = al día, >0 = pendientes
  licenseStatus: LicenseStatus | null  // null = pas de licence cette année
  isEligible: boolean  // regimen_fiscal === 'bundle'
}

interface CompanyIdentificationStepProps {
  onCompanySelected: (company: CompanySummary) => void
  onNewCompanyRequested: () => void  // → navigate to Step 1
  selectedCompany: CompanySummary | null
  onClearSelection: () => void
  locale: string
}

// ── Pré-fetch au mount ─────────────────────────────────────────
// 2 appels parallèles (asyncio.gather pattern côté frontend) :
//   1. companiesApi.getAll({ limit: 5, sort: 'recent_activity' })
//   2. Pour chaque company: licenseApi.getObligations(licenseId, { status: 'pending' }).count
//      → OU endpoint dédié GET /bundle-workflow/my-companies-status
//        qui retourne companies + obligations count en 1 seul appel
//
// Cache React Query : staleTime 5min (les obligations ne changent pas souvent)

// ── Réutilise ──────────────────────────────────────────────────
// CompanySearchSelect (enrichi pour afficher résultats inline)
// CompanyCard (comme base pour CompanyInfoCard)

// ── Nouveau ────────────────────────────────────────────────────
// CompanyInfoCard (version enrichie avec zone, régime, badge tiers)
// MyCompanyCard (variante avec badge obligations + status licence)
```

### Pré-fetch "Mis empresas" — Stratégie backend

**Option A (simple, 2 appels)** :
```
companiesApi.getAll({ limit: 5 })  →  Company[]
// + pour chaque company avec regimen=bundle :
licenseApi.getStats(company.id, currentYear)  →  { pending_count }
```
Inconvénient : N+1 si l'utilisateur a 5 entreprises bundle.

**Option B (recommandé, 1 appel)** :
```
GET /bundle-workflow/my-companies-status
→ MyCompanyWithStatus[]
```
Backend fait 1 query avec LEFT JOIN sur `commercial_licenses` + `license_obligations` :
```sql
SELECT c.*, cl.status as license_status,
       COUNT(lo.id) FILTER (WHERE lo.status IN ('pending','overdue')) as pending_count
FROM companies c
JOIN user_company_roles ucr ON ucr.company_id = c.id AND ucr.user_id = $1
LEFT JOIN commercial_licenses cl ON cl.company_id = c.id AND cl.fiscal_year = $2
LEFT JOIN license_obligations lo ON lo.license_id = cl.id
GROUP BY c.id, cl.id
ORDER BY pending_count DESC NULLS LAST, c.updated_at DESC
LIMIT 5
```
1 seul appel, 1 query, cache 5min. **Recommandé.**

---

## 4. STEP 1 : UPLOAD CERTIFICADO (CONDITIONNEL)

### Condition d'affichage

Ce step N'APPARAÎT QUE si :
- L'utilisateur a cliqué "Registrar nueva empresa" au Step 0
- `companyExists === false` dans le wizard state

### Design ASCII

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ⏱ 26:30                                                    [Cancelar] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  (✓)────────(●)────────(○)────────(○)────────(○)                       │
│  Empresa    Documentos  Obligaciones  Pago    Confirmación             │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ╔═════════════════════════════════════════════════════════════════╗    │
│  ║  REGISTRO DE NUEVA EMPRESA                                       ║    │
│  ║                                                                  ║    │
│  ║  Suba el Certificado de Actualización del Padrón Empresarial    ║    │
│  ║  para registrar automáticamente su empresa.                      ║    │
│  ║                                                                  ║    │
│  ║  ┌─────────────────────────────────────────────────────┐        ║    │
│  ║  │                                                     │        ║    │
│  ║  │           ┌─────────────────────────┐               │        ║    │
│  ║  │           │                         │               │        ║    │
│  ║  │           │    📄                   │               │        ║    │
│  ║  │           │                         │               │        ║    │
│  ║  │           │  Arrastre su archivo    │               │        ║    │
│  ║  │           │  aquí o haga clic       │               │        ║    │
│  ║  │           │                         │               │        ║    │
│  ║  │           │  PDF, JPG, PNG (≤10MB)  │               │        ║    │
│  ║  │           │                         │               │        ║    │
│  ║  │           └─────────────────────────┘               │        ║    │
│  ║  │                                                     │        ║    │
│  ║  └─────────────────────────────────────────────────────┘        ║    │
│  ║                                                                  ║    │
│  ╚═════════════════════════════════════════════════════════════════╝    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │          [← Anterior]                        [Siguiente →]      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### État : Extraction en cours

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ╔═════════════════════════════════════════════════════════════════╗    │
│  ║  REGISTRO DE NUEVA EMPRESA                                       ║    │
│  ║                                                                  ║    │
│  ║  ┌─────────────────────────────────────────────────────┐        ║    │
│  ║  │ 📄 certificado_padron.pdf              [🗑 Eliminar]│        ║    │
│  ║  │    1.2 MB · PDF                                     │        ║    │
│  ║  │                                                     │        ║    │
│  ║  │ ⏳ Extrayendo datos del documento...                │        ║    │
│  ║  │ ████████████░░░░░░░░░░░░░░░░░░░░  35%              │        ║    │
│  ║  │                                                     │        ║    │
│  ║  │ Esto puede tardar unos segundos.                    │        ║    │
│  ║  └─────────────────────────────────────────────────────┘        ║    │
│  ║                                                                  ║    │
│  ╚═════════════════════════════════════════════════════════════════╝    │
└─────────────────────────────────────────────────────────────────────────┘
```

### État : Extraction réussie + entreprise détectée existante

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ╔═════════════════════════════════════════════════════════════════╗    │
│  ║  REGISTRO DE NUEVA EMPRESA                                       ║    │
│  ║                                                                  ║    │
│  ║  ┌─────────────────────────────────────────────────────┐        ║    │
│  ║  │ 📄 certificado_padron.pdf    ✅ Extraído (95%)     │        ║    │
│  ║  │    1.2 MB · PDF                        [👁 Ver] [🗑]│        ║    │
│  ║  └─────────────────────────────────────────────────────┘        ║    │
│  ║                                                                  ║    │
│  ║  ┌─────────────────────────────────────────────────────┐        ║    │
│  ║  │ ℹ️ Empresa ya registrada                            │        ║    │
│  ║  │                                                     │        ║    │
│  ║  │ El número de registro PE-001234 ya existe en        │        ║    │
│  ║  │ el sistema. Se utilizará la empresa existente.      │        ║    │
│  ║  │                                                     │        ║    │
│  ║  │ ╔═══════════════════════════════════════════╗       │        ║    │
│  ║  │ ║ 🏢 Tienda El Sol                          ║       │        ║    │
│  ║  │ ║ PE-001234 · Malabo · Zone A1              ║       │        ║    │
│  ║  │ ║ Abacerías · Autónomo           ✅ Verif.  ║       │        ║    │
│  ║  │ ╚═══════════════════════════════════════════╝       │        ║    │
│  ║  └─────────────────────────────────────────────────────┘        ║    │
│  ║                                                                  ║    │
│  ╚═════════════════════════════════════════════════════════════════╝    │
└─────────────────────────────────────────────────────────────────────────┘
```

### État : Extraction réussie + nouvelle entreprise créée

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ╔═════════════════════════════════════════════════════════════════╗    │
│  ║  REGISTRO DE NUEVA EMPRESA                                       ║    │
│  ║                                                                  ║    │
│  ║  ┌─────────────────────────────────────────────────────┐        ║    │
│  ║  │ 📄 certificado_padron.pdf    ✅ Extraído (92%)     │        ║    │
│  ║  └─────────────────────────────────────────────────────┘        ║    │
│  ║                                                                  ║    │
│  ║  ┌─────────────────────────────────────────────────────┐        ║    │
│  ║  │ ✅ Empresa registrada automáticamente               │        ║    │
│  ║  │                                                     │        ║    │
│  ║  │ ╔═══════════════════════════════════════════╗       │        ║    │
│  ║  │ ║ 🏢 Panadería La Esperanza                 ║       │        ║    │
│  ║  │ ║                                            ║       │        ║    │
│  ║  │ ║ Registro:    PE-007890                     ║       │        ║    │
│  ║  │ ║ Tipo:        Autónomo · Panaderías         ║       │        ║    │
│  ║  │ ║ Zona:        B2 (Bata Centro)              ║       │        ║    │
│  ║  │ ║ Clasificado: Bundle (conf. 95%)            ║       │        ║    │
│  ║  │ ║ Estado:      ⏳ Pendiente verificación     ║       │        ║    │
│  ║  │ ╚═══════════════════════════════════════════╝       │        ║    │
│  ║  │                                                     │        ║    │
│  ║  │  ⚠ La verificación por un administrador se         │        ║    │
│  ║  │    realizará en segundo plano. Puede continuar      │        ║    │
│  ║  │    con el pago sin esperar la verificación.         │        ║    │
│  ║  └─────────────────────────────────────────────────────┘        ║    │
│  ║                                                                  ║    │
│  ╚═════════════════════════════════════════════════════════════════╝    │
└─────────────────────────────────────────────────────────────────────────┘
```

### États du composant CompanyUploadStep

| État | Déclencheur | Affichage |
|------|------------|-----------|
| **empty** | Montage initial | Zone drag & drop |
| **uploading** | Fichier sélectionné | Progress bar upload |
| **extracting** | Upload terminé, extraction en cours | Progress bar extraction + message |
| **extracted** | Extraction réussie | Preview document + résultat extraction |
| **existing_found** | `registration_number` trouvé en BD | Info "Empresa ya registrada" + CompanyInfoCard |
| **created** | Nouvelle entreprise créée + classifiée | Success "Registrada" + CompanyInfoCard + badge pending |
| **classification_review** | Confidence < 0.90 | Warning "Classificación pendiente de revisión" |
| **not_autonomo** | `forma_juridica !== 'autonomo'` | Error "Documento no corresponde a empresa autónoma" |
| **extraction_failed** | Erreur Gemini/OCR | Error + retry button |
| **doc_type_mismatch** | Document n'est pas un certificado padrón | Error "El documento no corresponde al certificado del Padrón" |

### Validations Step 1

| Validation | Côté | Règle | Message |
|-----------|------|-------|---------|
| Document uploadé | Client | `document !== null` | "Debe subir el certificado del Padrón" |
| Extraction réussie | Serveur | `extraction_status === 'success'` | "La extracción no se completó correctamente" |
| Forma jurídica autonomo | Serveur | `forma_juridica === 'AUTONOMO'` | "Solo empresas autónomas pueden usar este flujo" |
| Negocio activo | Serveur | `estado_negocio === 'Negocio Activo'` | "El certificado indica que el negocio no está activo" |
| PE format valide | Serveur | regex `^PE-\d{4,6}$` | "Número de registro inválido" |

---

## 5. STEP 2 : REVUE DES OBLIGATIONS

### Design ASCII — État initial (chargement licence)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ⏱ 24:15                                                    [Cancelar] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  (✓)────────(✓)────────(●)────────(○)────────(○)                       │
│  Empresa    Documentos  Obligaciones  Pago    Confirmación             │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ╔═════════════════════════════════════════════════════════════════╗    │
│  ║  VERIFICANDO OBLIGACIONES FISCALES...                            ║    │
│  ║                                                                  ║    │
│  ║  ┌─────────────────────────────────────────────────────┐        ║    │
│  ║  │                                                     │        ║    │
│  ║  │         ⏳ Verificando licencia comercial...        │        ║    │
│  ║  │            Año fiscal 2026                          │        ║    │
│  ║  │                                                     │        ║    │
│  ║  │         ▸ Buscando licencia existante...            │        ║    │
│  ║  │         ▹ Generando obligaciones...                 │        ║    │
│  ║  │         ▹ Calculando tarifs...                      │        ║    │
│  ║  │                                                     │        ║    │
│  ║  └─────────────────────────────────────────────────────┘        ║    │
│  ║                                                                  ║    │
│  ╚═════════════════════════════════════════════════════════════════╝    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Design ASCII — État chargé (Mode A : Per Line)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ⏱ 23:00                                                    [Cancelar] │
├─────────────────────────────────────────────────────────────────────────┤
│  (✓)────────(✓)────────(●)────────(○)────────(○)                       │
│  Empresa    Documentos  Obligaciones  Pago    Confirmación             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ╔═════════════════════════════════════════════════════════════════╗    │
│  ║  OBLIGACIONES FISCALES — AÑO 2026                               ║    │
│  ║                                                                  ║    │
│  ║  ┌─ Empresa ─────────────────────────────────────────┐          ║    │
│  ║  │ 🏢 Tienda El Sol · PE-001234 · Malabo (A1)       │          ║    │
│  ║  │    Bundle: Abacerías · Licencia #LIC-2026-001     │          ║    │
│  ║  └───────────────────────────────────────────────────┘          ║    │
│  ║                                                                  ║    │
│  ║  ┌─ Modo de pago ───────────────────────────────────┐           ║    │
│  ║  │ (●) Modo A — Pagar por línea (seleccionar)       │           ║    │
│  ║  │ (○) Modo B — Pagar todo (pago único consolidado) │           ║    │
│  ║  └──────────────────────────────────────────────────┘           ║    │
│  ║                                                                  ║    │
│  ║  ┌─ Obligaciones ───────────────────────────────────────────┐   ║    │
│  ║  │                                                           │   ║    │
│  ║  │ ┌───┬──────────────────────────┬──────────┬────────────┐ │   ║    │
│  ║  │ │ ☐ │ Obligación               │ Entidad  │   Monto    │ │   ║    │
│  ║  │ ├───┼──────────────────────────┼──────────┼────────────┤ │   ║    │
│  ║  │ │   │ 📋 TESORO                │          │            │ │   ║    │
│  ║  │ │ ☑ │ Impuesto Mín. s/Renta   │ M.Hacien │  150.000 ₣ │ │   ║    │
│  ║  │ │ ☑ │ Imp. Actividades Econom. │ M.Comerc │   80.000 ₣ │ │   ║    │
│  ║  │ │ ☐ │ Contribución INSESO     │ M.Hacien │   25.000 ₣ │ │   ║    │
│  ║  │ │   │                          │          │            │ │   ║    │
│  ║  │ │   │ 🏛 AYUNTAMIENTO         │          │            │ │   ║    │
│  ║  │ │ ☑ │ Tasa Municipal Malabo   │ Ayunt.   │   50.000 ₣ │ │   ║    │
│  ║  │ │   │                          │          │            │ │   ║    │
│  ║  │ │   │ 🏢 CÁMARA DE COMERCIO   │          │            │ │   ║    │
│  ║  │ │ ☑ │ Cuota Anual Cámara      │ Cámara   │   30.000 ₣ │ │   ║    │
│  ║  │ ├───┴──────────────────────────┴──────────┼────────────┤ │   ║    │
│  ║  │ │              TOTAL SELECCIONADO          │  310.000 ₣ │ │   ║    │
│  ║  │ │              (4 de 5 obligaciones)       │            │ │   ║    │
│  ║  │ └─────────────────────────────────────────┴────────────┘ │   ║    │
│  ║  │                                                           │   ║    │
│  ║  │  ⚠ Las obligaciones no seleccionadas quedarán             │   ║    │
│  ║  │    pendientes. Podrá pagarlas en otro momento.            │   ║    │
│  ║  └──────────────────────────────────────────────────────────┘   ║    │
│  ║                                                                  ║    │
│  ╚═════════════════════════════════════════════════════════════════╝    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │     [← Anterior]                [Pagar 310.000 XAF →]          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Design ASCII — Mode B (Consolidated)

```
│  ║  ┌─ Modo de pago ───────────────────────────────────┐           ║    │
│  ║  │ (○) Modo A — Pagar por línea (seleccionar)       │           ║    │
│  ║  │ (●) Modo B — Pagar todo (pago único consolidado) │           ║    │
│  ║  └──────────────────────────────────────────────────┘           ║    │
│  ║                                                                  ║    │
│  ║  ┌─ Obligaciones ───────────────────────────────────────────┐   ║    │
│  ║  │                                                           │   ║    │
│  ║  │ ┌──────────────────────────────┬──────────┬────────────┐ │   ║    │
│  ║  │ │ Obligación                   │ Entidad  │   Monto    │ │   ║    │
│  ║  │ ├──────────────────────────────┼──────────┼────────────┤ │   ║    │
│  ║  │ │ 📋 TESORO                    │          │            │ │   ║    │
│  ║  │ │ Impuesto Mín. s/Renta       │ M.Hacien │  150.000 ₣ │ │   ║    │
│  ║  │ │ Imp. Actividades Econom.     │ M.Comerc │   80.000 ₣ │ │   ║    │
│  ║  │ │ Contribución INSESO         │ M.Hacien │   25.000 ₣ │ │   ║    │
│  ║  │ │                              │          │            │ │   ║    │
│  ║  │ │ 🏛 AYUNTAMIENTO             │          │            │ │   ║    │
│  ║  │ │ Tasa Municipal Malabo       │ Ayunt.   │   50.000 ₣ │ │   ║    │
│  ║  │ │                              │          │            │ │   ║    │
│  ║  │ │ 🏢 CÁMARA DE COMERCIO       │          │            │ │   ║    │
│  ║  │ │ Cuota Anual Cámara          │ Cámara   │   30.000 ₣ │ │   ║    │
│  ║  │ ├──────────────────────────────┴──────────┼────────────┤ │   ║    │
│  ║  │ │              TOTAL                       │  335.000 ₣ │ │   ║    │
│  ║  │ │              (5 obligaciones, pago único)│            │ │   ║    │
│  ║  │ └─────────────────────────────────────────┴────────────┘ │   ║    │
│  ║  │                                                           │   ║    │
│  ║  │  ℹ En Modo B, el pago único será procesado por un        │   ║    │
│  ║  │    agente polivalente del Tesoro Nacional.                │   ║    │
│  ║  └──────────────────────────────────────────────────────────┘   ║    │

(Pas de checkboxes en Mode B — toutes les obligations sont incluses)
```

### État : Licence déjà complète

```
│  ╔═════════════════════════════════════════════════════════════════╗    │
│  ║  OBLIGACIONES FISCALES — AÑO 2026                               ║    │
│  ║                                                                  ║    │
│  ║  ┌─────────────────────────────────────────────────────┐        ║    │
│  ║  │ ✅ Todas las obligaciones ya están pagadas           │        ║    │
│  ║  │    para el año fiscal 2026.                          │        ║    │
│  ║  │                                                     │        ║    │
│  ║  │    Licencia #LIC-2026-001 · Estado: COMPLETA        │        ║    │
│  ║  │    Total pagado: 335.000 XAF                        │        ║    │
│  ║  │                                                     │        ║    │
│  ║  │    [📄 Ver licencia]    [🏠 Volver al dashboard]    │        ║    │
│  ║  └─────────────────────────────────────────────────────┘        ║    │
│  ║                                                                  ║    │
│  ╚═════════════════════════════════════════════════════════════════╝    │
```

### État : Licence partielle (certaines obligations déjà payées)

```
│  ║  ┌─ Obligaciones ───────────────────────────────────────────┐   ║    │
│  ║  │ ┌───┬──────────────────────────┬──────────┬────────────┐ │   ║    │
│  ║  │ │   │ Obligación               │ Entidad  │   Monto    │ │   ║    │
│  ║  │ ├───┼──────────────────────────┼──────────┼────────────┤ │   ║    │
│  ║  │ │ ✅│ Impuesto Mín. s/Renta   │ M.Hacien │  150.000 ₣ │ │   ║    │
│  ║  │ │   │ Pagado el 15/01/2026     │          │  ✅ Pagado │ │   ║    │
│  ║  │ │ ☑ │ Imp. Actividades Econom. │ M.Comerc │   80.000 ₣ │ │   ║    │
│  ║  │ │ ☑ │ Contribución INSESO     │ M.Hacien │   25.000 ₣ │ │   ║    │
│  ║  │ │ ✅│ Tasa Municipal Malabo   │ Ayunt.   │   50.000 ₣ │ │   ║    │
│  ║  │ │   │ Pagado el 20/01/2026     │          │  ✅ Pagado │ │   ║    │
│  ║  │ │ ☑ │ Cuota Anual Cámara      │ Cámara   │   30.000 ₣ │ │   ║    │
│  ║  │ ├───┴──────────────────────────┴──────────┼────────────┤ │   ║    │
│  ║  │ │ YA PAGADO                                │  200.000 ₣ │ │   ║    │
│  ║  │ │ SELECCIONADO                             │  135.000 ₣ │ │   ║    │
│  ║  │ └─────────────────────────────────────────┴────────────┘ │   ║    │
│  ║  │                                                           │   ║    │
│  ║  │  ℹ 2 obligaciones ya fueron pagadas anteriormente.       │   ║    │
│  ║  └──────────────────────────────────────────────────────────┘   ║    │
```

### État : Obligations en retard (pénalités)

```
│  ║  │ │ ☑ │ Impuesto Mín. s/Renta   │ M.Hacien │  150.000 ₣ │ │   ║    │
│  ║  │ │   │ ⚠ Vencido: 15/03/2026   │          │  +15.000 ₣ │ │   ║    │
│  ║  │ │   │   Recargo 10%           │          │  (penalid.)│ │   ║    │
```

### États du composant ObligationsReviewStep

| État | Déclencheur | Affichage |
|------|------------|-----------|
| **loading** | Appel `POST /bundle-workflow/initiate` | Loader avec checklist animée |
| **loaded** | Réponse OK avec obligations | Table + mode switcher + total |
| **partial** | Licence existante avec obligations payées | Table mixte (payées grisées + restantes actives) |
| **complete** | Toutes obligations payées | Message succès + liens navigation |
| **no_pricing** | Bundle sans items pour cette zone | Warning "Pas de tarif configuré" |
| **overdue** | Obligations en retard avec pénalités | Badge overdue + montant pénalité par ligne |
| **error** | Erreur API initiate | Alert error + retry |
| **empty_selection** | Mode A avec 0 obligations sélectionnées | Bouton "Suivant" désactivé |

### Validations Step 2

| Validation | Côté | Règle | Message |
|-----------|------|-------|---------|
| Mode sélectionné | Client | `selectedMode !== null` | "Seleccione un modo de pago" |
| ≥ 1 obligation (Mode A) | Client | `selectedObligationIds.size > 0` | "Seleccione al menos una obligación" |
| Obligations payables | Serveur | Status in ['pending', 'overdue'] | "Obligación no disponible para pago" |
| Licence active | Serveur | `license.status !== 'suspended'` | "Licencia suspendida" |
| Zone avec pricing | Serveur | Bundle items existent pour zone | "No hay tarifa configurada para esta zona" |
| Race condition | Serveur | `UPDATE ... WHERE status='pending' RETURNING id` | "Obligación ya en curso de pago" |

### Composant : `ObligationsReviewStep.tsx`

```typescript
interface ObligationsReviewStepProps {
  company: CompanySummary
  licenseData: BundleInitiateResponse
  selectedMode: PaymentMode
  onModeChange: (mode: PaymentMode) => void
  selectedObligationIds: Set<string>
  onObligationToggle: (id: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onNext: () => void
  onBack: () => void
  locale: string
}

// Sous-composants :
// - PaymentModeSwitcher (radio group Mode A / Mode B)
// - ObligationRow (ligne table avec checkbox, badge fee_type, montant, pénalité)
// - ObligationGroupHeader (en-tête TESORO / AYUNTAMIENTO / CÁMARA)
// - TotalSummary (montant total avec décomposition)
```

---

## 6. STEP 3 : PAIEMENT

### Design ASCII — Sélection méthode de paiement

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ⏱ 20:30                                                    [Cancelar] │
├─────────────────────────────────────────────────────────────────────────┤
│  (✓)────────(✓)────────(✓)────────(●)────────(○)                       │
│  Empresa    Documentos  Obligaciones  Pago    Confirmación             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ╔═════════════════════════════════════════════════════════════════╗    │
│  ║  PAGO DE OBLIGACIONES                                           ║    │
│  ║                                                                  ║    │
│  ║  ┌─ Resumen ────────────────────────────────────────────┐       ║    │
│  ║  │                                                       │       ║    │
│  ║  │  🏢 Tienda El Sol · PE-001234                        │       ║    │
│  ║  │  Modo: Per Line (4 obligaciones seleccionadas)        │       ║    │
│  ║  │                                                       │       ║    │
│  ║  │  ┌──────────────────────────────────┬────────────┐   │       ║    │
│  ║  │  │ Impuesto Mín. s/Renta           │  150.000 ₣ │   │       ║    │
│  ║  │  │ Imp. Actividades Econom.         │   80.000 ₣ │   │       ║    │
│  ║  │  │ Tasa Municipal Malabo           │   50.000 ₣ │   │       ║    │
│  ║  │  │ Cuota Anual Cámara             │   30.000 ₣ │   │       ║    │
│  ║  │  ├──────────────────────────────────┼────────────┤   │       ║    │
│  ║  │  │ TOTAL A PAGAR                   │  310.000 ₣ │   │       ║    │
│  ║  │  └──────────────────────────────────┴────────────┘   │       ║    │
│  ║  │                                                       │       ║    │
│  ║  └───────────────────────────────────────────────────────┘       ║    │
│  ║                                                                  ║    │
│  ║  ┌─ Método de pago ─────────────────────────────────────┐       ║    │
│  ║  │                                                       │       ║    │
│  ║  │  (●) 📱 Mobile Money (BANGE)                         │       ║    │
│  ║  │      Pago instantáneo con su wallet BANGE             │       ║    │
│  ║  │                                                       │       ║    │
│  ║  │      Teléfono: [+240 ___________]                     │       ║    │
│  ║  │                                                       │       ║    │
│  ║  │  (○) 🏦 Pago en agencia (efectivo)                   │       ║    │
│  ║  │      Presente el recibo en una agencia del Tesoro     │       ║    │
│  ║  │                                                       │       ║    │
│  ║  └───────────────────────────────────────────────────────┘       ║    │
│  ║                                                                  ║    │
│  ╚═════════════════════════════════════════════════════════════════╝    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │     [← Anterior]            [💳 Pagar 310.000 XAF →]           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### État : Paiement en cours (Mobile Money)

```
│  ╔═════════════════════════════════════════════════════════════════╗    │
│  ║  PROCESANDO PAGO...                                              ║    │
│  ║                                                                  ║    │
│  ║  ┌─────────────────────────────────────────────────────┐        ║    │
│  ║  │                                                     │        ║    │
│  ║  │         ⏳ Conectando con BANGE...                  │        ║    │
│  ║  │                                                     │        ║    │
│  ║  │         Será redirigido a la plataforma de pago     │        ║    │
│  ║  │         de BANGE para completar la transacción.     │        ║    │
│  ║  │                                                     │        ║    │
│  ║  │         No cierre esta ventana.                     │        ║    │
│  ║  │                                                     │        ║    │
│  ║  └─────────────────────────────────────────────────────┘        ║    │
│  ║                                                                  ║    │
│  ╚═════════════════════════════════════════════════════════════════╝    │
```

### État : Paiement cash soumis

```
│  ╔═════════════════════════════════════════════════════════════════╗    │
│  ║  PAGO REGISTRADO                                                 ║    │
│  ║                                                                  ║    │
│  ║  ┌─────────────────────────────────────────────────────┐        ║    │
│  ║  │ ✅ Su solicitud de pago ha sido registrada.         │        ║    │
│  ║  │                                                     │        ║    │
│  ║  │ Referencia: PAY-2026-00456                          │        ║    │
│  ║  │ Monto: 310.000 XAF                                 │        ║    │
│  ║  │ Método: Pago en agencia                             │        ║    │
│  ║  │                                                     │        ║    │
│  ║  │ Un agente del Tesoro Nacional validará su pago.     │        ║    │
│  ║  │ Recibirá una notificación cuando sea procesado.     │        ║    │
│  ║  │                                                     │        ║    │
│  ║  │         [Continuar →]                               │        ║    │
│  ║  └─────────────────────────────────────────────────────┘        ║    │
│  ║                                                                  ║    │
│  ╚═════════════════════════════════════════════════════════════════╝    │
```

### États du composant BundlePaymentStep

| État | Déclencheur | Affichage |
|------|------------|-----------|
| **idle** | Montage initial | Résumé obligations + sélection méthode |
| **method_selected** | Click sur méthode | Formulaire téléphone (si mobile_money) |
| **processing** | Click "Pagar" | Loader + message "Conectando..." |
| **redirecting** | Réponse BANGE avec redirect_url | Message redirect + window.location |
| **submitted** | Paiement cash soumis | Confirmation + référence + message agent |
| **error** | Erreur API paiement | Alert avec message + retry |
| **race_condition** | Obligation déjà en cours de paiement | Warning "Obligación ya en proceso" |

### Validations Step 3

| Validation | Côté | Règle | Message |
|-----------|------|-------|---------|
| Méthode sélectionnée | Client | `paymentMethod !== null` | "Seleccione un método de pago" |
| Téléphone (mobile_money) | Client | Format `+240XXXXXXXXX` | "Número de teléfono inválido" |
| Montant > 0 | Client + Serveur | `totalAmount > 0` | "El monto debe ser mayor a 0" |
| Obligations disponibles | Serveur | Status check avant paiement | "Una o más obligaciones ya no están disponibles" |
| BANGE connectivité | Serveur | Health check gateway | "Servicio de pago temporalmente no disponible" |

---

## 7. STEP 4 : CONFIRMATION

### Design ASCII

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  (✓)────────(✓)────────(✓)────────(✓)────────(●)                       │
│  Empresa    Documentos  Obligaciones  Pago    Confirmación             │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ╔═════════════════════════════════════════════════════════════════╗    │
│  ║                                                                  ║    │
│  ║                    ✅ ¡PAGO REGISTRADO!                         ║    │
│  ║                                                                  ║    │
│  ║  ┌─ Resumen ────────────────────────────────────────────┐       ║    │
│  ║  │                                                       │       ║    │
│  ║  │  Empresa:      Tienda El Sol (PE-001234)             │       ║    │
│  ║  │  Año fiscal:   2026                                   │       ║    │
│  ║  │  Licencia:     #LIC-2026-001                          │       ║    │
│  ║  │  Modo:         Per Line (4 obligaciones)              │       ║    │
│  ║  │  Método:       Mobile Money (BANGE)                   │       ║    │
│  ║  │  Monto total:  310.000 XAF                            │       ║    │
│  ║  │  Estado:       ⏳ Pendiente validación agente         │       ║    │
│  ║  │                                                       │       ║    │
│  ║  │  ┌──────────────────────────────────┬────────────┐   │       ║    │
│  ║  │  │ Obligación                       │ Estado     │   │       ║    │
│  ║  │  ├──────────────────────────────────┼────────────┤   │       ║    │
│  ║  │  │ Impuesto Mín. s/Renta           │ ⏳ En proc.│   │       ║    │
│  ║  │  │ Imp. Actividades Econom.         │ ⏳ En proc.│   │       ║    │
│  ║  │  │ Tasa Municipal Malabo           │ ⏳ En proc.│   │       ║    │
│  ║  │  │ Cuota Anual Cámara             │ ⏳ En proc.│   │       ║    │
│  ║  │  └──────────────────────────────────┴────────────┘   │       ║    │
│  ║  │                                                       │       ║    │
│  ║  └───────────────────────────────────────────────────────┘       ║    │
│  ║                                                                  ║    │
│  ║  ┌─ Próximos pasos ─────────────────────────────────────┐       ║    │
│  ║  │                                                       │       ║    │
│  ║  │  1. Un agente validará su pago (1-3 días hábiles)    │       ║    │
│  ║  │  2. Cada entidad procesará su obligación              │       ║    │
│  ║  │  3. Recibirá su licencia comercial por email         │       ║    │
│  ║  │                                                       │       ║    │
│  ║  │  ⚠ Si tiene obligaciones pendientes, puede          │       ║    │
│  ║  │    pagarlas iniciando un nuevo flujo de pago.         │       ║    │
│  ║  └───────────────────────────────────────────────────────┘       ║    │
│  ║                                                                  ║    │
│  ║  ┌───────────────────────────────────────────────────────┐       ║    │
│  ║  │ [📄 Descargar recibo]  [🖨 Imprimir]  [🏠 Dashboard] │       ║    │
│  ║  └───────────────────────────────────────────────────────┘       ║    │
│  ║                                                                  ║    │
│  ╚═════════════════════════════════════════════════════════════════╝    │
└─────────────────────────────────────────────────────────────────────────┘
```

### États du composant BundleConfirmationStep

| État | Déclencheur | Affichage |
|------|------------|-----------|
| **success** | Paiement mobile_money complété ou cash soumis | Résumé complet + boutons action |
| **partial_warning** | Obligations restantes non payées | Warning + lien "payer les restantes" |
| **pdf_loading** | Click "Descargar recibo" | Spinner sur le bouton |
| **pdf_ready** | PDF généré | Téléchargement automatique |

---

## 8. RESPONSIVE MOBILE

### Principes

1. **No scroll horizontal** — Tables transformées en cards empilées
2. **Stepper compact** — Dots au lieu de labels texte
3. **Touch-friendly** — Minimum 44px pour les zones cliquables
4. **Bottom actions** — Boutons en bas fixe (sticky)

### Step 0 Mobile — État initial (Mis empresas)

```
┌──────────────────────────┐
│ ⏱ 28:45         [Cancel]│
├──────────────────────────┤
│ Paso 1 de 5              │
│ ● ○ ○ ○ ○               │
│ Identificación Empresa   │
├──────────────────────────┤
│                          │
│ ┌──────────────────────┐ │
│ │ 🔍 NIF, PE-XXXX...  │ │
│ └──────────────────────┘ │
│                          │
│ ── Mis empresas ──────── │
│                          │
│ ┌──────────────────────┐ │
│ │ 🏢 Tienda El Sol     │ │
│ │ PE-001234 · Malabo   │ │
│ │ Abacerías · A1       │ │
│ │ ⚠ 3 pendientes 2026 │ │
│ │            [Pagar →] │ │
│ ├──────────────────────┤ │
│ │ 🏢 Taller García     │ │
│ │ PE-005678 · Bata     │ │
│ │ Talleres · B2        │ │
│ │ ✅ Al día 2026       │ │
│ │            [Pagar →] │ │
│ ├──────────────────────┤ │
│ │ 🏢 Import-Export SA  │ │
│ │ NIF-B98765           │ │
│ │ ⊘ No elegible        │ │
│ └──────────────────────┘ │
│                          │
│ ¿No la encuentra?       │
│ Búsquela o registre una │
│ nueva.                   │
│                          │
├──────────────────────────┤
│      [Siguiente →]       │
└──────────────────────────┘
```

### Step 0 Mobile — État recherche

```
┌──────────────────────────┐
│ ⏱ 28:20         [Cancel]│
├──────────────────────────┤
│ Paso 1 de 5              │
│ ● ○ ○ ○ ○               │
│ Identificación Empresa   │
├──────────────────────────┤
│                          │
│ ┌──────────────────────┐ │
│ │ 🔍 Tienda       [✕]  │ │
│ └──────────────────────┘ │
│                          │
│ ── Resultados (2) ────── │
│                          │
│ ┌──────────────────────┐ │
│ │ 🏢 Tienda El Sol     │ │
│ │ PE-001234 · Malabo   │ │
│ │ Abacerías · A1       │ │
│ │        [Seleccionar] │ │
│ ├──────────────────────┤ │
│ │ 🏢 Tienda Estrella   │ │
│ │ PE-003456 · Ebebiyín │ │
│ │ Abacerías · C1       │ │
│ │        [Seleccionar] │ │
│ └──────────────────────┘ │
│                          │
├──────────────────────────┤
│      [Siguiente →]       │
└──────────────────────────┘
```

### Step 2 Mobile (Obligations — table en cards)

```
┌──────────────────────────┐
│ ⏱ 23:00         [Cancel]│
├──────────────────────────┤
│ Paso 3 de 5              │
│ ○ ○ ● ○ ○               │
│ Obligaciones Fiscales    │
├──────────────────────────┤
│                          │
│ 🏢 Tienda El Sol        │
│ PE-001234 · A1 · 2026   │
│                          │
│ Modo:                    │
│ ┌──────────────────────┐ │
│ │(●) Per Line          │ │
│ │(○) Consolidado       │ │
│ └──────────────────────┘ │
│                          │
│ 📋 TESORO               │
│ ┌──────────────────────┐ │
│ │ ☑ Imp. Mín. s/Renta  │ │
│ │   M. Hacienda        │ │
│ │   150.000 XAF        │ │
│ ├──────────────────────┤ │
│ │ ☑ Imp. Act. Econom.  │ │
│ │   M. Comercio        │ │
│ │   80.000 XAF         │ │
│ ├──────────────────────┤ │
│ │ ☐ Contrib. INSESO    │ │
│ │   M. Hacienda        │ │
│ │   25.000 XAF         │ │
│ └──────────────────────┘ │
│                          │
│ 🏛 AYUNTAMIENTO         │
│ ┌──────────────────────┐ │
│ │ ☑ Tasa Municipal     │ │
│ │   Ayuntamiento       │ │
│ │   50.000 XAF         │ │
│ └──────────────────────┘ │
│                          │
│ 🏢 CÁMARA COMERCIO      │
│ ┌──────────────────────┐ │
│ │ ☑ Cuota Anual        │ │
│ │   Cámara             │ │
│ │   30.000 XAF         │ │
│ └──────────────────────┘ │
│                          │
├──────────────────────────┤
│ Total: 310.000 XAF      │
│ [← Ant.] [Pagar →]      │
└──────────────────────────┘
```

### Breakpoints

| Breakpoint | Layout | Table obligations |
|-----------|--------|-------------------|
| `≥ 1024px` (lg) | Centré max-w-3xl, stepper horizontal avec labels | Table complète (checkbox + nom + entité + montant) |
| `768-1023px` (md) | Centré max-w-2xl, stepper horizontal sans labels | Table compacte (checkbox + nom + montant) |
| `< 768px` (sm) | Pleine largeur, stepper dots compacts | Cards empilées (nom + entité + montant + checkbox) |

### Touch targets

| Élément | Taille minimum | Implémentation |
|---------|---------------|----------------|
| Checkbox obligation | 44x44px | `p-3` padding sur la ligne entière |
| Bouton "Siguiente" | 48px hauteur | `h-12 w-full` en mobile |
| Résultat recherche | 60px hauteur | Card clickable avec `min-h-[60px]` |
| MyCompanyCard | 72px hauteur | Card clickable avec `min-h-[72px]`, `cursor-pointer` (grisée si non-éligible) |
| Mode A/B radio | 44x44px | RadioGroup avec `p-4` |

---

## 9. VALIDATIONS CLIENT + SERVEUR

### Tableau complet des validations

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP │ VALIDATION                    │ CLIENT │ SERVEUR │ BLOQUANT   │
├──────┼───────────────────────────────┼────────┼─────────┼────────────┤
│  0   │ Entreprise sélectionnée       │   ✅   │         │    OUI     │
│  0   │ Régime = bundle               │   ✅   │   ✅    │    OUI     │
│  0   │ Entreprise active             │        │   ✅    │    OUI     │
│  0   │ Format NIF valide             │        │   ✅    │    OUI     │
├──────┼───────────────────────────────┼────────┼─────────┼────────────┤
│  1   │ Document uploadé              │   ✅   │         │    OUI     │
│  1   │ Extraction réussie            │        │   ✅    │    OUI     │
│  1   │ forma_juridica = AUTONOMO     │        │   ✅    │    OUI     │
│  1   │ estado_negocio = Activo       │        │   ✅    │    OUI     │
│  1   │ Format PE-XXXX                │        │   ✅    │    OUI     │
│  1   │ Type document correct         │        │   ✅    │    OUI     │
│  1   │ Confidence >= 0.70            │        │   ✅    │    NON     │
├──────┼───────────────────────────────┼────────┼─────────┼────────────┤
│  2   │ Mode sélectionné              │   ✅   │         │    OUI     │
│  2   │ ≥ 1 obligation (Mode A)       │   ✅   │   ✅    │    OUI     │
│  2   │ Obligations payables          │        │   ✅    │    OUI     │
│  2   │ Licence non suspendue         │        │   ✅    │    OUI     │
│  2   │ Zone pricing existe           │        │   ✅    │    OUI     │
│  2   │ Race condition (double pay)   │        │   ✅    │    OUI     │
│  2   │ Licence non complète          │   ✅   │   ✅    │    OUI     │
├──────┼───────────────────────────────┼────────┼─────────┼────────────┤
│  3   │ Méthode paiement sélectionnée │   ✅   │         │    OUI     │
│  3   │ Téléphone valide (mobile)     │   ✅   │   ✅    │    OUI     │
│  3   │ Montant > 0                   │   ✅   │   ✅    │    OUI     │
│  3   │ Gateway disponible            │        │   ✅    │    OUI     │
│  3   │ Obligations toujours dispo.   │        │   ✅    │    OUI     │
│  3   │ Idempotence (double submit)   │        │   ✅    │    OUI     │
└──────┴───────────────────────────────┴────────┴─────────┴────────────┘
```

### Schéma Zod client

```typescript
// Step 0
const companyIdentificationSchema = z.object({
  company_id: z.string().uuid("Empresa requerida"),
  company_exists: z.boolean(),
})

// Step 2
const obligationsReviewSchema = z.object({
  license_id: z.string().uuid(),
  processing_mode: z.enum(['per_line', 'consolidated']),
  selected_obligation_ids: z.array(z.string().uuid()).min(1, {
    message: "Seleccione al menos una obligación",
  }).optional(),  // required only for per_line
}).refine(
  (data) => data.processing_mode === 'consolidated' ||
            (data.selected_obligation_ids && data.selected_obligation_ids.length > 0),
  { message: "Seleccione al menos una obligación en Modo A" }
)

// Step 3
const bundlePaymentSchema = z.object({
  payment_method: z.enum(['mobile_money', 'cash']),
  phone_number: z.string()
    .regex(/^\+240\d{9}$/, "Formato: +240XXXXXXXXX")
    .optional(),
}).refine(
  (data) => data.payment_method !== 'mobile_money' || !!data.phone_number,
  { message: "Número requerido para Mobile Money", path: ["phone_number"] }
)
```

### Codes d'erreur serveur

| Code | HTTP | Signification |
|------|------|--------------|
| `COMPANY_NOT_FOUND` | 404 | Entreprise introuvable |
| `COMPANY_NOT_AUTONOMO` | 422 | Pas une entreprise autonomo |
| `COMPANY_INACTIVE` | 422 | Entreprise inactive |
| `LICENSE_ALREADY_COMPLETE` | 409 | Licence déjà complète pour cette année |
| `LICENSE_SUSPENDED` | 403 | Licence suspendue |
| `NO_PRICING_FOR_ZONE` | 422 | Pas de tarif pour cette zone |
| `OBLIGATION_NOT_PAYABLE` | 409 | Obligation déjà payée ou en cours |
| `OBLIGATION_RACE_CONDITION` | 409 | Obligation prise par un autre paiement |
| `PAYMENT_GATEWAY_UNAVAILABLE` | 503 | Passerelle de paiement indisponible |
| `INVALID_PHONE_NUMBER` | 422 | Numéro de téléphone invalide |
| `EXTRACTION_FAILED` | 422 | Échec de l'extraction OCR |
| `DOC_TYPE_MISMATCH` | 422 | Document non reconnu comme certificado padrón |
| `NOT_ACTIVE_BUSINESS` | 422 | Certificat indique negocio inactif |

---

## 10. COMPOSANTS REACT : RÉUTILISATION VS CRÉATION

### Matrice complète

```
┌────────────────────────────────┬───────────┬──────────────────────────────┐
│ COMPOSANT                      │ ACTION    │ SOURCE / NOTES               │
├────────────────────────────────┼───────────┼──────────────────────────────┤
│                    UI DE BASE (Shadcn/UI)                                 │
├────────────────────────────────┼───────────┼──────────────────────────────┤
│ Card, CardHeader, CardContent  │ RÉUTILISER│ components/ui/card           │
│ Button                         │ RÉUTILISER│ components/ui/button         │
│ Badge                          │ RÉUTILISER│ components/ui/badge          │
│ Checkbox                       │ RÉUTILISER│ components/ui/checkbox       │
│ RadioGroup, RadioGroupItem     │ RÉUTILISER│ components/ui/radio-group    │
│ Table, TableHead, TableRow...  │ RÉUTILISER│ components/ui/table          │
│ Alert, AlertDescription        │ RÉUTILISER│ components/ui/alert          │
│ Skeleton                       │ RÉUTILISER│ components/ui/skeleton       │
│ Separator                      │ RÉUTILISER│ components/ui/separator      │
│ Input                          │ RÉUTILISER│ components/ui/input          │
├────────────────────────────────┼───────────┼──────────────────────────────┤
│                    COMPOSANTS WIZARD EXISTANTS                            │
├────────────────────────────────┼───────────┼──────────────────────────────┤
│ SessionTimer                   │ RÉUTILISER│ modules/service-requests/    │
│                                │           │ Affiche countdown TTL session│
│ DocumentUploader               │ RÉUTILISER│ modules/service-requests/    │
│                                │           │ Drag & drop + extraction     │
│ DocumentPreviewDialog          │ RÉUTILISER│ modules/service-requests/    │
│                                │           │ Modal preview extraction     │
│ CompanySearchSelect            │ RÉUTILISER│ modules/companies/           │
│                                │  + ADAPTER│ Adapter pour inline results  │
│ CompanyCard                    │ RÉUTILISER│ modules/companies/           │
│                                │  + ENRICHIR│ Base pour CompanyInfoCard   │
├────────────────────────────────┼───────────┼──────────────────────────────┤
│                    HOOKS EXISTANTS                                        │
├────────────────────────────────┼───────────┼──────────────────────────────┤
│ useWizardSession (partiel)     │ RÉUTILISER│ createSession, getSession,   │
│                                │           │ previewDocument, confirm,    │
│                                │           │ deleteDocument, cancel,      │
│                                │           │ timer (timeRemaining, etc.)  │
│                                │ NE PAS    │ saveFormData, preparePayment,│
│                                │ UTILISER  │ initiatePayment (différent   │
│                                │           │ pour bundle: multi-payments) │
├────────────────────────────────┼───────────┼──────────────────────────────┤
│                    API CLIENTS EXISTANTS                                  │
├────────────────────────────────┼───────────┼──────────────────────────────┤
│ wizardSessionApi (partiel)     │ RÉUTILISER│ createSession, getSession,   │
│                                │           │ previewDocument, confirm,    │
│                                │           │ deleteDocument               │
│ companiesAdminApi.search()     │ RÉUTILISER│ Recherche autocomplete       │
│ bundleApi                      │ RÉUTILISER│ getBundlePricing, simulate   │
│ licenseApi                     │ RÉUTILISER│ getLicense, getObligations   │
├────────────────────────────────┼───────────┼──────────────────────────────┤
│                    UTILITAIRES EXISTANTS                                  │
├────────────────────────────────┼───────────┼──────────────────────────────┤
│ formatCurrency / formatXAF     │ RÉUTILISER│ Formatage monétaire XAF      │
│ AmountInput                    │ RÉUTILISER│ components/ui/amount-input   │
├────────────────────────────────┼───────────┼──────────────────────────────┤
│                    NOUVEAUX COMPOSANTS À CRÉER                           │
├────────────────────────────────┼───────────┼──────────────────────────────┤
│ CompanyIdentificationStep      │ CRÉER     │ ~330 lignes                  │
│                                │           │ Recherche + "Mis empresas"   │
│                                │           │ + inline results + fallback  │
│ MyCompanyCard                  │ CRÉER     │ ~80 lignes                   │
│                                │           │ Card entreprise avec badge   │
│                                │           │ obligations + status licence │
│                                │           │ + grisé si non-éligible      │
│ CompanyUploadStep              │ CRÉER     │ ~180 lignes                  │
│                                │           │ Wrapper DocumentUploader +   │
│                                │           │ post-extraction logic        │
│ ObligationsReviewStep          │ CRÉER     │ ~400 lignes                  │
│                                │           │ Table + mode switcher +      │
│                                │           │ groupes fee_type + totaux    │
│ BundlePaymentStep              │ CRÉER     │ ~250 lignes                  │
│                                │           │ Résumé + méthode + phone     │
│ BundleConfirmationStep         │ CRÉER     │ ~200 lignes                  │
│                                │           │ Résumé + PDF + next steps    │
│ ObligationRow                  │ CRÉER     │ ~60 lignes                   │
│                                │           │ Ligne table (checkbox + info)│
│ ObligationGroupHeader          │ CRÉER     │ ~30 lignes                   │
│                                │           │ En-tête TESORO/AYUNT/CÁMARA │
│ PaymentModeSwitcher            │ CRÉER     │ ~50 lignes                   │
│                                │           │ Radio Mode A / Mode B        │
│ LicenseVerificationLoader      │ CRÉER     │ ~80 lignes                   │
│                                │           │ Animation checklist loading  │
│ CompanyInfoCard                │ CRÉER     │ ~100 lignes                  │
│                                │           │ Card enrichie (zone, régime) │
│ BundleStepper                  │ CRÉER     │ ~120 lignes                  │
│                                │           │ 5 étapes, desktop + mobile   │
├────────────────────────────────┼───────────┼──────────────────────────────┤
│                    NOUVEAUX HOOKS À CRÉER                                │
├────────────────────────────────┼───────────┼──────────────────────────────┤
│ useBundleWizard                │ CRÉER     │ ~350 lignes                  │
│                                │           │ État wizard + navigation +   │
│                                │           │ API calls orchestrés         │
│ useBundlePayment               │ CRÉER     │ ~150 lignes                  │
│                                │           │ initiate-payment multi-oblig │
│                                │           │ + redirect BANGE + error     │
├────────────────────────────────┼───────────┼──────────────────────────────┤
│                    NOUVEAU API CLIENT À CRÉER                            │
├────────────────────────────────┼───────────┼──────────────────────────────┤
│ bundleWorkflowApi              │ CRÉER     │ ~200 lignes                  │
│                                │           │ searchCompany, initiate,     │
│                                │           │ initiateFromUpload,          │
│                                │           │ selectObligations,           │
│                                │           │ initiatePayment              │
└────────────────────────────────┴───────────┴──────────────────────────────┘
```

### Estimation de taille

| Catégorie | Fichiers | Lignes estimées |
|-----------|----------|-----------------|
| Page wizard (`[sessionId]/page.tsx`) | 1 | ~600 |
| Page entry (`bundle-payment/page.tsx`) | 1 | ~80 |
| Composants steps (5) | 5 | ~1360 |
| Composants support (7) | 7 | ~520 |
| Hooks (2) | 2 | ~500 |
| API client (1) | 1 | ~220 |
| Types (1) | 1 | ~170 |
| **TOTAL** | **18 fichiers** | **~3450 lignes** |

---

## 11. PLAN D'IMPLÉMENTATION

### Phase 1 : Infrastructure (types + API + hooks)

- [ ] Créer `modules/bundle-workflow/types/index.ts` (types TS)
- [ ] Créer `modules/bundle-workflow/services/bundle-workflow-api.ts` (API client)
- [ ] Créer `modules/bundle-workflow/hooks/useBundleWizard.ts` (état wizard)
- [ ] Créer `modules/bundle-workflow/hooks/useBundlePayment.ts` (paiement)
- [ ] Vérifier imports : wizardSessionApi, companiesAdminApi, bundleApi, licenseApi

**Validation Phase 1** : Types compilent (`npm run type-check`), imports résolus

### Phase 2 : Composants support

- [ ] Créer `CompanyInfoCard.tsx` (enrichi vs CompanyCard)
- [ ] Créer `BundleStepper.tsx` (5 étapes, responsive)
- [ ] Créer `PaymentModeSwitcher.tsx` (radio Mode A/B)
- [ ] Créer `ObligationRow.tsx` (ligne table)
- [ ] Créer `ObligationGroupHeader.tsx` (en-tête groupe)
- [ ] Créer `LicenseVerificationLoader.tsx` (animation loading)

**Validation Phase 2** : Composants isolés compilent, Storybook si dispo

### Phase 3 : Composants steps

- [ ] Créer `CompanyIdentificationStep.tsx` (Step 0)
- [ ] Créer `CompanyUploadStep.tsx` (Step 1, conditionnel)
- [ ] Créer `ObligationsReviewStep.tsx` (Step 2)
- [ ] Créer `BundlePaymentStep.tsx` (Step 3)
- [ ] Créer `BundleConfirmationStep.tsx` (Step 4)

**Validation Phase 3** : Chaque step gère ses états (loading, error, empty, success)

### Phase 4 : Pages + intégration

- [ ] Créer `app/[locale]/(dashboard)/dashboard/bundle-payment/page.tsx` (entry)
- [ ] Créer `app/[locale]/(dashboard)/dashboard/bundle-payment/[sessionId]/page.tsx` (wizard)
- [ ] Ajouter lien dans dashboard citoyen (quick action "Pagar Obligaciones")
- [ ] Ajouter route dans le menu dynamique si applicable
- [ ] Tester flux complet Step 0 → Step 4

**Validation Phase 4** : Navigation complète, tous les états testés

### Phase 5 : Responsive + polish

- [ ] Tester breakpoints (sm, md, lg)
- [ ] Obligations table → cards en mobile
- [ ] Touch targets ≥ 44px
- [ ] Stepper compact mobile
- [ ] Bottom sticky actions mobile
- [ ] Tests i18n (es, fr, en)

**Validation Phase 5** : Tests sur 3 breakpoints, pas de scroll horizontal

### Phase 6 : Tests E2E

- [ ] Test flux complet : recherche → licence → mode A → mobile_money → confirmation
- [ ] Test flux complet : recherche → licence → mode B → cash → confirmation
- [ ] Test nouvelle entreprise : upload → extraction → création → licence → paiement
- [ ] Test licence partielle : obligations déjà payées → payer restantes
- [ ] Test licence complète : message "déjà payé"
- [ ] Test erreurs : gateway down, race condition, extraction failed

---

## ANNEXE A : POINTS DE VIGILANCE

### Ce qui pourrait mal tourner

1. **CompanySearchSelect** utilise `companiesAdminApi.search()` → vérifie que cet endpoint est accessible aux rôles `citizen/business/accountant` (pas seulement admin)
2. **Le Step 1 (upload) + extraction + classification est async (3-5s)** → UX doit être claire (loader + message d'attente, pas de timeout silencieux)
3. **Mode A avec 0 obligations sélectionnées** → le bouton "Pagar" doit être DISABLED (pas d'erreur au click)
4. **Race condition sur obligations** → L'erreur `OBLIGATION_RACE_CONDITION` doit refresh la table (pas juste afficher un message)
5. **Session TTL** → Si l'utilisateur passe trop de temps sur Step 2, la session expire → redirect vers le début avec message
6. **BANGE redirect** → Après redirect, le retour vers l'app doit vérifier le statut du paiement (callback ou polling)
7. **Obligations avec pénalités** → Afficher clairement le montant de base + la pénalité séparément (pas juste le total)

### Dépendances backend (Session 7A)

Ce design REQUIERT que les endpoints suivants soient implémentés côté backend AVANT le frontend :

| Endpoint | Priorité | Notes |
|----------|---------|-------|
| `GET /bundle-workflow/my-companies-status` | P0 | User-scoped, companies + obligations count, 1 query SQL, cache 5min |
| `POST /bundle-workflow/search-company` | P0 | Ou réutiliser `GET /companies/admin/search` avec permissions ajustées |
| `POST /bundle-workflow/initiate` | P0 | Retourne licence + obligations + tarifs |
| `POST /bundle-workflow/initiate-from-upload` | P1 | Extraction → création → classification → licence |
| `POST /bundle-workflow/select-obligations` | P0 | Validation mode + sélection |
| `POST /bundle-workflow/initiate-payment` | P0 | Crée N service_payments |

---

## ANNEXE B : COMPARAISON AVEC WIZARD EXISTANT

### Ce que le BundleWorkflow NE fait PAS (vs Pasaporte/Residencia)

- PAS de sélection solicitud_type (EXPEDICION/RENOVACION) → il n'y a qu'un type
- PAS de sélection motivo → pas de variantes
- PAS de sélection is_minor → pas applicable aux entreprises
- PAS de multi-documents OCR → maximum 1 document (certificado padrón)
- PAS d'appointment → pas de cita requise
- PAS de site_selection → pas de choix de centre
- PAS de form_review dynamique (DynamicFormRenderer) → la revue est la table obligations
- PAS de form_data.get() / extracted_field patterns → les données viennent de la licence/obligations

### Ce que le BundleWorkflow AJOUTE (vs Pasaporte/Residencia)

- Recherche entreprise avec autocomplete (CompanySearchSelect enrichi)
- Création automatique d'entreprise depuis extraction OCR
- Vérification/création automatique de licence (open_license)
- Mode de paiement A/B (per_line vs consolidated)
- Table obligations avec checkboxes (sélection partielle)
- Multi-paiements (N service_payments dans 1 transaction)
- Groupement par fee_type (Tesoro, Ayuntamiento, Cámara)
- Pénalités affichées par obligation
- Licence partielle (obligations restantes payables plus tard)
