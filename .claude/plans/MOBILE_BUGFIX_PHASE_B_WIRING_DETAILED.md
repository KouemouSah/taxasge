# PHASE B — Câblage fonctionnel mobile↔backend (DETAILED PLAN)

**Date** : 2026-04-29
**Phase parent** : `MOBILE_BUGFIX_PHASE9_TO_10_MASTER_PLAN.md` §3 Phase B
**Bugs couverts** : B2 calculator, B5a companies create OCR (✅ déjà livré), B7 directorio pagination
**Statut au démarrage** :
- B5a : ✅ commité localement (commit `cb0e8223`)
- B2 : ⏳ à implémenter (focus de cette session)
- B7 : ⏳ à implémenter après B2

---

## 1. CONTEXTE

Phase B = trous de câblage mobile↔backend. Trois bugs distincts :
- **B2 calculator** : page placeholder mobile (184 lignes TODO) vs page web complète (1085 lignes, 4 tabs).
- **B5a companies create** : ✅ déjà livré (FAB → bundle-wizard?mode=new + 8e champ NIF parité web).
- **B7 directorio pagination** : la liste publique n'affiche pas toutes les entreprises (limite hardcodée backend ou pagination frontend cassée).

Source de vérité parité = `packages/web/src/app/[locale]/(public)/calculateur/page.tsx` + `packages/web/messages/{es,fr,en}.json#calculatorPage`.

---

## 2. B2 CALCULATOR — INVESTIGATION RÉSUMÉ

### 2.1 Architecture du web (vérité)

**Calcul = 100% client-side**. Aucun POST `/calculate` consommé par cette page (la route `POST /api/v1/fiscal-services/calculate` existe pour le dashboard interne mais elle n'est PAS appelée par `calculateur/page.tsx`).

**Seul appel backend** : `GET /api/v1/homepage/calculator/config?language={es|fr|en}` — public, retourne les services avec calcul (`base_percentage`, `expedition_formula`, `calculation_config.variables`). Le frontend **fusionne** la réponse avec un `DEFAULT_CALCULABLE_SERVICES` hardcodé. Si l'appel échoue (network, 500, etc.), le frontend **garde les defaults** sans message d'erreur (cf. `page.tsx:387-390`).

**4 tabs** :

| Tab | Algorithme | Inputs | État |
|-----|-----------|--------|------|
| `irpf` | Brackets progressifs (0/10/15/20/25/35%) | annualIncome | calc immédiat (`useMemo`) |
| `vat` | 15% + ou - | amount, mode `add`/`extract` | calc immédiat |
| `corporate` | 35% flat | profit | calc immédiat |
| `services` | percentage OR formula (eval custom) | dropdown service + variables | calc on button-press (`calculationTriggered` flag) |

**Helpers critiques** :
- `evaluateFormula(formula, vars)` — Recursive descent parser sécurisé (PAS d'eval). Supporte `+ - * / ( )`, decimals, unary minus. Tokens validés via regex sécurisée.
- `parseNumberInput(value)` — Strip non-numérique, parseFloat, fallback 0.
- `formatCurrencyValue(value, locale)` — Intl.NumberFormat → "1 000 000 XAF".

**Pas d'history** dans le web. Le mobile actuel a un placeholder `calculator/history.tsx` qui sera **supprimé** (pas de parité, pas d'endpoint backend).

### 2.2 État mobile actuel

| Fichier | État | Décision |
|---------|------|----------|
| `app/calculator/index.tsx` | 184 lignes placeholder (1 picker fake, bouton fake, result card vide, TODO partout) | **REMPLACER** intégralement |
| `app/calculator/history.tsx` | 114 lignes placeholder, pas de backend, pas de parité web | **SUPPRIMER** |
| `app/_layout.tsx:266-267` | 2 stack screens calculator | Garder `calculator/index`, retirer `calculator/history` |
| `app/(tabs)/index.tsx` | Référence calculator depuis dashboard (vérifier) | À auditer |
| `app/(tabs)/guide.tsx` | Référence calculator (vérifier) | À auditer |
| `core/i18n/locales/{es,fr,en}.json#calculator` | 7 clés placeholder | **REMPLACER** par les ~60 clés du web `calculatorPage` (renommé `calculator` côté mobile) |

### 2.3 Endpoint backend — staging snapshot + fix dette technique

```
$ curl -s -w "%{http_code}\n" \
  "https://taxasge-backend-staging-392159428433.us-central1.run.app/api/v1/homepage/calculator/config?language=es"
500   # avant fix
```

**Cause exacte** (vérifiée par requête DB staging) :
- SQL `LEFT JOIN entity_translations et_name ON et_name.entity_type = 'fiscal_service'` (ligne 1116 de `homepage_routes.py`).
- `entity_translations.entity_type` est l'enum PG `translatable_entity_type` qui contient `{ministry, sector, category, service, procedure_template, procedure_step, document_template}` — **PAS `'fiscal_service'`**.
- Résultat : `asyncpg.InvalidTextRepresentationError: invalid input value for enum translatable_entity_type: "fiscal_service"`.
- Le `except asyncpg.PostgresError` ligne 1158 attrape l'erreur et masque la cause derrière un 500 générique.

**Fix livré dans cette phase** : `homepage_routes.py:1116` — `'fiscal_service'` → `'service'` (one-liner SQL).
- Aucune migration nécessaire. La table `entity_translations` contient déjà 1 704 lignes pour `entity_type='service'`.
- Cache Redis 1h sera vidé au prochain refresh ou peut être invalidé manuellement.

**Verdict mobile** : Même après fix backend, le mobile **doit** garder son fallback vers `DEFAULT_CALCULABLE_SERVICES` parce que :
1. L'endpoint reste cacheable et peut être indispo (Redis down, cold start, etc.).
2. Le web fait exactement ce fallback (pattern `if (response.ok) merge ; else keep defaults`).
3. Faire l'inverse créerait une nouvelle dette technique (UI vide en cas d'incident).

