# 🗄️ TaxasGE - Guide Migration Database

## Analyse Critique et Corrections Apportées

### ❌ Problèmes Identifiés dans l'Ancien Script

1. **Désalignement Structure JSON** :
   - Script cherchait `data->>'nombre'` ➜ **réel** : `nombre_es/nombre_fr/nombre_en`
   - Script cherchait `data->>'sigla'` ➜ **inexistant** dans ministerios.json
   - Script cherchait `data->>'ministry_id'` ➜ **réel** : `ministerio_id`
   - Script cherchait `data->>'category_id'` ➜ **réel** : `categoria_id`
   - Script cherchait `data->>'subcategory_id'` ➜ **réel** : `sub_categoria_id`

2. **Mapping Taxes Incorrect** :
   - Script attendait `expedition_amount/renewal_amount`
   - **réel** : `tasa_expedicion/tasa_renovacion`

3. **Données Incohérentes** :
   - 95% des sub_categorias ont `nombre_*: null`
   - Traductions FR/EN incorrectes dans categorias.json
   - Mélange secteurs/catégories dans sectores.json

### ✅ Corrections Apportées

#### 1. Script d'Importation Corrigé
**Fichier** : `scripts/import_json_to_supabase_fixed.sh`

**Améliorations** :
- ✅ Mapping correct des champs JSON réels
- ✅ Gestion des traductions multilingues (ES/FR/EN)
- ✅ Traitement des valeurs `null` dans subcategories
- ✅ Codes déterministes basés sur les IDs originaux
- ✅ Nettoyage automatique des tables staging
- ✅ Rapport de fin avec statistiques

#### 2. Workflow GitHub Actions Mis à Jour

**Modifications dans** `.github/workflows/deploy-backend.yml` :
- ✅ Remplacement du script défaillant
- ✅ Installation automatique de `jq` et `postgresql-client`
- ✅ Validation post-import optionnelle
- ✅ Gestion des erreurs améliorée

## 🚀 Utilisation

### 1. Import Manuel (Test Local)
```bash
# Pré-requis
sudo apt-get install -y jq postgresql-client

# Export DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host:port/db"

# Exécution
cd taxasge
chmod +x scripts/import_json_to_supabase_fixed.sh
bash scripts/import_json_to_supabase_fixed.sh
```

### 2. Import Automatique (GitHub Actions)
- ✅ Déclenché automatiquement lors du déploiement backend
- ✅ Exécuté après la validation du schema
- ✅ Intégré dans le workflow de CI/CD

## 📊 Structure des Données Importées

### Hiérarchie
```
Ministries (14 entrées)
  └── Sectors (18 entrées)
      └── Categories (105+ entrées)
          └── Subcategories (120+ entrées)
              └── Fiscal Services (600+ entrées)
```

### Traductions
- **ES** : Espagnol (principal)
- **FR** : Français
- **EN** : Anglais

## 🧹 Nettoyage Effectué

### Scripts Supprimés
- ❌ `scripts/import_json_to_supabase.sh` (défaillant)

### Scripts Conservés
- ✅ `scripts/import_json_to_supabase_fixed.sh` (corrigé)
- ✅ `scripts/migration_complete_taxasge.sql` (schema complet)

## ⚠️ Recommandations

### Données JSON à Nettoyer
1. **sub_categorias.json** : Remplacer les `null` par des noms valides
2. **categorias.json** : Corriger les traductions FR/EN erronées
3. **sectores.json** : Séparer les vraies catégories des secteurs

### Validation Post-Import
```sql
-- Vérifier la hiérarchie
SELECT
  COUNT(DISTINCT m.id) as ministries,
  COUNT(DISTINCT s.id) as sectors,
  COUNT(DISTINCT c.id) as categories,
  COUNT(DISTINCT sc.id) as subcategories,
  COUNT(DISTINCT fs.id) as fiscal_services
FROM ministries m
LEFT JOIN sectors s ON s.ministry_id = m.id
LEFT JOIN categories c ON c.sector_id = s.id
LEFT JOIN subcategories sc ON sc.category_id = c.id
LEFT JOIN fiscal_services fs ON fs.subcategory_id = sc.id;

-- Vérifier les traductions
SELECT entity_type, language_code, COUNT(*)
FROM translations
GROUP BY entity_type, language_code
ORDER BY entity_type, language_code;
```

## 📈 Monitoring

### Logs à Surveiller
- Import successful/failed count
- Référence FK non résolues
- Entrées avec `null` values

### Métriques Post-Import
- Temps d'exécution total
- Nombre d'UPSERTs par table
- Statistiques traductions

---
**Auteur** : Claude Code Assistant
**Date** : 2025-09-29
**Version** : 2.0 (Critiques appliquées)