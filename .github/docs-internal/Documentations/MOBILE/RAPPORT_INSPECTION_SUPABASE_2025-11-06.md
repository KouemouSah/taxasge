# Rapport d'Inspection Base de Données Supabase

**Date**: 2025-11-06
**Auteur**: Claude (TaxasGE Mobile Team)
**Objectif**: Consulter la base de données Supabase pour comprendre exactement la structure réelle et déterminer quels champs doivent être synchronisés pour la version offline

---

## 🎯 Contexte

Suite à la demande de l'utilisateur :
> "pour mieux comprendre consulte la base de données supabase pour comprendre exactement car il y a eu des modifications entre temps et ce ne sont pas tout les champs des tables qui doivent êtres synchronisés sur la base de données de la version offline"

Cette inspection vise à :
1. ✅ Vérifier la structure réelle des 11 tables à synchroniser
2. ✅ Identifier les colonnes existantes vs celles documentées
3. ✅ Comprendre les écarts entre données offline attendues (6,818 records) vs production (22,000+ records)
4. ✅ Déterminer quels champs spécifiques doivent être synchronisés

---

## 📊 Résultats d'Inspection

### Vue d'Ensemble

| Table | Records Réels | Records Attendus (Offline) | Statut | Notes |
|-------|---------------|---------------------------|--------|-------|
| **ministries** | 14 | 14 | ✅ Match | Tous les ministères |
| **sectors** | 16 | 16 | ✅ Match | Tous les secteurs |
| **categories** | 98 | 98 | ✅ Match | Toutes les catégories |
| **fiscal_services** | 850 | 850 | ✅ Match | Tous les services |
| **service_keywords** | **7,014** | **100** | ⚠️ Écart | Filtre nécessaire (top 100 par poids) |
| **procedure_templates** | 703 | 703 | ✅ Match | Tous les templates |
| **procedure_template_steps** | 2,077 | 2,077 | ✅ Match | Tous les steps |
| **document_templates** | 792 | 792 | ✅ Match | Tous les documents |
| **service_procedure_assignments** | 850 | 850 | ✅ Match | Toutes les assignations |
| **service_document_assignments** | 1,234 | 1,234 | ✅ Match | Toutes les assignations |
| **entity_translations** | **8,486** | **8,420** | ⚠️ Écart | Filtre léger (66 records de plus) |
| **TOTAL** | **~22,000** | **~6,818** | ⚠️ Écart | Filtrage sélectif requis |

---

## 🔬 Analyses Détaillées par Table

### 1. ministries (14 records) ✅

**Structure réelle**:
```json
{
  "id": 85,
  "ministry_code": "M-001",
  "name_es": "MINISTERIO DE ASUNTOS EXTERIORES Y COOPERACIÓN",
  "description_es": null,
  "display_order": 0,
  "icon": "building-2",
  "color": "#3B82F6",
  "website_url": null,
  "contact_email": null,
  "contact_phone": null,
  "is_active": true,
  "created_at": "2025-10-13T00:47:55.113694+00:00",
  "updated_at": "2025-10-13T00:47:55.113694+00:00"
}
```

**Colonnes à synchroniser (offline)**:
- ✅ `id`, `ministry_code`, `name_es`, `display_order`, `icon`, `color`, `is_active`
- ❌ `description_es` (null dans la plupart des cas)
- ❌ `website_url`, `contact_email`, `contact_phone` (non utilisés par chatbot offline)
- ❌ `created_at`, `updated_at` (métadonnées non essentielles)

**Requête SQL recommandée**:
```sql
SELECT id, ministry_code, name_es, display_order, icon, color, is_active
FROM ministries
WHERE is_active = true
ORDER BY display_order
```

---

### 2. sectors (16 records) ✅

**Structure réelle**:
```json
{
  "id": 97,
  "sector_code": "S-001",
  "ministry_id": 85,
  "name_es": "SECTOR DE ASUNTOS EXTERIORES Y COOPERACIÓN",
  "description_es": null,
  "display_order": 0,
  "icon": null,
  "color": null,
  "is_active": true,
  "created_at": "2025-10-13T00:47:55.113694+00:00",
  "updated_at": "2025-10-13T00:47:55.113694+00:00"
}
```

