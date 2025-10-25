#!/usr/bin/env node
import fs from 'fs';

const docs = JSON.parse(fs.readFileSync('data/documentos_requeridos.json', 'utf8'));

console.log('🔍 ANALYSE DOCUMENTS DUPLICATION (CORRIGÉ)\n');

const esOnly = docs.filter(d => d.nombre_es);
const frOnly = docs.filter(d => d.nombre_fr);
const enOnly = docs.filter(d => d.nombre_en);

console.log(`📊 FORMAT DÉTECTÉ\n`);
console.log(`  Total entries: ${docs.length}`);
console.log(`  ES entries: ${esOnly.length}`);
console.log(`  FR entries: ${frOnly.length}`);
console.log(`  EN entries: ${enOnly.length}`);
console.log(`  Format: 1 row par langue (non-normalisé)\n`);

// Analyser duplication contenu ES
const byContent = {};
esOnly.forEach(d => {
  const key = d.nombre_es.trim().toLowerCase();
  if (!byContent[key]) byContent[key] = [];
  byContent[key].push(d.tax_id);
});

const duplicates = Object.entries(byContent)
  .filter(([k, v]) => v.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log('📊 STATISTIQUES DUPLICATION\n');
console.log(`  Total docs ES: ${esOnly.length}`);
console.log(`  Contenus uniques: ${Object.keys(byContent).length}`);
console.log(`  Contenus dupliqués: ${duplicates.length}`);
console.log(`  Duplication rate: ${(duplicates.length / Object.keys(byContent).length * 100).toFixed(1)}%\n`);

console.log('🔝 TOP 15 DOCUMENTS DUPLIQUÉS\n');
duplicates.slice(0, 15).forEach((d, i) => {
  console.log(`${i + 1}. ×${d[1].length} - ${d[0].substring(0, 100)}${d[0].length > 100 ? '...' : ''}`);
  console.log(`   Services: ${d[1].slice(0, 10).join(', ')}${d[1].length > 10 ? '...' : ''}\n`);
});

// Économie potentielle
const totalEntries = docs.length;
const uniqueContent = Object.keys(byContent).length;
const duplicatedCount = esOnly.length - uniqueContent;

console.log('💰 ÉCONOMIE POTENTIELLE\n');
console.log(`  Entries actuelles: ${totalEntries} (${esOnly.length} ES + ${frOnly.length} FR + ${enOnly.length} EN)`);
console.log(`  Contenus uniques ES: ${uniqueContent}`);
console.log(`  Duplication: ${duplicatedCount} entries (${(duplicatedCount / esOnly.length * 100).toFixed(1)}%)`);
console.log(`  Après templates: ${uniqueContent} templates × 1 langue ES = ${uniqueContent} entries`);
console.log(`  + ${uniqueContent} traductions FR/EN dans entity_translations`);
console.log(`  Réduction: ${totalEntries} → ${uniqueContent} (${((1 - uniqueContent / totalEntries) * 100).toFixed(1)}%)\n`);

// Sauvegarder
const analysis = {
  format: '1_row_per_language',
  total_entries: totalEntries,
  es_entries: esOnly.length,
  unique_content: uniqueContent,
  duplicates_count: duplicates.length,
  duplication_rate: (duplicates.length / Object.keys(byContent).length * 100).toFixed(1),
  savings_potential: ((1 - uniqueContent / totalEntries) * 100).toFixed(1),
  top_duplicates: duplicates.slice(0, 20).map(d => ({
    content: d[0].substring(0, 200),
    count: d[1].length,
    services: d[1]
  }))
};

fs.writeFileSync('data/analysis/document_duplicates_analysis.json', JSON.stringify(analysis, null, 2));
console.log('✅ Analyse sauvegardée\n');
