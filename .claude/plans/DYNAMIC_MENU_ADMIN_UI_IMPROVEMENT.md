# Plan: Amélioration Admin UI - Gestion Dynamique des Menus

**Version**: 1.1
**Date**: 2026-01-31
**Statut**: PHASE 1 TERMINÉE - PHASE 2 EN ATTENTE

---

## Contexte et Objectif

### Problème Actuel
L'administration des menus de dashboard agent nécessite actuellement:
- Édition JSON brute sans interface visuelle
- Navigation entre 5+ pages sans guidance
- Pas de preview du rendu
- Pas de personnalisation du PendingPage sans code

### Objectif
Permettre à un administrateur non-technique de:
1. Configurer les menus visuellement (sans écrire du JSON)
2. Voir un aperçu en temps réel
3. Personnaliser l'affichage des pages (colonnes, sections)
4. Être guidé dans le processus de configuration

---

## Architecture Actuelle (À Préserver)

### Tables DB Existantes
| Table | Colonnes Clés | Usage |
|-------|---------------|-------|
| `roles` | `id`, `code`, `name`, `menu_config` (JSONB), `dashboard_config` (JSONB), `entity_type` | Configuration par rôle |
| `workflow_menu_mapping` | `id`, `workflow_pattern`, `menu_group_id`, `menu_title_key`, `menu_icon`, `include_pending`, `include_validation`, `include_appointments`, `include_history`, `display_order`, `is_active`, `permission_prefix` | Règles de génération auto |
| `entities` | `id`, `code`, `name`, `workflow_codes` (JSONB array) | Entités avec leurs workflows |
| `agent_profiles` | `menu_overrides` (JSONB), `dashboard_overrides` (JSONB) | Overrides par agent |

### API Endpoints Existants
| Endpoint | Méthode | Description | Fichier |
|----------|---------|-------------|---------|
| `/menu-config/me` | GET | Menu de l'agent connecté | `menu_config_routes.py` |
| `/menu-config/workflow-mappings` | GET | Liste mappings (admin) | `menu_config_routes.py` |
| `/menu-config/workflow-mappings` | POST | Créer mapping | `menu_config_routes.py` |
| `/menu-config/workflow-mappings/{id}` | PUT | Modifier mapping | `menu_config_routes.py` |
| `/menu-config/workflow-mappings/{id}` | DELETE | Supprimer mapping | `menu_config_routes.py` |
| `/roles/{id}` | GET | Détails rôle | `roles_routes.py` |
| `/roles/{id}` | PUT | Modifier rôle | `roles_routes.py` |
| `/roles/{id}/menu-config` | GET | Menu config du rôle | `roles_routes.py` |
| `/roles/{id}/menu-config` | PUT | Modifier menu config | `roles_routes.py` |

### Pages Admin Existantes
| Page | Chemin | Fonction |
|------|--------|----------|
| Menu Config | `/admin/menu-config` | Liste workflow mappings |
| Nouveau Mapping | `/admin/workflow-mappings/new` | Créer mapping |
| Éditer Mapping | `/admin/workflow-mappings/[id]` | Modifier mapping |
| Détail Rôle | `/admin/roles/[id]` | Voir/éditer rôle + permissions |
| Menu Config Rôle | `/admin/roles/[id]/menu-config` | Éditeur JSON (à améliorer) |
| Entités | `/admin/entities` | CRUD entités + workflow_codes |

### Permissions Existantes
| Permission | Description |
|------------|-------------|
| `admin.menu.read` | Voir configurations menu |
| `admin.menu.create` | Créer mapping |
| `admin.menu.update` | Modifier mapping/config |
| `admin.menu.delete` | Supprimer mapping |
| `roles.read` | Voir rôles |
| `roles.update` | Modifier rôles |

---

## PHASE 1: Améliorer `/roles/[id]/menu-config` ✅ TERMINÉE

### Objectif
Remplacer l'éditeur JSON brut par une interface visuelle avec preview.

### Pré-requis à Vérifier (CHECKLIST PRÉ-IMPLÉMENTATION)