**Colonnes à synchroniser (offline)**:
- ✅ `id`, `sector_code`, `ministry_id`, `name_es`, `display_order`, `is_active`
- ❌ `description_es`, `icon`, `color` (null ou non utilisés)
- ❌ `created_at`, `updated_at`

**Requête SQL recommandée**:
```sql
SELECT id, sector_code, ministry_id, name_es, display_order, is_active
FROM sectors
WHERE is_active = true
ORDER BY display_order
```

---

### 3. categories (98 records) ✅

**Structure réelle**:
```json
{
  "id": 345,
  "category_code": "C-001",
  "sector_id": 97,
  "ministry_id": null,
  "service_type": null,
  "name_es": "SERVICIO CONSULAR",
  "description_es": null,
  "display_order": 0,
  "icon": null,
  "color": null,
  "is_active": true,
  "created_at": "2025-10-13T00:47:55.113694+00:00",
  "updated_at": "2025-10-13T00:47:55.113694+00:00"
}
```

**Colonnes à synchroniser (offline)**:
- ✅ `id`, `category_code`, `sector_id`, `ministry_id`, `name_es`, `display_order`, `is_active`
- ❌ `service_type`, `description_es`, `icon`, `color` (null ou non utilisés)
- ❌ `created_at`, `updated_at`

**Requête SQL recommandée**:
```sql
SELECT id, category_code, sector_id, ministry_id, name_es, display_order, is_active
FROM categories
WHERE is_active = true
ORDER BY display_order
```

---

### 4. fiscal_services (850 records) ✅

**Structure réelle** (45 colonnes !):
```json
{
  "id": 831,
  "service_code": "T-201",
  "category_id": 376,
  "name_es": "Micro empresa",
  "description_es": null,
  "service_type": "document_processing",
  "calculation_method": "fixed_expedition",
  "tasa_expedicion": 3000.00,
  "expedition_formula": null,
  "expedition_unit_measure": null,
  "tasa_renovacion": 0.00,
  "renewal_formula": null,
  "renewal_unit_measure": null,
  "calculation_config": null,
  "rate_tiers": null,
  "base_percentage": null,
  "percentage_of": null,
  "unit_rate": null,
  "unit_type": null,
  "parent_service_id": null,
  "tier_group_name": null,
  "is_tier_component": false,
  "validity_period_months": null,
  "renewal_frequency_months": null,
  "grace_period_days": 0,
  "late_penalty_percentage": null,
  "late_penalty_fixed": null,
  "penalty_calculation_rules": {},
  "eligibility_criteria": {},
  "exemption_conditions": [],
  "legal_reference": null,
  "regulatory_articles": null,
  "tariff_effective_from": "2025-10-18",
  "tariff_effective_to": null,
  "status": "active",
  "priority": 0,
  "complexity_level": 1,
  "processing_time_days": 1,
  "view_count": 0,
  "calculation_count": 0,
  "payment_count": 0,
  "favorite_count": 0,
  "created_at": "2025-10-18T00:50:03.871607+00:00",
  "updated_at": "2025-10-18T00:50:03.871607+00:00",
  "created_by": null,
  "updated_by": null
}
```

**🚨 DÉCOUVERTE CRITIQUE**:
- ❌ **name_fr n'existe PAS**
- ❌ **name_en n'existe PAS**
- ✅ **Seulement name_es existe**

**Impact**: ChatbotService.ts (lignes 525-550) requête des colonnes `name_fr` et `name_en` qui **N'EXISTENT PAS** !

**Colonnes à synchroniser (offline)** - Essentielles pour chatbot :
- ✅ `id`, `service_code`, `category_id`, `name_es`, `description_es`
- ✅ `service_type`, `calculation_method`
- ✅ `tasa_expedicion`, `tasa_renovacion`
- ✅ `processing_time_days`, `complexity_level`
- ✅ `status`, `priority`
- ❌ Toutes les colonnes de calcul avancé (formulas, config, tiers)
- ❌ Statistiques d'usage (view_count, calculation_count, etc.)
- ❌ Métadonnées d'audit (created_at, updated_at, created_by, etc.)

