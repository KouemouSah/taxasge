# PHASE 3 — Companies CRUD + Bundle Workflow alignement (DETAILED PLAN)

**Date** : 2026-04-27
**Phase parent** : `MOBILE_USER_MIGRATION_MASTER_PLAN.md`
**Durée estimée** : 4-5 jours
**Bloquant pour suite** : Non (mais utile pour P5 paiements + P7 batch business)
**Pré-requis** : Phase 0 ✅ + Phase 1 ✅ + Phase 2 ✅

---

## 1. CONTEXTE & STRATÉGIE

Cette phase équipe l'app mobile d'un module **Companies** complet (CRUD + members) pour les utilisateurs business, et **aligne** le module bundle-workflow existant avec les endpoints `my-companies/*` exposés en P0.

> **Règle d'or P3** : 0 endpoint backend à créer. Tous les endpoints citoyen+business sont production-ready (audit Explore agent confirmé 2026-04-27). Le travail est purement mobile.

### 1.1 État backend (audit confirmé)

| Domaine | Endpoints | Status |
|---------|-----------|--------|
| Companies CRUD | GET/POST `/companies`, GET/PUT/DELETE `/companies/{id}` | ✅ |
| Members | GET/POST `/companies/{id}/members`, PUT `/{userId}/role`, DELETE | ✅ Synchrone (pas d'invitation par mail) |
| Public Directory | search/zones/sectors/provincias/ciudades/formas-juridicas | ✅ Rate-limited 100/min |
| Bundle Workflow (10) | my-companies, my-company/detail/payments/license-pdf, search-company, initiate, classify-preview, initiate-from-upload, validate-selection, initiate-payment | ✅ Avec rate limits 10-20/min user, 30-60/min IP |

### 1.2 État mobile

| Élément | État |
|---------|------|
| `API_ENDPOINTS.companies.*` (CRUD + members) | ✅ Câblé P0, JAMAIS appelé |
| `API_ENDPOINTS.publicCompanies.*` | ✅ Câblé P0, consommé par `directory-api.ts` |
| `API_ENDPOINTS.bundleWorkflow.*` (10) | ✅ Câblé P0, consommé par `bundle-api.ts` |
| Module `modules/bundle-workflow/` | ✅ EXISTANT (~10 fichiers : 6 components + bundle-api + bundle-hooks + types) |
| Module `modules/directory/` | ✅ EXISTANT (annuaire public) |
| Module `modules/companies/` | ❌ **INEXISTANT — à créer** |
| Écran "Mes Empresas" | ❌ Inexistant |
| `getMyCompanyDetail` retourne `unknown` | ⚠️ Type vague — à raffiner |
| `getMyCompanyLicensePdfPath` retourne juste un path | ⚠️ Pas de hook React Query qui le téléchargerait directement |

### 1.3 Pièges identifiés

| # | Piège | Mitigation |
|---|-------|------------|
| **P1** | `AddMemberRequest.member_user_id` exige un user_id (UUID), pas un email. Le backend ne fait pas d'invitation par mail. UX : comment l'utilisateur trouve l'user_id du membre à inviter ? | V1 = champ libre `user_id` (avancé). V2 (post-P3) = endpoint backend `/users/lookup-by-email` à créer. **Pour V1, documenter clairement dans l'UI** : "Demandez à votre collaborateur son ID utilisateur." |
| **P2** | `CompanyMemberRole` enum 4 valeurs (`company_owner`, `company_admin`, `company_accountant`, `company_member`). L'UI doit traduire correctement et empêcher de définir `company_owner` dans une mutation (le owner est implicite, set au create) | Hardcoder l'enum côté front + valider que `company_owner` n'est pas exposé dans le picker de rôle |
| **P3** | DELETE `/companies/{id}` est un **hard delete** (CASCADE sur user_company_roles). Pas de retour arrière | UI confirmation modale avec input "type COMPANY_NAME pour confirmer" + warning explicite "Action irréversible" |
| **P4** | Liste `/companies` paginée par `page`/`page_size` (offset, NOT cursor — différent du vault) | useInfiniteQuery avec `getNextPageParam: (last, all) => last.page + 1 si total > all.flat().length` |
| **P5** | Bundle license PDF endpoint retourne un **stream PDF**, pas un signed URL — pas de cache HTTP côté React Query | Hook `useDownloadLicensePdf(companyId)` qui ne cache PAS, mais qui télécharge via `expo-file-system` puis ouvre via `Linking.openURL` ou expo-sharing. Pattern différent du vault detail (qui a un signed URL Firebase) |
| **P6** | `/bundle-workflow/my-companies` retourne max 5 companies sorted by pending obligations. Si user a >5 companies, certains ne seront pas visibles dans le bundle workflow | Documenter limitation V1. Pour vue "Mes Empresas" exhaustive, utiliser `/companies` (CRUD list, paginé) |
| **P7** | `/bundle-workflow/initiate-payment` payment_method `mobile_money` exige phone_number GE (regex `^\+?240?\d{9}$`) | Composant phone input avec mask GE + validation Zod |
| **P8** | Auto-classification post-create est non-bloquante mais peut changer `regimen_fiscal` après quelques secondes. UI doit savoir refresh | Post-mutation `create`, invalidate la query detail + show toast "Classification en cours…" |
| **P9** | Type `getMyCompanyDetail` returns `unknown` aujourd'hui. Backend retourne `{company, license, obligations, inspections, fiscal_year}` | Créer alias TS dédié dans `vault.types.ts` ou `bundle-workflow/types/index.ts` |
| **P10** | Member email/name visible côté mobile : backend `CompanyMember` inclut `user_email`, `user_name` (lookup serveur). Pas besoin d'un appel `/users/{id}` séparé | Réutiliser `Schemas['CompanyMember']` directement |

---

## 2. ARCHITECTURE DES CHANGEMENTS

### 2.1 Layout final

```
packages/mobile/
└── src/
    ├── app/
    │   ├── _layout.tsx                # MODIFIED — register companies stack
    │   ├── (tabs)/
    │   │   └── index.tsx              # MODIFIED — QuickAction "Mis Empresas"
    │   └── companies/
    │       ├── index.tsx              # NEW — list "Mis Empresas"
    │       ├── [id].tsx               # NEW — detail (info + members + payments + license PDF)
    │       ├── new.tsx                # NEW — create form
    │       ├── [id]/edit.tsx          # NEW — edit form
    │       └── [id]/members.tsx       # NEW — members management
    └── modules/
        ├── companies/                 # NEW
        │   ├── types/
        │   │   └── companies.types.ts # Re-exports + UI types
        │   ├── services/
        │   │   ├── companies-api.ts   # ~10 endpoint wrappers
        │   │   ├── companies-hooks.ts # React Query hooks
        │   │   └── company-pdf.ts     # downloadLicensePdf (file-system + sharing)
        │   ├── components/
        │   │   ├── company-card.tsx
        │   │   ├── company-empty-state.tsx
        │   │   ├── company-form.tsx          # Shared by create + edit
        │   │   ├── company-delete-dialog.tsx # "Type COMPANY_NAME" confirm
        │   │   ├── member-list-item.tsx
        │   │   ├── member-role-picker.tsx    # 3 roles (owner exclu)
        │   │   └── add-member-sheet.tsx
        │   └── index.ts
        └── bundle-workflow/           # MODIFIED
            ├── services/bundle-api.ts # Refine `getMyCompanyDetail` return type
            ├── services/bundle-hooks.ts # MODIFIED — useDownloadLicensePdf
            └── types/index.ts         # MODIFIED — add CompanyDetailResponse alias
```

### 2.2 Pas de tab Companies

Cohérent avec P2 vault — la tab bar reste à 5 tabs Android natifs. Accès via :
- **QuickAction** dashboard ("Mis Empresas") qui navigue vers `/companies`
- **Deep links** future via `facil://companies/:id` (déjà supporté par P1 deep-link-router à condition de l'ajouter à TYPE_TO_ROUTE — petit ajout)

### 2.3 Bundle workflow alignement

Le module `bundle-workflow` existant continue de marcher (P0 a déjà aligné les paths). Refinements P3 :
- Type `getMyCompanyDetail` cesse de retourner `unknown` → typed alias
- Hook `useDownloadLicensePdf` qui télécharge le PDF stream et l'ouvre via `expo-sharing`
- Lien depuis `app/companies/[id].tsx` vers le license PDF (cas où company a un bundle license actif)

### 2.4 Téléchargement PDF (license bundle)

Pattern différent du vault (signed URL Firebase) car le backend stream le PDF directement.

```ts
// modules/companies/services/company-pdf.ts
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export async function downloadLicensePdf(
  companyId: string,
  language = 'es',
): Promise<void> {
  const url = `${appConfig.api.baseUrl}/api/v1/bundle-workflow/my-companies/${companyId}/license-pdf?language=${language}`;
  const localUri = `${FileSystem.cacheDirectory}license-${companyId}.pdf`;
  // FileSystem.downloadAsync sends the JWT via Axios interceptor? NO — separate call.
  // Need to manually attach Bearer token from auth-storage.
  const token = await getAccessToken();
  await FileSystem.downloadAsync(url, localUri, {
    headers: { Authorization: `Bearer ${token}` },
  });
  await Sharing.shareAsync(localUri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
  });
}
```

---

## 3. CHECKLIST ATOMIQUE PHASE 3

### 3.1 Foundations (jour 1 matin)

- [ ] **3.1.1** Étendre `core/api/api-types.ts` : ajouter aliases `CompanyCreate`, `CompanyUpdate`, `CompanyResponse`, `CompanyListResponse`, `CompanyMember`, `CompanyMemberRole`, `AddMemberRequest`, `UpdateMemberRoleRequest`, `CompanySearchResult`, `CompanyInfo`
- [ ] **3.1.2** Créer `modules/companies/types/companies.types.ts` (re-exports + types UI : `CompanyFormValues` for RHF, `MemberRoleOption`)
- [ ] **3.1.3** Vérifier `expo-sharing` installé (sinon `npm install expo-sharing --legacy-peer-deps`)
- [ ] **3.1.4** `tsc --noEmit` clean

### 3.2 Service layer + Hooks (jour 1 PM)

- [ ] **3.2.1** Créer `modules/companies/services/companies-api.ts` — wrappers pour 10 endpoints
- [ ] **3.2.2** Créer `modules/companies/services/company-pdf.ts` — download + share via expo-sharing
- [ ] **3.2.3** Hook `useCompaniesList` (useInfiniteQuery offset pagination)
- [ ] **3.2.4** Hook `useCompanyDetail(id)` (useQuery)
- [ ] **3.2.5** Hooks `useCreateCompany`, `useUpdateCompany`, `useDeleteCompany` (mutations + invalidate)
- [ ] **3.2.6** Hooks `useCompanyMembers`, `useAddMember`, `useUpdateMemberRole`, `useRemoveMember` (mutations + invalidate)
- [ ] **3.2.7** Hook `useDownloadLicensePdf` (mutation côté UI)
- [ ] **3.2.8** Refine `bundle-workflow/services/bundle-api.ts` : remplacer `getMyCompanyDetail(): Promise<unknown>` par type proper

### 3.3 UI — composants atomiques (jour 2 matin)

- [ ] **3.3.1** `company-card.tsx` — list item avec legal_name, tax_id, member_count, license badge si bundle actif
- [ ] **3.3.2** `company-empty-state.tsx` — illustration + CTA "Crear empresa"
- [ ] **3.3.3** `company-form.tsx` — RHF + Zod form partagé entre create/edit (legal_name, tax_id, representante_legal, regimen_fiscal, sector, forma_juridica, zone, address, etc.)
- [ ] **3.3.4** `company-delete-dialog.tsx` — confirmation modale type-name-to-confirm
- [ ] **3.3.5** `member-list-item.tsx` — avatar (initials) + email + role chip
- [ ] **3.3.6** `member-role-picker.tsx` — radio buttons 3 roles (admin / accountant / member, owner exclu)
- [ ] **3.3.7** `add-member-sheet.tsx` — bottom sheet avec input user_id + role picker + helper text "Demandez l'ID à votre collaborateur"

### 3.4 Écrans principaux (jour 2-3)

- [ ] **3.4.1** `app/companies/index.tsx` — liste paginée avec FAB "+" → `/companies/new`
- [ ] **3.4.2** `app/companies/[id].tsx` — detail avec sections : info, members (preview 3 + lien vers `/companies/[id]/members`), payments (lien vers `/companies/[id]/payments` si on l'expose, sinon dashboard payments filtré), bouton "Télécharger licencia PDF" si bundle license active
- [ ] **3.4.3** `app/companies/new.tsx` — form RHF, sur success → invalidate list + navigate vers detail
- [ ] **3.4.4** `app/companies/[id]/edit.tsx` — form RHF pre-populated, sur success → invalidate detail + back
- [ ] **3.4.5** `app/companies/[id]/members.tsx` — liste members + FAB "Ajouter" → AddMemberSheet, swipe-to-delete sur chaque row, tap → bottom sheet "Modifier le rôle"

### 3.5 Intégration dashboard + deep links (jour 3 PM)

- [ ] **3.5.1** `modules/dashboard/components/quick-actions.tsx` MODIFIED : ajouter "Mis Empresas" (5e action)
- [ ] **3.5.2** Si la grid 5 boutons casse l'UX (icones trop petits), basculer en 2x2 + 1 (4 lignes ou wrap)
- [ ] **3.5.3** `core/notifications/deep-link-router.ts` MODIFIED : ajouter route `companies` → `/companies/:entity_id`

### 3.6 i18n (jour 3 PM)

- [ ] **3.6.1** Ajouter bloc `companies.*` dans 3 langues : title, list.empty, list.cta, detail.sections.{info,members,payments,license}, form.{fields,validation}, members.{title,roles,add,addHelp}, delete.{title,body,confirm,placeholder}, errors.*
- [ ] **3.6.2** `dashboard.quickActions.myCompanies` dans 3 langues

### 3.7 Validation post-P3 (jour 4 — checklist mémoire #35)

- [ ] **3.7.1** `tsc --noEmit` 0 erreur
- [ ] **3.7.2** ESLint sous 100 warnings
- [ ] **3.7.3** Grep paths hardcodés hors endpoints.ts → vide ou commentaires only
- [ ] **3.7.4** Smoke tests staging :
  - GET `/companies?page=1` → 403
  - POST `/companies` → 403
  - GET `/companies/{fake}/members` → 403
  - GET `/bundle-workflow/my-companies/{fake}/license-pdf` → 403
  - GET `/public/companies/zones` → 200 (public)
- [ ] **3.7.5** Vérifier imports/exports `@modules/companies` cohérents
- [ ] **3.7.6** Aucune régression sur `bundle-workflow` ni `directory`
- [ ] **3.7.7** Auto-critique `.claude/plans/MOBILE_USER_PHASE_3_CRITIQUE.md`
- [ ] **3.7.8** Commits sémantiques locaux groupés

---

## 4. CRITÈRES DE VALIDATION (DoD Phase 3)

| # | Critère | Méthode |
|---|---------|---------|
| V1 | Liste companies paginée (offset) avec pull-to-refresh | Test device |
| V2 | Create company → success → detail visible + apparaît dans la liste | Test device |
| V3 | Update company → champs persistés | Test device |
| V4 | Delete company avec confirmation type-name-to-confirm → company disparait + list invalidée | Test device |
| V5 | Add member (user_id valide) → apparaît dans la liste members | Test device |
| V6 | Update member role → role mis à jour | Test device |
| V7 | Remove member → member disparait | Test device |
| V8 | Download license PDF → ouverture dans viewer natif via expo-sharing | Test device |
| V9 | Bundle workflow continue de marcher (régression P0+P2 zéro) | Test device |
| V10 | `tsc --noEmit` 0 erreur | CI |
| V11 | ESLint sous 100 warnings | CI |
| V12 | Grep paths hardcodés hors endpoints.ts vide | CI |
| V13 | Smoke tests staging 5/5 (4 auth + 1 public) | curl |
| V14 | i18n 3 langues complète | Code review |
| V15 | Auto-critique écrite | Fichier |
| V16 | Commits locaux groupés sémantiquement | `git log` |

---

## 5. RISQUES PHASE 3 & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Add member sans email lookup → UX terrible | HAUTE | MOYEN | V1 documenté + planifier endpoint backend `/users/lookup` en post-P3. Documenter clairement dans l'UI |
| QuickAction dashboard ajoute 5e icône → row casse | MOYENNE | FAIBLE | Test visuel, fallback wrap 2-row si nécessaire |
| Auto-classification change `regimen_fiscal` après create → user voit le formulaire qu'il vient de remplir avec une valeur différente | MOYENNE | MOYEN | Refetch detail après 3s, toast "Clasificación en curso…" |
| License PDF download échoue (file-system + auth header) | MOYENNE | MOYEN | Try/catch + toast i18n explicit. Logging dev pour diag |
| Hard delete sans soft-delete = perte irréversible | HAUTE | HAUT | Confirmation type-name + warning + log côté audit (backend gère déjà) |
| Régression bundle-workflow si on touche bundle-api.ts | FAIBLE | HAUT | Modifs minimales (refine type uniquement), tests existants intacts, smoke tests post-P3 |
| Rate limit 100/min public dir + 20/min bundle initiate → user spam clic = 429 | FAIBLE | FAIBLE | Toast i18n `errors.rate_limit` + disable button after click |

---

## 6. NEXT — Après Phase 3

P4 = Wizard OCR/Gemini complet + Vault integration (3-4 jours, inclut le wizard auto-fill reporté de P2).
P5 = Payments end-to-end avec BANGE deep links (4-5 jours).

---

## 7. CHANGELOG

- **2026-04-27 v1.0** : création post-audit backend (Explore agent — 30+ schemas confirmés) + audit mobile (modules bundle-workflow et directory existants, modules/companies absent).
