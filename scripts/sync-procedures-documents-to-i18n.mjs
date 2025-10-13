#!/usr/bin/env node
/**
 * SYNC PROCEDURES & DOCUMENTS → FRONTEND I18N
 *
 * Lit procedimientos.json et documentos_requeridos.json
 * Génère i18n/{es,fr,en}/procedures.json et documents.json
 *
 * Structure JSON source : 1 objet par langue (description_es OU description_fr OU description_en)
 */

import fs from 'fs';
import path from 'path';

console.log('🔄 SYNC PROCEDURES & DOCUMENTS → FRONTEND I18N\n');

// Lecture JSON sources
const procedures = JSON.parse(fs.readFileSync('data/procedimientos.json', 'utf8'));
const documents = JSON.parse(fs.readFileSync('data/documentos_requeridos.json', 'utf8'));

console.log('📊 Data loaded:');
console.log(`  Procedures: ${procedures.length}`);
console.log(`  Documents: ${documents.length}\n`);

// Structure résultat par langue
const i18nProcedures = {
  es: {},
  fr: {},
  en: {}
};

const i18nDocuments = {
  es: {},
  fr: {},
  en: {}
};

let stats = {
  procedures: { es: 0, fr: 0, en: 0 },
  documents: { es: 0, fr: 0, en: 0 }
};

console.log('🔍 Processing procedures...\n');

// Traiter procédures
procedures.forEach(proc => {
  // Clé : "procedures.{tax_id}.{step_number}" ou "procedures.{id}"
  const keyById = `procedures.${proc.id}`;
  const keyByTax = `procedures.${proc.tax_id}.step_${proc.step_number}`;

  if (proc.description_es) {
    i18nProcedures.es[keyById] = proc.description_es;
    i18nProcedures.es[keyByTax] = proc.description_es;
    stats.procedures.es++;
  }
  if (proc.description_fr) {
    i18nProcedures.fr[keyById] = proc.description_fr;
    i18nProcedures.fr[keyByTax] = proc.description_fr;
    stats.procedures.fr++;
  }
  if (proc.description_en) {
    i18nProcedures.en[keyById] = proc.description_en;
    i18nProcedures.en[keyByTax] = proc.description_en;
    stats.procedures.en++;
  }
});

console.log('  Procedures extracted:');
console.log(`    ES: ${stats.procedures.es} descriptions`);
console.log(`    FR: ${stats.procedures.fr} descriptions`);
console.log(`    EN: ${stats.procedures.en} descriptions\n`);

console.log('🔍 Processing documents...\n');

// Traiter documents
documents.forEach(doc => {
  // Clé : "documents.{id}" ou "documents.{tax_id}"
  const keyById = `documents.${doc.id}`;
  const keyByTax = `documents.${doc.tax_id}`;

  if (doc.nombre_es) {
    i18nDocuments.es[keyById] = doc.nombre_es;
    if (!i18nDocuments.es[keyByTax]) {
      i18nDocuments.es[keyByTax] = doc.nombre_es;
    }
    stats.documents.es++;
  }
  if (doc.nombre_fr) {
    i18nDocuments.fr[keyById] = doc.nombre_fr;
    if (!i18nDocuments.fr[keyByTax]) {
      i18nDocuments.fr[keyByTax] = doc.nombre_fr;
    }
    stats.documents.fr++;
  }
  if (doc.nombre_en) {
    i18nDocuments.en[keyById] = doc.nombre_en;
    if (!i18nDocuments.en[keyByTax]) {
      i18nDocuments.en[keyByTax] = doc.nombre_en;
    }
    stats.documents.en++;
  }
});

console.log('  Documents extracted:');
console.log(`    ES: ${stats.documents.es} names`);
console.log(`    FR: ${stats.documents.fr} names`);
console.log(`    EN: ${stats.documents.en} names\n`);

// Calcul couverture
const procCoverageEs = ((stats.procedures.es / procedures.length) * 100).toFixed(1);
const procCoverageFr = ((stats.procedures.fr / procedures.length) * 100).toFixed(1);
const procCoverageEn = ((stats.procedures.en / procedures.length) * 100).toFixed(1);

const docCoverageEs = ((stats.documents.es / documents.length) * 100).toFixed(1);
const docCoverageFr = ((stats.documents.fr / documents.length) * 100).toFixed(1);
const docCoverageEn = ((stats.documents.en / documents.length) * 100).toFixed(1);

