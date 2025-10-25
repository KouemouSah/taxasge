#!/usr/bin/env node
/**
 * Generate Procedure Templates v4.1
 * Converts old procedures format to templates architecture
 *
 * Input: data/procedimientos.json (flat format with ES/FR/EN per row)
 * Output: data/seed/seed_procedure_templates.sql
 *
 * Features:
 * - Deduplication: Group identical procedures into templates
 * - Templates: Create unique templates with steps
 * - Assignments: N:M relationship service <-> template
 * - Translations: v4.1 format (short codes + ENUM)
 */

import fs from 'fs';
import crypto from 'crypto';

console.log('🚀 Generating Procedure Templates v4.1...\n');

// Load procedures
const procedures = JSON.parse(fs.readFileSync('data/procedimientos.json', 'utf8'));

console.log(`📥 Loaded ${procedures.length} procedure rows`);

// Step 1: Group by service + language
const serviceProcs = new Map();

procedures.forEach(proc => {
    const serviceCode = proc.tax_id;

    if (!serviceProcs.has(serviceCode)) {
        serviceProcs.set(serviceCode, {
            service_code: serviceCode,
            steps_es: [],
            steps_fr: [],
            steps_en: []
        });
    }

    const service = serviceProcs.get(serviceCode);

    if (proc.description_es) {
        service.steps_es.push({
            step_number: proc.step_number,
            description: proc.description_es,
            instructions: proc.instructions_es || null
        });
    }

    if (proc.description_fr) {
        service.steps_fr.push({
            step_number: proc.step_number,
            description: proc.description_fr,
            instructions: proc.instructions_fr || null
        });
    }

    if (proc.description_en) {
        service.steps_en.push({
            step_number: proc.step_number,
            description: proc.description_en,
            instructions: proc.instructions_en || null
        });
    }
});

console.log(`📊 Grouped into ${serviceProcs.size} unique services`);

// Step 2: Create template map (deduplicate by steps sequence hash)
const templateMap = new Map();
const serviceTemplateAssignments = [];

serviceProcs.forEach((procData, serviceCode) => {
    // Sort steps ES by step_number
    const stepsES = procData.steps_es.sort((a, b) => a.step_number - b.step_number);

    // Create hash from ES steps (for deduplication)
    const stepsHash = crypto.createHash('md5')
        .update(stepsES.map(s => s.description).join('||'))
        .digest('hex')
        .substring(0, 8);

    if (!templateMap.has(stepsHash)) {
        const templateCode = `PROC_${templateMap.size + 1}`.padEnd(20, '_').substring(0, 20);

        templateMap.set(stepsHash, {
            template_code: templateCode,
            name_es: stepsES[0]?.description.substring(0, 100) || 'Procedimiento',
            category: detectCategory(stepsES),
            steps_es: stepsES,
            steps_fr: procData.steps_fr.sort((a, b) => a.step_number - b.step_number),
            steps_en: procData.steps_en.sort((a, b) => a.step_number - b.step_number),
            services: []
        });
    }

    const template = templateMap.get(stepsHash);
    template.services.push(serviceCode);

    serviceTemplateAssignments.push({
        service_code: serviceCode,
        template_code: template.template_code
    });
});

console.log(`✨ Deduplicated into ${templateMap.size} unique templates`);
console.log(`   - Original procedures: 4737`);
console.log(`   - Unique templates: ${templateMap.size}`);
console.log(`   - Savings: ${((1 - templateMap.size / 4737) * 100).toFixed(1)}%\n`);

// Step 3: Generate SQL
let sql = `-- ============================================
-- SEED PROCEDURE TEMPLATES v4.1
-- Generated from procedimientos.json
-- Templates: ${templateMap.size}
-- Steps total: ${Array.from(templateMap.values()).reduce((sum, t) => sum + t.steps_es.length, 0)}
-- Assignments: ${serviceTemplateAssignments.length}
-- Date: ${new Date().toISOString()}
-- ============================================

BEGIN;

-- ============================================
-- 1. PROCEDURE TEMPLATES
-- ============================================

`;

const templates = Array.from(templateMap.values());

templates.forEach(t => {
    const nameES = escapeSql(t.name_es);
    const category = t.category;

    sql += `INSERT INTO procedure_templates (template_code, name_es, category, created_at)\n`;
    sql += `VALUES ('${t.template_code}', '${nameES}', '${category}', NOW())\n`;
    sql += `ON CONFLICT (template_code) DO NOTHING;\n\n`;
});

sql += `-- ============================================
-- 2. PROCEDURE TEMPLATE STEPS (ES)
-- ============================================

`;

