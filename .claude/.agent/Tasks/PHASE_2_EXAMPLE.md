# PHASE 2 : CORE BACKEND - Services Fiscaux

**Module** : 02 - Core Backend
**Durée estimée** : 6 semaines
**Tâches** : 25 (TASK-P2-001 à TASK-P2-025)
**Début prévu** : 2025-10-20
**Fin prévue** : 2025-11-30
**Statut** : ⚪ Non démarré

---

## 🎯 OBJECTIFS MODULE

### Objectif Principal
Implémenter les services fiscaux core (déclarations, calculs, paiements) avec architecture 3-tiers complète backend + frontend, tests >85%, déployé sur staging.

### Objectifs Secondaires
1. Endpoints API CRUD complets (32 endpoints)
2. Services métier avec validations business rules
3. Frontend pages déclarations (8 pages)
4. Tests E2E flow complet
5. Documentation Swagger complète

---

## 📊 STATISTIQUES PLANIFIÉES

**Backend** :
- Endpoints : 20
- Services : 8
- Repositories : 8
- Tests : 90
- Durée : 120h

**Frontend** :
- Pages : 8
- Composants : 25
- Tests : 45
- Durée : 80h

**Integration** :
- Tests E2E : 15
- Durée : 20h

**TOTAL** : 220h (6 semaines)

---

## 🔗 DÉPENDANCES

**Modules précédents requis** :
- ✅ PHASE_0 : Setup projet (100%)
- ✅ PHASE_1 : Authentication (70%)

**Services externes** :
- API BANGE (mock pour dev)
- Service OCR (mock pour dev)
- Redis cache

---

# 📋 TÂCHES DÉTAILLÉES

---

## TASK-P2-001 : Endpoints déclarations CRUD

**Métadonnées** :
- **Type** : backend
- **Skill** : taxasge-backend-dev
- **Agent** : DEV_AGENT
- **Duration** : 6h
- **Priority** : CRITIQUE

**Description** :
Implémenter endpoints CRUD complets pour déclarations fiscales :
- POST /api/v1/declarations/ (créer déclaration)
- GET /api/v1/declarations/ (lister déclarations)
- GET /api/v1/declarations/{id} (récupérer déclaration)
- PUT /api/v1/declarations/{id} (mettre à jour déclaration)
- DELETE /api/v1/declarations/{id} (supprimer déclaration - soft delete)

**Fichiers à créer** :
- `packages/backend/app/api/v1/declarations.py` (routes)
- `packages/backend/app/schemas/declarations.py` (Pydantic schemas)

**Critères acceptation** :
- [ ] 5 endpoints implémentés selon architecture 3-tiers
- [ ] Validation Pydantic complète (min/max longueurs, formats)
- [ ] RBAC configuré (@require_role decorators)
- [ ] Docstrings complètes avec sources
- [ ] Swagger documentation générée

**Dépendances** :
- Aucune (première tâche module)

**Tests requis** :
- Tests unitaires endpoints (>85% coverage)
- Tests validation Pydantic
- Tests RBAC (citizen/agent/admin)

**Source référence** :
- `.github/docs-internal/Documentations/Backend/API_REFERENCE.md`
- `database/schema.sql` (table declarations)
- `.claude/skills/taxasge-backend-dev/templates/endpoint_template.py`

---

## TASK-P2-002 : Service déclarations - Business logic

**Métadonnées** :
- **Type** : backend
- **Skill** : taxasge-backend-dev
- **Agent** : DEV_AGENT
- **Duration** : 5h
- **Priority** : CRITIQUE

**Description** :
Implémenter service métier déclarations avec validations business rules :
- Création avec enrichissement données
- Validations métier (quota utilisateur, unicité référence)
- Workflow (draft → submitted → approved/rejected)
- Notifications agents (nouvelle soumission)

**Fichiers à créer** :
- `packages/backend/app/services/declaration_service.py`

**Business Rules** :
1. Utilisateur max 100 déclarations actives
2. Référence déclaration unique par année fiscale
3. Soumission uniquement si tous champs requis remplis
4. Modification interdite après approbation

