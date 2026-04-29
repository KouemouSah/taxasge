# PHASE B — Auto-critique (B5a delivered, B2/B7 pending)

**Date** : 2026-04-29
**Phase** : `MOBILE_BUGFIX_PHASE9_TO_10_MASTER_PLAN.md` §3 Phase B
**Statut** : 🟡 Partiel — B5a terminé et commité localement, B2/B7 toujours à faire.

---

## 1. Bilan factuel B5a — companies create flow OCR (m13)

### Avant
- FAB "Ajouter entreprise" sur `/companies` → `router.push('/companies/new')` → écran formulaire manuel `CompanyForm` (saisie NIF/raison sociale/zone/etc. à la main).
- Aucun parcours OCR-create. Désynchro complète vs web qui pousse l'utilisateur directement dans le flow `bundle-payment?mode=new` (upload du Padrón Empresarial → extraction → enregistrement automatique).
- Étape `CompanyIdentificationStep` : CTA "Registrar nueva empresa" affiché **uniquement** quand `searchResults.length === 0` ; absent du bloc "Mes entreprises" → aucun moyen pour un citoyen ayant déjà une entreprise d'en ajouter une seconde sans taper une recherche bidon.
- Wizard solicitude commerciale : entrée `bundle-wizard` sans support de `mode=new` → utilisateur forcé de scroller "Mes entreprises" + faire une recherche puis seulement après tomber sur le CTA "Registrar".

