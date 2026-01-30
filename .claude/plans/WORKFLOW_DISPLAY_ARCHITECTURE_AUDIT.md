# Audit Architecture - Configuration Affichage des Workflows

**Date:** 2026-01-31
**Auteur:** Claude Code Expert
**Objectif:** Audit factuel de l'existant avant proposition de modifications

---

## 1. RÉSUMÉ EXÉCUTIF

L'architecture actuelle implémente **Option B/C hybride** - génération automatique des menus + composants génériques pour les pages.

| Aspect | État | Commentaire |
|--------|------|-------------|
| Génération menus | ✅ Fonctionnel | Auto-génération depuis `workflow_menu_mapping` |
| Templates DB | ⚠️ Partiellement utilisé | 10 templates existent mais non exploités pour pages |
| Pages dynamiques | ✅ Fonctionnel | Composants génériques par action (pending, validation, etc.) |
| Customisation par workflow | ❌ Non implémenté | Mêmes composants pour tous les workflows |
| Admin UI | ✅ Fonctionnel | CRUD complet pour workflow_menu_mapping + templates |

---

## 2. ARCHITECTURE EXISTANTE

### 2.1 Tables Base de Données

#### `workflow_menu_mapping` (15 colonnes)
```sql
-- 6 mappings actifs trouvés:
Pattern: RESIDENCIA_%, Group: residencias, Icon: Globe
Pattern: CONDUCIR_%, Group: licencias, Icon: Car
Pattern: VEHICULO_%, Group: vehiculos, Icon: Truck
Pattern: FP_%, Group: funcionarios, Icon: BadgeCheck
Pattern: PASAPORTE_%, Group: pasaportes, Icon: Plane
Pattern: CONTRATO_%, Group: contratos, Icon: FileSignature
```

**Colonnes clés:**
- `workflow_pattern` (ex: `PASAPORTE_%`)
- `menu_group_id` (ex: `pasaportes`)
- `menu_title_key` (ex: `agent.nav.passports`)
- `include_pending`, `include_validation`, `include_appointments`, `include_history` (booleans)
- `permission_prefix` (ex: `service_request`)

#### `menu_templates` (JSONB)
```sql
-- 10 templates trouvés (1 par entité)
Code: cnedoge_pasaporte_default, Type: workflow, Entity: CNEDOGE_PASAPORTE
  menu_structure: {"source": "template", "version": "1.0", "workflows": [...], "default_menus": [...]}
  dashboard_widgets: {"layout": "grid", "version": "1.0", "widgets": [...]}
```

**Structure JSONB menu_structure:**
```json
{
  "source": "template",
  "version": "1.0",
  "workflows": ["PASAPORTE_NUEVO", "PASAPORTE_RENOVACION", ...],
  "default_menus": ["dashboard", "pending", "validation", "appointments", "history"]
}
```

**⚠️ Observation critique:** Les `menu_templates` stockent une liste de workflows et menus par défaut, mais ne sont PAS utilisés pour la génération actuelle. Le service `MenuConfigService` utilise uniquement `workflow_menu_mapping`.

#### `roles.menu_config` (JSONB)
- `NULL` → Déclenche la génération automatique depuis `workflow_menu_mapping`
- Contenu JSON → Utilisé directement (module-based entities comme TESORO)

### 2.2 Backend - MenuConfigService

**Fichier:** `packages/backend/app/modules/menu_config/services/menu_config_service.py`

**Flux de génération:**
```
1. get_agent_menu_config(agent_profile_id)
   ↓
2. Check: role.menu_config IS NULL?
   ├── OUI → _generate_workflow_menus() → Auto-génération
   └── NON → _parse_menu_config() → Utilise JSON stocké
   ↓
3. _generate_workflow_menus(workflows, entity_code)
   ├── Fetch workflow_menu_mapping from DB
   ├── Group workflows by category (PASAPORTE, RESIDENCIA, etc.)
   └── Create menu items with submenus (pending, validation, history)
   ↓
4. _add_common_agent_menus() → Ajoute "My Stats"
   ↓
5. Return MenuConfigResponse
```

**Génération des sous-menus (lignes 387-424):**
```python
def _create_menu_from_mapping(self, mapping, workflows, entity_code):
    items = []
    if mapping.get('include_pending', True):
        items.append(SubMenuItemWithBadge(id="pending", href=f"{base_path}/pending", ...))
    if mapping.get('include_validation', True):
        items.append(SubMenuItemWithBadge(id="validation", href=f"{base_path}/validation", ...))
    if mapping.get('include_history', True):
        items.append(SubMenuItemWithBadge(id="history", href=f"{base_path}/history", ...))
    return MenuItemBase(...)
```

