# PLAN DÉTAILLÉ — Phase 4 : Alignement Mobile Inspector ↔ Backend (P1+P2+P3)

**Date** : 2026-04-11
**Parent plan** : `.claude/plans/INSPECTION_BUNDLE_PAYMENT_FIX_PLAN.md`
**Prérequis** : P1+P2+P3 déployées en staging ✅
**Statut** : À VALIDER avant implémentation

---

## 0. SCOPE REDÉFINI PAR L'UTILISATEUR

**Décision utilisateur** : **PAS d'offline mode** dans cette app de contrôle fiscal. Argument : l'offline pour une app qui gère de l'argent + responsabilité légale + MED/scellés = antipattern (risque de sync raté = perte financière/juridique non-reconciliable).

**Scope P4 = 2 objectifs** :
1. **Aligner** complètement la version mobile (`packages/inspector/`) avec le contrat backend (P1+P2+P3)
2. **Intégrer** les nouvelles fonctionnalités : existing_dossier, Idempotency-Key, restricted_obligations, PermissionError 403, rate limit 429, nouveaux préfixes refs

**Compromis résilience (pas offline mais robuste)** :
- Timeouts HTTP adaptés (30s)
- Retry automatique avec backoff pour endpoints idempotents (+ Idempotency-Key)
- NetInfo bannière "Connexion instable" si latence > 5s ou échec détecté
- Cache React Query 15 min sur `/verify` pour re-consultation rapide
- **Hard block** sur `/collect` si réseau KO (pas de stockage local — agent doit attendre)

**Ce qui est RETIRÉ du plan P4 initial** :
- ❌ SQLite queue offline
- ❌ Sync engine background
- ❌ Conflict resolution
- ❌ Mode "airplane"

**Ce qui reste du plan P4 initial** :
- ✅ Supervisor screens (pending-seals, reconciliation, agents-status, reports) — mais **seulement si pas déjà présents** (le module `supervisor/` existe déjà en file system)

---

## 1. ÉTAT ACTUEL (vérifié 2026-04-11)

### 1.1 Structure existante `packages/inspector/`

```
src/
├── app/
│   ├── (auth)/sign-in.tsx
│   ├── (tabs)/
│   │   ├── index.tsx          (dashboard)
│   │   ├── inspections/       (liste + detail)
│   │   ├── verify.tsx         ← à enrichir
│   │   └── profile.tsx
│   ├── inspection/
│   │   ├── create.tsx         ← Idempotency
│   │   ├── [id]/complete.tsx
│   │   ├── [id]/med.tsx
│   │   ├── [id]/seal.tsx
│   │   ├── [id]/seal-review.tsx
│   │   └── [id]/payment.tsx   ← Idempotency critique
│   └── supervisor/            ← à vérifier alignement
│
├── core/
│   ├── api/client.ts          ← apiPost doit supporter headers custom
│   ├── auth/
│   ├── i18n/
│   └── ...
│
└── modules/
    ├── verification/          ← types à enrichir
    ├── inspections/           ← types à enrichir
    ├── supervisor/            ← à vérifier
    ├── camera/
    ├── scanner/
    ├── signature/
    └── notifications/
```

### 1.2 Lacunes d'alignement P1/P2/P3 identifiées

| Backend feature | Frontend mobile actuel | Action P4 |
|-----------------|------------------------|-----------|
| `LicenseVerification.existing_dossier` (P3.E) | Absent du type | Ajouter interface + UI bandeau |
| `LicenseVerification.has_pending_citizen_payment` | Absent | Ajouter + UI warning bandeau |
| `LicenseVerification.restricted_obligations` | Absent | Ajouter + griser obligations |
| `LicenseVerification.agent_can_collect_all` | Absent | Ajouter + header badge |
| `LicenseVerification.agent_scope` | Absent | Ajouter (info tooltip) |
| `LicenseObligation.agent_restricted` | Absent | Ajouter + lock icon |
| `LicenseObligation.ministry_id` | Absent (bug latent P3 fix) | Ajouter |
| `Idempotency-Key` header sur /collect | **Pas de support** | Étendre `apiPost` + generate UUID |
| `Idempotency-Key` header sur /create | **Pas de support** | Idem |
| HTTP 403 PermissionError (fee_type scope) | Pas de handling dédié | Ajouter toast user-friendly |
| HTTP 429 Rate limit | Pas de handling dédié | Toast + Retry-After timer |
| Nouveaux préfixes refs (LIC-, FLD-) | N/A (affichage générique) | OK (pas de filtre hardcodé à vérifier) |

