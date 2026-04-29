# PHASE 2 — Document Vault (Mes Documents) + Auto-fill Wizard (DETAILED PLAN)

**Date** : 2026-04-27
**Phase parent** : `MOBILE_USER_MIGRATION_MASTER_PLAN.md`
**Durée estimée** : 5-7 jours
**Bloquant pour suite** : Non (mais nécessaire pour P4 wizard auto-fill complet)
**Pré-requis** : Phase 0 ✅ + Phase 1 ✅

---

## 1. CONTEXTE & STRATÉGIE

Le **Document Vault** (modules/user_documents backend) est l'épine dorsale de l'expérience citoyen :
- Coffre-fort de documents personnels (DIP, passeport, NIF, contrats, etc.) — 100 MB/user
- Auto-fill du wizard : un doc déjà uploadé une fois est réutilisable sans ré-upload
- Documents générés par la plateforme (reçus, certificats) accessibles au même endroit
- Alertes proactives sur expirations + suggestions de renouvellement

> **Règle d'or P2** : on consomme 30+ endpoints backend déjà production-ready (audit confirmé 2026-04-27). Aucun endpoint backend à créer. Le travail est purement mobile.

### 1.1 Architecture validée

```
                  ┌─────────────────────────────┐
                  │  modules/vault/             │
                  │  ┌─────────┬─────────────┐  │
                  │  │ types/  │ services/   │  │
                  │  │ hooks/  │ components/ │  │
                  │  └─────────┴─────────────┘  │
                  └──────────────┬──────────────┘
                                 │ React Query
              ┌──────────────────┼──────────────────┐
              │                  │                  │
      ┌───────▼───────┐  ┌───────▼───────┐  ┌──────▼──────┐
      │ app/documents │  │ wizard step-  │  │ Notification│
      │ (vault list   │  │ upload (auto- │  │ Center alert│
      │  + detail +   │  │ fill from     │  │ deep links  │
      │  upload)      │  │ vault)        │  │ (P1)        │
      └───────────────┘  └───────────────┘  └─────────────┘
                                 │
                  ┌──────────────▼──────────────┐
                  │  apiClient (axios)          │
                  │  + SSE pour processing-     │
                  │    status (EventSource RN)  │
                  └─────────────────────────────┘
                                 │
                ┌────────────────▼────────────────┐
                │   Backend /user-documents/*     │
                │   30 endpoints, Firebase storage│
                └─────────────────────────────────┘
```

### 1.2 État backend (audit 2026-04-27)

| Composant | Endpoint | Notes |
|-----------|----------|-------|
| Upload | `POST /upload` (multipart) | 10 MB max, MIME pdf/jpeg/png/webp, dedup SHA-256 silencieux (200 + status:duplicate), auto-archive same type, OWASP magic bytes |
| Bulk upload | `POST /bulk-upload` | Max 5 fichiers, rate 3/5min |
| Check hash | `GET /check-hash/{sha256}` | Pre-upload skip, retourne `{exists, document?}` |
| List | `GET /` (cursor pagination) | Filtres : source, category, status, expiry_status, search. Quota inclus dans réponse |
| Stats | `GET /stats` | Counts par source/expiry, quota_used_bytes |
| Detail | `GET /{id}` | UserDocumentResponse complet avec extraction_data |
| Download URL | `GET /{id}/download` | Firebase signed URL 15 min |
| Thumbnail | `GET /{id}/thumbnail` | Firebase signed URL 15 min ou 404 |
| Processing SSE | `GET /{id}/processing-status` | Stream type=status\|done\|error\|timeout, polls 2s, max 2 min |
| Versions | `GET /{id}/versions` | Historique même document_type |
| Update | `PUT /{id}` | display_name, notes, color_label, category |
| Reclassify | `PUT /{id}/reclassify` | Re-extraction Gemini |
| Archive | `PUT /{id}/archive` | status='archived' |
| Delete soft | `DELETE /{id}` | deleted_at = now |
| Delete hard | `DELETE /{id}/permanent` | DB + Firebase |
| Generated | `GET /generated` | Reçus/certificats plateforme uniquement |
| Readiness all | `GET /readiness` | Tous workflows populaires |
| Readiness 1 | `GET /readiness/{workflow_code}` | `vault_document_id` pour auto-fill |
| For workflow | `GET /for-workflow/{workflow_code}` | Liste docs matching |
| Search | `GET /search?q=` | Full-text, min 2 chars |
| Alerts | `GET /alerts` | Filtres severity/is_read, exclut dismissed |
| Alert read | `PUT /alerts/{id}/read` | |
| Alert dismiss | `PUT /alerts/{id}/dismiss` | |
| Stats | `GET /stats` | UserDocumentStats |
| Bulk action | `POST /bulk-action` | archive/delete/download (1..50 ids) |
| Export start | `POST /export?category=` | Rate 2/5min, retourne export_id |
| Export status | `GET /export/{id}/status` | processing/completed/failed |
| Export download | `GET /export/{id}/download` | Firebase signed URL |
| Use vault wizard | `POST /wizard-sessions/{id}/documents/use-vault` | `{document_code, vault_document_id}` |