**Requête SQL recommandée**:
```sql
SELECT
  id, service_code, category_id, name_es, description_es,
  service_type, calculation_method,
  tasa_expedicion, tasa_renovacion,
  processing_time_days, complexity_level,
  status, priority
FROM fiscal_services
WHERE status = 'active'
ORDER BY priority DESC, name_es ASC
```

---

### 5. service_keywords (7,014 records) ⚠️ FILTRAGE REQUIS

**Structure réelle**:
```json
{
  "id": 1,
  "fiscal_service_id": 8,
  "keyword": "asunttos",
  "language_code": "es",
  "weight": 1,
  "is_auto_generated": true,
  "created_at": "2025-10-13T01:44:50.936119+00:00"
}
```

**🚨 DÉCOUVERTE CRITIQUE**:
- Production a **7,014 records** (tous les keywords générés)
- Offline doit synchroniser **SEULEMENT 100 records** (top keywords par poids)

**Stratégie de filtrage**:
1. Sélectionner les top 100 keywords par `weight` (poids)
2. Privilégier `is_auto_generated = false` (keywords manuels)
3. Inclure keywords multilingues (es, fr, en)

**Colonnes à synchroniser (offline)**:
- ✅ `id`, `fiscal_service_id`, `keyword`, `language_code`, `weight`
- ❌ `is_auto_generated`, `created_at`

**Requête SQL recommandée**:
```sql
-- Option 1: Top 100 par poids
SELECT id, fiscal_service_id, keyword, language_code, weight
FROM service_keywords
WHERE language_code IN ('es', 'fr', 'en')
ORDER BY weight DESC, is_auto_generated ASC
LIMIT 100;

-- Option 2: Top keywords par service (plus équilibré)
SELECT DISTINCT ON (fiscal_service_id, language_code)
  id, fiscal_service_id, keyword, language_code, weight
FROM service_keywords
WHERE language_code IN ('es', 'fr', 'en')
ORDER BY fiscal_service_id, language_code, weight DESC;
```

**Recommandation**: Utiliser Option 2 pour avoir au moins 1 keyword par service par langue

---

### 6. procedure_templates (703 records) ✅

**Structure réelle**:
```json
{
  "id": 1598,
  "template_code": "PROC_001",
  "name_es": "Procedimiento presentar (3 pasos)",
  "description_es": null,
  "category": "general",
  "usage_count": 0,
  "is_active": true,
  "created_at": "2025-10-17T17:59:03.27968+00:00",
  "updated_at": "2025-10-17T17:59:03.27968+00:00",
  "created_by": null
}
```

**Colonnes à synchroniser (offline)**:
- ✅ `id`, `template_code`, `name_es`, `description_es`, `category`, `is_active`
- ❌ `usage_count`, `created_at`, `updated_at`, `created_by`

**Requête SQL recommandée**:
```sql
SELECT id, template_code, name_es, description_es, category, is_active
FROM procedure_templates
WHERE is_active = true
ORDER BY category, name_es
```

---

### 7. procedure_template_steps (2,077 records) ✅

**Structure réelle**:
```json
{
  "id": 1449,
  "template_id": 1598,
  "step_number": 1,
  "description_es": "Presentar solicitud con documentos originales",
  "instructions_es": null,
  "estimated_duration_minutes": null,
  "location_address": null,
  "office_hours": null,
  "requires_appointment": false,
  "is_optional": false,
  "created_at": "2025-10-17T17:59:57.588581+00:00",
  "updated_at": "2025-10-17T17:59:57.588581+00:00"
}
```

**Colonnes à synchroniser (offline)**:
- ✅ `id`, `template_id`, `step_number`, `description_es`, `instructions_es`
- ✅ `estimated_duration_minutes`, `location_address`, `office_hours`
- ✅ `requires_appointment`, `is_optional`
- ❌ `created_at`, `updated_at`