### 1.3 Supervisor module — état à confirmer

Le dossier `packages/inspector/src/modules/supervisor/` existe. Contenu à vérifier en P4.F.1 avant de dépenser du temps dessus.

---

## 2. DÉCISIONS EXPERT VALIDÉES

### D1 — Idempotency-Key client-side : UUID v4 persistant par instance d'écran

**Strategy** : générer un UUID v4 au `useState` initial de chaque screen qui fait un POST mutation. Si l'écran se re-render (retry, unmount/remount), l'UUID reste. Le dev doit utiliser `useRef(uuidv4())` ou `useState(() => uuidv4())` pour figer la valeur.

**Lib** : `expo-crypto` (déjà dispo dans Expo SDK) via `Crypto.randomUUID()`. Alternative : `react-native-uuid` si besoin.

**Clé côté client** :
```ts
const idempotencyKeyRef = useRef(Crypto.randomUUID());
// passé à chaque appel apiPost
```

### D2 — `apiPost` étendu avec headers custom

**Choix** : étendre la signature existante au lieu de créer une nouvelle fonction. Non-breaking.

```ts
// Before
export async function apiPost<T>(url: string, data?: unknown): Promise<T>

// After
export async function apiPost<T>(
  url: string,
  data?: unknown,
  options?: { headers?: Record<string, string>; timeout?: number }
): Promise<T>
```

**Usage** :
```ts
apiPost('/inspections/{id}/collect', data, {
  headers: { 'Idempotency-Key': idempotencyKeyRef.current }
})
```

### D3 — Gestion erreurs user-friendly

**403 PermissionError** (fee_type scope) :
- Détection : `error.response.status === 403`
- Message i18n : `collect.error.out_of_scope` → "Cette obligation ne peut être collectée que par un agent de {entity}"
- Toast destructive + bouton "Voir détails" ouvre un bottom sheet avec la liste des obligations forbidden

**429 Rate limit** :
- Détection : `error.response.status === 429`
- Header `Retry-After` parsé
- Message i18n : `collect.error.rate_limit` → "Trop de tentatives. Réessayez dans {seconds}s"
- Bouton "Réessayer" disabled + countdown

**Idempotency-Replay header** :
- Détection : `response.headers['idempotency-replay'] === 'true'`
- Toast info : "Paiement déjà enregistré — affichage du résultat précédent"
- UX : traiter comme succès normal mais logger en debug

### D4 — Priorisation P4 si temps limité

1. **Critique** (P4.A-P4.D) : Types + API client + verify + collect avec Idempotency
2. **Important** (P4.E-P4.F) : Résilience + handlers erreurs 403/429
3. **Bonus** (P4.G) : Supervisor screens si file existe déjà (pas de nouveau dev lourd)
4. **Reporté P5** : Tests E2E mobile (nécessite emulator Android)

---

## 3. CHECKLIST P4

### P4.A — Types TypeScript alignés avec P3 backend

- [x] P4.A.1 : Ouvrir `packages/inspector/src/modules/inspections/types/inspection.types.ts`
- [x] P4.A.2 : Étendre `LicenseObligation` :
  ```ts
  export interface LicenseObligation {
    id: string;
    fee_type: string;
    amount: number;
    penalty_amount: number;
    due_date: string;
    status: string;
    service_name: string | null;
    ministry_name: string | null;
    ministry_id: number | null;           // NEW (P3 bug fix)
    agent_restricted?: boolean;            // NEW (P3.E)
    agent_restricted_reason?: string | null; // NEW
  }
  ```
