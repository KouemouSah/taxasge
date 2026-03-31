# PLAN D'IMPLEMENTATION MULTILINGUE - APPLICATION FACIL
> Date: 2026-03-31 | Statut: A VALIDER | Ref: MULTILINGUAL_AUDIT_REPORT.md

## OBJECTIF
Rendre l'application 100% multilingue (ES/FR/EN) sans aucun melange de langues, avec un centre de controle unique (BD translations + entity_translations).

## ARCHITECTURE CIBLE

```
                    ┌─────────────────────────────────┐
                    │      CENTRE DE CONTROLE (BD)     │
                    │  translations (2,967 entrees)    │
                    │  entity_translations (8,536)     │
                    └────────┬──────────┬──────────────┘
                             │          │
                    ┌────────▼──┐  ┌────▼───────────┐
                    │ API REST  │  │ Admin UI        │
                    │ ?language= │  │ /translations   │
                    └──┬─────┬──┘  └─────────────────┘
                       │     │
              ┌────────▼─┐  ┌▼──────────┐
              │  WEB      │  │  MOBILE    │
              │  next-intl│  │  i18next   │
              │  JSON sync│  │  API+JSON  │
              └───────────┘  └───────────┘
```

**Principe**: La BD est la source de verite. Les JSON frontend sont des caches generes depuis la BD. Le contenu dynamique (services, ministries, workflows) est servi traduit par l'API.

---

## PHASES

### Phase 1: CABLAGE CRITIQUE — Eliminer le melange visible
> Duree estimee: Complexe | Priorite: P0
> Impacte: Tous les utilisateurs publics + tous profils

**1.1 Bundle Simulator multilingue**
- [ ] Backend: Ajouter `language: str = Query("es")` a `GET /service-bundles/simulator`
- [ ] Backend: `BundleService.simulate()` — JOIN entity_translations pour noms services
- [ ] Backend: Remplacer `FEE_TYPE_LABELS_ES` par lookup translations table ou param
- [ ] Backend: `SimulatorResponse` — ajouter champs `name`, `description` (traduits) a cote de `name_es`
- [ ] Frontend: `service-bundle.ts` types — ajouter `name`, `description` generiques
- [ ] Frontend: `licencias-comerciales/page.tsx` — passer `locale` a l'API, utiliser champs traduits
- [ ] Test: Verifier affichage en FR et EN sur page licences

**1.2 Workflow names multilingues (web)**
- [ ] Backend: Creer utility `get_workflow_labels(language)` qui fetch depuis translations table
- [ ] Backend: Tous endpoints retournant workflow_name → utiliser cette utility
- [ ] Frontend web: Creer hook `useWorkflowTranslations()` (inspire du mobile)
- [ ] Frontend web: Remplacer tous les `.service_name_es` par traduction dynamique
- [ ] Test: Verifier noms workflow en FR/EN sur dashboard + pages publiques

**1.3 Synchronisation cles web (716 manquantes)**
- [ ] Script: Generer rapport des cles manquantes par langue
- [ ] Ajouter les 333 cles manquantes dans en.json
- [ ] Ajouter les 162 cles manquantes dans fr.json
- [ ] Ajouter les 221 cles manquantes dans es.json
- [ ] Validation: zero cles manquantes entre les 3 fichiers

**1.4 Mobile errors i18n**
- [ ] `errors.ts`: Remplacer DEFAULT_MESSAGES par `t()` via i18n
- [ ] Verifier que toutes les cles `errors.*` existent dans les 3 fichiers JSON
- [ ] Corriger es.json: `"slot": "creneau"` → `"slot": "horario"`, `"slots": "creneaux"` → `"slots": "horarios"`
- [ ] Test: Simuler erreur reseau en FR et EN

**Checklist Phase 1:**
- [ ] Aucun texte espagnol visible en mode FR sur page licences
- [ ] Aucun texte espagnol visible en mode EN sur page licences
- [ ] Noms workflows traduits partout (web + mobile)
- [ ] Zero cles manquantes entre fichiers JSON web
- [ ] Erreurs mobile traduites dans les 3 langues

---

