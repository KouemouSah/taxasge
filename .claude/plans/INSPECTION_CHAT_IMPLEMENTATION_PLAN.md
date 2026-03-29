# Plan — Chat IA pour agents Inspection + Menu Chat tous rôles

**Date** : 2026-03-29
**Statut** : PLANIFIÉ — Prêt pour implémentation
**Prérequis** : Phases 1-4 chatbot + Agent Unification LLM complétées (session 2026-03-27/29)

---

## PROMPT DE LANCEMENT (copier dans une nouvelle session)

```
Implémente le plan INSPECTION_CHAT_IMPLEMENTATION_PLAN.md situé dans .claude/plans/

Contexte : On a un chatbot LLM unifié (Gemini 2.5 Flash) avec 19 tools citoyens + 8 tools authentifiés + 8 tools GAP métier (deep reasoning). L'architecture injecte les tools selon le rôle de l'utilisateur connecté. Les agents et supervisors (20 rôles) n'ont PAS de menu "Chat IA" dans leur dashboard. Les agents inspection (ayuntamiento, cámara, oms_polyvalent) n'ont PAS de tools inspection dans le chatbot.

Implémente en 4 étapes :

ÉTAPE 1 — Migration SQL : Ajouter un item menu "Asistente IA" (href=/dashboard/chat, icon=MessageSquare) dans le menu_config JSON de TOUS les 20 rôles agents/supervisors dans la table roles. Ajouter aussi les clés i18n nav.aiAssistant dans es.json/fr.json/en.json.

ÉTAPE 2 — Créer inspection_agent_tools.py (NOUVEAU) avec 5 tools terrain :
- get_my_inspections_today(agent_id) — inspections du jour + stats
- get_license_info(nif_or_code) — vérifier une licence par NIF GE-xxxxxx ou code PE
- get_company_inspection_history(company_id) — historique + LLM analyse patterns
- get_my_collection_summary(agent_id) — encaissements non réconciliés
- ai_seal_recommendation(inspection_id) — DEEP REASONING : SQL (dossier + historique + obligations impayées + MED) → Gemini analyse et recommande si scellé justifié
Tous scopés par agent_id + _entity_location_id + _site_filter. Lecture seule.
Inclure FunctionDeclarations (Vertex AI + Google AI fallback).

ÉTAPE 3 — Ajouter 3 tools supervisor inspection (deep reasoning) :
- get_pending_seals_analysis(entity_id) — DEEP : scellés en attente + recommandation approuver/rejeter par Gemini
- get_zone_compliance_analysis(entity_id) — DEEP : conformité par zone + tendances + alertes
- predict_inspection_targets(entity_id) — DEEP : scoring risque IA pour cibler les entreprises à inspecter
Tous scopés par entity_id + _site_filter. Inclure FunctionDeclarations.

ÉTAPE 4 — Routing par permissions dans chatbot_service_rag.py :
- Si user a permission inspection.view_own → injecter tools agent terrain
- Si user a permission inspection.view_entity → injecter tools supervisor inspection
- Si user a permission inspection.seal_approve → injecter aussi get_pending_seals_analysis
Utiliser les permissions (pas les noms de rôles) pour que tout nouveau rôle avec ces permissions hérite automatiquement des tools.
Enregistrer les tools dans tool_registry.py.

RÈGLES MÉTIER :
- Chat = lecture seule (recommande, n'exécute PAS d'actions : pas de seal/approve/create)
- Agent voit SES données, supervisor voit TOUTE l'entité/site
- Mission = filtre optionnel dans les tools de listing
- Deep reasoning = SQL gather → Gemini analyze (pattern _llm_analyze() existant dans agent_decision_tools.py)
- Réutiliser le pattern _site_filter() et _entity_filter() de agent_decision_tools.py

FICHIERS CRITIQUES À LIRE AVANT DE COMMENCER :
- .claude/plans/INSPECTION_CHAT_IMPLEMENTATION_PLAN.md (ce plan)
- .claude/plans/AGENT_LLM_UNIFICATION_PLAN.md (architecture unifiée)
- packages/backend/app/modules/shared/services/agent_decision_tools.py (pattern deep reasoning)
- packages/backend/app/modules/shared/services/supervisor_extended_tools.py (5 tools inspection existants)
- packages/backend/app/modules/inspections/repositories/inspection_repository.py (requêtes SQL existantes)
- packages/backend/app/modules/inspections/services/inspection_service.py (logique métier)
- packages/backend/app/modules/shared/services/tool_registry.py (enregistrement tools)
- packages/backend/app/modules/chatbot/services/chatbot_service_rag.py (routing par rôle)
- packages/backend/database/migrations/249_field_inspections.sql (schema table)

TABLES BD CLÉS :
- field_inspections (35+ colonnes : status, result, GPS, photos, MED, scellé, paiement)
- commercial_licenses (licences commerciales liées aux inspections)
- license_obligations (obligations financières)
- roles (menu_config JSONB avec les menus par rôle)
- agent_profiles (entity_id, entity_location_id, is_supervisor)

PERMISSIONS INSPECTION (migration 249) :
- inspection.create, inspection.view_own, inspection.view_entity
- inspection.seal_propose, inspection.seal_approve
- inspection.collect_payment, inspection.mise_en_demeure
- inspection.view_reports, inspection.export

Phase par phase avec checklist. Critiquer chaque phase. Committer sans pousser — demander confirmation avant push. Toujours vérifier la cohérence avec le code existant.
```