### 2.3 Frontend - Composants de Pages

#### Structure des routes
```
/dashboard/agent/[entityCode]/[workflowGroup]/[action]/page.tsx
  - entityCode: dgt, ofive, onrc, extranjeria, policia, minfp, itve
  - workflowGroup: licencias, vehiculos, residencias, etc.
  - action: pending, validation, appointments, history
```

#### Page dynamique unifiée
**Fichier:** `[entityCode]/[workflowGroup]/[action]/page.tsx`

```typescript
// Ligne 254-256: Délègue l'action "pending" au composant PendingPage
if (currentAction === 'pending') {
  return <PendingPage entityCode={ENTITY_CODE} />;
}
```

#### Composant PendingPage
**Fichier:** `modules/agent-dashboard/components/pending/PendingPage.tsx`

**Props:**
```typescript
interface PendingPageProps {
  entityCode: EntityCode;  // Seul paramètre - pas de workflowCode
  action?: ActionType;
}
```

**⚠️ Observation critique:** PendingPage reçoit uniquement `entityCode`, pas le `workflowCode`. Il ne peut donc pas personnaliser l'affichage par workflow.

#### Composant RequestPreview
**Fichier:** `modules/agent-dashboard/components/pending/RequestPreview.tsx`

**Sections affichées (lignes 196-237):**
```tsx
<RequestInfoSection />      // Référence, workflow, priorité, SLA
<ExtractedDataSection />    // Données OCR extraites
<DocumentsSection />        // Documents uploadés
<ContactSection />          // Coordonnées du demandeur
<AppointmentSection />      // Gestion des RDV
```

**⚠️ Observation critique:** Ces sections sont génériques. Aucune ne reçoit de configuration spécifique au workflow pour adapter l'affichage.

### 2.4 Admin UI

**Pages existantes:**

1. **`/admin/menu-config/page.tsx`** (1084 lignes)
   - Onglet "Mappings Workflow" → CRUD workflow_menu_mapping
   - Onglet "Templates Menu" → CRUD menu_templates
   - Actions batch (sélection multiple, activation/désactivation)

2. **`/admin/menu-templates/[id]/page.tsx`** (125 lignes)
   - Édition d'un template avec `MenuTemplateForm`
   - Navigation prev/next entre templates

3. **`/admin/roles/[id]/menu-config/page.tsx`** (632 lignes)
   - Éditeur JSON pour `menu_config`, `dashboard_config`, `ui_config`
   - Validation JSON en temps réel
   - Sauvegarde individuelle ou groupée

---

## 3. CE QUI FONCTIONNE

| Fonctionnalité | Status | Détail |
|----------------|--------|--------|
| Génération auto des menus | ✅ | Depuis workflow_menu_mapping |
| Routage dynamique | ✅ | `/agent/[entity]/[group]/[action]` |
| Composants split-view | ✅ | Liste + Preview pour pending |
| Filtres (priorité, type, motivo) | ✅ | Dans PendingPage |
| Raccourcis clavier (A/R) | ✅ | Approve/Reject rapide |
| Admin CRUD workflow mappings | ✅ | Interface complète |
| Admin éditeur JSON rôles | ✅ | menu_config, dashboard_config |
| Cache menus (5min) | ✅ | HybridCache Redis+memory |
| Cache mappings (30min) | ✅ | Optimisation performance |

---

## 4. CE QUI MANQUE / EST INCOMPLET

### 4.1 Personnalisation par Workflow

**Problème:** Tous les workflows utilisent les mêmes composants génériques.

| Composant | Manque |
|-----------|--------|
| RequestInfoSection | Pas de champs spécifiques par workflow |
| ExtractedDataSection | Affiche toutes les données OCR identiquement |
| DocumentsSection | Pas de validation des documents requis par workflow |
| RequestPreview | Actions identiques pour tous workflows |

**Exemple concret:**
- `PASAPORTE_NUEVO` devrait afficher: photo, naissance, parents
- `CONDUCIR_RENOVACION` devrait afficher: permis actuel, examen médical
- Actuellement: mêmes champs pour tous

