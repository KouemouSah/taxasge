#  TaxasGE - Application Mobile et Web de Gestion Fiscale

##  Description
Application Mobile et Web de Gestion Fiscale pour la Guinée Équatoriale. Solution complète avec chatbot IA hors ligne, paiements sécurisés et base de données de 547 taxes structurées.

##  Architecture Monorepo

```
taxasge/
 packages/
    mobile/     # ?? React Native App (iOS/Android)
    backend/    # ?? FastAPI Python API + Firebase Functions
    web/        # ?? Next.js Dashboard Admin
 config/         # ?? Configuration externe (dev/prod)
 scripts/        # ?? Scripts automatisation DevOps
 data/           # ?? Données fiscales Guinée Équatoriale (547 taxes)
 docs/           # ?? Documentation technique
.github/        # ?? Workflows CI/CD GitHub Actions
```

##  Fonctionnalités Principales

###  **Application Mobile (React Native)**
- ** Chatbot IA hors ligne** : Assistant fiscal intelligent (TensorFlow Lite)
- ** Base de données locale** : 547 taxes de Guinée Équatoriale
- ** Multilingue** : Support ES/FR/EN
- ** Paiements sécurisés** : Intégration Bange
- ** Synchronisation** : Mode hors ligne avec sync automatique

###  **Backend API (FastAPI + Firebase)**
- ** API REST haute performance** : FastAPI avec validation Pydantic
- ** Base de données** : PostgreSQL + Supabase
- ** Authentification** : JWT + Firebase Auth
- ** Déploiement** : Firebase Functions auto-scaling
- ** Monitoring** : Logs structurés + métriques

###  **Dashboard Web (Next.js)**
- **Interface admin** : Gestion taxes et utilisateurs
- **Analytics** : Statistiques et rapports
- **Configuration** : Paramètres système
- **Multi-utilisateurs** : Rôles et permissions

##  Installation Rapide

###  **Prérequis**
- **Node.js** 18+ avec Yarn
- **Python** 3.11+ avec pip
- **Git** avec accès repository
- **VS Code** (recommandé)

###  **Installation Automatique**
```powershell
# Cloner le repository
git clone https://github.com/KouemouSah/taxasge.git
cd taxasge

# Installation des dépendances
yarn install

# Configuration de l'environnement
./scripts/setup-dev.sh

# Démarrage du développement
yarn dev
```

###  **Installation Manuelle**
```powershell
# Mobile React Native
cd packages/mobile
yarn install
yarn start

# Backend Python
cd packages/backend
pip install -r requirements.txt
python main.py

# Web Next.js
cd packages/web
yarn install
yarn dev
```

##  Scripts Disponibles

###  **Développement**
```powershell
yarn dev              # Démarrage mobile
yarn dev:mobile       # Démarrage mobile spécifique
yarn dev:backend      # Démarrage backend Python
yarn dev:web          # Démarrage dashboard web
```

###  **Build & Test**
```powershell
yarn build            # Build tous les packages
yarn test             # Tests complets
yarn test:all         # Tests mobile + backend
yarn lint             # Linting code
yarn format           # Formatage code
```

###  **Déploiement**
```powershell
yarn deploy           # Déploiement complet
yarn deploy:backend   # Déploiement Firebase Functions
yarn deploy:mobile    # Build APK/IPA
```

###  **Maintenance**
```powershell
yarn clean            # Nettoyer caches
yarn setup            # Reconfigurer environnement
yarn status           # Statut du projet
yarn info             # Informations workspaces
```

##  Technologies Utilisées

###  **Frontend Mobile**
- **React Native** 0.73.0 - Framework mobile cross-platform
- **TensorFlow Lite** - IA/ML pour chatbot hors ligne
- **Firebase SDK** - Auth, Analytics, Crashlytics
- **React Navigation** - Navigation native
- **React Native Vector Icons** - Icônes

###  **Backend API**
- **FastAPI** - Framework web moderne Python
- **Supabase** - Base données PostgreSQL as a Service
- **Firebase Functions** - Serverless computing
- **Pydantic** - Validation données
- **SQLAlchemy** - ORM Python

###  **Base de Données**
- **PostgreSQL** - Base données relationnelle
- **Supabase** - Backend as a Service
- **Row Level Security** - Sécurité fine
- **Real-time** - Synchronisation temps réel

###  **Infrastructure**
- **Firebase** - Hosting, Functions, Auth
- **GitHub Actions** - CI/CD automatisé
- **Vercel** - Déploiement web
- **VS Code** - Environnement développement

