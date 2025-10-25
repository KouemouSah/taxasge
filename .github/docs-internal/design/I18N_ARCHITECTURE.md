# 🌐 Architecture i18n TaxasGE - Documentation Consolidée

**Version**: 2.0
**Date**: 2025-10-10
**Status**: ✅ Production

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture Technique](#architecture-technique)
3. [Implémentation](#implémentation)
4. [Guide Utilisation](#guide-utilisation)
5. [Production & Monitoring](#production--monitoring)

---

## 1. Vue d'Ensemble

### 1.1 Objectifs

- ✅ **Multilingue natif**: ES (source) + FR/EN (traductions)
- ✅ **Architecture centralisée**: Table `entity_translations` unifiée
- ✅ **Performance**: Index optimisés, queries < 50ms
- ✅ **Maintenance**: ON CONFLICT DO NOTHING (idempotence)
- ✅ **Coverage**: ENUMs (100%), Services (100%), Keywords (99.3%)

### 1.2 Entités Traduites

| Entité | Format | Source Vérité | Traductions | Coverage |
|--------|--------|---------------|-------------|----------|
| **ENUMs** | Multilingue natif | `tax_types`, `categories` | Dans table source | 100% |
| **Services** | entity_translations | `fiscal_services.service_name_es` | `entity:SERVICE:T-001` | 100% |
| **Ministries** | entity_translations | `ministries.ministry_name_es` | `entity:MINISTRY:123` | 100% |
| **Sectores** | entity_translations | `sectores.sector_name_es` | `entity:SECTOR:456` | 100% |
| **Service Categories** | entity_translations | `service_categories.category_name_es` | `entity:SERVICE_CATEGORY:789` | 100% |
| **Keywords** | Multilingue natif | `service_keywords` | Dans table source | 99.3% |
| **Procedure Templates** | entity_translations | `procedure_template_steps.description_es` | `template:PAYMENT:step_4` | Template-based |
| **Document Templates** | entity_translations | `document_templates.document_name_es` | `template:DOC_PAYMENT` | Template-based |

---

## 2. Architecture Technique

### 2.1 Schema Principal

```sql
-- Table centralisée traductions
CREATE TABLE entity_translations (
    entity_type VARCHAR(50) NOT NULL,      -- 'service', 'procedure_template_step', etc.
    entity_code VARCHAR(255) NOT NULL,     -- 'entity:SERVICE:T-001', 'template:PAYMENT:step_4'
    language_code VARCHAR(10) NOT NULL,    -- 'fr', 'en'
    field_name VARCHAR(50) NOT NULL,       -- 'service_name', 'description'
    translation_text TEXT,
    translation_source VARCHAR(50),        -- 'manual', 'direct_template', 'import'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entity_type, entity_code, language_code, field_name)
);

CREATE INDEX idx_translations_lookup ON entity_translations(
    entity_type, entity_code, language_code, field_name
);
```

### 2.2 Patterns entity_code

| Entity Type | Pattern | Exemple |
|-------------|---------|---------|
| `service` | `entity:SERVICE:{service_code}` | `entity:SERVICE:T-001` |
| `ministry` | `entity:MINISTRY:{id}` | `entity:MINISTRY:123` |
| `sector` | `entity:SECTOR:{id}` | `entity:SECTOR:456` |
| `service_category` | `entity:SERVICE_CATEGORY:{id}` | `entity:SERVICE_CATEGORY:789` |
| `procedure_template_step` | `template:{template_code}:step_{N}` | `template:PAYMENT_STANDARD:step_4` |
| `document_template` | `template:{template_code}` | `template:DOC_COMPROBANTE_PAGO` |

**Rationale**: Prefix `entity:` vs `template:` permet distinction soft references vs templates

### 2.3 Multilingue Natif vs entity_translations

**Multilingue Natif** (colonnes dans table source):
```sql
-- Utilisé pour: ENUMs, Keywords (rarement modifiés, forte cohésion)
CREATE TABLE tax_types (
    id SERIAL PRIMARY KEY,
    type_code VARCHAR(50) UNIQUE NOT NULL,
    type_name_es VARCHAR(100) NOT NULL,
    type_name_fr VARCHAR(100),
    type_name_en VARCHAR(100)
);
```

**entity_translations** (table séparée):
```sql
-- Utilisé pour: Services, Procedures, Documents (modifiés fréquemment, faible cohésion)
INSERT INTO entity_translations
VALUES ('service', 'entity:SERVICE:T-001', 'fr', 'service_name', 'Légalisation documents');
```

**Trade-offs**:

| Critère | Multilingue Natif | entity_translations |
|---------|:-----------------:|:------------------:|
| **Performance** | ✅ Excellent (1 query) | ⚠️ Bon (1 JOIN) |
| **Flexibility** | ❌ Faible (ALTER TABLE) | ✅ Élevée (INSERT) |
| **Cohésion** | ✅ Forte (1 table) | ⚠️ Faible (2 tables) |
| **Use Case** | ENUMs, Keywords | Services, Templates |

---

## 3. Implémentation

### 3.1 Quick Start

**Étape 1: Exécuter migrations**
```bash
psql -U postgres -d taxasge -f data/migrations/001_base_schema.sql
psql -U postgres -d taxasge -f data/migrations/002_i18n_enums.sql
psql -U postgres -d taxasge -f data/migrations/003_create_entity_translations.sql
psql -U postgres -d taxasge -f data/migrations/004_radical_templates_migration.sql
```

**Étape 2: Charger traductions**
```bash
# ENUMs
psql -U postgres -d taxasge -f data/seed/seed_enum_translations.sql

# Entities (services, ministries, sectores, categories)
psql -U postgres -d taxasge -f data/seed/seed_entities_translations.sql

# Keywords
psql -U postgres -d taxasge -f data/seed/seed_keywords.sql

# Templates (procedures + documents)
psql -U postgres -d taxasge -f data/seed/seed_radical_templates.sql
psql -U postgres -d taxasge -f data/seed/seed_template_translations.sql
```

**Étape 3: Valider**
```sql
-- Coverage traductions
SELECT
    entity_type,
    language_code,
    COUNT(*) as count
FROM entity_translations
GROUP BY entity_type, language_code
ORDER BY entity_type, language_code;

-- Expected:
--   entity_type              | language_code | count
--   -------------------------+---------------+-------
--   service                  | fr            | 547
--   service                  | en            | 547
--   ministry                 | fr            | 10
--   procedure_template_step  | fr            | 1049
--   document_template        | fr            | 652
--   ...
```

### 3.2 Backend Queries

**Pattern 1: Services (avec traductions)**
```typescript
async function getService(serviceCode: string, language: string) {
  return await db.query(`
    SELECT
      fs.service_code,
      fs.service_name_es,
      COALESCE(
        et.translation_text,
        fs.service_name_es
      ) as service_name_translated
    FROM fiscal_services fs
    LEFT JOIN entity_translations et ON (
      et.entity_code = 'entity:SERVICE:' || fs.service_code
      AND et.entity_type = 'service'
      AND et.language_code = $2
      AND et.field_name = 'service_name'
    )
    WHERE fs.service_code = $1
  `, [serviceCode, language]);
}
```

**Pattern 2: Procedures Templates (avec traductions)**
```typescript
async function getServiceProcedures(serviceCode: string, language: string) {
  return await db.query(`
    SELECT
      pts.step_number,
      pts.description_es,
      COALESCE(
        et.translation_text,
        pts.description_es
      ) as description_translated
    FROM service_procedure_assignments spa
    JOIN procedure_templates pt ON pt.id = spa.template_id
    JOIN procedure_template_steps pts ON pts.template_id = pt.id
    LEFT JOIN entity_translations et ON (
      et.entity_code = 'template:' || pt.template_code || ':step_' || pts.step_number
      AND et.entity_type = 'procedure_template_step'
      AND et.language_code = $2
      AND et.field_name = 'description'
    )
    WHERE spa.fiscal_service_id = (
      SELECT id FROM fiscal_services WHERE service_code = $1
    )
    ORDER BY pts.step_number
  `, [serviceCode, language]);
}
```

**Pattern 3: Keywords Search**
```typescript
async function searchKeywords(query: string, language: string) {
  // Keywords = multilingue natif (pas entity_translations)
  const column = language === 'fr' ? 'keyword_fr' :
                 language === 'en' ? 'keyword_en' : 'keyword';

  return await db.query(`
    SELECT
      sk.${column} as keyword,
      fs.service_code,
      fs.service_name_es
    FROM service_keywords sk
    JOIN fiscal_services fs ON fs.id = sk.fiscal_service_id
    WHERE sk.language_code = $1
      AND sk.${column} ILIKE '%' || $2 || '%'
    ORDER BY sk.weight DESC
    LIMIT 20
  `, [language, query]);
}
```

### 3.3 Handling Duplicates (Idempotence)

**Problème**: Sources contiennent duplicates (120 procedures, 50 keywords)

**Solution**: `ON CONFLICT DO NOTHING`
```sql
INSERT INTO entity_translations (
  entity_type, entity_code, language_code, field_name, translation_text
)
VALUES
  ('service', 'entity:SERVICE:T-001', 'fr', 'service_name', 'Légalisation'),
  ('service', 'entity:SERVICE:T-001', 'fr', 'service_name', 'Légalisation')  -- Duplicate
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

-- Résultat: Première valeur insérée, duplicate ignoré (pas d'erreur)
```

**Bénéfices**:
- ✅ Réimportation safe (idempotent)
- ✅ Préserve corrections manuelles (ne réécrit pas)
- ✅ Performance (pas de UPDATE inutile)

---

## 4. Guide Utilisation

### 4.1 Ajouter Nouvelle Traduction

**Méthode 1: SQL direct**
```sql
INSERT INTO entity_translations (
  entity_type, entity_code, language_code, field_name, translation_text, translation_source
)
VALUES (
  'service',
  'entity:SERVICE:T-999',
  'fr',
  'service_name',
  'Nouveau service traduit',
  'manual'
)
ON CONFLICT (entity_type, entity_code, language_code, field_name)
DO UPDATE SET
  translation_text = EXCLUDED.translation_text,
  translation_source = 'manual',
  updated_at = NOW();
```

**Méthode 2: Interface Admin (TODO)**
```typescript
// POST /api/admin/translations
{
  "entity_type": "service",
  "entity_code": "entity:SERVICE:T-999",
  "translations": {
    "fr": { "service_name": "Nouveau service traduit" },
    "en": { "service_name": "New translated service" }
  }
}
```

### 4.2 Corriger Traduction Existante

```sql
-- Corriger traduction service
UPDATE entity_translations
SET
  translation_text = 'Légalisation de documents (corrigé)',
  translation_source = 'manual',
  updated_at = NOW()
WHERE entity_code = 'entity:SERVICE:T-001'
  AND entity_type = 'service'
  AND language_code = 'fr'
  AND field_name = 'service_name';

-- Corriger traduction template (appliqué à tous services utilisant ce template)
UPDATE entity_translations
SET translation_text = 'Effectuer le paiement (corrigé)'
WHERE entity_code = 'template:PAYMENT_STANDARD:step_4'
  AND entity_type = 'procedure_template_step'
  AND language_code = 'fr';
-- Impact: Tous les services utilisant PAYMENT_STANDARD template
```

### 4.3 Audit Traductions

**Coverage global**
```sql
SELECT
    entity_type,
    COUNT(DISTINCT entity_code) as entities,
    COUNT(*) FILTER (WHERE language_code = 'fr') as fr_count,
    COUNT(*) FILTER (WHERE language_code = 'en') as en_count,
    COUNT(*) FILTER (WHERE language_code = 'fr') * 100.0 /
      NULLIF(COUNT(DISTINCT entity_code), 0) as fr_coverage_pct
FROM entity_translations
GROUP BY entity_type
ORDER BY entities DESC;
```

**Traductions manquantes**
```sql
-- Services sans traduction FR
SELECT
    fs.service_code,
    fs.service_name_es
FROM fiscal_services fs
LEFT JOIN entity_translations et ON (
    et.entity_code = 'entity:SERVICE:' || fs.service_code
    AND et.entity_type = 'service'
    AND et.language_code = 'fr'
)
WHERE et.entity_code IS NULL;
```

**Traductions obsolètes** (source modifiée)
```sql
-- Services dont nom ES a changé depuis traduction
SELECT
    fs.service_code,
    fs.service_name_es as current_es,
    fs.updated_at as source_updated,
    et.translation_text as translation_fr,
    et.updated_at as translation_updated
FROM fiscal_services fs
JOIN entity_translations et ON (
    et.entity_code = 'entity:SERVICE:' || fs.service_code
    AND et.entity_type = 'service'
    AND et.language_code = 'fr'
)
WHERE fs.updated_at > et.updated_at;
-- → Nécessite re-traduction
```

---

## 5. Production & Monitoring

### 5.1 Métriques Clés

```sql
-- Dashboard traductions
SELECT
    'Total entities' as metric,
    COUNT(DISTINCT entity_code) as value
FROM entity_translations

UNION ALL

SELECT
    'Total translations',
    COUNT(*)
FROM entity_translations

UNION ALL

SELECT
    'FR coverage %',
    ROUND(
        COUNT(*) FILTER (WHERE language_code = 'fr') * 100.0 /
        COUNT(DISTINCT entity_code),
        1
    )
FROM entity_translations

UNION ALL

SELECT
    'EN coverage %',
    ROUND(
        COUNT(*) FILTER (WHERE language_code = 'en') * 100.0 /
        COUNT(DISTINCT entity_code),
        1
    )
FROM entity_translations;
```

### 5.2 Performance

**Index Critique**:
```sql
-- Lookup traductions (most frequent query)
CREATE INDEX idx_translations_lookup ON entity_translations(
    entity_type, entity_code, language_code, field_name
);

-- Audit par entity_type
CREATE INDEX idx_translations_entity_type ON entity_translations(entity_type);
```

**Query Performance**:
```sql
-- Benchmark: Récupérer service avec traductions
EXPLAIN ANALYZE
SELECT
    fs.service_code,
    fs.service_name_es,
    et_fr.translation_text as service_name_fr,
    et_en.translation_text as service_name_en
FROM fiscal_services fs
LEFT JOIN entity_translations et_fr ON (
    et_fr.entity_code = 'entity:SERVICE:' || fs.service_code
    AND et_fr.language_code = 'fr'
)
LEFT JOIN entity_translations et_en ON (
    et_en.entity_code = 'entity:SERVICE:' || fs.service_code
    AND et_en.language_code = 'en'
)
WHERE fs.service_code = 'T-001';

-- Expected: < 5ms (avec index)
```

### 5.3 Backup & Recovery

**Backup traductions**:
```bash
# Export traductions uniquement
pg_dump -U postgres -d taxasge \
  -t entity_translations \
  -t service_keywords \
  --data-only \
  --column-inserts \
  -f backup_translations_$(date +%Y%m%d).sql

# Taille attendue: ~2-5 MB
```

**Recovery**:
```bash
# Restaurer traductions
psql -U postgres -d taxasge -f backup_translations_20251010.sql
```

### 5.4 Troubleshooting

**Problème 1: Traduction manquante**
```sql
-- Debug: Vérifier traduction existe
SELECT * FROM entity_translations
WHERE entity_code = 'entity:SERVICE:T-001'
  AND language_code = 'fr';

-- Si absent:
INSERT INTO entity_translations (...)
VALUES (...);
```

**Problème 2: Query lente**
```sql
-- Vérifier index utilisé
EXPLAIN (ANALYZE, BUFFERS)
SELECT ... FROM entity_translations WHERE ...;

-- Si index pas utilisé:
REINDEX INDEX idx_translations_lookup;
ANALYZE entity_translations;
```

**Problème 3: Duplicates bloquent import**
```sql
-- Solution: Utiliser ON CONFLICT DO NOTHING
INSERT INTO entity_translations (...)
VALUES (...)
ON CONFLICT (...) DO NOTHING;
```

---

## 6. Workflow Développement

### 6.1 Ajouter Nouvelle Entité Traduisible

**Étape 1**: Définir entity_type + entity_code pattern
```typescript
// Exemple: Ajouter traductions pour "fees" (tarifs)
const ENTITY_TYPE = 'fee';
const ENTITY_CODE_PATTERN = 'entity:FEE:{fee_id}';
```

**Étape 2**: Créer script génération traductions
```javascript
// scripts/generate-fees-translations.mjs
const fees = JSON.parse(fs.readFileSync('data/fees.json'));

fees.forEach(fee => {
  if (fee.fee_name_fr) {
    sql.push(`  ('fee', 'entity:FEE:${fee.id}', 'fr', 'fee_name', ${escape(fee.fee_name_fr)}, 'import', NOW())`);
  }
});
```

**Étape 3**: Backend query avec traductions
```typescript
async function getFee(feeId: number, language: string) {
  return await db.query(`
    SELECT
      f.id,
      f.fee_name_es,
      COALESCE(et.translation_text, f.fee_name_es) as fee_name_translated
    FROM fees f
    LEFT JOIN entity_translations et ON (
      et.entity_code = 'entity:FEE:' || f.id
      AND et.entity_type = 'fee'
      AND et.language_code = $2
      AND et.field_name = 'fee_name'
    )
    WHERE f.id = $1
  `, [feeId, language]);
}
```

---

**Version**: 2.0
**Date**: 2025-10-10
**Status**: ✅ Production Ready
**Maintenance**: Mettre à jour lors d'ajout nouvelles entités traduisibles
# 🚀 i18n Production Guide - TaxasGE

**Version**: 1.0
**Date**: 2025-10-10
**Audience**: DevOps, Backend Developers

---

## 📋 Checklist Déploiement

### Phase 1: Préparation (15 min)

- [ ] Backup DB complet
  ```bash
  pg_dump -U postgres taxasge > backup_pre_i18n_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] Vérifier espace disque (minimum 500 MB libres)
  ```bash
  df -h /var/lib/postgresql
  ```

- [ ] Tester connexion DB
  ```bash
  psql -U postgres -d taxasge -c "SELECT COUNT(*) FROM fiscal_services;"
  ```

### Phase 2: Migrations Schema (5 min)

```bash
# Exécuter dans l'ordre
psql -U postgres -d taxasge -f data/migrations/001_base_schema.sql
psql -U postgres -d taxasge -f data/migrations/002_i18n_enums.sql
psql -U postgres -d taxasge -f data/migrations/003_create_entity_translations.sql

# Valider
psql -U postgres -d taxasge -c "\d entity_translations"
```

### Phase 3: Seed Traductions (10 min)

```bash
# ENUMs
psql -U postgres -d taxasge -f data/seed/seed_enum_translations.sql

# Entities (services, ministries, etc.)
psql -U postgres -d taxasge -f data/seed/seed_entities_translations.sql

# Keywords
psql -U postgres -d taxasge -f data/seed/seed_keywords.sql

# Valider
psql -U postgres -d taxasge -c "
SELECT entity_type, COUNT(*)
FROM entity_translations
GROUP BY entity_type;
"
```

### Phase 4: Validation (5 min)

```sql
-- Coverage global
SELECT
    entity_type,
    COUNT(*) FILTER (WHERE language_code = 'fr') as fr_count,
    COUNT(*) FILTER (WHERE language_code = 'en') as en_count
FROM entity_translations
GROUP BY entity_type;

-- Expected:
--   entity_type      | fr_count | en_count
--   -----------------+----------+----------
--   service          | 547      | 547
--   ministry         | 10       | 10
--   sector           | 20       | 20
--   service_category | 15       | 15
```

---

## 🔍 Troubleshooting Production

### Erreur 1: Duplicate Key Violation

**Symptôme**:
```
ERROR: duplicate key value violates unique constraint
"entity_translations_entity_type_entity_code_language_code_f_key"
```

**Cause**: Sources contiennent duplicates (120 procedures, 50 keywords détectés)

**Solution**:
```sql
-- Vérifier scripts utilisent ON CONFLICT DO NOTHING
-- Exemple correct:
INSERT INTO entity_translations (...)
VALUES (...)
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;
```

### Erreur 2: Query Lente (> 100ms)

**Symptôme**: Queries traductions prennent > 100ms

**Diagnostic**:
```sql
EXPLAIN ANALYZE
SELECT * FROM entity_translations
WHERE entity_code = 'entity:SERVICE:T-001'
  AND language_code = 'fr';
```

**Solution**:
```sql
-- Reindex
REINDEX INDEX idx_translations_lookup;
ANALYZE entity_translations;

-- Vérifier index existe
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'entity_translations';
```

### Erreur 3: Traduction Manquante Frontend

**Symptôme**: Frontend affiche ES au lieu de FR

**Diagnostic**:
```sql
-- Vérifier traduction existe
SELECT * FROM entity_translations
WHERE entity_code = 'entity:SERVICE:T-001'
  AND language_code = 'fr';
```

**Solutions**:
1. Si absent → Ajouter manuellement
2. Si présent → Vérifier query backend (COALESCE, JOIN)
3. Si présent → Vérifier cache frontend

---

## 📊 Monitoring Production

### Métriques Clés (Dashboard)

```sql
-- 1. Coverage Traductions
SELECT
    'FR Coverage %' as metric,
    ROUND(
        COUNT(*) FILTER (WHERE language_code = 'fr') * 100.0 /
        COUNT(DISTINCT entity_code),
        1
    ) as value
FROM entity_translations;

-- 2. Total Traductions
SELECT COUNT(*) FROM entity_translations;

-- 3. Traductions Modifiées Récemment (24h)
SELECT COUNT(*)
FROM entity_translations
WHERE updated_at > NOW() - INTERVAL '24 hours';

-- 4. Query Performance (p95)
SELECT
    query,
    mean_exec_time,
    calls
FROM pg_stat_statements
WHERE query LIKE '%entity_translations%'
ORDER BY mean_exec_time DESC
LIMIT 5;
```

### Alertes Recommandées

```yaml
# Prometheus/Grafana alerts
alerts:
  - alert: I18nCoverageLow
    expr: i18n_coverage_fr < 90
    severity: warning
    message: "FR coverage < 90%"

  - alert: I18nQuerySlow
    expr: i18n_query_p95_ms > 50
    severity: warning
    message: "entity_translations queries p95 > 50ms"

  - alert: I18nMissingTranslations
    expr: i18n_missing_count > 10
    severity: info
    message: "{{ $value }} services sans traduction FR"
```

---

## 🔄 Maintenance Routines

### Hebdomadaire

```sql
-- 1. Vacuum entity_translations
VACUUM ANALYZE entity_translations;

-- 2. Check bloat
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename = 'entity_translations';

-- 3. Audit traductions obsolètes
SELECT COUNT(*)
FROM entity_translations et
JOIN fiscal_services fs ON (
    et.entity_code = 'entity:SERVICE:' || fs.service_code
)
WHERE fs.updated_at > et.updated_at;
-- Si > 50 → Planifier re-traduction
```

### Mensuel

```sql
-- 1. Backup traductions
pg_dump -U postgres -d taxasge \
  -t entity_translations \
  -t service_keywords \
  --data-only \
  --column-inserts \
  -f /backups/translations_$(date +%Y%m).sql

-- 2. Audit coverage nouvelles entités
SELECT
    fs.service_code,
    fs.service_name_es,
    fs.created_at
FROM fiscal_services fs
LEFT JOIN entity_translations et ON (
    et.entity_code = 'entity:SERVICE:' || fs.service_code
    AND et.language_code = 'fr'
)
WHERE fs.created_at > NOW() - INTERVAL '30 days'
  AND et.entity_code IS NULL;
-- → Ajouter traductions manquantes
```

---

## 🛡️ Sécurité & Permissions

### Permissions DB Recommandées

```sql
-- Role lecture seule (frontend API)
CREATE ROLE i18n_reader;
GRANT SELECT ON entity_translations TO i18n_reader;
GRANT SELECT ON service_keywords TO i18n_reader;

-- Role écriture (admin interface)
CREATE ROLE i18n_writer;
GRANT SELECT, INSERT, UPDATE ON entity_translations TO i18n_writer;
GRANT USAGE, SELECT ON SEQUENCE entity_translations_id_seq TO i18n_writer;

-- Interdire DELETE (audit trail)
REVOKE DELETE ON entity_translations FROM i18n_writer;
```

### Rate Limiting (Nginx)

```nginx
# Limiter requêtes API traductions
location /api/translations {
    limit_req zone=translations burst=20 nodelay;
    proxy_pass http://backend;
}

# Zone configuration
limit_req_zone $binary_remote_addr zone=translations:10m rate=100r/m;
```

---

## 📈 Performance Tuning

### Index Stratégiques

```sql
-- Index par défaut (critique)
CREATE INDEX idx_translations_lookup ON entity_translations(
    entity_type, entity_code, language_code, field_name
);

-- Index audit (optionnel)
CREATE INDEX idx_translations_updated ON entity_translations(updated_at DESC);
CREATE INDEX idx_translations_source ON entity_translations(translation_source);
```

### Query Optimization

**❌ Avant (N+1 queries)**:
```typescript
// BAD: N+1 problem
for (const service of services) {
  const translation = await db.query(
    'SELECT translation_text FROM entity_translations WHERE entity_code = $1',
    [`entity:SERVICE:${service.service_code}`]
  );
  service.name_translated = translation.rows[0]?.translation_text;
}
```

**✅ Après (1 query batch)**:
```typescript
// GOOD: Batch fetch avec JOIN
const services = await db.query(`
  SELECT
    fs.service_code,
    fs.service_name_es,
    et.translation_text as name_translated
  FROM fiscal_services fs
  LEFT JOIN entity_translations et ON (
    et.entity_code = 'entity:SERVICE:' || fs.service_code
    AND et.language_code = $1
  )
  WHERE fs.id = ANY($2)
`, [language, serviceIds]);
```

### Caching Strategy

```typescript
// Redis cache traductions fréquentes
const CACHE_TTL = 3600; // 1h

async function getServiceTranslation(serviceCode: string, language: string) {
  const cacheKey = `i18n:service:${serviceCode}:${language}`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Query DB
  const result = await db.query(
    'SELECT translation_text FROM entity_translations WHERE ...',
    [serviceCode, language]
  );

  // Cache result
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result.rows[0]));

  return result.rows[0];
}

// Invalidate cache on UPDATE
async function updateTranslation(entityCode: string, language: string, text: string) {
  await db.query('UPDATE entity_translations SET ...');

  // Invalidate cache
  const cacheKey = `i18n:service:${entityCode}:${language}`;
  await redis.del(cacheKey);
}
```

---

## 🔥 Incident Response

### Scénario 1: DB Down

**Impact**: Traductions inaccessibles

**Mitigation**:
1. Basculer sur backup read replica
2. Fallback frontend: Afficher ES (source vérité toujours disponible)
3. Cache Redis conserve traductions fréquentes (1h TTL)

### Scénario 2: Import Cassé

**Symptôme**: Seed SQL échoue avec erreurs

**Actions**:
```bash
# 1. Rollback transaction (si BEGIN non committée)
psql -U postgres -d taxasge -c "ROLLBACK;"

# 2. Identifier erreur
tail -100 /var/log/postgresql/postgresql-*.log

# 3. Corriger script SQL
# 4. Réexécuter import

# 5. Si échec complet: Restaurer backup
psql -U postgres -d taxasge < backup_pre_i18n.sql
```

### Scénario 3: Performance Dégradée

**Symptôme**: Queries > 100ms

**Actions**:
```sql
-- 1. Identifier queries lentes
SELECT
    query,
    mean_exec_time,
    calls
FROM pg_stat_statements
WHERE query LIKE '%entity_translations%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 2. EXPLAIN ANALYZE query lente
EXPLAIN (ANALYZE, BUFFERS) <query>;

-- 3. Reindex si nécessaire
REINDEX INDEX idx_translations_lookup;

-- 4. Augmenter cache si nécessaire
ALTER SYSTEM SET shared_buffers = '256MB';
SELECT pg_reload_conf();
```

---

## 📚 Références Rapides

### Commandes Utiles

```bash
# Connection DB
export PGPASSWORD=your_password
psql -U postgres -d taxasge

# Count traductions
psql -U postgres -d taxasge -c "SELECT COUNT(*) FROM entity_translations;"

# Export traductions service T-001
psql -U postgres -d taxasge -c "
COPY (
  SELECT * FROM entity_translations
  WHERE entity_code LIKE 'entity:SERVICE:T-001%'
) TO STDOUT CSV HEADER
" > service_T001_translations.csv

# Import CSV traductions
psql -U postgres -d taxasge -c "
COPY entity_translations (entity_type, entity_code, language_code, field_name, translation_text)
FROM '/path/to/translations.csv' CSV HEADER
"
```

### Logs Importants

```bash
# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-*.log | grep entity_translations

# Application logs (rechercher i18n errors)
tail -f /var/log/taxasge/app.log | grep -i "translation\|i18n"
```

---

**Version**: 1.0
**Date**: 2025-10-10
**Status**: ✅ Production Ready
**Next Review**: 2025-11-10
