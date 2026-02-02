# Plan d'optimisation workflow_display_config

**Date**: 2026-02-02
**Objectif**: Optimiser la découverte des colonnes et ajouter le filtrage par sous-type
**Statut**: ✅ PHASES 1-4 COMPLÈTES

---

## Phase 1: Centralisation des constantes ✅

### Objectif
Éviter la duplication des constantes entre Python et SQL

### Étapes

- [x] **1.1** Créer un fichier `constants.py` dans le module menu_config
- [x] **1.2** Importer ces constantes dans `display_config_repository.py`
- [x] **1.3** Mettre à jour `agent_routes._extract_preview_data()` pour utiliser ces constantes

### Checklist de validation Phase 1 ✅
- [x] Constantes définies dans un seul fichier
- [x] Import fonctionnel dans repository
- [x] Import fonctionnel dans agent_routes
- [x] Tests Python passent (syntax check)

---

## Phase 2: Optimisation SQL (une seule requête) ✅

### Objectif
Réduire de 3 requêtes à 2 requêtes avec CTE + UNION ALL

### Étapes

- [x] **2.1** Réécrire `get_available_columns_for_workflow()` avec requête unifiée
- [x] **2.2** Utiliser CTE (WITH) pour éviter double scan
- [x] **2.3** Tester la requête directement en SQL

### Checklist de validation Phase 2 ✅
- [x] Requête unifiée avec CTE + UNION ALL
- [x] Résultats: 60 colonnes (20 top-level + 40 nested)
- [x] Filtres is_minor/motivo fonctionnent

---

## Phase 3: Filtrage par sous-type ✅

### Objectif
Permettre de filtrer les colonnes par is_minor, motivo, etc.

### Étapes

- [x] **3.1** Paramètres optionnels dans repository
- [x] **3.2** Requête SQL avec filtres conditionnels
- [x] **3.3** Endpoint API accepte query params
- [x] **3.4** Frontend (hook + service) accepte filters
- [ ] **3.5** UI de filtrage dans DisplayConfigForm (optionnel - pour plus tard)

### Checklist de validation Phase 3 ✅
- [x] Paramètres optionnels fonctionnels dans repository
- [x] Endpoint accepte query params (is_minor, motivo)
- [x] Frontend peut passer les filtres
- [x] Rétrocompatibilité (sans filtres = toutes les colonnes)

---

## Phase 4: Tests et validation finale ✅

### Checklist de validation Phase 4
- [x] `npm run type-check` passe
- [x] Python syntax OK (tous les fichiers)
- [ ] Interface testée manuellement (à faire après push)
- [ ] Configs existantes fonctionnent (à vérifier)

---

## Phase 5: Commit et push (EN COURS)

### Étapes

- [ ] **5.1** Git status pour voir les fichiers modifiés
- [ ] **5.2** Commit avec message descriptif
- [ ] **5.3** Push vers remote
- [ ] **5.4** Vérifier GitHub Actions

---

## Fichiers modifiés

| Fichier | Phase | Statut |
|---------|-------|--------|
| `menu_config/constants.py` | 1 | ✅ CRÉÉ |
| `menu_config/repositories/display_config_repository.py` | 1, 2, 3 | ✅ MODIFIÉ |
| `service_requests/api/agent_routes.py` | 1 | ✅ MODIFIÉ |
| `menu_config/api/menu_config_routes.py` | 3 | ✅ MODIFIÉ |
| `web/src/modules/admin/services/menuConfigService.ts` | 3 | ✅ MODIFIÉ |
| `web/src/modules/admin/hooks/useDisplayConfigs.ts` | 3 | ✅ MODIFIÉ |
| `web/src/modules/admin/hooks/index.ts` | 3 | ✅ MODIFIÉ |
| `web/src/modules/admin/components/DisplayConfigForm.tsx` | 1 | ✅ MODIFIÉ |
| `database/migrations/089_reset_display_config_to_defaults.sql` | - | ✅ CRÉÉ |