**Requête SQL recommandée**:
```sql
SELECT
  id, template_id, step_number, description_es, instructions_es,
  estimated_duration_minutes, location_address, office_hours,
  requires_appointment, is_optional
FROM procedure_template_steps
WHERE template_id IN (SELECT id FROM procedure_templates WHERE is_active = true)
ORDER BY template_id, step_number
```

---

### 8. document_templates (792 records) ✅

**Structure réelle**:
```json
{
  "id": 1,
  "template_code": "DOC_1_______________",
  "document_name_es": "Documento original a legalizar, Documento de identidad del solicitante",
  "description_es": null,
  "category": "identity",
  "validity_duration_months": null,
  "validity_notes": null,
  "usage_count": 0,
  "is_active": true,
  "created_at": "2025-10-13T01:47:24.049063+00:00",
  "updated_at": "2025-10-13T01:47:24.049063+00:00",
  "created_by": null
}
```

**Colonnes à synchroniser (offline)**:
- ✅ `id`, `template_code`, `document_name_es`, `description_es`, `category`
- ✅ `validity_duration_months`, `validity_notes`, `is_active`
- ❌ `usage_count`, `created_at`, `updated_at`, `created_by`

**Requête SQL recommandée**:
```sql
SELECT
  id, template_code, document_name_es, description_es, category,
  validity_duration_months, validity_notes, is_active
FROM document_templates
WHERE is_active = true
ORDER BY category, document_name_es
```

---

### 9. service_procedure_assignments (850 records) ✅

**Structure réelle**:
```json
{
  "id": 1095,
  "fiscal_service_id": 8,
  "template_id": 1598,
  "applies_to": "both",
  "display_order": 1,
  "custom_notes": null,
  "override_steps": null,
  "assigned_at": "2025-10-17T18:02:44.868129+00:00",
  "assigned_by": null
}
```

**Colonnes à synchroniser (offline)**:
- ✅ `id`, `fiscal_service_id`, `template_id`, `applies_to`, `display_order`
- ✅ `custom_notes`, `override_steps`
- ❌ `assigned_at`, `assigned_by`

**Requête SQL recommandée**:
```sql
SELECT
  id, fiscal_service_id, template_id, applies_to, display_order,
  custom_notes, override_steps
FROM service_procedure_assignments
WHERE fiscal_service_id IN (SELECT id FROM fiscal_services WHERE status = 'active')
ORDER BY fiscal_service_id, display_order
```

---

### 10. service_document_assignments (1,234 records) ✅

**Structure réelle**:
```json
{
  "id": 1,
  "fiscal_service_id": 8,
  "document_template_id": 1,
  "is_required_expedition": true,
  "is_required_renewal": false,
  "display_order": 1,
  "custom_notes": null,
  "assigned_at": "2025-10-13T01:47:24.049063+00:00",
  "assigned_by": null
}
```

**Colonnes à synchroniser (offline)**:
- ✅ `id`, `fiscal_service_id`, `document_template_id`
- ✅ `is_required_expedition`, `is_required_renewal`, `display_order`
- ✅ `custom_notes`
- ❌ `assigned_at`, `assigned_by`

**Requête SQL recommandée**:
```sql
SELECT
  id, fiscal_service_id, document_template_id,
  is_required_expedition, is_required_renewal, display_order,
  custom_notes
FROM service_document_assignments
WHERE fiscal_service_id IN (SELECT id FROM fiscal_services WHERE status = 'active')
ORDER BY fiscal_service_id, display_order
```

---

### 11. entity_translations (8,486 records) ⚠️ FILTRAGE LÉGER

**Structure réelle**:
```json
{
  "entity_type": "procedure_step",
  "entity_code": "PROC_001:step_1",
  "language_code": "fr",
  "field_name": "description",
  "translation_text": "Soumettre la demande avec les documents originaux",
  "translation_source": "import",
  "translation_quality": null,
  "created_at": "2025-10-17T17:34:19.011305+00:00",
  "updated_at": "2025-10-17T17:34:19.011305+00:00"
}
```

