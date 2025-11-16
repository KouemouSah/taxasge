/**
 * Script to inspect Supabase database structure
 *
 * Purpose: Query actual table structures to understand:
 * 1. Which columns exist in each table
 * 2. Which columns should be synced to offline version
 * 3. Verify user's sync numbers (6,818 records vs 22,000 in production)
 *
 * Run: node packages/mobile/scripts/inspect-supabase-schema.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bpdzfkymgydjxxwlctam.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZHpma3ltZ3lkanh4d2xjdGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzg4NjksImV4cCI6MjA2ODg1NDg2OX0.M0d8r-0fxkwEQYyYfERExRj8sMwmda2UBoHPabgqbFg';

// Tables to inspect based on user's data
const TABLES_TO_INSPECT = [
  { name: 'ministries', expectedCount: 14 },
  { name: 'sectors', expectedCount: 16 },
  { name: 'categories', expectedCount: 98 },
  { name: 'fiscal_services', expectedCount: 850 },
  { name: 'service_keywords', expectedCount: 100 },
  { name: 'procedure_templates', expectedCount: 703 },
  { name: 'procedure_template_steps', expectedCount: 2077 },
  { name: 'document_templates', expectedCount: 792 },
  { name: 'service_procedure_assignments', expectedCount: 850 },
  { name: 'service_document_assignments', expectedCount: 1234 },
  { name: 'entity_translations', expectedCount: 8420 },
];

async function inspectTable(supabase, tableName, expectedCount) {
  console.log(`\n========================================`);
  console.log(`📊 Inspecting: ${tableName}`);
  console.log(`========================================`);

  try {
    // Get count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error(`❌ Error counting ${tableName}:`, countError.message);
      return null;
    }

    console.log(`✅ Total records: ${count} (expected: ${expectedCount})`);

    if (count !== expectedCount) {
      console.log(`⚠️  Discrepancy: ${count - expectedCount} records difference`);
    }

    // Get sample record to inspect columns
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.error(`❌ Error fetching sample from ${tableName}:`, error.message);
      return null;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No data found in table');
      return { tableName, count, columns: [] };
    }

    const sampleRecord = data[0];
    const columns = Object.keys(sampleRecord);

    console.log(`\n📋 Columns (${columns.length} total):`);
    columns.forEach(col => {
      const value = sampleRecord[col];
      const type = Array.isArray(value) ? 'array' : typeof value;
      const sample = Array.isArray(value)
        ? `[${value.length} items]`
        : typeof value === 'string'
          ? value.substring(0, 50) + (value.length > 50 ? '...' : '')
          : value;

      console.log(`  - ${col}: ${type} = ${JSON.stringify(sample)}`);
    });

    return {
      tableName,
      count,
      expectedCount,
      discrepancy: count - expectedCount,
      columns,
      sampleRecord
    };

  } catch (err) {
    console.error(`❌ Unexpected error inspecting ${tableName}:`, err.message);
    return null;
  }
}

async function main() {
  console.log('🔍 Starting Supabase Database Inspection');
  console.log('==========================================\n');
  console.log(`🌐 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔑 Using anon key (first 20 chars): ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const results = [];

  for (const table of TABLES_TO_INSPECT) {
    const result = await inspectTable(supabase, table.name, table.expectedCount);
    if (result) {
      results.push(result);
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n\n========================================');
  console.log('📊 SUMMARY');
  console.log('========================================\n');

  let totalActual = 0;
  let totalExpected = 0;

  results.forEach(result => {
    totalActual += result.count;
    totalExpected += result.expectedCount;

    const status = result.discrepancy === 0 ? '✅' : '⚠️';
    console.log(`${status} ${result.tableName}: ${result.count} records (expected: ${result.expectedCount})`);
    console.log(`   Columns: ${result.columns.join(', ')}`);
    console.log('');
  });

  console.log('========================================');
  console.log(`Total actual: ${totalActual} records`);
  console.log(`Total expected: ${totalExpected} records`);
  console.log(`Difference: ${totalActual - totalExpected} records`);
  console.log('========================================\n');

  // Special analysis for critical tables
  console.log('\n========================================');
  console.log('🔬 CRITICAL TABLE ANALYSIS');
  console.log('========================================\n');

  // Check fiscal_services for name_fr/name_en columns
  const fiscalServicesResult = results.find(r => r.tableName === 'fiscal_services');
  if (fiscalServicesResult) {
    console.log('📌 fiscal_services analysis:');
    console.log(`   Has name_es: ${fiscalServicesResult.columns.includes('name_es') ? '✅' : '❌'}`);
    console.log(`   Has name_fr: ${fiscalServicesResult.columns.includes('name_fr') ? '✅' : '❌'}`);
    console.log(`   Has name_en: ${fiscalServicesResult.columns.includes('name_en') ? '✅' : '❌'}`);

    if (!fiscalServicesResult.columns.includes('name_fr') || !fiscalServicesResult.columns.includes('name_en')) {
      console.log('   ⚠️  CRITICAL: ChatbotService.ts queries for non-existent name_fr/name_en columns!');
      console.log('   ⚠️  Must use entity_translations table instead!');
    }
  }

  // Check entity_translations structure
  const entityTransResult = results.find(r => r.tableName === 'entity_translations');
  if (entityTransResult) {
    console.log('\n📌 entity_translations analysis:');
    console.log(`   Has entity_type: ${entityTransResult.columns.includes('entity_type') ? '✅' : '❌'}`);
    console.log(`   Has entity_code: ${entityTransResult.columns.includes('entity_code') ? '✅' : '❌'}`);
    console.log(`   Has language_code: ${entityTransResult.columns.includes('language_code') ? '✅' : '❌'}`);
    console.log(`   Has field_name: ${entityTransResult.columns.includes('field_name') ? '✅' : '❌'}`);
    console.log(`   Has translation_text: ${entityTransResult.columns.includes('translation_text') ? '✅' : '❌'}`);

    console.log('\n   Sample record:');
    console.log(`   ${JSON.stringify(entityTransResult.sampleRecord, null, 2)}`);
  }

  // Check service_keywords discrepancy
  const keywordsResult = results.find(r => r.tableName === 'service_keywords');
  if (keywordsResult) {
    console.log('\n📌 service_keywords analysis:');
    console.log(`   Actual: ${keywordsResult.count} records`);
    console.log(`   Expected (user's data): ${keywordsResult.expectedCount} records`);
    console.log(`   Production (mentioned): 7,014 records`);
    console.log(`   ⚠️  Huge discrepancy! Only ${((keywordsResult.count / 7014) * 100).toFixed(1)}% of production data`);
  }

  console.log('\n✅ Inspection complete!');
}

main().catch(console.error);
