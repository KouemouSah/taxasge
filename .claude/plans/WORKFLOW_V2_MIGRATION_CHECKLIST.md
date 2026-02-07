# Workflow v2 Migration Checklist

> Checklist formelle pour migrer un workflow de BaseWorkflow (v1) vers PredefinedWorkflow (v2).
> Référence : pasaporte_workflow_v2.py, conducir_workflow.py, contrato_workflow.py

## Pré-migration

### 1. Analyse métier
- [ ] Identifier tous les solicitud_types (EXPEDICION, RENOVACION, DUPLICADO...)
- [ ] Identifier les motivos pour RENOVACION (VENCIMIENTO, PERDIDA, ROBO, DETERIORO...)
- [ ] Identifier les sous-types spécifiques au workflow (ex: classes permis, types contrat)
- [ ] Documenter la matrice de documents par type/motivo
- [ ] Documenter les tarifs par type/motivo avec sources réglementaires
- [ ] Vérifier les suppléments dans `tariff_supplements` en BD

### 2. Audit des schémas OCR
- [ ] Lister TOUS les schémas JSON utilisés (`schemas/*.json`)
- [ ] Vérifier que chaque champ du schéma existe sur le **document réel** (pas de champs fantômes)
- [ ] Vérifier que les patterns regex correspondent au format réel
- [ ] Identifier les champs extractibles vs manuels

### 3. Inventaire form_mapping
- [ ] Pour chaque champ de formulaire, identifier la source : `schema.section.field`
- [ ] Aucun mapping inventé - si le schéma n'a pas le champ, le form est `readonly: False` (saisie manuelle)
- [ ] Documenter les champs conditionnels (visible selon solicitud_type, is_minor, etc.)

## Implémentation

### 4. Structure classe
- [ ] Hérite de `PredefinedWorkflow` (PAS de `BaseWorkflow`)
- [ ] Implémente TOUTES les properties requises :
  - `workflow_code` → `WorkflowCode`
  - `category` → `WorkflowCategory`
  - `entity_code` → `EntityCode`
  - `service_name_es` → `str`
  - `allowed_solicitud_types` → `List[SolicitudType]`
  - `requires_appointment` → `bool`
  - `requires_agent_review` → `bool`
  - `requires_nota_ingreso` → `bool`
- [ ] Mapping `SUBTYPE_TO_SOLICITUD_MOTIVO` si sous-types legacy existent

### 5. `_setup_workflow()`
- [ ] Étape 0 : Selection type (StepType.SELECTION)
- [ ] Étapes conditionnelles : motivo, sous-type, mineur...
- [ ] Upload documents (StepType.DOCUMENT_UPLOAD) avec `dynamic_documents: True`
- [ ] N form_review steps (StepType.FORM_REVIEW) avec sections conditionnelles
- [ ] Payment (StepType.PAYMENT) avec `dynamic_tariff: True`
- [ ] Appointment (StepType.APPOINTMENT) si `requires_appointment`
- [ ] Confirmation (StepType.CONFIRMATION)

### 6. form_review sections
- [ ] Chaque section a un `id` unique, `title_es`, et optionnel `condition`
- [ ] Les conditions utilisent le format ConditionEvaluator : `{"solicitud_type": "EXPEDICION"}`, `{"OR": [...]}`, etc.
- [ ] Champs avec `required: True/False`, `readonly: True/False`, `type` correct
- [ ] JAMAIS de champ sans source dans le schéma OCR sauf si `readonly: False` (saisie manuelle)
- [ ] PAS de `placeholder_es` inventés - seulement des exemples réalistes

### 7. `_setup_tariffs()`
- [ ] TariffConfig avec le bon `tariff_type` (FIXED, PERCENTAGE, etc.)
- [ ] `fixed_amounts` ou `percentage` correctement renseignés
- [ ] Suppléments avec prix RÉELS de la BD (`tariff_supplements`)
- [ ] JAMAIS de `unit_price=0` sauf si documenté comme contrôle d'activation (quantity=0)
- [ ] Currency = "XAF"

### 8. `get_document_requirements()`
- [ ] Signature : `(self, solicitud_type, motivo, context)` - PAS `(self, sub_type)`
- [ ] `DocumentRequirement` avec `document_code`, `document_name_es`, `schema_key`
- [ ] `condition_type` correct (ALWAYS, IS_NEW, IS_MINOR, CUSTOM...)
- [ ] Documents conditionnels basés sur solicitud_type et motivo
- [ ] `faces_required` pour les documents recto/verso (DIP, etc.)
- [ ] `is_required=True/False` reflète la réglementation actuelle

### 9. `get_form_mapping()`
- [ ] Chaque mapping pointe vers un champ EXISTANT dans le schéma JSON
- [ ] Format : `"form_field": "document_code.section.field"`
- [ ] PAS de champs inventés (ex: `medico_numero_colegiado` sans schéma)
- [ ] Mappings conditionnels (is_minor, solicitud_type) si nécessaire