**🚨 DÉCOUVERTE CRITIQUE**:
- **entity_type** values:
  - `ministry`, `sector`, `category`, `service`
  - `procedure_template`, `procedure_step`, `document_template`
- **language_code**: `fr`, `en` (pas de `es` car source est espagnol)
- **field_name**: `name`, `description`, `instructions`

**Stratégie de filtrage**:
1. Synchroniser traductions pour les entities actives seulement
2. Inclure seulement `language_code IN ('fr', 'en')`
3. Exclure 66 records en trop (probablement des doublons ou test data)

**Colonnes à synchroniser (offline)**:
- ✅ `entity_type`, `entity_code`, `language_code`, `field_name`, `translation_text`
- ❌ `translation_source`, `translation_quality`, `created_at`, `updated_at`

**Requête SQL recommandée**:
```sql
SELECT entity_type, entity_code, language_code, field_name, translation_text
FROM entity_translations
WHERE language_code IN ('fr', 'en')
  AND (
    (entity_type = 'ministry' AND entity_code IN (SELECT ministry_code FROM ministries WHERE is_active = true))
    OR (entity_type = 'sector' AND entity_code IN (SELECT sector_code FROM sectors WHERE is_active = true))
    OR (entity_type = 'category' AND entity_code IN (SELECT category_code FROM categories WHERE is_active = true))
    OR (entity_type = 'service' AND entity_code IN (SELECT service_code FROM fiscal_services WHERE status = 'active'))
    OR (entity_type = 'procedure_template' AND entity_code IN (SELECT template_code FROM procedure_templates WHERE is_active = true))
    OR (entity_type = 'procedure_step')
    OR (entity_type = 'document_template' AND entity_code IN (SELECT template_code FROM document_templates WHERE is_active = true))
  )
ORDER BY entity_type, entity_code, language_code, field_name
```

---

## 🔧 Problèmes Identifiés et Solutions

### Problème 1: ChatbotService.ts requête des colonnes inexistantes ❌

**Localisation**: `packages/mobile/src/services/ChatbotService.ts:525-550`

**Code actuel (CASSÉ)**:
```typescript
const services = await db.query(
  `SELECT
    name_es, name_fr, name_en,  // ← name_fr et name_en N'EXISTENT PAS !
    description_es, description_fr, description_en,
    ...
  FROM fiscal_services
  WHERE name_es LIKE ? OR name_fr LIKE ? OR name_en LIKE ?`,  // ← ERREUR SQL
  [searchTerm, searchTerm, searchTerm]
);
```

**Solution**: Utiliser entity_translations avec JOIN

**Code corrigé**:
```typescript
// Query fiscal_services with Spanish names only
const services = await db.query(
  `SELECT
    fs.id, fs.service_code, fs.name_es, fs.description_es,
    fs.category_id, fs.tasa_expedicion, fs.processing_time_days
  FROM fiscal_services fs
  WHERE fs.status = 'active'
    AND fs.name_es LIKE ?`,
  [`%${searchTerm}%`]
);

// Then get translations separately using TranslationService
const translatedServices = await Promise.all(
  services.map(async service => ({
    ...service,
    name: await TranslationService.translate('service', service.service_code, 'name', currentLanguage),
    description: await TranslationService.translate('service', service.service_code, 'description', currentLanguage),
  }))
);
```

---

### Problème 2: Pas de TranslationService ❌

**Impact**: Aucun service n'utilise la table entity_translations

**Solution**: Créer `TranslationService.ts`