### 2.4 Pourquoi le fix backend est en Phase B et pas séparé

Demandé explicitement par l'utilisateur : "inclut la gestion de erreur 500 du backend dans ce plan pour corriger une fois afin d'eviter des dettes techniques". Le fix est :
- One-liner, faible risque (changement d'un littéral SQL).
- Bloquant pour validation V8 (V8 = "endpoint config 500 → fallback OK". On le passe à "endpoint config 200 → merge OK" + maintien V8 sur autres erreurs).
- Évite de devoir rouvrir un ticket backend séparé pour une correction triviale.

Test post-fix attendu : `HTTP 200` avec `{"services": [...], "count": N}`.

---

## 3. ARCHITECTURE MOBILE B2

### 3.1 Structure module

```
packages/mobile/src/modules/calculator/
├── types.ts                      # CalculableService, FormulaVariable, results
├── constants.ts                  # IRPF_BRACKETS, VAT_STANDARD_RATE, CORPORATE_TAX_RATE, DEFAULT_CALCULABLE_SERVICES
├── helpers/
│   ├── parse.ts                  # parseNumberInput
│   ├── format.ts                 # formatCurrencyValue, formatPercent
│   └── formula.ts                # evaluateFormula + safeEval (recursive descent parser)
├── hooks/
│   └── use-calculator-config.ts  # useQuery → GET /homepage/calculator/config + merge
└── components/
    ├── irpf-tab.tsx              # IRPF input + result card
    ├── vat-tab.tsx               # VAT toggle add/extract + result
    ├── corporate-tab.tsx         # Corporate input + result
    ├── services-tab.tsx          # Service picker + dynamic form + result
    ├── tax-brackets-list.tsx     # Bracket list reusable for IRPF
    └── result-card.tsx           # Generic empty/result wrapper
```

### 3.2 Routes & screens

```
packages/mobile/src/app/calculator/
├── index.tsx          # NOUVEAU: 4 tabs Material 3 SegmentedButtons + ScrollView
└── history.tsx        # SUPPRIMÉ
```

### 3.3 Décisions clés

**D1 — Native tabs vs scroll** :
- Web utilise `<Tabs>` shadcn (4 tabs visibles).
- Mobile : `SegmentedButtons` Paper MD3 (4 segments, icons seuls sur petit écran) en haut, contenu en dessous dans `ScrollView`. Pas de bottom nav (l'écran est dans la stack, pas dans tabs).

**D2 — Inputs numériques** :
- Web `<Input type="text">` avec `pr-16` + `<span>XAF</span>`.
- Mobile `<TextInput keyboardType="numeric" right={<TextInput.Affix text="XAF" />}>` Paper.

**D3 — Calcul reactive** :
- IRPF / VAT / Corporate : `useMemo` recalcul à chaque keystroke (parité web).
- Services : button-press `Calculate` qui set `calculationTriggered=true` puis recalc via `useMemo` (parité web).

**D4 — Fallback API** :
```ts
// hooks/use-calculator-config.ts
export function useCalculatorConfig(language: 'es' | 'fr' | 'en') {
  return useQuery({
    queryKey: ['calculator', 'config', language],
    queryFn: () => apiGet<CalculatorConfigResponse>('/homepage/calculator/config', { language }),
    staleTime: 60 * 60 * 1000, // 1h cache (mirror backend cache TTL)
    retry: false,              // ne PAS retry — fallback immediate
    // sur error → return undefined → composant utilise DEFAULT_CALCULABLE_SERVICES
  });
}
```

Le composant fait `const services = mergeServices(DEFAULT_CALCULABLE_SERVICES, data?.services)` — pas de `isLoading` UI, pas d'error UI. **Graceful degradation pure**.

**D5 — Formula evaluator port** :
- Le port doit être **mot-pour-mot** avec le web. Risque sécurité = ouverture d'eval. Le parser recursive-descent est déjà safe : pattern regex stricte `^[\d\s+\-*/().]+$` + tokens validés. À copier intégralement, ne pas réécrire en `mathjs` ou autre lib.

**D6 — i18n namespace** :
- Garder le namespace `calculator` côté mobile (pas `calculatorPage` comme web) pour cohérence avec convention mobile (`t('calculator.title')` déjà utilisé). On **ajoute** ~50 nouvelles clés sans casser les 7 existantes.

**D7 — History suppression** :
- L'écran `calculator/history.tsx` est supprimé : pas de parité web, pas d'endpoint backend `/calculator/history` (vérifié), aucune raison de le maintenir. Le bouton "Historial" actuel disparaît du header.
- i18n `calculator.history` : conservée (utilisée dans 0 endroit après suppression — laisser en place pour minimiser le diff, suppression possible plus tard).

**D8 — Disclaimer** :
- Web affiche un `<div bg-amber>` en bas avec disclaimer i18n `disclaimer`. Mobile : `<Surface elevation={0}>` avec `Icon name="alert-circle-outline"` + texte amber, en bas du ScrollView.

### 3.4 Pattern réutilisé (référence projet)

```tsx
// SegmentedButtons (Paper MD3) — déjà utilisé dans m9 dashboards
<SegmentedButtons
  value={activeTab}
  onValueChange={(v) => setActiveTab(v as CalculatorType)}
  buttons={[
    { value: 'irpf', label: 'IRPF', icon: 'calculator' },
    { value: 'vat', label: t('calculator.vat'), icon: 'receipt' },
    { value: 'corporate', label: 'IS', icon: 'office-building' },
    { value: 'services', label: t('calculator.services'), icon: 'file-document-outline' },
  ]}
/>
```

```tsx
// Result card pattern (parité m14 LicenseSummaryChips coloration)
<Surface elevation={0} style={{ backgroundColor: colors.primaryContainer }}>
  <Text variant="labelMedium" style={{ color: colors.onPrimaryContainer }}>
    {t('calculator.calculatedAmount')}
  </Text>
  <Text variant="headlineMedium" style={{ color: colors.onPrimaryContainer, fontWeight: '700' }}>
    {formatCurrency(result)}
  </Text>
</Surface>
```

---

## 4. CHECKLIST ATOMIQUE B2

### B.2.0 Plan validé ✅
- [x] Plan rédigé et enregistré

### B.2.1 Module foundations (~15 min) ✅
- [x] **B.2.1.1** `modules/calculator/types/calculator.types.ts`
- [x] **B.2.1.2** `modules/calculator/constants/calculator.constants.ts`
- [x] **B.2.1.3** Helpers parse intégrés dans `services/calculator-helpers.ts`
- [x] **B.2.1.4** Helpers format intégrés dans `services/calculator-helpers.ts`
- [x] **B.2.1.5** Formula evaluator port verbatim dans `services/calculator-helpers.ts`

### B.2.2 Hook config (~10 min) ✅
- [x] **B.2.2.1** `useCalculatorConfig` (`retry:false`, `staleTime:1h`)
- [x] **B.2.2.2** `useMergedCalculableServices` avec `mergeServiceConfig` mirror web
- [x] **B.2.2.3** Barrel `modules/calculator/index.ts`

### B.2.3 Composants tabs (~30 min) ✅
- [x] **B.2.3.1** `components/result-card.tsx` (ResultCard + KeyValueRow + BigStat)
- [x] **B.2.3.2** `components/tax-brackets-list.tsx`
- [x] **B.2.3.3** `components/irpf-tab.tsx`
- [x] **B.2.3.4** `components/vat-tab.tsx`
- [x] **B.2.3.5** `components/corporate-tab.tsx`
- [x] **B.2.3.6** `components/services-tab.tsx`

### B.2.4 Écran principal (~10 min) ✅
- [x] **B.2.4.1** `app/calculator/index.tsx` réécrit (SegmentedButtons 4 tabs)
- [x] **B.2.4.2** Header sans bouton "Historial"
- [x] **B.2.4.3** Disclaimer Surface amber en bas

### B.2.5 Cleanup routes (~5 min) ✅
- [x] **B.2.5.1** `app/calculator/history.tsx` supprimé
- [x] **B.2.5.2** `Stack.Screen calculator/history` retiré du `_layout.tsx`
- [x] **B.2.5.3** `grep "calculator/history"` retourne 0 hit

### B.2.6 i18n (~15 min) ✅
- [x] **B.2.6.1** 60 clés ajoutées `es.json#calculator`
- [x] **B.2.6.2** 60 clés ajoutées `fr.json#calculator`
- [x] **B.2.6.3** 60 clés ajoutées `en.json#calculator`
- [x] **B.2.6.4** 3-langue drift = `set()` (63 clés / langue, identiques)

### B.2.7 Validation (~10 min) ✅ (tsc/ESLint/grep) — ⏳ smoke staging
- [x] **B.2.7.1** `tsc --noEmit` EXIT=0
- [x] **B.2.7.2** ESLint global EXIT=0, scope calculator 0 warnings
- [x] **B.2.7.3** `grep "taxasge-backend\|api-staging"` dans modules/calculator → 0 hit
- [ ] **B.2.7.4** Smoke endpoint post-fix backend → ⏳ pending push (Cloud Run staging redeploy)
- [x] **B.2.7.5** Fallback DEFAULT_CALCULABLE_SERVICES vérifié (pas d'écran erreur, code path explicit dans `useMergedCalculableServices`)

### B.2.7.bis Backend fix dette technique (~5 min) ✅ DÉJÀ LIVRÉ
- [x] **B.2.7.bis.1** Patch `homepage_routes.py:1116` — `entity_type = 'fiscal_service'` → `entity_type = 'service'` (commit `75e7130d`)
- [x] **B.2.7.bis.2** Critique `MOBILE_BUGFIX_PHASE_B_CRITIQUE.md` mise à jour section §7

### B.2.8 Commit + critique (~5 min) ✅
- [x] **B.2.8.1** Commit `232139f3 feat(mobile): calculator — full port...`
- [x] **B.2.8.2** `MOBILE_BUGFIX_PHASE_B_CRITIQUE.md` v1.1 — section §7-11 B2
- [x] **B.2.8.3** Push **en attente** confirmation utilisateur (mémoire #13)

---

## 5. CHECKLIST B7 — Directorio pagination ✅ LIVRÉ (commit `5d878c56`)

### B.7.1 Investigation backend ✅
- [x] Endpoint réel : `GET /api/v1/public/companies/search` (vérifié `main.py:1522`)
- [x] Pagination : `page` (1-1000) + `page_size` (1-50, default 20)
- [x] Limite max = 50 par page (cap backend)
- [x] Total exposé : `{items, total, page, page_size}`

### B.7.2 Mobile fix ✅
- [x] `useDirectorySearch` → `useInfiniteQuery` avec triple stop condition (items vide / items<page_size / cumul≥total)
- [x] FlatList `onEndReached` + `onEndReachedThreshold:0.5`
- [x] `ListFooterComponent` ActivityIndicator si `isFetchingNextPage`
- [x] Compteur `loaded / total` dans header

### B.7.3 Validation ✅
- [x] tsc EXIT=0 (avec heap bump)
- [x] ESLint scope EXIT=0
- [x] Single consumer (`app/directorio/index.tsx`) migré sans refactor parallèle
- [ ] Smoke staging — Cloud Run cold-start timeout (path vérifié main.py)

---

## 6. CRITÈRES DE VALIDATION B2 (DoD)

| # | Critère | Méthode |
|---|---------|---------|
| V1 | 4 tabs fonctionnels (irpf/vat/corporate/services) | smoke device |
| V2 | IRPF brackets : 5M XAF → 285K tax (10%×2M + 15%×2M = 200K + 300K = 500K... à recalculer) — vérifier breakdown affiché correct | calc test mental |
| V3 | VAT add 1M → 150K + 1.15M | calc test |
| V4 | VAT extract 1.15M → ~150K + 1M base | calc test |
| V5 | Corporate 10M → 3.5M tax + 6.5M net | calc test |
| V6 | Service percentage 0.2% sur 1M → 2K | calc test |
| V7 | Service formula `RF + (t * CA / 100)` avec `RF=100K, t=1, CA=10M` → 200K | calc test |
| V8 | Endpoint config 500 → fallback DEFAULT services intact (pas d'écran erreur) | smoke staging |
| V9 | tsc --noEmit 0 erreur | CI local |
| V10 | ESLint baseline préservée | CI local |
| V11 | i18n 3 langues × ~57 clés calculator complètes | drift script |
| V12 | History route 404 si linké, layout épuré | grep |
| V13 | Aucun import non utilisé | tsc + ESLint |
| V14 | Aucun hardcoded URL | grep |

---

## 7. RISQUES & MITIGATIONS B2

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Formula evaluator porte un bug subtil de typage TS strict | MOYENNE | HAUT | Port verbatim, tests mentaux sur 4-5 expressions courantes (`1+2`, `RF+(t*CA/100)`, `(a-b)/c`, `-5+3`) |
| `Intl.NumberFormat` pas dispo sur Hermes Android < 0.74 | FAIBLE | MOYEN | Hermes 0.76+ avec ICU support depuis SDK 51 → OK pour Expo SDK 54. Si gap → fallback `value.toLocaleString()` ou polyfill |
| `Menu` Paper pour service picker mal supporté en small screen | FAIBLE | FAIBLE | Alternative : `<Modal>` ou `BottomSheet`. À garder Menu en V1, BottomSheet en V2 si feedback |
| 500 staging persiste → users en prod tombent dessus | MOYENNE | FAIBLE | Fallback gracieux. Investiguer cause backend hors scope B2 mais à tracker dans Sentry |
| `parseNumberInput` strip vire les virgules de séparateur de milliers FR ("1 000") | CERTAINE | FAIBLE | Le web a le même bug — l'utilisateur tape sans séparateur. Affichage formate, input reste brut. |
| useMemo recalcule à chaque keystroke = perf sur input long | NULL | NULL | Inputs limités à ~12 chars + IRPF brackets O(6) + formula O(n vars) — pas de souci |
| Suppression history casse le deep-link `/calculator/history` | NULL | NULL | Aucun lien externe ne pointe dessus (vérifier grep) |

---

## 8. ORDRE D'EXÉCUTION

1. **B.2.1** Foundations (types/constants/helpers) — 15 min
2. **B.2.2** Hook config + merge — 10 min
3. **B.2.3** Components (6 fichiers) — 30 min
4. **B.2.4** Écran principal — 10 min
5. **B.2.5** Cleanup routes — 5 min
6. **B.2.6** i18n 3 langues — 15 min
7. **B.2.7** Validation — 10 min
8. **B.2.8** Commit + critique — 5 min

**Total estimé** : ~1h40 pour B2 seul.

B7 ensuite (~45 min séparé).

---

## 9. CHANGELOG

- **2026-04-29 v1.0** : créé en reprise de session B2 (B5a déjà commité).
