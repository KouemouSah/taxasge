# Plan: Unification des Sources de Vérité — Workflow Configuration

## Context

**Problème**: Les workflows predefined (13 classes Python, 34 codes) sont la source de vérité déclarative, mais 4 systèmes parallèles divergent silencieusement :
1. `entity-menus.ts` (983 lignes statiques, contient des codes obsolètes)
2. `workflow_menu_mapping` (5 entrées, il en faut ~8)
3. `WORKFLOW_ICONS` dict (9 entrées, mapping incomplet pour FP/VISADO)
4. `workflow_display_config` (seuls les codes PASAPORTE existent)

**Conséquences actuelles**:
- GAP-02 (HAUTE): `_get_workflow_category()` fait `parts[0]` → FP_VERIFICACION = "FP" (pas de mapping), PRORROGA_VISADO = "PRORROGA" (pas de mapping) → menus fallback générique
- GAP-04 (HAUTE): 5/~8 patterns dans workflow_menu_mapping → FP et VISADO n'ont pas de menu structuré
- GAP-05 (MOYENNE): display_config quasi-vide → previews/colonnes par défaut partout sauf PASAPORTE

**Objectif**: PredefinedWorkflow Python = seule source de vérité. Au démarrage de l'app et via l'endpoint admin sync, toutes les tables dérivées (workflows, tariffs, docs, menu_mapping, display_config) sont automatiquement synchronisées.

---

## 12 GAPs Identifiés

| # | GAP | Criticité | Phase |
|---|-----|-----------|-------|
| 01 | 4 sources de vérité menus | HAUTE | 1,2,3 |
| 02 | `_get_workflow_category()` cassé (FP, VISADO) | HAUTE | 2 |
| 03 | Admin menu non unifié | MOYENNE | 5 |
| 04 | workflow_menu_mapping incomplet (5/8) | HAUTE | 1 |
| 05 | workflow_display_config quasi-vide | MOYENNE | 1 |
| 06 | Tariff page read-only UX confus | MOYENNE | Hors scope |
| 07 | Document requirements CRUD misleading | MOYENNE | Hors scope |
| 08 | SUBTYPE_NAMES_ES incomplèt | BASSE | 4 |
| 09 | entity-menus.ts codes obsolètes | BASSE | 5 |
| 10 | ICON_MAP potentiellement incomplet | BASSE | 2 |
| 11 | Pas d'invalidation cache après sync | MOYENNE | 3 |
| 12 | Pas de UNIQUE constraint workflow_menu_mapping | BASSE | 1 |

> GAPs 06 et 07 (UX admin tarifs/docs) sont hors scope de cette tâche (pas de risque fonctionnel, purement cosmétique).

---

## Approche: REGISTRY centralisé (pas de propriétés sur classes)

Au lieu d'ajouter 5 propriétés à PredefinedWorkflow + overrides dans 13 classes (~65 lignes boilerplate), on crée un **dict centralisé** dans un nouveau service `workflow_sync_service.py`. Ce dict mappe chaque pattern de workflow à ses métadonnées menu et display.

---

## Phase 1: Migration SQL — Compléter les données manquantes

**Fichier**: `packages/backend/database/migrations/103_complete_workflow_menu_display_config.sql`

### 1a. UNIQUE constraint sur workflow_menu_mapping (GAP-12)

L'index unique `idx_workflow_menu_mapping_pattern` EXISTE déjà (migration 063:99). ON CONFLICT utilisable directement.

### 1b. Ajouter les patterns manquants dans workflow_menu_mapping (GAP-04)

Patterns existants: `PASAPORTE_%`, `RESIDENCIA_%`, `CONDUCIR_%`, `VEHICULO_%`, `CONTRATO_%`

Patterns à ajouter:

| Pattern | menu_group_id | title_key | icon | appointments |
|---------|--------------|-----------|------|-------------|
| `FP_%` | `funcion-publica` | `agent.nav.publicFunction` | `Briefcase` | OUI (carnet) |
| `PRORROGA_%` | `visados` | `agent.nav.visas` | `Globe` | NON |
| `VISADO_%` | `visados` | `agent.nav.visas` | `Globe` | NON |
| `PERMANENCIA_%` | `visados` | `agent.nav.visas` | `Globe` | NON |
| `SALIDA_%` | `visados` | `agent.nav.visas` | `Globe` | NON |

