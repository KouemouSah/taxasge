/**
 * TaxasGE Mobile - Test Connexion Supabase Réelle
 * Script Node.js standalone (pas Jest) pour validation
 *
 * Usage: node scripts/test-supabase-connection.js
 *
 * @author KOUEMOU SAH Jean Emac
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('\n' + '='.repeat(70));
console.log('🔥 TAXASGE MOBILE - TEST CONNEXION SUPABASE RÉELLE');
console.log('='.repeat(70));

// Validation credentials
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ ERREUR: Variables d\'environnement manquantes');
  console.error('   REACT_APP_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   REACT_APP_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅' : '❌');
  process.exit(1);
}

console.log('✅ Credentials loaded from .env');
console.log(`   URL: ${SUPABASE_URL}`);
console.log(`   Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

// Créer client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('✅ Supabase client created\n');

// Tests
async function runTests() {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  function test(name, fn) {
    results.total++;
    return fn()
      .then(result => {
        results.passed++;
        results.tests.push({ name, status: 'PASS', result });
        console.log(`✅ PASS: ${name}`);
        if (result) console.log(`   ${result}`);
      })
      .catch(error => {
        results.failed++;
        results.tests.push({ name, status: 'FAIL', error: error.message });
        console.log(`❌ FAIL: ${name}`);
        console.log(`   Error: ${error.message}`);
      });
  }

  console.log('🧪 RUNNING TESTS...\n');

  // Test 1: JWT Validation
  await test('JWT Token Validation', async () => {
    const [headerB64, payloadB64] = SUPABASE_ANON_KEY.split('.');

    const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());

    if (header.alg !== 'HS256') throw new Error('Invalid JWT algorithm');
    if (payload.role !== 'anon') throw new Error('Invalid JWT role');
    if (payload.ref !== 'bpdzfkymgydjxxwlctam') throw new Error('Invalid project ref');

    return `JWT valid - Project: ${payload.ref}, Role: ${payload.role}`;
  });

  // Test 2: Connection - Count Ministries
  await test('Query: Count Ministries', async () => {
    const { count, error } = await supabase
      .from('ministries')
      .select('*', { count: 'exact', head: true });

    if (error) throw new Error(error.message);
    return `Found ${count} ministries`;
  });

  // Test 3: Query Sample Ministry
  await test('Query: Get Sample Ministry', async () => {
    const { data, error } = await supabase
      .from('ministries')
      .select('id, code, icon, color')
      .limit(1);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('No ministries found');

    const ministry = data[0];
    return `ID: ${ministry.id}, Code: ${ministry.code}`;
  });

  // Test 4: Count Fiscal Services
  await test('Query: Count Fiscal Services', async () => {
    const { count, error } = await supabase
      .from('fiscal_services')
      .select('*', { count: 'exact', head: true });

    if (error) throw new Error(error.message);
    return `Found ${count} fiscal services`;
  });

  // Test 5: Query Sample Fiscal Service
  await test('Query: Get Sample Fiscal Service', async () => {
    const { data, error } = await supabase
      .from('fiscal_services')
      .select('id, service_code, service_type, tasa_expedicion')
      .limit(1);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('No fiscal services found');

    const service = data[0];
    return `ID: ${service.id}, Type: ${service.service_type}, Tasa: ${service.tasa_expedicion}`;
  });

  // Test 6: Hierarchical Query (Ministry → Sector → Category)
  await test('Query: Hierarchical (Ministry → Sector → Category)', async () => {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        id,
        code,
        sector_id,
        sectors (
          id,
          code,
          ministerio_id,
          ministries (
            id,
            code
          )
        )
      `)
      .not('sector_id', 'is', null)
      .limit(1);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('No hierarchical data found');

    const category = data[0];
    const sector = category.sectors;
    const ministry = sector?.ministries;

    return `${ministry?.code || 'N/A'} → ${sector?.code || 'N/A'} → ${category.code}`;
  });

  // Test 7: Query Performance
  await test('Performance: Query Speed (<2s)', async () => {
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('fiscal_services')
      .select('id, service_code, service_type')
      .limit(10);

    const duration = Date.now() - startTime;

    if (error) throw new Error(error.message);
    if (duration >= 2000) throw new Error(`Too slow: ${duration}ms`);

    return `Completed in ${duration}ms`;
  });

  // Test 8: RLS Security (Insert should be blocked)
  await test('Security: RLS Enforcement (Insert Blocked)', async () => {
    const { error } = await supabase
      .from('ministries')
      .insert({ id: 'TEST', code: 'TEST' });

    if (!error) throw new Error('RLS not enforced - Insert should be blocked!');

    return `Insert blocked - RLS working (${error.code || 'BLOCKED'})`;
  });

  // Test 9: Query Sectors
  await test('Query: Count Sectors', async () => {
    const { count, error } = await supabase
      .from('sectors')
      .select('*', { count: 'exact', head: true });

    if (error) throw new Error(error.message);
    return `Found ${count} sectors`;
  });

  // Test 10: Query Categories
  await test('Query: Count Categories', async () => {
    const { count, error } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    if (error) throw new Error(error.message);
    return `Found ${count} categories`;
  });

  return results;
}

// Exécution
runTests()
  .then(results => {
    console.log('\n' + '='.repeat(70));
    console.log('📊 RÉSULTATS DES TESTS');
    console.log('='.repeat(70));
    console.log(`Total:  ${results.total} tests`);
    console.log(`✅ Pass:  ${results.passed}`);
    console.log(`❌ Fail:  ${results.failed}`);
    console.log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
    console.log('='.repeat(70));

    if (results.failed > 0) {
      console.log('\n❌ ÉCHECS:');
      results.tests
        .filter(t => t.status === 'FAIL')
        .forEach(t => {
          console.log(`   - ${t.name}: ${t.error}`);
        });
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎯 CONCLUSION');
    console.log('='.repeat(70));

    if (results.failed === 0) {
      console.log('✅ TOUS LES TESTS PASSENT');
      console.log('✅ Connexion Supabase validée');
      console.log('✅ Schéma database validé');
      console.log('✅ Queries fonctionnelles');
      console.log('✅ Sécurité RLS activée');
      console.log('✅ Performance acceptable');
      console.log('\n🚀 SUPABASE PRÊT POUR L\'INTÉGRATION MOBILE\n');
      process.exit(0);
    } else {
      console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ');
      console.log('⚠️  Vérifier la configuration Supabase');
      console.log('⚠️  Vérifier les credentials dans .env\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ ERREUR FATALE:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