#### Backend - Endpoints à Confirmer
- [x] `GET /roles/{role_id}` retourne `menu_config`, `dashboard_config`
- [x] `PUT /roles/{role_id}/menu-config` accepte `{ menu_config: object, dashboard_config: object }`
- [x] `GET /permissions` retourne liste complète avec `id`, `name`, `module_name`
- [x] `GET /menu-config/workflow-mappings` fonctionne pour preview génération auto

#### Frontend - Fichiers à Modifier
- [x] Existe: `packages/web/src/app/[locale]/(dashboard)/dashboard/admin/roles/[id]/menu-config/page.tsx`
- [x] Existe: `packages/web/src/modules/admin/hooks/useRoleMenuConfig.ts`
- [x] Existe: `packages/web/src/modules/roles-admin/hooks/useRoles.ts`

#### Types TypeScript à Vérifier
- [x] `RoleMenuConfigResponse` dans `useRoleMenuConfig.ts`
- [x] `DynamicMenuItem`, `SubMenuItem` dans `menu-config.ts`
- [x] `Permission` dans `permissions-admin/types`

#### Icônes Disponibles (Lucide)
- [x] Lister toutes les icônes utilisées dans `entity-menus.ts` et `GenericAgentSidebar.tsx`
- [x] Créer mapping `iconName: string → LucideIcon` (via `getAvailableIcons()` et `getIconComponent()`)

### Implémentation ✅ COMPLÉTÉE

#### 1.1 Créer composant `MenuBuilder.tsx` ✅
```
packages/web/src/modules/admin/components/menu-builder/
├── MenuBuilder.tsx           # ✅ Composant principal avec mode Auto/Manuel
├── MenuItemEditor.tsx        # ✅ Éditeur d'un item (groupe ou lien)
├── IconSelector.tsx          # ✅ Sélecteur d'icônes visuel avec catégories
├── PermissionSelector.tsx    # ✅ Sélecteur de permissions groupé par module
├── MenuPreview.tsx           # ✅ Preview du sidebar (desktop/mobile)
├── types.ts                  # ✅ Types MenuItem, MenuSubItem, validation
└── index.ts                  # ✅ Exports
```

#### 1.2 Mise à jour page menu-config ✅
- `packages/web/src/app/[locale]/(dashboard)/dashboard/admin/roles/[id]/menu-config/page.tsx`
  - Intégration de MenuBuilder dans l'onglet "Menu Config"
  - Conservation des onglets Dashboard Config et UI Config avec JSON editor
  - Gestion état isDirty pour save/reset

#### 1.2 Fonctionnalités
- Liste des menus avec drag-and-drop (réordonner)
- Ajouter/supprimer menu ou sous-menu
- Éditer: id, titre (i18n key), href, icône, permission
- Toggle: "Génération automatique" vs "Configuration manuelle"
- Preview sidebar en temps réel (droite)
- Bouton "Voir JSON" pour debug
- Validation avant sauvegarde

#### 1.3 Structure de données (existante à respecter)
```typescript
// Structure menu_config dans roles.menu_config
{
  "menus": [
    {
      "id": "dashboard",
      "href": "/dashboard/agent/treasury",
      "icon": "LayoutDashboard",
      "titleKey": "agent.nav.dashboard"
    },
    {
      "id": "payments",
      "icon": "CreditCard",
      "titleKey": "agent.nav.payments",
      "items": [
        {
          "id": "validation",
          "href": "/dashboard/agent/treasury/validation",
          "icon": "CheckCircle",
          "titleKey": "agent.nav.validation",
          "permission": "treasury.validate_payment"
        }
      ]
    }
  ],
  "source": "role",
  "version": "1.0"
}
```

### Checklist Validation Phase 1 (À TESTER MANUELLEMENT)

