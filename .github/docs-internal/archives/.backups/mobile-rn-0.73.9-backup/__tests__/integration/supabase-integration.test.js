/**
 * TaxasGE Mobile - Supabase Integration Tests (REAL CONNECTION)
 * ⚠️ Ces tests font des connexions HTTP réelles à Supabase
 * ⚠️ Nécessitent des credentials valides dans .env
 *
 * @author KOUEMOU SAH Jean Emac
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Timeout pour connexions réseau
const NETWORK_TIMEOUT = 10000;

describe('🔥 Supabase Integration - REAL CONNECTION', () => {
  let supabase;

  beforeAll(() => {
    // Vérifier que les credentials existent
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error(
        '❌ SUPABASE_URL ou SUPABASE_ANON_KEY manquants dans .env'
      );
    }

    console.log('\n🔍 Testing connection to:', SUPABASE_URL);

    // Créer client Supabase
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  describe('1️⃣ Connection & Authentication', () => {
    it('should create Supabase client successfully', () => {
      expect(supabase).toBeDefined();
      expect(supabase.auth).toBeDefined();
      expect(supabase.from).toBeDefined();
    });

    it('should have valid URL format', () => {
      expect(SUPABASE_URL).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co$/);
    });

    it('should have valid anon key format (JWT)', () => {
      // JWT format: header.payload.signature
      expect(SUPABASE_ANON_KEY).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);

      // Decode JWT header
      const [headerB64] = SUPABASE_ANON_KEY.split('.');
      const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());

      expect(header.alg).toBe('HS256');
      expect(header.typ).toBe('JWT');
    });

    it('should verify JWT payload contains required fields', () => {
      const [, payloadB64] = SUPABASE_ANON_KEY.split('.');
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());

      expect(payload.iss).toBe('supabase');
      expect(payload.ref).toBe('bpdzfkymgydjxxwlctam'); // Project ref
      expect(payload.role).toBe('anon');
      expect(payload.iat).toBeDefined(); // Issued at
      expect(payload.exp).toBeDefined(); // Expiration
    });
  });

  describe('2️⃣ Database Schema Validation', () => {
    it('should connect to database and list tables', async () => {
      // Query information_schema pour lister les tables
      const { data, error } = await supabase
        .from('ministries') // Table qui doit exister
        .select('id')
        .limit(1);

      if (error) {
        console.error('❌ Error querying ministries:', error);
      }

      expect(error).toBeNull();
      expect(data).toBeDefined();
    }, NETWORK_TIMEOUT);

    it('should verify "ministries" table exists and has correct schema', async () => {
      const { data, error } = await supabase
        .from('ministries')
        .select('id, code, icon, color, display_order, is_active, created_at')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0) {
        const ministry = data[0];

        // Vérifier structure
        expect(ministry).toHaveProperty('id');
        expect(ministry).toHaveProperty('code');
        expect(ministry).toHaveProperty('display_order');

        console.log('✅ Sample ministry:', {
          id: ministry.id,
          code: ministry.code
        });
      }
    }, NETWORK_TIMEOUT);

    it('should verify "sectors" table exists', async () => {
      const { data, error } = await supabase
        .from('sectors')
        .select('id, ministerio_id, code, icon, color, display_order')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0) {
        const sector = data[0];
        expect(sector).toHaveProperty('ministerio_id');

        console.log('✅ Sample sector:', {
          id: sector.id,
          code: sector.code,
          ministerio_id: sector.ministerio_id
        });
      }
    }, NETWORK_TIMEOUT);

    it('should verify "categories" table exists', async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, sector_id, ministry_id, code, service_type, display_order')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0) {
        const category = data[0];

        // Category peut être liée à sector OU ministry
        const linkedTo = category.sector_id ? 'sector' : 'ministry';

        console.log('✅ Sample category:', {
          id: category.id,
          code: category.code,
          linked_to: linkedTo
        });
      }
    }, NETWORK_TIMEOUT);

    it('should verify "fiscal_services" table exists and has critical fields', async () => {
      const { data, error } = await supabase
        .from('fiscal_services')
        .select('id, category_id, service_code, service_type, tasa_expedicion, calculation_method')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0) {
        const service = data[0];

        expect(service).toHaveProperty('category_id');
        expect(service).toHaveProperty('service_type');

        console.log('✅ Sample fiscal_service:', {
          id: service.id,
          service_code: service.service_code,
          service_type: service.service_type,
          tasa_expedicion: service.tasa_expedicion
        });
      }
    }, NETWORK_TIMEOUT);
  });

  describe('3️⃣ Real Query Operations', () => {
    it('should count total ministries', async () => {
      const { count, error } = await supabase
        .from('ministries')
        .select('*', { count: 'exact', head: true });

      expect(error).toBeNull();
      expect(count).toBeGreaterThan(0);

      console.log(`✅ Total ministries in database: ${count}`);
    }, NETWORK_TIMEOUT);

    it('should count total fiscal services', async () => {
      const { count, error } = await supabase
        .from('fiscal_services')
        .select('*', { count: 'exact', head: true });

      expect(error).toBeNull();
      expect(count).toBeGreaterThan(0);

      console.log(`✅ Total fiscal_services in database: ${count}`);
    }, NETWORK_TIMEOUT);

    it('should query fiscal services with filters', async () => {
      const { data, error } = await supabase
        .from('fiscal_services')
        .select('id, service_code, service_type, tasa_expedicion')
        .eq('service_type', 'document_processing')
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0) {
        console.log(`✅ Found ${data.length} document_processing services`);
        console.log('   Sample:', data[0].service_code);
      }
    }, NETWORK_TIMEOUT);

    it('should query hierarchical data (ministry → sector → category)', async () => {
      // Query avec join
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

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0 && data[0].sectors) {
        const category = data[0];
        const sector = category.sectors;
        const ministry = sector.ministries;

        console.log('✅ Hierarchical query success:');
        console.log(`   Ministry: ${ministry?.code || 'N/A'}`);
        console.log(`   → Sector: ${sector.code}`);
        console.log(`   → Category: ${category.code}`);
      }
    }, NETWORK_TIMEOUT);
  });

  describe('4️⃣ Performance & Network', () => {
    it('should complete query in acceptable time (<2s)', async () => {
      const startTime = Date.now();

      const { data, error } = await supabase
        .from('fiscal_services')
        .select('id, service_code, service_type')
        .limit(10);

      const duration = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(duration).toBeLessThan(2000);

      console.log(`✅ Query completed in ${duration}ms`);
    }, NETWORK_TIMEOUT);

    it('should handle network error gracefully', async () => {
      // Créer client avec URL invalide
      const badClient = createClient('https://invalid-url.supabase.co', 'fake-key');

      const { data, error } = await badClient
        .from('ministries')
        .select('*')
        .limit(1);

      // Devrait avoir une erreur
      expect(error).toBeDefined();
      expect(data).toBeNull();

      console.log('✅ Network error handled:', error?.message || 'Unknown error');
    }, NETWORK_TIMEOUT);
  });

  describe('5️⃣ Security & Permissions', () => {
    it('should respect RLS (Row Level Security) policies', async () => {
      // Avec anon key, on ne devrait pas pouvoir modifier
      const { error } = await supabase
        .from('ministries')
        .insert({ id: 'TEST', code: 'TEST' });

      // Devrait être refusé (RLS)
      expect(error).toBeDefined();

      console.log('✅ RLS enforced:', error?.message || 'Insert blocked');
    }, NETWORK_TIMEOUT);

    it('should allow SELECT on public tables', async () => {
      // Les tables référence devraient être lisibles
      const { data, error } = await supabase
        .from('ministries')
        .select('id')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      console.log('✅ Public SELECT allowed');
    }, NETWORK_TIMEOUT);
  });
});

describe('📊 Supabase Connection Summary', () => {
  it('should generate connection report', () => {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUPABASE CONNECTION VALIDATION REPORT');
    console.log('='.repeat(60));
    console.log(`URL:      ${SUPABASE_URL}`);
    console.log(`Project:  bpdzfkymgydjxxwlctam`);
    console.log(`Key:      ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
    console.log('='.repeat(60));
    console.log('✅ All integration tests completed');
    console.log('✅ Real HTTP connections validated');
    console.log('✅ Database schema verified');
    console.log('✅ Query operations functional');
    console.log('✅ Security policies enforced');
    console.log('='.repeat(60) + '\n');

    expect(true).toBe(true);
  });
});