### 1.3 État mobile

| Élément | État |
|---------|------|
| `API_ENDPOINTS.userDocuments.*` | ✅ Câblé P0 (~30 endpoints déclarés) |
| `wizardApi.useVaultDocument()` | ✅ Câblé P0 mais jamais appelé |
| Module `modules/vault/` | ❌ Inexistant |
| Écran liste / détail / upload vault | ❌ Inexistant |
| Hooks vault (React Query) | ❌ Inexistant |
| Types `UserDocumentResponse` etc. | ❌ Inexistants en `api-types.ts` (à ajouter) |
| Intégration alerts → Notification Center | ❌ À câbler (mais deep link `documents/[id]` existant en P1) |

### 1.4 Pièges identifiés

| # | Piège | Mitigation |
|---|-------|------------|
| **P1** | `use-vault` payload est `{document_code, vault_document_id}` — pas `document_id` ni `id` | Type Pydantic strict, suivre exactement le schéma OpenAPI |
| **P2** | SSE `text/event-stream` pas natif RN — `fetch` standard ne stream pas | Utiliser `react-native-sse` (lib éprouvée) OU polling REST `GET /{id}` toutes les 2s (plus simple, suffisant car backend lui-même polls) |
| **P3** | Cursor pagination — pas offset | Hook `useInfiniteQuery` (déjà utilisé dans service-requests P2 mobile précédent), `getNextPageParam` lit `next_cursor` |
| **P4** | Quota 100 MB / max file 10 MB — UX critique | Afficher quota dans header liste ; gate upload côté client (size check avant POST) |
| **P5** | Dedup SHA-256 silencieux — réponse upload retourne `status: 'duplicate'` au lieu de `'processing'` | Le hook upload doit gérer les 2 cas : afficher "Document déjà dans le coffre" si duplicate |
| **P6** | MIME whitelist stricte (pdf/jpeg/png/webp) — rejet OWASP magic bytes côté serveur | Réutiliser la whitelist déjà en place dans `wizard-api.previewDocument` (P0). Refuser côté client tout MIME hors liste avant POST |
| **P7** | Auto-archive same type → un nouvel upload archive automatiquement les anciens du même type | UX : prévenir l'utilisateur ("Cet upload va archiver votre ancien DIP") OU lister versions dans le détail (déjà supporté) |
| **P8** | Generated docs ≠ uploaded docs — séparés en `source: 'platform_generated'` | UI doit avoir un onglet "Mes uploads" et "Générés par la plateforme" (filtre `source` côté client OU 2 endpoints différents `/` vs `/generated`) |
| **P9** | Signed URL Firebase 15 min seulement — re-fetch si > 15 min de session | Cache React Query staleTime court (5 min) sur thumbnails/download URLs |
| **P10** | Use-vault depuis wizard → met à jour wizard session → invalider la query wizard | `queryClient.invalidateQueries(['wizard-session', sessionId])` après use-vault |
| **P11** | Permission rate limits (upload 10/min, download 100/hr, export 2/5min) — UI doit gérer 429 | Toast d'erreur explicite + retry exponentiel |