#### Fonctionnel (Code Implémenté ✅)
- [x] L'interface charge correctement le menu_config existant (via parseMenuConfig)
- [x] On peut ajouter un nouveau menu (groupe ou lien) via boutons Link/Group
- [x] On peut supprimer un menu (via MenuItemEditor trash icon)
- [x] On peut réordonner les menus par boutons up/down (drag-drop non implémenté)
- [x] On peut éditer: id, titleKey, href, icon, permission (via MenuItemEditor)
- [x] Le sélecteur d'icônes affiche toutes les icônes disponibles (via getAvailableIcons)
- [x] Le sélecteur de permissions liste les permissions existantes (via usePermissions)
- [x] Le preview se met à jour en temps réel (MenuPreview)
- [x] Le toggle "Auto/Manuel" fonctionne (avec confirmation dialog)
- [x] La sauvegarde envoie le JSON correct à l'API (menuConfigToJson)
- [x] Les erreurs de validation sont affichées clairement (validateMenuConfig)
- [x] Le bouton "Voir JSON" affiche le JSON formaté (Sheet overlay)

#### Non-régression (À VÉRIFIER)
- [ ] Les menus existants (agent_tesoro, agent_policia) s'affichent correctement
- [ ] La sauvegarde n'écrase pas dashboard_config ou ui_config
- [ ] Le sidebar agent affiche toujours le menu correctement après modification

#### Tests Manuels (À EXÉCUTER)
- [ ] Test: Charger rôle avec menu_config NULL (auto)
- [ ] Test: Charger rôle avec menu_config JSON (manuel)
- [ ] Test: Basculer de auto → manuel
- [ ] Test: Basculer de manuel → auto (reset to NULL)
- [ ] Test: Ajouter menu groupe + sous-items
- [ ] Test: Supprimer menu avec confirmation
- [ ] Test: Erreur API gérée proprement

---

## PHASE 2: Améliorer `/admin/entities` - Lien avec Mappings

### Objectif
Afficher les mappings existants pour les workflows d'une entité et guider vers la création si manquant.

### Pré-requis à Vérifier (CHECKLIST PRÉ-IMPLÉMENTATION)

#### Backend
- [ ] `GET /menu-config/workflow-mappings` peut filtrer par `workflow_pattern`
- [ ] Ou créer endpoint: `GET /menu-config/workflow-mappings/check?patterns=PASAPORTE_%,CONDUCIR_%`

#### Frontend
- [ ] Existe: `packages/web/src/app/[locale]/(dashboard)/dashboard/admin/entities/components/EntitiesTabContent.tsx`
- [ ] Hook `useWorkflows` retourne les workflows avec `code`

#### Données
- [ ] Requête pour lister tous les `workflow_pattern` de `workflow_menu_mapping`

### Implémentation

#### 2.1 Dans le formulaire Entity (création/édition)
Sous la sélection des workflow_codes, ajouter:

```
Workflows sélectionnés:
┌──────────────────────────────────────────────────────────────┐
│ ✓ PASAPORTE_NUEVO          → Mapping: pasaportes ✓          │
│ ✓ PASAPORTE_RENOVACION     → Mapping: pasaportes ✓          │
│ ✓ CERTIFICADO_ANTECEDENTES → Mapping: ⚠️ Non trouvé         │
│                              [Créer mapping]                 │
└──────────────────────────────────────────────────────────────┘
```

#### 2.2 Indicateur de couverture
Badge dans la liste des entités:
- 🟢 "5/5 mappings" = tous les workflows ont un mapping
- 🟡 "3/5 mappings" = certains manquent
- 🔴 "0/5 mappings" = aucun mapping

### Checklist Validation Phase 2

#### Fonctionnel
- [ ] Pour chaque workflow_code, on voit si un mapping existe
- [ ] Le matching utilise le pattern SQL LIKE (PASAPORTE_% match PASAPORTE_NUEVO)
- [ ] Lien "Créer mapping" ouvre `/admin/workflow-mappings/new` avec pattern pré-rempli
- [ ] Badge de couverture affiché dans la liste

#### Non-régression
- [ ] Le CRUD entités fonctionne toujours
- [ ] Pas de requêtes excessives (mise en cache des mappings)

---

## PHASE 3: Table `workflow_display_config` pour PendingPage

### Objectif
Permettre de personnaliser les colonnes et sections du PendingPage par workflow sans code.

### Pré-requis à Vérifier (CHECKLIST PRÉ-IMPLÉMENTATION)

#### Backend - Table à Créer
```sql
-- Vérifier que la table N'EXISTE PAS déjà
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'workflow_display_config';
```