**Critères acceptation** :
- [ ] Service suit architecture 3-tiers (appelle repository uniquement)
- [ ] Toutes validations métier implémentées
- [ ] Workflow draft/submitted/approved/rejected fonctionne
- [ ] Cache Redis intégré (TTL 5 minutes)
- [ ] Events publiés (declaration.created, declaration.submitted)

**Dépendances** :
- TASK-P2-003 (Repository déclarations)

**Tests requis** :
- Tests unitaires service (>85% coverage)
- Tests validations métier
- Tests workflow
- Mocks repository

**Source référence** :
- `.github/docs-internal/Documentations/Backend/ARCHITECTURE.md`
- `.claude/skills/taxasge-backend-dev/templates/service_template.py`

---

## TASK-P2-003 : Repository déclarations - Data access

**Métadonnées** :
- **Type** : backend
- **Skill** : taxasge-backend-dev
- **Agent** : DEV_AGENT
- **Duration** : 4h
- **Priority** : CRITIQUE

**Description** :
Implémenter repository data access layer pour déclarations :
- CRUD operations (create, get_by_id, list, update, soft_delete)
- Queries spécifiques (get_by_user, get_by_status, get_pending_validation)
- Filtres dynamiques
- Pagination
- Optimisations (eager loading relations)

**Fichiers à créer** :
- `packages/backend/app/database/repositories/declaration_repository.py`

**Critères acceptation** :
- [ ] CRUD complet implémenté
- [ ] Queries SQL optimisées (pas de N+1)
- [ ] Filtres dynamiques fonctionnent
- [ ] Pagination (skip/limit)
- [ ] Soft delete (deleted_at) géré
- [ ] Exceptions ResourceNotFoundError levées

**Dépendances** :
- Aucune (peut être fait en parallèle TASK-P2-001)

**Tests requis** :
- Tests unitaires repository (>90% coverage)
- Tests queries avec fixtures DB
- Tests pagination
- Tests soft delete

**Source référence** :
- `database/schema.sql` (table declarations - ligne 45-78)
- `.claude/skills/taxasge-backend-dev/templates/repository_template.py`

---

## TASK-P2-004 : Tests backend déclarations

**Métadonnées** :
- **Type** : backend
- **Skill** : taxasge-backend-dev
- **Agent** : TEST_AGENT (via Go/No-Go Validator)
- **Duration** : 4h
- **Priority** : HAUTE

**Description** :
Écrire suite tests complète pour déclarations backend :
- Tests endpoints (validation, RBAC, errors)
- Tests service (business rules, workflow)
- Tests repository (CRUD, queries)
- Tests intégration (endpoints → service → repository)

**Fichiers à créer** :
- `packages/backend/tests/api/v1/test_declarations_endpoints.py`
- `packages/backend/tests/services/test_declaration_service.py`
- `packages/backend/tests/repositories/test_declaration_repository.py`
- `packages/backend/tests/integration/test_declarations_flow.py`

**Critères acceptation** :
- [ ] Coverage backend >85%
- [ ] Tous tests passent (100%)
- [ ] Tests fixtures DB utilisées
- [ ] Mocks appropriés (services externes)
- [ ] Tests AAA (Arrange, Act, Assert)

**Dépendances** :
- TASK-P2-001 (Endpoints)
- TASK-P2-002 (Service)
- TASK-P2-003 (Repository)

**Tests requis** :
- Minimum 60 tests backend

**Source référence** :
- `.claude/.agent/SOP/TEST_WORKFLOW.md`

---

## TASK-P2-005 : Endpoints calculs fiscaux

**Métadonnées** :
- **Type** : backend
- **Skill** : taxasge-backend-dev
- **Agent** : DEV_AGENT
- **Duration** : 5h
- **Priority** : CRITIQUE

**Description** :
Implémenter endpoints calculs fiscaux :
- POST /api/v1/calculations/compute (calculer impôts)
- GET /api/v1/calculations/{declaration_id} (récupérer calculs)
- GET /api/v1/calculations/simulate (simuler impôts)

