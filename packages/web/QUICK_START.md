# Quick Start - Module Auth Frontend

Guide rapide pour démarrer et tester le module d'authentification TaxasGE.

## Installation (5 minutes)

```bash
# 1. Naviguer vers le projet web
cd packages/web

# 2. Installer dépendances (si pas déjà fait)
npm install

# 3. Démarrer serveur dev
npm run dev
```

Ouvrir: `http://localhost:3000/auth`

## Test Rapide Login (2 minutes)

1. Page ouverte, onglet **"Connexion"** actif
2. Saisir:
   - **Email**: `finaltest@example.com`
   - **Password**: `MySecureP@ss_9XY`
3. Cliquer **"Se connecter"**
4. Observer:
   - Toast vert "Connexion réussie"
   - Redirect vers `/dashboard`
   - Tokens dans localStorage (F12 → Application)

## Test Rapide Register (3 minutes)

1. Cliquer onglet **"Inscription"**
2. Saisir:
   - **Prénom**: `Test`
   - **Nom**: `User`
   - **Email**: `test-123@example.com` (unique)
   - **Téléphone**: `+240222999888`
   - **Password**: `SecureTest@123`
   - **Type**: Citoyen
3. Cliquer **"Créer un compte"**
4. Observer:
   - Toast vert "Compte créé avec succès"
   - Redirect dashboard
   - Tokens stockés

## Vérification Backend

```bash
# Tester backend staging accessible
curl https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/health

# Output attendu: {"status": "healthy"}
```

## Fichiers Importants

- **Page principale**: `src/app/auth/page.tsx`
- **API client**: `lib/api/authApi.ts`
- **Validation**: `lib/validations/auth.ts`
- **Storage tokens**: `lib/auth/storage.ts`
- **Documentation**: `src/app/auth/README.md`

## Commandes Utiles

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build production
npm run build

# Tests (si configurés)
npm test
```

## Problèmes Courants

### "Erreur réseau"
**Cause**: Backend staging down ou CORS
**Solution**: Vérifier `curl https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/health`

### "Email invalide"
**Cause**: Format email incorrect
**Solution**: Utiliser format `user@example.com`

### "Format E.164 requis"
**Cause**: Phone sans `+` ou invalide
**Solution**: Utiliser `+240222123456`

### Imports @/* non résolus
**Cause**: Paths TypeScript
**Solution**: Vérifier `tsconfig.json` baseUrl et paths

## Support

- **Documentation complète**: `packages/web/src/app/auth/README.md`
- **Tests manuels**: `packages/web/MANUEL_TEST.md`
- **Rapport implémentation**: `packages/web/IMPLEMENTATION_REPORT.md`

## Backend Staging

- **URL**: https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/api/v1
- **Docs**: https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/docs
- **Health**: https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/health

## Comptes Test

```
Compte 1:
Email: finaltest@example.com
Password: MySecureP@ss_9XY

Compte 2:
Email: validation@example.com
Password: ValidPass2025_XY
```

## Next Steps

Après tests manuels réussis:

1. Implémenter refresh token
2. Implémenter logout
3. Ajouter tests unitaires Jest
4. Forgot password flow
5. Email verification

---

Generated: 2025-11-01
Module: MODULE_01_AUTH
Status: READY FOR TESTING
