#  TaxasGE - Application Mobile et Web de Gestion Fiscale

##  Description
Application Mobile et Web de Gestion Fiscale pour la Guin�e �quatoriale. Solution compl�te avec chatbot IA hors ligne, paiements s�curis�s et base de donn�es de 547 taxes structur�es.

##  Architecture Monorepo

```
taxasge/
 packages/
    mobile/     # ?? React Native App (iOS/Android)
    backend/    # ?? FastAPI Python API + Firebase Functions
    web/        # ?? Next.js Dashboard Admin
 config/         # ?? Configuration externe (dev/prod)
 scripts/        # ?? Scripts automatisation DevOps
 data/           # ?? Donn�es fiscales Guin�e �quatoriale (547 taxes)
 docs/           # ?? Documentation technique
.github/        # ?? Workflows CI/CD GitHub Actions
```

##  Fonctionnalit�s Principales

###  **Application Mobile (React Native)**
- ** Chatbot IA hors ligne** : Assistant fiscal intelligent (TensorFlow Lite)
- ** Base de donn�es locale** : 547 taxes de Guin�e �quatoriale
- ** Multilingue** : Support ES/FR/EN
- ** Paiements s�curis�s** : Int�gration Bange
- ** Synchronisation** : Mode hors ligne avec sync automatique

###  **Backend API (FastAPI + Firebase)**
- ** API REST haute performance** : FastAPI avec validation Pydantic
- ** Base de donn�es** : PostgreSQL + Supabase
- ** Authentification** : JWT + Firebase Auth
- ** D�ploiement** : Firebase Functions auto-scaling
- ** Monitoring** : Logs structur�s + m�triques

###  **Dashboard Web (Next.js)**
- **Interface admin** : Gestion taxes et utilisateurs
- **Analytics** : Statistiques et rapports
- **Configuration** : Param�tres syst�me
- **Multi-utilisateurs** : R�les et permissions

##  Installation Rapide

###  **Pr�requis**
- **Node.js** 18+ avec Yarn
- **Python** 3.11+ avec pip
- **Git** avec acc�s repository
- **VS Code** (recommand�)

