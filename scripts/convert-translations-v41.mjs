#!/usr/bin/env node
/**
 * Convert Translations to v4.1 Format
 * Converts old translations format to v4.1 optimized format
 *
 * Input: data/translations.json (nested format)
 * Output: data/seed/seed_translations_v41.sql
 *
 * Changes v4.1:
 * - entity_type: VARCHAR → translatable_entity_type ENUM
 * - entity_code: SHORT codes (no verbose prefix)
 *   - OLD: 'entity:SERVICE:T-001' → NEW: 'T-001' (-76%)
 *   - OLD: 'template:PROC_1:step_4' → NEW: 'PROC_1:step_4' (-32%)
 * - PRIMARY KEY instead of UNIQUE
 * - translation_source tracking
 * - Skip ES (already in DB)
 */

import fs from 'fs';

console.log('🚀 Converting Translations to v4.1...\n');

// Load translations
const data = JSON.parse(fs.readFileSync('data/translations.json', 'utf8'));
const translations = data.translations || [];

console.log(`📥 Loaded ${translations.length} translation objects`);

// Step 1: Convert to flat v4.1 format
const translationsV41 = [];

translations.forEach(item => {
    const entityType = mapEntityType(item.entity_type);
    const entityCode = mapEntityCode(item.entity_id, item.entity_type);

    const fields = item.translations || {};

    Object.keys(fields).forEach(fieldName => {
        const fieldTranslations = fields[fieldName];

        // Only process FR and EN (ES already in DB)
        if (fieldTranslations.fr) {
            translationsV41.push({
                entity_type: entityType,
                entity_code: entityCode,
                language_code: 'fr',
                field_name: fieldName,
                translation_text: fieldTranslations.fr,
                translation_source: 'import'
            });
        }

        if (fieldTranslations.en) {
            translationsV41.push({
                entity_type: entityType,
                entity_code: entityCode,
                language_code: 'en',
                field_name: fieldName,
                translation_text: fieldTranslations.en,
                translation_source: 'import'
            });
        }
    });
});

console.log(`✨ Converted to ${translationsV41.length} translation rows (FR + EN)`);
console.log(`   - Skipped ES: ${translations.reduce((sum, t) => sum + Object.keys(t.translations).filter(f => t.translations[f].es).length, 0)} (already in DB)\n`);

// Step 2: Generate SQL
let sql = `-- ============================================
-- SEED TRANSLATIONS v4.1 - OPTIMIZED
-- Generated from translations.json
-- Format: SHORT codes + ENUM + PRIMARY KEY
-- Translations: ${translationsV41.length}
-- Date: ${new Date().toISOString()}
-- ============================================

BEGIN;

-- ============================================
-- ENTITY TRANSLATIONS v4.1 (FR + EN)
-- ============================================
-- entity_type: translatable_entity_type ENUM (strict)
-- entity_code: SHORT codes (-76% vs verbose)
-- language_code: 'fr', 'en' (ES already in DB)
-- field_name: 'name', 'description', 'instructions'
-- ============================================

`;

// Group by entity_type for better organization
const byEntityType = {};
translationsV41.forEach(t => {
    if (!byEntityType[t.entity_type]) {
        byEntityType[t.entity_type] = [];
    }
    byEntityType[t.entity_type].push(t);
});

// Generate SQL by entity type
Object.keys(byEntityType).sort().forEach(entityType => {
    const items = byEntityType[entityType];

    sql += `-- ${entityType.toUpperCase()} (${items.length} translations)\n\n`;

    items.forEach(t => {
        const text = escapeSql(t.translation_text);

        sql += `INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)\n`;
        sql += `VALUES ('${t.entity_type}', '${t.entity_code}', '${t.language_code}', '${t.field_name}', '${text}', '${t.translation_source}', NOW())\n`;
        sql += `ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;\n\n`;
    });

    sql += `\n`;
});

sql += `
COMMIT;

-- ============================================
-- STATS
-- ============================================
-- Total translations: ${translationsV41.length}
-- By entity_type:
`;

Object.keys(byEntityType).sort().forEach(entityType => {
    sql += `--   - ${entityType}: ${byEntityType[entityType].length}\n`;
});

sql += `-- By language:
--   - FR: ${translationsV41.filter(t => t.language_code === 'fr').length}
--   - EN: ${translationsV41.filter(t => t.language_code === 'en').length}
-- ES translations skipped: Already in DB
-- ============================================
`;

// Write output
fs.writeFileSync('data/seed/seed_translations_v41.sql', sql);

console.log('✅ Generated data/seed/seed_translations_v41.sql');
console.log(`\n📊 Statistics:`);
console.log(`   - Total translations: ${translationsV41.length}`);
console.log(`   - By language:`);
console.log(`     - FR: ${translationsV41.filter(t => t.language_code === 'fr').length}`);
console.log(`     - EN: ${translationsV41.filter(t => t.language_code === 'en').length}`);
console.log(`   - By entity_type:`);
Object.keys(byEntityType).sort().forEach(entityType => {
    console.log(`     - ${entityType}: ${byEntityType[entityType].length}`);
});

// Helper functions
function escapeSql(str) {
    if (!str) return '';
    return str.replace(/'/g, "''");
}

function mapEntityType(oldType) {
    // Map old entity types to v4.1 ENUM values
    const mapping = {
        'ministry': 'ministry',
        'sector': 'sector',
        'category': 'category',
        'service': 'service',
        'fiscal_service': 'service',
        'procedure_template': 'procedure_template',
        'procedure_step': 'procedure_step',
        'document_template': 'document_template'
    };

    return mapping[oldType] || oldType;
}

function mapEntityCode(oldCode, entityType) {
    // Remove verbose prefixes
    // OLD: 'entity:SERVICE:T-001' → NEW: 'T-001'
    // OLD: 'template:PROC_1:step_4' → NEW: 'PROC_1:step_4'

    if (!oldCode) return '';

    // Already short format
    if (!oldCode.includes(':')) return oldCode;

    // Handle entity: prefix
    if (oldCode.startsWith('entity:')) {
        const parts = oldCode.split(':');
        return parts[parts.length - 1]; // Take last part (the actual code)
    }

    // Handle template: prefix
    if (oldCode.startsWith('template:')) {
        return oldCode.replace('template:', ''); // Remove template: prefix
    }

    // Default: return as-is
    return oldCode;
}

console.log('\n✅ Done!\n');