**Fichiers à créer** :
- `packages/backend/app/api/v1/calculations.py`
- `packages/backend/app/schemas/calculations.py`

**Critères acceptation** :
- [ ] 3 endpoints implémentés
- [ ] Validation inputs (montants, types revenus)
- [ ] RBAC configuré
- [ ] Documentation Swagger

**Dépendances** :
- TASK-P2-001 (Déclarations créées)

**Source référence** :
- `.github/docs-internal/Documentations/Backend/API_REFERENCE.md`
- `.claude/skills/taxasge-backend-dev/templates/endpoint_template.py`

---

## TASK-P2-006 : Service calculs fiscaux - Logique métier

**Métadonnées** :
- **Type** : backend
- **Skill** : taxasge-backend-dev
- **Agent** : DEV_AGENT
- **Duration** : 8h
- **Priority** : CRITIQUE

**Description** :
Implémenter logique calculs fiscaux (complexe) :
- Calcul IR (Impôt sur le Revenu) selon tranches
- Calcul IS (Impôt sur les Sociétés)
- Calcul TVA
- Abattements, réductions, crédits d'impôt
- Cache résultats calculs (Redis)

**Fichiers à créer** :
- `packages/backend/app/services/calculation_service.py`
- `packages/backend/app/services/tax_engine.py` (moteur calcul)

**Business Rules** :
1. Tranches IR : 0-2M (0%), 2M-5M (15%), 5M+ (25%)
2. IS : 20% sur bénéfices
3. TVA : 18% standard
4. Cache résultats 1h

**Critères acceptation** :
- [ ] Tous calculs fiscaux corrects (validés expert)
- [ ] Tests exhaustifs (>90% coverage)
- [ ] Performance : calculs <200ms P95
- [ ] Cache Redis implémenté

**Dépendances** :
- TASK-P2-005 (Endpoints calculs)

**Tests requis** :
- Tests unitaires calculs (50+ tests)
- Tests intégration avec expert fiscal

**Source référence** :
- `.github/docs-internal/Documentations/Backend/TAX_RULES.md` (à créer)
- Consultation expert fiscal

---

## TASK-P2-007 : Repository calculs

**Métadonnées** :
- **Type** : backend
- **Skill** : taxasge-backend-dev
- **Agent** : DEV_AGENT
- **Duration** : 3h
- **Priority** : HAUTE

**Description** :
Implémenter repository calculs fiscaux :
- Sauvegarder résultats calculs
- Historique calculs par déclaration
- Queries optimisées

**Fichiers à créer** :
- `packages/backend/app/database/repositories/calculation_repository.py`

**Critères acceptation** :
- [ ] CRUD complet
- [ ] Queries optimisées
- [ ] Tests >90%

**Dépendances** :
- TASK-P2-006 (Service calculs)

**Source référence** :
- `database/schema.sql` (table tax_calculations)
- `.claude/skills/taxasge-backend-dev/templates/repository_template.py`

---

## TASK-P2-008 : Tests calculs fiscaux

**Métadonnées** :
- **Type** : backend
- **Skill** : taxasge-backend-dev
- **Agent** : TEST_AGENT
- **Duration** : 5h
- **Priority** : CRITIQUE

**Description** :
Tests exhaustifs calculs fiscaux (critique car argent) :
- Tests unitaires moteur calcul
- Tests cas limites (0, max, négatifs)
- Tests tranches IR
- Tests IS, TVA
- Tests intégration calculs

**Fichiers à créer** :
- `packages/backend/tests/services/test_calculation_service.py`
- `packages/backend/tests/services/test_tax_engine.py`

**Critères acceptation** :
- [ ] Coverage >95% (critique)
- [ ] Tous cas limites testés
- [ ] Validation expert fiscal

**Dépendances** :
- TASK-P2-006 (Service calculs)

---

## TASK-P2-009 : Documentation Swagger backend

