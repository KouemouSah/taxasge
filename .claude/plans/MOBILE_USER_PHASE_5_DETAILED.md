# PHASE 5 — Payments end-to-end (BANGE deep links + history + receipts) — DETAILED PLAN

**Date** : 2026-04-27
**Phase parent** : `MOBILE_USER_MIGRATION_MASTER_PLAN.md`
**Durée estimée** : 4-5 jours
**Bloquant pour suite** : Non (P6 = support/appointments/settings, indépendant)
**Pré-requis** : Phase 0/1/2/3/4 ✅ + P4.5 ✅
**Audit source** : audit Explore exécuté 2026-04-27 (gaps backend mineurs + module payments mobile inexistant)

---

## 1. CONTEXTE

P5 livre le flow paiement complet côté mobile : déclenchement BANGE Mobile Money depuis le wizard, retour deep link, polling status, écran historique paiements + détail + accès au reçu PDF. Le backend est ~95% prêt — un seul fix nécessaire (return URL BANGE).

### 1.1 État backend (audit confirmé 2026-04-27)

| Endpoint | Statut | Comportement clé |
|----------|--------|------------------|
| `POST /wizard-sessions/{id}/prepare-payment` | ✅ Déjà câblé mobile (P3) | Calcule total + tariff_breakdown |
| `POST /wizard-sessions/{id}/initiate-payment` | ✅ Déjà câblé mobile (P3) | Persist session + atomic init paiement. Body `{payment_method, phone_number?, treasury_location_id?}`. Réponse contient `redirect_url` (BANGE), `payment_id`, `payment_reference`, `service_request_id`, `requires_action`, `action_type`, `expires_at` |
| `GET /service-requests/{request_id}/payment/status` | ✅ Production-ready | `routes.py:1204-1251` — réponse `PaymentStatusResponse {status, paid, payment_id, amount, currency, payment_method, completed_at}`. Status enum : `pending|processing|completed|failed`. **Endpoint exact pour le polling mobile** |
| `GET /payments` (liste) | ✅ Production-ready | `payment_routes.py` — paginé, filtré par user. Réponse `PaymentListResponse` |
| `GET /payments/{payment_id}` | ✅ Production-ready | Détail paiement avec ownership check |
| `POST /payments` (direct, hors wizard) | ✅ Production-ready | Champ `idempotency_key` requis (Field obligatoire). Idempotent si clé déjà vue |
| Receipt PDF auto-vault | ✅ Implémenté | `receipt_service.py:805-970` — génère PDF + Firebase upload + auto-register vault avec `generation_type='payment_receipt'` + token HMAC pour QR verify |
| ⚠️ `bange_processor.py:110` return_url | 🔴 BUG | Hardcodé `f"{settings.FRONTEND_URL}/dashboard/service-requests/{id}/payment/result"` → pointe vers le **web**. Mobile reste bloqué dans le navigateur in-app après paiement, deep link `facil://wizard/payment-result` jamais déclenché |

### 1.2 État mobile