---

## DÉTAIL TECHNIQUE PAR ÉTAPE

### Étape 1 : Migration menu chat — 20 rôles

**Fichier** : `packages/backend/database/migrations/283_add_chat_menu_to_agent_roles.sql`

Item menu à ajouter dans chaque `roles.menu_config.menus[]` :
```json
{
  "id": "ai_assistant",
  "href": "/dashboard/chat",
  "icon": "MessageSquare",
  "titleKey": "nav.aiAssistant"
}
```

Rôles concernés (20) :
- agent_ayuntamiento, agent_camara, agent_oms_polyvalent
- agent_min_agricultura, agent_min_comercio, agent_min_electricidad
- agent_min_hacienda, agent_min_informacion, agent_min_turismo
- agent_policia, agent_tesoro
- supervisor_ayuntamiento, supervisor_camara
- supervisor_min_agricultura, supervisor_min_comercio, supervisor_min_electricidad
- supervisor_min_hacienda, supervisor_min_informacion, supervisor_min_turismo
- supervisor_tesoro

i18n :
- es.json : `"nav.aiAssistant": "Asistente IA"`
- fr.json : `"nav.aiAssistant": "Assistant IA"`
- en.json : `"nav.aiAssistant": "AI Assistant"`

---

### Étape 2 : Tools inspection agent terrain (5 tools)

**Fichier** : `packages/backend/app/modules/shared/services/inspection_agent_tools.py` (NOUVEAU)

| # | Tool | Input | SQL Source | Deep? | Scope |
|---|------|-------|-----------|-------|-------|
| 1 | `get_my_inspections_today` | agent_id (auto) | `list_by_agent` (repository) | Non | agent_id |
| 2 | `get_license_info` | nif_or_code (string) | `find_license_by_identifier` (repository) | Non | entity |
| 3 | `get_company_inspection_history` | company_id ou company_name | `list_by_entity` filtered by company | Oui (LLM analyse patterns) | entity + site |
| 4 | `get_my_collection_summary` | agent_id (auto) | `get_unreconciled_cash` (repository) | Non | agent_id |
| 5 | `ai_seal_recommendation` | inspection_id | inspection + obligations + MED + historique | Oui (LLM recommandation) | agent (own inspection) |

Sécurité : `ai_seal_recommendation` = lecture seule. Le chat dit "Je recommande de proposer un scellé pour X raisons" mais l'agent doit cliquer dans l'UI pour exécuter.

---

### Étape 3 : Tools inspection supervisor (3 tools deep reasoning)

| # | Tool | Input | Deep? | Scope |
|---|------|-------|-------|-------|
| 1 | `get_pending_seals_analysis` | entity_id (auto) | Oui — analyse chaque scellé + recommandation | entity + site |
| 2 | `get_zone_compliance_analysis` | entity_id (auto) | Oui — conformité par zone + tendances | entity + site |
| 3 | `predict_inspection_targets` | entity_id (auto) | Oui — scoring risque par entreprise | entity + site |

---

### Étape 4 : Routing par permissions

Dans `chatbot_service_rag.py`, après le merge des tools auth citoyens :

```python
# Inspection tools — basé sur permissions, pas sur nom de rôle
user_permissions = context.get("permissions", [])

if "inspection.view_own" in user_permissions:
    func_decls += INSPECTION_AGENT_FUNC_DECLS
    active_map.update(INSPECTION_AGENT_FUNCTION_MAP)

if "inspection.view_entity" in user_permissions:
    func_decls += INSPECTION_SUPERVISOR_FUNC_DECLS
    active_map.update(INSPECTION_SUPERVISOR_FUNCTION_MAP)
```

Enregistrer dans `tool_registry.py` comme nouveau ToolSet `inspection_agent` et `inspection_supervisor`.

---

## Vérification

| Test | Rôle | Attendu |
|------|------|---------|
| Login agent_ayuntamiento → menu | Agent | "Asistente IA" visible dans le menu |
| "Mis inspecciones de hoy" | Agent terrain | Liste + stats du jour |
| "Verifica la licencia GE-123456" | Agent terrain | Info licence + obligations impayées |
| "Debo proponer un sellado para esta empresa?" | Agent terrain | Analyse IA deep + recommandation |
| Login supervisor_ayuntamiento → menu | Supervisor | "Asistente IA" visible |
| "Sellos pendientes de aprobación" | Supervisor | Analyse IA chaque scellé + recommandation |
| "Qué empresas debemos inspeccionar esta semana?" | Supervisor | Scoring risque IA |
| "Conformidad por zona" | Supervisor | Analyse par zone + tendances |
| Login agent_min_hacienda (pas inspection) | Agent hacienda | Chat visible MAIS pas de tools inspection |
| Message "ignore previous instructions" | Tout rôle | Bloqué par prompt injection detection |
