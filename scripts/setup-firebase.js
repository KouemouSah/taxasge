#!/usr/bin/env node
/**
 * TaxasGE Firebase Configuration Setup Script
 * Génère les fichiers de configuration basés sur l'environnement
 */

const fs = require('fs');
const path = require('path');

// Détection de l'environnement
const environment = process.env.FIREBASE_PROJECT || process.env.NODE_ENV || 'dev';
const isProd = environment === 'prod' || environment === 'production';
const isDev = !isProd;

console.log(`🔧 Setting up Firebase configuration for: ${environment}`);

// Chargement de la configuration des environnements
let environments;
try {
  environments = JSON.parse(fs.readFileSync('config/environments.json', 'utf8'));
} catch (error) {
  console.error('❌ Error loading environments.json:', error.message);
  process.exit(1);
}

const config = environments[isProd ? 'prod' : 'dev'];
if (!config) {
  console.error(`❌ Configuration not found for environment: ${environment}`);
  process.exit(1);
}

// Génération du fichier public/index.html
function generateIndexHtml() {
  const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${config.title}</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: ${config.theme.backgroundColor};
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            text-align: center;
        }
        
        .logo {
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
        
        .title {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            font-weight: 300;
        }
        
        .status {
            color: ${config.theme.primaryColor};
            font-weight: bold;
            font-size: 1.2rem;
            margin-bottom: 2rem;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        
        .info-card {
            background: rgba(255, 255, 255, 0.05);
            padding: 1rem;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .info-card h3 {
            margin-bottom: 0.5rem;
            color: ${config.theme.primaryColor};
        }
        
        .api-links {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 2rem;
        }
        
        .api-link {
            display: inline-block;
            padding: 12px 24px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            text-decoration: none;
            border-radius: 25px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
            font-weight: 500;
        }
        
        .api-link:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
        .footer {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        .env-badge {
            position: absolute;
            top: 20px;
            right: 20px;
            background: ${config.theme.primaryColor};
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        @media (max-width: 768px) {
            .container {
                margin: 20px;
                padding: 20px;
            }
            
            .title {
                font-size: 2rem;
            }
            
            .api-links {
                flex-direction: column;
                align-items: center;
            }
        }
    </style>
</head>
<body>
    <div class="env-badge">${environment.toUpperCase()}</div>
    
    <div class="container">
        <div class="logo">🚀</div>
        <h1 class="title">TaxasGE API</h1>
        <p class="status">✅ ${config.description}</p>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>📊 Version</h3>
                <p>0.1.0</p>
            </div>
            <div class="info-card">
                <h3>🗄️ Database</h3>
                <p>Supabase PostgreSQL</p>
            </div>
            <div class="info-card">
                <h3>🤖 AI Model</h3>
                <p>Ready (0.41MB)</p>
            </div>
            <div class="info-card">
                <h3>🏛️ Data</h3>
                <p>547 taxes</p>
            </div>
            <div class="info-card">
                <h3>🌍 Languages</h3>
                <p>ES, FR, EN</p>
            </div>
            <div class="info-card">
                <h3>📱 Platforms</h3>
                <p>Android, iOS, Web</p>
            </div>
        </div>
        
        <div class="api-links">
            <a href="/api/main" class="api-link">🔌 Test API</a>
            <a href="/api/health" class="api-link">💚 Health Check</a>
            <a href="/api/taxes" class="api-link">🏛️ Taxes Data</a>
            <a href="/api/database/status" class="api-link">🗄️ Database Status</a>
        </div>
        
        <div class="footer">
            <p>🇬🇶 <strong>TaxasGE</strong> - Simplifying tax management for Equatorial Guinea</p>
            <p>Environment: <strong>${environment}</strong> | Project: <strong>${config.projectId}</strong></p>
            <p>Last deployed: <strong>${new Date().toISOString().split('T')[0]}</strong></p>
        </div>
    </div>
</body>
</html>`;

  // Création du dossier public s'il n'existe pas
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public', { recursive: true });
  }

  fs.writeFileSync('public/index.html', template);
  console.log('✅ Generated public/index.html');
}

// Génération du fichier .firebaserc pour sélection automatique du projet
function generateFirebaseRc() {
  const firebaseRc = {
    projects: {
      default: config.projectId,
      dev: "taxasge-dev",
      prod: "taxasge-prod"
    },
    targets: {},
    etags: {}
  };

  fs.writeFileSync('.firebaserc', JSON.stringify(firebaseRc, null, 2));
  console.log(`✅ Generated .firebaserc with project: ${config.projectId}`);
}

// Validation de la configuration Firebase existante
function validateFirebaseJson() {
  if (!fs.existsSync('firebase.json')) {
    console.log('⚠️  firebase.json not found, it should be committed to the repo');
    return false;
  }
  
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
    console.log('✅ firebase.json is valid');
    return true;
  } catch (error) {
    console.error('❌ firebase.json is invalid:', error.message);
    return false;
  }
}

// Génération des variables d'environnement pour Firebase Functions
function generateEnvFile() {
  const envContent = `# Generated environment variables for ${environment}
ENVIRONMENT=${environment}
PROJECT_ID=${config.projectId}
API_URL=${config.apiUrl}
DEBUG=${config.features.debug}
ANALYTICS_ENABLED=${config.features.analytics}
MONITORING_LEVEL=${config.features.monitoring}
GENERATED_AT=${new Date().toISOString()}
`;

  fs.writeFileSync('.env.firebase', envContent);
  console.log('✅ Generated .env.firebase');
}

// Exécution principale
async function main() {
  try {
    console.log(`🚀 TaxasGE Firebase Setup - Environment: ${environment}`);
    console.log(`📍 Project ID: ${config.projectId}`);
    console.log(`🌐 URL: ${config.url}`);
    
    // Validation et génération des fichiers
    validateFirebaseJson();
    generateFirebaseRc();
    generateIndexHtml();
    generateEnvFile();
    
    console.log('');
    console.log('✅ Firebase configuration setup completed successfully!');
    console.log('');
    console.log('📋 Generated files:');
    console.log('  - .firebaserc (project selection)');
    console.log('  - public/index.html (hosting page)');
    console.log('  - .env.firebase (environment variables)');
    console.log('');
    console.log(`🚀 Ready to deploy to: ${config.projectId}`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Exécution si appelé directement
if (require.main === module) {
  main();
}

module.exports = { main, generateIndexHtml, generateFirebaseRc };
