# 🗄️ Guide Migration - Données JSON vers Supabase

**Date de création** : 29 septembre 2025
**Dernière mise à jour** : 29 septembre 2025
**Version** : 2.0
**Auteur** : Claude Code Assistant

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Pré-requis](#pré-requis)
3. [Structure des données](#structure-des-données)
4. [Migration manuelle](#migration-manuelle)
5. [Migration automatique](#migration-automatique)
6. [Validation post-migration](#validation-post-migration)
7. [Dépannage](#dépannage)
8. [Maintenance](#maintenance)

---

## 🎯 Vue d'ensemble

Ce guide détaille le processus de migration des données JSON du système TaxasGE vers la base de données Supabase. La migration inclut la hiérarchie complète des entités gouvernementales et fiscales de Guinée Équatoriale.

### Entités Migrées
- **Ministères** (14 entrées)
- **Secteurs** (~18 entrées)
- **Catégories** (~105 entrées)
- **Sous-catégories** (~120 entrées)
- **Services fiscaux** (~600 entrées)
- **Traductions** (~2000+ entrées en ES/FR/EN)

---

## ⚙️ Pré-requis

### Outils Requis
```bash
# Installation sur Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y jq postgresql-client

# Validation des outils
jq --version          # JSON processor
psql --version        # PostgreSQL client
```

### Variables d'Environnement
```bash
export DATABASE_URL="postgresql://postgres:[password]@[host]:[port]/postgres"
export SUPABASE_URL="https://[project-id].supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

### Fichiers Requis
- `data/ministerios.json`
- `data/sectores.json`
- `data/categorias.json`
- `data/sub_categorias.json`
- `data/taxes.json`

---

## 📊 Structure des Données

### Hiérarchie des Entités
```
Ministères (14)
  ├── Secteurs (18)
  │   ├── Catégories (105)
  │   │   ├── Sous-catégories (120)
  │   │   │   └── Services fiscaux (600)
  │   │   └── Traductions (2000+)
```

### Format JSON Standard
```json
{
  "id": "M-001",
  "nombre_es": "Nom en espagnol",
  "nombre_fr": "Nom en français",
  "nombre_en": "Nom en anglais",
  "parent_id": "PARENT-ID"  // Selon la hiérarchie
}
```

### Mapping Base de Données
| Fichier JSON | Table Supabase | Clé Primaire | Clé Étrangère |
|--------------|----------------|--------------|---------------|
| ministerios.json | ministries | ministry_code | - |
| sectores.json | sectors | sector_code | ministry_id |
| categorias.json | categories | category_code | sector_id |
| sub_categorias.json | subcategories | subcategory_code | category_id |
| taxes.json | fiscal_services | service_code | subcategory_id |

---

## 🔧 Migration Manuelle

### 1. Préparation
```bash
# Cloner le repository
git clone [repository-url]
cd taxasge

# Vérifier les fichiers JSON
ls -la data/*.json

# Valider la structure JSON
jq '.[0]' data/ministerios.json
```

### 2. Exécution du Script
```bash
# Rendre le script exécutable
chmod +x scripts/import_json_to_supabase_fixed.sh

# Exécuter l'import
bash scripts/import_json_to_supabase_fixed.sh
```

### 3. Surveillance des Logs
```bash
# Logs de succès
🎉 Import réussi:
   • Ministères: 14
   • Secteurs: 18
   • Catégories: 105
   • Sous-catégories: 120
   • Services fiscaux: 600
   • Traductions: 2000+

# Logs d'erreur à surveiller
❌ FK resolution failed
⚠️ NULL values found
```

---

## 🤖 Migration Automatique (GitHub Actions)

### Déclenchement Automatique
La migration s'exécute automatiquement lors de :
- Push sur `main` ou `develop`
- Modification des fichiers dans `data/`
- Déploiement backend manuel

### Workflow GitHub Actions
```yaml
name: 🗄️ JSON Data Import to Supabase
steps:
  - name: Install Dependencies
    run: sudo apt-get install -y jq postgresql-client

  - name: Run Import Script
    run: bash scripts/import_json_to_supabase_fixed.sh
```

### Monitoring CI/CD
```bash
# Vérifier le statut du workflow
gh workflow list
gh run list --workflow="deploy-backend.yml"

# Voir les logs détaillés
gh run view [run-id] --log
```

---

## ✅ Validation Post-Migration

### 1. Vérification de la Hiérarchie
```sql
-- Compter les entités par niveau
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
```

### 2. Validation des Traductions
```sql
-- Vérifier les traductions par langue
SELECT
  entity_type,
  language_code,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY entity_type) as percentage
FROM translations
GROUP BY entity_type, language_code
ORDER BY entity_type, language_code;
```

### 3. Détection des Orphelins
```sql
-- Identifier les clés étrangères orphelines
SELECT 'sectors' as table_name, s.sector_code, s.ministry_id
FROM sectors s
LEFT JOIN ministries m ON m.id = s.ministry_id
WHERE m.id IS NULL

UNION ALL

SELECT 'categories', c.category_code, c.sector_id::text
FROM categories c
LEFT JOIN sectors s ON s.id = c.sector_id
WHERE s.id IS NULL;
```

### 4. Validation des Montants
```sql
-- Vérifier les services fiscaux avec montants
SELECT
  service_code,
  expedition_amount,
  renewal_amount,
  CASE
    WHEN expedition_amount = 0 AND renewal_amount = 0 THEN 'Gratuit'
    WHEN expedition_amount > 0 AND renewal_amount = 0 THEN 'Payant (expédition)'
    WHEN expedition_amount > 0 AND renewal_amount > 0 THEN 'Payant (exp. + renouv.)'
  END as type_tarification
FROM fiscal_services
WHERE is_active = true
ORDER BY expedition_amount DESC
LIMIT 20;
```

---

## 🔧 Dépannage

### Problèmes Fréquents

#### 1. Erreur "jq: command not found"
```bash
# Solution Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y jq

# Solution MacOS
brew install jq

# Solution Alpine Linux
apk add jq
```

#### 2. Erreur "psql: command not found"
```bash
# Solution Ubuntu/Debian
sudo apt-get install -y postgresql-client

# Solution MacOS
brew install postgresql

# Solution Alpine Linux
apk add postgresql-client
```

#### 3. Erreur de Connexion Database
```bash
# Vérifier la variable DATABASE_URL
echo $DATABASE_URL

# Tester la connexion
psql "$DATABASE_URL" -c "SELECT version();"

# Format correct
postgresql://username:password@host:port/database
```

#### 4. FK Resolution Failed
```sql
-- Identifier les IDs manquants
SELECT DISTINCT ministerio_id
FROM staging_sectors
WHERE ministerio_id NOT IN (
  SELECT data->>'id' FROM staging_ministries
);
```

### Logs de Debug
```bash
# Activer les logs détaillés
export DEBUG=1
bash scripts/import_json_to_supabase_fixed.sh

# Vérifier les tables staging
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM staging_ministries;"
```

---

## 🔄 Maintenance

### Mise à Jour des Données

#### 1. Ajout de Nouvelles Entités
```bash
# Éditer le fichier JSON approprié
vim data/ministerios.json

# Réexécuter l'import (idempotent)
bash scripts/import_json_to_supabase_fixed.sh
```

#### 2. Correction des Traductions
```sql
-- Mise à jour directe en base
UPDATE translations
SET content = 'Nouveau nom correct'
WHERE entity_type = 'ministry'
  AND entity_id = '[ministry-uuid]'
  AND language_code = 'fr';
```

#### 3. Nettoyage Périodique
```sql
-- Supprimer les entités inactives anciennes
DELETE FROM fiscal_services
WHERE is_active = false
  AND updated_at < NOW() - INTERVAL '1 year';

-- Nettoyer les traductions orphelines
DELETE FROM translations t
WHERE NOT EXISTS (
  SELECT 1 FROM ministries m WHERE m.id = t.entity_id AND t.entity_type = 'ministry'
  UNION
  SELECT 1 FROM sectors s WHERE s.id = t.entity_id AND t.entity_type = 'sector'
  -- ... autres tables
);
```

### Monitoring Régulier

#### Métriques à Surveiller
```sql
-- Croissance des données
SELECT
  DATE(created_at) as date,
  COUNT(*) as new_entries
FROM fiscal_services
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- Qualité des traductions
SELECT
  language_code,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE LENGTH(content) > 5) as quality_entries,
  ROUND(COUNT(*) FILTER (WHERE LENGTH(content) > 5) * 100.0 / COUNT(*), 2) as quality_percentage
FROM translations
GROUP BY language_code;
```

### Sauvegarde Recommandée
```bash
# Backup avant mise à jour majeure
pg_dump "$DATABASE_URL" \
  --table=ministries \
  --table=sectors \
  --table=categories \
  --table=subcategories \
  --table=fiscal_services \
  --table=translations \
  > backup_taxasge_$(date +%Y%m%d).sql
```

---

## 📞 Support

### Documentation Connexe
- `docs/schema/database_schema.md` - Schéma complet de la base
- `scripts/README_MIGRATION.md` - Détails techniques du script
- `docs/rapports/RAPPORT_CORRECTION_SCRIPT_IMPORTATION.md` - Analyse des corrections

### Contacts
- **Équipe Technique** : [Support GitHub Issues]
- **Documentation** : `docs/documentations projet/`
- **Logs** : GitHub Actions Workflows

---

**📝 Guide maintenu par** : Claude Code Assistant
**🔄 Dernière révision** : 29 septembre 2025
**📍 Version** : 2.0 (Post-correction critique)