### Phase 2: COMPOSANTS WEB NON-TRADUITS
> Duree estimee: Moyenne | Priorite: P1
> Impacte: Pages admin, comptable, activation

**2.1 Utility `getLocalizedField()`**
- [ ] Creer `packages/web/src/core/utils/i18n-helpers.ts`
- [ ] Fonction `getLocalizedField(entity, field, locale)` → retourne `entity[field_${locale}]` avec fallback ES
- [ ] Fonction `getLocalizedName(entity, locale)` — raccourci pour le champ `name`
- [ ] Export depuis index pour usage global

**2.2 Pages hardcodees → useTranslations**
- [ ] `accountant/page.tsx` — extraire ~20 strings, ajouter cles dans 3 JSON
- [ ] `companies/dashboard/page.tsx` — extraire ~15 strings, ajouter cles
- [ ] `activate-admin/page.tsx` — extraire ~12 strings FR, ajouter cles 3 langues
- [ ] `activate-agent/page.tsx` — extraire ~12 strings FR, ajouter cles 3 langues
- [ ] `workflows/[code]/page.tsx` — extraire string ES
- [ ] Audit: Scanner les ~30 autres composants sans useTranslations, prioriser ceux visibles

**2.3 Remplacer `.name_es` dans admin pages**
- [ ] Identifier tous les `.name_es`, `.nameEs`, `.description_es` dans le code frontend
- [ ] Remplacer par `getLocalizedField()` ou equivalent
- [ ] S'assurer que les endpoints admin retournent les traductions (ou ajouter `?language=`)

**2.4 Mobile inline objects → i18n**
- [ ] `(tabs)/index.tsx`: Migrer `HERO_I18N` et `QUICK_ACTION_LABELS` vers JSON i18n
- [ ] `(tabs)/index.tsx`: Migrer `QUICK_ACTION_DESCS` vers JSON i18n
- [ ] Centraliser constantes langue dans `core/config/languages.ts`
- [ ] Supprimer duplications dans profile.tsx, onboarding.tsx, language-picker.tsx

**Checklist Phase 2:**
- [ ] Zero string hardcodee dans composants TSX
- [ ] Utility `getLocalizedField()` utilisee partout ou `.name_es` existait
- [ ] Mobile: zero inline translation objects
- [ ] Mobile: constantes langue centralisees

---

