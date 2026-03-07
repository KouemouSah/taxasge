# Plan: Résolution workflow_code au persist (base→resolved)

## Problème

Tous les workflows multi-sous-types stockent le CODE DE BASE dans `service_requests.workflow_code` :
- Pasaporte: TOUJOURS `PASAPORTE_NUEVO` (même pour renovacion, deterioro, perdida, robo)
- Conducir: TOUJOURS `CONDUCIR_NUEVO` (même pour canje, renovacion, duplicado, extension)
- Contrato: TOUJOURS `CONTRATO_OBRA` (même pour servicio, suministro, concesion, etc.)
- Residencia: TOUJOURS `RESIDENCIA_PRIMERA_VEZ` (même pour renovacion)
- Visado: TOUJOURS `PRORROGA_VISADO` (même pour alternativo, permanencia, salida)

Conséquences : display_config par variante inutile, stats imprécises, filtres agent inexacts.

## Faisabilité (vérifiée en BD)

| Table | Codes résolus présents ? | Prêt ? |
|---|---|---|
| `workflows` (PK) | 23 codes résolus | OK |
| `workflow_tariffs` | 23 entrées | OK |
| `workflow_display_config` | 35 entrées | OK |
| `entities.workflow_codes` | Codes résolus | OK |
| `WorkflowCode` enum Python | 34 codes | OK |
| `WORKFLOW_CODE_LABELS` frontend | Tous mappés | OK |

Impact : **0 frontend, 1 fichier backend, 1 migration SQL**

## Phase 1 : Code backend (résolution au persist) ✅ COMPLETE

### Étape 1.1 : Ajouter `_resolve_workflow_code()` ✅
- [x] Fichier: `wizard_session_service.py`
- [x] Fonction: prend `session["workflow_code"]` + `session["solicitud_type"]` + `session["sub_type"]` + `session["motivo"]`
- [x] Appelle `workflow.get_workflow_code_for_subtype(sub_type)` si disponible
- [x] Fallback: retourne le code original si pas de résolution
- [x] Validation: `WorkflowCode(resolved_code)` doit passer (sinon garde original)

### Étape 1.2 : Utiliser dans `_persist_session_data()` ✅
- [x] Ligne ~1185: remplacer `workflow_code = session["workflow_code"]` par résolution
- [x] Le code résolu est passé à `service_request_repository.create()`

### Étape 1.3 : Utiliser dans `batch_persist_service.py` ✅
- [x] Même résolution pour les imports batch (`_resolve_batch_workflow_code()`)

### Validation Phase 1 ✅
- [x] Vérifié logique résolution: motivo=DETERIORO → PASAPORTE_DETERIORO, sub_type=RENOVACION → CONDUCIR_RENOVACION
- [x] Edge case expedicion (pas de motivo) → reste PASAPORTE_NUEVO ✅
- [x] WorkflowCode enum validation intégrée (garde base code si résolution invalide)

## Phase 2 : Migration données existantes ✅ COMPLETE

### Étape 2.1 : Migration SQL ✅
- [x] Fichier: `181_resolve_workflow_codes_existing.sql`
- [x] UPDATE service_requests SET workflow_code = code_résolu WHERE conditions
- [x] 8 statements: Pasaporte (4 motivos + renovacion) + Conducir (4 sub_types) + Contrato + Visado (future-proof)
- [x] Exécuté: 11 PASAPORTE_DETERIORO + 1 CONDUCIR_RENOVACION = 12 rows updated

### Étape 2.2 : Vérification post-migration ✅
- [x] SELECT workflow_code, count(*) → CONDUCIR_RENOVACION:1, PASAPORTE_DETERIORO:11
- [x] Aucune demande n'a encore un code de base erroné (0 PASAPORTE_NUEVO non-DRAFT avec motivo)

## Phase 3 : Nettoyage display_config PASAPORTE_NUEVO ✅ COMPLETE

### Étape 3.1 : Retirer pasaporte_antiguo de PASAPORTE_NUEVO ✅
- [x] Migration 182: UPDATE display_config PASAPORTE_NUEVO → 15 colonnes (DIP + certificado_nacimiento + autorizacion_parental + representante)
- [x] Colonnes `pasaporte_antiguo.*` retirées (plus nécessaires, chaque variante a son propre display_config)
- [x] Vérifié en BD: PASAPORTE_NUEVO = 15 colonnes, 0 pasaporte_antiguo

### Validation finale ✅
- [x] Chaque sous-type a son propre display_config → split-view correct
- [x] PASAPORTE_DETERIORO/RENOVACION: inclut pasaporte_antiguo ✅
- [x] PASAPORTE_PERDIDA/ROBO: n'inclut PAS pasaporte_antiguo ✅ (document perdu/volé)
- [x] PASAPORTE_NUEVO (expedicion): n'inclut PAS pasaporte_antiguo ✅ (premier passeport)
- [x] Filtres agent par workflow_code = exact match
- [x] Stats par workflow_code = granulaires
