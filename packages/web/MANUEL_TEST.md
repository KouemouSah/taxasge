# Guide de Tests Manuels - Module Auth Frontend

## Prérequis

1. Backend staging fonctionnel: `https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app`
2. Node.js >= 18.0.0
3. npm >= 8.0.0

## Installation

```bash
cd packages/web
npm install
npm run dev
```

Ouvrir: `http://localhost:3000/auth`

---

## Test 1: Login avec compte existant

### Étapes

1. Ouvrir `http://localhost:3000/auth`
2. Vérifier que l'onglet **"Connexion"** est actif
3. Remplir le formulaire:
   - **Email**: `finaltest@example.com`
   - **Mot de passe**: `MySecureP@ss_9XY`
   - **Se souvenir de moi**: Cocher (optionnel)
4. Cliquer sur **"Se connecter"**

### Résultat attendu

- ✅ Toast vert apparaît: **"Connexion réussie - Bienvenue [prénom]"**
- ✅ Redirection vers `/dashboard` après 500ms
- ✅ Tokens stockés dans `localStorage`:
  - Ouvrir DevTools → Application → Local Storage → `http://localhost:3000`
  - Vérifier clés:
    - `taxasge_access_token`: JWT (commence par `eyJ...`)
    - `taxasge_refresh_token`: JWT
    - `taxasge_user`: JSON user object

### Échec attendu

Si email/password incorrect:
- ❌ Toast rouge: **"Erreur de connexion - Email ou mot de passe invalide"**
- ❌ Pas de redirect
- ❌ Pas de tokens

---

## Test 2: Register nouveau compte

### Étapes

1. Ouvrir `http://localhost:3000/auth`
2. Cliquer sur l'onglet **"Inscription"**
3. Remplir le formulaire:
   - **Prénom**: `Test`
   - **Nom**: `User`
   - **Email**: `test-[timestamp]@example.com` (utiliser timestamp unique)
   - **Téléphone**: `+240222999888`
   - **Mot de passe**: `SecureTest@123`
   - **Type de compte**: Sélectionner **"Citoyen"**
4. Cliquer sur **"Créer un compte"**

### Résultat attendu

- ✅ Toast vert: **"Compte créé avec succès - Bienvenue Test User"**
- ✅ Redirection vers `/dashboard` après 500ms
- ✅ Tokens stockés dans localStorage
- ✅ User object contient:
  ```json
  {
    "id": "uuid",
    "email": "test-xxx@example.com",
    "first_name": "Test",
    "last_name": "User",
    "phone": "+240222999888",
    "role": "citizen",
    "is_active": true
  }
  ```

### Échec attendu

Si email déjà existant:
- ❌ Toast rouge: **"Erreur d'inscription - Email already registered"**

---

## Test 3: Validation Password Faible

### Étapes

1. Onglet **"Inscription"**
2. Remplir avec password simple: `password`
3. Cliquer **"Créer un compte"**

### Résultat attendu

Erreurs sous le champ "Mot de passe":
- ❌ "Au moins 1 majuscule requise"
- ❌ "Au moins 1 chiffre requis"
- ❌ "Au moins 1 caractère spécial requis"

**Aucun appel API** ne doit être fait (validation Zod client-side).

---

## Test 4: Validation Phone Format Invalide

### Étapes

1. Onglet **"Inscription"**
2. Téléphone: `0612345678` (sans `+`)
3. Cliquer **"Créer un compte"**

### Résultat attendu

- ❌ Erreur sous champ "Téléphone": **"Format E.164 requis: +33..., +221..., +240..."**

### Exemples valides

- ✅ `+240222123456` (Guinée Équatoriale)
- ✅ `+33612345678` (France)
- ✅ `+221771234567` (Sénégal)

---

## Test 5: Validation Email Invalide

### Étapes

1. Email: `invalidemail` (sans @)
2. Cliquer sur champ suivant (blur event)

### Résultat attendu

- ❌ Erreur sous champ "Email": **"Email invalide"**

---

## Test 6: Remember Me Checkbox

### Étapes

1. Onglet **"Connexion"**
2. Cocher **"Se souvenir de moi"**
3. Se connecter

### Résultat attendu

- ✅ Payload API contient `"remember_me": true`
- ✅ Backend peut utiliser cette info pour token expiration plus longue

**Note**: Actuellement le backend ignore ce champ (fonctionnalité future).

---

## Test 7: Type de Compte (Role)

### Étapes

1. Onglet **"Inscription"**
2. **Type de compte**: Sélectionner **"Entreprise"**
3. Créer compte

### Résultat attendu