- [x] P4.A.3 : Étendre `LicenseVerification` :
  ```ts
  export interface ExistingDossier {
    service_request_id: string;
    reference: string;
    source: 'citizen_wizard' | 'field_inspection' | 'admin_import' | 'batch';
    status: string;
    created_at: string;
  }

  export interface PendingPaymentInfo {
    payment_reference: string;
    payment_method: string;
    total_amount: number | null;
    workflow_status: string;
    created_at: string;
  }

  export interface AgentScope {
    role_code: string | null;
    allowed_fee_types: string[] | null;
    required_ministry_id: number | null;
    is_polyvalent: boolean;
    is_independent: boolean;
    is_supervisor: boolean;
  }

  export interface LicenseVerification {
    // ... existing fields ...
    existing_dossier: ExistingDossier | null;          // NEW
    has_pending_citizen_payment: boolean;              // NEW
    pending_payment_info: PendingPaymentInfo | null;   // NEW
    restricted_obligations: string[];                  // NEW
    agent_can_collect_all: boolean;                    // NEW
    agent_scope: AgentScope;                           // NEW
  }
  ```
- [x] P4.A.4 : `tsc --noEmit` doit passer sans erreur

### P4.B — API client support headers custom + Idempotency

- [x] P4.B.1 : Modifier `apiPost<T>` dans `core/api/client.ts` pour accepter `options?: { headers?, timeout? }`
- [x] P4.B.2 : Idem `apiPut<T>` pour consistance
- [x] P4.B.3 : Créer helper `core/api/idempotency.ts` :
  ```ts
  import * as Crypto from 'expo-crypto';
  export function generateIdempotencyKey(): string {
    return Crypto.randomUUID();
  }
  export const IDEMPOTENCY_HEADER = 'Idempotency-Key';
  ```
- [x] P4.B.4 : Étendre `inspections-api.ts` `collect` pour prendre un `idempotencyKey` param et passer le header
- [x] P4.B.5 : Étendre `inspections-api.ts` `create` pour prendre un `idempotencyKey` param
- [x] P4.B.6 : Vérifier que `expo-crypto` est installé (devrait être via `expo install`)

### P4.C — UI verify.tsx enrichi

- [x] P4.C.1 : Ouvrir `packages/inspector/src/app/(tabs)/verify.tsx`
- [x] P4.C.2 : Composant `ExistingDossierBanner` (bleu info) :
  - Affiché si `result.existing_dossier !== null`
  - Texte : "Dossier en cours créé le {date} via {source}"
  - Bouton "Voir détails" (optionnel — reporte au tap sur la card)
- [x] P4.C.3 : Composant `PendingPaymentWarning` (orange warning) :
  - Affiché si `result.has_pending_citizen_payment === true`
  - Texte : "Paiement en cours côté citoyen ({pending_payment_info.payment_reference}) — Coordonnez-vous avant d'encaisser"
  - Bloque l'accès au bouton "Collecter" (ou warning modal avant)
- [x] P4.C.4 : Dans la liste des obligations, griser celles `agent_restricted === true` :
  - opacity: 0.4
  - Icône lock (Feather `lock` ou similar)
  - Tooltip/bottom sheet : `agent_restricted_reason`
  - Checkbox désactivée (pas de sélection)
- [x] P4.C.5 : Header de la card obligations : badge "X / Y obligations collectibles" où X = non-restricted count
- [x] P4.C.6 : Footer card : si `agent_can_collect_all === false`, message info "Seul un agent {role_label} peut collecter les autres obligations"

### P4.D — Screen collect/payment avec Idempotency-Key

- [x] P4.D.1 : Ouvrir `packages/inspector/src/app/inspection/[id]/payment.tsx`
- [x] P4.D.2 : Au top du composant, générer l'Idempotency-Key :
  ```tsx
  import { generateIdempotencyKey } from '@core/api/idempotency';
  const idempotencyKeyRef = useRef(generateIdempotencyKey());
  ```
- [x] P4.D.3 : Passer `idempotencyKeyRef.current` à l'API collect
- [x] P4.D.4 : Si l'utilisateur revient au screen après succès → nouvel écran = nouveau key (React Navigation unmount/mount)
- [x] P4.D.5 : Griser les obligations avec `agent_restricted` dans la sélection (empêcher de les cocher)
- [x] P4.D.6 : Validation Zod : `obligation_ids` ne peut pas contenir un ID restricted
- [x] P4.D.7 : Idem sur `packages/inspector/src/app/inspection/create.tsx` (Idempotency secondaire)

### P4.E — Handlers erreurs 403/429 + Idempotency-Replay

- [x] P4.E.1 : Créer `core/api/errors.ts` (ou étendre existant) avec helpers :
  - `isPermissionError(error): boolean` (403)
  - `isRateLimitError(error): boolean` (429)
  - `getRetryAfter(error): number` (header ou 60 par défaut)
  - `isIdempotencyReplay(response): boolean`
