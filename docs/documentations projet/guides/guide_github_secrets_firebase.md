# 🔐 Guide Configuration GitHub Secrets Firebase - TaxasGE

**Auteur :** Kouemou Sah Jean Emac
**Date :** 25 septembre 2025
**Criticité :** 🔴 CRITIQUE - Déploiement CI/CD

---

## 🚨 **SECRETS GITHUB REQUIS (OPTIMISÉ)**

### **✅ OPTIMISATION APPLIQUÉE - TOKENS ÉLIMINÉS**
```bash
✅ À METTRE À JOUR:
   FIREBASE_SERVICE_ACCOUNT_TAXASGE_DEV (nouveau contenu)

✅ À CRÉER:
   FIREBASE_SERVICE_ACCOUNT_TAXASGE_PRO (nouveau)

❌ TOKENS SUPPRIMÉS (redondants):
   FIREBASE_TOKEN_DEV (inutile avec service accounts)
   FIREBASE_TOKEN_PRO (inutile avec service accounts)
   FIREBASE_TOKEN_STAGING (obsolète)
   FIREBASE_TOKEN_PRODUCTION (obsolète)
```

---

## 📋 **ÉTAPES OBLIGATOIRES**

### **1. ✅ TOKENS ÉLIMINÉS - PLUS NÉCESSAIRES**

#### **🎯 OPTIMISATION CRITIQUE**
```bash
AVANT: Service Accounts + Tokens (redondant)
APRÈS: Service Accounts uniquement (optimal)

AVANTAGES:
✅ Plus d'expiration de tokens
✅ Maintenance simplifiée
✅ Sécurité robuste permanente
✅ Moins de secrets à gérer
```

### **2. Configuration GitHub Secrets**

#### **Accès Repository Secrets**
```
1. GitHub → Repository TaxasGE
2. Settings → Secrets and variables → Actions
3. Repository secrets
```

#### **Service Accounts (JSON complets)**
```yaml
FIREBASE_SERVICE_ACCOUNT_TAXASGE_DEV:
  Contenu: ./config/taxasge-dev-firebase-adminsdk-fbsvc-7a590c8527.json
  Action: Remplacer existant

FIREBASE_SERVICE_ACCOUNT_TAXASGE_PRO:
  Contenu: ./config/taxasge-pro-firebase-adminsdk-fbsvc-2d3ac51ede.json
  Action: Créer nouveau
```

### **3. ✅ TOKENS ÉLIMINÉS - CONFIGURATION SIMPLIFIÉE**
```bash
SUPPRIMÉ - PLUS NÉCESSAIRE:
❌ FIREBASE_TOKEN_DEV (remplacé par service account)
❌ FIREBASE_TOKEN_PRO (remplacé par service account)
❌ FIREBASE_TOKEN_STAGING (obsolète)
❌ FIREBASE_TOKEN_PRODUCTION (obsolète)

RÉSULTAT: Seulement 2 secrets au lieu de 6 !
```

---

## ⚙️ **VALIDATION CONFIGURATION**

### **Test Workflows**
```bash
# Push pour déclencher workflows
git add .github/workflows/
git commit -m "🔧 Fix Firebase workflows coherence"
git push origin develop

# Vérifier GitHub Actions:
# - firebase-rules-deploy.yml ✅
# - deploy-backend.yml ✅
```

### **Vérification Déploiements (OPTIMISÉ)**
```bash
DÉVELOPPEMENT (branche develop):
✅ Utilise FIREBASE_SERVICE_ACCOUNT_TAXASGE_DEV uniquement
✅ Authentification firebase auth:ci-login --service-account
✅ Déploie sur taxasge-dev (permanente, pas d'expiration)

PRODUCTION (branche main):
✅ Utilise FIREBASE_SERVICE_ACCOUNT_TAXASGE_PRO uniquement
✅ Authentification firebase auth:ci-login --service-account
✅ Déploie sur taxasge-pro (permanente, pas d'expiration)
```

---

## 🚀 **WORKFLOWS CORRIGÉS**

### **firebase-rules-deploy.yml**
```yaml
CHANGEMENTS:
❌ taxasge-staging → ✅ taxasge-dev
❌ FIREBASE_TOKEN_STAGING → ✅ FIREBASE_TOKEN_DEV
❌ FIREBASE_TOKEN_PRODUCTION → ✅ FIREBASE_TOKEN_PRO
✅ taxasge-pro (déjà correct)
```

### **deploy-backend.yml**
```yaml
CHANGEMENTS:
✅ Multi-environnement service accounts
✅ Logique DEV/PRO selon branche
✅ firebase deploy --project spécifique
✅ Support FIREBASE_SERVICE_ACCOUNT_TAXASGE_PRO
```

---

## 🔒 **SÉCURITÉ CRITIQUE**

### **Checklist Validation**
- [ ] Service accounts JSON mis à jour
- [ ] Tokens Firebase générés pour dev/pro
- [ ] GitHub Secrets configurés correctement
- [ ] Secrets obsolètes supprimés
- [ ] Workflows testés sans erreurs
- [ ] Déploiement dev/prod fonctionnel

### **Standards Sécurité**
```bash
CRITICAL:
✅ Service accounts par environnement
✅ Tokens séparés dev/prod
✅ Pas de credentials hardcodés
✅ Environnements isolés
✅ Rollback possible par environnement
```

---

## ⚠️ **NEXT STEPS OBLIGATOIRES**

### **Actions Immédiates (30 min)**
1. ✅ Générer `firebase login:ci` pour dev/prod
2. ✅ Configurer 4 GitHub Secrets
3. ✅ Supprimer secrets obsolètes
4. ✅ Push workflows corrigés
5. ✅ Tester déploiement dev

### **Validation Production (1h)**
1. ✅ Test déploiement branche main → prod
2. ✅ Vérifier Firebase Functions opérationnelles
3. ✅ Confirmer isolation environnements
4. ✅ Documentation pipeline finalisée

---

**Cette configuration est CRITIQUE pour l'intégrité du pipeline CI/CD TaxasGE.**

---

*Guide généré pour cohérence infrastructure Firebase*