const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

describe('Firestore Security Rules', () => {
  let testEnv;

  beforeAll(async () => {
    const rulesPath = path.join(process.cwd(), 'firestore.rules'); // auteur : kouemou sah jean emac
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-taxasge-security',
      firestore: { rules: fs.readFileSync(rulesPath, 'utf8') }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe('Authentication Tests', () => {
    test('should deny unauthenticated access to taxes collection', async () => {
      const unauthedDb = testEnv.unauthenticatedContext().firestore();
      await expect(unauthedDb.collection('taxes').get()).rejects.toThrow();
    });

    test('should allow authenticated access to taxes collection', async () => {
      const authedDb = testEnv.authenticatedContext('user1').firestore();
      await expect(authedDb.collection('taxes').get()).resolves.toBeDefined();
    });
  });

  describe('Authorization Tests', () => {
    test('should allow users to read their own data', async () => {
      const userDb = testEnv.authenticatedContext('user1').firestore();
      await expect(userDb.collection('users').doc('user1').get()).resolves.toBeDefined();
    });

    test('should deny users access to other users data', async () => {
      const userDb = testEnv.authenticatedContext('user1').firestore();
      await expect(userDb.collection('users').doc('user2').get()).rejects.toThrow();
    });

    test('should allow admin access to all data', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { admin: true, role: 'admin' }).firestore();
      await expect(adminDb.collection('users').get()).resolves.toBeDefined();
    });
  });

  describe('Data Validation Tests', () => {
    test('should require valid tax data structure', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();

      await expect(
        adminDb.collection('taxes').add({
          id: 'T-TEST-001',
          sub_categoria_id: 'SC-001',
          tasa_expedicion: 1000.0
        })
      ).resolves.toBeDefined();

      await expect(
        adminDb.collection('taxes').add({
          invalid: 'data'
        })
      ).rejects.toThrow();
    });
  });
});
