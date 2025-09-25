# 🔐 Guide Création App Password Gmail - TaxasGE

**Auteur :** Kouemou Sah Jean Emac
**Date :** 25 septembre 2025
**Criticité :** 🔴 CRITIQUE - Sécurité SMTP

---

## 🚨 **CONTEXTE CRITIQUE**

**Problème identifié :**
```bash
packages/backend/.env:70
SMTP_PASSWORD=Seigneur1  ← EXPOSÉ EN CLAIR (CRITIQUE)
```

**Impact sécurité :**
- ❌ Mot de passe principal Gmail exposé
- ❌ Risque de compromission compte entier
- ❌ Violation standards sécurité production

---

## 📋 **ÉTAPES OBLIGATOIRES**

### **1. Activation 2FA Gmail (Prérequis)**
```
1. Gmail → Cliquer photo profil → "Gérer votre compte Google"
2. Sécurité → Validation en deux étapes
3. SI PAS ACTIVÉ → Activer maintenant (OBLIGATOIRE)
```

### **2. Génération App Password**
```
1. Compte Google → Sécurité
2. Validation en deux étapes → Mots de passe d'application
3. Sélectionner app → "Mail"
4. Sélectionner appareil → "Autre (nom personnalisé)"
5. Saisir: "TaxasGE Backend Production"
6. Cliquer "GÉNÉRER"
```

### **3. Récupération Password Sécurisé**
```
RÉSULTAT: Password 16 caractères (ex: "abcd efgh ijkl mnop")
IMPORTANT: Copier IMMÉDIATEMENT (affiché une seule fois)
```

---

## ⚙️ **CONFIGURATION BACKEND**

### **Mise à jour .env**
```bash
# REMPLACER:
SMTP_PASSWORD=Seigneur1

# PAR:
SMTP_PASSWORD=votre_nouveau_app_password_16_chars
```

### **Test Fonctionnement**
```bash
cd packages/backend
python -c "
import smtplib
from email.mime.text import MIMEText

# Test connexion SMTP
server = smtplib.SMTP('smtp.gmail.com', 587)
server.starttls()
server.login('libressai@gmail.com', 'NOUVEAU_APP_PASSWORD')
print('✅ Connexion SMTP réussie')
server.quit()
"
```

---

## 🚀 **DÉPLOIEMENT FIREBASE FUNCTIONS**

### **Variables Environnement Production**
```bash
# Configuration Firebase Functions
firebase functions:config:set smtp.password="NOUVEAU_APP_PASSWORD"
firebase functions:config:set smtp.username="libressai@gmail.com"

# Vérification
firebase functions:config:get
```

### **Redéploiement Required**
```bash
firebase deploy --only functions
```

---

## ✅ **VALIDATION SÉCURITÉ**

### **Checklist Post-Configuration**
- [ ] App Password généré et copié
- [ ] .env backend mis à jour
- [ ] Test connexion SMTP réussi
- [ ] Firebase Functions config mise à jour
- [ ] Functions redéployées
- [ ] Ancien password révoqué (optionnel)

### **Test Email Production**
```bash
# Via backend API
curl -X POST http://localhost:8080/api/v1/test/email \
  -H "Content-Type: application/json" \
  -d '{"to": "votre-email@test.com", "subject": "Test TaxasGE"}'
```

---

## ⚠️ **SÉCURITÉ CRITIQUE**

### **À FAIRE IMMÉDIATEMENT**
1. ✅ Créer App Password Gmail
2. ✅ Remplacer dans .env
3. ✅ Tester localement
4. ✅ Déployer Firebase Functions
5. ✅ Valider emails production

### **NE JAMAIS**
- ❌ Partager l'App Password
- ❌ Commit .env avec password
- ❌ Utiliser password principal Gmail
- ❌ Réutiliser sur autres services

---

**Ce guide doit être suivi IMMÉDIATEMENT pour sécuriser l'infrastructure email TaxasGE.**

---

*Guide généré pour résolution critique sécurité SMTP*