---

## 2. ARCHITECTURE DES CHANGEMENTS

### 2.1 Layout final

```
packages/mobile/
└── src/
    ├── app/
    │   ├── _layout.tsx                    # MODIFIED — register documents stack
    │   ├── (tabs)/
    │   │   ├── _layout.tsx               # MODIFIED — add "Documentos" tab between Requests and Profile
    │   │   └── documents.tsx             # NEW — Vault home (list with filters)
    │   └── documents/
    │       ├── [id].tsx                   # NEW — Document detail screen
    │       ├── upload.tsx                 # NEW — Upload screen (picker + form)
    │       └── readiness/[workflow].tsx   # NEW — Readiness check screen (P4 prep)
    └── modules/
        └── vault/
            ├── types/
            │   └── vault.types.ts         # Re-exports from api-types + custom UI types
            ├── services/
            │   ├── vault-api.ts           # ~30 endpoint wrappers
            │   ├── vault-hash.ts          # SHA-256 client-side computation (expo-crypto)
            │   ├── vault-sse.ts           # Polling-based processing-status (no native SSE)
            │   └── vault-hooks.ts         # All React Query hooks
            └── components/
                ├── document-list-item.tsx
                ├── document-detail-card.tsx
                ├── document-upload-sheet.tsx
                ├── document-empty-state.tsx
                ├── document-quota-bar.tsx
                ├── document-filter-chips.tsx
                ├── document-readiness-banner.tsx
                ├── document-version-list.tsx
                ├── vault-picker-sheet.tsx       # For wizard auto-fill (sheet from step-upload)
                └── alert-list-item.tsx           # Alerts integration
```

### 2.2 Auto-fill wizard depuis vault

Flux dans wizard step-upload (modifier `modules/wizard/components/step-upload.tsx` existant) :

```
[Step Upload — workflow=PASAPORTE_EXPEDICION, document_code='dip']
  ┌─────────────────────────────────────────────────┐
  │  Document à fournir : DIP                        │
  │                                                  │
  │  ┌──────────────┐  ┌──────────────┐              │
  │  │ Choisir       │  │ Depuis le    │  ← bouton si  │
  │  │ depuis        │  │ coffre       │   readiness  │
  │  │ l'appareil    │  │ (3 dispo)    │   .vault_doc │
  │  └──────────────┘  └──────────────┘   _id != null │
  │                                                  │
  │  Si tap "Coffre" → VaultPickerSheet:             │
  │   - List docs du vault filtré par                │
  │     `for-workflow/{code}` ou par document_type   │
  │   - Tap sur item → POST use-vault → success      │
  │   - Wizard session refresh (invalidate query)    │
  └─────────────────────────────────────────────────┘
```

### 2.3 Notification Center vault (P1 integration)

`modules/notifications/hooks/use-notifications.ts` route déjà `document_expiring` → `/documents/[id]` (P1, table TYPE_TO_ROUTE in `deep-link-router.ts`). Aucune modification nécessaire — il suffit que l'écran `/documents/[id]` existe (P2 va le créer).

Le screen `/documents/[id]` doit gérer le cas où la notif arrive avec `entity_id` = vault doc UUID → fetch et afficher.

### 2.4 SSE processing-status — décision architecture

**Option A : `react-native-sse` lib** — vraie SSE, conforme spec.
- Dépendance externe supplémentaire
- Gestion reconnect automatique