**NOTE**: Les 4 codes VISADO ont des préfixes différents (`PRORROGA_`, `VISADO_`, `PERMANENCIA_`, `SALIDA_`). On ajoute les 4 patterns comme fallback SQL, mais le fix principal est dans la catégorisation Python (Phase 2) qui les regroupe tous en catégorie `"VISADO"`.

### 1c. Compléter workflow_display_config (GAP-05)

Insérer par code exact (post-migration 088) pour les 29 codes manquants. Les colonnes/preview sont identiques au sein d'une catégorie. UNIQUE constraint existe déjà sur `workflow_code`.

---

## Phase 2: Fix `_get_workflow_category()` + WORKFLOW_ICONS (GAP-02, GAP-10)

**Fichier**: `packages/backend/app/modules/menu_config/services/menu_config_service.py`

### 2a. Nouveau dict WORKFLOW_MENU_REGISTRY (remplace WORKFLOW_ICONS)

Dict exhaustif: 34 entrées, une par WorkflowCode. Chaque entrée: `{"category": "...", "icon": "..."}`.

Catégories: `PASAPORTE`, `RESIDENCIA`, `VISADO`, `VEHICULO`, `CONTRATO`, `CONDUCIR`, `FUNCION_PUBLICA`

Les 4 codes VISADO (`PRORROGA_VISADO`, `VISADO_ALTERNATIVO`, `PERMANENCIA_EXTRANJERIA`, `SALIDA_VISADO_VENCIDO`) → tous `category: "VISADO"`.

Les 5 codes FP (`FP_VERIFICACION_FUNCIONARIO`, etc.) → tous `category: "FUNCION_PUBLICA"`.

### 2b. Fix `_get_workflow_category()` (GAP-02 — CRITIQUE)

Actuel (cassé):
```python
def _get_workflow_category(self, workflow_code: str) -> str:
    parts = workflow_code.split('_')
    return parts[0] if parts else workflow_code
```

Fix:
```python
def _get_workflow_category(self, workflow_code: str) -> str:
    entry = WORKFLOW_MENU_REGISTRY.get(workflow_code)
    if entry:
        return entry["category"]
    parts = workflow_code.split('_')
    return parts[0] if parts else workflow_code
```

### 2c. Fix `_create_default_menu()` icon lookup

Remplacer `self.WORKFLOW_ICONS.get(category, 'FileText')` par lookup dans `WORKFLOW_MENU_REGISTRY`.

### 2d. Fix `_find_mapping_for_category()` pour VISADO

Avec le fix 2b, tous les codes VISADO ont catégorie `"VISADO"`. Le pattern `VISADO_%` strippé = `"VISADO"` → match exact. Le code existant fait déjà `category.startswith(pattern)` donc ça marchera.

Amélioration: match exact en priorité, puis startsWith en fallback:
```python
def _find_mapping_for_category(self, category: str, mappings: List[Dict]) -> Optional[Dict]:
    for mapping in mappings:
        pattern = mapping['workflow_pattern'].replace('%', '').rstrip('_')
        if category == pattern:
            return mapping
    for mapping in mappings:
        pattern = mapping['workflow_pattern'].replace('%', '').rstrip('_')
        if category.startswith(pattern):
            return mapping
    return None
```

---

## Phase 3: Sync automatique au démarrage (GAP-01, GAP-11)

**Fichier NOUVEAU**: `packages/backend/app/modules/service_requests/services/workflow_sync_service.py`

### 3a. Service de synchronisation

Fonction `sync_workflow_config(db_connection)`:
1. Itère sur `WORKFLOW_MENU_REGISTRY`, extrait les catégories uniques
2. Pour chaque catégorie, UPSERT dans `workflow_menu_mapping` (ON CONFLICT DO UPDATE)
3. Pour chaque code (34), UPSERT dans `workflow_display_config` (ON CONFLICT DO NOTHING — ne pas écraser les configs admin)
4. Invalide les caches Redis (`workflow_mappings`, `display_config`)
5. Retourne stats: `{categories_synced, codes_synced}`

### 3b. Intégration dans main.py lifespan

**Fichier**: `packages/backend/app/main.py` (après permissions sync, ligne ~96)

Pattern identique au permissions sync: try/except non-bloquant, log `✅` ou `⚠️`.

### 3c. Intégration dans admin sync endpoint

**Fichier**: `packages/backend/app/modules/service_requests/api/admin_routes.py` (fin du endpoint sync, ligne ~6582)

