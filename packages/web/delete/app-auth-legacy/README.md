# Module d'Authentification TaxasGE

## Vue d'ensemble

Module d'authentification Next.js 14 avec intégration complète au backend FastAPI staging. Implémente les fonctionnalités de login et register conformément aux contrats API définis dans `TASK-AUTH-FIX-003`.

## Architecture

### Structure des fichiers

```
packages/web/
├── src/
│   ├── app/
│   │   └── auth/
│   │       ├── page.tsx           # Page auth unifiée (Login + Register tabs)
│   │       ├── login/page.tsx     # Page login standalone (legacy)
│   │       └── register/page.tsx  # Page register standalone (legacy)
│   ├── components/ui/             # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── card.tsx
│   │   ├── tabs.tsx
│   │   ├── select.tsx
│   │   ├── checkbox.tsx
│   │   ├── toast.tsx
│   │   └── toaster.tsx
│   └── hooks/
│       └── use-toast.ts           # Hook toast notifications
├── lib/
│   ├── api/
│   │   └── authApi.ts             # Client API auth (login, register)
│   ├── auth/
│   │   └── storage.ts             # Gestion tokens JWT localStorage
│   ├── validations/
│   │   └── auth.ts                # Schemas Zod (loginSchema, registerSchema)
│   └── utils.ts                   # Utilitaires (cn)
```

## Endpoints API Backend

**Base URL**: `https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/api/v1`

### POST /auth/login

**Request**:
```json
{
  "email": "user@example.com",
  "password": "MyPassword123!",
  "remember_me": false  // optionnel
}
```

**Response 200**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "citizen",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+240222123456",
    "is_active": true,
    "created_at": "2025-11-01T00:00:00Z"
  }
}
```

**Errors**:
- `401 Unauthorized`: Email ou mot de passe invalide
- `400 Bad Request`: Validation error

### POST /auth/register

**Request**:
```json
{
  "email": "newuser@example.com",
  "password": "MySecureP@ss123",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+240222987654",
  "role": "citizen"  // ou "business"
}
```

**Response 201**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "newuser@example.com",
    "role": "citizen",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "+240222987654",
    "is_active": true,
    "created_at": "2025-11-01T00:00:00Z"
  }
}
```

**Errors**:
- `400 Bad Request`: Email déjà existant, validation error
- `422 Unprocessable Entity`: Format phone invalide

## Validation Frontend (Zod)

### Login Schema

```typescript
{
  email: string (email format)
  password: string (min 6 caractères)
  remember_me?: boolean
}
```

### Register Schema

```typescript
{
  email: string (email format)
  password: string (min 8 chars, 1 majuscule, 1 chiffre, 1 spécial)
  first_name: string (min 2 chars, max 50)
  last_name: string (min 2 chars, max 50)
  phone: string (E.164 format: +240..., +33..., +221...)
  role: "citizen" | "business" (default: "citizen")
}
```

## Gestion des Tokens

Les tokens JWT sont stockés dans `localStorage`:

```typescript
// Après login/register réussi
setAuthData(access_token, refresh_token, user)

// Vérifier si authentifié
isAuthenticated() // true/false

// Récupérer token
getAccessToken() // string | null

// Logout
clearAuth()
```

## Flow Utilisateur

### Login
1. Utilisateur saisit email + password
2. Validation Zod côté client
3. POST /auth/login vers backend staging
4. Stockage tokens + user data
5. Toast succès
6. Redirect → `/dashboard`

### Register
1. Utilisateur saisit formulaire complet
2. Validation Zod (password strength, phone E.164)
3. POST /auth/register vers backend staging
4. Stockage tokens + user data
5. Toast succès
6. Redirect → `/dashboard`

## Comptes de Test

**Compte 1**:
```
Email: finaltest@example.com
Password: MySecureP@ss_9XY
```

**Compte 2**:
```
Email: validation@example.com
Password: ValidPass2025_XY
```

## Variables d'Environnement

Fichier `.env.local`:

```bash
# Backend API (override par défaut vers staging)
NEXT_PUBLIC_API_URL=https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/api/v1
```

Si non défini, l'API client utilise automatiquement l'URL staging hardcodée.

## Développement Local

### Démarrer le serveur dev

```bash
cd packages/web
npm run dev
```

Accéder à: `http://localhost:3000/auth`

### Tester avec backend staging

1. Ouvrir `http://localhost:3000/auth`
2. Tester login avec compte existant
3. Tester register avec nouveau compte
4. Vérifier tokens dans DevTools → Application → LocalStorage
5. Vérifier redirect dashboard

## Design System

### shadcn/ui Components

- **Button**: Boutons primaires/secondaires
- **Input**: Champs texte/email/password/tel
- **Label**: Labels formulaires
- **Card**: Container principal
- **Tabs**: Onglets Login/Register
- **Select**: Dropdown role (citizen/business)
- **Checkbox**: Remember me
- **Toast**: Notifications succès/erreur

### Couleurs (CSS Variables)

Définies dans `src/app/globals.css`:

```css
--primary: 221.2 83.2% 53.3%  /* Bleu principal */
--destructive: 0 84.2% 60.2%  /* Rouge erreurs */
--muted: 210 40% 96.1%        /* Gris backgrounds */
```

## Gestion des Erreurs

### Erreurs Validation (Zod)

Affichées sous chaque champ concerné:

```tsx
{registerErrors.email && (
  <p className="text-sm text-destructive">{registerErrors.email}</p>
)}
```

### Erreurs API

Affichées via Toast notifications:

```tsx
toast({
  variant: "destructive",
  title: "Erreur de connexion",
  description: error.message
})
```

### Erreurs Réseau

```
"Erreur réseau - Impossible de contacter le serveur"
```

## Fonctionnalités Manquantes (Next Steps)

- [ ] Refresh token automatique
- [ ] Logout endpoint
- [ ] Mot de passe oublié (forgot password)
- [ ] Vérification email (email verification)
- [ ] 2FA (two-factor authentication)
- [ ] Social login (Google, Facebook)
- [ ] Rate limiting frontend
- [ ] Captcha anti-bot

## Sécurité

### Bonnes pratiques implémentées

- Validation stricte password (8 chars, majuscule, chiffre, spécial)
- Format phone E.164 obligatoire
- Tokens stockés localStorage (à migrer vers httpOnly cookies)
- HTTPS obligatoire en production
- Timeout API 10 secondes
- Messages d'erreur génériques (pas de leak email exists)

### Recommandations futures

- Migrer tokens vers httpOnly cookies (XSS protection)
- Implémenter CSP (Content Security Policy)
- Ajouter rate limiting backend
- Rotation tokens refresh
- Session management côté serveur

## Troubleshooting

### "Erreur réseau"

**Cause**: Backend staging down ou CORS issue
**Solution**: Vérifier backend staging accessible, vérifier CORS headers

### "Email invalide"

**Cause**: Format email incorrect
**Solution**: Vérifier regex email Zod schema

### "Format E.164 requis"

**Cause**: Phone sans `+` ou mauvais format
**Solution**: Utiliser `+240222123456` (Guinée Équatoriale)

### "Au moins 1 majuscule requise"

**Cause**: Password trop faible
**Solution**: Utiliser `MySecureP@ss123`

## Support

**Documentation Backend**: `.github/docs-internal/ias/03_PHASES/MODULE_01_AUTH/`
**API Docs**: `https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/docs`
**Contact**: kouemou.sah@gmail.com