**Métadonnées** :
- **Type** : backend
- **Skill** : N/A
- **Agent** : DOC_AGENT
- **Duration** : 2h
- **Priority** : MOYENNE

**Description** :
Compléter documentation Swagger pour tous endpoints backend :
- Descriptions complètes
- Exemples requêtes/réponses
- Codes erreurs
- Schémas Pydantic documentés

**Fichiers à modifier** :
- Tous fichiers `app/api/v1/*.py`

**Critères acceptation** :
- [ ] Swagger UI complet
- [ ] Exemples fonctionnels
- [ ] Testable via Swagger

**Dépendances** :
- TASK-P2-001 à P2-008 (Tous endpoints backend)

---

## TASK-P2-010 : Déploiement backend staging

**Métadonnées** :
- **Type** : infrastructure
- **Skill** : N/A
- **Agent** : DEV_AGENT
- **Duration** : 3h
- **Priority** : HAUTE

**Description** :
Déployer backend sur Google Cloud Run staging :
- Build image Docker
- Push Google Container Registry
- Deploy Cloud Run staging
- Configure variables environnement
- Tests smoke

**Critères acceptation** :
- [ ] Backend staging accessible (URL)
- [ ] Health check OK
- [ ] Swagger accessible
- [ ] Tests smoke passent

**Dépendances** :
- TASK-P2-009 (Backend complet)

**Source référence** :
- `.github/docs-internal/Documentations/Backend/DEPLOYMENT.md`

---

## TASK-P2-011 : Page liste déclarations

**Métadonnées** :
- **Type** : frontend
- **Skill** : taxasge-frontend-dev
- **Agent** : DEV_AGENT
- **Duration** : 6h
- **Priority** : CRITIQUE

**Description** :
Créer page liste déclarations Next.js avec :
- Liste responsive (cards)
- Filtres (status, date)
- Pagination
- Actions (voir, éditer, supprimer)
- Loading states (Suspense)

**Fichiers à créer** :
- `packages/web/src/app/(dashboard)/declarations/page.tsx`
- `packages/web/src/components/declarations/declaration-list.tsx`
- `packages/web/src/components/declarations/declaration-card.tsx`
- `packages/web/src/components/declarations/declaration-list-skeleton.tsx`

**Critères acceptation** :
- [ ] Page responsive (mobile/tablet/desktop)
- [ ] Filtres fonctionnels
- [ ] Pagination fonctionne
- [ ] Loading states avec Suspense
- [ ] shadcn/ui composants utilisés

**Dépendances** :
- TASK-P2-001 (API endpoints déclarations)

**Tests requis** :
- Tests unitaires composants (Jest)
- Tests E2E page (Playwright)

**Source référence** :
- `.github/docs-internal/Documentations/Frontend/COMPONENTS.md`
- `.claude/skills/taxasge-frontend-dev/templates/page_template.tsx`

---

## TASK-P2-012 : Formulaire création déclaration

**Métadonnées** :
- **Type** : frontend
- **Skill** : taxasge-frontend-dev
- **Agent** : DEV_AGENT
- **Duration** : 8h
- **Priority** : CRITIQUE

**Description** :
Créer formulaire création déclaration avec react-hook-form + Zod :
- Formulaire multi-étapes (stepper)
- Validation temps réel
- Upload documents
- Sauvegarde brouillon auto
- Preview avant soumission

**Fichiers à créer** :
- `packages/web/src/app/(dashboard)/declarations/new/page.tsx`
- `packages/web/src/components/declarations/declaration-form.tsx`
- `packages/web/src/lib/validations/declaration-schema.ts` (Zod)
- `packages/web/src/hooks/useDeclarationForm.ts`

**Critères acceptation** :
- [ ] Formulaire multi-étapes (3-4 étapes)
- [ ] Validation Zod complète
- [ ] Upload documents fonctionne
- [ ] Sauvegarde brouillon auto (localStorage)
- [ ] Gestion erreurs API

**Dépendances** :
- TASK-P2-001 (API création déclaration)