Appel `sync_workflow_config(db)` après le sync workflows+tariffs+docs existant. Résultat ajouté dans `result.details`.

---

## Phase 4: Nettoyage SUBTYPE_NAMES_ES (GAP-08)

**Fichier**: `packages/backend/app/modules/service_requests/api/admin_routes.py`

Vérifier que les 34 codes du WorkflowCode enum ont tous une entrée. Ajouter les manquants (VISADO/FP confirmés).

---

## Phase 5: Frontend — Deprecation entity-menus.ts + ICON_MAP (GAP-09, GAP-10)

### 5a. entity-menus.ts: ajouter @deprecated

**Fichier**: `packages/web/src/modules/agent-dashboard/config/entity-menus.ts`

Ajouter `@deprecated` JSDoc. Supprimer les codes obsolètes (`RESIDENCIA_DUPLICADO`, `RESIDENCIA_CAMBIO_DATOS`, `RESIDENCIA_REAGRUPACION`).

### 5b. ICON_MAP dans GenericAgentSidebar.tsx (GAP-10)

**Fichier**: `packages/web/src/modules/agent-dashboard/components/GenericAgentSidebar.tsx`

Vérifier que `Briefcase`, `Globe`, `Truck`, `Plane`, `Car`, `FileSignature` sont tous dans ICON_MAP.

### 5c. i18n — clés de menu manquantes

**Fichiers**: `packages/web/messages/es.json`, `fr.json`, `en.json`

Ajouter dans `agent.nav`:
- `publicFunction`: "Función Pública" / "Fonction Publique" / "Public Service"
- `visas`: "Visados y Permisos" / "Visas et Permis" / "Visas & Permits"

---

## Fichiers modifiés

| # | Fichier | Action |
|---|---------|--------|
| 1 | `migrations/103_complete_workflow_menu_display_config.sql` | NOUVEAU |
| 2 | `menu_config/services/menu_config_service.py` | FIX (REGISTRY + 4 méthodes) |
| 3 | `service_requests/services/workflow_sync_service.py` | NOUVEAU |
| 4 | `app/main.py` | EDIT (lifespan sync) |
| 5 | `service_requests/api/admin_routes.py` | EDIT (sync extension + SUBTYPE_NAMES_ES) |
| 6 | `agent-dashboard/config/entity-menus.ts` | EDIT (@deprecated + codes obsolètes) |
| 7 | `agent-dashboard/components/GenericAgentSidebar.tsx` | EDIT (vérifier ICON_MAP) |
| 8 | `messages/es.json` | EDIT (2 clés) |
| 9 | `messages/fr.json` | EDIT (2 clés) |
| 10 | `messages/en.json` | EDIT (2 clés) |

**Total: 10 fichiers (2 nouveaux, 8 modifiés)**

---

## Ordre d'implémentation

| Step | Phase | Description |
|------|-------|-------------|
| 1 | 2 | WORKFLOW_MENU_REGISTRY + fix _get_workflow_category + _find_mapping + _create_default_menu |
| 2 | 3 | workflow_sync_service.py (nouveau) |
| 3 | 1 | Migration SQL 103 (seed data) |
| 4 | 3b | main.py lifespan sync |
| 5 | 3c | admin_routes.py sync extension |
| 6 | 4 | SUBTYPE_NAMES_ES nettoyage |
| 7 | 5 | entity-menus.ts + ICON_MAP + i18n |
| 8 | - | TypeScript check + lint + push |

---

## Vérification

1. **Backend startup**: Logs montrent `✅ Workflow config synced: 7 menu mappings, 34 display configs`
2. **Test catégorisation**: `_get_workflow_category("FP_VERIFICACION_FUNCIONARIO")` → `"FUNCION_PUBLICA"` (pas `"FP"`)
3. **Test catégorisation**: `_get_workflow_category("PRORROGA_VISADO")` → `"VISADO"` (pas `"PRORROGA"`)
4. **Admin sync**: `POST /admin/service-requests/sync/workflows` → response inclut `config_synced`
5. **Agent menu**: `GET /menu-config/me` pour agent EXTRANJERIA → menu structuré VISADO avec icône Globe
6. **Agent menu**: `GET /menu-config/me` pour agent MINFP → menu "Función Pública" avec icône Briefcase
7. **TypeScript**: `npx tsc --noEmit` — 0 erreurs
8. **Lint**: `npm run lint` — pas de nouveaux warnings
9. **Push**: GitHub Actions build OK
