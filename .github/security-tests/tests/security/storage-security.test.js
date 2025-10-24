const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

describe('Storage Security Rules', () => {
  let testEnv;

  beforeAll(async () => {
    const rulesPath = path.join(process.cwd(), 'storage.rules'); // auteur : kouemou sah jean emac
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-taxasge-storage',
      storage: { rules: fs.readFileSync(rulesPath, 'utf8') }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe('File Upload Tests', () => {
    test('should allow users to upload to their own directory', async () => {
      const userStorage = testEnv.authenticatedContext('user1').storage();
      const fileRef = userStorage.ref('user-documents/user1/app1/document.pdf');

      await expect(
        fileRef.put(Buffer.from('test content'), {
          customMetadata: {
            uploadedBy: 'user1',
            uploadedAt: new Date().toISOString(),
            applicationId: 'app1'
          }
        })
      ).resolves.toBeDefined();
    });

    test('should deny users from uploading to other users directories', async () => {
      const userStorage = testEnv.authenticatedContext('user1').storage();
      const fileRef = userStorage.ref('user-documents/user2/app1/document.pdf');

      await expect(fileRef.put(Buffer.from('test content'))).rejects.toThrow();
    });
  });

  describe('Public Assets Tests', () => {
    test('should allow public read access to system assets', async () => {
      const unauthedStorage = testEnv.unauthenticatedContext().storage();
      const fileRef = unauthedStorage.ref('system-assets/logos/logo.png');
      await expect(fileRef.getDownloadURL()).resolves.toBeDefined();
    });
  });
});