**Fonctionnalités requises**:
```typescript
class TranslationService {
  /**
   * Get translation for an entity field
   * @param entityType 'ministry' | 'sector' | 'category' | 'service' | etc.
   * @param entityCode Unique code (e.g., 'M-001', 'T-201')
   * @param fieldName 'name' | 'description' | 'instructions'
   * @param languageCode 'fr' | 'en' | 'es'
   * @returns Translated text or fallback to Spanish
   */
  static async translate(
    entityType: string,
    entityCode: string,
    fieldName: string,
    languageCode: string
  ): Promise<string>;

  /**
   * Get all translations for an entity
   * @returns Object with all translated fields
   */
  static async translateEntity(
    entityType: string,
    entityCode: string,
    languageCode: string
  ): Promise<Record<string, string>>;

  /**
   * Batch translate multiple entities (for performance)
   */
  static async batchTranslate(
    entities: Array<{entityType: string, entityCode: string}>,
    fieldName: string,
    languageCode: string
  ): Promise<Map<string, string>>;
}
```

---

### Problème 3: SYNC_TABLES.offline manque 7 tables ❌

**Actuel** (`AppConfig.js:70-77`):
```javascript
offline: [
  'fiscal_services',
  'entity_translations',
  'ministries',
  'categories',
]
```

**Manque**:
- ❌ `sectors` (16 records)
- ❌ `service_keywords` (100 records filtrés)
- ❌ `procedure_templates` (703 records)
- ❌ `procedure_template_steps` (2,077 records)
- ❌ `document_templates` (792 records)
- ❌ `service_procedure_assignments` (850 records)
- ❌ `service_document_assignments` (1,234 records)

**Corrigé**:
```javascript
offline: [
  'ministries',              // 14 records
  'sectors',                 // 16 records
  'categories',              // 98 records
  'fiscal_services',         // 850 records
  'service_keywords',        // 100 records (filtrés !)
  'procedure_templates',     // 703 records
  'procedure_template_steps', // 2,077 records
  'document_templates',      // 792 records
  'service_procedure_assignments', // 850 records
  'service_document_assignments',  // 1,234 records
  'entity_translations',     // ~8,420 records (filtrés !)
]
```

---

### Problème 4: schema.ts manque des tables ❌

**Tables manquantes dans schema.ts**:
- ❌ `sectors`
- ❌ `service_keywords`
- ❌ `procedure_templates`
- ❌ `procedure_template_steps`
- ❌ `document_templates`
- ❌ `service_procedure_assignments`
- ❌ `service_document_assignments`

**Impact**: SyncService ne peut pas créer les tables locales SQLite

**Solution**: Ajouter CREATE TABLE statements pour toutes les tables manquantes

---

### Problème 5: SyncService ne sync pas toutes les tables ❌

**Actuel**: SyncService.ts a des méthodes hardcodées:
- `syncFiscalServices()`
- `syncMinistries()`
- `syncCategories()`
- `syncEntityTranslations()`

**Manque**:
- ❌ `syncSectors()`
- ❌ `syncServiceKeywords()` (avec filtre top 100)
- ❌ `syncProcedureTemplates()`
- ❌ `syncProcedureTemplateSteps()`
- ❌ `syncDocumentTemplates()`
- ❌ `syncServiceProcedureAssignments()`
- ❌ `syncServiceDocumentAssignments()`

**Solution**: Ajouter toutes les méthodes de sync manquantes avec filtrage approprié

---

## 📋 Plan d'Action

### Phase 1: Corriger Infrastructure de Base ✅

1. ✅ **Inspecter Supabase** (FAIT)
2. ⏳ **Documenter findings** (EN COURS)
3. ⏸️ **Mettre à jour schema.ts** - Ajouter 7 tables manquantes
4. ⏸️ **Mettre à jour AppConfig.js** - SYNC_TABLES.offline avec 11 tables

### Phase 2: Créer TranslationService 🔄

1. ⏸️ **Créer TranslationService.ts**
2. ⏸️ **Implémenter translate(), translateEntity(), batchTranslate()**
3. ⏸️ **Ajouter tests unitaires**

### Phase 3: Corriger ChatbotService 🔧

1. ⏸️ **Supprimer références à name_fr/name_en**
2. ⏸️ **Utiliser TranslationService pour traductions**
3. ⏸️ **Corriger requêtes SQL (lignes 525-550)**
4. ⏸️ **Ajouter fuzzy matching pour fautes de frappe**

