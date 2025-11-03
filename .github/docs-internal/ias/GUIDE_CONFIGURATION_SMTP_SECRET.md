# Guide Rapide - Configuration Secret SMTP

**Date**: 2025-11-03
**Problème**: Email de vérification échoue
**Cause**: Secret `smtp-password` manquant dans Google Cloud Secret Manager

---

## 🔴 Erreur Actuelle

**Message utilisateur** :
```
Erreur lors de l'envoi de l'email de vérification
Impossible d'envoyer l'email de vérification
Vérifiez que votre adresse email est valide et accessible
```

**Logs backend** (attendu):
```
❌ SMTP_PASSWORD not configured (emails will fail)
```

---

## ✅ Solution: Ajouter Secret dans Google Cloud Secret Manager

### Option 1: Via Console Google Cloud (Recommandé)

1. **Ouvrir Secret Manager**:
   ```
   https://console.cloud.google.com/security/secret-manager?project=taxasge-dev
   ```

2. **Créer nouveau secret**:
   - Cliquer sur **"CREATE SECRET"**
   - **Name**: `smtp-password` (EXACT - lowercase avec tiret)
   - **Secret value**: Votre mot de passe Gmail

3. **Mot de passe Gmail à utiliser**:

   **IMPORTANT**: Vous avez dit utiliser le mot de passe Gmail standard, PAS App Password.

   Donc entrez simplement: **Le mot de passe de `libressai@gmail.com`**

4. **Vérifier permissions**:
   - Le service account Cloud Run doit avoir role `Secret Manager Secret Accessor`
   - Normalement déjà configuré dans le projet

5. **Cliquer CREATE SECRET**

---

### Option 2: Via gcloud CLI

```bash
# 1. Authentification
gcloud auth login
gcloud config set project taxasge-dev

# 2. Créer le secret (remplacer YOUR_GMAIL_PASSWORD)
echo -n "YOUR_GMAIL_PASSWORD" | \
  gcloud secrets create smtp-password \
  --data-file=- \
  --replication-policy="automatic"

# 3. Vérifier création
gcloud secrets list --filter="name:smtp-password"

# 4. Donner accès au service account (si nécessaire)
gcloud secrets add-iam-policy-binding smtp-password \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🔍 Vérification Post-Configuration

### 1. Vérifier Secret Existe

**Via Console**:
https://console.cloud.google.com/security/secret-manager?project=taxasge-dev

**Via CLI**:
```bash
gcloud secrets versions access latest --secret="smtp-password" --project=taxasge-dev
```

### 2. Redéployer Backend (Automatique)

GitHub Actions déploie automatiquement après chaque push. Le nouveau déploiement chargera le secret.

**Attendu**: ~10 minutes après le push du commit `dfd6a4e`

### 3. Vérifier Logs Backend

**Via Console**:
https://console.cloud.google.com/run/detail/us-central1/taxasge-backend-staging/logs?project=taxasge-dev

**Chercher**:
```
✅ SMTP password loaded from Secret Manager
```

**Si vous voyez**:
```
❌ SMTP_PASSWORD not configured (emails will fail)
```
→ Le secret n'est pas chargé correctement

---

## 🧪 Test Post-Configuration

### Test Inscription Citoyen

```bash
curl -X POST https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre-email-reel@gmail.com",
    "password": "TestPass123!",
    "first_name": "Test",
    "last_name": "Citoyen",
    "phone": "222123456",
    "role": "citizen"
  }'
```

**Résultat Attendu**:
- ✅ HTTP 201 Created
- ✅ Email reçu de `libressai@gmail.com`
- ✅ Sujet: "Vérifiez votre adresse email - TaxasGE"
- ✅ Code 6 chiffres dans le corps

**Si Échec**:
1. Vérifier secret existe: `gcloud secrets list --filter="name:smtp-password"`
2. Vérifier logs backend pour message SMTP
3. Vérifier mot de passe Gmail correct

---

### Test Inscription Entreprise (APRÈS fix dfd6a4e)

```bash
curl -X POST https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "business@example.com",
    "password": "TestPass123!",
    "first_name": "Carlos",
    "last_name": "Garcia",
    "phone": "222456789",
    "role": "business",
    "business_name": "Test Company SL",
    "business_type": "corporation"
  }'
```

**Résultat Attendu**:
- ✅ HTTP 201 Created (plus d'erreur BusinessProfile!)
- ✅ Email reçu
- ✅ User créé avec business_name="Test Company SL"

---

## 📊 Checklist Complète

- [ ] Créer secret `smtp-password` dans Secret Manager
- [ ] Vérifier secret existe (via console ou gcloud)
- [ ] Attendre redéploiement backend (~10 min)
- [ ] Vérifier logs backend: "✅ SMTP password loaded"
- [ ] Tester inscription citoyen (email envoyé)
- [ ] Tester inscription business (validation corrigée)

---

## 🔗 Ressources

**Secret Manager Console**:
https://console.cloud.google.com/security/secret-manager?project=taxasge-dev

**Backend Logs**:
https://console.cloud.google.com/run/detail/us-central1/taxasge-backend-staging/logs?project=taxasge-dev

**Documentation Complète**:
- `packages/backend/SMTP_CONFIGURATION.md`
- `.github/docs-internal/ias/RAPPORT_CONFIGURATION_EMAILS.md`

---

## ⚠️ Note Importante

Le commit `dfd6a4e` a corrigé la validation BusinessProfile. Après ce déploiement:

**AVANT**: Business registration échouait avec:
```
business_name: Input should be a valid string [input_value=None]
```

**APRÈS**: Validation correcte avec `@root_validator`

L'erreur SMTP est **INDÉPENDANTE** et nécessite votre action manuelle pour ajouter le secret.

---

**Créé**: 2025-11-03
**Auteur**: IAS
**Status**: ⏳ En attente action utilisateur (créer secret SMTP)
