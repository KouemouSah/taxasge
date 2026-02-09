# RAPPORT CRITIQUE - Module "Flujo de Trabajo" Administration
# Migration V1 (Hardcoded) → V2 (Dynamic) : Etat des lieux

**Date**: 2026-02-09
**Version**: 1.0
**Auteur**: Claude Code Expert (Opus 4.6)
**Session**: Analyse architecturale approfondie
**Statut**: RAPPORT D'AUDIT INITIAL

---

## TABLE DES MATIÈRES

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Méthodologie d'Analyse](#2-méthodologie-danalyse)
3. [Architecture Actuelle - Vue d'Ensemble](#3-architecture-actuelle)
4. [Analyse du Système Dual (Hardcoded vs Dynamic)](#4-système-dual)
5. [Gaps Critiques Identifiés](#5-gaps-critiques)
6. [Erreurs Silencieuses Détectées](#6-erreurs-silencieuses)
7. [Inconsistances Workflow Codes](#7-inconsistances-workflow-codes)
8. [État des Permissions](#8-état-des-permissions)
9. [Analyse Frontend Admin Pages](#9-analyse-frontend-admin)
10. [Analyse Backend Admin Routes](#10-analyse-backend-admin)
11. [Recommandations par Priorité](#11-recommandations)
12. [Plan de Migration Proposé](#12-plan-de-migration)

---

## 1. RÉSUMÉ EXÉCUTIF

### Constat Principal
Le module "Flujo de Trabajo" (Workflow) dans l'administration de TaxasGE souffre d'un **système dual non terminé** :

- **Backend** : Migration V2 **COMPLÉTÉE** — Tous les 13 workflows Python héritent de `PredefinedWorkflow`. Aucun vestige V1 (`BaseWorkflow`).
- **Frontend Agent Dashboard** : Migration V2 **PARTIELLEMENT COMPLÉTÉE** — Feature flag `FEATURE_DYNAMIC_MENUS` activé par défaut, `useMenuConfig` hook fait appel à l'API `/menu-config/me`, mais **fallback vers `entity-menus.ts` hardcodé si l'API échoue**.
- **Frontend Admin** : **DEUX SYSTÈMES COEXISTENT SANS COORDINATION** :
  1. `/admin/service-requests/workflows` — Gestion CRUD des workflows (backend V2, fonctionnel)
  2. `/admin/menu-config` — Gestion des mappings workflow→menu (backend V2, fonctionnel)
  3. `entity-menus.ts` — Configuration statique hardcodée de 13 entités (V1 legacy, **TOUJOURS UTILISÉ EN FALLBACK**)

### Impact
| Dimension | Niveau | Description |
|-----------|--------|-------------|
| **Fonctionnel** | MOYEN | Admin peut gérer workflows et mappings, mais les changements via admin n'impactent PAS les sidebars agent si le fallback statique est actif |
| **Maintenance** | CRITIQUE | Toute modification de workflow requiert un changement en **3 endroits** : Python workflow, entity-menus.ts, workflow_menu_mapping DB |
| **Cohérence** | CRITIQUE | 3 sources de vérité (5 codes workflow en frontend inexistants en backend, voir §7) |
| **UX Admin** | MOYEN | La page "Workflows" fonctionne mais la relation avec "Menu Mappings" n'est pas claire |

---

## 2. MÉTHODOLOGIE D'ANALYSE

### Fichiers Analysés (39 fichiers clés)

**Frontend (23 fichiers)** :
- `packages/web/src/modules/admin/components/AdminSidebar.tsx` — Navigation admin
- `packages/web/src/modules/admin/services/menuConfigService.ts` — API menu config
- `packages/web/src/modules/admin/hooks/useWorkflowMappings.ts` — CRUD hooks
- `packages/web/src/modules/admin/hooks/useDisplayConfigs.ts` — Config affichage
- `packages/web/src/modules/admin/hooks/useWorkflowCodes.ts` — Liste codes
- `packages/web/src/modules/admin/components/WorkflowMappingForm.tsx` — Formulaire
- `packages/web/src/modules/agent-dashboard/config/entity-menus.ts` — **Config hardcodée**
- `packages/web/src/modules/agent-dashboard/types/index.ts` — Types/enums frontend
- `packages/web/src/modules/agent-dashboard/types/menu-config.ts` — Types dynamiques
- `packages/web/src/modules/agent-dashboard/hooks/useMenuConfig.ts` — Hook API
- `packages/web/src/modules/agent-dashboard/hooks/useAgentDashboard.ts` — Hook principal
- `packages/web/src/modules/agent-dashboard/components/GenericAgentSidebar.tsx` — Sidebar agent
- `packages/web/src/modules/agent-dashboard/components/DynamicMenu.tsx` — Menu dynamique
- `packages/web/src/modules/service-requests-admin/services/api.ts` — API admin workflows
- `packages/web/src/core/config/features.ts` — Feature flags
- Pages admin workflow : `workflows/page.tsx`, `workflows/new/page.tsx`, `workflows/[code]/page.tsx`
- Pages admin menu-config : `menu-config/page.tsx`, `display/page.tsx`

**Backend (16 fichiers)** :
- `packages/backend/app/modules/service_requests/models/enums.py` — Enums (35 workflow codes)
- `packages/backend/app/modules/service_requests/services/workflow_engine.py` — Moteur workflows
- `packages/backend/app/modules/service_requests/api/admin_routes.py` — Routes admin (6582 lignes)
- `packages/backend/app/modules/menu_config/api/menu_config_routes.py` — Routes menu config
- `packages/backend/app/modules/menu_config/services/menu_config_service.py` — Service menu
- `packages/backend/app/modules/menu_config/repositories/workflow_mapping_repository.py`
- `packages/backend/app/modules/menu_config/repositories/display_config_repository.py`
- `packages/backend/app/modules/menu_config/models/menu_config.py` — Modèles Pydantic
- 13 fichiers workflows Python V2

---

## 3. ARCHITECTURE ACTUELLE

### 3.1 Flux de Données du Menu Agent

```
                        ┌──────────────────────────────┐
                        │    Agent se connecte          │
                        └──────────────┬───────────────┘
                                       │
                        ┌──────────────▼───────────────┐
                        │  FEATURE_DYNAMIC_MENUS=true?  │
                        └──────────────┬───────────────┘
                                       │ OUI
                        ┌──────────────▼───────────────┐
                        │  GET /menu-config/me          │
                        │  (useMenuConfig hook)         │
                        └──────────────┬───────────────┘
                                       │
                    ┌──────────────────┼────────────────────┐
                    │ API OK + menus   │ API FAIL / menus=0 │
                    ▼                  │                     ▼
       ┌────────────────────┐          │    ┌────────────────────────┐
       │  DYNAMIC MENUS V2  │          │    │  STATIC FALLBACK V1    │
       │  (from DB mappings │          │    │  (entity-menus.ts)     │
       │   + role config)   │          │    │  Hardcodé, 13 entités  │
       └────────────────────┘          │    └────────────────────────┘
                                       │
                        ┌──────────────▼───────────────┐
                        │  FEATURE_DYNAMIC_MENUS=false  │
                        │  → Toujours static fallback   │
                        └──────────────────────────────┘
```

### 3.2 Composants Admin "Flujo de Trabajo"

Le menu admin sous **Configuration > Workflows** contient :

| Page Admin | Route | Fonction | Backend |
|------------|-------|----------|---------|
| Workflows | `/admin/service-requests/workflows` | Liste, CRUD, sync des workflows | `GET/POST /api/v1/admin/service-requests/workflows` |
| Workflow Detail | `/admin/service-requests/workflows/[code]` | Détail + onglets (Info, Documents, Tarifs, Suppléments, Citas) | `GET/PUT /api/v1/admin/service-requests/workflows/{code}` |
| New Workflow | `/admin/service-requests/workflows/new` | Création (uniquement `is_generic=true`) | `POST /api/v1/admin/service-requests/workflows` |
| Document Requirements | Onglet dans workflow detail | Documents requis par workflow | `/admin/service-requests/workflows/{code}/documents` |
| Tariffs | Onglet dans workflow detail / page séparée | Tarification par workflow | `/admin/service-requests/workflows/{code}/tariffs` |
| Appointments | Onglet + page séparée | Slots, dates bloquées, règles délai | `/admin/service-requests/slot-configs` etc. |
| Entities | `/admin/entities` | Gestion des entités | N/A (probable) |

Le menu admin sous **Configuration > Menu Configuration** contient :

| Page Admin | Route | Fonction | Backend |
|------------|-------|----------|---------|
| Workflow Mappings | `/admin/menu-config` | Mapping workflow_pattern → menu_group | `GET/POST /api/v1/menu-config/workflow-mappings` |
| Display Configs | `/admin/menu-config/display` | Colonnes et sections par workflow | `GET/POST /api/v1/menu-config/display-configs` |

---

## 4. SYSTÈME DUAL : Hardcoded vs Dynamic

### 4.1 entity-menus.ts (V1 - Statique/Hardcodé)

**Fichier** : `packages/web/src/modules/agent-dashboard/config/entity-menus.ts`
**Taille** : 983 lignes
**Entités définies** : 13

| Entity Code | Workflows Déclarés | Items Menu | Statut |
|-------------|-------------------|------------|--------|
| CNEDOGE | 10 (5 pasaporte + 5 residencia) | 4 groupes | Actif fallback |
| CNEDOGE_PASAPORTE | 5 pasaporte | 2 groupes | Actif fallback |
| CNEDOGE_RESIDENCIA | 5 residencia | 2 groupes | Actif fallback |
| DGT | 9 (5 conducir + 4 vehiculo) | 3 groupes | Actif fallback |
| ONRC | 7 contrato | 2 groupes | Actif fallback |
| MINFP | 5 FP_* | 3 groupes | Actif fallback |
| TESORO | 0 (module-based) | 4 groupes | Actif fallback |
| OFIVE | 2 vehiculo CUVE | 2 groupes | Actif fallback |
| EXTRANJERIA | 5 residencia | 2 groupes | Actif fallback |
| ITVE | 1 (VEHICULO_RENOVACION_ITV) | 1 item | Minimal |
| DGI | 0 | 1 item | Minimal |
| POLICIA | 0 | 3 items | Stub |
| GENERAL | 0 | 1 item | Fallback |

### 4.2 workflow_menu_mapping (V2 - Dynamique/DB)

**Table** : `workflow_menu_mapping`
**Enregistrements** : 6 (selon rapport précédent du 2026-02-01)

| Pattern | menu_group_id | Icon | Sub-menus |
|---------|--------------|------|-----------|
| PASAPORTE_% | pasaportes | Plane | pending, validation, appointments, history |
| RESIDENCIA_% | residencias | Globe | pending, validation, appointments |
| CONDUCIR_% | licencias | Car | pending, validation |
| VEHICULO_% | vehiculos | Truck | pending, validation |
| CONTRATO_% | contratos | FileSignature | pending, validation |
| FP_% | funcionarios | BadgeCheck | pending, validation |

### 4.3 Constat Critique

**Le fallback `entity-menus.ts` est TOUJOURS le chemin actif** si :
1. L'API `/menu-config/me` retourne une erreur 500
2. L'agent n'a pas de `role.menu_config` configuré en DB (cas `has_role_menu_config=false`)
3. Le feature flag est désactivé (`NEXT_PUBLIC_FEATURE_DYNAMIC_MENUS=false`)

**Conséquence** : Les modifications faites via l'admin (workflow mappings, display configs) ne s'appliquent que si l'API fonctionne ET que le rôle est correctement configuré.

---

## 5. GAPS CRITIQUES IDENTIFIÉS

### GAP-01 : TRIPLE SOURCE DE VÉRITÉ (CRITICITÉ: HAUTE)

**Problème** : Les menus agent proviennent de 3 sources sans synchronisation automatique :
1. **entity-menus.ts** (frontend statique) — LucideIcon objects, hardcoded
2. **workflow_menu_mapping** (DB) — Pattern-based, string icon names
3. **roles.menu_config** (DB JSONB) — Per-role override

**Impact** : Ajouter un workflow requiert 3 modifications manuelles. Si l'une est oubliée, le menu est incohérent selon le chemin de fallback emprunté.

**Preuve** :
- `entity-menus.ts:339` → DGT a `VEHICULO_CAMBIO_CARACTERISTICAS`
- `workflow_menu_mapping` DB → `VEHICULO_%` pattern couvre ce workflow
- Mais si `/menu-config/me` échoue, l'agent voit le menu de `entity-menus.ts` avec des hrefs différents de ceux générés dynamiquement

### GAP-02 : WORKFLOW CODES INEXISTANTS EN BACKEND (CRITICITÉ: HAUTE)

**Problème** : Le frontend `entity-menus.ts` et `types/index.ts` déclarent des workflow codes qui **n'existent PAS** dans le backend `WorkflowCode` enum :

| Code Frontend | Backend Enum | Statut |
|--------------|-------------|--------|
| `RESIDENCIA_DUPLICADO` | ABSENT | **PHANTOM** |
| `RESIDENCIA_CAMBIO_DATOS` | ABSENT | **PHANTOM** |
| `RESIDENCIA_REAGRUPACION` | ABSENT | **PHANTOM** |
| `VEHICULO_CAMBIO_CARACTERISTICAS` | ABSENT | **PHANTOM** |

**Le backend a** (que le frontend ne liste PAS dans entity-menus) :
| Code Backend | Frontend entity-menus | Statut |
|-------------|----------------------|--------|
| `PRORROGA_VISADO` | Absent de EXTRANJERIA_CONFIG | **MANQUANT** |
| `VISADO_ALTERNATIVO` | Absent de EXTRANJERIA_CONFIG | **MANQUANT** |
| `PERMANENCIA_EXTRANJERIA` | Absent de EXTRANJERIA_CONFIG | **MANQUANT** |
| `SALIDA_VISADO_VENCIDO` | Absent de EXTRANJERIA_CONFIG | **MANQUANT** |

**Impact** :
- Si un agent a `RESIDENCIA_DUPLICADO` dans ses workflows assignés et que le fallback statique est actif, les filtres de requêtes enverront un code que le backend ne reconnaît pas.
- Les 4 workflows `VISADO_*` n'apparaissent dans aucun menu agent (ni statique, ni dynamique via entity-menus).

### GAP-03 : MENU ADMIN NON UNIFIÉ (CRITICITÉ: MOYENNE)

**Problème** : Les workflows sont gérés à 2 endroits dans l'admin :
1. **Configuration > Workflows** (`/admin/service-requests/workflows`) — CRUD complet
2. **Configuration > Menu Configuration > Workflow Mappings** (`/admin/menu-config`) — Mapping vers menus

Un admin qui crée un workflow ne sait pas qu'il doit AUSSI créer un mapping menu. Il n'y a pas de lien de navigation entre les deux, ni de validation croisée.

### GAP-04 : DISPLAY CONFIG INCOMPLETE (CRITICITÉ: MOYENNE)

**Problème** : La table `workflow_display_config` n'a qu'**1 seul enregistrement** (PASAPORTE_%) alors que le système a **35 workflow codes**. Les 34 autres workflows n'ont pas de configuration d'affichage.

**Impact** : Quand un agent ouvre une liste de requêtes pour un workflow sans display config, le système utilise des colonnes par défaut ("system columns fallback"), ce qui peut ne pas correspondre aux données réelles.

### GAP-05 : SYNC WORKFLOW NON IDEMPOTENT (CRITICITÉ: BASSE)

**Problème** : L'endpoint `POST /api/v1/admin/service-requests/sync/workflows` synchronise les workflows Python vers la DB. Cependant, il ne synchronise PAS les workflow_menu_mapping ni les display_config. C'est un processus one-way (Python → DB workflows) sans propagation aux tables dépendantes.

### GAP-06 : ENTITÉ DGI/POLICIA SANS MENUS (CRITICITÉ: BASSE)

**Problème** : Dans `entity-menus.ts`, DGI et POLICIA ont `workflows: []` avec seulement un item "dashboard". POLICIA a un stub de menu "certificados" mais sans workflows associés. Ces entités sont non-fonctionnelles dans le système actuel.

---

## 6. ERREURS SILENCIEUSES DÉTECTÉES

### ERR-01 : Fallback Silencieux sans Notification

**Fichier** : `useAgentDashboard.ts:209-222`

```typescript
if (menuConfigData.has_role_menu_config && !hasDynamicMenusFromApi) {
  console.error(`[useAgentDashboard] ❌ ERREUR: role.menu_config existe en DB...`);
} else if (!menuConfigData.has_role_menu_config && !hasDynamicMenusFromApi) {
  console.info(`[useAgentDashboard] ℹ️ Fallback statique...`);
}
```

**Problème** : Ces logs ne sont que `console.error/info` — aucune notification UI, aucun toast, aucune alerte admin. Un agent peut utiliser le menu statique pendant des mois sans que personne ne s'en rende compte.

### ERR-02 : Query supprimée silencieusement si role !== 'agent'

**Fichier** : `useMenuConfig.ts:94`

```typescript
const isAgent = authState.role === 'agent';
```

**Problème** : Si un utilisateur a le rôle `supervisor` ou `admin`, la query ne s'exécute jamais. Les superviseurs qui accèdent au dashboard agent ne reçoivent jamais le menu dynamique. Ce n'est pas documenté ni géré explicitement.

### ERR-03 : Translation Keys Missing = Raw Keys Affichés

**Fichier** : `GenericAgentSidebar.tsx:278-284`

```typescript
const getTitle = (titleKey: string): string => {
  try {
    return t(titleKey.replace('agent.', '')) || titleKey;
  } catch {
    const parts = titleKey.split('.');
    return parts[parts.length - 1];
  }
};
```

**Problème** : Si une clé de traduction n'existe pas (par ex. un nouveau workflow avec un `menu_title_key` incorrect), le menu affiche le dernier segment de la clé (ex: "passports" au lieu de "Pasaportes"). Pas d'erreur, pas de log — silencieux.

### ERR-04 : Icon Fallback = FileText Générique

**Fichier** : `GenericAgentSidebar.tsx:140`

```typescript
function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || FileText;
}
```

**Problème** : Si le backend retourne un nom d'icône non mappé (par ex. "Home", "Gavel"), l'icône par défaut FileText est utilisée sans avertissement. L'admin ne sait pas pourquoi son icône choisie n'apparaît pas.

### ERR-05 : Retry=1 sur Menu Config API

**Fichier** : `useAgentDashboard.ts:198`

```typescript
retry: 1, // Only retry once since we have static fallback
```

**Problème** : En cas de latence réseau ou timeout Supabase, l'agent bascule immédiatement vers le fallback statique après seulement 1 retry. Sur connexion instable (fréquent en Guinée Équatoriale), le menu dynamique est rarement utilisé.

---

## 7. INCONSISTANCES WORKFLOW CODES

### 7.1 Matrice de Comparaison Complète

| Workflow Code | Backend Enum (`enums.py`) | Frontend Type (`types/index.ts`) | Frontend Config (`entity-menus.ts`) | DB `workflow_menu_mapping` Pattern | Statut |
|--------------|--------------------------|----------------------------------|-------------------------------------|-----------------------------------|--------|
| PASAPORTE_NUEVO | ✅ | ✅ | ✅ CNEDOGE | ✅ PASAPORTE_% | OK |
| PASAPORTE_RENOVACION | ✅ | ✅ | ✅ CNEDOGE | ✅ PASAPORTE_% | OK |
| PASAPORTE_PERDIDA | ✅ | ✅ | ✅ CNEDOGE | ✅ PASAPORTE_% | OK |
| PASAPORTE_ROBO | ✅ | ✅ | ✅ CNEDOGE | ✅ PASAPORTE_% | OK |
| PASAPORTE_DETERIORO | ✅ | ✅ | ✅ CNEDOGE | ✅ PASAPORTE_% | OK |
| RESIDENCIA_PRIMERA_VEZ | ✅ | ✅ | ✅ EXTRANJERIA | ✅ RESIDENCIA_% | OK |
| RESIDENCIA_RENOVACION | ✅ | ✅ | ✅ EXTRANJERIA | ✅ RESIDENCIA_% | OK |
| **RESIDENCIA_DUPLICADO** | **❌ ABSENT** | ✅ | ✅ CNEDOGE_RES/EXTRA | ✅ RESIDENCIA_% | **PHANTOM** |
| **RESIDENCIA_CAMBIO_DATOS** | **❌ ABSENT** | ✅ | ✅ CNEDOGE_RES/EXTRA | ✅ RESIDENCIA_% | **PHANTOM** |
| **RESIDENCIA_REAGRUPACION** | **❌ ABSENT** | ✅ | ✅ CNEDOGE_RES/EXTRA | ✅ RESIDENCIA_% | **PHANTOM** |
| PRORROGA_VISADO | ✅ | **❌ ABSENT** | **❌ ABSENT** | ❌ Pas de pattern | **INVISIBLE** |
| VISADO_ALTERNATIVO | ✅ | **❌ ABSENT** | **❌ ABSENT** | ❌ Pas de pattern | **INVISIBLE** |
| PERMANENCIA_EXTRANJERIA | ✅ | **❌ ABSENT** | **❌ ABSENT** | ❌ Pas de pattern | **INVISIBLE** |
| SALIDA_VISADO_VENCIDO | ✅ | **❌ ABSENT** | **❌ ABSENT** | ❌ Pas de pattern | **INVISIBLE** |
| VEHICULO_PRIMERA_MATRICULACION | ✅ | ✅ | ✅ DGT | ✅ VEHICULO_% | OK |
| VEHICULO_TRANSFERENCIA | ✅ | ✅ | ✅ DGT | ✅ VEHICULO_% | OK |
| VEHICULO_RENOVACION_CUVE | ✅ | ✅ | ✅ OFIVE | ✅ VEHICULO_% | OK |
| VEHICULO_RENOVACION_ITV | ✅ | ✅ | ✅ ITVE | ✅ VEHICULO_% | OK |
| VEHICULO_DUPLICADO_PERMISO | ✅ | ✅ | ✅ DGT | ✅ VEHICULO_% | OK |
| VEHICULO_DUPLICADO_CUVE | ✅ | ✅ | ✅ OFIVE | ✅ VEHICULO_% | OK |
| **VEHICULO_CAMBIO_CARACTERISTICAS** | **❌ ABSENT** | ✅ | ✅ DGT | ✅ VEHICULO_% | **PHANTOM** |
| CONDUCIR_NUEVO | ✅ | ✅ | ✅ DGT | ✅ CONDUCIR_% | OK |
| CONDUCIR_CANJE | ✅ | ✅ | ✅ DGT | ✅ CONDUCIR_% | OK |
| CONDUCIR_RENOVACION | ✅ | ✅ | ✅ DGT | ✅ CONDUCIR_% | OK |
| CONDUCIR_DUPLICADO | ✅ | ✅ | ✅ DGT | ✅ CONDUCIR_% | OK |
| CONDUCIR_EXTENSION | ✅ | ✅ | ✅ DGT | ✅ CONDUCIR_% | OK |
| CONTRATO_OBRA | ✅ | ✅ | ✅ ONRC | ✅ CONTRATO_% | OK |
| CONTRATO_SERVICIO | ✅ | ✅ | ✅ ONRC | ✅ CONTRATO_% | OK |
| CONTRATO_SUMINISTRO | ✅ | ✅ | ✅ ONRC | ✅ CONTRATO_% | OK |
| CONTRATO_CONCESION | ✅ | ✅ | ✅ ONRC | ✅ CONTRATO_% | OK |
| CONTRATO_JOINT_VENTURE | ✅ | ✅ | ✅ ONRC | ✅ CONTRATO_% | OK |
| CONTRATO_ARRENDAMIENTO | ✅ | ✅ | ✅ ONRC | ✅ CONTRATO_% | OK |
| CONTRATO_OTRO | ✅ | ✅ | ✅ ONRC | ✅ CONTRATO_% | OK |
| FP_VERIFICACION_FUNCIONARIO | ✅ | ✅ | ✅ MINFP | ✅ FP_% | OK |
| FP_CARNET_FUNCIONARIO | ✅ | ✅ | ✅ MINFP | ✅ FP_% | OK |
| FP_PROMOCION_ADMINISTRATIVA | ✅ | ✅ | ✅ MINFP | ✅ FP_% | OK |
| FP_PERMISO_EXTRAORDINARIO | ✅ | ✅ | ✅ MINFP | ✅ FP_% | OK |
| FP_CERTIFICADO_ADMINISTRATIVO | ✅ | ✅ | ✅ MINFP | ✅ FP_% | OK |

### 7.2 Résumé des Inconsistances

| Type | Codes | Nombre |
|------|-------|--------|
| **PHANTOM** (frontend seulement) | RESIDENCIA_DUPLICADO, RESIDENCIA_CAMBIO_DATOS, RESIDENCIA_REAGRUPACION, VEHICULO_CAMBIO_CARACTERISTICAS | **4** |
| **INVISIBLE** (backend seulement) | PRORROGA_VISADO, VISADO_ALTERNATIVO, PERMANENCIA_EXTRANJERIA, SALIDA_VISADO_VENCIDO | **4** |
| **OK** (alignés partout) | 27 codes | **27** |

---

## 8. ÉTAT DES PERMISSIONS

### 8.1 Permissions Menu Config Admin

| Permission Backend | Usage | Assignée aux rôles ? |
|-------------------|-------|---------------------|
| `menu.view_mappings` | Lire workflow mappings et display configs | ✅ Corrigé (rapport 2026-02-01) |
| `menu.create_mapping` | Créer mappings et display configs | ✅ Corrigé |
| `menu.update_mapping` | Modifier mappings et display configs | ✅ Corrigé |
| `menu.delete_mapping` | Supprimer mappings et display configs | ✅ Corrigé |

### 8.2 Permissions Workflow Admin

| Permission Backend | Usage | Nécessaire |
|-------------------|-------|-----------|
| `admin.manage_workflow` | CRUD workflows, documents, tarifs, citas | ✅ Rôle admin/supervisor |

### 8.3 Point d'Attention

Le frontend menuConfigService.ts définit les permissions dans les commentaires JSDoc mais ne les vérifie PAS côté client. La protection est uniquement côté backend via le décorateur `permission_required()`. C'est la bonne pratique, mais cela signifie qu'un admin sans permission verra les boutons mais recevra un 403.

---

## 9. ANALYSE FRONTEND ADMIN PAGES

### 9.1 Page Workflows (`/admin/service-requests/workflows`)

**Fonctionnalités** :
- [x] Liste tous les workflows (predefined + dynamic)
- [x] Groupement par domaine métier (Pasaportes, Residencia, etc.)
- [x] Distinction visuelle predefined (lecture seule) vs dynamic (éditable)
- [x] Statistiques (total, predefined, dynamic)
- [x] Recherche par code/nom/entité/tags
- [x] Filtres par catégorie, statut, source
- [x] Actions : Voir, Éditer (dynamic), Supprimer (dynamic)
- [x] Sync workflows Python → DB

**Problèmes identifiés** :
- [ ] Aucun lien vers la page "Menu Mappings" pour le workflow courant
- [ ] Aucune indication si un workflow a un mapping menu ou non
- [ ] Aucune indication si un workflow a un display config ou non
- [ ] Les workflows PHANTOM (frontend-only) ne sont PAS signalés

### 9.2 Page Workflow Detail (`/admin/service-requests/workflows/[code]`)

**Fonctionnalités** :
- [x] Vue résumé avec onglets
- [x] Onglet Info : édition des propriétés basiques
- [x] Onglet Documents : CRUD documents requis avec conditions
- [x] Onglet Tarifs : CRUD tarifs avec types
- [x] Onglet Suppléments : Surcoûts additionnels
- [x] Onglet Citas : Slots, dates bloquées, règles délai
- [x] Navigation entre workflows (prev/next)

**Problèmes identifiés** :
- [ ] Pas d'onglet "Menu Mapping" pour voir/éditer le mapping associé
- [ ] Pas d'onglet "Display Config" pour configurer l'affichage agent
- [ ] Pour les workflows predefined, aucune info sur les status transitions autorisées

### 9.3 Page Menu Config (`/admin/menu-config`)

**Fonctionnalités** :
- [x] Liste des workflow mappings avec pagination
- [x] CRUD workflow mappings (pattern, icon, sub-menus)
- [x] Liste des display configs
- [x] Toggle activation/désactivation
- [x] Recherche

**Problèmes identifiés** :
- [ ] Aucun lien retour vers le workflow associé
- [ ] La page utilise `workflow_pattern` (ex: `PASAPORTE_%`) alors que la display config utilise `workflow_code` exact — incohérence de modèle
- [ ] Pas de prévisualisation du menu résultant pour un agent donné

---

## 10. ANALYSE BACKEND ADMIN ROUTES

### 10.1 Routes Workflow Admin

**Fichier** : `admin_routes.py` (6582 lignes)
**Préfixe** : `/api/v1/admin/service-requests`

| Endpoint | Méthode | Fonctionnel | Notes |
|----------|---------|-------------|-------|
| `/workflows` | GET | ✅ | Filtre par category, entity, active, is_generic |
| `/workflows` | POST | ✅ | Uniquement is_generic=true |
| `/workflows/{code}` | GET | ✅ | Inclut documents_count, tariffs_count |
| `/workflows/{code}` | PUT | ✅ | |
| `/workflows/{code}` | DELETE | ✅ | Uniquement is_generic, pas de requêtes actives |
| `/workflows/{code}/activate` | PATCH | ✅ | Toggle active |
| `/sync/workflows` | POST | ✅ | Sync Python → DB, dry_run supporté |

### 10.2 Routes Menu Config

**Fichier** : `menu_config_routes.py` (715 lignes)
**Préfixe** : `/api/v1/menu-config`

| Endpoint | Méthode | Fonctionnel | Notes |
|----------|---------|-------------|-------|
| `/me` | GET | ✅ | Menu dynamique de l'agent courant |
| `/workflows` | GET | ✅ | Liste codes pour dropdown |
| `/workflow-mappings` | CRUD | ✅ | Pattern → menu group |
| `/display-configs` | CRUD | ✅ | Exact code → colonnes/sections |
| `/display-configs/by-workflow/{code}` | GET | ✅ | Lookup par code |
| `/display-configs/available-columns/{code}` | GET | ✅ | Discovery colonnes |
| `/display-configs/sample-request/{code}` | GET | ✅ | Preview données |

### 10.3 Service Menu Config

**Fichier** : `menu_config_service.py` (778 lignes)

**Processus de génération menu** :
1. Récupère agent_profile + entity + role
2. Si `role.menu_config IS NOT NULL` → utilise directement (module-based)
3. Sinon → auto-génère depuis `entity.workflow_codes` + `workflow_menu_mapping` patterns
4. Ajoute menus communs (dashboard, my-stats)
5. Applique `agent_profiles.menu_overrides` si présent
6. Cache 5 min

**Point critique** : L'étape 3 ne fonctionne QUE si :
- L'entité a des `workflow_codes` renseignés
- Les patterns dans `workflow_menu_mapping` matchent les codes
- Les icônes retournées sont mappées côté frontend

---

## 11. RECOMMANDATIONS PAR PRIORITÉ

### PRIORITÉ HAUTE (Impact immédiat)

#### R-01 : Résoudre les Workflow Codes PHANTOM
**Action** : Décider pour chaque code si :
- (A) Il doit être ajouté au backend `WorkflowCode` enum + implémenter le workflow
- (B) Il doit être supprimé du frontend `entity-menus.ts` et `types/index.ts`

| Code | Recommandation |
|------|---------------|
| RESIDENCIA_DUPLICADO | **(A)** Ajouter au backend — cas d'usage réel |
| RESIDENCIA_CAMBIO_DATOS | **(A)** Ajouter au backend — cas d'usage réel |
| RESIDENCIA_REAGRUPACION | **(A)** Ajouter au backend — cas d'usage réel |
| VEHICULO_CAMBIO_CARACTERISTICAS | **(A)** Ajouter au backend — cas d'usage réel |

#### R-02 : Rendre les Workflows VISADO Visibles
**Action** : Ajouter les 4 workflows `VISADO_*` et `PERMANENCIA_*` / `SALIDA_*` à :
1. `entity-menus.ts` sous EXTRANJERIA_CONFIG
2. `types/index.ts` WorkflowCode type
3. `workflow_menu_mapping` DB (pattern `VISADO_%` ou `PRORROGA_%` ou ajout au pattern `RESIDENCIA_%`)

#### R-03 : Ajouter un lien croisé Workflow ↔ Menu Mapping dans l'admin
**Action** : Dans la page workflow detail, ajouter un onglet ou section montrant le mapping menu associé avec lien direct vers l'édition.

### PRIORITÉ MOYENNE (Amélioration qualité)

#### R-04 : Enrichir les Display Configs
**Action** : Créer des display configs pour les 6 catégories principales (au minimum un par pattern). L'admin actuel ne peut les créer que manuellement, workflow par workflow.

#### R-05 : Ajouter un indicateur de santé menu dans l'admin
**Action** : Sur la page workflows list, afficher pour chaque workflow :
- ✅ Mapping menu configuré / ❌ Pas de mapping
- ✅ Display config / ❌ Pas de display config
- ✅ Documents définis / ⚠️ Aucun document
- ✅ Tarifs définis / ⚠️ Aucun tarif

#### R-06 : Augmenter le retry et ajouter notification fallback
**Action** : Passer le retry de 1 à 3 dans `useAgentDashboard.ts`. Ajouter un toast/banner quand le fallback statique est utilisé pour alerter l'admin.

### PRIORITÉ BASSE (Optimisation)

#### R-07 : Synchroniser entity-menus.ts depuis la DB
**Action** : À terme, supprimer `entity-menus.ts` et remplacer le fallback par un cache local persistant (localStorage) du dernier menu dynamique reçu.

#### R-08 : Unifier le modèle pattern/code
**Action** : `workflow_menu_mapping` utilise des patterns SQL (`PASAPORTE_%`) tandis que `workflow_display_config` utilise des codes exacts. Harmoniser vers des codes exacts partout (une entrée par workflow_code dans la mapping table aussi).

---

## 12. PLAN DE MIGRATION PROPOSÉ

### Phase 1 : Alignement des Données (Critique)
- [ ] Résoudre les 4 workflow codes PHANTOM
- [ ] Ajouter les 4 workflows VISADO/PERMANENCIA au frontend
- [ ] Valider que les 35 workflow codes sont alignés backend ↔ frontend
- [ ] Créer display configs pour les 6 catégories principales

### Phase 2 : UX Admin Unifiée (Haute)
- [ ] Ajouter indicateur santé (mapping/display/docs/tarifs) sur la page workflows
- [ ] Ajouter lien croisé workflow → menu mapping dans le detail workflow
- [ ] Ajouter preview du menu agent résultant dans la page menu-config
- [ ] Ajouter notification admin quand un agent utilise le fallback statique

### Phase 3 : Élimination du Fallback Statique (Moyenne)
- [ ] Implémenter un cache localStorage du dernier menu dynamique
- [ ] Réduire `entity-menus.ts` à un strict minimum de secours
- [ ] Augmenter retry à 3 avec backoff exponentiel
- [ ] Ajouter monitoring/alerting sur le taux de fallback

### Phase 4 : Consolidation (Basse)
- [ ] Migrer `workflow_menu_mapping` de pattern vers codes exacts
- [ ] Implémenter la propagation sync → mapping + display config
- [ ] Supprimer `entity-menus.ts` complètement
- [ ] Documenter le processus d'ajout d'un nouveau workflow de A à Z

---

## ANNEXES

### A. Fichiers Clés par Module

**Frontend Admin Workflow** :
```
packages/web/src/
├── modules/admin/
│   ├── components/AdminSidebar.tsx (637 lines)
│   ├── components/WorkflowMappingForm.tsx
│   ├── services/menuConfigService.ts (398 lines)
│   ├── hooks/useWorkflowMappings.ts
│   ├── hooks/useDisplayConfigs.ts
│   └── hooks/useWorkflowCodes.ts
├── modules/service-requests-admin/
│   ├── services/api.ts (460+ lines)
│   ├── hooks/index.ts
│   └── types/index.ts
├── modules/agent-dashboard/
│   ├── config/entity-menus.ts (983 lines) ← V1 STATIQUE
│   ├── types/index.ts (215 lines)
│   ├── types/menu-config.ts (141 lines)
│   ├── hooks/useMenuConfig.ts (264 lines)
│   ├── hooks/useAgentDashboard.ts (461 lines)
│   ├── components/GenericAgentSidebar.tsx (800 lines)
│   └── components/DynamicMenu.tsx (339 lines)
└── core/config/features.ts (114 lines) ← Feature flags
```

**Backend Workflow** :
```
packages/backend/app/modules/
├── service_requests/
│   ├── models/enums.py (184 lines)
│   ├── services/workflow_engine.py (1220 lines)
│   ├── api/admin_routes.py (6582 lines)
│   └── workflows/ (13 fichiers, 13578 lines total)
├── menu_config/
│   ├── models/menu_config.py (362 lines)
│   ├── api/menu_config_routes.py (715 lines)
│   ├── services/menu_config_service.py (778 lines)
│   ├── repositories/workflow_mapping_repository.py (339 lines)
│   └── repositories/display_config_repository.py (786 lines)
└── assignment/ (routes, services, repositories)
```

### B. Feature Flags Pertinents

| Flag | Valeur Défaut | Impact |
|------|--------------|--------|
| `NEXT_PUBLIC_FEATURE_DYNAMIC_MENUS` | `true` | Active les menus dynamiques |
| `NEXT_PUBLIC_FEATURE_DYNAMIC_WIDGETS` | `false` | Widgets dashboard dynamiques |
| `NEXT_PUBLIC_FEATURE_DYNAMIC_FORM` | `true` | Formulaire dynamique wizard |
| `NEXT_PUBLIC_FEATURE_CACHE_FIRST_WIZARD` | `true` | Cache-first wizard V2 |

### C. Migrations DB Pertinentes

| Migration | Table/Action | Statut |
|-----------|-------------|--------|
| 063 | `workflow_menu_mapping`, `menu_templates`, roles JSONB cols | ✅ Appliquée |
| 064 | Seed data workflow mappings (6 entries) | ✅ Appliquée |
| 087 | `workflow_display_config` (pattern-based) | ✅ Appliquée |
| 088 | Migrate pattern → exact code + rename column | ✅ Appliquée |

---

*Rapport généré le 2026-02-09. Ce rapport doit être mis à jour après chaque phase de correction.*
