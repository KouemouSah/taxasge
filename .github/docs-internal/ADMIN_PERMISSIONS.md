# Admin Permissions - Système de Droits Centralisés

## Vue d'ensemble

Le système TaxasGE utilise un **système de permissions granulaires** avec **auto-approbation automatique pour les admins**.

### Principe Fondamental

**Les administrateurs (`role = "admin"`) ont AUTOMATIQUEMENT TOUS les droits sur TOUS les modules.**

Aucune configuration supplémentaire n'est nécessaire. Le système vérifie automatiquement si l'utilisateur est admin avant de vérifier les permissions granulaires.

## Architecture du Système

### 1. Niveaux de Contrôle d'Accès

```
┌─────────────────────────────────────────────────┐
│ Niveau 1: Vérification Admin                    │
│ ➜ Si user.role == "admin" → Accès TOTAL        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Niveau 2: Permissions Granulaires               │
│ ➜ Vérification dans tables:                    │
│   - user_permissions                            │
│   - role_permissions                            │
└─────────────────────────────────────────────────┘
```

### 2. Services Impliqués

**AdminPermissionService** (`app/modules/admin/services/admin_permission_service.py`)
- Définit toutes les permissions par module
- Fournit les fonctions de vérification admin
- Liste les capacités admin

**PermissionService** (`app/modules/permissions/services/permission_service.py`)
- **MODIFIÉ** pour vérifier automatiquement si user est admin
- Si admin → retourne `True` pour TOUTE permission
- Sinon → vérifie permissions normales