**Option B : Polling REST 2s sur `GET /{id}` jusqu'à `extraction_status ∈ {completed, failed}`**
- Pas de dépendance
- Plus simple à implémenter avec React Query (`refetchInterval`)
- Fait exactement ce que le backend SSE lui-même fait en interne (polls la BD toutes les 2s)
- Légèrement moins réactif (peut prendre 2s de plus à voir le state final)

**Décision : Option B**. Le surplus de dépendance ne se justifie pas pour ~2s de latence supplémentaire.

```ts
useQuery({
  queryKey: ['vault-doc', id],
  queryFn: () => vaultApi.getDetail(id),
  refetchInterval: (data) =>
    data?.extraction_status === 'completed' || data?.extraction_status === 'failed'
      ? false
      : 2000,
  refetchIntervalInBackground: false,
});
```

### 2.5 SHA-256 client-side dedup

Avant upload :
1. `expo-crypto.digestStringAsync('SHA-256', file_content)` → hash hex 64 chars
2. `GET /check-hash/{hash}` — si `exists: true` → afficher modale "Déjà dans le coffre, voulez-vous le ré-uploader ?" (rare cas où archived doc serait à réactiver) OU "Document déjà présent" (UX simple) avec lien vers le doc existant
3. Sinon, POST upload

`expo-crypto` est déjà transitive via Expo SDK, vérifier (sinon installer `expo-crypto`).

---

## 3. CHECKLIST ATOMIQUE PHASE 2

### 3.1 Foundations (jour 1 matin)

- [x] **2.1.1** Vérifier installation `expo-crypto` (commit e1fe039e — vault service layer)
- [x] **2.1.2** Étendre `core/api/api-types.ts` : aliases vault (commit e1fe039e)
- [x] **2.1.3** Créer `modules/vault/types/vault.types.ts` (commit e1fe039e — file packages/mobile/src/modules/vault/types/)
- [x] **2.1.4** Créer `modules/vault/services/vault-hash.ts` (commit e1fe039e)
- [x] **2.1.5** `tsc --noEmit` clean (commit e1fe039e)

### 3.2 Service layer + Hooks (jour 1 PM)

- [x] **2.2.1** Créer `modules/vault/services/vault-api.ts` (commit e1fe039e)
- [x] **2.2.2** Hook `useVaultList` (commit e1fe039e — 21 hooks)
- [x] **2.2.3** Hook `useVaultStats` (commit e1fe039e)
- [x] **2.2.4** Hook `useVaultDocument(id)` avec polling SSE-like (commit e1fe039e)
- [x] **2.2.5** Hook `useVaultUpload` (commit e1fe039e)
- [x] **2.2.6** Hook `useVaultDelete` / `useVaultArchive` / `useVaultUpdate` (commit e1fe039e)
- [x] **2.2.7** Hook `useVaultAlerts` + `useMarkAlertRead` + `useDismissAlert` (commit e1fe039e)
- [x] **2.2.8** Hook `useVaultReadiness(workflowCode?)` (commit e1fe039e)
- [x] **2.2.9** Hook `useVaultSearch(query)` (commit e1fe039e)
- [x] **2.2.10** Hook `useVaultGenerated` (commit e1fe039e — also commit 6890c1c6 vault filter chips)
- [x] **2.2.11** Hook `useVaultDownloadUrl(id)` (commit e1fe039e)
- [x] **2.2.12** Hook `useVaultBulkAction` (commit e1fe039e)
- [x] **2.2.13** Hook `useVaultExport` (commit e1fe039e)

### 3.3 UI — composants atomiques (jour 2 matin)

- [x] **2.3.1** `document-list-item.tsx` (commit cf87e020 — file packages/mobile/src/modules/vault/components/document-list-item.tsx)
- [x] **2.3.2** `document-empty-state.tsx` (commit cf87e020)
- [x] **2.3.3** `document-quota-bar.tsx` (commit cf87e020)
- [x] **2.3.4** `document-filter-chips.tsx` (commit cf87e020 + 6890c1c6 tab-aware buckets)
- [x] **2.3.5** `alert-list-item.tsx` (commit cf87e020)