###  **Installation Automatique**
```powershell
# Cloner le repository
git clone https://github.com/KouemouSah/taxasge.git
cd taxasge

# Installation des d�pendances
yarn install

# Configuration de l'environnement
./scripts/setup-dev.sh

# D�marrage du d�veloppement
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

###  **D�veloppement**
```powershell
yarn dev              # D�marrage mobile
yarn dev:mobile       # D�marrage mobile sp�cifique
yarn dev:backend      # D�marrage backend Python
yarn dev:web          # D�marrage dashboard web
```

###  **Build & Test**
```powershell
yarn build            # Build tous les packages
yarn test             # Tests complets
yarn test:all         # Tests mobile + backend
yarn lint             # Linting code
yarn format           # Formatage code
```

###  **D�ploiement**
```powershell
yarn deploy           # D�ploiement complet
yarn deploy:backend   # D�ploiement Firebase Functions
yarn deploy:mobile    # Build APK/IPA
```

###  **Maintenance**
```powershell
yarn clean            # Nettoyer caches
yarn setup            # Reconfigurer environnement
yarn status           # Statut du projet
yarn info             # Informations workspaces
```

##  Technologies Utilis�es

###  **Frontend Mobile**
- **React Native** 0.73.0 - Framework mobile cross-platform
- **TensorFlow Lite** - IA/ML pour chatbot hors ligne
- **Firebase SDK** - Auth, Analytics, Crashlytics
- **React Navigation** - Navigation native
- **React Native Vector Icons** - Ic�nes

###  **Backend API**
- **FastAPI** - Framework web moderne Python
- **Supabase** - Base donn�es PostgreSQL as a Service
- **Firebase Functions** - Serverless computing
- **Pydantic** - Validation donn�es
- **SQLAlchemy** - ORM Python

###  **Base de Donn�es**
- **PostgreSQL** - Base donn�es relationnelle
- **Supabase** - Backend as a Service
- **Row Level Security** - S�curit� fine
- **Real-time** - Synchronisation temps r�el

###  **Infrastructure**
- **Firebase** - Hosting, Functions, Auth
- **GitHub Actions** - CI/CD automatis�
- **Vercel** - D�ploiement web
- **VS Code** - Environnement d�veloppement

##  Donn�es Fiscales Guin�e �quatoriale

###  **Couverture Compl�te**
- **547 taxes** structur�es et valid�es
- **8 minist�res** avec secteurs d�taill�s
- **Proc�dures compl�tes** pour chaque taxe
- **Documents requis** sp�cifi�s
- **Mots-cl�s multilingues** pour recherche

###  **Structure des Donn�es**
```json
{
  "ministerios": "8 minist�res gouvernementaux",
  "sectores": "Secteurs �conomiques par minist�re", 
  "categorias": "Cat�gories de taxes par secteur",
  "taxes": "547 taxes avec d�tails complets",
  "documentos_requeridos": "Documents n�cessaires",
  "procedimientos": "�tapes proc�durales",
  "palabras_clave": "Mots-cl�s ES/FR/EN"
}
```

##  Intelligence Artificielle

###  **Chatbot Hors Ligne**
- **Mod�le optimis�** : 0.41MB TensorFlow Lite
- **100% pr�cision** : Entra�n� sur 62k questions
- **Trilingue** : Espagnol, Fran�ais, Anglais
- **R�ponses contextuelles** : Bas�es sur vraies donn�es
- **Fonctionnement hors ligne** : Aucune connexion requise

###  **Corpus d'Entra�nement**
- **62,000 questions** g�n�r�es automatiquement
- **Scenarios r�els** d'utilisation fiscale
- **Validation manuelle** des r�ponses critiques
- **Am�lioration continue** bas�e usage

##  S�curit�

###  **Authentification**
- **Firebase Auth** - Authentification multi-facteurs
- **JWT Tokens** - S�curisation API
- **Row Level Security** - Protection donn�es Supabase
- **HTTPS Obligatoire** - Chiffrement transit

###  **Protection Donn�es**
- **Variables d'environnement** s�curis�es
- **Secrets GitHub** pour CI/CD
- **Chiffrement** donn�es sensibles
- **Audit logs** complets

##  �tat du Projet

###  **Phase 1 - Infrastructure (COMPL�T�E)**
- [x] Configuration DevOps & CI/CD
- [x] Workflows GitHub Actions fonctionnels
- [x] Base donn�es Supabase configur�e
- [x] Firebase projets dev/prod cr��s
- [x] Structure monorepo �tablie

###  **Phase 2 - D�veloppement Core (EN COURS)**
- [ ] Application mobile React Native
- [ ] Backend API FastAPI complet
- [ ] Int�gration chatbot IA
- [ ] Tests automatis�s complets

###  **Phase 3 - Finalisation (PLANIFI�E)**
- [ ] Int�gration paiements Bange
- [ ] Dashboard web admin
- [ ] Tests utilisateurs finaux
- [ ] D�ploiement production

##  M�triques de Qualit�

###  **Objectifs Techniques**
- **Code Coverage** : >80% (Backend + Mobile)
- **Performance** : <3s d�marrage mobile
- **Disponibilit�** : 99.5% uptime API
- **Tests** : 100% workflows CI/CD passants

###  **Monitoring Actuel**
-  **Backend CI** : Tests Python automatis�s
-  **Status Dashboard** : Monitoring 24/7
-  **Deploy Backend** : En cours d'optimisation
-  **Mobile Distribution** : En cours d'optimisation

##  �quipe & Contribution

###  **D�veloppement**
- **KOUEMOU SAH Jean Emac** - Lead Developer & Product Owner
- **Architecture** - Design syst�me & infrastructure
- **IA/ML** - D�veloppement chatbot intelligent

###  **Contribution**
1. Fork le repository
2. Cr�er une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push sur la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

##  Documentation

###  **Guides Disponibles**
- [**Installation**](docs/SETUP.md) - Guide installation d�taill�
- [**API**](docs/API.md) - Documentation API compl�te
- [**D�ploiement**](docs/DEPLOYMENT.md) - Guide d�ploiement production
- [**Architecture**](docs/architecture/) - Documentation technique

###  **Liens Utiles**
- **Repository** : [GitHub TaxasGE](https://github.com/KouemouSah/taxasge)
- **Issues** : [GitHub Issues](https://github.com/KouemouSah/taxasge/issues)
- **Releases** : [GitHub Releases](https://github.com/KouemouSah/taxasge/releases)

##  Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de d�tails.

##  Support

###  **Contact**
- **Email** : kouemou.sah@gmail.com
- **GitHub** : [@KouemouSah](https://github.com/KouemouSah)

###  **Signaler un Bug**
Utiliser les [GitHub Issues](https://github.com/KouemouSah/taxasge/issues) avec le template appropri�.

###  **Demander une Fonctionnalit�**
Cr�er une [Feature Request](https://github.com/KouemouSah/taxasge/issues/new?template=feature_request.md).

---

** D�velopp� pour la Guin�e �quatoriale **

*Simplifiant la gestion fiscale pour tous les citoyens et entreprises*