**Tests requis** :
- Tests unitaires formulaire (Jest)
- Tests validation Zod
- Tests E2E création (Playwright)

**Source référence** :
- `.claude/skills/taxasge-frontend-dev/templates/form_template.tsx`

---

## TASK-P2-013 : Page détail déclaration

**Métadonnées** :
- **Type** : frontend
- **Skill** : taxasge-frontend-dev
- **Agent** : DEV_AGENT
- **Duration** : 5h
- **Priority** : HAUTE

**Description** :
Créer page détail déclaration avec :
- Affichage données complètes
- Timeline workflow (draft → submitted → approved)
- Actions contextuelles (éditer, soumettre, supprimer)
- Documents attachés
- Historique modifications

**Fichiers à créer** :
- `packages/web/src/app/(dashboard)/declarations/[id]/page.tsx`
- `packages/web/src/components/declarations/declaration-detail.tsx`
- `packages/web/src/components/declarations/declaration-timeline.tsx`

**Critères acceptation** :
- [ ] Affichage complet données
- [ ] Timeline workflow visible
- [ ] Actions selon status/role
- [ ] Documents téléchargeables

**Dépendances** :
- TASK-P2-001 (API get déclaration)

**Source référence** :
- `.claude/skills/taxasge-frontend-dev/templates/component_template.tsx`

---

## TASK-P2-014 : Composants formulaires réutilisables

**Métadonnées** :
- **Type** : frontend
- **Skill** : taxasge-frontend-dev
- **Agent** : DEV_AGENT
- **Duration** : 4h
- **Priority** : MOYENNE

**Description** :
Créer composants formulaires réutilisables :
- CurrencyInput (montants FCFA)
- DatePicker (dates fiscales)
- FileUpload (documents)
- TaxIdInput (NIF validé)

**Fichiers à créer** :
- `packages/web/src/components/forms/currency-input.tsx`
- `packages/web/src/components/forms/date-picker.tsx`
- `packages/web/src/components/forms/file-upload.tsx`
- `packages/web/src/components/forms/tax-id-input.tsx`

**Critères acceptation** :
- [ ] Composants réutilisables
- [ ] Validation intégrée
- [ ] Accessibilité WCAG AA
- [ ] Documentation Storybook

**Dépendances** :
- Aucune (peut être fait en parallèle)

---

## TASK-P2-015 : API Client déclarations

**Métadonnées** :
- **Type** : frontend
- **Skill** : taxasge-frontend-dev
- **Agent** : DEV_AGENT
- **Duration** : 3h
- **Priority** : CRITIQUE

**Description** :
Créer client API TypeScript pour déclarations :
- Fonctions CRUD type-safe
- Gestion erreurs
- Retry logic
- Token refresh

**Fichiers à créer** :
- `packages/web/src/lib/api/declarations-api.ts`
- `packages/web/src/lib/api/calculations-api.ts`

**Critères acceptation** :
- [ ] Fonctions CRUD complètes
- [ ] Types TypeScript corrects
- [ ] Gestion erreurs HTTP
- [ ] Token JWT géré

**Dépendances** :
- TASK-P2-001 (API backend)

**Source référence** :
- `.claude/skills/taxasge-frontend-dev/templates/api_client_template.ts`

---

## TASK-P2-016 : State management déclarations

**Métadonnées** :
- **Type** : frontend
- **Skill** : taxasge-frontend-dev
- **Agent** : DEV_AGENT
- **Duration** : 3h
- **Priority** : HAUTE

**Description** :
Implémenter state management déclarations avec Zustand ou Context :
- Store global déclarations
- Actions (create, update, delete)
- Cache local
- Optimistic updates

**Fichiers à créer** :
- `packages/web/src/stores/declarations-store.ts` (si Zustand)
OU
- `packages/web/src/contexts/declarations-context.tsx` (si Context)

**Critères acceptation** :
- [ ] State global fonctionne
- [ ] Optimistic updates
- [ ] Cache local

**Dépendances** :
- TASK-P2-015 (API client)

