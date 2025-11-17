# PHASE 3 - MODULE ASSIGNMENT (Assignation Intelligente + Gestion Superviseur)

**Date de création** : 2025-11-16
**Date dernière mise à jour** : 2025-11-17
**Auteur** : Claude Code
**Statut** : ✅ 85% COMPLÉTÉ (Core terminé, Tests + Permissions en attente)
**Priorité** : ⭐⭐⭐⭐ CRITIQUE
**Durée totale** : 4 semaines + 1 semaine (intégration permissions)

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Statut actuel](#statut-actuel)
3. [Architecture implémentée](#architecture-implémentée)
4. [Prochaines étapes](#prochaines-étapes)
5. [Modifications futures - Intégration Permissions](#modifications-futures---intégration-permissions)
6. [Timeline complète](#timeline-complète)

---

## 🎯 VUE D'ENSEMBLE

### **Objectif**

Implémenter un **système d'assignation intelligent** pour gérer l'attribution automatique ou manuelle des déclarations fiscales aux agents DGI et ministériels, avec :
- Auto-assignation basée sur un algorithme multi-critères (6 critères pondérés)
- Règles d'assignation configurables (JSONB-based)
- Gestion de la charge de travail en temps réel
- Notifications multi-canal (Email + Push + In-App)
- Rapports et statistiques (PDF, Excel, Dashboard)

### **Principes**

1. **Intelligent** : Algorithme de scoring sophistiqué (6 critères, score /100)
2. **Configurable** : Règles d'assignation personnalisables par entité
3. **Temps réel** : Suivi live de la charge de travail via triggers PostgreSQL
4. **Auditable** : Historique complet des assignations et réassignations
5. **Scalable** : Architecture modulaire 100% isolée

---

## ✅ STATUT ACTUEL (85% COMPLÉTÉ)

### **✅ TERMINÉ**

| Composant | Fichiers | Lignes | Statut |
|-----------|----------|--------|--------|
| **Structure modulaire** | 9 packages | - | ✅ 100% |
| **Models Pydantic** | 3 fichiers | 780 | ✅ 100% |
| **User model update** | 1 fichier | +4 champs | ✅ 100% |
| **Migrations SQL** | 1 fichier | 450 | ✅ 100% |
| **Repositories** | 3 fichiers | 1,200 | ✅ 100% |
| **Services** | 3 fichiers | 1,600 | ✅ 100% |
| **Notification Service** | 1 fichier | 750 | ✅ 100% |
| **Templates Email** | 1 fichier | 850 | ✅ 100% (Espagnol + HTML) |
| **Report Generator** | 1 fichier | 750 | ✅ 100% |
| **API Routes** | 3 fichiers | 2,050 | ✅ 100% |
| **TOTAL CODE** | **25 fichiers** | **~8,350 lignes** | **✅ 85%** |

### **⏳ EN ATTENTE**

| Composant | Estimation | Priorité | Dépendances |
|-----------|-----------|----------|-------------|
| **Tests unitaires** | 3 jours | Haute | Aucune |
| **Documentation** | 2 jours | Moyenne | Tests |
| **Intégration Permissions** | 3 jours | Haute | Module Permissions créé |
| **Tests E2E** | 2 jours | Haute | Intégration Permissions |

---

## 🏗️ ARCHITECTURE IMPLÉMENTÉE

### **Structure de fichiers**

```
app/modules/assignment/
│
├── __init__.py                         ✅ À MODIFIER (ajouter déclaration permissions)
│
├── models/
│   ├── __init__.py                     ✅
│   ├── assignment_rule.py              ✅ (280 lignes)
│   ├── assignment_history.py           ✅ (240 lignes)
│   └── agent_workload.py               ✅ (260 lignes)
│
├── repositories/
│   ├── __init__.py                     ✅
│   ├── assignment_repository.py        ✅ (400 lignes)
│   ├── workload_repository.py          ✅ (450 lignes)
│   └── rules_repository.py             ✅ (350 lignes)
│
├── services/
│   ├── __init__.py                     ✅
│   ├── rules_engine.py                 ✅ (350 lignes)
│   ├── assignment_service.py           ✅ (400 lignes)
│   ├── auto_assignment_service.py      ✅ (450 lignes)
│   ├── notification_service.py         ✅ (750 lignes)
│   └── report_generator.py             ✅ (750 lignes)
│
├── api/
│   ├── __init__.py                     ✅
│   ├── assignment_routes.py            ✅ (650 lignes) ⚠️ À MODIFIER (decorators)
│   ├── supervisor_routes.py            ✅ (750 lignes) ⚠️ À MODIFIER (decorators)
│   └── statistics_routes.py            ✅ (650 lignes) ⚠️ À MODIFIER (decorators)
│
├── templates/
│   ├── __init__.py                     ✅
│   └── email_templates.py              ✅ (850 lignes - HTML Espagnol)
│
└── tests/                               ⏳ À CRÉER
    ├── test_assignment_service.py
    ├── test_auto_assignment.py
    ├── test_rules_engine.py
    ├── test_workload.py
    └── test_api_routes.py
```

### **Base de données**

#### **Migration 004_assignment_module.sql** ✅

**3 tables créées** :
- `assignment_rules` - Règles configurables (JSONB conditions/actions)
- `assignments` - Historique complet des assignations
- `agent_workloads` - Charge de travail temps réel

**2 triggers créés** :
- `trg_calculate_processing_duration` - Auto-calcul durée traitement
- `trg_update_capacity_percentage` - Auto-calcul capacité %

**2 views créées** :
- `v_available_agents` - Agents disponibles optimisé
- `v_active_assignments` - Assignations actives optimisé

**Modification table users** :
- Ajout 4 colonnes : `supervisor_id`, `department_id`, `specializations`, `max_concurrent_assignments`
- Ajout 2 rôles : `supervisor_dgi`, `supervisor_ministry`

---

## 🔜 PROCHAINES ÉTAPES

### **1. Tests Unitaires (3 jours)**

#### **Test Coverage Requis : >80%**

**Fichiers à créer** :

```python
# tests/test_assignment_repository.py (200 lignes)
- test_create_assignment()
- test_get_by_id()
- test_get_by_agent()
- test_get_active_assignments()
- test_start_processing()
- test_complete()
- test_reassign()
- test_get_agent_stats()

# tests/test_workload_repository.py (250 lignes)
- test_get_or_create()
- test_increment_workload()
- test_decrement_workload()
- test_get_available_agents()
- test_get_workload_balance_report()
- test_get_capacity_forecast()

# tests/test_rules_repository.py (200 lignes)
- test_create_rule()
- test_get_active_rules()
- test_update_rule()
- test_activate_deactivate()
- test_update_stats()
- test_get_effectiveness_report()

# tests/test_rules_engine.py (300 lignes)
- test_evaluate_conditions()
- test_evaluate_single_condition_all_operators()
- test_apply_actions()
- test_evaluate_rule()
- test_find_matching_rules()
- test_merge_filters()

# tests/test_assignment_service.py (250 lignes)
- test_assign_to_agent()
- test_validate_agent_eligibility()
- test_start_processing()
- test_complete_assignment()
- test_reassign_to_new_agent()
- test_cancel_assignment()

# tests/test_auto_assignment_service.py (400 lignes)
- test_auto_assign_declaration()
- test_apply_assignment_rules()
- test_get_eligible_agents()
- test_score_agents()
- test_score_workload()
- test_score_speed()
- test_score_success_rate()
- test_score_specialization()
- test_score_pending_duration()

# tests/test_notification_service.py (300 lignes)
- test_notify_assignment_created()
- test_notify_deadline_approaching()
- test_notify_assignment_reassigned()
- test_notify_workload_alert()
- test_send_email()
- test_send_push()
- test_store_in_app_notification()

# tests/test_report_generator.py (250 lignes)
- test_generate_agent_performance_report()
- test_generate_team_performance_report()
- test_generate_workload_balance_report()
- test_generate_pdf()
- test_generate_excel()
- test_generate_json()
```

**Total estimé** : ~2,150 lignes de tests

---

### **2. Documentation (2 jours)**

**Fichiers à créer** :

```markdown
# README_ASSIGNMENT.md (500 lignes)
- Vue d'ensemble du module
- Architecture
- Algorithme d'auto-assignation
- Guide d'utilisation (superviseur)
- Configuration des règles
- Exemples d'utilisation

# API_ASSIGNMENT.md (800 lignes)
- Documentation complète des 36 endpoints
- Schémas request/response
- Codes d'erreur
- Exemples curl

# RULES_GUIDE.md (400 lignes)
- Comment créer des règles d'assignation
- Syntaxe conditions/actions JSONB
- Exemples de règles complexes
- Best practices

# DEPLOYMENT_ASSIGNMENT.md (300 lignes)
- Guide de déploiement
- Migration 004
- Configuration environnement
- Monitoring et logs
```

**Total estimé** : ~2,000 lignes de documentation

---

## 🔄 MODIFICATIONS FUTURES - INTÉGRATION PERMISSIONS

### **Quand : Après création du Module Permissions (Phase 4)**

### **Impact : ~145 lignes modifiées (7% du code API)**

---

### **Modification 1 : `__init__.py`**

**Fichier** : `app/modules/assignment/__init__.py`
**Impact** : ⚠️ Moyen (ajout ~55 lignes)

```python
# AJOUTER À LA FIN DU FICHIER

from app.modules.permissions.services.permission_registry import PermissionRegistry

# ===========================================================================
# DÉCLARATION DES PERMISSIONS DU MODULE ASSIGNMENT
# ===========================================================================

ASSIGNMENT_PERMISSIONS = [
    # (name, resource, action, description, is_critical)

    # --- Assignations ---
    ("assignment.view", "assignment", "view", "Ver asignaciones", False),
    ("assignment.view_all", "assignment", "view_all", "Ver todas las asignaciones del equipo", False),
    ("assignment.create", "assignment", "create", "Crear asignación manual", False),
    ("assignment.auto_assign", "assignment", "auto_assign", "Ejecutar auto-asignación", False),
    ("assignment.start", "assignment", "start", "Iniciar procesamiento", False),
    ("assignment.complete", "assignment", "complete", "Completar asignación", False),
    ("assignment.reassign", "assignment", "reassign", "Reasignar tarea PENDIENTE", False),
    ("assignment.reassign_in_progress", "assignment", "reassign_in_progress",
     "⚠️ Reasignar tarea EN CURSO", True),  # PERMISSION CRITIQUE
    ("assignment.cancel", "assignment", "cancel", "Cancelar asignación", False),
    ("assignment.update_priority", "assignment", "update_priority", "Modificar prioridad", False),
    ("assignment.extend_deadline", "assignment", "extend_deadline", "Extender fecha límite", False),

    # --- Règles ---
    ("rules.view", "rules", "view", "Ver reglas", False),
    ("rules.create", "rules", "create", "Crear reglas", False),
    ("rules.edit", "rules", "edit", "Editar reglas", False),
    ("rules.activate", "rules", "activate", "Activar/desactivar reglas", False),
    ("rules.delete", "rules", "delete", "⚠️ Eliminar reglas", True),
    ("rules.view_effectiveness", "rules", "view_effectiveness", "Ver reporte eficacia", False),

    # --- Rapports ---
    ("reports.view", "reports", "view", "Ver reportes", False),
    ("reports.generate", "reports", "generate", "Generar reportes", False),
    ("reports.edit", "reports", "edit", "⚠️ Editar reportes", True),
    ("reports.export_pdf", "reports", "export_pdf", "Exportar PDF", False),
    ("reports.export_excel", "reports", "export_excel", "Exportar Excel", False),

    # --- Dashboard ---
    ("dashboard.view", "dashboard", "view", "Ver dashboard", False),
    ("dashboard.team_stats", "dashboard", "team_stats", "Ver estadísticas equipo", False),
    ("dashboard.agent_stats", "dashboard", "agent_stats", "Ver estadísticas agente", False),

    # --- Agents ---
    ("agents.view", "agents", "view", "Ver lista agentes", False),
    ("agents.view_workload", "agents", "view_workload", "Ver carga trabajo", False),
    ("agents.view_performance", "agents", "view_performance", "Ver rendimiento", False),
]

# Enregistrement automatique
PermissionRegistry.register_module_permissions("assignment", ASSIGNMENT_PERMISSIONS)
```

---

### **Modification 2 : `assignment_routes.py`**

**Fichier** : `app/modules/assignment/api/assignment_routes.py`
**Impact** : ⚠️ Faible (~40 lignes sur 650 = 6%)

**Changements à appliquer** :

1. **Ajouter import** (ligne ~10)
```python
from app.modules.permissions.middleware.permission_middleware import require_permission
```

2. **Supprimer fonction** (lignes ~90-98)
```python
# SUPPRIMER check_supervisor_permission()
# SUPPRIMER check_agent_permission()
```

3. **Ajouter decorators** (11 endpoints)

| Ligne | Endpoint | Decorator à ajouter |
|-------|----------|---------------------|
| ~130 | POST /manual | `@require_permission("assignment.create")` |
| ~170 | POST /auto | `@require_permission("assignment.auto_assign")` |
| ~280 | PUT /{id}/start | `@require_permission("assignment.start")` |
| ~320 | PUT /{id}/complete | `@require_permission("assignment.complete")` |
| ~370 | PUT /{id}/reassign | `@require_permission("assignment.reassign")` + vérification granulaire |
| ~420 | DELETE /{id} | `@require_permission("assignment.cancel")` |
| ~450 | PATCH /{id}/priority | `@require_permission("assignment.update_priority")` |
| ~480 | PATCH /{id}/deadline | `@require_permission("assignment.extend_deadline")` |

4. **Ajouter vérification granulaire pour réassignation** (ligne ~370)
```python
@router.put("/{assignment_id}/reassign", response_model=Assignment)
@require_permission("assignment.reassign")  # Permission de base
async def reassign_assignment(
    assignment_id: UUID,
    request: ReassignmentRequest,
    current_user: UserResponse = Depends(get_current_user),
    service: AssignmentService = Depends(get_assignment_service_dep)
):
    """Reassign declaration to a new agent (Supervisor only)"""

    # Récupérer assignment
    assignment = await service.assignment_repo.get_by_id(assignment_id)

    # ⚠️ Si tâche EN COURS, permission spéciale requise
    if assignment.status == "in_progress":
        from app.modules.permissions.services.permission_service import has_permission

        if not await has_permission(current_user.id, "assignment.reassign_in_progress"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Permission denegada: No puede reasignar una tarea EN CURSO. "
                    "Contacte a su administrador para obtener este permiso."
                )
            )

    # Continuer réassignation...
    new_assignment = await service.reassign_to_new_agent(...)
    return new_assignment
```

**Résumé modifications** :
- 1 import ajouté
- 2 fonctions supprimées (~10 lignes)
- 11 decorators ajoutés (~11 lignes)
- 1 vérification granulaire ajoutée (~15 lignes)
- **Total : ~40 lignes modifiées/ajoutées**

---

### **Modification 3 : `supervisor_routes.py`**

**Fichier** : `app/modules/assignment/api/supervisor_routes.py`
**Impact** : ⚠️ Faible (~30 lignes sur 750 = 4%)

**Changements** :

1. Ajouter import `require_permission`
2. Supprimer `check_supervisor_permission()`
3. Ajouter decorators sur 15 endpoints

| Endpoint | Decorator |
|----------|-----------|
| GET /dashboard | `@require_permission("dashboard.view")` |
| GET /agents | `@require_permission("agents.view")` |
| GET /agents/{id}/stats | `@require_permission("agents.view_performance")` |
| GET /agents/{id}/forecast | `@require_permission("agents.view_workload")` |
| GET /workload/balance | `@require_permission("agents.view_workload")` |
| POST /rules | `@require_permission("rules.create")` |
| GET /rules | `@require_permission("rules.view")` |
| GET /rules/{id} | `@require_permission("rules.view")` |
| PUT /rules/{id} | `@require_permission("rules.edit")` |
| POST /rules/{id}/activate | `@require_permission("rules.activate")` |
| POST /rules/{id}/deactivate | `@require_permission("rules.activate")` |
| DELETE /rules/{id} | `@require_permission("rules.delete")` |
| GET /rules/effectiveness/report | `@require_permission("rules.view_effectiveness")` |

**Total : ~30 lignes modifiées**

---

### **Modification 4 : `statistics_routes.py`**

**Fichier** : `app/modules/assignment/api/statistics_routes.py`
**Impact** : ⚠️ Faible (~20 lignes sur 650 = 3%)

**Changements similaires** : Decorators sur 10 endpoints

**Total : ~20 lignes modifiées**

---

### **Résumé des modifications futures**

| Fichier | Lignes actuelles | Lignes à modifier | % Impact | Timing |
|---------|------------------|-------------------|----------|--------|
| `__init__.py` | 5 | +55 | Addition | Jour 9 (Phase 4) |
| `assignment_routes.py` | 650 | ~40 | 6% | Jour 10 (Phase 4) |
| `supervisor_routes.py` | 750 | ~30 | 4% | Jour 10 (Phase 4) |
| `statistics_routes.py` | 650 | ~20 | 3% | Jour 10 (Phase 4) |
| **TOTAL** | **2,055** | **~145** | **7%** | **2 jours** |

**Impact global** : Très faible, modifications localisées, aucune régression

---

## 📅 TIMELINE COMPLÈTE

### **✅ Semaines 1-4 : Implémentation Core** (TERMINÉ)

- ✅ Semaine 1 : Structure + Models + Migrations
- ✅ Semaine 2 : Repositories + Services
- ✅ Semaine 3 : API Routes + Notifications
- ✅ Semaine 4 : Report Generator + Templates Email

**Statut** : 85% complété (8,350 lignes)

---

### **⏳ Semaine 5 : Tests + Documentation** (EN COURS)

#### **Jour 1-3 : Tests Unitaires**

- [ ] Créer tests repositories (650 lignes)
- [ ] Créer tests services (950 lignes)
- [ ] Créer tests notification/reports (550 lignes)
- [ ] Atteindre >80% coverage
- [ ] Valider tous les tests passent

#### **Jour 4-5 : Documentation**

- [ ] Rédiger README_ASSIGNMENT.md
- [ ] Rédiger API_ASSIGNMENT.md
- [ ] Rédiger RULES_GUIDE.md
- [ ] Rédiger DEPLOYMENT_ASSIGNMENT.md

---

### **⏳ Semaine 6 : Intégration Permissions** (APRÈS Phase 4)

**Pré-requis** : Module Permissions créé (Phase 4 - Semaine 1)

#### **Jour 1 : Déclaration permissions**

- [ ] Modifier `__init__.py` (ajouter ASSIGNMENT_PERMISSIONS)
- [ ] Vérifier sync vers DB (29 permissions créées)

#### **Jour 2 : Modification routes**

- [ ] Modifier `assignment_routes.py` (decorators + vérification granulaire)
- [ ] Modifier `supervisor_routes.py` (decorators)
- [ ] Modifier `statistics_routes.py` (decorators)
- [ ] Supprimer fonctions `check_*_permission()`

#### **Jour 3 : Tests intégration**

- [ ] Tester tous endpoints avec permissions
- [ ] Tester cas limite (403, permissions expirées, etc.)
- [ ] Valider vérification granulaire réassignation

---

## 🔗 FICHIERS LIÉS

- `PHASE_4_PERMISSIONS_MODULE.md` - Plan complet du module Permissions
- `PHASE_2_CORE_BACKEND.md` - Plan général backend
- Migration `004_assignment_module.sql` - Migration Assignment (créée)
- Migration `005_permissions_module.sql` - Migration Permissions (à créer)

---

**Date dernière mise à jour** : 2025-11-17
**Prochaine révision** : Après Tests + Documentation (Semaine 5)
**Responsable** : Claude Code