### 10. `get_cross_validation_rules()`
- [ ] Règles de cohérence inter-documents
- [ ] Expiration des documents
- [ ] Format des numéros (DIP, NIF, etc.)
- [ ] Cohérence des noms entre documents
- [ ] Severity correcte : `error` (bloquant) vs `warning` (informatif)

### 11. `get_tariff()` et `get_tariff_breakdown()`
- [ ] Si le workflow utilise des clés différentes du parent, override `get_tariff()`
- [ ] `get_tariff_breakdown()` retourne le format standard : `base_amount`, `supplements`, `total_amount`
- [ ] Signature conforme au parent : `(self, solicitud_type, motivo, context, base_description)`
- [ ] Utilise `self.get_tariff_config()` (méthode), PAS `self.tariff_config` (attribut direct)

## Intégration

### 12. Registration
- [ ] Singleton pattern (`_workflow: Optional[...] = None`)
- [ ] Fonction `get_XXX_workflow()` exportée
- [ ] Fonction `register_XXX_workflow()` pour workflow_engine
- [ ] Import dans `workflows/__init__.py` section v2 (PAS legacy)
- [ ] Export dans `__all__`
- [ ] Registration dans `workflow_engine.py` section v2_workflows

### 13. workflow_engine.py
- [ ] Workflow classé dans la section v2 (PAS v1)
- [ ] Log correct : `logger.info(f"... (v2: {len(v2_workflows)}, v1: {len(v1_workflows)})")`
- [ ] Type hints utilisent `AnyWorkflow` ou `PredefinedWorkflow`

### 14. routes.py
- [ ] Guard `hasattr(workflow, 'get_form_config')` pour endpoint `/form-config/{step_id}`
- [ ] Pas de crash si workflow v1 appelle l'endpoint form-config

## Validation

### 15. Tests
- [ ] Instanciation du workflow sans erreur
- [ ] `get_document_requirements()` retourne la bonne liste par type
- [ ] `get_form_mapping()` ne contient aucun champ inventé
- [ ] `get_tariff_breakdown()` calcule correctement
- [ ] Conditions des sections évaluées correctement
- [ ] `get_form_config()` retourne un FormConfig valide pour chaque form_review step

### 16. Anti-patterns à vérifier
- [ ] AUCUN placeholder (`unit_price=0` non documenté, `# to be defined`, `× inactive`)
- [ ] AUCUN champ fantôme (champ du schéma absent du document réel)
- [ ] AUCUNE ville/location hardcodée (utiliser `locations_from: entity_locations`)
- [ ] AUCUN import dupliqué (même classe importée de 2 modules)
- [ ] AUCUNE clé tarif incompatible avec le parent (si sous-types ≠ solicitud_types)
- [ ] PAS de `self.tariff_config` direct → `self.get_tariff_config()`

## Post-migration

### 17. Nettoyage
- [ ] Supprimer le code v1 de l'ancien workflow (si fichier séparé)
- [ ] Mettre à jour `workflows/__init__.py` (déplacer de LEGACY à v2)
- [ ] Mettre à jour `workflow_engine.py` (déplacer vers v2_workflows)
- [ ] Vérifier que le frontend détecte automatiquement les form_review_N steps
- [ ] Commit avec message descriptif : `feat(workflow): migrate XXX to v2 PredefinedWorkflow`

### 18. Documentation mémoire
- [ ] Mettre à jour `MEMORY.md` avec le nouveau workflow migré
- [ ] Mettre à jour le tableau des workflows dans le plan de migration
- [ ] Documenter les particularités du workflow (tarifs spéciaux, conditions, etc.)

---

## Inventaire des migrations

| Workflow | Architecture | Priorité | Effort | Statut |
|----------|-------------|----------|--------|--------|
| Pasaporte | v2 PredefinedWorkflow | - | - | ✅ Migré |
| Conducir | v2 PredefinedWorkflow | - | - | ✅ Migré |
| Contrato | v2 PredefinedWorkflow | - | - | ✅ Migré |
| Residencia | v1 BaseWorkflow | 🔴 HIGH | 5-7j | ⏳ |
| Vehiculo | v1 BaseWorkflow | 🟡 MEDIUM | 5-7j | ⏳ |
| Carnet Funcionario | v2 PredefinedWorkflow | - | - | ✅ Migré |
| Verificacion | v2 PredefinedWorkflow | - | - | ✅ Migré |
| Certificado Admin | v1 BaseWorkflow | 🟢 LOW | 2-3j | ⏳ |
| Permiso Extraordinario | v2 PredefinedWorkflow | - | - | ✅ Migré |
| Promocion Admin | v2 PredefinedWorkflow | - | - | ✅ Migré |
| Generic Standard | v1 BaseWorkflow | N/A | N/A | DB-driven (intentionnel) |
| Generic DirectPayment | v1 BaseWorkflow | N/A | N/A | DB-driven (intentionnel) |

---

*Dernière mise à jour : 2026-02-07*
*Basé sur : pasaporte_workflow_v2.py, conducir_workflow.py, contrato_workflow.py, promocion_workflow.py, carnet_workflow.py, verificacion_workflow.py*