- ✅ User object contient `"role": "business"`

### Vérification backend

```bash
# Vérifier dans backend DB que role = "business"
curl https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/api/v1/auth/me \
  -H "Authorization: Bearer [access_token]"
```

---

## Test 8: Responsive Mobile

### Étapes

1. DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
2. Sélectionner "iPhone 12 Pro"
3. Tester login/register

### Résultat attendu

- ✅ Layout adapté mobile
- ✅ Formulaire full-width
- ✅ Boutons tactiles (min 44px height)
- ✅ Pas de scroll horizontal

---

## Test 9: Toast Notifications

### Étapes

1. Déclencher erreur volontaire (mauvais password)
2. Observer toast rouge
3. Attendre 5 secondes

### Résultat attendu

- ✅ Toast apparaît en haut à droite (desktop) ou centré (mobile)
- ✅ Toast disparaît automatiquement après 5s
- ✅ Bouton [×] ferme immédiatement

---

## Test 10: Navigation Tabs

### Étapes

1. Onglet **"Connexion"** → remplir email
2. Cliquer onglet **"Inscription"**
3. Revenir à **"Connexion"**

### Résultat attendu

- ✅ Email saisi conservé (state local maintenu)
- ✅ Transition smooth entre tabs
- ✅ Tab active visuellement distincte (background blanc)

---

## Test 11: Mot de passe oublié

### Étapes

1. Onglet **"Connexion"**
2. Cliquer **"Mot de passe oublié ?"**

### Résultat attendu

- ✅ Toast info: **"Fonctionnalité à venir - La réinitialisation du mot de passe sera bientôt disponible"**
- ❌ Pas de navigation (lien href="#")

**Note**: Fonctionnalité à implémenter.

---

## Test 12: Erreur Réseau (Simulation)

### Étapes

1. Déconnecter WiFi / Ethernet
2. Tenter login

### Résultat attendu

- ❌ Toast rouge: **"Erreur réseau - Impossible de contacter le serveur"**
- ❌ Console log erreur axios timeout

---

## Test 13: TypeScript Type Check

### Étapes

```bash
npm run type-check
```

### Résultat attendu

```
✓ No TypeScript errors found
```

---

## Test 14: Build Production

### Étapes

```bash
npm run build
```

### Résultat attendu

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    ...      ...
├ ○ /auth                                ...      ...
└ ○ /dashboard                           ...      ...
```

**Aucune erreur de build**.

---

## Test 15: Vérification localStorage

### Étapes

1. Se connecter avec succès
2. DevTools → Application → Local Storage
3. Inspecter clés

### Résultat attendu

```
taxasge_access_token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX2lkIiwiZXhwIjoxNzMwNDkwMDAwfQ...

taxasge_refresh_token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX2lkIiwidHlwZSI6InJlZnJlc2gifQ...

taxasge_user:
{"id":"...","email":"finaltest@example.com","role":"citizen","first_name":"Final","last_name":"Test",...}
```

---

## Checklist Complète

### Fonctionnel

- [ ] Test 1: Login compte existant ✅
- [ ] Test 2: Register nouveau compte ✅
- [ ] Test 3: Validation password faible ✅
- [ ] Test 4: Validation phone invalide ✅
- [ ] Test 5: Validation email invalide ✅
- [ ] Test 6: Remember me checkbox ✅
- [ ] Test 7: Type de compte (role) ✅
- [ ] Test 8: Responsive mobile ✅
- [ ] Test 9: Toast notifications ✅
- [ ] Test 10: Navigation tabs ✅
- [ ] Test 11: Mot de passe oublié (placeholder) ✅
- [ ] Test 12: Erreur réseau ✅

### Technique

- [ ] Test 13: TypeScript type check ✅
- [ ] Test 14: Build production ✅
- [ ] Test 15: localStorage tokens ✅

---

## Bugs Connus

Aucun bug connu à ce stade.

## Limitations Actuelles

1. **Refresh token**: Non implémenté (backend endpoint manquant)
2. **Logout**: Non implémenté (backend endpoint manquant)
3. **Forgot password**: Placeholder seulement
4. **Email verification**: Non implémenté
5. **2FA**: Non implémenté
6. **Social login**: Non implémenté

---

## Support

**Backend staging down?**
- Vérifier: `curl https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/health`
- Contact: Backend team

**Frontend bug?**
- Vérifier console DevTools (F12)
- Vérifier network tab (requêtes API)
- Contact: kouemou.sah@gmail.com

**Documentation**:
- `packages/web/src/app/auth/README.md`
- `packages/web/IMPLEMENTATION_REPORT.md`