- [x] P4.E.2 : Dans le `inspection/[id]/payment.tsx`, catch errors :
  - 403 → Toast destructive + modal détails (liste obligations forbidden)
  - 429 → Toast warning + countdown
  - 500+ → Toast generic
- [x] P4.E.3 : i18n clés (fr/es/en) :
  ```
  collect.error.out_of_scope
  collect.error.rate_limit
  collect.error.generic
  collect.replay_notice
  ```

### P4.F — Résilience réseau (pas offline)

- [x] P4.F.1 : Configurer axios timeout global à 30s (actuellement ?)
- [x] P4.F.2 : Retry automatique via axios interceptor pour les endpoints idempotents :
  - GET : toujours retry 2x avec backoff 500ms, 1500ms
  - POST avec header `Idempotency-Key` : idem (serveur gère la dedup)
  - Autres POST : pas de retry automatique (risque double-action)
- [x] P4.F.3 : Vérifier module `@react-native-community/netinfo` installé
- [x] P4.F.4 : Composant global `NetworkBanner` :
  - Monté en layout root
  - Affiche une barre rouge/orange si `netInfo.isConnected === false` ou si latence > 5s (via axios interceptor qui timestampe)
  - Texte : "Connexion instable — certaines actions peuvent échouer"
- [x] P4.F.5 : Sur `/collect` : si `!netInfo.isConnected`, bouton disabled + message "Attendre la connexion"

### P4.G — Supervisor alignment (si module existe partiellement)

- [x] P4.G.1 : Lister `packages/inspector/src/modules/supervisor/` + `src/app/supervisor/` pour voir ce qui existe
- [x] P4.G.2 : Si screens manquants critiques (`pending-seals`, `reconciliation`, `agents-status`) → créer placeholder + TODO P5
- [x] P4.G.3 : Si screens existent → vérifier qu'ils utilisent bien les endpoints backend (via inspections-api.ts)
- [x] P4.G.4 : Pas de nouveau dev lourd en P4 — alignement seulement

### P4.H — Tests manuels + build APK dev

