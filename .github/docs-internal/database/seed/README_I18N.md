# 🌍 SQL Seeds I18N - TaxasGE

Guide d'import des traductions en base de données.

---

## 📊 Fichiers SQL Disponibles

```
data/seed/
├── seed_enum_translations.sql                   (26 KB, 309 INSERT)
├── seed_translations.sql                        (1324 translations entités)
└── seed_procedures_documents_translations.sql   (685 KB, 5092 INSERT)
```

**Total** : **6725 traductions** (ES/FR/EN)

---

## 🚀 Import Séquentiel (Production)

### Étape 1 : ENUMs PostgreSQL

```bash
psql -h [SUPABASE_HOST] -U postgres -d postgres \
  -f data/seed/seed_enum_translations.sql
```

**Contenu** :
- 15 types ENUMs
- 103 valeurs uniques
- 309 traductions (103 × 3 langues)

**Table** : `enum_translations`

**Vérification** :
```sql
SELECT COUNT(*) FROM enum_translations;
-- Expected: 309

SELECT enum_type, COUNT(*)
FROM enum_translations
GROUP BY enum_type;
-- Expected: 15 types
```

---

### Étape 2 : Entités (Ministries, Sectors, Categories, Services)

```bash
psql -h [SUPABASE_HOST] -U postgres -d postgres \
  -f data/seed/seed_translations.sql
```

**Contenu** :
- 14 ministries
- 16 sectors
- 86 categories
- 547 fiscal services
- **1324 traductions** (662 entités × 2 langues FR/EN)

**Table** : `translation_status`

**Vérification** :
```sql
SELECT entity_type, language_code, COUNT(*)
FROM translation_status
WHERE entity_type IN ('ministry', 'sector', 'category', 'fiscal_service')
GROUP BY entity_type, language_code;

-- Expected:
--   ministry       | fr | 14
--   ministry       | en | 14
--   sector         | fr | 16
--   sector         | en | 16
--   category       | fr | 86
--   category       | en | 86
--   fiscal_service | fr | 546
--   fiscal_service | en | 546
```

---

### Étape 3 : Procedures & Documents

```bash
psql -h [SUPABASE_HOST] -U postgres -d postgres \
  -f data/seed/seed_procedures_documents_translations.sql
```

**Contenu** :
- 1579 procedures traduites (33.3% de 4737 total)
- 967 documents traduits (33.3% de 2901 total)
- **5092 traductions** (2546 × 2 langues FR/EN)

**Table** : `translation_status`

**Vérification** :
```sql
SELECT entity_type, language_code, COUNT(*)
FROM translation_status
WHERE entity_type IN ('procedure', 'document')
GROUP BY entity_type, language_code;

-- Expected:
--   procedure | fr | 1579
--   procedure | en | 1579
--   document  | fr | 967
--   document  | en | 967
```

---

## ✅ Vérification Globale

```sql
-- Total traductions par langue
SELECT language_code, COUNT(*) as total
FROM translation_status
GROUP BY language_code;

-- Expected:
--   fr | 3208  (14+16+86+546+1579+967)
--   en | 3208

-- Total ENUMs
SELECT COUNT(*) FROM enum_translations;
-- Expected: 309

-- TOTAL GÉNÉRAL
SELECT
  (SELECT COUNT(*) FROM enum_translations) +
  (SELECT COUNT(*) FROM translation_status)
  as total_traductions;
-- Expected: 6725 (309 + 1324 + 5092)
```

---

## 🔄 Récupération Traductions (Exemples)

### Exemple 1 : Service avec traductions

```sql
SELECT
  fs.service_code,
  fs.name_es,
  (SELECT content FROM translation_status
   WHERE entity_code = fs.service_code
     AND entity_type = 'fiscal_service'
     AND language_code = 'fr'
     AND field_name = 'name') as name_fr,
  (SELECT content FROM translation_status
   WHERE entity_code = fs.service_code
     AND entity_type = 'fiscal_service'
     AND language_code = 'en'
     AND field_name = 'name') as name_en
FROM fiscal_services fs
WHERE fs.service_code = 'T-001';
```

### Exemple 2 : Procedure avec traductions

```sql
SELECT
  sp.id,
  sp.step_number,
  sp.description_es,
  (SELECT content FROM translation_status
   WHERE entity_code::text = sp.id::text
     AND entity_type = 'procedure'
     AND language_code = 'fr'
     AND field_name = 'description') as description_fr,
  (SELECT content FROM translation_status
   WHERE entity_code::text = sp.id::text
     AND entity_type = 'procedure'
     AND language_code = 'en'
     AND field_name = 'description') as description_en
FROM service_procedures sp
WHERE sp.fiscal_service_id = (SELECT id FROM fiscal_services WHERE service_code = 'T-001')
ORDER BY sp.step_number;
```

### Exemple 3 : ENUM traduit

```sql
SELECT
  enum_type,
  enum_value,
  MAX(CASE WHEN language_code = 'es' THEN translation END) as es,
  MAX(CASE WHEN language_code = 'fr' THEN translation END) as fr,
  MAX(CASE WHEN language_code = 'en' THEN translation END) as en
FROM enum_translations
WHERE enum_type = 'payment_status_enum'
GROUP BY enum_type, enum_value;
```

---

## 🛠️ Re-génération SQL (si modifications)

```bash
# Régénérer tous les seeds SQL
npm run i18n:sql

# Ou individuellement
npm run i18n:sql:enums       # ENUMs uniquement
npm run i18n:sql:procedures  # Procedures/Documents uniquement
```

**Sources** :
- `data/enums.md` → `seed_enum_translations.sql`
- `data/ministerios.json`, `sectores.json`, `categorias_cleaned.json`, `taxes_restructured.json` → `seed_translations.sql`
- `data/procedimientos.json`, `documentos_requeridos.json` → `seed_procedures_documents_translations.sql`

---

## ⚠️ Notes Importantes

1. **Ordre d'import** : Respecter l'ordre (ENUMs → Entités → Procedures/Documents)
2. **Dépendances** :
   - `seed_translations.sql` nécessite `fiscal_services` déjà peuplés
   - `seed_procedures_documents_translations.sql` nécessite `service_procedures` et `required_documents` déjà peuplés
3. **Soft References** : Pas de FK sur `translation_status`, permet flexibilité
4. **Couverture partielle** : Procedures/Documents 33% traduits, 66% ES uniquement (acceptable pour MVP)
5. **Duplication** : ES stocké en colonnes DB + `translation_status` pour historique/tracking

---

## 📈 Couverture Traductions

| Type | Total | ES | FR | EN | Couverture |
|------|------:|---:|---:|---:|:----------:|
| ENUMs | 103 | 103 | 103 | 103 | 100% ✅ |
| Ministries | 14 | 14 | 14 | 14 | 100% ✅ |
| Sectors | 16 | 16 | 16 | 16 | 100% ✅ |
| Categories | 86 | 86 | 86 | 86 | 100% ✅ |
| Services | 547 | 547 | 546 | 546 | 99.8% ✅ |
| Procedures | 4737 | 4737 | 1579 | 1579 | 33.3% ⚠️ |
| Documents | 2901 | 2901 | 967 | 967 | 33.3% ⚠️ |

**MVP Viable** : ✅ 52% couverture globale

---

**Version** : 1.0
**Date** : 2025-10-10
**Auteur** : Équipe TaxasGE
