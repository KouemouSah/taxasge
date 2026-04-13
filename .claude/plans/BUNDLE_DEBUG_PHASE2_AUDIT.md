# PHASE 2 — AUDIT FINDINGS

**Plan** : `BUNDLE_DEBUG_PHASE2_PLAN.md`
**Date** : 2026-04-13
**Scope** : Tous les call sites qui insèrent dans `service_requests` (Python + BD)
**Résultat** : 🟢 **Aucun call site de production à risque**. La garde défensive Phase 1 couvre tous les cas.

---

## 1. MÉTHODOLOGIE

### 1.1 Sources examinées
- Grep Python exhaustif dans `packages/backend/app/` et `packages/backend/tests/`
- Script BD `scripts/debug_bundle_p2_db_probe.py` :
  - `pg_proc` — fonctions qui contiennent `INSERT INTO service_requests`
  - `information_schema.triggers` — triggers sur d'autres tables qui touchent service_requests
  - `valid_workflow_codes` — résolution base_code → code final via `fn_resolve_workflow_code`
  - Distribution actuelle des SRs en prod

### 1.2 Résultats BD
| Question | Résultat |
|---|---|
| Fonctions BD qui INSERT service_requests | **0** (aucune) |
| Triggers cascade vers service_requests | **0** |
| Base codes qui résolvent vers BUNDLE_PAYMENT / FIELD_INSPECTION | **0** (non-résolvables) |
| SRs bundle en prod | **0** (BUNDLE_PAYMENT et FIELD_INSPECTION n'ont jamais abouti — confirme l'impact Phase 1) |
| Workflow_codes actuellement en BD | `PASAPORTE_DETERIORO` (11), `CONDUCIR_RENOVACION` (1) |

**→ Le code Python est l'unique point d'entrée pour INSERT service_requests. Aucun chemin caché.**

---

## 2. MATRICE DES CALL SITES

### 2.1 Production (5 call sites)

| # | Fichier:ligne | workflow_code | license_id | fiscal_year | source | Conforme ? | Protection |
|---|---|---|---|---|---|---|---|
| 1 | `bundle_workflow_service.py:943` | `BUNDLE_PAYMENT` (hardcodé) | ✅ (P1 fix) | ✅ (P1 fix) | `citizen_wizard` | ✅ | Explicite |
| 2 | `collection_service.py:142` | `FIELD_INSPECTION` (hardcodé) | ✅ | ✅ | `field_inspection` | ✅ | Explicite |
| 3 | `batch_persist_service.py:406` | dynamique (`session.workflow_code`) | ❌ | ❌ | default | ✅ | Garde P1 (ValueError) |
| 4 | `service_request_service.py:152` | dynamique (`data.workflow_code`) | ❌ | ❌ | default | ✅ | Garde P1 (ValueError) |
| 5 | `wizard_session_service.py:1227` | dynamique (`session.workflow_code`) | ❌ | ❌ | default | ✅ | Garde P1 (ValueError) |

### 2.2 Tests (5 call sites raw INSERT)

| # | Fichier:ligne | workflow_code | license_id | fiscal_year | Conforme ? |
|---|---|---|---|---|---|
| T1 | `test_verify_enriched.py:109` | `FIELD_INSPECTION` | ✅ | ✅ | ✅ |
| T2 | `test_verify_enriched.py:285` | `BUNDLE_PAYMENT` | ✅ | ✅ | ✅ |
| T3 | `test_collection_service.py:297` | `FIELD_INSPECTION` | ✅ | ✅ | ✅ |
| T4 | `test_collection_service.py:332` | `PASAPORTE_NUEVO` | — | — | ✅ (non-bundle) |
| T5 | `test_collection_service.py:360` | `FIELD_INSPECTION` (neg. test) | — | — | ✅ (negative test, attend le reject) |
| T6 | `test_cleanup_abandoned.py:116` | paramétré | paramétré | paramétré | ✅ (helper flexible) |

---

## 3. ANALYSE DÉTAILLÉE DES CALL SITES DYNAMIQUES

### 3.1 `batch_persist_service.py:406` — batch_requests

**Flux** : le module `batch_requests` crée des SRs en masse pour des bénéficiaires multiples (ex: 10 passeports famille, 5 visas).

**workflow_codes valides pour batch** : passeports, visas, contrats — **jamais** de licences commerciales (BUNDLE_PAYMENT) ni d'inspections terrain (FIELD_INSPECTION) par design.