##  Données Fiscales Guinée Équatoriale

###  **Couverture Complète**
- **547 taxes** structurées et validées
- **8 ministères** avec secteurs détaillés
- **Procédures complètes** pour chaque taxe
- **Documents requis** spécifiés
- **Mots-clés multilingues** pour recherche

###  **Structure des Données**
```json
{
  "ministerios": "8 ministères gouvernementaux",
  "sectores": "Secteurs économiques par ministère", 
  "categorias": "Catégories de taxes par secteur",
  "taxes": "547 taxes avec détails complets",
  "documentos_requeridos": "Documents nécessaires",
  "procedimientos": "Étapes procédurales",
  "palabras_clave": "Mots-clés ES/FR/EN"
}
```

##  Intelligence Artificielle

###  **Chatbot Hors Ligne**
- **Modèle optimisé** : 0.41MB TensorFlow Lite
- **100% précision** : Entraîné sur 62k questions
- **Trilingue** : Espagnol, Français, Anglais
- **Réponses contextuelles** : Basées sur vraies données
- **Fonctionnement hors ligne** : Aucune connexion requise

###  **Corpus d'Entraînement**
- **62,000 questions** générées automatiquement
- **Scenarios réels** d'utilisation fiscale
- **Validation manuelle** des réponses critiques
- **Amélioration continue** basée usage

##  Sécurité

###  **Authentification**
- **Firebase Auth** - Authentification multi-facteurs
- **JWT Tokens** - Sécurisation API
- **Row Level Security** - Protection données Supabase
- **HTTPS Obligatoire** - Chiffrement transit

###  **Protection Données**
- **Variables d'environnement** sécurisées
- **Secrets GitHub** pour CI/CD
- **Chiffrement** données sensibles
- **Audit logs** complets

##  État du Projet

###  **Phase 1 - Infrastructure (COMPLÉTÉE)**
- [x] Configuration DevOps & CI/CD
- [x] Workflows GitHub Actions fonctionnels
- [x] Base données Supabase configurée
- [x] Firebase projets dev/prod créés
- [x] Structure monorepo établie

###  **Phase 2 - Développement Core (EN COURS)**
- [ ] Application mobile React Native
- [ ] Backend API FastAPI complet
- [ ] Intégration chatbot IA
- [ ] Tests automatisés complets

###  **Phase 3 - Finalisation (PLANIFIÉE)**
- [ ] Intégration paiements Bange
- [ ] Dashboard web admin
- [ ] Tests utilisateurs finaux
- [ ] Déploiement production

##  Métriques de Qualité

###  **Objectifs Techniques**
- **Code Coverage** : >80% (Backend + Mobile)
- **Performance** : <3s démarrage mobile
- **Disponibilité** : 99.5% uptime API
- **Tests** : 100% workflows CI/CD passants

###  **Monitoring Actuel**
-  **Backend CI** : Tests Python automatisés
-  **Status Dashboard** : Monitoring 24/7
-  **Deploy Backend** : En cours d'optimisation
-  **Mobile Distribution** : En cours d'optimisation

##  Équipe & Contribution

###  **Développement**
- **KOUEMOU SAH Jean Emac** - Lead Developer & Product Owner
- **Architecture** - Design système & infrastructure
- **IA/ML** - Développement chatbot intelligent

###  **Contribution**
1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push sur la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

##  Documentation

###  **Guides Disponibles**
- [**Installation**](docs/SETUP.md) - Guide installation détaillé
- [**API**](docs/API.md) - Documentation API complète
- [**Déploiement**](docs/DEPLOYMENT.md) - Guide déploiement production
- [**Architecture**](docs/architecture/) - Documentation technique

###  **Liens Utiles**
- **Repository** : [GitHub TaxasGE](https://github.com/KouemouSah/taxasge)
- **Issues** : [GitHub Issues](https://github.com/KouemouSah/taxasge/issues)
- **Releases** : [GitHub Releases](https://github.com/KouemouSah/taxasge/releases)

##  Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

##  Support

###  **Contact**
- **Email** : kouemou.sah@gmail.com
- **GitHub** : [@KouemouSah](https://github.com/KouemouSah)

###  **Signaler un Bug**
Utiliser les [GitHub Issues](https://github.com/KouemouSah/taxasge/issues) avec le template approprié.

###  **Demander une Fonctionnalité**
Créer une [Feature Request](https://github.com/KouemouSah/taxasge/issues/new?template=feature_request.md).

---

** Développé pour la Guinée Équatoriale **

*Simplifiant la gestion fiscale pour tous les citoyens et entreprises*