### Phase 3: ERREURS BACKEND STANDARDISEES
> Duree estimee: Complexe | Priorite: P1
> Impacte: Tous les utilisateurs (messages d'erreur)

**3.1 Architecture erreurs i18n**
- [ ] Creer `app/core/errors.py` — catalogue d'erreurs avec codes:
  ```python
  class ErrorCode(str, Enum):
      NOT_FOUND = "ERR_NOT_FOUND"
      UNAUTHORIZED = "ERR_UNAUTHORIZED"
      VALIDATION_FAILED = "ERR_VALIDATION"
      # ...50+ codes
  ```
- [ ] Creer `TranslatableHTTPException(status_code, error_code, default_detail, context={})`
- [ ] Seedar traductions dans `translations` table: `category='error', key_code='ERR_NOT_FOUND'`

**3.2 Migration progressive des erreurs**
- [ ] Phase 3.2a: Top 10 fichiers (590 occurrences) — fichiers les plus impactes
  - `fiscal_service_routes.py` (97)
  - `admin_routes.py` service_requests (75)
  - `auth_routes.py` (68)
  - `supervisor_routes.py` (65)
  - `verificacion_routes.py` (58)
  - `template_routes.py` (50)
  - `agent_routes.py` (48)
  - `inspection_routes.py` (46)
  - `routes.py` service_requests (42)
  - `batch_routes.py` (41)
- [ ] Phase 3.2b: 20 fichiers suivants
- [ ] Phase 3.2c: Fichiers restants

**3.3 Middleware de traduction d'erreurs**
- [ ] Exception handler global qui traduit les erreurs selon:
  1. `?lang=` query param
  2. `Accept-Language` header
  3. `request.state.user.preferred_language`
  4. Default `es`
- [ ] Format reponse: `{ "detail": "Translated message", "code": "ERR_NOT_FOUND", "context": {} }`

**3.4 Frontend error display**
- [ ] Web: `catch` blocks utilisent `error.code` + traduction locale au lieu de `error.detail`
- [ ] Mobile: Meme approche, unifier avec `getErrorI18nKey()`

**Checklist Phase 3:**
- [ ] Toutes HTTPException utilisent `TranslatableHTTPException` ou error codes
- [ ] Erreurs traduites selon la langue de l'utilisateur
- [ ] Frontend affiche les erreurs dans la bonne langue
- [ ] Catalogue d'erreurs dans translations table

---

### Phase 4: COMPLETUDE ET AUTOMATISATION
> Duree estimee: Moyenne | Priorite: P2
> Impacte: Qualite long-terme

**4.1 Completer entity_translations manquantes**
- [ ] procedure_templates: 44% → 100% (392 traductions manquantes)
- [ ] Ministries: 86% → 100% (3 ministeres manquants)
- [ ] Enrichment service: Etendre pour auto-traduire procedure_templates via Gemini
- [ ] Rafraichir vue materialisee `mv_services_translated`

**4.2 Backend Accept-Language uniformise**
- [ ] Tous les endpoints de lecture (`GET`) acceptent `Accept-Language` header
- [ ] Language middleware enrichi: query param → header → user preference → default
- [ ] Propagation `request.state.language` a tous les services

**4.3 Formatage dates/nombres coherent**
- [ ] Web: Auditer usages `.toLocaleString()` et remplacer par `formatDate()`/`formatCurrency()`
- [ ] Mobile: Corriger `licencias/index.tsx` (`es-GQ` hardcode → locale dynamique)
- [ ] Mobile: Footer PDF → i18n

**4.4 CI/CD i18n**
- [ ] Script `check-i18n-parity.js` — verifie que les 3 fichiers JSON ont les memes cles
- [ ] Integrer dans GitHub Actions CI
- [ ] Script `find-hardcoded-strings.js` — detecte strings espagnoles/francaises dans TSX
- [ ] Pre-commit hook optionnel

**4.5 Admin UI ameliorations**
- [ ] Dashboard couverture traductions avec pourcentages par type
- [ ] Bouton "Auto-translate missing" via enrichment (Gemini)
- [ ] Export CSV pour review par traducteurs humains

**Checklist Phase 4:**
- [ ] entity_translations 100% pour tous les types
- [ ] CI bloque si cles desynchronisees
- [ ] Formatage dates/nombres coherent partout
- [ ] Accept-Language fonctionne sur tous les endpoints

---

## DEPENDANCES ENTRE PHASES

```
Phase 1 (P0) ──→ Phase 2 (P1) ──→ Phase 4 (P2)
                       │
                       └──→ Phase 3 (P1) ──→ Phase 4
```

- Phase 1 est independante et urgente
- Phase 2 et 3 peuvent etre paralleles
- Phase 4 depend de 2 et 3

## RISQUES ET MITIGATIONS

| Risque | Mitigation |
|--------|------------|
| Performance JOINs entity_translations sur endpoints chauds | Vue materialisee + cache Redis (1h TTL deja en place) |
| Traductions IA de qualite variable | Quality score + review humain via admin UI |
| Regression i18n apres merge | CI check parite cles + tests e2e multilingues |
| 1,593 erreurs a migrer en une fois | Migration progressive par fichier (Phase 3.2a/b/c) |

## METRIQUES DE VALIDATION FINALE

| Metrique | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|----------|---------|---------|---------|---------|
| Pages avec melange | 20+ → 5 | 5 → 0 | 0 | 0 |
| Cles desynchronisees | 716 → 0 | 0 | 0 | 0 + CI |
| Composants sans i18n | 35 → 35 | 35 → 0 | 0 | 0 |
| Erreurs non-traduites | 1,593 | 1,593 | 1,593 → 0 | 0 + CI |
| Score global | C+ → B+ | B+ → A- | A- → A | A → A+ |

---

*Plan cree le 2026-03-31. A valider avant demarrage Phase 1.*
