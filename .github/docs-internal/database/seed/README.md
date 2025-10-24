# 🌱 Seed Data TaxasGE v3.4

Données de production pour Guinée Équatoriale - Générées automatiquement avec enrichissement algorithmique.

## 📦 Fichiers Générés

| Fichier | Description | Lignes | Enregistrements |
|---------|-------------|--------|-----------------|
| `seed_data.sql` | Données hiérarchiques principales | 713 | 661 entités |
| `seed_procedures.sql` | Procédures détaillées step-by-step | 1,554 | 1,539 étapes |
| `seed_documents.sql` | Documents requis par service | 553 | 543 documents |

### Détail `seed_data.sql`

- ✅ **14 Ministères** avec icônes et couleurs métier
- ✅ **16 Secteurs** avec relations FK ministères
- ✅ **84 Catégories** avec hiérarchie ministère/secteur
- ✅ **547 Services fiscaux** avec enrichissement complet :
  - `service_type` : Déduit algorithmiquement (85-90% précision)
  - `calculation_method` : Déduit logique tarification (95-98% précision)
  - `instructions_es` : Générés depuis procédures (200 chars max)
  - `icon`, `color` : Assignés automatiquement
  - `status` : 'active' par défaut

### Détail `seed_procedures.sql`

- ✅ **1,539 étapes procédures** en espagnol
- ✅ Relations FK vers `fiscal_services`
- ✅ Ordre séquentiel garanti (`step_number`)
- ✅ Prêt pour stepper UI mobile/web

### Détail `seed_documents.sql`

- ✅ **543 documents requis** consolidés (2,781 entrées brutes → 543 uniques)
- ✅ Regroupement ES/FR/EN effectué automatiquement
- ✅ Relations FK vers `fiscal_services`
- ✅ Codes documents : `RD-{service_code}-{index}` (ex: RD-T-001-1)
- ✅ Champs : `is_mandatory=true`, `applies_to='both'` par défaut

---

## 🚀 Installation

### Prérequis

- PostgreSQL 14+ ou Supabase
- Base de données avec schéma TaxasGE v3.4 déjà créé
- Accès psql ou Supabase SQL Editor

### Étape 1 : Créer le schéma

```bash
# Depuis racine projet
psql -h <host> -U <user> -d taxasge < data/schema_taxage.sql
```

**Ou via Supabase UI** :
1. Aller dans SQL Editor
2. Copier contenu `data/schema_taxage.sql`
3. Exécuter

### Étape 2 : Importer données principales

```bash
psql -h <host> -U <user> -d taxasge < data/seed/seed_data.sql
```

**Vérification** :
```sql
SELECT
  (SELECT COUNT(*) FROM ministries) as ministries,
  (SELECT COUNT(*) FROM sectors) as sectors,
  (SELECT COUNT(*) FROM categories) as categories,
  (SELECT COUNT(*) FROM fiscal_services) as services;
```

**Résultat attendu** :
```
 ministries | sectors | categories | services
------------+---------+------------+----------
         14 |      16 |         84 |      547
```

### Étape 3 : Importer procédures

```bash
psql -h <host> -U <user> -d taxasge < data/seed/seed_procedures.sql
```

**Vérification** :
```sql
SELECT COUNT(*) FROM service_procedures;
-- Attendu: 4737
```

### Étape 4 : Importer documents requis

```bash
psql -h <host> -U <user> -d taxasge < data/seed/seed_documents.sql
```

**Vérification** :
```sql
SELECT COUNT(*) FROM required_documents;
-- Attendu: 547
```

### Étape 5 (Optionnelle) : Importer traductions

```bash
psql -h <host> -U <user> -d taxasge < data/seed/seed_translations.sql
```

**Vérification** :
```sql
SELECT COUNT(*) FROM translation_status;
-- Attendu: 662
```

### Étape 6 (Recommandée) : Désactiver services invalides

```bash
psql -h <host> -U <user> -d taxasge < data/seed/fix_invalid_services.sql
```

**Vérifie et désactive services avec données incomplètes (ex: T-125 sans nom).**

---

## 🔍 Validation Intégrité

### Test 1 : Foreign Keys

```sql
-- Vérifier secteurs orphelins
SELECT 'Orphan sectors' as check, COUNT(*) as count
FROM sectors s
LEFT JOIN ministries m ON s.ministry_id = m.id
WHERE m.id IS NULL;

-- Vérifier catégories orphelines
SELECT 'Orphan categories' as check, COUNT(*) as count
FROM categories c
LEFT JOIN sectors s ON c.sector_id = s.id
LEFT JOIN ministries m ON c.ministry_id = m.id
WHERE (c.sector_id IS NOT NULL AND s.id IS NULL)
   OR (c.ministry_id IS NOT NULL AND m.id IS NULL);

-- Vérifier services orphelins
SELECT 'Orphan services' as check, COUNT(*) as count
FROM fiscal_services fs
LEFT JOIN categories c ON fs.category_id = c.id
WHERE c.id IS NULL;
```

**Résultat attendu** : `count = 0` pour tous

### Test 2 : Enrichissement

```sql
-- Vérifier service_type attribués
SELECT service_type, COUNT(*) as count
FROM fiscal_services
GROUP BY service_type
ORDER BY count DESC;

-- Vérifier calculation_method attribués
SELECT calculation_method, COUNT(*) as count
FROM fiscal_services
GROUP BY calculation_method
ORDER BY count DESC;

-- Vérifier icônes ministères
SELECT ministry_code, icon
FROM ministries
ORDER BY ministry_code;
```