**Middleware** (`app/modules/permissions/middleware/permission_middleware.py`)
- Décorateurs: `@require_permission()`, `@require_any_permission()`, `@require_all_permissions()`
- Utilisent PermissionService (donc bénéficient de l'auto-approbation admin)

## Permissions par Module

### USERS (Gestion Utilisateurs)
```
users.view              - Voir les utilisateurs
users.create            - Créer des utilisateurs (sauf citizen/business)
users.update            - Modifier les utilisateurs
users.delete            - Supprimer les utilisateurs
users.manage_roles      - Changer les rôles
users.reset_password    - Réinitialiser mots de passe
users.unlock_account    - Débloquer les comptes
```

### COMPANIES (Gestion Entreprises)
```
companies.view              - Voir les entreprises
companies.create            - Créer des entreprises
companies.update            - Modifier les entreprises
companies.delete            - Supprimer les entreprises
companies.manage_members    - Gérer les membres
companies.view_all          - Voir toutes les entreprises
```

### AGENTS (Agents Ministériels)
```
agents.view                 - Voir les agents
agents.create               - Créer des agents
agents.update               - Modifier des agents
agents.deactivate           - Désactiver des agents
agents.manage_assignments   - Gérer les affectations
agents.view_performance     - Voir les performances
agents.manage_workload      - Gérer la charge de travail
```

### ASSIGNMENTS (Affectations)
```
assignments.view                      - Voir les affectations
assignments.create                    - Créer des affectations
assignments.update                    - Modifier des affectations
assignments.delete                    - Supprimer des affectations
assignments.reassign                  - Réaffecter
assignments.reassign_in_progress      - Réaffecter en cours (CRITIQUE)
assignments.escalate                  - Escalader
assignments.view_all                  - Voir toutes les affectations
```

### DECLARATIONS (Déclarations Fiscales)
```
declarations.view          - Voir les déclarations
declarations.create        - Créer des déclarations
declarations.update        - Modifier des déclarations
declarations.delete        - Supprimer des déclarations
declarations.approve       - Approuver des déclarations
declarations.reject        - Rejeter des déclarations
declarations.view_all      - Voir toutes les déclarations
declarations.export        - Exporter des déclarations
```

### PAYMENTS (Paiements)
```
payments.view         - Voir les paiements
payments.create       - Créer des paiements
payments.update       - Modifier des paiements
payments.delete       - Supprimer des paiements
payments.process      - Traiter des paiements
payments.refund       - Rembourser
payments.view_all     - Voir tous les paiements
payments.export       - Exporter des paiements
```

### DOCUMENTS (Gestion Documents)
```
documents.view        - Voir les documents
documents.upload      - Uploader des documents
documents.delete      - Supprimer des documents
documents.download    - Télécharger des documents
documents.view_all    - Voir tous les documents
```

### AUDIT (Audit Trail)
```
audit.view      - Voir les logs d'audit
audit.export    - Exporter les logs
audit.cleanup   - Nettoyer les anciens logs
```

### SYSTEM (Configuration Système)
```
system.view_config        - Voir la configuration
system.update_config      - Modifier la configuration
system.manage_rules       - Gérer les règles système
system.run_migrations     - Exécuter des migrations
system.view_diagnostics   - Voir les diagnostics
system.maintenance        - Maintenance système
```

### WEBHOOKS (Webhooks)
```
webhooks.view      - Voir les webhooks
webhooks.create    - Créer des webhooks
webhooks.update    - Modifier des webhooks
webhooks.delete    - Supprimer des webhooks
webhooks.test      - Tester des webhooks
```

### REPORTS (Rapports)
```
reports.view       - Voir les rapports
reports.create     - Créer des rapports
reports.export     - Exporter des rapports
reports.schedule   - Planifier des rapports
```

## Utilisation dans le Code

### 1. Dans les Routes API

```python
from fastapi import APIRouter, Depends
from app.modules.permissions.middleware.permission_middleware import require_permission
from app.modules.auth.middleware.auth_middleware import get_current_user

router = APIRouter()

@router.delete("/companies/{company_id}")
@require_permission("companies.delete")  # Admin auto-approuvé ✅
async def delete_company(
    company_id: str,
    current_user = Depends(get_current_user),
):
    # Si user est admin, il passe automatiquement
    # Sinon, vérification normale des permissions
    ...
```

### 2. Vérification Manuelle

```python
from app.modules.admin.services import get_admin_permission_service

admin_service = get_admin_permission_service()

# Vérifier si user est admin
if admin_service.is_admin(user.role):
    # User a tous les droits
    ...
```

### 3. Vérification dans les Services

```python
from app.modules.permissions.services import get_permission_service

permission_service = get_permission_service()

# Vérifie automatiquement si admin
has_perm = await permission_service.has_permission(user_id, "declarations.approve")
# Si admin → True
# Sinon → vérifie permissions normales
```

## Capacités Exclusives Admin

Les admins ont accès à des fonctionnalités que **seuls eux** peuvent faire:

1. ✅ **Créer des utilisateurs** (tous rôles sauf citizen/business)
2. ✅ **Supprimer des utilisateurs**
3. ✅ **Changer les rôles utilisateurs**
4. ✅ **Réinitialiser les mots de passe**
5. ✅ **Débloquer les comptes**
6. ✅ **Voir TOUTES les déclarations** (tous utilisateurs)
7. ✅ **Voir TOUS les paiements**
8. ✅ **Gérer les règles système**
9. ✅ **Exécuter des migrations de base de données**
10. ✅ **Voir les diagnostics système**
11. ✅ **Gérer les logs d'audit**
12. ✅ **Accorder/Révoquer des permissions**
13. ✅ **Créer/Supprimer des entreprises**
14. ✅ **Gérer les agents ministériels**
15. ✅ **Réaffecter des affectations en cours** (critique)
16. ✅ **Exporter toutes les données**
17. ✅ **Opérations de maintenance système**

## Tables de Base de Données

### Permissions
```sql
-- Table: permissions
-- Définit toutes les permissions disponibles
id, name, resource, action, description, is_critical, module_name

-- Exemple:
name: "assignments.reassign_in_progress"
resource: "assignment"
action: "reassign_in_progress"
is_critical: true
```

### User Permissions
```sql
-- Table: user_permissions
-- Permissions spécifiques accordées aux utilisateurs non-admin
user_id, permission_id, granted, granted_by, granted_at, expires_at

-- Note: Les admins n'ont PAS besoin d'entrées ici
-- Ils ont TOUTES les permissions automatiquement
```

### Roles
```sql
-- Table: roles
-- Rôles système et personnalisés
id, name, code, entity_type, is_system

-- Rôles système (is_system = true):
-- - citizen
-- - business
-- - accountant
-- - admin
-- - supervisor
-- - dgi_agent
-- - ministry_agent
```

## Règles de Sécurité

### ⚠️ IMPORTANT: Restrictions Admin

Même les admins ont certaines restrictions:

1. **Ne peuvent PAS créer citizen/business**
   - Ces rôles doivent s'enregistrer via `/api/auth/register`
   - Validation dans `UserRepository.create()`

2. **Ne peuvent PAS supprimer d'autres admins**
   - Protection contre la suppression accidentelle
   - Validation dans routes de suppression

3. **Ne peuvent PAS dégrader d'autres admins**
   - Un admin ne peut pas changer le rôle d'un autre admin
   - Validation dans `UserService.validate_role_change()`

### ✅ Bonnes Pratiques

1. **Utiliser les décorateurs** plutôt que les vérifications manuelles
2. **Logger les actions admin** via audit trail
3. **Documenter les permissions critiques** (`is_critical = true`)
4. **Éviter de court-circuiter** les permissions dans le code

## Migration depuis Ancien Système

Si vous avez du code qui utilisait:

```python
# ❌ Ancien code
if current_user.role != "admin":
    raise HTTPException(403)
```

Remplacer par:

```python
# ✅ Nouveau code
@require_permission("resource.action")
```

L'admin sera automatiquement auto-approuvé, et le système est maintenant extensible pour d'autres rôles.

## Support et Questions

Pour toute question sur les permissions:
1. Consulter `AdminPermissionService.get_permissions_summary()`
2. Consulter `AdminPermissionService.get_admin_capabilities()`
3. Vérifier les logs avec `logger.debug()` pour voir les permissions vérifiées

## Résumé

**🔑 Point Clé:** Les admins ont AUTOMATIQUEMENT tous les droits. Le système de permissions granulaires est pour les autres rôles. Aucune configuration manuelle nécessaire pour les admins.
