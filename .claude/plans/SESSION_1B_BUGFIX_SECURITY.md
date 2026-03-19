# Session 1B — Correction Bugs + Vérification Sécurité

## Objectif
Corriger TOUS les bugs identifiés avant de passer aux sessions d'enrichissement.
Zéro bug en production avant d'avancer.

## Bugs à corriger

### CRITIQUES (bloquants)
- [x] **Simulator licencias-comerciales 500** — asyncpg ne décodait pas JSONB → Pydantic crash. **FIX**: Registered JSON/JSONB codecs on asyncpg pool (`connection.py:_init_connection`). Fix global — bénéficie toute l'app.
- [x] **Pages legal manquantes** — 3 pages créées (`/legal/privacy`, `/legal/terms`, `/legal/cookies`). Traductions es/fr/en ajoutées. Client components avec i18n.
- [x] **Dashboard admin Pilotaje** — JSX fix du commit d7922655 vérifié. Page correctement syntaxée, tous les onglets fermés.

### MAJEURS (fonctionnels)
- [x] **Gestión Empresas** — Permissions `company.view_all` correctement assignées à admin/super_admin/admin_services. 92 permissions company.* en BD. Cache 10min = délai normal après assignation.
- [x] **Config Rules** — **BUG trouvé**: `populateForm()` utilisait snake_case (`cfg.grace_days`) au lieu de camelCase (`cfg.graceDays`) après transformKeys. Résultat: formulaire d'édition montrait toujours 0. **FIX**: 4 clés corrigées.
- [x] **PDF Licence** — Pipeline complète vérifiée OK: `m.name_es AS ministry_name` → Pydantic → transformKeys → frontend. Aucun bug.
- [x] **Classification Borradores** — **5 bugs corrigés**: (1) Pydantic NULL→float crash (Optional[float]), (2) SELECT manquait 4 colonnes, (3) ORDER BY NULL imprévisible (COALESCE), (4) reclassify_draft str→UUID, (5) get_history str→UUID.
- [x] **Annuaire public** — Fonctionne. 43 companies publiques. Sécurité OK: email/phone/capital exclus du SELECT.

### MINEURS (UX)
- [x] **Cache permissions** — TTL 10min = comportement normal. Pas de bug — juste un délai attendu après modification de permissions.
- [ ] **Leaflet crash** — Hors scope (session 5). Carte choroplèthe supprimée du dashboard admin.

## Vérification Sécurité

### Permissions
- [x] Chaque endpoint protégé par permission_required() — vérifié sur 6 fichiers routes
- [x] agent_tesoro: seulement `company.view` + `company.view_classification` — PAS de view_all, update, delete, classify
- [x] Annuaire public NE retourne PAS email/phone/capital — exclus au niveau SQL SELECT
- [ ] 26 permissions fantômes — hors scope companies, documenté pour session future

### SQL Injection
- [x] **11 f-strings SQL auditées** — TOUTES safe (placeholders $1/$2, whitelist dict pour ORDER BY, frozenset pour DDL)
- [x] ILIKE wildcards (%,_,\\) correctement échappés dans 4 search endpoints
- [x] ZERO `.format()` ou `%s` interpolation sur SQL
- [x] Seul f-string DDL = REFRESH MATERIALIZED VIEW avec frozenset hardcodé

### UUID/Type Safety
- [x] **2 bugs str→UUID corrigés**: (1) company_routes.py auto-reclassify inline SQL, (2) company_repository.py list_by_user
- [x] Classification routes: tous les path params convertis via UUID() ou _UUID() avec try/except
- [x] Bundle routes: modèle à suivre — path params typés UUID directement dans FastAPI

### Rate Limiting
- [x] 3 endpoints publics (search, zones, sectors) ont rate limiting (100 req/min/IP)
- [x] Graceful degradation si Redis down (log debug, allow request)

### CORS/Headers
- [x] CORS configuré avec whitelist d'origines (dev + prod conditionnels)
- [x] Endpoints publics sans authentification — pas de credentials

### JSONB Codec Safety
- [x] Vérifié: aucun double-decode risk. Tous les json.loads existants protégés par `isinstance(x, str)` guard.

## Fichiers modifiés

### Backend (5 fichiers)
| Fichier | Changement |
|---------|------------|
| `app/database/connection.py` | +`_init_connection()` JSON/JSONB codec on pool |
| `app/modules/companies/models/classification.py` | `Optional[float]` pour confidence fields |
| `app/modules/companies/services/company_onboarding_service.py` | SELECT étendu (19 cols), COALESCE, UUID serialize |
| `app/modules/companies/api/company_routes.py` | UUID conversion auto-reclassify |
| `app/modules/companies/api/company_classification_routes.py` | UUID conversion reclassify_draft + history |
| `app/modules/companies/repositories/company_repository.py` | `_uid()` dans list_by_user |

### Frontend (9 fichiers)
| Fichier | Changement |
|---------|------------|
| `app/[locale]/(public)/legal/privacy/page.tsx` | **NOUVEAU** — Page politique de confidentialité |
| `app/[locale]/(public)/legal/terms/page.tsx` | **NOUVEAU** — Page conditions d'utilisation |
| `app/[locale]/(public)/legal/cookies/page.tsx` | **NOUVEAU** — Page politique de cookies |
| `app/[locale]/(dashboard)/dashboard/admin/config-rules/page.tsx` | Fix camelCase keys dans populateForm |
| `messages/es.json` | +legalPages (privacy/terms/cookies) |
| `messages/fr.json` | +legalPages (privacy/terms/cookies) |
| `messages/en.json` | +legalPages (privacy/terms/cookies) |

## Statut: COMPLET — Prêt pour commit + push
