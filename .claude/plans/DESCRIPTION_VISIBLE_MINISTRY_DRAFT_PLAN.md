# Plan: description_visible Toggle + Ministry Description Drafts

## Contexte

- 869 services actifs, 13 avec description_es (tous `description_source = 'manual'`), 856 sans description
- L'enrichissement Gemini va générer automatiquement des descriptions, mais l'admin doit pouvoir contrôler la **visibilité** indépendamment de l'existence de la description
- 21 ministères, 18 avec `description_es` déjà remplie. 3 sans description
- Pas de colonne `description_visible` actuellement sur `fiscal_services`
- Pas de colonne `description_source` sur `ministries`

## Fonctionnalités

### F1 — `description_visible` sur `fiscal_services`
- Colonne `BOOLEAN DEFAULT true` — si false, la description n'est PAS affichée sur le site public même si elle existe
- L'admin peut toggler cette valeur depuis la page de détail/édition d'un service
- Le site public (search + detail) filtre les descriptions non-visibles (retourne NULL)
- L'admin voit toujours la description (page admin) avec un badge indiquant la visibilité

### F2 — Ministry Description Draft Generation
- Ajouter `description_source VARCHAR(20)` sur `ministries` (NULL=pas de source, 'manual', 'ai_draft', 'ai_generated')
- Nouveau task_type `generate_ministry_description` dans enrichment_queue (modifier CHECK constraint)
- L'admin peut déclencher la génération de descriptions de ministères via le seed-batch ou un endpoint dédié
- Les descriptions ministères générées sont stockées avec `description_source = 'ai_draft'` (brouillon)
- L'admin doit **approuver** manuellement le brouillon → `description_source = 'manual'`

## Implémentation

### Phase 1 — Migration BD (`217_description_visible_ministry_source.sql`)

```sql
-- F1: description_visible on fiscal_services
ALTER TABLE fiscal_services ADD COLUMN IF NOT EXISTS description_visible BOOLEAN DEFAULT true;

-- F2: description_source on ministries
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS description_source VARCHAR(20) DEFAULT NULL;
UPDATE ministries SET description_source = 'manual' WHERE description_es IS NOT NULL AND description_es != '';

-- F2: Add generate_ministry_description to enrichment_queue CHECK
ALTER TABLE enrichment_queue DROP CONSTRAINT IF EXISTS enrichment_queue_task_type_check;
ALTER TABLE enrichment_queue ADD CONSTRAINT enrichment_queue_task_type_check
  CHECK (task_type IN ('generate_description', 'generate_keywords', 'translate_fr', 'translate_en', 'generate_ministry_description'));
```

**Checklist**:
- [ ] description_visible column exists, DEFAULT true
- [ ] ministries.description_source column exists
- [ ] 18 ministries with description_source = 'manual'
- [ ] CHECK constraint includes 'generate_ministry_description'

### Phase 2 — Backend Models

**Fichier**: `packages/backend/app/modules/fiscal_services/models/fiscal_service.py`
- Add `description_visible: Optional[bool] = True` to `FiscalServiceBase`
- Add `description_visible: Optional[bool] = None` to `FiscalServiceUpdate`
- Add `description_source: Optional[str] = None` to `FiscalServiceResponse`

**Fichier**: `packages/backend/app/modules/fiscal_services/models/fiscal_service.py` (Ministry models)
- Add `description_source: Optional[str] = None` to `MinistryResponse`

**Checklist**:
- [ ] FiscalServiceBase has description_visible
- [ ] FiscalServiceUpdate has description_visible
- [ ] FiscalServiceResponse has description_source
- [ ] MinistryResponse has description_source

### Phase 3 — Backend Repository

**Fichier**: `packages/backend/app/modules/fiscal_services/repositories/fiscal_service_repository.py`
- Add `fs.description_visible` to `_LIST_COLUMNS` and `_DETAIL_COLUMNS`
- Add `fs.description_source` to `_DETAIL_COLUMNS`
- Add `description_visible` to the INSERT columns in `create()`
- Add `description_visible` to boolean_fields handling in `update()`
- Ministry list query: add `m.description_source`

**Fichier**: `packages/backend/app/modules/fiscal_services/repositories/service_details_repository.py`
- In `get_service_details()`: conditionally NULL description based on `description_visible`
  ```sql
  CASE WHEN fs.description_visible THEN COALESCE(et_desc.translation_text, fs.description_es) ELSE NULL END as description,
  ```