### 3.4 Écrans principaux (jour 2-3)

- [x] **2.4.1** `app/(tabs)/_layout.tsx` MODIFIED (commit cf87e020)
- [x] **2.4.2** `app/documents/index.tsx` Vault home (commit cf87e020 — file packages/mobile/src/app/documents/index.tsx)
- [x] **2.4.3** `app/documents/[id].tsx` Detail (commit cf87e020)
- [x] **2.4.4** `app/documents/upload.tsx` (commit cf87e020)
- [x] **2.4.5** Ajouter `documents` au stack dans `_layout.tsx` racine (commit cf87e020)

### 3.5 Auto-fill wizard depuis vault (jour 3 PM)

- [x] **2.5.1** Créer `vault-picker-sheet.tsx` (commit c731d748 — file packages/mobile/src/modules/vault/components/vault-picker-sheet.tsx) ❌ deferred — see Phase 4 (consolidated in P4)
- [x] **2.5.2** Modifier `modules/wizard/components/step-upload.tsx` (commit 716ca2eb — wizard step-upload "From the vault" auto-fill)
- [x] **2.5.3** Tap "Depuis le coffre" → POST `use-vault` (commit 716ca2eb)
- [x] **2.5.4** Toast "Document du coffre utilisé" + skip vers next step (commit 716ca2eb)
- [x] **2.5.5** Ajouter `readiness-banner.tsx` (commit c731d748 — readiness banner reusable)

### 3.6 Intégration alerts & Notification Center (jour 4 matin)

- [x] **2.6.1** Sous l'onglet "Alertes" de `documents.tsx`, lister les alertes via `useVaultAlerts` (commit cf87e020)
- [x] **2.6.2** Tap alert → mark-as-read + navigate (commit cf87e020)
- [x] **2.6.3** Long-press alert → dismiss (commit cf87e020)
- [ ] **2.6.4** Vérifier que push notif `document_expiring` ouvre `/documents/[id]` ⚠️ unverified — needs re-check (smoke test device)

### 3.7 i18n (jour 4 PM)

- [x] **2.7.1** Ajouter bloc `vault.*` dans 3 langues (commit 5d93c8fb — vault i18n complete es/fr/en)
- [x] **2.7.2** `tsc --noEmit` clean (commit 5d93c8fb)

### 3.8 Tests + auto-critique + commits (jour 5)

- [x] **2.8.1** `tsc --noEmit` clean (commits e1fe039e, cf87e020, 5d93c8fb)
- [x] **2.8.2** ESLint sous seuil 100 warnings (commit a4a65e61 — ESLint cleanup)
- [ ] **2.8.3** Smoke tests staging (curl/auth gate) ⚠️ unverified — needs re-check
- [x] **2.8.4** Auto-critique `MOBILE_USER_PHASE_2_CRITIQUE.md` (commit 2d972945)
- [x] **2.8.5** Commits sémantiques locaux (commits e1fe039e, cf87e020, c731d748, 716ca2eb, d28fa7a0, 5d93c8fb, 2d972945)

---

## 4. CRITÈRES DE VALIDATION (DoD Phase 2)

| # | Critère | Méthode |
|---|---------|---------|
| V1 | Liste vault paginée (cursor) avec filtres fonctionnels | Test device |
| V2 | Upload (camera + gallery + document) avec dedup SHA-256 et quota | Test device |
| V3 | Detail doc avec polling extraction_status, preview, métadonnées, versions | Test device |
| V4 | Auto-fill wizard depuis vault → POST use-vault → wizard session updated | Test device |
| V5 | Alerts visibles, mark-as-read et dismiss fonctionnels | Test device |
| V6 | Push notif `document_expiring` (P1) ouvre bien `/documents/[id]` | Test device |
| V7 | Generated docs séparés, ouverture preview/download | Test device |
| V8 | Readiness banner sur écran wizard sélection workflow | Test device |
| V9 | Quota dépassé (mock 100 MB) → erreur explicite | Test mock |
| V10 | `tsc --noEmit` 0 erreur | CI |
| V11 | ESLint sous 100 warnings | CI |
| V12 | i18n 3 langues complète (es/fr/en) | Code review |
| V13 | Auto-critique écrite | Fichier |
| V14 | Commits locaux groupés sémantiquement | `git log` |
| V15 | Aucune régression P0/P1 (login, requests, push notifs, deep links) | Test device |

