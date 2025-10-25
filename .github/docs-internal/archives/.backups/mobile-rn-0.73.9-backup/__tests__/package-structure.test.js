/**
 * Mobile Package Structure Test - Phase 2 Validation
 * Valide que la structure du package mobile est correcte après
 * la migration standalone (removal from Yarn Workspaces)
 */

const fs = require('fs');
const path = require('path');

describe('Mobile Package Structure - Phase 2 Validation', () => {
  const mobilePath = path.join(__dirname, '..');

  describe('Standalone Configuration', () => {
    it('should have node_modules installed locally (not symlinks)', () => {
      const nodeModulesPath = path.join(mobilePath, 'node_modules');
      expect(fs.existsSync(nodeModulesPath)).toBe(true);

      // Vérifier que c'est bien un dossier local, pas un symlink
      const stats = fs.lstatSync(nodeModulesPath);
      expect(stats.isDirectory()).toBe(true);
      expect(stats.isSymbolicLink()).toBe(false);
    });

    it('should have substantial number of packages (865 expected)', () => {
      const nodeModulesPath = path.join(mobilePath, 'node_modules');
      const packages = fs.readdirSync(nodeModulesPath).filter(f => {
        const fullPath = path.join(nodeModulesPath, f);
        try {
          return !f.startsWith('.') && fs.statSync(fullPath).isDirectory();
        } catch {
          return false;
        }
      });

      // Phase 2: npm install --legacy-peer-deps installa 865 packages
      expect(packages.length).toBeGreaterThan(800);
      console.log(`✓ Found ${packages.length} packages installed locally`);
    });

    it('should have critical packages installed locally', () => {
      const nodeModulesPath = path.join(mobilePath, 'node_modules');
      const criticalPackages = [
        'react',
        'react-native',
        '@supabase/supabase-js',
        'react-native-sqlite-storage',
        '@reduxjs/toolkit',
        '@react-navigation/native',
        '@react-native-firebase/app'
      ];

      criticalPackages.forEach(pkg => {
        const pkgPath = path.join(nodeModulesPath, pkg);
        expect(fs.existsSync(pkgPath)).toBe(true);
        expect(fs.statSync(pkgPath).isDirectory()).toBe(true);
      });
    });
  });

  describe('Configuration Files', () => {
    it('should have package.json', () => {
      const packageJsonPath = path.join(mobilePath, 'package.json');
      expect(fs.existsSync(packageJsonPath)).toBe(true);

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      expect(packageJson.name).toBe('@taxasge/mobile');
      expect(packageJson.version).toBeDefined();
    });

    it('should have TypeScript config (tsconfig.json)', () => {
      const tsconfigPath = path.join(mobilePath, 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);

      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      expect(tsconfig.compilerOptions).toBeDefined();
      expect(tsconfig.compilerOptions.jsx).toBe('react-native');
    });

    it('should have Babel config', () => {
      const babelConfigPath = path.join(mobilePath, 'babel.config.js');
      expect(fs.existsSync(babelConfigPath)).toBe(true);
    });

    it('should have .env file (Phase 3)', () => {
      const envPath = path.join(mobilePath, '.env');
      expect(fs.existsSync(envPath)).toBe(true);

      const envContent = fs.readFileSync(envPath, 'utf8');
      expect(envContent).toContain('REACT_APP_SUPABASE_URL');
      expect(envContent).toContain('REACT_NATIVE_FIREBASE_PROJECT_ID');
    });

    it('should have .env.example', () => {
      const envExamplePath = path.join(mobilePath, '.env.example');
      expect(fs.existsSync(envExamplePath)).toBe(true);
    });

    it('should have package-lock.json (npm standalone)', () => {
      const packageLockPath = path.join(mobilePath, 'package-lock.json');
      expect(fs.existsSync(packageLockPath)).toBe(true);

      const stats = fs.statSync(packageLockPath);
      // Phase 2: package-lock.json devrait être substantiel (19,344 lignes)
      expect(stats.size).toBeGreaterThan(100000); // > 100KB
    });
  });

  describe('Platform Directories', () => {
    it('should have android directory', () => {
      const androidPath = path.join(mobilePath, 'android');
      expect(fs.existsSync(androidPath)).toBe(true);
      expect(fs.statSync(androidPath).isDirectory()).toBe(true);
    });

    it('should have ios directory', () => {
      const iosPath = path.join(mobilePath, 'ios');
      expect(fs.existsSync(iosPath)).toBe(true);
      expect(fs.statSync(iosPath).isDirectory()).toBe(true);
    });

    it('should have android/app/build.gradle', () => {
      const buildGradlePath = path.join(mobilePath, 'android', 'app', 'build.gradle');
      expect(fs.existsSync(buildGradlePath)).toBe(true);
    });

    it('should have ios Podfile', () => {
      const podfilePath = path.join(mobilePath, 'ios', 'Podfile');
      expect(fs.existsSync(podfilePath)).toBe(true);
    });
  });

  describe('Source Structure', () => {
    it('should have src directory', () => {
      const srcPath = path.join(mobilePath, 'src');
      expect(fs.existsSync(srcPath)).toBe(true);
      expect(fs.statSync(srcPath).isDirectory()).toBe(true);
    });

    it('should have __tests__ directory', () => {
      const testsPath = path.join(mobilePath, '__tests__');
      expect(fs.existsSync(testsPath)).toBe(true);
      expect(fs.statSync(testsPath).isDirectory()).toBe(true);
    });

    it('should have index.js entry point', () => {
      const indexPath = path.join(mobilePath, 'index.js');
      expect(fs.existsSync(indexPath)).toBe(true);
    });

    it('should have App.tsx or App.js', () => {
      const appTsxPath = path.join(mobilePath, 'App.tsx');
      const appJsPath = path.join(mobilePath, 'App.js');

      const hasApp = fs.existsSync(appTsxPath) || fs.existsSync(appJsPath);
      expect(hasApp).toBe(true);
    });
  });

  describe('Git Ignore Configuration', () => {
    it('should have .gitignore', () => {
      const gitignorePath = path.join(mobilePath, '.gitignore');
      expect(fs.existsSync(gitignorePath)).toBe(true);
    });

    it('.gitignore should ignore .env', () => {
      const gitignorePath = path.join(mobilePath, '.gitignore');
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      expect(gitignoreContent).toMatch(/\.env/);
    });

    it('.gitignore should ignore node_modules', () => {
      const gitignorePath = path.join(mobilePath, '.gitignore');
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      expect(gitignoreContent).toMatch(/node_modules/);
    });
  });

  describe('Scripts Availability', () => {
    it('should have all required npm scripts', () => {
      const packageJsonPath = path.join(mobilePath, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      const requiredScripts = [
        'android',
        'ios',
        'start',
        'test',
        'lint'
      ];

      requiredScripts.forEach(script => {
        expect(packageJson.scripts[script]).toBeDefined();
      });
    });
  });

  describe('React Native Version', () => {
    it('should be using React Native 0.73.0', () => {
      const packageJsonPath = path.join(mobilePath, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.dependencies['react-native']).toBe('0.73.0');
      expect(packageJson.dependencies['react']).toBe('18.2.0');
    });
  });

  describe('TypeScript Configuration', () => {
    it('should have correct TypeScript version', () => {
      const packageJsonPath = path.join(mobilePath, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Phase 2: TypeScript 4.8.4 (pas 5.x pour compatibilité)
      expect(packageJson.devDependencies['typescript']).toBe('4.8.4');
    });

    it('should have path aliases configured', () => {
      const tsconfigPath = path.join(mobilePath, 'tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

      expect(tsconfig.compilerOptions.baseUrl).toBe('.');
      expect(tsconfig.compilerOptions.paths).toBeDefined();
      expect(tsconfig.compilerOptions.paths['@/*']).toBeDefined();
    });
  });

  describe('Jest Configuration', () => {
    it('should have Jest configuration in package.json', () => {
      const packageJsonPath = path.join(mobilePath, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.jest).toBeDefined();
      expect(packageJson.jest.preset).toBe('react-native');
    });

    it('should have correct coverage thresholds', () => {
      const packageJsonPath = path.join(mobilePath, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.jest.coverageThreshold).toBeDefined();
      expect(packageJson.jest.coverageThreshold.global.lines).toBe(70);
    });
  });
});