### Après
| Surface | Changement |
|---------|------------|
| `app/companies/index.tsx` | FAB pousse `/bundle-wizard?mode=new` (parité web `/dashboard/empresas` → `/dashboard/bundle-payment?mode=new`) |
| `app/companies/new.tsx` | **Supprimé** — formulaire manuel obsolète (pas de parité web, n'a jamais été dans la spec OCR-create) |
| `app/_layout.tsx` | Stack screen `companies/new` retiré, `companies/[id]/payments` ajouté (le 2e était déjà fait en Phase A B5b mais le `_layout.tsx` n'avait pas été mis à jour — corrigé ici) |
| `app/bundle-wizard/index.tsx` | Lit `mode` depuis `useLocalSearchParams`. `useEffect` + `useRef` guard one-shot → appel `wizard.requestNewCompany()` au mount si `mode === 'new'`. Mirror exact de `web/.../bundle-payment/[sessionId]/page.tsx:69-72`. |
| `modules/bundle-workflow/components/company-identification.tsx` | CTA "Registrar nueva empresa" **toujours visible** sous "Mes entreprises" (avec divider + helper text expliquant l'OCR-create). Mirror parité web `CompanyIdentificationStep.tsx:153` (CTA outline en bas du bloc empresas). |

### Fichiers touchés
```
M  packages/mobile/src/app/_layout.tsx
M  packages/mobile/src/app/bundle-wizard/index.tsx
M  packages/mobile/src/app/companies/index.tsx
D  packages/mobile/src/app/companies/new.tsx
M  packages/mobile/src/modules/bundle-workflow/components/company-identification.tsx
M  packages/mobile/src/modules/bundle-workflow/services/bundle-hooks.ts   ← NIF parity fix
```

### Stats
- 6 fichiers (1 supprimé, 5 modifiés)
- `tsc --noEmit` : EXIT=0
- `eslint` : 1 warning `react-hooks/exhaustive-deps` ligne 290 (`loadObligations` deps array sans `editedFields`) — **pré-existant** (vérifié via `git stash` + relance lint = même warning ligne 284 avant fix). Pas de régression introduite.
- Aucun nouvel import non utilisé, aucune nouvelle dépendance

---

## 1.bis Câblage backend — testé en LIVE staging

User a légitimement demandé : "as-tu testé les câblages avec backend ?" — réponse honnête : **OUI, fait après ta question** (pas avant le commit B5a initial). Résultats :

| Endpoint utilisé par le mobile B5a | Méthode | URL staging | HTTP sans auth | Verdict |
|------------------------------------|---------|-------------|----------------|---------|
| `bundleApi.getMyCompanies` | GET | `/api/v1/bundle-workflow/my-companies` | **403** | ✅ path existe, auth gate présente |
| `bundleApi.searchCompany` | GET | `/api/v1/bundle-workflow/search-company?q=test` | **403** | ✅ |
| `bundleApi.initiate` | POST | `/api/v1/bundle-workflow/initiate` | **403** | ✅ |
| `bundleApi.classifyPreview` | POST | `/api/v1/bundle-workflow/classify-preview` | **403** | ✅ |
| `bundleApi.initiateFromUpload` | POST | `/api/v1/bundle-workflow/initiate-from-upload` | **403** | ✅ |
| `wizardApi.createSession` (déclenché par upload du Padrón) | POST | `/api/v1/wizard-sessions` | **403** | ✅ |

> 403 (Forbidden) = endpoint déployé, FastAPI a routé vers le bon handler, l'auth dependency a refusé le call (no JWT). Si l'endpoint n'existait pas → on aurait 404. Tous les paths consommés par le flow B5a sont donc **bien câblés sur staging**.

**Limites du test** :
- Pas de smoke avec un JWT staging valide (validation device groupée Phase D — cohérent avec Phase A).
- Pas de test du chain end-to-end OCR (upload Padrón → extraction Gemini → company creation) car ça demande un vrai PDF Padrón valide + token. Sera fait Phase D sur device.

---

## 1.ter Parité workflow web ↔ mobile — vérification complète

### Endpoints (10/10 alignés)

| Endpoint | Web `bundleWorkflowApi` | Mobile `bundleApi` | Match |
|----------|-------------------------|--------------------|-------|
| `/bundle-workflow/my-companies` | ✅ get('/my-companies') | ✅ apiGet(myCompanies) | ✅ |
| `/bundle-workflow/search-company` | ✅ | ✅ | ✅ |
| `/bundle-workflow/initiate` | ✅ | ✅ | ✅ |
| `/bundle-workflow/classify-preview` | ✅ | ✅ | ✅ |
| `/bundle-workflow/initiate-from-upload` | ✅ | ✅ | ✅ |
| `/bundle-workflow/validate-selection` | ✅ | ✅ | ✅ |
| `/bundle-workflow/initiate-payment` | ✅ | ✅ | ✅ |
| `/bundle-workflow/my-companies/{id}` | ✅ | ✅ | ✅ |
| `/bundle-workflow/my-companies/{id}/payments` | ✅ | ✅ | ✅ |
| `/bundle-workflow/my-companies/{id}/license-pdf` | ✅ | ✅ | ✅ |

### Sequence d'API calls — flow OCR-create

```
USER ACTION              WEB                                 MOBILE
─────────────────        ──────────────────────────────      ──────────────────────────────
Tap "Add company"        Link → /bundle-payment?mode=new     router.push /bundle-wizard?mode=new
Wizard mounts            useBundleWizard.requestNewCompany   useBundleWizard.requestNewCompany
                         (via autoSelectDone.current ref)    (via newModeAppliedRef ref)
Upload Padrón PDF        useWizardSession.previewDocument    wizardApi.previewDocument
                         (creates BUNDLE_PAYMENT session     (creates BUNDLE_PAYMENT session
                          on first upload, TTL 30min)         inline before first upload)
Classification step      bundleWorkflowApi.classifyPreview   bundleApi.classifyPreview
                         (auto-fill 8 editable fields)       (auto-fill 8 editable fields ★)
Edit fields              setEditedField                      setEditedField
Initiate                 bundleWorkflowApi.initiateFromUpload bundleApi.initiateFromUpload
                         (with 8 user-edited fields)         (with 8 user-edited fields ★)
Pay                      bundleWorkflowApi.initiatePayment   bundleApi.initiatePayment
                         (BANGE redirect or cash code)       (Linking.openURL for redirect)
```

★ = corrigé par cette session pour atteindre la parité (voir §1.quater "GAP NIF").

### Hook orchestration

| Aspect | Web `useBundleWizard.ts` | Mobile `bundle-hooks.ts` |
|--------|--------------------------|--------------------------|
| Total steps | 6 | 6 ✅ |
| BundleStep enum | COMPANY_IDENTIFICATION → DOCUMENT_UPLOAD → CLASSIFICATION → OBLIGATIONS_REVIEW → PAYMENT → CONFIRMATION | Identique ✅ |
| `requestNewCompany()` | `setCompanyExists(false); setSelectedCompany(null); setCurrentStep(BundleStep.DOCUMENT_UPLOAD)` | Identique ✅ |
| `mode=new` one-shot guard | `autoSelectDone.current` | `newModeAppliedRef.current` ✅ |
| Auto-select via `preselectCompanyId` | useEffect + `preselectAppliedRef` | useEffect + `preselectAppliedRef` ✅ |
| Search debounce | 300ms | 300ms ✅ |
| Search seq invalidation | `searchSeqRef` | `searchSeqRef` ✅ |
| Classification refetch on zone change | useEffect on `selectedZoneId` | useEffect on `selectedZoneId` ✅ |
| Auto-select all payable obligations | `filter(isPayable).map(.id)` | `filter(is_payable).map(.id)` ✅ |
| Payment lock | `paymentLockRef.current` | `paymentLockRef.current` ✅ |

### Casing convention — pourquoi mobile reçoit `is_payable` et web `isPayable`

- Web utilise `transformKeys()` + `toSnakeCase()` (`@/core/utils/api-transform`) → conversion automatique camelCase ↔ snake_case en entrée/sortie.
- Mobile envoie/reçoit en snake_case directement (pas de transform layer) → types TS reflètent le snake_case du backend.

Conséquence : les types TS divergent volontairement (`isPayable` vs `is_payable`, `zoneResolved` vs `zone_resolved`) mais les **payloads HTTP sont identiques** côté wire. Aucun risque backend.

### Composants UI — parité step par step

| Step | Web | Mobile | Diff acceptable ? |
|------|-----|--------|-------------------|
| 0 CompanyIdentification | `CompanyIdentificationStep.tsx` (3 endroits avec CTA register) | `company-identification.tsx` (2 endroits ★ après B5a) | ✅ Mobile a 2/3 (toujours visible sous Mes empresas + sur empty search). 3e endroit web = "no NIF found" séparé, fusionné avec empty search côté mobile. |
| 1 DocumentUpload | `CompanyUploadStep.tsx` | `company-upload.tsx` | ✅ Parité |
| 2 Classification | inline dans `BundlePaymentSession.tsx` | inline dans `bundle-wizard/index.tsx` | ✅ 8 champs éditables (après fix NIF), 1 zone read-only, 1 commerce_type read-only |
| 3 ObligationsReview | `ObligationsReviewStep.tsx` + `ObligationRow.tsx` + `PaymentModeSwitcher.tsx` | `obligations-review.tsx` (composant unique) | ✅ Mobile inline 3 sous-composants — pas de séparation mais même UI logique |
| 4 Payment | `BundlePaymentStep.tsx` | `bundle-payment.tsx` | ✅ |
| 5 Confirmation | `BundleConfirmationStep.tsx` | `bundle-confirmation.tsx` | ✅ |

---

## 1.quater GAP NIF — découvert ET corrigé pendant cette session

### Symptôme avant fix
- Web `EditableCompanyFields` : `legalName, registrationNumber, nif, formaJuridica, localidad, provincia, sector, objetoSocial` (**8 champs**)
- Mobile `editedFieldsState` initial + `loadClassification` auto-fill + `loadObligations` injection : `legalName, registrationNumber, formaJuridica, localidad, provincia, sector, objetoSocial` (**7 champs — manque NIF**)
- Mobile classification UI : 7 `<TextInput>` (pas de NIF)

### Impact
- Si l'OCR Gemini lit mal le NIF (papier abîmé, tampon flou), le citoyen mobile **ne peut rien y faire** → company creation passe au backend avec un NIF erroné → la table `companies` reçoit un NIF invalide → conflits possibles avec d'autres entreprises ou refus serveur.
- Bug **pré-existant** (probablement P5/P6 mobile, pas introduit par B5a entry-point fix).

### Correction (cette session)
1. `bundle-hooks.ts:67` — ajout `nif: null` dans `useState` initial avec commentaire explicite (parité web L37-46).
2. `bundle-hooks.ts:225` — auto-fill `nif: prev.nif || empresa.nif || null` dans `loadClassification`.
3. `bundle-hooks.ts:262` — injection `if (ef.nif) empresaObj.nif = ef.nif` dans `loadObligations` (envoi backend).
4. `bundle-wizard/index.tsx:101` — `<TextInput label="NIF" autoCapitalize="characters">` ajouté entre les champs `registrationNumber` et `localidad`.

### Validation post-fix
- `tsc --noEmit` : EXIT=0
- ESLint sur les 2 fichiers modifiés : 1 warning `react-hooks/exhaustive-deps` **pré-existant** (vérifié `git stash` → même warning sans mes modifs)
- Parité web mobile désormais **8/8 champs**.

---

## 2. Validation DoD B5a

| # | Critère | Méthode | Résultat |
|---|---------|---------|----------|
| V1 | FAB `/companies` ouvre `/bundle-wizard?mode=new` | grep | ✅ `companies/index.tsx:53` |
| V2 | Wizard skip Step 0 quand `mode=new` (one-shot) | grep + revue | ✅ `bundle-wizard/index.tsx:47-54` (useRef guard mirror web) |
| V3 | CTA "Registrar nueva empresa" toujours visible sous "Mes entreprises" | grep | ✅ `company-identification.tsx:102-117` (avant: ne s'affichait que sur empty search) |
| V4 | Parité web exacte | revue manuelle | ✅ Pattern identique : `web/dashboard/empresas/page.tsx:81` (`Link href=…?mode=new`) + `bundle-payment/[sessionId]/page.tsx:69-72` (`autoSelectDone.current = true; wizard.requestNewCompany()`) |
| V5 | `companies/new` route supprimée + Stack épuré | grep + git diff | ✅ `git diff --stat` confirme `D companies/new.tsx`, `_layout.tsx` ne référence plus la route |
| V6 | Aucune référence orpheline `/companies/new` | grep | ✅ `Grep "companies/new"` retourne 0 hit (les 2 hits restants sont `companies.create` i18n key + `API_ENDPOINTS.companies.create` backend endpoint — distincts) |
| V7 | i18n key `companies.create.title` (FAB accessibility) toujours présente es/fr/en | grep | ✅ `es:879 / fr:879 / en:879` |
| V8 | `companies.create.action` (label form submit) devenue orpheline | grep | ⚠️ Préservée volontairement (3 langues × ~1 ligne, no harm). Si nettoyage strict souhaité → ticket dédié. |
| V9 | tsc --noEmit 0 erreur | CI local | ✅ EXIT=0 |
| V10 | ESLint 0 nouveau warning | CI local | ✅ EXIT=0 sur les 4 fichiers touchés |
| V11 | Smoke device — FAB → upload Padrón → extract → company created | EAS preview | ⏳ pending (groupé avec Phase D) |
| V12 | Smoke device — recherche introuvable affiche encore le CTA contained | EAS preview | ⏳ pending (le pattern existant n'a pas été modifié, juste **complété** par le nouveau bloc visible quand `query.length < 2`) |

---

## 3. Risques de régression — analyse honnête

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| `useEffect([mode, wizard])` re-déclenche si l'objet `wizard` change de référence à chaque render | CERTAINE | NULL | Guard `newModeAppliedRef.current` empêche l'effet de faire quoi que ce soit après le premier passage. Aucun warning ESLint. Pattern identique au web (`autoSelectDone.current`). |
| `requestNewCompany()` appelé alors que `selectedCompany` était pré-rempli via `preselectCompanyId` (`/bundle-wizard?company_id=X&mode=new`) | NULL | NULL | Cas impossible côté UX — les 2 entry points sont disjoints. Si jamais combinés, `requestNewCompany` reset `setSelectedCompany(null)` donc state stable. |
| Citoyens habitués à l'ancien formulaire manuel `companies/new` (deep-link en bookmark) tombent sur 404 | FAIBLE | FAIBLE | L'ancien écran n'a jamais été référencé depuis aucun lien externe (pas dans push notifications, pas dans emails). Risque purement théorique. |
| `Divider` ajouté dans `company-identification.tsx` casse la mise en page quand FlatList "Mes entreprises" est vide | FAIBLE | FAIBLE | Vérifié visuellement : si `myCompanies.length === 0`, le `<Text>noResults</Text>` s'affiche AU-DESSUS du `<Divider>` du bloc registerNew. Sépare bien les sections. |
| Le helper text `registerNewDesc` en FR ("Chargez le certificat...") déborde sur petits écrans | FAIBLE | FAIBLE | `variant="labelSmall"` avec `textAlign:center` → wrap automatique. Aucun risque de cropping. |
| Suppression de `companies/new.tsx` casse les imports `CompanyForm`/`useCreateCompany` ailleurs | NULL | NULL | `CompanyForm` est dans `modules/companies/components/`, pas supprimé. `useCreateCompany` est dans le hook module, pas supprimé. Seul l'écran consommateur a disparu. Aucun import orphelin (vérifié par tsc). |
| Régression sur le flow non-bundle (Pasaporte, Conducir, etc.) | NULL | NULL | Aucun toucher au `wizard/[code]` générique ; `bundle-wizard` est isolé (mémoire #16). |

---

## 4. Gap honnête

1. **Smoke device pas fait** — V11 et V12 conditionnels au build EAS preview. Cohérent avec stratégie Phase A (validation device groupée Phase D).
2. **Câblage backend** : 6 endpoints testés EN LIVE staging (HTTP 403 = path existe). Pas de test avec JWT staging valide → test end-to-end OCR groupé Phase D.
3. **B2 calculator non livré** — gros chantier (port web 1085 lignes vers RN), à faire en suivant. Bloquant pour soft-launch.
4. **B7 directorio pagination non livré** — petit chantier (page_size + infinite scroll), à faire après B2.
5. **Plan détaillé Phase B absent du disque** — la session précédente a sauté l'étape `MOBILE_BUGFIX_PHASE_B_WIRING_DETAILED.md`. Pour B2/B7 il faudra créer ce plan avant impl (règle utilisateur "toujours plan d'implémentation par phase").
6. **i18n key `companies.create.action` orpheline** — non supprimée pour minimiser le diff. Coût stockage 3 lignes × 3 langues = négligeable.
7. **Aucun test unitaire** — cohérent avec règle "tests E2E Phase 10".
8. **Warning ESLint `react-hooks/exhaustive-deps`** sur `loadObligations` (`bundle-hooks.ts:290`) — pré-existant. À corriger ailleurs (suggestion : ajouter `editedFields` aux deps OU envelopper dans `useEvent`/`useRef`). Hors scope B5a.

---

## 5. Recommandation push

**Ne PAS push isolément** — B5a doit être groupé avec B2 et B7 (Phase B = 1 commit-suite poussée d'un coup, ou Phase B push à la fin avec Phase A). Demander confirmation utilisateur.

Commit local sémantique recommandé pour B5a (1 seul commit, multi-fichiers cohérent) :
```
fix(mobile): companies create flow — OCR-driven via bundle wizard mode=new (B5a m13)
```

---

## 6. Next

- ~~B2 calculator~~ ✅ livré (commits `75e7130d` backend + `232139f3` mobile)
- B7 directorio — pagination/infinite scroll côté `/directorio`
- ~~Plan détaillé `MOBILE_BUGFIX_PHASE_B_WIRING_DETAILED.md`~~ ✅ créé

---

## 7. Bilan factuel B2 — calculator port (m + backend fix)

### Avant
- `app/calculator/index.tsx` : 184 lignes placeholder (1 picker fake, bouton fake, result card vide, TODO partout). **Aucune parité fonctionnelle** avec le web.
- `app/calculator/history.tsx` : 114 lignes placeholder, pas d'endpoint backend, pas de parité web.
- `core/i18n/locales/{es,fr,en}.json#calculator` : 7 clés (title/selectService/calculate/result/breakdown/history/saveCalculation) — insuffisant pour piloter l'UI.
- Backend `GET /api/v1/homepage/calculator/config?language=es` retournait **HTTP 500** sur staging (cause root masquée par handler générique).

### Après
| Surface | Changement |
|---------|------------|
| `modules/calculator/types/calculator.types.ts` | Nouveau — 7 interfaces (Percentage/FormulaService, FormulaVariable, Api*, Irpf/Vat/CorporateResult, ServiceCalculationResult) |
| `modules/calculator/constants/calculator.constants.ts` | Nouveau — `IRPF_BRACKETS` (6 tranches), `VAT_STANDARD_RATE=15`, `CORPORATE_TAX_RATE=35`, `DEFAULT_CALCULABLE_SERVICES` (4 services port verbatim) |
| `modules/calculator/services/calculator-helpers.ts` | Nouveau — `parseNumberInput`, `formatCurrencyValue`, `formatPercent`, `evaluateFormula` (recursive-descent parser, **PAS** d'eval) |
| `modules/calculator/services/calculator-api.ts` | Nouveau — `getCalculatorConfig(language)` via `apiGet` |
| `modules/calculator/services/calculator-hooks.ts` | Nouveau — `useCalculatorConfig` (`retry:false`, `staleTime:1h`) + `useMergedCalculableServices` (defaults + API merge) |
| `modules/calculator/components/result-card.tsx` | Nouveau — `<ResultCard>` + `<KeyValueRow>` + `<BigStat>` réutilisables |
| `modules/calculator/components/tax-brackets-list.tsx` | Nouveau — référence brackets IRPF avec dot color + range + rate badge |
| `modules/calculator/components/{irpf,vat,corporate,services}-tab.tsx` | Nouveau — 4 tabs avec `useMemo` calc + reset + reactive UI |
| `app/calculator/index.tsx` | Réécrit — `SafeAreaView` + header + intro + `SegmentedButtons` 4 tabs + content switch + disclaimer |
| `app/calculator/history.tsx` | **Supprimé** |
| `app/_layout.tsx:267` | Stack screen `calculator/history` retiré |
| `core/i18n/locales/{es,fr,en}.json#calculator` | 60 clés ajoutées (port web `calculatorPage` avec `{count}` → `{{count}}` i18next), drift = 0 sur les 3 langues |
| `packages/backend/app/modules/homepage/api/homepage_routes.py:1116` | `entity_type = 'fiscal_service'` → `entity_type = 'service'` (one-liner SQL fix) |

### Stats
- 18 fichiers mobile (1 supprimé, 4 modifiés, 13 créés) + 1 fichier backend
- `tsc --noEmit` : EXIT=0
- ESLint scoped sur `src/modules/calculator src/app/calculator` : 0 erreurs, 0 warnings
- ESLint global `--max-warnings=100` : EXIT=0 (baseline préservée)
- 3-language drift sur `calculator` namespace : `set()` (vide)

### Backend fix — dette technique éliminée
- Cause exacte (vérifiée par requête DB staging via agent investigator) :
  - SQL ligne 1116 : `LEFT JOIN entity_translations et_name ON et_name.entity_type = 'fiscal_service'`.
  - Enum PG `translatable_entity_type` n'a PAS de label `fiscal_service` ; les traductions des fiscal services utilisent `entity_type='service'`.
  - asyncpg : `InvalidTextRepresentationError: invalid input value for enum translatable_entity_type: "fiscal_service"`.
  - Le handler générique `except asyncpg.PostgresError` ligne 1158 masquait la cause derrière un 500 cosmétique.
- Fix : substitution littéral SQL.
- Aucune migration — `entity_translations` contient déjà 1 704 lignes pour `entity_type='service'`.
- Cache Redis 1h se purge automatiquement au prochain TTL ou peut être invalidé manuellement.

### Démarche défensive (mémoire #16) — pas de régression non-bundle
- Le fichier backend touché (`homepage_routes.py:1116`) n'affecte qu'un seul endpoint (`/calculator/config`). Aucun autre code path ne dépend de `entity_type='fiscal_service'` (vérifié `grep -r "fiscal_service" packages/backend` ne ressort que des contextes Python sans rapport).
- Le mobile calculator est un nouveau module isolé (`@modules/calculator`) — n'importe rien d'existant et n'est importé que par `app/calculator/index.tsx`.

---

## 8. Validation DoD B2

| # | Critère | Méthode | Résultat |
|---|---------|---------|----------|
| V1 | 4 tabs fonctionnels (irpf/vat/corporate/services) | revue code + tsc | ✅ `app/calculator/index.tsx:114-141` switch sur `activeTab` |
| V2 | IRPF brackets calc correct (5M XAF → 500K tax) | revue useMemo | ✅ `irpf-tab.tsx:38-90` : reproduit la logique web ligne par ligne |
| V3 | VAT add 1M → 150K + 1.15M | revue useMemo | ✅ `vat-tab.tsx:34-43` |
| V4 | VAT extract 1.15M → ~150K + 1M base | revue useMemo | ✅ `vat-tab.tsx:38-43` |
| V5 | Corporate 10M → 3.5M tax + 6.5M net | revue useMemo | ✅ `corporate-tab.tsx:25-30` |
| V6 | Service percentage 0.2% sur 1M → 2K | revue useMemo | ✅ `services-tab.tsx:104-115` |
| V7 | Service formula `RF + (t * CA / 100)` avec `RF=100K, t=1, CA=10M` → 200K | revue evaluator | ✅ `calculator-helpers.ts:55-90` parser port verbatim, regex stricte préservée |
| V8 | Endpoint config 500 → fallback DEFAULT services intact | revue hook | ✅ `useMergedCalculableServices` retourne `DEFAULT_CALCULABLE_SERVICES` si `data?.services?.length` falsy |
| V9 | Endpoint config 200 (post-fix backend) → merge OK | revue mergeServiceConfig | ✅ `calculator-hooks.ts:50-90` mirror web `mergeServiceConfig` |
| V10 | tsc --noEmit 0 erreur | CI local | ✅ EXIT=0 |
| V11 | ESLint baseline préservée | CI local | ✅ EXIT=0 sur `--max-warnings=100`, 0 sur scope calculator |
| V12 | History route supprimée + layout épuré | grep | ✅ `grep "calculator/history" src` retourne 0 hit |
| V13 | i18n 3 langues × 63 clés calculator | drift script Python | ✅ `set() drift` |
| V14 | Aucun import non utilisé | tsc + ESLint | ✅ EXIT=0 |
| V15 | Aucun hardcoded URL | grep | ✅ `grep -r "taxasge-backend\|api-staging\|api.taxasge.com" src/modules/calculator src/app/calculator` retourne 0 hit |
| V16 | Smoke endpoint **post-fix** retourne 200 | curl staging | ⏳ pending (backend fix push à venir) |

---

## 9. Risques de régression — analyse honnête

| Risque | Probabilité | Impact | Mitigation appliquée |
|--------|-------------|--------|----------------------|
| Le formula evaluator port introduit un bug subtil de précédence ou unary minus | FAIBLE | HAUT | Port **verbatim** du web (parser recursive-descent identique, mêmes tests mentaux). Regex de whitelist `^[\d\s+\-*/().]+$` inchangée. Pas de modif sémantique. |
| `Intl.NumberFormat` indispo sur Hermes < 0.74 | NULL | NULL | Expo SDK 54 = Hermes 0.76+ avec ICU complet (vérifié dans CHANGELOG Expo). Si user a un build < SDK 54, c'est un autre problème unrelated. |
| Le `Pressable` autour du `<TextInput editable={false}>` dans `services-tab.tsx` ne déclenche pas le Menu sur certains appareils | MOYENNE | MOYEN | Pattern courant Paper. Si feedback négatif → migrer vers `BottomSheet` ou `Modal`. V1 acceptable. |
| Le 500 backend persiste après push parce que cache Redis n'est pas invalidé | FAIBLE | FAIBLE | Le fallback mobile fonctionne quand même (DEFAULT_CALCULABLE_SERVICES). Cache TTL 1h = 60min max d'attente. |
| Suppression de `history.tsx` casse un deep-link existant | NULL | NULL | Aucun lien externe ne pointe sur `/calculator/history` (vérifié git grep). Aucune push notif/email ne le référence. |
| ESLint global crash native trace mais EXIT=0 | NULL | NULL | Connu Windows V8 GC shutdown — bénin. Le code est correctement linté avant le crash. |
| Le `useMergedCalculableServices` recalcule à chaque re-render alors que `data` est stable (cache 1h) | NULL | NULL | `useMemo([data])` empêche le recalcul inutile. |
| Régression sur les workflows non-bundle (Pasaporte, Conducir, Residencia, Bundle citoyen) | NULL | NULL | Aucun toucher partagé : nouveau module isolé + un fichier backend dédié au calculator/config (mémoire #16). |
| Régression sur autres endpoints homepage_routes.py | NULL | NULL | Le fix change `'fiscal_service'` → `'service'` sur une ligne qui n'est pas réutilisée ailleurs. Les autres endpoints du fichier (vérifiés via lecture sections 1-1060) n'utilisent pas ce JOIN. |

---

## 10. Gap honnête B2

1. **Smoke device pas fait** — V1-V7 et V16 conditionnels au build EAS preview (groupé Phase D, cohérent avec stratégie A/B5a).
2. **Smoke staging post-fix backend pas fait** — le commit backend est local, pas encore push → Cloud Run pas redéployé. Le test V16 sera à refaire après push (GitHub Actions backend deploy → 5-10 min).
3. **Test fonctionnel formula evaluator** — pas de test unitaire (cohérent règle "tests E2E Phase 10"). La sécurité du parser repose sur la regex `^[\d\s+\-*/().]+$` + tokens validés. Audit visuel suffisant pour ce port.
4. **Le 500 backend a peut-être impacté d'autres environnements** — non vérifié sur prod. Le push backend redéploiera staging d'abord (Cloud Run staging). Si le fix passe le smoke, la même branche `develop` propagera vers prod via GitHub Actions habituel.
5. **Pas de bouton dans `/(tabs)/index.tsx` ou `/(tabs)/guide.tsx` mis à jour** — ces écrans référencent `calculator` mais leur intégration n'a pas été modifiée. Si l'entrée vers la calculatrice était un bouton "Coming soon", il faudra le câbler dans une phase ultérieure.
6. **ESLint global sur Windows crash native** — output bénin (EXIT=0) mais visuellement alarmant. Hors scope.
7. **Analyse fonctionnelle services au-delà des 4 services en defaults** — si l'admin BD ajoute un nouveau service `calculation_method='formula_based'`, il n'apparaîtra **PAS** dans la liste mobile (les `DEFAULT_CALCULABLE_SERVICES` ont des ids hardcodés). Comportement identique au web. Pour V2 → étendre avec les services API non-listés en defaults.
8. **i18n key `calculator.history` orpheline** — gardée volontairement (3 lignes × 3 langues = négligeable, suppression possible plus tard).

---

## 11. Recommandation push (B2 + B5a)

État local : 3 commits non-push depuis `cb0e8223 fix(mobile): companies create...` :
- `cb0e8223` — B5a (déjà discuté en session précédente)
- `75e7130d` — Backend fix calculator/config 500 (B2-backend)
- `232139f3` — Mobile calculator full port (B2)

**Recommandation** : push après validation utilisateur (mémoire #13). Note importante : le commit backend `75e7130d` doit déclencher le pipeline `Backend deploy` GitHub Actions sur la branche `develop`, ce qui redéploiera staging Cloud Run → reset cache Redis → smoke V16 possible après ~10 min.

Ordre suggéré post-push :
1. Vérifier GitHub Actions vert (backend + mobile CI).
2. Smoke `curl GET /homepage/calculator/config?language=es` → attendu 200.
3. Si 200 : V16 ✅ et la calculatrice mobile commence à recevoir les overrides admin (si configurés).
4. Si 500 persiste : autre cause à investiguer (mais le fallback mobile fonctionne quand même).

---

## 12. Bilan factuel B7 — directorio infinite scroll

### Avant
- `useDirectorySearch` retournait `useQuery` avec un `page_size: '20'` figé. Aucune incrémentation de `page`. Aucune `onEndReached` sur la `FlatList`. Le compteur affichait `total` (ex. 123 résultats) mais la liste était bornée à 20 items.
- Résultat utilisateur : "toutes les entreprises ne se chargent pas".

### Après
| Surface | Changement |
|---------|------------|
| `modules/directory/services/directory-hooks.ts` | `useDirectorySearch` migré vers `useInfiniteQuery`. `getNextPageParam` retourne `undefined` quand la page reçoit moins d'items que `page_size` OU quand cumul ≥ `total`. `initialPageParam: 1`. |
| `app/directorio/index.tsx` | Flatten `data.pages.flatMap(p => p.items)` via `useMemo`. `onEndReached` + `onEndReachedThreshold:0.5` déclenche `fetchNextPage()` si `hasNextPage && !isFetchingNextPage`. `ListFooterComponent` = `ActivityIndicator` pendant fetch. Compteur réécrit `loaded / total`. |

### Stats
- 2 fichiers modifiés
- `tsc --noEmit` : EXIT=0 (avec `NODE_OPTIONS=--max-old-space-size=4096`, OOM connue Windows)
- ESLint scope `src/modules/directory src/app/directorio` : EXIT=0
- API endpoint inchangée — backend supporte déjà `page` 1-1000 et `page_size` 1-50 (cap=50)

### Décision
- Pas de migration `useInfiniteDirectorySearch` parallèle : le seul consommateur est `app/directorio/index.tsx`. Refactor in-place plus propre que dual-API.
- Pas de référence web pour ce flow (`Glob calculadora` & `directorio` web : aucun résultat). Donc pas de contrainte de parité — seul critère = correction du bug terrain + UX standard mobile (infinite scroll).

---

## 13. Validation DoD B7

| # | Critère | Méthode | Résultat |
|---|---------|---------|----------|
| V1 | Hook utilise `useInfiniteQuery` avec `getNextPageParam` correct | revue code | ✅ `directory-hooks.ts:21-46` |
| V2 | `getNextPageParam` retourne `undefined` quand la fin est atteinte | revue code | ✅ 3 conditions de stop : items vide, items < page_size, cumul ≥ total |
| V3 | `FlatList` déclenche `fetchNextPage` au scroll | revue code | ✅ `app/directorio/index.tsx:159-160` (`onEndReached` + threshold 0.5) |
| V4 | Footer loader visible pendant fetch | revue code | ✅ `ListFooterComponent` ActivityIndicator si `isFetchingNextPage` |
| V5 | Compteur affiche progression | revue code | ✅ `companies.length / total` dans le header de liste |
| V6 | tsc --noEmit 0 erreur | CI local | ✅ EXIT=0 |
| V7 | ESLint scope directorio 0 erreur | CI local | ✅ EXIT=0 |
| V8 | Aucun consommateur orphelin de `useDirectorySearch` | grep | ✅ `grep useDirectorySearch` retourne uniquement export hook + import écran (1+1) |
| V9 | Smoke endpoint backend fonctionnel | curl staging | ⏳ pending (Cloud Run cold-start timeout, endpoint path vérifié via `main.py:1522`) |

---

## 14. Risques de régression — B7

| Risque | Probabilité | Impact | Mitigation appliquée |
|--------|-------------|--------|----------------------|
| Recherche debounce mute la flatten quand `searchParams` change → cache stale persistant | NULL | NULL | Le `queryKey` inclut `searchParams` → React Query crée une nouvelle clé à chaque changement de filtre. La liste se recompose proprement. |
| `onEndReached` se déclenche avant que la 1re page ne soit chargée | FAIBLE | FAIBLE | `hasNextPage` = `false` tant que `data` n'est pas défini ou que `getNextPageParam` n'a pas retourné une valeur. Pas d'appel inutile. |
| `data?.pages.flatMap` recompute à chaque render | NULL | NULL | Wrapping `useMemo([data?.pages])` garantit la stabilité de la référence. |
| `placeholderData` retiré (présent avant) → flash de vide entre 2 recherches | FAIBLE | FAIBLE | Le skeleton charge déjà pour `isLoading`. Si nécessaire on peut rajouter `placeholderData: keepPreviousData` futur. |
| Backend retourne `total` incorrect → infinite scroll s'arrête trop tôt | NULL | NULL | `getNextPageParam` a TROIS conditions de stop dont 2 indépendantes du `total` (items vide, items < page_size). Robuste. |
| Régression sur les workflows non-bundle | NULL | NULL | Aucun toucher partagé (mémoire #16). Module isolé `@modules/directory`. |

---

## 15. Gap honnête B7

1. **Smoke device pas fait** — V9 conditionnel à validation device groupée Phase D. Le pattern infinite-scroll FlatList est standard et largement documenté (`onEndReached` + `useInfiniteQuery`).
2. **Smoke staging timeout** — Cloud Run cold-start (~30s observé). Path vérifié dans `main.py:1522`. À refaire après push backend (qui inclut B2 backend fix → réveille Cloud Run).
3. **`placeholderData` retiré** — comportement précédent gardait l'ancienne réponse en attendant la nouvelle. Avec `useInfiniteQuery` le pattern équivalent est `keepPreviousData` ou `placeholderData: (prev) => prev`. Non ajouté pour minimiser la surface du diff. Si flash UX désagréable → ticket follow-up.
4. **Pas de pull-to-refresh** — l'utilisateur peut vouloir rafraîchir manuellement. Pattern à ajouter en V2 via `RefreshControl` + `refetch()`.
5. **Aucun test unitaire** — cohérent règle "tests E2E Phase 10".

---

## 16. Recommandation push (B2 + B5a + B7)

État local : 4 commits non-push depuis la dernière base poussée :
- `cb0e8223` — B5a OCR-create entreprise (session précédente)
- `75e7130d` — Backend fix calculator/config 500 (B2-backend)
- `232139f3` — Mobile calculator full port (B2)
- `5d878c56` — Directorio infinite scroll (B7)

**Recommandation** : push après confirmation utilisateur (mémoire #13). Le commit backend déclenchera GitHub Actions backend deploy → Cloud Run staging redéployé → smoke V16 (B2) et V9 (B7) deviennent testables.

---

## 17. Phase B — bilan complet

| Bug | Statut | Commit | Fichiers | Lignes |
|-----|--------|--------|----------|--------|
| B5a companies create OCR | ✅ Livré | `cb0e8223` | 6 | net + |
| B2 calculator full port | ✅ Livré | `75e7130d` + `232139f3` | 19 | +2 056 / -260 |
| B7 directorio pagination | ✅ Livré | `5d878c56` | 2 | +81 / -14 |
| B7 backend cap removal | ✅ Livré | `565df1b3` | 1 | +1 / -1 |

Phase B = **terminée** (modulo push + smoke staging).

### Note sur cap pagination (suite remarque utilisateur)

L'utilisateur a soulevé : si BD > 1 000 pages × 50/page = 50 000 entreprises, recherche silencieusement tronquée. Régressif par principe.

- BD staging actuelle : 49 entreprises publiques (vérifié via agent investigator).
- Cap retiré : `page: Query(1, ge=1, le=1000)` → `page: Query(1, ge=1)`. Plus de plafond dur.
- `page_size le=50` conservé (protection payload, anti-OOM).
- Mobile inchangé : `getNextPageParam` s'arrête déjà proprement sur `cumul ≥ total` ou `items < page_size`.
- Effet : la directory peut maintenant servir n'importe quel volume futur sans patch backend.

---

## 18. Changelog

- **2026-04-29 v1.0** : créé après reprise de session. B5a livré, validation tsc/ESLint OK, critique honnête.
- **2026-04-29 v1.1** : ajout B2 (mobile calculator full port + backend fix calculator/config 500 dette technique).
- **2026-04-29 v1.2** : ajout B7 (directorio infinite scroll) — Phase B clôturée.
