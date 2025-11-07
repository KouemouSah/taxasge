/**
 * TaxasGE Mobile - Supabase Schema Analyzer
 *
 * OBJECTIF: Analyser le schéma réel de Supabase pour comprendre:
 * - Structure exacte des 11 tables
 * - Relations entre tables (FK)
 * - Données réelles (exemples)
 * - Comment calculer délais, coûts, documents requis
 *
 * CRITIQUE: Ne rien inventer - tout extraire de la BD réelle
 */

import { createClient } from '@supabase/supabase-js';

// Credentials depuis SyncService.ts
const SUPABASE_URL = 'https://bpdzfkymgydjxxwlctam.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZHpma3ltZ3lkanh4d2xjdGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzg4NjksImV4cCI6MjA2ODg1NDg2OX0.M0d8r-0fxkwEQYyYfERExRj8sMwmda2UBoHPabgqbFg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TableAnalysis {
  name: string;
  count: number;
  expectedCount: number;
  sample?: any[];
  schema?: any;
}

const TABLES_TO_ANALYZE = [
  { name: 'ministries', expectedCount: 14 },
  { name: 'sectors', expectedCount: 16 },
  { name: 'categories', expectedCount: 98 },
  { name: 'fiscal_services', expectedCount: 850 },
  { name: 'service_keywords', expectedCount: 7014 },
  { name: 'procedure_templates', expectedCount: 703 },
  { name: 'procedure_template_steps', expectedCount: 2077 },
  { name: 'document_templates', expectedCount: 792 },
  { name: 'service_procedure_assignments', expectedCount: 850 },
  { name: 'service_document_assignments', expectedCount: 1234 },
  { name: 'entity_translations', expectedCount: 8420 },
];

async function analyzeTable(tableName: string, expectedCount: number): Promise<TableAnalysis> {
  console.log(`\n📊 Analyzing table: ${tableName}...`);

  try {
    // 1. Count total rows
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error(`❌ Error counting ${tableName}:`, countError);
      return { name: tableName, count: 0, expectedCount, sample: [] };
    }

    const actualCount = count || 0;
    const status = actualCount === expectedCount ? '✅' : '⚠️';
    console.log(`${status} Count: ${actualCount} (expected: ${expectedCount})`);

    // 2. Get sample rows (first 3)
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(3);

    if (sampleError) {
      console.error(`❌ Error getting sample from ${tableName}:`, sampleError);
    }

    // 3. Analyze schema from sample data
    let schema: any = {};
    if (sampleData && sampleData.length > 0) {
      const firstRow = sampleData[0];
      schema = Object.keys(firstRow).reduce((acc, key) => {
        const value = firstRow[key];
        acc[key] = {
          type: typeof value,
          nullable: value === null,
          sample: value,
        };
        return acc;
      }, {} as any);
    }

    return {
      name: tableName,
      count: actualCount,
      expectedCount,
      sample: sampleData || [],
      schema,
    };
  } catch (error) {
    console.error(`❌ Unexpected error analyzing ${tableName}:`, error);
    return { name: tableName, count: 0, expectedCount, sample: [] };
  }
}

