import fs from 'fs';

const taxes = JSON.parse(fs.readFileSync('data/taxes_restructured.json', 'utf8'));

const ids = new Set();
const duplicates = [];
let nextId = 548; // Start from T-548

console.log('🔍 Scanning for duplicates...\n');

for (let i = 0; i < taxes.length; i++) {
  const tax = taxes[i];
  if (ids.has(tax.id)) {
    console.log(`Found duplicate: ${tax.id} at index ${i}`);
    console.log(`  Category: ${tax.category_id} - ${tax.nombre_es}`);
    const newId = `T-${nextId}`;
    console.log(`  → Renaming to: ${newId}\n`);

    taxes[i].id = newId;
    duplicates.push({ oldId: tax.id, newId, index: i });
    nextId++;
  } else {
    ids.add(tax.id);
  }
}

if (duplicates.length > 0) {
  console.log(`✅ Fixed ${duplicates.length} duplicates`);
  console.log('💾 Writing corrected file...');

  fs.writeFileSync(
    'data/taxes_restructured.json',
    JSON.stringify(taxes, null, 2),
    'utf8'
  );

  console.log('✅ data/taxes_restructured.json updated');
  console.log('\n📋 Changes made:');
  duplicates.forEach(d => {
    console.log(`  ${d.oldId} (duplicate) → ${d.newId}`);
  });

  console.log('\n🚀 Next steps:');
  console.log('  1. Run: node scripts/enrich-json-data.mjs');
  console.log('  2. Import seed_data.sql to Supabase');
} else {
  console.log('✅ No duplicates found!');
}
