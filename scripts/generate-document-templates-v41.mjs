#!/usr/bin/env node
/**
 * Generate Document Templates v4.1
 * Converts old documents format to templates architecture
 *
 * Input: data/documentos_requeridos.json (flat format with ES/FR/EN per row)
 * Output: data/seed/seed_document_templates.sql
 *
 * Features:
 * - Deduplication: Group identical documents into templates
 * - Templates: Create unique templates
 * - Assignments: N:M relationship service <-> template
 * - Translations: v4.1 format (short codes + ENUM)
 * - Validity: Extract duration from document name if possible
 */

import fs from 'fs';
import crypto from 'crypto';

console.log('🚀 Generating Document Templates v4.1...\n');

// Load documents
const documents = JSON.parse(fs.readFileSync('data/documentos_requeridos.json', 'utf8'));

console.log(`📥 Loaded ${documents.length} document rows`);

// Step 1: Group by service + language
const serviceDocs = new Map();

documents.forEach(doc => {
    const serviceCode = doc.tax_id;

    if (!serviceDocs.has(serviceCode)) {
        serviceDocs.set(serviceCode, {
            service_code: serviceCode,
            docs_es: [],
            docs_fr: [],
            docs_en: []
        });
    }

    const service = serviceDocs.get(serviceCode);

    if (doc.nombre_es) {
        service.docs_es.push({
            name: doc.nombre_es,
            description: doc.description_es || null
        });
    }

    if (doc.nombre_fr) {
        service.docs_fr.push({
            name: doc.nombre_fr,
            description: doc.description_fr || null
        });
    }

    if (doc.nombre_en) {
        service.docs_en.push({
            name: doc.nombre_en,
            description: doc.description_en || null
        });
    }
});

console.log(`📊 Grouped into ${serviceDocs.size} unique services`);

// Step 2: Create template map (deduplicate by document name hash)
const templateMap = new Map();
const serviceDocumentAssignments = [];

serviceDocs.forEach((docData, serviceCode) => {
    docData.docs_es.forEach((doc, index) => {
        // Create hash from ES name (for deduplication)
        const docHash = crypto.createHash('md5')
            .update(doc.name)
            .digest('hex')
            .substring(0, 8);

        if (!templateMap.has(docHash)) {
            const templateCode = `DOC_${templateMap.size + 1}`.padEnd(20, '_').substring(0, 20);

            // Extract validity duration if mentioned in name
            const validity = extractValidity(doc.name);

            templateMap.set(docHash, {
                template_code: templateCode,
                document_name_es: doc.name,
                description_es: doc.description,
                category: detectCategory(doc.name),
                validity_duration_months: validity,
                translations_fr: [],
                translations_en: [],
                services: []
            });
        }

        const template = templateMap.get(docHash);

        // Add translations if available
        if (docData.docs_fr[index]) {
            template.translations_fr.push({
                name: docData.docs_fr[index].name,
                description: docData.docs_fr[index].description
            });
        }

        if (docData.docs_en[index]) {
            template.translations_en.push({
                name: docData.docs_en[index].name,
                description: docData.docs_en[index].description
            });
        }

        if (!template.services.includes(serviceCode)) {
            template.services.push(serviceCode);

            serviceDocumentAssignments.push({
                service_code: serviceCode,
                template_code: template.template_code
            });
        }
    });
});

console.log(`✨ Deduplicated into ${templateMap.size} unique templates`);
console.log(`   - Original documents: 2901`);
console.log(`   - Unique templates: ${templateMap.size}`);
console.log(`   - Savings: ${((1 - templateMap.size / 2901) * 100).toFixed(1)}%\n`);

// Step 3: Generate SQL
let sql = `-- ============================================
-- SEED DOCUMENT TEMPLATES v4.1
-- Generated from documentos_requeridos.json
-- Templates: ${templateMap.size}
-- Assignments: ${serviceDocumentAssignments.length}
-- Date: ${new Date().toISOString()}
-- ============================================

BEGIN;

-- ============================================
-- 1. DOCUMENT TEMPLATES
-- ============================================

`;

const templates = Array.from(templateMap.values());

templates.forEach(t => {
    const nameES = escapeSql(t.document_name_es);
    const descES = t.description_es ? escapeSql(t.description_es) : null;
    const category = t.category;
    const validity = t.validity_duration_months;

    sql += `INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)\n`;
    sql += `VALUES ('${t.template_code}', '${nameES}', ${descES ? `'${descES}'` : 'NULL'}, '${category}', ${validity || 'NULL'}, NOW())\n`;
    sql += `ON CONFLICT (template_code) DO NOTHING;\n\n`;
});

sql += `-- ============================================
-- 2. SERVICE DOCUMENT ASSIGNMENTS
-- ============================================

`;

