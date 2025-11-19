# Backend Deployment Required

## Problème identifié

Les pages suivantes du dashboard admin ne fonctionnent pas actuellement en production car **le module permissions n'est pas déployé sur le backend Cloud Run staging** :

- `/dashboard/admin/roles` - Erreur de chargement des rôles
- `/dashboard/admin/permissions` - Erreur de chargement des permissions
- `/dashboard/admin/users` - Affiche données mock (en attente API)
- `/dashboard/admin/assignments` - Affiche données mock (en attente API)
- `/dashboard/admin/audit-logs` - Affiche données mock (en attente API)

## Vérification effectuée

Test des endpoints API backend staging :
```bash
curl "https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/openapi.json" | grep "/api/v1/roles"
# Résultat : aucun endpoint /api/v1/roles trouvé
```

Les endpoints disponibles ne contiennent PAS :
- `/api/v1/roles`
- `/api/v1/permissions`
- `/api/v1/assignments` (module assignment)

Ces endpoints existent dans le code source local mais ne sont pas déployés.

## Solution requise

### 1. Déployer le backend avec les nouveaux modules

Le backend doit être redéployé pour inclure :
- Module `app/modules/permissions` (routes des rôles, permissions, user_permissions)
- Module `app/modules/assignment` (routes des assignments)

### 2. Vérifier l'enregistrement des routes dans `app/main.py`

Le code existe déjà (lignes 339-341) :
```python
app.include_router(permission_router, prefix="/api/v1", tags=["permissions"])
app.include_router(role_router, prefix="/api/v1", tags=["roles"])
app.include_router(user_permission_router, prefix="/api/v1", tags=["user-permissions"])
```

Mais ces routes ne sont pas présentes sur le backend déployé.

### 3. Déclencher un déploiement backend

**Option 1 - Forcer le déploiement via GitHub Actions** :
```bash
git commit --allow-empty -m "chore: trigger backend redeploy for permissions module"
git push origin develop
```

**Option 2 - Déploiement manuel** :
```bash
cd packages/backend
gcloud run deploy taxasge-backend-staging \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

## Pages créées avec données mock

En attendant le déploiement backend, les pages suivantes ont été créées avec des **données de test** :

### 1. `/dashboard/admin/users`
- Gestion des utilisateurs
- Filtrage par rôle
- Recherche par email/nom
- Statistiques (Total, Actifs, Inactifs, 2FA)

### 2. `/dashboard/admin/assignments`
- Liste des assignments de déclarations
- Filtrage par statut
- Statistiques (Total, En attente, En cours, Terminés)
- Badges de priorité et statut

### 3. `/dashboard/admin/audit-logs`
- Historique des actions système
- Filtrage par type d'action
- Recherche full-text
- Statistiques (Total, Aujourd'hui, Réussis, Échoués)

Toutes ces pages affichent un **banner bleu** indiquant qu'elles utilisent des données mock.

## Corrections appliquées au frontend

### API Client fix
Fichier : `packages/web/src/modules/permissions-admin/services/api.ts`

```typescript
// Avant (ne fonctionnait pas)
return client.get<Role[]>(`/roles${query ? `?${query}` : ""}`);

// Après (parse la réponse paginée)
const response = await client.get<{ items: Role[]; total: number }>(`/roles${query ? `?${query}` : ""}`);
return response.items || [];
```

Cette correction permet au frontend de parser correctement les réponses paginées de l'API, mais **l'API backend doit d'abord être déployée**.

## Checklist de déploiement

- [ ] Déployer le backend avec les modules permissions et assignment
- [ ] Vérifier que `/api/v1/roles` retourne des données
- [ ] Vérifier que `/api/v1/permissions` retourne des données
- [ ] Tester la connexion admin sur le frontend déployé
- [ ] Vérifier que les pages Rôles et Permissions se chargent correctement
- [ ] Implémenter les vraies API calls dans users, assignments, audit-logs

## État actuel (2025-11-19)

- ✅ Frontend : Toutes les pages créées et fonctionnelles (avec mock data)
- ✅ Base de données : 64 permissions créées, rôle admin configuré avec 47 permissions
- ❌ Backend API : Module permissions NON déployé sur Cloud Run staging
- ❌ Intégration : Pages rôles/permissions/users/assignments/audit-logs en attente du backend

## Contact

Pour toute question sur le déploiement, contacter l'équipe DevOps ou vérifier les workflows GitHub Actions dans `.github/workflows/`.