templates.forEach(t => {
    t.steps_es.forEach(step => {
        const desc = escapeSql(step.description);
        const instr = step.instructions ? escapeSql(step.instructions) : null;

        sql += `INSERT INTO procedure_template_steps (template_id, step_number, description_es, instructions_es, created_at)\n`;
        sql += `SELECT id, ${step.step_number}, '${desc}', ${instr ? `'${instr}'` : 'NULL'}, NOW()\n`;
        sql += `FROM procedure_templates WHERE template_code = '${t.template_code}'\n`;
        sql += `ON CONFLICT (template_id, step_number) DO NOTHING;\n\n`;
    });
});

sql += `-- ============================================
-- 3. SERVICE PROCEDURE ASSIGNMENTS
-- ============================================

`;

serviceTemplateAssignments.forEach(assign => {
    sql += `INSERT INTO service_procedure_assignments (fiscal_service_id, template_id, applies_to, display_order, assigned_at)\n`;
    sql += `SELECT fs.id, pt.id, 'both', 1, NOW()\n`;
    sql += `FROM fiscal_services fs, procedure_templates pt\n`;
    sql += `WHERE fs.service_code = '${assign.service_code}' AND pt.template_code = '${assign.template_code}'\n`;
    sql += `ON CONFLICT (fiscal_service_id, template_id) DO NOTHING;\n\n`;
});

sql += `-- ============================================
-- 4. TRANSLATIONS v4.1 (SHORT CODES + ENUM)
-- ============================================

-- Procedure steps translations (FR)
`;

templates.forEach(t => {
    t.steps_fr.forEach(step => {
        if (step.description) {
            const desc = escapeSql(step.description);
            const entityCode = `${t.template_code}:step_${step.step_number}`;

            sql += `INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)\n`;
            sql += `VALUES ('procedure_step', '${entityCode}', 'fr', 'description', '${desc}', 'import', NOW())\n`;
            sql += `ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;\n\n`;
        }

        if (step.instructions) {
            const instr = escapeSql(step.instructions);
            const entityCode = `${t.template_code}:step_${step.step_number}`;

            sql += `INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)\n`;
            sql += `VALUES ('procedure_step', '${entityCode}', 'fr', 'instructions', '${instr}', 'import', NOW())\n`;
            sql += `ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;\n\n`;
        }
    });
});

sql += `-- Procedure steps translations (EN)
`;

templates.forEach(t => {
    t.steps_en.forEach(step => {
        if (step.description) {
            const desc = escapeSql(step.description);
            const entityCode = `${t.template_code}:step_${step.step_number}`;

            sql += `INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)\n`;
            sql += `VALUES ('procedure_step', '${entityCode}', 'en', 'description', '${desc}', 'import', NOW())\n`;
            sql += `ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;\n\n`;
        }

        if (step.instructions) {
            const instr = escapeSql(step.instructions);
            const entityCode = `${t.template_code}:step_${step.step_number}`;

            sql += `INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)\n`;
            sql += `VALUES ('procedure_step', '${entityCode}', 'en', 'instructions', '${instr}', 'import', NOW())\n`;
            sql += `ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;\n\n`;
        }
    });
});

sql += `
COMMIT;

-- ============================================
-- STATS
-- ============================================
-- Templates created: ${templateMap.size}
-- Steps total: ${Array.from(templateMap.values()).reduce((sum, t) => sum + t.steps_es.length, 0)}
-- Assignments: ${serviceTemplateAssignments.length}
-- Translations: ${Array.from(templateMap.values()).reduce((sum, t) => sum + (t.steps_fr.length + t.steps_en.length) * 2, 0)}
-- Savings vs old: ${((1 - templateMap.size / 4737) * 100).toFixed(1)}%
-- ============================================
`;

// Write output
fs.writeFileSync('data/seed/seed_procedure_templates.sql', sql);

console.log('✅ Generated data/seed/seed_procedure_templates.sql');
console.log(`\n📊 Statistics:`);
console.log(`   - Templates: ${templateMap.size}`);
console.log(`   - Steps: ${Array.from(templateMap.values()).reduce((sum, t) => sum + t.steps_es.length, 0)}`);
console.log(`   - Assignments: ${serviceTemplateAssignments.length}`);
console.log(`   - Translations: ${Array.from(templateMap.values()).reduce((sum, t) => sum + (t.steps_fr.length + t.steps_en.length) * 2, 0)}`);
console.log(`   - Savings: ${((1 - templateMap.size / 4737) * 100).toFixed(1)}%`);

// Helper functions
function escapeSql(str) {
    if (!str) return '';
    return str.replace(/'/g, "''");
}

function detectCategory(steps) {
    const firstStep = steps[0]?.description?.toLowerCase() || '';

    if (firstStep.includes('pagar') || firstStep.includes('pago')) return 'payment';
    if (firstStep.includes('legaliza')) return 'legalization';
    if (firstStep.includes('registro') || firstStep.includes('inscri')) return 'registration';
    if (firstStep.includes('renovar') || firstStep.includes('renova')) return 'renewal';
    if (firstStep.includes('permiso') || firstStep.includes('licencia')) return 'permit';

    return 'general';
}

console.log('\n✅ Done!\n');
