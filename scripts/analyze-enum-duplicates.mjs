import fs from 'fs';

const content = fs.readFileSync('data/enums.md', 'utf8');

// Parser le markdown
const enums = {};
let currentEnum = null;
let currentValue = null;

const lines = content.split('\n');

for (const line of lines) {
  // Détection d'un ENUM type (### xxx_enum)
  if (line.startsWith('### ') && line.includes('_enum')) {
    currentEnum = line.replace('### ', '').trim();
    enums[currentEnum] = {};
  }

  // Détection d'une valeur ENUM (**value**)
  else if (line.startsWith('**') && line.endsWith('**')) {
    currentValue = line.replace(/\*\*/g, '').trim();
    if (currentEnum && currentValue) {
      enums[currentEnum][currentValue] = {};
    }
  }

  // Détection traduction (- es/fr/en: xxx)
  else if (line.match(/^- (es|fr|en): (.+)$/)) {
    const match = line.match(/^- (es|fr|en): (.+)$/);
    const lang = match[1];
    const translation = match[2].trim();

    if (currentEnum && currentValue) {
      enums[currentEnum][currentValue][lang] = translation;
    }
  }
}

console.log('📊 ANALYSE DES DOUBLONS DANS ENUMS\n');

// Analyser les doublons par langue
const translationsByLang = {
  es: new Map(),
  fr: new Map(),
  en: new Map()
};

// Collecter toutes les traductions avec leurs contextes
for (const [enumType, values] of Object.entries(enums)) {
  for (const [enumValue, translations] of Object.entries(values)) {
    for (const [lang, translation] of Object.entries(translations)) {
      if (!translationsByLang[lang].has(translation)) {
        translationsByLang[lang].set(translation, []);
      }
      translationsByLang[lang].get(translation).push({
        enum_type: enumType,
        enum_value: enumValue
      });
    }
  }
}

// Identifier les doublons (traductions utilisées > 1 fois)
console.log('🔍 DOUBLONS IDENTIFIÉS\n');

for (const [lang, map] of Object.entries(translationsByLang)) {
  const duplicates = Array.from(map.entries())
    .filter(([_, contexts]) => contexts.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  if (duplicates.length > 0) {
    console.log(`\n${lang.toUpperCase()} - ${duplicates.length} traductions dupliquées :\n`);

    duplicates.slice(0, 10).forEach(([translation, contexts]) => {
      console.log(`  "${translation}" : ${contexts.length} usages`);
      contexts.forEach(ctx => {
        console.log(`    → ${ctx.enum_type}.${ctx.enum_value}`);
      });
      console.log('');
    });

    if (duplicates.length > 10) {
      console.log(`  ... et ${duplicates.length - 10} autres doublons\n`);
    }
  }
}

// Statistiques
console.log('\n📈 STATISTIQUES GLOBALES\n');
console.log(`Total ENUMs: ${Object.keys(enums).length}`);
console.log(`Total valeurs: ${Object.values(enums).reduce((sum, e) => sum + Object.keys(e).length, 0)}`);

for (const [lang, map] of Object.entries(translationsByLang)) {
  const total = map.size;
  const duplicates = Array.from(map.entries()).filter(([_, ctx]) => ctx.length > 1).length;
  const duplicateInstances = Array.from(map.entries())
    .filter(([_, ctx]) => ctx.length > 1)
    .reduce((sum, [_, ctx]) => sum + ctx.length, 0);

  console.log(`\n${lang.toUpperCase()}:`);
  console.log(`  Traductions uniques: ${total}`);
  console.log(`  Traductions dupliquées: ${duplicates} (${((duplicates/total)*100).toFixed(1)}%)`);
  console.log(`  Total instances dupliquées: ${duplicateInstances}`);
  console.log(`  Économie potentielle: ${duplicateInstances - duplicates} entrées`);
}

// Proposer stratégie
console.log('\n\n💡 STRATÉGIE RECOMMANDÉE\n');
console.log('Option 1 : CONTEXTE EXPLICITE (Recommandé)');
console.log('  → Garder enum_type + enum_value comme clé');
console.log('  → Permet nuances contextuelles futures');
console.log('  → Exemple: "pending" paiement ≠ "pending" document');
console.log('  → Entrées DB: ~384 (pas de déduplication)');
console.log('');
console.log('Option 2 : DÉDUPLICATION AVEC ALIAS');
console.log('  → Créer table "translation_strings" avec ID unique');
console.log('  → enum_translations référence translation_string_id');
console.log('  → Économie: ~40% entrées (150 vs 384)');
console.log('  → Complexité: +1 table, +1 JOIN');
console.log('');
console.log('Option 3 : DÉDUPLICATION FRONTEND UNIQUEMENT');
console.log('  → DB garde structure actuelle (contexte explicite)');
console.log('  → Frontend déduplique dans son cache');
console.log('  → Meilleur compromis: Flexibilité DB + Performance Frontend');
