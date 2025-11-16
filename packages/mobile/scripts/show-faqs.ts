import { GENERATED_FAQS } from '../src/database/seed/generated-faqs';

console.log('\n═══════════════════════════════════════════════════════════════════════════════');
console.log('                    📋 LISTE COMPLÈTE DES 30 SERVICES');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

const services = GENERATED_FAQS.slice(0, 30);

services.forEach((faq, idx) => {
  // Extraire le nom du service depuis response_es
  const nameMatch = faq.response_es.match(/\*\*(.*?)\*\*/);
  const name = nameMatch ? nameMatch[1] : 'N/A';

  // Extraire les coûts
  const costExpMatch = faq.response_es.match(/Expedición:\s*([\d,]+)\s*XAF/);
  const costRenMatch = faq.response_es.match(/Renovación:\s*([\d,]+)\s*XAF/);
  const costExp = costExpMatch ? costExpMatch[1] : 'N/A';
  const costRen = costRenMatch ? costRenMatch[1] : '-';

  // Extraire le délai
  const timeMatch = faq.response_es.match(/procesamiento:\s*(\d+)\s*días?/);
  const time = timeMatch ? timeMatch[1] + ' días' : 'N/A';

  // Extraire les keywords
  const keywords = JSON.parse(faq.keywords).slice(0, 3).join(', ');

  const num = (idx + 1).toString().padStart(2, '0');
  console.log(num + '. ' + name);
  console.log('    💰 Expedición: ' + costExp + ' XAF' + (costRen !== '-' ? ' | Renovación: ' + costRen + ' XAF' : ''));
  console.log('    ⏱️  Plazo: ' + time);
  console.log('    🔑 Keywords: ' + keywords + '...');
  console.log('    📝 ID: ' + faq.id);
  console.log();
});

console.log('═══════════════════════════════════════════════════════════════════════════════');

// Afficher les catégories
console.log('\n═══════════════════════════════════════════════════════════════════════════════');
console.log('                    📂 LISTE DES 15 CATÉGORIES');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

const categories = GENERATED_FAQS.slice(30, 45);
categories.forEach((faq, idx) => {
  const nameMatch = faq.response_es.match(/Categoría:\s*(.*?)\*\*/);
  const name = nameMatch ? nameMatch[1] : 'N/A';
  const keywords = JSON.parse(faq.keywords).slice(0, 4).join(', ');

  const num = (idx + 1).toString().padStart(2, '0');
  console.log(num + '. ' + name);
  console.log('    🔑 Keywords: ' + keywords);
  console.log('    📝 ID: ' + faq.id);
  console.log();
});

console.log('═══════════════════════════════════════════════════════════════════════════════');

// Afficher les procédurales
console.log('\n═══════════════════════════════════════════════════════════════════════════════');
console.log('                    🔧 LISTE DES 15 FAQs PROCÉDURALES');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

const procedural = GENERATED_FAQS.slice(45, 60);
procedural.forEach((faq, idx) => {
  const nameMatch = faq.response_es.match(/\*\*(.*?)\*\*/);
  const name = nameMatch ? nameMatch[1] : 'N/A';

  const num = (idx + 1).toString().padStart(2, '0');
  console.log(num + '. ' + name);
  console.log('    📝 ID: ' + faq.id);
  console.log('    🎯 Intent: ' + faq.intent);
  console.log();
});

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('\n📊 RÉSUMÉ FINAL:');
console.log('   ✅ Services: 30 FAQs');
console.log('   ✅ Catégories: 15 FAQs');
console.log('   ✅ Procédurales: 15 FAQs');
console.log('   ✅ TOTAL: 60 FAQs\n');
console.log('   🌐 Langues: 3 (ES, FR, EN) = 180 réponses traduites');
console.log('   🔑 Keywords totaux: ~250 mots-clés multilingues\n');
