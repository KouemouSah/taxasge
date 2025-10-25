#!/usr/bin/env node
/**
 * ANALYZE REQUIRED DOCUMENTS DUPLICATION
 * Identifier documents identiques pour migration templates
 */

import fs from 'fs';

console.log('🔍 ANALYSE DUPLICATES REQUIRED DOCUMENTS\n');

const docs = JSON.parse(fs.readFileSync('data/documentos_requeridos.json', 'utf8'));

console.log(`📊 Dataset: ${docs.length} documents\n`);

// 1. Grouper par service
const byService = {};
docs.forEach(doc => {
  if (!byService[doc.tax_id]) {
    byService[doc.tax_id] = [];
  }
  byService[doc.tax_id].push(doc);
});

console.log(`Services avec documents: ${Object.keys(byService).length}\n`);

// 2. Grouper par nom document (duplication detection)
const byDocName = {};
docs.forEach(doc => {
  const key = (doc.document_name_es || '').trim().toLowerCase();
  if (!key) return;

  if (!byDocName[key]) {
    byDocName[key] = [];
  }
  byDocName[key].push(doc);
});

// 3. Identifier duplicates
const duplicates = Object.entries(byDocName)
  .filter(([name, arr]) => arr.length > 1)
  .map(([name, arr]) => ({
    document_name: arr[0].document_name_es,
    count: arr.length,
    services: [...new Set(arr.map(d => d.tax_id))],
    is_required_expedition: arr.filter(d => d.is_required_expedition).length,
    is_required_renewal: arr.filter(d => d.is_required_renewal).length
  }))
  .sort((a, b) => b.count - a.count);

console.log('📊 STATISTIQUES DUPLICATES\n');
console.log(`  Total noms documents uniques: ${Object.keys(byDocName).length}`);
console.log(`  Documents dupliqués: ${duplicates.length}`);
console.log(`  Total documents entries dupliquées: ${duplicates.reduce((sum, d) => sum + d.count, 0)}`);
console.log('');

// 4. Top 20 duplicates
console.log('🔝 TOP 20 DOCUMENTS DUPLIQUÉS\n');
duplicates.slice(0, 20).forEach((dup, idx) => {
  console.log(`${idx + 1}. "${dup.document_name}" (×${dup.count})`);
  console.log(`   Services: ${dup.services.length} (${dup.services.slice(0, 5).join(', ')}${dup.services.length > 5 ? '...' : ''})`);
  console.log(`   Expedition: ${dup.is_required_expedition}/${dup.count}, Renewal: ${dup.is_required_renewal}/${dup.count}`);
  console.log('');
});

// 5. Analyse par service (documents sets identiques)
console.log('🎯 SERVICES AVEC DOCUMENT SETS IDENTIQUES\n');

const serviceSignatures = {};
Object.entries(byService).forEach(([serviceId, serviceDocs]) => {
  const sorted = serviceDocs
    .filter(d => d.document_name_es)
    .sort((a, b) => a.document_name_es.localeCompare(b.document_name_es));

  if (sorted.length === 0) return;

  const signature = sorted.map(d => d.document_name_es.trim().toLowerCase()).join('|||');

  if (!serviceSignatures[signature]) {
    serviceSignatures[signature] = {
      services: [],
      documents: sorted.map(d => d.document_name_es)
    };
  }
  serviceSignatures[signature].services.push(serviceId);
});

const identicalSets = Object.entries(serviceSignatures)
  .filter(([sig, data]) => data.services.length > 1)
  .map(([sig, data]) => ({
    services: data.services,
    documents: data.documents,
    count: data.services.length
  }))
  .sort((a, b) => b.count - a.count);

console.log(`  Sets identiques: ${identicalSets.length}\n`);

identicalSets.slice(0, 10).forEach((set, idx) => {
  console.log(`${idx + 1}. Document Set (×${set.count} services)`);
  console.log(`   Services: ${set.services.slice(0, 8).join(', ')}${set.services.length > 8 ? '...' : ''}`);
  console.log(`   Documents (${set.documents.length}):`);
  set.documents.slice(0, 3).forEach((doc, i) => {
    console.log(`     ${i + 1}. ${doc.substring(0, 60)}${doc.length > 60 ? '...' : ''}`);
  });
  if (set.documents.length > 3) {
    console.log(`     ... ${set.documents.length - 3} more documents`);
  }
  console.log('');
});

// 6. Estimation économie
console.log('💰 ESTIMATION ÉCONOMIE MIGRATION TEMPLATES\n');