| Élément | État |
|---------|------|
| `modules/payments/` | ❌ Absent — à créer |
| `(tabs)/payments/index.tsx` (historique) | ❌ Absent |
| `(tabs)/payments/[id].tsx` (détail) | ❌ Absent |
| `app/wizard/payment-result.tsx` | ⚠️ Stub (timer 2s factice, pas de polling, pas d'auth status réel) |
| Hooks wizard `preparePayment` / `initiatePayment` | ✅ Câblés P3 dans `wizard-api.ts` |
| Deep link scheme | ✅ `facil` configuré dans `app.json:8` |
| Reçu PDF dans vault | ✅ Module vault P2 supporte `generation_type='payment_receipt'` via `useVaultGenerated()` |

### 1.3 Pièges identifiés

| # | Piège | Mitigation |
|---|-------|------------|
| **P1** | Return URL BANGE pointe vers le web, deep link mobile jamais déclenché | Fix backend `bange_processor.py:110` : conditionner sur user-agent/source ou utiliser un return_url universel qui soit aussi un deep link app (`facil://wizard/payment-result?session_id=...&service_request_id=...`). Solution propre = passer le `return_url` cible dans le body `initiate-payment` côté mobile, backend le forward à BANGE |
| **P2** | `payment-result.tsx` n'a pas le `service_request_id` au retour BANGE — seulement `session_id` | Au moment de `initiatePayment()`, on a déjà `service_request_id` dans la réponse → stocker côté Zustand wizard avant d'ouvrir BANGE, ou inclure `service_request_id` dans le `return_url` query string |
| **P3** | Polling sans backoff peut spammer le backend (1M users) | Polling React Query avec `refetchInterval: 3000` + arrêt automatique sur statut terminal (`completed`/`failed`) + timeout global 5min → fallback "vérifie plus tard" |
| **P4** | App killée pendant le paiement BANGE → state perdu | Le wizard session backend persiste tout. Au retour, mobile peut récupérer la session par `session_id` (déjà stocké en deep link) et continuer le polling. Si session expirée → redirect vers `(tabs)/payments/[id]` via `service_request_id` |
| **P5** | Reçu PDF dans Firebase Storage = signed URL avec TTL court | Utiliser `useDownloadUrl()` (vault) qui gère le refresh URL via `/vault/{id}/download-url`. Ne jamais cacher l'URL signée |
| **P6** | Idempotency key sur `POST /payments` direct — risque double-clic ouvre 2 paiements | `POST /wizard-sessions/{id}/initiate-payment` ne demande PAS d'idempotency_key (le wizard backend dédup via `service_request_id`). Pour `POST /payments` direct (futur), générer UUID v4 côté client. P5 = focus wizard donc P1 mais documenter |
| **P7** | iOS et Android ouvrent BANGE différemment (in-app browser vs Custom Tab) | Utiliser `expo-web-browser.openBrowserAsync()` qui gère les deux + détecte le close (résolve la promesse au close). Au retour, déclencher refetch du payment-status |
| **P8** | `payment-result.tsx` peut être atteint par 2 chemins : deep link BANGE OU navigation interne après `initiate-payment` qui n'a pas de redirect (cash/check). Les 2 doivent fonctionner | Centraliser la logique : l'écran prend `session_id` ou `service_request_id` en params, polle le status, affiche le bon état |

---

## 2. ARCHITECTURE DES CHANGEMENTS

### 2.1 Layout

```
packages/mobile/
└── src/
    ├── modules/
    │   └── payments/                          # NEW
    │       ├── components/
    │       │   ├── payment-list-item.tsx     # Item liste (montant, statut, date)
    │       │   ├── payment-status-badge.tsx  # Badge coloré statut
    │       │   └── receipt-download-button.tsx # Bouton "Télécharger reçu"
    │       ├── services/
    │       │   ├── payments-api.ts           # Wrappers fetch
    │       │   └── payments-hooks.ts         # React Query hooks
    │       ├── types/
    │       │   └── payments.types.ts         # Types alignés Pydantic
    │       └── index.ts                      # Public surface
    ├── app/
    │   ├── (tabs)/
    │   │   └── payments/                     # NEW
    │   │       ├── _layout.tsx               # Stack
    │   │       ├── index.tsx                 # Historique
    │   │       └── [id].tsx                  # Détail
    │   └── wizard/
    │       └── payment-result.tsx            # MODIFIED — polling réel
    └── core/
        └── api/
            └── endpoints.ts                  # MODIFIED — ajouter routes payments
```

### 2.2 Module `payments` (mobile)

#### Types (alignés Pydantic backend)

```typescript
// packages/mobile/src/modules/payments/types/payments.types.ts
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type PaymentMethod = 'mobile_money' | 'card' | 'bank_transfer' | 'cash' | 'check' | 'bange_wallet';

export interface Payment {
  id: string;
  user_id: string;
  service_request_id: string | null;
  tax_declaration_id: string | null;
  fiscal_service_id: string | null;
  base_amount: number;
  penalties: number;
  interest: number;
  amount: number;  // total calculated
  currency: 'XAF';
  payment_method: PaymentMethod;
  status: PaymentStatus;
  bank_transaction_id: string | null;
  receipt_number: string | null;
  receipt_url: string | null;
  paid_at: string | null;  // ISO
  created_at: string;
  updated_at: string;
}

export interface PaymentStatusPolled {
  status: PaymentStatus;
  paid: boolean;
  payment_id: string | null;
  amount: number | null;
  currency: string;
  payment_method: PaymentMethod | null;
  completed_at: string | null;
}

export interface PaymentListResponse {
  items: Payment[];
  total: number;
  page: number;
  page_size: number;
}
```

#### API + Hooks

```typescript
// packages/mobile/src/modules/payments/services/payments-api.ts
export async function listPayments(params: { page?: number; page_size?: number; status?: PaymentStatus }): Promise<PaymentListResponse>;
export async function getPayment(paymentId: string): Promise<Payment>;
export async function getServiceRequestPaymentStatus(serviceRequestId: string): Promise<PaymentStatusPolled>;

// packages/mobile/src/modules/payments/services/payments-hooks.ts
export function usePaymentsList(params): UseInfiniteQueryResult<PaymentListResponse>;
export function usePayment(paymentId: string): UseQueryResult<Payment>;
export function usePaymentStatusPolling(serviceRequestId: string, options: { enabled, intervalMs }): UseQueryResult<PaymentStatusPolled>;
```

### 2.3 Écran historique `(tabs)/payments/index.tsx`

- `usePaymentsList` infinite scroll (FlatList paginated, page_size=20)
- Filtre statut en chip group : Tous / En cours / Réussis / Échoués
- Chaque item : montant, méthode, statut badge, date relative
- Tap item → push `(tabs)/payments/[id]?id=...`
- Pull-to-refresh + empty state i18n

### 2.4 Écran détail `(tabs)/payments/[id].tsx`

- `usePayment(id)` charge le détail
- Card principale : montant total + breakdown (base/penalties/interest), statut badge, méthode, dates
- Si `service_request_id` → bouton "Voir la demande" → push `requests/[id]`
- Si `receipt_url` ou `receipt_number` → composant `<ReceiptDownloadButton>` :
  - Tap → fetch signed URL via `useDownloadUrl()` (vault), ouvre via `expo-web-browser` ou `expo-file-system` download
  - Affiche `receipt_number` + bouton "Vérifier en ligne" (deep link `facil://verify/{receipt_number}?t=...` ou web URL)
- Section "Historique" si `bank_transaction_id` présent

### 2.5 Modifications `wizard/payment-result.tsx`

Réécriture du stub avec polling réel :

```typescript
// Récupère params : session_id, service_request_id, status (best-effort hint BANGE)
const { session_id, service_request_id, status: hintStatus } = useLocalSearchParams();

// Polling backend toutes les 3s, max 100 retries (5min)
const { data, isLoading } = usePaymentStatusPolling(service_request_id, {
  enabled: !!service_request_id,
  intervalMs: 3000,
});

// 4 états UI :
// - loading initial : ActivityIndicator + "Vérification..."
// - polling pending/processing : ActivityIndicator + "Paiement en cours, ne quittez pas..."
// - completed : icon success + "Paiement réussi" + bouton "Voir le reçu" + bouton "Voir la demande"
// - failed : icon error + message + bouton "Réessayer" (router.replace wizard upload-step ou retry payment)
// - timeout (>5min sans terminal) : "Vérification en cours, vous recevrez une notification"
```

### 2.6 Fix backend BANGE return URL

**Fichier** : `packages/backend/app/modules/payments/services/processors/bange_processor.py:110`

**Problème actuel** :
```python
return_url = f"{settings.FRONTEND_URL}/dashboard/service-requests/{context.service_request_id}/payment/result"
```

**Fix proposé** : ajouter un paramètre `return_url` optionnel au body `initiate-payment` du wizard. Si fourni par le client (mobile passe `facil://wizard/payment-result?session_id=X&service_request_id=Y`), backend l'utilise. Sinon fallback web.

```python
# bange_processor.py
return_url = context.return_url or f"{settings.FRONTEND_URL}/dashboard/..."

# wizard_session.py — ajout au request model
class WizardInitiatePaymentRequest(BaseModel):
    payment_method: str
    phone_number: Optional[str] = None
    treasury_location_id: Optional[UUID] = None
    return_url: Optional[str] = Field(None, description="Custom return URL for mobile deep links")
```

Côté mobile, juste avant `initiatePayment()` :
```typescript
const deepLink = `facil://wizard/payment-result?session_id=${sessionId}`;
await wizardApi.initiatePayment(sessionId, {
  payment_method: 'mobile_money',
  phone_number: phone,
  return_url: deepLink,
});
```

⚠️ **Sécurité** : valider côté backend que `return_url` est un scheme `facil://` connu OU une URL de la même origine que `FRONTEND_URL`. Sinon open-redirect.

### 2.7 Endpoints à ajouter dans `core/api/endpoints.ts`

```typescript
payments: {
  list: () => `${API}/payments`,
  detail: (id: string) => `${API}/payments/${id}`,
  serviceRequestStatus: (requestId: string) => `${API}/service-requests/${requestId}/payment/status`,
},
```

---

## 3. CHECKLIST ATOMIQUE PHASE 5

### 3.1 Backend prerequisites (~0.5j)

- [ ] **5.1.1** Modifier `WizardInitiatePaymentRequest` (Pydantic) : ajouter `return_url: Optional[str]`
- [ ] **5.1.2** Modifier `bange_processor.py:110` : `return_url = context.return_url or f"{FRONTEND_URL}/..."`
- [ ] **5.1.3** Validator anti-open-redirect : whitelist scheme `facil://*` + même origine que `FRONTEND_URL`
- [ ] **5.1.4** Test backend : `pytest packages/backend/tests/test_payments.py::test_bange_return_url_override`
- [ ] **5.1.5** Push backend → vérifier GitHub Actions deploy staging

### 3.2 Module mobile `payments/` (~1j)

- [ ] **5.2.1** Créer `modules/payments/types/payments.types.ts` (alignés Pydantic — vérifier types backend en ouvrant `payment.py`)
- [ ] **5.2.2** Créer `modules/payments/services/payments-api.ts` (3 fonctions : list, get, statusPolling)
- [ ] **5.2.3** Créer `modules/payments/services/payments-hooks.ts` (`usePaymentsList` infinite, `usePayment`, `usePaymentStatusPolling` avec `refetchInterval` + `enabled`)
- [ ] **5.2.4** Créer `modules/payments/components/` : `payment-list-item.tsx`, `payment-status-badge.tsx`, `receipt-download-button.tsx`
- [ ] **5.2.5** Créer `modules/payments/index.ts` (barrel export)
- [ ] **5.2.6** Ajouter routes dans `core/api/endpoints.ts` section `payments`
- [ ] **5.2.7** i18n 3 langues : `payments.list.*`, `payments.detail.*`, `payments.status.*`, `payments.receipt.*`

### 3.3 Écrans tabs (~1.5j)

- [ ] **5.3.1** Créer `app/(tabs)/payments/_layout.tsx` (Stack natif)
- [ ] **5.3.2** Créer `app/(tabs)/payments/index.tsx` :
  - `usePaymentsList` infinite paginé
  - Filtre statut (chip group : all/pending/completed/failed)
  - FlatList avec `<PaymentListItem>` + `<PaymentStatusBadge>`
  - Pull-to-refresh, empty state, loading skeleton léger
- [ ] **5.3.3** Créer `app/(tabs)/payments/[id].tsx` :
  - `usePayment(id)` détail
  - Card breakdown montant + statut + méthode + dates
  - Bouton "Voir la demande" si `service_request_id`
  - `<ReceiptDownloadButton>` si `receipt_url`/`receipt_number`
- [ ] **5.3.4** Ajouter onglet "Paiements" dans `app/(tabs)/_layout.tsx` (icon `cash-multiple`, badge nombre paiements pending si pertinent)

### 3.4 Wizard payment-result (polling) (~0.5j)

- [ ] **5.4.1** Réécrire `app/wizard/payment-result.tsx` :
  - Lire params `session_id`, `service_request_id`, `status` hint
  - `usePaymentStatusPolling` avec `intervalMs: 3000`, `enabled: !!service_request_id`
  - 5 états UI : loading, polling, completed, failed, timeout
- [ ] **5.4.2** Au moment de `initiatePayment()` côté wizard `[session-id].tsx` :
  - Construire `return_url = facil://wizard/payment-result?session_id=...&service_request_id=...`
  - Passer dans body `initiate-payment`
  - Si réponse a `redirect_url` (BANGE) → `expo-web-browser.openBrowserAsync(redirect_url)`
  - Si pas de redirect (cash/check) → router.push direct vers `payment-result`

### 3.5 Reçus dans vault — UI lien (~0.5j)

- [ ] **5.5.1** Vérifier que `useVaultGenerated()` filtre bien `generation_type='payment_receipt'` (déjà supporté P2)
- [ ] **5.5.2** Ajouter onglet "Reçus" dans l'écran vault existant `app/documents/index.tsx` (si pas déjà fait)
- [ ] **5.5.3** Sur tap reçu vault → ouvrir détail vault standard (URL signée via `useDownloadUrl`)
- [ ] **5.5.4** `<ReceiptDownloadButton>` (composant payments) appelle aussi `useDownloadUrl()` pour ouvrir directement

### 3.6 Validation post-P5 (checklist mémoire #35) (~0.5j)

- [ ] **5.6.1** `tsc --noEmit` 0 erreur
- [ ] **5.6.2** ESLint sous 100 warnings
- [ ] **5.6.3** Grep paths hardcodés hors endpoints.ts → vide
- [ ] **5.6.4** Smoke tests staging (avec curl + token user) :
  - `GET /payments` → 200 (liste vide ou avec data)
  - `GET /payments/{fake-uuid}` → 404 (id inexistant) ou 403 (auth manquante = au moins le path existe)
  - `GET /service-requests/{fake-uuid}/payment/status` → 403/404
- [ ] **5.6.5** Vérifier imports/exports `@modules/payments` cohérents (barrel export)
- [ ] **5.6.6** Aucune régression wizard P0+P1+P2+P3+P4+P4.5 (test wizard pasaporte cash flow ou bundle)
- [ ] **5.6.7** Auto-critique `.claude/plans/MOBILE_USER_PHASE_5_CRITIQUE.md`
- [ ] **5.6.8** Commits sémantiques locaux groupés (5.1 backend, 5.2 module, 5.3 écrans, 5.4 wizard, 5.5 vault, 5.6 critique)

---

## 4. CRITÈRES DE VALIDATION (DoD Phase 5)

| # | Critère | Méthode |
|---|---------|---------|
| V1 | Onglet "Paiements" visible dans la tabbar | Test device |
| V2 | Liste paiements paginée + filtre statut fonctionnel | Test device |
| V3 | Détail paiement affiche montant, statut, méthode, lien demande | Test device |
| V4 | Bouton "Télécharger reçu" ouvre PDF signed URL | Test device |
| V5 | Wizard payment-result polle le backend toutes les 3s | Test device |
| V6 | Retour BANGE deep link déclenche bien `payment-result` (pas web) | Test device + staging |
| V7 | Statut completed → bouton "Voir reçu" + "Voir demande" | Test device |
| V8 | Statut failed → message clair + bouton "Réessayer" | Test device |
| V9 | Polling timeout (5min) → message graceful | Test device |
| V10 | Reçu PDF apparaît dans onglet "Générés" du vault | Test device |
| V11 | Aucune régression wizard pasaporte/bundle | Test device |
| V12 | tsc 0 erreur | CI |
| V13 | ESLint < 100 warnings | CI |
| V14 | Smoke tests staging 3/3 | curl |
| V15 | i18n 3 langues complète | Code review |
| V16 | Auto-critique | Fichier |
| V17 | Commits sémantiques | git log |

---

## 5. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Open-redirect via `return_url` | MOYENNE | CRITIQUE | Whitelist scheme `facil://` + origine `FRONTEND_URL` côté backend (validator Pydantic + check service-side) |
| Polling spam backend (1M users) | HAUTE | MOYEN | `refetchInterval: 3000` + arrêt automatique sur `completed/failed` + cap 100 retries (5min) + Redis cache backend déjà en place |
| App killée pendant BANGE → state perdu | MOYENNE | MOYEN | `service_request_id` dans deep link return → mobile peut reprendre polling au boot. Backend persiste tout |
| iOS rejette deep link (non listé dans Associated Domains) | FAIBLE | MOYEN | `scheme: 'facil'` suffit pour custom URL scheme — pas de Universal Links nécessaires V1. À valider sur iOS device |
| BANGE staging endpoint pas testable depuis EAS preview | MOYENNE | FAIBLE | Tester avec compte BANGE staging fourni par l'équipe + sandbox amount. Si bloqué : utiliser méthode `cash` qui ne passe pas par BANGE |
| Refresh URL signée Firebase expirée | MOYENNE | FAIBLE | `useDownloadUrl()` vault refresh à chaque tap. Ne jamais cacher l'URL |
| `usePaymentStatusPolling` boucle infinie si backend renvoie statut inattendu | FAIBLE | MOYEN | Whitelist explicite des statuts terminaux (`completed`/`failed`/`refunded`/`cancelled`) → tout autre statut continue. Statut `unknown` arrête après cap retries |
| Onglet "Paiements" surcharge la tabbar (>5 onglets) | FAIBLE | FAIBLE | Vérifier le nombre actuel d'onglets ; si déjà 5, utiliser un menu burger ou intégrer dans Profil |

---

## 6. GAP HONNÊTE — Ce qui n'est PAS dans P5

1. **2FA payment confirmation** — pas de step de réauth biométrique avant paiement (mémoire #35 OWASP). À ajouter en P6 ou hardening security.
2. **Payment plans / installments** — listés dans master plan P5 mais reportés en P5.5 ou P6 (échéancier complexe, peu d'usage immédiat).
3. **QR code scan reçu** — verify reçu via QR code = P6 (utile pour agents inspecteurs futurs).
4. **Push notifications paiement** — confirmation par push = P5.5 ou P7 (push module).
5. **Refunds** — UI pour demander un remboursement = roadmap V2.
6. **Idempotency key sur `POST /payments` direct** — non utilisé par le wizard (qui passe par `initiate-payment`). À implémenter quand on aura un cas d'usage direct.

---

## 7. RECOMMANDATION PUSH

Push uniquement après validation device complète (V1-V11) — ce qui implique build EAS preview Android intégrant les nouveaux écrans et le scheme deep link. Le fix backend (5.1) peut être pushé indépendamment **avant** le mobile pour décorrélation : le fix est rétro-compatible (return_url optionnel).

Workflow recommandé :
1. Implémenter 5.1 backend → commit local → critique → push isolé → CI staging
2. Implémenter 5.2 → 5.5 mobile en commits groupés sémantiques (par sous-section)
3. Auto-critique `.claude/plans/MOBILE_USER_PHASE_5_CRITIQUE.md`
4. Build EAS Android preview
5. Test device golden path : paiement réel staging XAF 100 cash → completed → reçu vault visible
6. Push final mobile → CI mobile workflow

---

## 8. NEXT — Après Phase 5

P6 = Support tickets + Appointments management + Settings (4-5 jours).

---

## 9. CHANGELOG

- **2026-04-27 v1.0** : création post-audit Explore. Backend 95% prêt (1 fix mineur return_url). Mobile : module payments à créer + 2 écrans tabs + payment-result polling. Reçus PDF auto-vault déjà fonctionnel côté backend, juste UI à câbler côté mobile.
