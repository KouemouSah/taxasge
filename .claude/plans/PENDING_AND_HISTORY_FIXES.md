# Plan de Correction - Pendientes & Historial

## Objectif
1. **Pendientes** : Afficher la photo directement dans l'espace réservé (pas juste une icône)
2. **Historial** : Filtrer par assignation agent (même logique que vérification)

---

## Phase 1 : Correction Affichage Photo (Pendientes)

### 1.1 Frontend - DocumentsSection.tsx
- [x] Modifier le composant pour afficher les images réelles (thumbnails)
- [x] Garder l'icône FileText pour les non-images (PDF, etc.)
- [x] Ajouter preview au clic dans un dialog (comme vérification)

### 1.2 Frontend - RequestPreview.tsx (si nécessaire)
- [x] Vérifier que fileUrl et mimeType sont disponibles
- [x] S'assurer que les données sont transmises correctement

### 1.3 Backend - Vérifier l'API
- [x] Confirmer que l'endpoint renvoie fileUrl et mimeType pour les documents

---

## Phase 2 : Correction Contrôle d'Accès (Historial)

### 2.1 Backend - API History
- [x] Identifier l'endpoint utilisé (`listRequestsWithHistory`) → `/agent/service-requests/history`
- [x] Ajouter vérification `service_request.view_all` (superviseur) → `check_user_has_view_all_permission()`
- [x] Filtrer par `assigned_to` pour les agents normaux → Modifié `get_history_list_for_entity()`
- [ ] Tester avec différents utilisateurs (en staging)

### 2.2 Frontend - history/page.tsx
- [x] Passer le token utilisateur à l'API (déjà fait via interceptor)
- [x] Aucune modification si l'API gère le filtrage → Confirmé

---

## Phase 3 : Tests & Validation

### 3.1 Tests Pendientes
- [ ] Photo s'affiche en miniature dans la liste des documents
- [ ] Clic sur photo ouvre le dialog avec image en grand
- [ ] PDF affiche toujours icône + bouton "Ouvrir"
- [ ] Documents sans URL affichent icône par défaut

### 3.2 Tests Historial
- [ ] Agent voit uniquement ses demandes assignées
- [ ] Superviseur voit toutes les demandes de l'entité
- [ ] Timeline affiche l'historique complet de la demande

---

## Phase 4 : Déploiement

- [ ] Commit des modifications
- [ ] Push vers develop
- [ ] Vérifier GitHub Actions (CI + Deploy)
- [ ] Test en staging

---

## Fichiers à Modifier

| Fichier | Modification |
|---------|-------------|
| `packages/web/src/modules/agent-dashboard/components/pending/sections/DocumentsSection.tsx` | Affichage thumbnails photos |
| `packages/backend/app/modules/service_requests/api/service_requests_routes.py` | Filtrage accès historial |