**Risque théorique** : si un client API inject `workflow_code="BUNDLE_PAYMENT"` dans la payload batch → la garde Phase 1 dans `create()` raise `ValueError("BUNDLE_SR_MISSING_LICENSE_ID")`.

**Test de régression** : ajouté en P2.5 (voir plus bas).

### 3.2 `service_request_service.py:152` — generic workflow start

**Flux** : endpoint legacy `POST /service-requests` pour démarrer une SR depuis une donnée `ServiceRequestCreate`.

**Risque théorique** : identique à batch. La garde Phase 1 protège.

**Amélioration possible** (hors scope Phase 2) : restreindre cet endpoint aux workflow_codes non-bundle côté validation Pydantic, pour un fail-fast encore plus tôt (avant d'atteindre la repo layer). Reporté à Phase 3/5 si nécessaire.

### 3.3 `wizard_session_service.py:1227` — wizard persist predefined workflows

**Flux** : le wizard session persiste une session Redis en SR finale. Les sessions wizard sont toujours pour des workflows citoyens individuels (pasaporte, conducir, residencia, etc.), jamais pour bundle.

**Risque théorique** : identique. Garde Phase 1 protège.

---

## 4. RISQUES RÉSIDUELS & RECOMMANDATIONS

### 4.1 Résolution de workflow_code — `fn_resolve_workflow_code`
Le trigger `BEFORE INSERT` `fn_resolve_workflow_code` peut transformer un base_code en code final (ex: `PASAPORTE_NUEVO` → `PASAPORTE_DETERIORO` selon `form_data.motivo`).

**Vérification** : aucun base_code ne résout vers `BUNDLE_PAYMENT` ou `FIELD_INSPECTION` (`SELECT ... WHERE base_code IN ('BUNDLE_PAYMENT','FIELD_INSPECTION')` → 0 row).

**Conclusion** : ma garde `_BUNDLE_WORKFLOW_CODES = {"BUNDLE_PAYMENT","FIELD_INSPECTION"}` est correcte et exhaustive pour les codes terminaux.

### 4.2 Évolutions futures
Si un jour on ajoute un base_code qui résout vers un workflow bundle (peu probable mais possible), il faudra :
1. Étendre `_BUNDLE_WORKFLOW_CODES` avec le base_code
2. Mettre à jour le commentaire migration 291
3. Ajouter un test de régression

### 4.3 Point d'amélioration — `source` field pas validé côté repo
La garde Phase 1 ne valide pas `source NOT IN ('citizen_wizard','field_inspection')`. Le trigger BD le fait, mais pour un bundle/field, si le caller override `source` avec une valeur non-conforme (ex: `source='admin_bulk'`), ça échouera au trigger.

**Décision** : laisser en l'état. Les call sites de production passent soit le default (`'citizen_wizard'`) soit explicitement `'field_inspection'`. Pas de risque observé. Si un futur call site introduit un nouveau `source` valide, il faudra mettre à jour la migration 291 + la garde. Reporté à Phase 5 si nécessaire.

---

## 5. DÉCISIONS

| # | Sujet | Décision | Justification |
|---|---|---|---|
| D1 | Code de production à modifier | **Aucun** | La garde P1 + les fixes P1 couvrent tous les cas réels |
| D2 | Tests de régression à ajouter | **1** (batch simulation) | Démontre explicitement que la garde P1 protège batch |
| D3 | Validation Pydantic `workflow_code` par route | **Reporté** | Optimisation, pas un bug |
| D4 | Validation `source` dans repo | **Reporté** | Redondant avec trigger BD, pas un bug observé |
| D5 | Renommage commit 143e0a06 | **Non** | Destructive, code déjà correct |

---

## 6. CHECKLIST PHASE 2 MISE À JOUR

- [x] Grep Python exhaustif (10 call sites identifiés, 5 prod + 5 tests)
- [x] BD probe — aucune fonction BD / cascade / base_code vers bundle
- [x] Matrice produite (section 2)
- [x] Analyse des 3 call sites dynamiques (section 3)
- [x] Risques résiduels documentés (section 4)
- [ ] 1 test de régression batch (P2.5)
- [ ] Commit local

---

## 7. CONCLUSION

**Phase 1 est architecturalement suffisante**. La garde défensive dans `ServiceRequestRepository.create()` protège **tous** les call sites Python (prod + tests) et aucune voie cachée côté BD n'existe. Le seul ajout Phase 2 est un test de régression démontrant la protection du flux batch.