#### Frontend - Composants PendingPage Existants
- [ ] `PendingPage.tsx` - props: `entityCode`, `action`
- [ ] `RequestList.tsx` - colonnes actuelles: reference, fullName, createdAt, priority
- [ ] `RequestPreview.tsx` - sections: RequestInfoSection, ExtractedDataSection, DocumentsSection, ContactSection, AppointmentSection
- [ ] Vérifier que ces composants peuvent recevoir config dynamique

#### Sections Réutilisables (à documenter)
| Section ID | Composant | Props Requises |
|------------|-----------|----------------|
| `info` | `RequestInfoSection` | reference, workflowLabel, solicitudType, motivo, priority, status, slaStatus, slaRemainingHours, isMinor |
| `extractedData` | `ExtractedDataSection` | data, isMinor, solicitudType |
| `documents` | `DocumentsSection` | documents, documentsCount, requestId |
| `contact` | `ContactSection` | name, email, phone |
| `appointment` | `AppointmentSection` | appointment, requestId, entityCode |

### Implémentation

#### 3.1 Migration SQL
```sql
-- Migration: xxx_create_workflow_display_config.sql
CREATE TABLE workflow_display_config (
    id SERIAL PRIMARY KEY,
    workflow_pattern VARCHAR(50) NOT NULL UNIQUE,

    -- Configuration liste (colonnes à afficher)
    list_columns JSONB NOT NULL DEFAULT '["reference", "fullName", "createdAt", "priority"]',

    -- Configuration preview (sections à afficher)
    preview_sections JSONB NOT NULL DEFAULT '["info", "extractedData", "documents", "contact", "appointment"]',

    -- Labels personnalisés (optionnel)
    labels JSONB DEFAULT '{}',

    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_workflow_display_config_pattern ON workflow_display_config(workflow_pattern);
CREATE INDEX idx_workflow_display_config_active ON workflow_display_config(is_active);

-- Trigger updated_at
CREATE TRIGGER tr_workflow_display_config_updated_at
    BEFORE UPDATE ON workflow_display_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Données initiales
INSERT INTO workflow_display_config (workflow_pattern, list_columns, preview_sections, labels) VALUES
('PASAPORTE_%',
 '["reference", "fullName", "passportType", "createdAt", "priority"]',
 '["info", "extractedData", "documents", "contact", "appointment"]',
 '{"title": "Solicitud de Pasaporte"}'),
('VEHICULO_%',
 '["reference", "owner", "plateNumber", "vehicleType", "createdAt"]',
 '["info", "extractedData", "documents", "contact"]',
 '{"title": "Solicitud de Vehículo"}'),
('CONDUCIR_%',
 '["reference", "fullName", "licenseType", "createdAt", "priority"]',
 '["info", "extractedData", "documents", "contact", "appointment"]',
 '{"title": "Solicitud de Licencia"}');
```

#### 3.2 Backend - Endpoints
```python
# menu_config_routes.py (ajouter)

@router.get("/display-config")
async def list_display_configs(...) -> List[WorkflowDisplayConfig]:
    """Liste toutes les configurations d'affichage"""

@router.get("/display-config/{workflow_pattern}")
async def get_display_config(...) -> WorkflowDisplayConfig:
    """Obtenir config pour un pattern (avec fallback default)"""

@router.post("/display-config")
async def create_display_config(...) -> WorkflowDisplayConfig:
    """Créer configuration"""

@router.put("/display-config/{id}")
async def update_display_config(...) -> WorkflowDisplayConfig:
    """Modifier configuration"""

@router.delete("/display-config/{id}")
async def delete_display_config(...) -> None:
    """Supprimer configuration"""
```

#### 3.3 Frontend - Page Admin
```
packages/web/src/app/[locale]/(dashboard)/dashboard/admin/menu-config/display/page.tsx
```

Interface:
- Liste des configurations par pattern
- Éditeur avec drag-and-drop pour colonnes et sections
- Preview du rendu