---

## TASK-P2-017 : Tests unitaires frontend

**Métadonnées** :
- **Type** : frontend
- **Skill** : taxasge-frontend-dev
- **Agent** : TEST_AGENT
- **Duration** : 5h
- **Priority** : HAUTE

**Description** :
Écrire tests unitaires Jest pour composants frontend :
- Tests composants (React Testing Library)
- Tests hooks
- Tests utils
- Coverage >75%

**Fichiers à créer** :
- `packages/web/tests/components/declarations/*.test.tsx`
- `packages/web/tests/hooks/*.test.ts`

**Critères acceptation** :
- [ ] Coverage >75%
- [ ] Tous tests passent

**Dépendances** :
- TASK-P2-011 à P2-016 (Composants frontend)

---

## TASK-P2-018 : Tests E2E déclarations flow

**Métadonnées** :
- **Type** : integration
- **Skill** : N/A
- **Agent** : TEST_AGENT
- **Duration** : 6h
- **Priority** : CRITIQUE

**Description** :
Tests E2E Playwright flow complet déclarations :
1. Login
2. Créer déclaration (formulaire)
3. Sauvegarder brouillon
4. Éditer déclaration
5. Soumettre déclaration
6. Vérifier status "submitted"
7. Agent approuve (admin)
8. Vérifier status "approved"

**Fichiers à créer** :
- `packages/web/tests/e2e/declarations-flow.spec.ts`

**Critères acceptation** :
- [ ] Flow complet fonctionne
- [ ] Tests passent sur staging
- [ ] Screenshots échecs

**Dépendances** :
- TASK-P2-011 à P2-016 (Frontend complet)
- TASK-P2-010 (Backend staging)

---

## TASK-P2-019 : Responsive design mobile

**Métadonnées** :
- **Type** : frontend
- **Skill** : taxasge-frontend-dev
- **Agent** : DEV_AGENT
- **Duration** : 4h
- **Priority** : HAUTE

**Description** :
Optimiser responsive design pour mobile/tablet :
- Breakpoints Tailwind (sm, md, lg)
- Navigation mobile (drawer)
- Formulaires mobile-friendly
- Touch gestures

**Fichiers à modifier** :
- Tous composants déclarations

**Critères acceptation** :
- [ ] Mobile responsive (320px+)
- [ ] Tablet responsive (768px+)
- [ ] Desktop responsive (1024px+)
- [ ] Tests devices réels

**Dépendances** :
- TASK-P2-011 à P2-016 (Composants frontend)

---

## TASK-P2-020 : Déploiement frontend staging

**Métadonnées** :
- **Type** : infrastructure
- **Skill** : N/A
- **Agent** : DEV_AGENT
- **Duration** : 3h
- **Priority** : HAUTE

**Description** :
Déployer frontend Firebase Hosting staging :
- Build Next.js production
- Deploy Firebase staging
- Configure variables environnement
- Tests smoke

**Critères acceptation** :
- [ ] Frontend staging accessible (URL)
- [ ] Lighthouse score >90
- [ ] Tests smoke passent

**Dépendances** :
- TASK-P2-019 (Frontend complet)

**Source référence** :
- `.github/docs-internal/Documentations/Frontend/DEPLOYMENT.md`

---

## TASK-P2-021 : Tests intégration backend-frontend

**Métadonnées** :
- **Type** : integration
- **Skill** : N/A
- **Agent** : TEST_AGENT
- **Duration** : 4h
- **Priority** : CRITIQUE

**Description** :
Tests intégration complets backend-frontend sur staging :
- API calls fonctionnent
- CORS configuré
- Authentication fonctionne
- Errors gérés

**Critères acceptation** :
- [ ] Tous flows testés
- [ ] 0 erreurs CORS
- [ ] JWT refresh fonctionne

**Dépendances** :
- TASK-P2-010 (Backend staging)
- TASK-P2-020 (Frontend staging)

---

## TASK-P2-022 : Fix bugs intégration