---

## 5. RISQUES PHASE 2 & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Tab bar à 6 onglets trop chargée (Home/Services/Requests/Documents/Profile + Chat?) | HAUTE | MOYEN | Décision design : remplacer Chat → Documents si pas Documents tab essentiel ; OU mettre Chat en FAB flottant ; OU 5 tabs principaux + accès Documents via dashboard QuickActions |
| SHA-256 client-side lent sur gros fichiers (10 MB) | MOYENNE | FAIBLE | `expo-crypto.digestStringAsync` natif, < 500ms sur 10 MB |
| Polling 2s du detail doc draine batterie si user reste sur la page | MOYENNE | MOYEN | `refetchIntervalInBackground: false` + désactiver dès `extraction_status` final |
| Firebase signed URL 15 min — user lit un PDF longtemps puis ouvre lien expired | MOYENNE | MOYEN | Re-fetch download URL au tap si `Date.now() > urlFetchedAt + 14*60*1000` |
| Bulk action 50 ids — UI ne supporte pas selection mode | MOYENNE | FAIBLE | V2 — UI bulk select reportée, juste API exposée pour compat future |
| Auto-classify + dedup peut surprendre user (upload "disparait" car archivé silencieusement) | MOYENNE | MOYEN | Toast "Ancien document archivé" en post-upload + visible via Versions UI |
| `react-native-sse` non installé → polling fallback acceptable mais 2s plus lent | FAIBLE | FAIBLE | Décision V1 = polling REST (P2 §2.4) |
| Permission rate limit 429 invisible pour user | MOYENNE | MOYEN | Toast i18n explicite "Trop de requêtes, attendez X minutes" via Axios interceptor |

---

## 6. DÉLÉGATION AGENTS

- **2.1, 2.2** (foundations + service layer) : moi-même, sequentiel
- **2.3, 2.4** (UI) : moi-même (cohérence design natif)
- **2.5** (wizard intégration) : moi-même (touche du code wizard existant, prudence régression P0)
- **2.6** (alerts) : moi-même (touche P1)
- **2.7** (i18n) : moi-même
- **2.8** (smoke tests) : moi-même, automatisable via curl

---

## 7. NEXT — Après Phase 2

Phase 3 : Companies CRUD + Bundle Workflow alignement complet (4-5 jours).
Phase 4 dépend de P2 : Wizard OCR/Gemini complet + Vault integration (3-4 jours).

---

## 8. CHANGELOG

- **2026-04-27 v1.0** : création post-audit backend (Explore agent, 30+ endpoints) + audit mobile direct (zéro module vault, juste useVaultDocument câblé en P0).

---
## Validation rétroactive
- **Date** : 2026-04-29
- **Méthode** : audit code + git log
- **Coches livrées rétroactivement** : 32
- **Items unverified** : 2 (push notif `document_expiring` deep link, smoke tests staging curl)
- **Items deferred Phase 10** : 0
- **Notes** : Module vault complet livré (`packages/mobile/src/modules/vault/` — types/services/components). 21 hooks (commit e1fe039e). Écrans `app/documents/{index,[id],upload}.tsx` (cf87e020). Auto-fill wizard partiellement repris en P4 (vault-picker-sheet existe via commit c731d748). i18n 3 langues complète (5d93c8fb).