console.log('📊 Coverage Analysis:\n');
console.log('  PROCEDURES:');
console.log(`    ES: ${procCoverageEs}% (${stats.procedures.es}/${procedures.length})`);
console.log(`    FR: ${procCoverageFr}% (${stats.procedures.fr}/${procedures.length})`);
console.log(`    EN: ${procCoverageEn}% (${stats.procedures.en}/${procedures.length})`);
console.log('\n  DOCUMENTS:');
console.log(`    ES: ${docCoverageEs}% (${stats.documents.es}/${documents.length})`);
console.log(`    FR: ${docCoverageFr}% (${stats.documents.fr}/${documents.length})`);
console.log(`    EN: ${docCoverageEn}% (${stats.documents.en}/${documents.length})\n`);

// Warnings
if (stats.procedures.fr < procedures.length || stats.procedures.en < procedures.length) {
  const missingFr = procedures.length - stats.procedures.fr;
  const missingEn = procedures.length - stats.procedures.en;
  console.log('⚠️  Missing Procedure Translations:');
  if (missingFr > 0) console.log(`  FR: ${missingFr} missing`);
  if (missingEn > 0) console.log(`  EN: ${missingEn} missing`);
  console.log('');
}

if (stats.documents.fr < documents.length || stats.documents.en < documents.length) {
  const missingFr = documents.length - stats.documents.fr;
  const missingEn = documents.length - stats.documents.en;
  console.log('⚠️  Missing Document Translations:');
  if (missingFr > 0) console.log(`  FR: ${missingFr} missing`);
  if (missingEn > 0) console.log(`  EN: ${missingEn} missing`);
  console.log('');
}

// Créer dossiers i18n si nécessaire
const i18nDir = path.join(process.cwd(), 'i18n');
const languages = ['es', 'fr', 'en'];

console.log('💾 Saving i18n files...\n');

for (const lang of languages) {
  const langDir = path.join(i18nDir, lang);
  if (!fs.existsSync(langDir)) {
    fs.mkdirSync(langDir, { recursive: true });
  }

  // Sauvegarder procedures.json
  const procPath = path.join(langDir, 'procedures.json');
  const procContent = JSON.stringify(i18nProcedures[lang], null, 2);
  fs.writeFileSync(procPath, procContent, 'utf8');
  const procSize = (fs.statSync(procPath).size / 1024).toFixed(2);
  const procKeys = Object.keys(i18nProcedures[lang]).length;
  console.log(`✅ ${lang}/procedures.json (${procSize} KB, ${procKeys} keys)`);

  // Sauvegarder documents.json
  const docPath = path.join(langDir, 'documents.json');
  const docContent = JSON.stringify(i18nDocuments[lang], null, 2);
  fs.writeFileSync(docPath, docContent, 'utf8');
  const docSize = (fs.statSync(docPath).size / 1024).toFixed(2);
  const docKeys = Object.keys(i18nDocuments[lang]).length;
  console.log(`✅ ${lang}/documents.json (${docSize} KB, ${docKeys} keys)`);
}

console.log('\n💡 USAGE EXEMPLE (Frontend):\n');
console.log('  import esProcedures from \'./i18n/es/procedures.json\';');
console.log('  import frProcedures from \'./i18n/fr/procedures.json\';');
console.log('  import esDocuments from \'./i18n/es/documents.json\';');
console.log('');
console.log('  // Par ID');
console.log('  const proc = frProcedures["procedures.{uuid}"];');
console.log('');
console.log('  // Par tax_id + step');
console.log('  const step1 = esProcedures["procedures.T-001.step_1"];');
console.log('  const doc = esDocuments["documents.T-001"];');
console.log('');

console.log('✅ Procedures & Documents i18n synced successfully!\n');

// Summary
const totalKeys =
  Object.keys(i18nProcedures.es).length +
  Object.keys(i18nProcedures.fr).length +
  Object.keys(i18nProcedures.en).length +
  Object.keys(i18nDocuments.es).length +
  Object.keys(i18nDocuments.fr).length +
  Object.keys(i18nDocuments.en).length;

console.log('📊 FINAL SUMMARY:\n');
console.log(`  Total keys generated: ${totalKeys}`);
console.log(`  Procedures: ${stats.procedures.es + stats.procedures.fr + stats.procedures.en} entries`);
console.log(`  Documents: ${stats.documents.es + stats.documents.fr + stats.documents.en} entries`);
console.log('');