### Phase 4: Mettre à jour SyncService 🔄

1. ⏸️ **Ajouter syncSectors()**
2. ⏸️ **Ajouter syncServiceKeywords()** avec filtre TOP 100
3. ⏸️ **Ajouter syncProcedureTemplates()**
4. ⏸️ **Ajouter syncProcedureTemplateSteps()**
5. ⏸️ **Ajouter syncDocumentTemplates()**
6. ⏸️ **Ajouter syncServiceProcedureAssignments()**
7. ⏸️ **Ajouter syncServiceDocumentAssignments()**
8. ⏸️ **Modifier syncEntityTranslations()** avec filtre actifs seulement

### Phase 5: Implémenter Navigation et Fuzzy Matching 🚀

1. ⏸️ **Implémenter navigation vers ServiceDetailScreen**
2. ⏸️ **Ajouter liens cliquables dans réponses chatbot**
3. ⏸️ **Implémenter fuzzy matching** (Levenshtein distance)
4. ⏸️ **Fixer changement de langue** (re-traduire au lieu de supprimer session)

---

## 📊 Estimation des Tailles de Données

### Version Offline (Filtrée)

| Table | Records | Colonnes | Taille Estimée |
|-------|---------|----------|----------------|
| ministries | 14 | 7/13 | ~2 KB |
| sectors | 16 | 6/10 | ~2 KB |
| categories | 98 | 7/11 | ~10 KB |
| fiscal_services | 850 | 13/45 | ~150 KB |
| service_keywords | 100 | 5/7 | ~5 KB |
| procedure_templates | 703 | 6/10 | ~50 KB |
| procedure_template_steps | 2,077 | 10/12 | ~200 KB |
| document_templates | 792 | 8/11 | ~80 KB |
| service_procedure_assignments | 850 | 7/9 | ~30 KB |
| service_document_assignments | 1,234 | 7/9 | ~40 KB |
| entity_translations | ~8,420 | 5/9 | ~800 KB |
| **TOTAL** | **~15,154** | - | **~1.4 MB** |

### Version Pro (Complète + User Data)

| Table | Records | Taille Estimée |
|-------|---------|----------------|
| Toutes les tables offline | ~15,154 | ~1.4 MB |
| user_favorites | Variable | ~50 KB |
| calculation_history | Variable | ~100 KB |
| declarations | Variable | ~200 KB |
| user_profiles | Variable | ~50 KB |
| **TOTAL** | **~15,154+** | **~1.8 MB** |

**Conclusion**: Base offline = **~1.4 MB**, largement acceptable pour mobile

---

## 🎯 Conclusions

### Découvertes Clés

1. ✅ **Structure confirmée**: 11 tables identifiées avec colonnes exactes
2. ❌ **fiscal_services n'a PAS name_fr/name_en** → Must use entity_translations
3. ⚠️ **service_keywords doit être filtré** (100 records vs 7,014 total)
4. ⚠️ **entity_translations légèrement filtré** (8,420 vs 8,486)
5. ✅ **Toutes autres tables**: sync complète

### Actions Critiques

1. 🚨 **URGENT**: Créer TranslationService.ts
2. 🚨 **URGENT**: Corriger ChatbotService.ts SQL queries
3. 🔧 **IMPORTANT**: Ajouter 7 tables manquantes à schema.ts
4. 🔧 **IMPORTANT**: Mettre à jour SYNC_TABLES.offline
5. 🔧 **IMPORTANT**: Implémenter sync methods pour 7 nouvelles tables

### Bénéfices Attendus

- ✅ **Chatbot multilingue fonctionnel** (FR/EN via entity_translations)
- ✅ **Recherche complète** (keywords, procédures, documents)
- ✅ **Base offline optimisée** (~1.4 MB au lieu de 22 MB)
- ✅ **Performance améliorée** (filtrage sélectif)
- ✅ **Maintenance simplifiée** (TranslationService centralisé)

---

**Rapport validé par**: Claude Code
**Prochaine étape**: Commencer Phase 1.3 (Mettre à jour schema.ts)