#### 3.4 Frontend - Modifier PendingPage
```typescript
// Dans useEntityServiceRequests ou nouveau hook
const { displayConfig } = useWorkflowDisplayConfig(workflowCode);

// RequestList reçoit: listColumns={displayConfig.list_columns}
// RequestPreview reçoit: previewSections={displayConfig.preview_sections}
```

### Checklist Validation Phase 3

#### Backend
- [ ] Migration exécutée sans erreur
- [ ] Table workflow_display_config créée
- [ ] Endpoints CRUD fonctionnels
- [ ] Endpoint GET retourne config par défaut si pattern non trouvé

#### Frontend Admin
- [ ] Page `/admin/menu-config/display` accessible
- [ ] Liste des configurations affichée
- [ ] Création de config fonctionne
- [ ] Édition avec drag-and-drop fonctionne
- [ ] Suppression avec confirmation

#### Frontend PendingPage
- [ ] Colonnes de liste dynamiques selon config
- [ ] Sections de preview dynamiques selon config
- [ ] Fallback si config non trouvée (colonnes/sections par défaut)
- [ ] Cache invalidé quand config modifiée

#### Non-régression
- [ ] PendingPage existant fonctionne toujours
- [ ] Pas d'erreur si workflow sans config (utilise default)

---

## PHASE 4: Wizard de Configuration (Optionnel)

### Objectif
Guider l'administrateur étape par étape pour configurer un nouveau dashboard agent.

### Pré-requis à Vérifier
- [ ] Phases 1, 2, 3 complétées et validées
- [ ] Tous les endpoints nécessaires existent

### Implémentation
Page `/admin/setup-agent-dashboard` avec étapes:
1. Sélectionner/créer entité
2. Configurer workflows
3. Vérifier/créer mappings
4. Créer/sélectionner rôle
5. Configurer permissions
6. Preview final

### Checklist Validation Phase 4
- [ ] Navigation entre étapes fonctionne
- [ ] Données persistées entre étapes
- [ ] Peut revenir en arrière
- [ ] Preview final montre le menu généré
- [ ] Bouton "Terminer" crée toutes les ressources

---

## Patterns de Vérification (À Utiliser Avant Chaque Phase)

### Pattern: Vérifier Endpoint Existe
```bash
# Vérifier que l'endpoint existe et retourne le bon format
curl -X GET "http://localhost:8000/api/v1/ENDPOINT" -H "Authorization: Bearer TOKEN"
```

### Pattern: Vérifier Table/Colonne Existe
```sql
-- Vérifier table
SELECT table_name FROM information_schema.tables WHERE table_name = 'TABLE_NAME';

-- Vérifier colonnes
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'TABLE_NAME';
```

### Pattern: Vérifier Fichier Frontend Existe
```bash
ls -la packages/web/src/PATH/TO/FILE.tsx
```

### Pattern: Vérifier Hook Existe et Exports
```typescript
// Dans le fichier, vérifier les exports
export function useHookName() { ... }
export type TypeName = { ... }
```

### Pattern: Vérifier Permission Existe
```sql
SELECT name, description FROM permissions WHERE name = 'permission.name';
```

---

## Notes Techniques

### Icônes Lucide Disponibles (Liste Non-Exhaustive)
```
LayoutDashboard, Menu, Settings, Users, Shield, Key, Lock,
FileText, Folder, Clock, Calendar, CheckCircle, XCircle,
AlertCircle, AlertTriangle, Info, HelpCircle,
CreditCard, Wallet, DollarSign, Receipt,
Plane, Car, Truck, Globe, Building, Home,
Search, Filter, RefreshCw, Download, Upload,
ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
Plus, Minus, Edit, Trash2, Save, X, Check
```

### Structure menu_config JSON
```json
{
  "menus": [
    {
      "id": "string (unique)",
      "titleKey": "string (i18n key)",
      "icon": "string (Lucide icon name)",
      "href": "string (optional, for links)",
      "permission": "string (optional)",
      "items": [ /* nested items for groups */ ]
    }
  ],
  "source": "role | workflow | override",
  "version": "1.0"
}
```

---

## Historique des Modifications

| Date | Version | Auteur | Changements |
|------|---------|--------|-------------|
| 2026-01-31 | 1.0 | Claude | Création initiale du plan |

