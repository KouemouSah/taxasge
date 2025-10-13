/**
 * Environment Variables Test - Phase 3 Validation
 * Valide que les variables d'environnement mobile sont correctement configurées
 */

describe('Environment Variables - Phase 3 Validation', () => {
  describe('Supabase Configuration', () => {
    it('should have REACT_APP_SUPABASE_URL defined', () => {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      expect(supabaseUrl).toBeDefined();
      expect(supabaseUrl).toBe('https://bpdzfkymgydjxxwlctam.supabase.co');
    });

    it('should have REACT_APP_SUPABASE_ANON_KEY defined', () => {
      const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
      expect(anonKey).toBeDefined();
      // JWT format validation
      if (anonKey) {
        expect(anonKey).toMatch(/^eyJ/);
        expect(anonKey.length).toBeGreaterThan(100);
      }
    });

    it('should have valid Supabase URL format', () => {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      if (supabaseUrl) {
        expect(supabaseUrl).toMatch(/^https:\/\//);
        expect(supabaseUrl).toContain('supabase.co');
      }
    });
  });

  describe('Firebase Configuration', () => {
    it('should have REACT_NATIVE_FIREBASE_PROJECT_ID defined', () => {
      const projectId = process.env.REACT_NATIVE_FIREBASE_PROJECT_ID;
      expect(projectId).toBeDefined();
      expect(projectId).toBe('taxasge-prod');
    });

    it('should have FIREBASE_ANDROID_APP_ID defined', () => {
      const androidAppId = process.env.FIREBASE_ANDROID_APP_ID;
      expect(androidAppId).toBeDefined();
      if (androidAppId) {
        expect(androidAppId).toMatch(/^1:392159428433:/);
      }
    });

    it('should have FIREBASE_IOS_APP_ID defined', () => {
      const iosAppId = process.env.FIREBASE_IOS_APP_ID;
      expect(iosAppId).toBeDefined();
    });

    it('should have FIREBASE_STORAGE_BUCKET defined', () => {
      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
      expect(storageBucket).toBeDefined();
      if (storageBucket) {
        expect(storageBucket.toLowerCase()).toContain('firebase');
      }
    });
  });

  describe('AI/ML Configuration', () => {
    it('should have AI model paths defined', () => {
      const modelPath = process.env.AI_MODEL_PATH;
      const tokenizerPath = process.env.AI_TOKENIZER_PATH;
      const intentsPath = process.env.AI_INTENTS_PATH;

      expect(modelPath).toBeDefined();
      expect(tokenizerPath).toBeDefined();
      expect(intentsPath).toBeDefined();
    });

    it('should have AI configuration values', () => {
      const maxTokens = process.env.AI_MAX_TOKENS;
      const confidenceThreshold = process.env.AI_CONFIDENCE_THRESHOLD;

      expect(maxTokens).toBeDefined();
      expect(confidenceThreshold).toBeDefined();
    });
  });

  describe('Application Environment', () => {
    it('should have NODE_ENV defined', () => {
      const nodeEnv = process.env.NODE_ENV;
      expect(nodeEnv).toBeDefined();
      expect(['development', 'test', 'production']).toContain(nodeEnv);
    });

    it('should have feature flags defined', () => {
      const flags = [
        'ENABLE_AI_CHATBOT',
        'ENABLE_OFFLINE_MODE',
        'ENABLE_BIOMETRIC_AUTH',
        'ENABLE_PUSH_NOTIFICATIONS',
        'ENABLE_CRASH_REPORTING',
        'ENABLE_ANALYTICS'
      ];

      flags.forEach(flag => {
        const value = process.env[flag];
        expect(value).toBeDefined();
        expect(['true', 'false']).toContain(value);
      });
    });

    it('should have debug flags defined', () => {
      const debugFlags = [
        'DEBUG_MODE',
        'FLIPPER_ENABLED',
        'REACTOTRON_ENABLED'
      ];

      debugFlags.forEach(flag => {
        const value = process.env[flag];
        expect(value).toBeDefined();
      });
    });
  });
});