- [x] P4.H.1 : `tsc --noEmit` global
- [x] P4.H.2 : `eslint src --ext .ts,.tsx` global
- [x] P4.H.3 : `npm run start` (Expo dev server) + test sur simulateur Android :
  - Sign in avec `agent.polyvalent@test.gq`
  - Verify licence (entrer NIF d'une company test)
  - Vérifier affichage `existing_dossier` absent (licence orpheline)
  - Créer inspection → vérifier header Idempotency-Key sent (via proxy logs ou devtools)
  - Collecter un paiement → vérifier succès + cache Idempotency
  - Relancer collect même écran → vérifier Idempotency-Replay (toast)
- [x] P4.H.4 : Test 403 : se connecter avec agent_ayuntamiento, tenter collecter une obligation tesoro → vérifier toast
- [x] P4.H.5 : Test airplane mode : bouton `/collect` doit être disabled + bannière
- [x] P4.H.6 : Build APK dev : `eas build -p android --profile development` (si EAS configuré) — **reporter en P5 si bloqué par infra**

### P4.I — Validation + auto-critique + commit local

- [x] P4.I.1 : Relire diff complet
- [x] P4.I.2 : Grep Idempotency-Key pour cohérence
- [x] P4.I.3 : Rédiger auto-critique dans `.claude/plans/INSPECTION_BUNDLE_P4_RETRO.md`
- [x] P4.I.4 : Commit local avec message structuré
- [x] P4.I.5 : **NE PAS PUSH** — demander validation utilisateur

---

## 4. MATRICE DE RISQUES P4

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|-----------|
| `Crypto.randomUUID()` absent dans Expo SDK installé | Faible | 🟡 Moyen | Fallback `Date.now() + Math.random()` (moins cryptographique mais suffisant pour Idempotency-Key côté client) |
| `apiPost` signature change casse les appelants existants | Certaine si non-backward-compat | 🔴 Critique | Options param optionnel → 0 casse des appels sans options |
| Axios retry automatique sur POST non-idempotent = double action | Moyenne | 🔴 Critique | Retry SEULEMENT si header `Idempotency-Key` présent (condition stricte) |
| NetInfo lib non installée | Faible | 🟢 Bas | Check via `package.json`, `npx expo install` si absent |
| UI verify écrasée si déjà en cours d'édition par l'user sur mobile | Inconnue | 🟡 Moyen | Git status avant d'éditer |
| i18n clés manquantes cassent le rendu | Moyenne | 🟡 Moyen | Fallback `t('key', { defaultValue: 'xxx' })` |
| Supervisor module incomplet bloque le scope | Moyenne | 🟡 Moyen | P4.G scoped "alignement only" — pas de nouveau dev |
| Le test 403 ne peut pas être lancé sans agent test ayuntamiento | Faible | 🟢 Bas | Tests manuels reportés P5 si besoin |

---

## 5. CRITÈRES DE PASSAGE EN P5

P4 est **DONE** quand :

- ✅ Types TypeScript alignés avec backend P3
- ✅ `apiPost` supporte `headers` + `timeout` options
- ✅ `core/api/idempotency.ts` créé avec `generateIdempotencyKey`
- ✅ `verify.tsx` affiche `existing_dossier`, `has_pending_citizen_payment`, grise `agent_restricted` obligations
- ✅ `payment.tsx` + `create.tsx` utilisent Idempotency-Key
- ✅ Handlers 403/429/Idempotency-Replay en place
- ✅ NetworkBanner + hard-block collect si offline
- ✅ `tsc --noEmit` + `eslint` OK
- ✅ Test manuel sur simulator passe (au moins le happy path verify → create → collect)
- ✅ Auto-critique rédigée
- ✅ Commit local créé

**P4 ne nécessite PAS** :
- ❌ Module offline SQLite
- ❌ Sync engine
- ❌ Build APK release (reporté P5)
- ❌ Tests Detox/Maestro E2E (reporté P5)

---

## 6. LIVRABLES

| Livrable | Fichier |
|----------|---------|
| Types enrichis | `packages/inspector/src/modules/inspections/types/inspection.types.ts` |
| API client extended | `packages/inspector/src/core/api/client.ts` |
| Idempotency helper | `packages/inspector/src/core/api/idempotency.ts` (nouveau) |
| Error helpers | `packages/inspector/src/core/api/errors.ts` (modifié ou nouveau) |
| Verify UI enrichi | `packages/inspector/src/app/(tabs)/verify.tsx` |
| Payment UI Idempotency | `packages/inspector/src/app/inspection/[id]/payment.tsx` |
| Create UI Idempotency | `packages/inspector/src/app/inspection/create.tsx` |
| NetworkBanner | `packages/inspector/src/components/NetworkBanner.tsx` (nouveau, probablement) |
| i18n clés | `packages/inspector/src/core/i18n/locales/{es,fr,en}.json` |
| Rétro | `.claude/plans/INSPECTION_BUNDLE_P4_RETRO.md` |

---

## 7. POINTS DE DÉCISION AVANT IMPL

**Q1** — Inclure les supervisor screens (pending-seals, reconciliation, agents-status) dans P4 ou reporter en P5 ?

**Recommandation** : P4.G = **alignment seulement** (vérifier que les screens existants utilisent bien les endpoints backend), **pas de nouveau dev lourd**. Si un screen manque totalement → placeholder "Disponible prochainement" + TODO P5.

**Q2** — Build APK dev via EAS dans P4 ou P5 ?

**Recommandation** : P4.H.6 est **optionnel/best-effort**. Si EAS credentials ok et build passe sans config extra → OK. Sinon reporté P5 avec les E2E tests.

**Q3** — Sur `/collect` en mode hors-réseau : disabled ou queue locale ?

**Recommandation** : **Disabled** + bannière (cohérent avec décision "pas d'offline"). L'agent devra trouver du réseau avant d'encaisser. Douloureux mais safer.

**Q4** — Retry automatique sur 500 serveur ?

**Recommandation** : **NON** pour les POST mutations (même avec Idempotency, on veut laisser l'agent décider). OUI pour GET (verify, list).

---

**FIN DU PLAN DÉTAILLÉ P4**

Réponds :
- **"GO IMPL P4"** → je démarre P4.A (types)
- **"Q1=P5"** / **"Q2=P5"** → si tu veux décaler supervisor/APK
- **"MODIFIE X"** → ajustement