**Métadonnées** :
- **Type** : fullstack
- **Skill** : backend+frontend
- **Agent** : DEV_AGENT
- **Duration** : 6h
- **Priority** : CRITIQUE

**Description** :
Corriger tous bugs découverts pendant tests intégration :
- Bugs backend
- Bugs frontend
- Bugs communication API

**Critères acceptation** :
- [ ] 0 bugs P0 (critiques)
- [ ] 0 bugs P1 (majeurs)

**Dépendances** :
- TASK-P2-021 (Tests intégration)

---

## TASK-P2-023 : Smoke tests staging complet

**Métadonnées** :
- **Type** : integration
- **Skill** : N/A
- **Agent** : TEST_AGENT
- **Duration** : 2h
- **Priority** : HAUTE

**Description** :
Suite smoke tests finale sur staging :
- Health checks
- Flows critiques
- Performance basique

**Critères acceptation** :
- [ ] Tous smoke tests passent
- [ ] Performance acceptable

**Dépendances** :
- TASK-P2-022 (Bugs corrigés)

---

## TASK-P2-024 : Documentation complète module

**Métadonnées** :
- **Type** : infrastructure
- **Skill** : N/A
- **Agent** : DOC_AGENT
- **Duration** : 3h
- **Priority** : MOYENNE

**Description** :
Compléter documentation module 02 :
- README module
- Architecture diagrams
- API documentation
- Guide déploiement

**Fichiers à créer** :
- `packages/backend/README_MODULE_02.md`
- `packages/web/README_MODULE_02.md`
- Diagrammes architecture

**Critères acceptation** :
- [ ] Documentation complète
- [ ] Diagrammes clairs

**Dépendances** :
- TASK-P2-023 (Module finalisé)

---

## TASK-P2-025 : Validation finale Go/No-Go module

**Métadonnées** :
- **Type** : integration
- **Skill** : N/A
- **Agent** : GONOGO_VALIDATOR
- **Duration** : 2h
- **Priority** : CRITIQUE

**Description** :
Validation finale module 02 complète :
- Vérifier tous critères acceptation
- Générer rapport final module
- Mettre à jour RAPPORT_GENERAL
- Décision GO/NO-GO module suivant

**Critères acceptation** :
- [ ] Toutes tâches P2-001 à P2-024 validées GO
- [ ] Backend deployed staging OK
- [ ] Frontend deployed staging OK
- [ ] Tests E2E passent (100%)
- [ ] Coverage backend >85%
- [ ] Coverage frontend >75%
- [ ] Lighthouse >90
- [ ] 0 bugs critiques

**Dépendances** :
- TASK-P2-024 (Documentation complète)

**Outputs** :
- `RAPPORT_MODULE_02.md` (rapport final module)
- `RAPPORT_ORCHESTRATION_MODULE_02.md` (timeline complète)
- `RAPPORT_GENERAL.md` (mis à jour)

---

# 📊 MÉTRIQUES CIBLES MODULE

| Métrique | Target | Mesure |
|----------|--------|--------|
| Backend Coverage | >85% | pytest --cov |
| Frontend Coverage | >75% | jest --coverage |
| Lighthouse Score | >90 | Chrome DevTools |
| Backend Build Time | <120s | CI logs |
| Frontend Build Time | <180s | CI logs |
| Tests Execution | <90s | CI logs |
| Backend P95 Latency | <500ms | Monitoring |
| API Success Rate | >99.5% | Monitoring |

---

# 🚨 RISQUES IDENTIFIÉS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Complexité calculs fiscaux | Élevée | Critique | Consultation expert fiscal + tests exhaustifs |
| Performance calculs lourds | Moyenne | Élevé | Cache Redis + optimisation queries |
| Dépendance API BANGE | Moyenne | Élevé | Mock API pour dev + tests fallback |
| Responsive design complexe | Faible | Moyen | Tests devices réels dès début |

---

**Template version** : 2.0  
**Date création** : 2025-10-31  
**Statut** : ✅ TEMPLATE PRÊT POUR UTILISATION