serviceDocumentAssignments.forEach(assign => {
    sql += `INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)\n`;
    sql += `SELECT fs.id, dt.id, true, false, 1, NOW()\n`;
    sql += `FROM fiscal_services fs, document_templates dt\n`;
    sql += `WHERE fs.service_code = '${assign.service_code}' AND dt.template_code = '${assign.template_code}'\n`;
    sql += `ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;\n\n`;
});

sql += `-- ============================================
-- 3. TRANSLATIONS v4.1 (SHORT CODES + ENUM)
-- ============================================

-- Document templates translations (FR)
`;

templates.forEach(t => {
    // Take first translation (deduplicated should have only one)
    const transFr = t.translations_fr[0];

    if (transFr && transFr.name) {
        const name = escapeSql(transFr.name);

        sql += `INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)\n`;
        sql += `VALUES ('document_template', '${t.template_code}', 'fr', 'name', '${name}', 'import', NOW())\n`;
        sql += `ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;\n\n`;
    }

    if (transFr && transFr.description) {
        const desc = escapeSql(transFr.description);

        sql += `INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)\n`;
        sql += `VALUES ('document_template', '${t.template_code}', 'fr', 'description', '${desc}', 'import', NOW())\n`;
        sql += `ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;\n\n`;
    }
});

sql += `-- Document templates translations (EN)
`;

templates.forEach(t => {
    // Take first translation (deduplicated should have only one)
    const transEn = t.translations_en[0];

    if (transEn && transEn.name) {
        const name = escapeSql(transEn.name);

        sql += `INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)\n`;
        sql += `VALUES ('document_template', '${t.template_code}', 'en', 'name', '${name}', 'import', NOW())\n`;
        sql += `ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;\n\n`;
    }

    if (transEn && transEn.description) {
        const desc = escapeSql(transEn.description);

        sql += `INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)\n`;
        sql += `VALUES ('document_template', '${t.template_code}', 'en', 'description', '${desc}', 'import', NOW())\n`;
        sql += `ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;\n\n`;
    }
});

sql += `
COMMIT;

-- ============================================
-- STATS
-- ============================================
-- Templates created: ${templateMap.size}
-- Assignments: ${serviceDocumentAssignments.length}
-- Translations: ${templates.filter(t => t.translations_fr.length > 0).length * 2 + templates.filter(t => t.translations_en.length > 0).length * 2}
-- Savings vs old: ${((1 - templateMap.size / 2901) * 100).toFixed(1)}%
-- ============================================
`;

// Write output
fs.writeFileSync('data/seed/seed_document_templates.sql', sql);

console.log('✅ Generated data/seed/seed_document_templates.sql');
console.log(`\n📊 Statistics:`);
console.log(`   - Templates: ${templateMap.size}`);
console.log(`   - Assignments: ${serviceDocumentAssignments.length}`);
console.log(`   - With validity: ${templates.filter(t => t.validity_duration_months).length}`);
console.log(`   - Translations FR: ${templates.filter(t => t.translations_fr.length > 0).length}`);
console.log(`   - Translations EN: ${templates.filter(t => t.translations_en.length > 0).length}`);
console.log(`   - Savings: ${((1 - templateMap.size / 2901) * 100).toFixed(1)}%`);

// Helper functions
function escapeSql(str) {
    if (!str) return '';
    return str.replace(/'/g, "''");
}

function detectCategory(name) {
    const lower = name.toLowerCase();

    if (lower.includes('identidad') || lower.includes('dni') || lower.includes('pasaporte')) return 'identity';
    if (lower.includes('comprobante') || lower.includes('recibo') || lower.includes('pago')) return 'payment_proof';
    if (lower.includes('certificado')) return 'certificate';
    if (lower.includes('fotografía') || lower.includes('foto')) return 'photo';
    if (lower.includes('poder') || lower.includes('autorización')) return 'authorization';
    if (lower.includes('título') || lower.includes('diploma')) return 'academic';
    if (lower.includes('notaria') || lower.includes('escrito')) return 'notarial';
    if (lower.includes('aeronave') || lower.includes('matrícula')) return 'aircraft';
    if (lower.includes('propiedad') || lower.includes('registro')) return 'property';

    return 'general';
}

function extractValidity(name) {
    const lower = name.toLowerCase();

    // Look for patterns like "vigente", "válido", "6 meses", "1 año"
    if (lower.includes('vigente') || lower.includes('actual')) return 12; // 1 year default
    if (lower.includes('6 meses') || lower.includes('seis meses')) return 6;
    if (lower.includes('3 meses') || lower.includes('tres meses')) return 3;
    if (lower.includes('1 año') || lower.includes('un año')) return 12;
    if (lower.includes('2 años') || lower.includes('dos años')) return 24;

    return null; // No validity info found
}

console.log('\n✅ Done!\n');
