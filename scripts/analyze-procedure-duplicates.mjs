#!/usr/bin/env node
/**
 * ANALYZE PROCEDURE DUPLICATES
 * Identifier procedures identiques pour migration templates
 */

import fs from 'fs';

console.log('🔍 ANALYSE DUPLICATES PROCEDURES\n');

const procedures = JSON.parse(fs.readFileSync('data/procedimientos.json', 'utf8'));

console.log(`📊 Dataset: ${procedures.length} procedures\n`);

// 1. Grouper par description_es (contenu identique)
const byDescription = {};
procedures.forEach(proc => {
  if (!proc.description_es) return;

  const key = proc.description_es.trim().toLowerCase();
  if (!byDescription[key]) {
    byDescription[key] = [];
  }
  byDescription[key].push(proc);
});

// 2. Identifier duplicates (même description utilisée par plusieurs services)
const duplicates = Object.entries(byDescription)
  .filter(([desc, procs]) => procs.length > 1)
  .map(([desc, procs]) => ({
    description: procs[0].description_es.substring(0, 80) + '...',
    count: procs.length,
    services: [...new Set(procs.map(p => p.tax_id))],
    step_numbers: [...new Set(procs.map(p => p.step_number))].sort((a,b) => a-b)
  }))
  .sort((a, b) => b.count - a.count);

console.log('📊 STATISTIQUES DUPLICATES\n');
console.log(`  Total descriptions uniques: ${Object.keys(byDescription).length}`);
console.log(`  Descriptions dupliquées: ${duplicates.length}`);
console.log(`  Total procedures dupliquées: ${duplicates.reduce((sum, d) => sum + d.count, 0)}`);
console.log('');

// 3. Top 20 duplicates
console.log('🔝 TOP 20 PROCEDURES DUPLIQUÉES\n');
duplicates.slice(0, 20).forEach((dup, idx) => {
  console.log(`${idx + 1}. "${dup.description}" (×${dup.count})`);
  console.log(`   Services: ${dup.services.length} (${dup.services.slice(0, 5).join(', ')}${dup.services.length > 5 ? '...' : ''})`);
  console.log(`   Steps: ${dup.step_numbers.join(', ')}`);
  console.log('');
});

// 4. Analyse par step_number
console.log('📊 ANALYSE PAR STEP NUMBER\n');
const byStep = {};
duplicates.forEach(dup => {
  dup.step_numbers.forEach(step => {
    if (!byStep[step]) byStep[step] = 0;
    byStep[step] += dup.count;
  });
});

Object.entries(byStep)
  .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
  .forEach(([step, count]) => {
    console.log(`  Step ${step}: ${count} duplicates`);
  });
console.log('');

// 5. Potentiel templates (procedures complètes identiques)
console.log('🎯 POTENTIEL TEMPLATES (Séquences Complètes)\n');

// Grouper par service pour identifier séquences
const byService = {};
procedures.forEach(proc => {
  if (!byService[proc.tax_id]) {
    byService[proc.tax_id] = [];
  }
  byService[proc.tax_id].push(proc);
});

// Générer signature de chaque service (concat descriptions steps)
const signatures = {};
Object.entries(byService).forEach(([serviceId, procs]) => {
  const sorted = procs
    .filter(p => p.description_es)
    .sort((a, b) => a.step_number - b.step_number);

  if (sorted.length === 0) return;

  const signature = sorted.map(p => p.description_es.trim().toLowerCase()).join('|||');

  if (!signatures[signature]) {
    signatures[signature] = {
      services: [],
      steps: sorted.map(p => p.description_es)
    };
  }
  signatures[signature].services.push(serviceId);
});

// Identifier séquences dupliquées (template candidates)
const templateCandidates = Object.entries(signatures)
  .filter(([sig, data]) => data.services.length > 1)
  .map(([sig, data]) => ({
    services: data.services,
    steps: data.steps,
    count: data.services.length
  }))
  .sort((a, b) => b.count - a.count);

console.log(`  Séquences complètes identiques: ${templateCandidates.length}`);
console.log('');

templateCandidates.slice(0, 10).forEach((candidate, idx) => {
  console.log(`${idx + 1}. Template Candidate (×${candidate.count} services)`);
  console.log(`   Services: ${candidate.services.slice(0, 10).join(', ')}${candidate.services.length > 10 ? '...' : ''}`);
  console.log(`   Steps (${candidate.steps.length}):`);
  candidate.steps.slice(0, 3).forEach((step, i) => {
    console.log(`     ${i + 1}. ${step.substring(0, 60)}...`);
  });
  if (candidate.steps.length > 3) {
    console.log(`     ... ${candidate.steps.length - 3} more steps`);
  }
  console.log('');
});

// 6. Estimation économie
console.log('💰 ESTIMATION ÉCONOMIE MIGRATION\n');

const totalProcedures = procedures.length;
const uniqueDescriptions = Object.keys(byDescription).length;
const duplicatedProcedures = duplicates.reduce((sum, d) => sum + d.count, 0);
const savingsPotential = duplicatedProcedures - duplicates.length;

console.log(`  Procedures actuelles: ${totalProcedures}`);
console.log(`  Descriptions uniques: ${uniqueDescriptions}`);
console.log(`  Procedures dupliquées: ${duplicatedProcedures} (${(duplicatedProcedures/totalProcedures*100).toFixed(1)}%)`);
console.log(`  Économie potentielle: ${savingsPotential} lignes (${(savingsPotential/totalProcedures*100).toFixed(1)}%)`);
console.log('');

console.log('  Après migration templates:');
console.log(`    Templates steps: ~${uniqueDescriptions}`);
console.log(`    Service assignments: ${Object.keys(byService).length}`);
console.log(`    Total lignes: ~${uniqueDescriptions + Object.keys(byService).length} (vs ${totalProcedures} actuellement)`);
console.log(`    Réduction: ${((1 - (uniqueDescriptions + Object.keys(byService).length)/totalProcedures)*100).toFixed(1)}%`);
console.log('');

// 7. Recommandations
console.log('💡 RECOMMANDATIONS MIGRATION\n');

console.log('  Phase 1 (Quick Win):');
console.log(`    - Créer ${Math.min(templateCandidates.length, 20)} templates pour séquences complètes identiques`);
console.log(`    - Couvre ${templateCandidates.slice(0, 20).reduce((sum, c) => sum + c.count, 0)} services`);
console.log('');

console.log('  Phase 2 (Optimisation):');
console.log(`    - Créer templates pour top ${Math.min(duplicates.length, 50)} steps individuels`);
console.log(`    - Permet composition flexible`);
console.log('');

console.log('  Phase 3 (Complet):');
console.log(`    - Migrer tous les ${Object.keys(byService).length} services vers templates`);
console.log(`    - Économie finale: ~${savingsPotential} lignes DB`);
console.log('');

// Sauvegarder analyse JSON
const analysis = {
  stats: {
    total_procedures: totalProcedures,
    unique_descriptions: uniqueDescriptions,
    duplicates_count: duplicates.length,
    duplicated_procedures: duplicatedProcedures,
    savings_potential: savingsPotential
  },
  top_duplicates: duplicates.slice(0, 50),
  template_candidates: templateCandidates.slice(0, 20)
};

fs.writeFileSync('data/analysis/procedure_duplicates_analysis.json', JSON.stringify(analysis, null, 2));
console.log('✅ Analyse sauvegardée: data/analysis/procedure_duplicates_analysis.json\n');
