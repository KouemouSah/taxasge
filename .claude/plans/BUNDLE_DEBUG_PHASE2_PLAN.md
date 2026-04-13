# PHASE 2 — AUDIT CALL SITES + HARMONISATION INSERT SERVICE_REQUESTS

**Master plan** : `BUNDLE_DEBUG_MASTER_PLAN_2026_04_13.md`
**Date** : 2026-04-13
**Priorité** : 🟠 HAUTE — prévenir les futures régressions
**Temps estimé** : ~1 h (raccourci car la garde défensive a déjà été ajoutée en P1)
**Statut** : 🔵 EN COURS

---

## 1. OBJECTIF

Empêcher toute régression future du trigger `fn_enforce_bundle_sr_integrity` (migration 291) en :
1. Recensant **tous** les call sites qui INSÈRENT dans `service_requests` (via repo OU raw SQL)
2. Construisant une matrice `(workflow_code, champs fournis, conformité trigger)` pour chaque call site
3. Identifiant les call sites à risque (qui pourraient créer un bundle/field SR sans les champs)
4. Validant la cohérence globale
5. Ajoutant des tests de régression si nécessaire

## 2. CE QUI EST DÉJÀ FAIT EN PHASE 1

- ✅ Garde défensive dans `ServiceRequestRepository.create()` (fail-fast ValueError)
- ✅ Docstring explicite sur le repo
- ✅ 1 call site connu corrigé : `BundleWorkflowService.initiate_payment`
- ✅ 1 call site connu OK : `CollectionService._find_or_create_bundle_dossier` (raw INSERT qui fournit déjà tous les champs)

## 3. MÉTHODOLOGIE AUDIT

### 3.1 Sources à examiner
1. **Grep Python exhaustif**:
   - `ServiceRequestRepository()` / `sr_repo.create` / `service_request_repository.create`
   - `INSERT INTO service_requests`
   - `copy_from(...service_requests...)` (edge case bulk)
2. **Grep SQL direct** : `migrations/**/*.sql` pour toute fonction/procédure BD qui insère dans service_requests
3. **Interrogation BD** : `information_schema` pour les fonctions/views qui écrivent dans service_requests

### 3.2 Matrice à produire

Pour chaque call site, renseigner :

| Fichier:ligne | workflow_code (statique ou dynamique) | commercial_license_id | fiscal_year | source | Conforme trigger 291 ? |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

### 3.3 Critères d'acceptation

Un call site est **conforme** si et seulement si :
- Son `workflow_code` n'est JAMAIS dans `{BUNDLE_PAYMENT, FIELD_INSPECTION}`, OU
- Il fournit `commercial_license_id IS NOT NULL` + `fiscal_year IS NOT NULL` à l'INSERT

Un call site est **à risque** si :
- Son `workflow_code` est dynamique ET peut prendre la valeur `BUNDLE_PAYMENT`/`FIELD_INSPECTION`
- ET il ne valide pas explicitement la présence des champs bundle

## 4. CHECKLIST D'IMPLÉMENTATION

### 4.1 Audit
- [ ] Grep Python exhaustif `create(` sur le repo
- [ ] Grep SQL exhaustif `INSERT INTO service_requests` dans `migrations/` et `app/`
- [ ] Interroger BD : `SELECT ... FROM pg_proc WHERE prosrc LIKE '%service_requests%INSERT%'`
- [ ] Produire la matrice et la sauvegarder dans `BUNDLE_DEBUG_PHASE2_AUDIT.md`

### 4.2 Analyse et corrections (si nécessaire)
- [ ] Identifier les call sites à risque
- [ ] Pour chaque risque : documenter + corriger (ajout validation ou fix)
- [ ] Si besoin : refactor du `batch_persist_service.py` pour rejeter BUNDLE_PAYMENT explicitement si batch (batch n'est pas un bundle)

### 4.3 Tests de régression
- [ ] Test unitaire : `create(workflow_code="BUNDLE_PAYMENT", batch_id=X)` → doit échouer si pas de license (la garde Phase 1 doit le détecter, sinon ajouter un test)
- [ ] Test unitaire : `collection_service._find_or_create_bundle_dossier` avec un license sans fiscal_year → doit soit skipper soit échouer clairement
- [ ] Test unitaire : audit de tous les workflow_codes des SR existants en prod → confirmer qu'aucun bundle n'est en état incohérent

### 4.4 Documentation
- [ ] Ajouter un commentaire en haut de `service_request_repository.py` listant les invariants bundle
- [ ] Éventuellement : créer `docs/architecture/SERVICE_REQUEST_INVARIANTS.md` (optionnel, si la Phase 2 révèle beaucoup de subtilités)

### 4.5 Commit local
- [ ] `refactor(service-requests): audit + harden bundle integrity invariants`

## 5. LIVRABLES

1. `BUNDLE_DEBUG_PHASE2_AUDIT.md` — rapport de la matrice + findings
2. Code modifié (si nécessaire) + tests
3. Commit local

## 6. SCOPE OUT (reporté à d'autres phases)

- Frontend alignment → Phase 3
- Global exception handler → Phase 4
- Sécurité/perf 1M → Phase 5

## 7. RISQUES

### R-P2-1 : Call site dans un chemin dynamique non-grepable
Certains call sites utilisent `f"INSERT INTO {table}"` ou similaire et ne sont pas captés par grep. **Mitigation** : grep plus large + review manuelle des zones critiques (wizard_session_service, batch_persist_service).

### R-P2-2 : Fonctions BD internes (pg_proc) pouvant INSÉRER sans passer par le code Python
**Mitigation** : interrogation BD pour lister toutes les fonctions qui touchent service_requests.

### R-P2-3 : Scope creep
Un audit peut révéler d'autres bugs non liés au bundle. **Mitigation** : noter-les dans le rapport mais ne PAS les fixer en Phase 2 (sauf si critiques). Créer un "findings backlog" pour Phase 5.