### 4.2 menu_templates Non Exploités

Les 10 templates en DB ne sont pas utilisés dans le flux de génération:

```python
# menu_config_service.py - _generate_workflow_menus()
# N'utilise PAS menu_templates, seulement workflow_menu_mapping
```

**Structure inutilisée:**
```json
{
  "workflows": ["PASAPORTE_NUEVO", ...],
  "default_menus": ["dashboard", "pending", ...]
}
```

### 4.3 Configuration Page/Detail Manquante

La table `workflow_menu_mapping` configure les **menus** mais pas:
- Colonnes à afficher dans la liste
- Champs à montrer dans le preview
- Actions disponibles par statut
- Validations spécifiques

### 4.4 Pas de Lien Template → Workflow

Aucune FK entre `menu_templates.entity_code` et `entities.code` exploitée dynamiquement.

---

## 5. ANALYSE CRITIQUE

### 5.1 Points Forts de l'Architecture Actuelle

1. **Séparation claire** module-based vs workflow-based
2. **Cache performant** avec Redis fallback
3. **Admin UI complète** pour les mappings
4. **Composants réutilisables** (PendingPage, RequestPreview)
5. **Validation Pydantic** robuste pour menu_config

### 5.2 Faiblesses Identifiées

1. **menu_templates inutilisés** → Code mort ou feature incomplète
2. **Pas de configuration par workflow** pour les pages
3. **Duplication potentielle** entity_code dans templates vs mappings
4. **PendingPage trop générique** → Pas de props workflow

### 5.3 Dette Technique

| Élément | Impact | Priorité |
|---------|--------|----------|
| menu_templates orphelins | Confusion, maintenance | Medium |
| Pas de display_config par workflow | UX limitée | High |
| RequestPreview hardcodé | Maintenance difficile | High |

---

## 6. OPTIONS D'AMÉLIORATION

### Option A: Étendre workflow_menu_mapping

Ajouter colonnes à `workflow_menu_mapping`:
```sql
ALTER TABLE workflow_menu_mapping ADD COLUMN display_config JSONB;
-- Contient: columns_pending, columns_history, preview_sections, actions
```

**Avantages:** Un seul endroit de configuration
**Inconvénients:** Table devient complexe

### Option B: Utiliser menu_templates

Exploiter les templates existants en ajoutant:
```sql
ALTER TABLE menu_templates ADD COLUMN page_config JSONB;
-- Contient: pending_columns, preview_sections, actions_by_status
```

**Avantages:** Templates déjà existants
**Inconvénients:** Relation template↔workflow floue

### Option C: Nouvelle Table workflow_display_config

```sql
CREATE TABLE workflow_display_config (
  workflow_pattern VARCHAR(50),
  page_type VARCHAR(20), -- pending, validation, detail
  columns JSONB,
  preview_sections JSONB,
  actions JSONB,
  PRIMARY KEY (workflow_pattern, page_type)
);
```

**Avantages:** Configuration claire et extensible
**Inconvénients:** Nouvelle table à maintenir

---

## 7. RECOMMANDATION

**Approche recommandée: Option A (étendre workflow_menu_mapping)**

Raisons:
1. Table déjà utilisée pour génération menus
2. Admin UI déjà en place
3. Évite nouvelle table
4. Pattern cohérent avec include_pending, include_validation, etc.

**Migration proposée:**
```sql
ALTER TABLE workflow_menu_mapping
ADD COLUMN display_config JSONB DEFAULT '{
  "pending": {
    "columns": ["reference", "citizen", "priority", "sla", "date"],
    "preview_sections": ["info", "extracted", "documents", "contact", "appointment"]
  },
  "history": {
    "columns": ["reference", "citizen", "status", "agent", "date"]
  }
}';
```

---

## 8. CONCLUSION

L'architecture actuelle est **fonctionnelle pour les menus** mais **incomplète pour l'affichage des pages**. Les composants frontend sont génériques et ne peuvent pas s'adapter aux spécificités de chaque workflow.

**Actions prioritaires:**
1. Décider si menu_templates doit être exploité ou supprimé
2. Choisir l'option d'extension pour la configuration des pages
3. Modifier PendingPage/RequestPreview pour accepter une config dynamique
4. Documenter le flux complet menu→page→detail

---

*Ce rapport est factuel et basé sur l'analyse du code existant. Aucune modification n'a été proposée sans validation préalable de l'architecture.*