async function analyzeServiceExample() {
  console.log('\n\n════════════════════════════════════════════════════════════════');
  console.log('🔍 ANALYSE DÉTAILLÉE: Exemple de Service Complet (Passeport)');
  console.log('════════════════════════════════════════════════════════════════\n');

  try {
    // 1. Chercher service "pasaporte"
    const { data: services, error: servicesError } = await supabase
      .from('fiscal_services')
      .select('*')
      .ilike('name', '%pasaporte%')
      .limit(1);

    if (servicesError || !services || services.length === 0) {
      console.log('❌ Service pasaporte non trouvé');
      return;
    }

    const service = services[0];
    console.log('📋 SERVICE TROUVÉ:');
    console.log(JSON.stringify(service, null, 2));

    // 2. Récupérer le ministère
    if (service.ministry_id) {
      const { data: ministry } = await supabase
        .from('ministries')
        .select('*')
        .eq('id', service.ministry_id)
        .single();

      console.log('\n🏛️ MINISTÈRE:');
      console.log(JSON.stringify(ministry, null, 2));
    }

    // 3. Récupérer la catégorie
    if (service.category_id) {
      const { data: category } = await supabase
        .from('categories')
        .select('*')
        .eq('id', service.category_id)
        .single();

      console.log('\n📂 CATÉGORIE:');
      console.log(JSON.stringify(category, null, 2));
    }

    // 4. Récupérer la procédure assignée
    const { data: procedureAssignments } = await supabase
      .from('service_procedure_assignments')
      .select('*')
      .eq('service_id', service.id);

    console.log('\n📝 PROCÉDURE ASSIGNMENTS:');
    console.log(JSON.stringify(procedureAssignments, null, 2));

    if (procedureAssignments && procedureAssignments.length > 0) {
      const assignment = procedureAssignments[0];

      // 5. Récupérer le template de procédure
      const { data: procedureTemplate } = await supabase
        .from('procedure_templates')
        .select('*')
        .eq('id', assignment.procedure_template_id)
        .single();

      console.log('\n📋 PROCEDURE TEMPLATE:');
      console.log(JSON.stringify(procedureTemplate, null, 2));

      // 6. Récupérer les steps de la procédure
      const { data: steps } = await supabase
        .from('procedure_template_steps')
        .select('*')
        .eq('procedure_template_id', assignment.procedure_template_id)
        .order('step_order', { ascending: true });

      console.log('\n📊 PROCEDURE STEPS:');
      console.log(JSON.stringify(steps, null, 2));

      // Calculer délai total
      if (steps && steps.length > 0) {
        const totalDuration = steps.reduce((sum, step) => {
          return sum + (step.estimated_duration_days || 0);
        }, 0);
        console.log(`\n⏱️ DÉLAI TOTAL CALCULÉ: ${totalDuration} jours`);
      }
    }

    // 7. Récupérer les documents assignés
    const { data: documentAssignments } = await supabase
      .from('service_document_assignments')
      .select('*')
      .eq('service_id', service.id);

    console.log('\n📄 DOCUMENT ASSIGNMENTS:');
    console.log(JSON.stringify(documentAssignments, null, 2));

    if (documentAssignments && documentAssignments.length > 0) {
      const documentIds = documentAssignments.map((d) => d.document_template_id);

      const { data: documents } = await supabase
        .from('document_templates')
        .select('*')
        .in('id', documentIds);

      console.log('\n📑 DOCUMENTS REQUIS:');
      console.log(JSON.stringify(documents, null, 2));
    }

    // 8. Récupérer les keywords
    const { data: keywords } = await supabase
      .from('service_keywords')
      .select('*')
      .eq('service_id', service.id);

    console.log('\n🔑 KEYWORDS:');
    console.log(JSON.stringify(keywords, null, 2));

    // 9. Récupérer les traductions
    const { data: translations } = await supabase
      .from('entity_translations')
      .select('*')
      .eq('entity_type', 'service')
      .eq('entity_code', service.service_code);

    console.log('\n🌐 TRANSLATIONS:');
    console.log(JSON.stringify(translations, null, 2));
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse du service exemple:', error);
  }
}

async function analyzeEntityTranslations() {
  console.log('\n\n════════════════════════════════════════════════════════════════');
  console.log('🌐 ANALYSE: entity_translations - Types d\'entités');
  console.log('════════════════════════════════════════════════════════════════\n');

  try {
    const { data: translations } = await supabase
      .from('entity_translations')
      .select('entity_type')
      .limit(1000);

    if (translations) {
      const entityTypes = [...new Set(translations.map((t) => t.entity_type))];
      console.log('📊 Types d\'entités trouvés:');
      entityTypes.forEach((type) => {
        const count = translations.filter((t) => t.entity_type === type).length;
        console.log(`   • ${type}: ${count} traductions (sur échantillon de 1000)`);
      });
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('        🔍 ANALYSE CRITIQUE DU SCHÉMA SUPABASE TAXASGE');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('\n📅 Date:', new Date().toISOString());
  console.log('🔗 Supabase URL:', SUPABASE_URL);
  console.log('\n');

  const results: TableAnalysis[] = [];

  // Analyser chaque table
  for (const table of TABLES_TO_ANALYZE) {
    const analysis = await analyzeTable(table.name, table.expectedCount);
    results.push(analysis);
  }

  // Résumé
  console.log('\n\n════════════════════════════════════════════════════════════════');
  console.log('📊 RÉSUMÉ DES COUNTS');
  console.log('════════════════════════════════════════════════════════════════\n');

  results.forEach((result) => {
    const status = result.count === result.expectedCount ? '✅' : '⚠️';
    const diff = result.count - result.expectedCount;
    const diffStr = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '±0';
    console.log(
      `${status} ${result.name.padEnd(35)} ${String(result.count).padStart(6)} / ${result.expectedCount} (${diffStr})`
    );
  });

  // Afficher schémas
  console.log('\n\n════════════════════════════════════════════════════════════════');
  console.log('📐 SCHÉMAS DES TABLES');
  console.log('════════════════════════════════════════════════════════════════\n');

  results.forEach((result) => {
    if (result.schema && Object.keys(result.schema).length > 0) {
      console.log(`\n📋 ${result.name}:`);
      Object.entries(result.schema).forEach(([field, info]: [string, any]) => {
        console.log(`   • ${field.padEnd(30)} ${info.type.padEnd(10)} ${info.nullable ? 'NULL' : 'NOT NULL'}`);
      });
    }
  });

  // Analyse détaillée du service exemple
  await analyzeServiceExample();

  // Analyse entity_translations
  await analyzeEntityTranslations();

  console.log('\n\n════════════════════════════════════════════════════════════════');
  console.log('✅ ANALYSE TERMINÉE');
  console.log('════════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