**Fichier**: `packages/backend/app/modules/fiscal_services/repositories/search_repository.py`
- Similar CASE WHEN for public search results

**Checklist**:
- [ ] _LIST_COLUMNS includes description_visible
- [ ] _DETAIL_COLUMNS includes description_visible + description_source
- [ ] CREATE includes description_visible
- [ ] UPDATE handles description_visible (boolean field)
- [ ] Public endpoints filter description by description_visible
- [ ] Ministry list returns description_source

### Phase 4 — Enrichment Module (Ministry Drafts)

**Fichier**: `packages/backend/app/modules/enrichment/services/enrichment_service.py`
- Add `_generate_ministry_description()` handler
- Register handler in `process_batch()` dispatch map
- Add `seed_ministry_descriptions()` method

**Fichier**: `packages/backend/app/modules/enrichment/repositories/enrichment_repository.py`
- Add `get_ministry_context()` method (JOIN ministries + sectors + services count)
- Add `seed_ministry_descriptions()` method

**Fichier**: `packages/backend/app/modules/enrichment/api/enrichment_routes.py`
- Add `POST /enrichment/admin/seed-ministries` endpoint

**Prompt**: Ministry description uses: name_es, sector names, service count per category, context GE government

**Checklist**:
- [ ] Handler dispatches correctly
- [ ] Ministry context query returns useful data
- [ ] Description stored as ai_draft (NOT written directly)
- [ ] Admin seed-ministries endpoint works

### Phase 5 — Frontend: Admin Toggle

**Fichier**: `packages/web/src/types/fiscal-service.ts`
- Add `descriptionVisible?: boolean` to `FiscalServiceBase`
- Add `descriptionSource?: string` to `FiscalServiceResponse`

**Fichier**: `packages/web/src/app/[locale]/(dashboard)/dashboard/admin/fiscal-services/[id]/edit/page.tsx`
- Add Switch toggle for `descriptionVisible` next to description textarea
- Init formData with `descriptionVisible`
- Include in updateData

**Fichier**: `packages/web/src/app/[locale]/(dashboard)/dashboard/admin/fiscal-services/[id]/page.tsx`
- Show visibility badge (Eye/EyeOff icon) next to description
- Show description_source badge (manual/ai_generated)

**Fichier**: `packages/web/src/app/[locale]/(dashboard)/dashboard/admin/fiscal-services/page.tsx`
- Add small visibility indicator in table row (dot/icon)

**Translation keys**: es.json, fr.json, en.json

**Checklist**:
- [ ] Toggle in edit form
- [ ] Badges in detail view
- [ ] Indicator in list view
- [ ] Translation keys added

### Phase 6 — Public Pages (Conditional Display)

The backend already handles filtering via CASE WHEN in Phase 3.
Frontend pages already check `service.description &&` before rendering — no change needed.

**Checklist**:
- [ ] Public detail page shows nothing when description_visible=false
- [ ] Search results show nothing when description_visible=false

## Fichiers Concernés

### À créer (1):
1. `packages/backend/database/migrations/217_description_visible_ministry_source.sql`

### À modifier (10):
1. `packages/backend/app/modules/fiscal_services/models/fiscal_service.py`
2. `packages/backend/app/modules/fiscal_services/repositories/fiscal_service_repository.py`
3. `packages/backend/app/modules/fiscal_services/repositories/service_details_repository.py`
4. `packages/backend/app/modules/fiscal_services/repositories/search_repository.py`
5. `packages/backend/app/modules/enrichment/services/enrichment_service.py`
6. `packages/backend/app/modules/enrichment/repositories/enrichment_repository.py`
7. `packages/backend/app/modules/enrichment/api/enrichment_routes.py`
8. `packages/web/src/types/fiscal-service.ts`
9. `packages/web/src/app/[locale]/(dashboard)/dashboard/admin/fiscal-services/[id]/edit/page.tsx`
10. `packages/web/src/app/[locale]/(dashboard)/dashboard/admin/fiscal-services/[id]/page.tsx`
11. `packages/web/src/app/[locale]/(dashboard)/dashboard/admin/fiscal-services/page.tsx`
12. `packages/web/messages/es.json`, `fr.json`, `en.json`

## Séquencement

Phase 1 (Migration) → Phase 2 (Models) → Phase 3 (Repository) → Phase 4 (Enrichment) → Phase 5 (Frontend) → Phase 6 (Verify)