const totalDocs = docs.length;
const uniqueDocNames = Object.keys(byDocName).length;
const duplicatedDocs = duplicates.reduce((sum, d) => sum + d.count, 0);
const savingsPotential = duplicatedDocs - duplicates.length;

console.log(`  Documents actuels: ${totalDocs}`);
console.log(`  Noms uniques: ${uniqueDocNames}`);
console.log(`  Documents dupliqués: ${duplicatedDocs} (${(duplicatedDocs/totalDocs*100).toFixed(1)}%)`);
console.log(`  Économie potentielle: ${savingsPotential} lignes (${(savingsPotential/totalDocs*100).toFixed(1)}%)`);
console.log('');

console.log('  Après migration templates:');
console.log(`    Document templates: ~${uniqueDocNames}`);
console.log(`    Service assignments: ${Object.keys(byService).length}`);
console.log(`    Total lignes: ~${uniqueDocNames + Object.keys(byService).length} (vs ${totalDocs} actuellement)`);
console.log(`    Réduction: ${((1 - (uniqueDocNames + Object.keys(byService).length)/totalDocs)*100).toFixed(1)}%`);
console.log('');

// 7. Analyse traductions
console.log('🌐 ANALYSE TRADUCTIONS\n');

const withFR = docs.filter(d => d.document_name_fr).length;
const withEN = docs.filter(d => d.document_name_en).length;
const withTranslations = docs.filter(d => d.document_name_fr || d.document_name_en).length;

console.log(`  Total documents: ${totalDocs}`);
console.log(`  Avec FR: ${withFR} (${(withFR/totalDocs*100).toFixed(1)}%)`);
console.log(`  Avec EN: ${withEN} (${(withEN/totalDocs*100).toFixed(1)}%)`);
console.log(`  Avec traductions: ${withTranslations} (${(withTranslations/totalDocs*100).toFixed(1)}%)`);
console.log('');

// Estimation traductions après migration
const currentTranslations = withFR + withEN;
const uniqueWithTranslations = Object.values(byDocName)
  .filter(arr => arr.some(d => d.document_name_fr || d.document_name_en))
  .length;
const translationsAfterMigration = uniqueWithTranslations * 2; // FR + EN

console.log('  Traductions après templates:');
console.log(`    Avant: ~${currentTranslations} traductions (dupliquées)`);
console.log(`    Après: ~${translationsAfterMigration} traductions (uniques)`);
console.log(`    Économie: ${((1 - translationsAfterMigration/currentTranslations)*100).toFixed(1)}%`);
console.log('');

// 8. Recommandations
console.log('💡 RECOMMANDATIONS\n');

console.log('  ✅ TRÈS FORTE recommandation: Migrer documents vers templates');
console.log(`     Raison: ${(duplicatedDocs/totalDocs*100).toFixed(1)}% duplication détectée\n`);

console.log('  Stratégie unified procedures + documents:');
console.log('     1. Créer document_templates table (même pattern que procedure_templates)');
console.log('     2. Créer service_document_assignments (N:M relation)');
console.log('     3. Migrer traductions document → template-based');
console.log('     4. Économie combinée: procedures + documents = ~70% réduction totale');
console.log('');

console.log('  Bénéfices:');
console.log('     ✅ Zero duplication documents');
console.log('     ✅ Zero duplication traductions documents');
console.log('     ✅ Maintenance centralisée (1 UPDATE au lieu de ×52)');
console.log('     ✅ Cohérence garantie entre services');
console.log('     ✅ Architecture unifiée procedures + documents');
console.log('');

// Sauvegarder analyse JSON
const analysis = {
  stats: {
    total_documents: totalDocs,
    unique_doc_names: uniqueDocNames,
    duplicates_count: duplicates.length,
    duplicated_documents: duplicatedDocs,
    savings_potential: savingsPotential,
    services_count: Object.keys(byService).length,
    identical_sets: identicalSets.length
  },
  translations: {
    total: totalDocs,
    with_fr: withFR,
    with_en: withEN,
    with_any: withTranslations,
    current_translations: currentTranslations,
    after_templates: translationsAfterMigration,
    savings_pct: ((1 - translationsAfterMigration/currentTranslations)*100).toFixed(1)
  },
  top_duplicates: duplicates.slice(0, 50),
  identical_sets: identicalSets.slice(0, 20)
};

fs.writeFileSync('data/analysis/document_duplicates_analysis.json', JSON.stringify(analysis, null, 2));
console.log('✅ Analyse sauvegardée: data/analysis/document_duplicates_analysis.json\n');