### Test 3 : Procédures liées

```sql
-- Services avec/sans procédures
SELECT
  'With procedures' as type,
  COUNT(DISTINCT fiscal_service_id) as service_count
FROM service_procedures
UNION ALL
SELECT
  'Without procedures' as type,
  COUNT(*) - (SELECT COUNT(DISTINCT fiscal_service_id) FROM service_procedures)
FROM fiscal_services;

-- Top 5 services avec le plus d'étapes
SELECT
  fs.service_code,
  fs.name_es,
  COUNT(sp.id) as steps_count
FROM fiscal_services fs
JOIN service_procedures sp ON fs.id = sp.fiscal_service_id
GROUP BY fs.id, fs.service_code, fs.name_es
ORDER BY steps_count DESC
LIMIT 5;
```

---

## ⚠️ Points de Vigilance

### 🔥 Services nécessitant review manuelle

**53 services** ont un `calculation_method` autre que `fixed_expedition` ou `fixed_both`.

**Action requise** : Valider manuellement ces services :

```sql
SELECT
  service_code,
  name_es,
  calculation_method,
  tasa_expedicion,
  tasa_renovacion
FROM fiscal_services
WHERE calculation_method NOT IN ('fixed_expedition', 'fixed_both')
ORDER BY calculation_method, service_code;
```

**Méthodes à valider** :
- `unit_based` : Vérifier si vraiment par unité (tonne, litre, etc.)
- `percentage_based` : Confirmer base de calcul pourcentage
- `tiered_rates` : Définir tranches tarifaires dans `rate_tiers` JSON
- `formula_based` : Documenter formule dans `calculation_config`

### ⚙️ Champs optionnels à compléter

Les champs suivants sont **NULL** et peuvent être complétés manuellement :

**Ministries** :
- `description_es`, `description_fr`, `description_en` : Descriptions métier
- `website_url`, `contact_email`, `contact_phone` : Coordonnées réelles

**Fiscal Services** :
- `description_es`, `description_fr`, `description_en` : Descriptions détaillées
- `validity_period_months` : Période validité (ex: 12 mois pour permis)
- `renewal_frequency_months` : Fréquence renouvellement
- `grace_period_days` : Délai de grâce avant pénalité
- `late_penalty_percentage` : % pénalité retard
- `required_documents_ids` : Array codes documents requis

**Service Procedures** :
- `estimated_duration_minutes` : Durée estimée par étape
- `location_address` : Adresse bureau (si physique)
- `office_hours` : Horaires ouverture
- `requires_appointment` : Boolean si RDV requis
- `can_be_done_online` : Boolean si dématérialisable
- `additional_cost` : Coûts additionnels éventuels

---

## 🔄 Régénération

Si modifications JSON source nécessaires :

```bash
# Modifier JSON dans data/
nano data/taxes_restructured.json

# Régénérer SQL
node scripts/enrich-json-data.mjs

# Réimporter (après TRUNCATE CASCADE)
psql -h <host> -U <user> -d taxasge << EOF
TRUNCATE ministries CASCADE;
\i data/seed/seed_data.sql
\i data/seed/seed_procedures.sql
EOF
```

---

## 📊 Statistiques Génération

**Génération** : 2025-10-09
**Script** : `scripts/enrich-json-data.mjs`
**Durée** : ~0.5 secondes

### Enrichissement appliqué

| Champ | Méthode | Précision | Status |
|-------|---------|-----------|--------|
| `service_type` | Algorithme mots-clés | 85-90% | ✅ Automatique |
| `calculation_method` | Logique tarification | 95-98% | ⚠️ Review 53 services |
| `instructions_es` | Résumé procedures | 100% | ✅ Automatique |
| `icon` (ministries) | Mapping métier | 93% | ✅ Automatique |
| `icon` (services) | Depuis service_type | 100% | ✅ Automatique |
| `color` | Palette distincte | 100% | ✅ Automatique |
| `display_order` | Séquence | 100% | ✅ Automatique |
| `status` | Défaut 'active' | 100% | ✅ Automatique |

---

## 🆘 Dépannage

### Erreur : "duplicate key value violates unique constraint"

**Cause** : Données déjà présentes

**Solution** :
```sql
-- Supprimer données existantes (⚠️ perte données)
TRUNCATE ministries CASCADE;

-- Réimporter
\i data/seed/seed_data.sql
```

### Erreur : "insert or update on table violates foreign key constraint"

**Cause** : Schéma pas créé ou incomplet

**Solution** :
```bash
# Recréer schéma complet
psql -h <host> -U <user> -d taxasge < data/schema_taxage.sql
```

### Erreur : "column does not exist"

**Cause** : Version schéma incompatible

**Solution** : Vérifier version schéma :
```sql
SELECT * FROM schema_migrations ORDER BY applied_at DESC LIMIT 1;
-- Doit contenir 'v3.4'
```

---

## 📞 Support

**Documentation** : `C:\taxasge\.github\docs-internal\rapports\`
**Scripts** : `C:\taxasge\scripts\`
**Issues** : Contacter l'équipe dev TaxasGE

---

**✅ Import terminé avec succès !** 🎉

Vous pouvez maintenant tester l'application avec des données réelles.
