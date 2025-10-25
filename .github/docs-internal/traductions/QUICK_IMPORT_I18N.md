# 🚀 Import Rapide I18N + Keywords - 5 Étapes PRODUCTION

## ⚠️ Exécuter dans l'ordre via votre interface Supabase

---

## Étape 1 : Créer la table entity_translations

**Fichier** : `data/seed/seed_all_translations_with_schema.sql`

**Action** : Créer la table pour stocker les traductions

✅ Exécuter ce fichier en PREMIER

---

## Étape 2 : Importer ENUMs

**Fichier** : `data/seed/seed_enum_translations.sql`

**Contenu** : 309 traductions ENUMs (payment_status, user_role, etc.)

✅ Exécuter après Étape 1

---

## Étape 3 : Importer Entités

**Fichier** : `data/seed/seed_translations.sql`

**Contenu** : 1324 traductions
- Ministries (28)
- Sectors (32)
- Categories (172)
- Services (1092)

✅ Exécuter après Étape 2

---

## Étape 4 : Importer Procedures & Documents

**Fichier** : `data/seed/seed_procedures_documents_translations.sql`

**Contenu** : 5092 traductions
- Procedures (3158)
- Documents (1934)

✅ Exécuter après Étape 3

---

## Étape 5 : Importer Keywords (NOUVEAU! ⭐)

**Fichier** : `data/seed/seed_keywords.sql`

**Contenu** : 6990 keywords multilingues
- ES: 2356 keywords
- FR: 2342 keywords
- EN: 2342 keywords
- Services couverts: 543/547 (99.3%)

**Architecture** :
- ✅ FK vers fiscal_services (intégrité référentielle)
- ✅ Index GIN pour recherche ultra-rapide
- ✅ Multilingue natif (es/fr/en)
- ✅ ON CONFLICT DO NOTHING (idempotent)

✅ Exécuter après Étape 4

---

## ✅ Vérification Finale

Exécuter dans votre console SQL:

```sql
-- Vérifier entity_translations
SELECT entity_type, language_code, COUNT(*) as total
FROM entity_translations
GROUP BY entity_type, language_code
ORDER BY entity_type, language_code;

-- Devrait afficher:
-- category       | en | 86
-- category       | fr | 86
-- document       | en | 967
-- document       | fr | 967
-- fiscal_service | en | 546
-- fiscal_service | fr | 546
-- ministry       | en | 14
-- ministry       | fr | 14
-- procedure      | en | 1579
-- procedure      | fr | 1579
-- sector         | en | 16
-- sector         | fr | 16

-- Vérifier enum_translations
SELECT COUNT(*) FROM enum_translations;
-- Devrait afficher: 309

-- Vérifier service_keywords (NOUVEAU!)
SELECT language_code, COUNT(*) as total
FROM service_keywords
GROUP BY language_code
ORDER BY language_code;
-- Devrait afficher:
--   en | 2342
--   es | 2356
--   fr | 2342

-- TOTAL GLOBAL
SELECT
  (SELECT COUNT(*) FROM entity_translations) as entity_trans,
  (SELECT COUNT(*) FROM enum_translations) as enum_trans,
  (SELECT COUNT(*) FROM service_keywords) as keywords,
  (SELECT COUNT(*) FROM entity_translations) +
  (SELECT COUNT(*) FROM enum_translations) +
  (SELECT COUNT(*) FROM service_keywords) as total;
-- Devrait afficher:
-- entity_trans | enum_trans | keywords | total
-- 6416         | 309        | 6990     | 13715
```

---

## 🚨 Si Erreur "relation entity_translations does not exist"

**Cause** : Étape 1 pas exécutée

**Solution** : Exécuter d'abord `seed_all_translations_with_schema.sql`

---

## 📊 Résultat Final

✅ **13715 entrées importées** (traductions + keywords)
✅ **52% couverture traductions** + **99% couverture keywords**
✅ **PRODUCTION-READY** 🎉

### Breakdown

**Traductions (6725)** :
- ENUMs : 309 ✅
- Entités : 1324 ✅
- Procedures/Documents : 5092 ✅

**Keywords (6990)** : ⭐ NOUVEAU
- ES : 2356
- FR : 2342
- EN : 2342
- Couverture : 543/547 services (99.3%)

**Couverture par type** :
- Interface UI : 100% ✅
- ENUMs : 100% ✅
- Entités : 100% ✅
- Keywords : 99% ✅
- Procedures : 33% ⚠️ (suffisant pour production)
- Documents : 33% ⚠️ (suffisant pour production)
