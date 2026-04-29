# PHASE 6 — Support tickets + Appointments + Settings (DETAILED PLAN)

**Date** : 2026-04-27
**Phase parent** : `MOBILE_USER_MIGRATION_MASTER_PLAN.md`
**Durée estimée** : 4-5 jours
**Bloquant pour suite** : Non
**Pré-requis** : P0..P5.7 ✅
**Audit source** : agent Explore exécuté 2026-04-27 — backend support/2FA/sessions complets, gaps backend sur account-delete + notif-prefs + RGPD export.

---

## 1. CONTEXTE

L'audit backend révèle que **le module support est 100% prêt côté API** (15 endpoints), idem 2FA + sessions + change-password. Les 3 écrans mobile support sont des **stubs** non connectés. Les écrans `notifications/biometric/account/delete` n'existent pas. Pour appointments post-création, ni backend dédié ni mobile.

### 1.1 État backend (vérifié)

| Domaine | Endpoints | Statut |
|---------|-----------|--------|
| **Support** (`support_routes.py`) | 15 routes : categories CRUD + tickets list/my/detail/create/update/close + messages list/post + stats | ✅ Tous prêts |
| **Sessions** (`auth_routes.py:/auth/sessions`) | GET sessions list + POST logout(all_sessions) | ✅ Prêt |
| **2FA** (`two_factor_routes.py`) | enable/verify/disable/status (4 routes) | ✅ Prêt |
| **Change password** (`user_routes.py:/users/profile/change-password`) | POST avec validation + EventBus notif | ✅ Prêt |
| **Appointments wizard** (`appointment_routes.py`) | locations, slots, available-days, hold (POST/GET/DELETE), confirm, submit-without | ✅ Prêt mais wizard-scoped |
| **Appointments user-list** | ❌ Pas d'endpoint dédié `/users/appointments/my` | ❌ Gap backend |
| **Appointment cancel/reschedule post-creation** | ❌ Pas d'endpoint clair | ❌ Gap backend |
| **Account delete** | ❌ Pas d'endpoint `DELETE /users/profile` | ❌ Gap backend |
| **Notifications preferences** | ❌ Pas d'endpoint `GET/PUT /users/notifications/preferences` | ❌ Gap backend |
| **RGPD data export** | ❌ Pas d'endpoint `GET /users/profile/export` | ❌ Gap backend |

### 1.2 État mobile (vérifié)

| Écran / module | Statut |
|----------------|--------|
| `app/support/index.tsx` | ⚠️ Stub UI sans hook |
| `app/support/new.tsx` | ⚠️ Stub UI sans hook (catégories hardcodées) |
| `app/support/[id].tsx` | ⚠️ Stub UI sans hook |
| `modules/support/` | ❌ Inexistant |
| `app/(tabs)/appointments/*` | ❌ Inexistant (wizard appointments existe à part) |
| `modules/appointments/` | ❌ Inexistant |
| `app/settings/change-password.tsx` | ✅ Complet |
| `app/settings/sessions.tsx` | ✅ Complet |
| `app/settings/two-factor.tsx` | ✅ Complet |
| `app/settings/notifications.tsx` | ❌ Inexistant |
| `app/settings/biometric.tsx` | ❌ Inexistant |
| `app/settings/account/delete.tsx` | ❌ Inexistant |

### 1.3 Décisions architecturales

Vu les gaps backend, **scope V1 ajusté** :

| Sous-domaine | Approche V1 |
|--------------|-------------|
| **Support tickets** | Implémenté complet (backend prêt) — module + 3 écrans connectés |
| **Appointments user-list** | Reporté à P6.5 ou P7 — backend manque. V1 = lien depuis `requests/[id]` vers les endpoints existants `/service-requests/{id}/appointments/*` pour cancel + détail |
| **Settings notifications preferences** | Backend à créer **dans P6** (endpoint petit, isolable) → mobile écran |
| **Settings biometric** | OS-level uniquement, pas d'API backend → toggle local + AuthContext |
| **Settings account delete** | Backend à créer **dans P6** (endpoint avec confirmation) → mobile écran |
| **Settings RGPD data export** | Reporté à P6.5 ou P9 (job async backend complexe). V1 = bouton "Demander mon export" qui ouvre un email pré-rempli ou un ticket support |

### 1.4 Pièges identifiés

| # | Piège | Mitigation |
|---|-------|------------|
| **P1** | Backend support `SupportMessageCreate` ne mentionne pas attachments multipart — vérifier le contrat exact avant impl mobile | Lire `support_routes.py` POST messages : si pas multipart, V1 = messages texte only, attachments = V1.1 |
| **P2** | `appointment_reservations.status` enum = pending/confirmed/cancelled — déjà exposé via `holdStatus` côté wizard. Pour post-creation, le statut vit dans `service_requests.appointment_data` JSON | Pour V1, lire l'appointment courant via `GET /service-requests/{id}/detail-view` (déjà câblé), pas besoin d'endpoint dédié |
| **P3** | Account delete = action irréversible — RGPD demande confirmation 2-step + grace period | UI : input du mot de passe + checkbox "j'ai compris" + bouton red. Backend peut faire soft-delete (`deleted_at`) avec purge cron 30j |
| **P4** | Notification preferences nécessite une table BD si elle n'existe pas | Vérifier `users.notification_preferences` JSONB ou table dédiée. Si absent, créer migration légère dans P6 |
| **P5** | 2FA setup mobile existe — ne pas régresser | Modifs settings P6 = additives uniquement |

---

## 2. ARCHITECTURE DES CHANGEMENTS

### 2.1 Layout

```
packages/mobile/
└── src/
    ├── modules/
    │   └── support/                            # NEW
    │       ├── components/
    │       │   ├── ticket-list-item.tsx
    │       │   ├── ticket-status-badge.tsx
    │       │   ├── ticket-priority-badge.tsx
    │       │   └── message-bubble.tsx
    │       ├── services/
    │       │   ├── support-api.ts
    │       │   └── support-hooks.ts
    │       ├── types/
    │       │   └── support.types.ts
    │       └── index.ts
    └── app/
        ├── support/                            # MODIFIED — connecter aux hooks
        │   ├── index.tsx                       # Liste mes tickets (FlatList paginée)
        │   ├── new.tsx                         # Création (catégories chargées)
        │   └── [id].tsx                        # Thread messages + close
        └── settings/
            ├── notifications.tsx               # NEW
            ├── biometric.tsx                   # NEW (OS-level)
            └── account/
                └── delete.tsx                  # NEW

packages/backend/                               # MINIMAL backend additions
└── app/modules/users/
    ├── api/user_routes.py                      # MODIFIED — DELETE /users/profile
    └── api/notification_preferences_routes.py  # NEW — GET/PUT preferences
```

### 2.2 Module mobile `support`

**Types** alignés sur Pydantic backend :
```typescript
type TicketStatus = 'open' | 'in_progress' | 'pending_user' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

interface SupportCategory {
  id: string;
  code: string;
  name_es: string; name_fr: string | null; name_en: string | null;
  description?: string | null;
  target_role?: string | null;  // null = visible all roles
  icon?: string | null;
  is_active: boolean;
  sort_order: number;
}

interface SupportTicket {
  id: string;
  ticket_number: string;  // SUP-YYYYMMDD-XXXX
  category_id: string;
  category?: SupportCategory;  // joined
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_by: string;
  assigned_to: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  is_internal: boolean;  // toujours false côté citizen
  created_at: string;
  // attachments: SupportAttachment[]; // V1.1
}
```

**API + hooks** :
- `useMyTickets({status?})` infinite paginée → `GET /support/tickets/my`
- `useTicket(id)` détail → `GET /support/tickets/{id}`
- `useTicketMessages(ticketId)` → `GET /support/tickets/{id}/messages`
- `useSupportCategories()` → `GET /support/categories?is_active=true`
- `useCreateTicket()` mutation → `POST /support/tickets`
- `usePostMessage(ticketId)` mutation → `POST /support/tickets/{id}/messages`
- `useCloseTicket()` mutation → `POST /support/tickets/{id}/close`

### 2.3 Écrans support

**`app/support/index.tsx`** :
- FlatList paginée infinite avec `useMyTickets`
- Chip filter status (all/open/in_progress/resolved/closed)
- Item = `TicketListItem` (subject + status badge + priority + relative date)
- FAB "+ Nouveau ticket" → `/support/new`
- Pull-to-refresh + empty state

**`app/support/new.tsx`** :
- Catégories chargées via `useSupportCategories()` (Picker ou bottom sheet)
- Subject (TextInput, max 200)
- Description (TextInput multiline, max 5000)
- Priority radio (low/normal/high/urgent — citoyen défaut "normal")
- Submit → `useCreateTicket` → router.replace vers `[id]`

**`app/support/[id].tsx`** :
- Header : ticket_number + subject + status badge + priority
- Messages = ScrollView `<MessageBubble>` orientés left/right selon `sender_id === userId`
- TextInput + bouton Send → `usePostMessage` → invalidation messages
- Bouton "Marquer résolu" si owner + status open/in_progress → `useCloseTicket` confirmation Alert

### 2.4 Settings — Notifications preferences

**Backend** (à créer) :
- Table `user_notification_preferences` (user_id PK FK, push_enabled bool, email_enabled bool, sms_enabled bool, ticket_updates_email bool, payment_updates_push bool, updated_at)
- OU colonne JSONB `users.notification_preferences` (plus flexible, moins normalisé)

**Décision V1** : JSONB sur `users.notification_preferences` — single migration, default `{}`, lecture/écriture en bloc, simple.

**Endpoints** :
- `GET /users/notifications/preferences` → renvoie le JSONB normalisé via Pydantic
- `PUT /users/notifications/preferences` → upsert le JSONB

**Mobile** :
- `app/settings/notifications.tsx` : toggles Switch Paper × 3 catégories (push/email/sms × granularités)
- Hook `useNotificationPreferences()` + `useUpdateNotificationPreferences()`

### 2.5 Settings — Biometric toggle

**Pas de backend** — purement local. Le store de l'état actuel est dans `core/security/biometric-login.ts`.

**Mobile** :
- `app/settings/biometric.tsx`
- Détection support hardware via `LocalAuthentication.hasHardwareAsync()` + `isEnrolledAsync()`
- Toggle "Activer la connexion biométrique"
- Si activé alors qu'il n'y avait rien → demander password puis appeler `saveBiometricCredentials`
- Si désactivé → `deleteBiometricCredentials` + clear flag
- ⚠️ **Profiter de l'occasion** : noter dans le commit que `saveBiometricCredentials` a un bug latent (pas d'opts requireAuthentication passées au setItemAsync). On documente, on **ne fixe pas dans P6** car l'audit holistique a déjà identifié et planifié ce fix dans Sprint A. P6 garde le scope.

### 2.6 Settings — Account delete

**Backend** (à créer) :
- `DELETE /users/profile` avec body `{password: str, confirmation: "DELETE"}` (double protection)
- Comportement V1 : soft-delete → `users.deleted_at = NOW()` + `email = email + '.deleted-' + id` (libère l'email pour réinscription) + révoque tous tokens + log dans audit_logs
- Pas de purge immédiate — un cron `delete_soft_deleted_users` purgera après 30j (créé dans phase ultérieure ou tâche backend séparée)

**Mobile** :
- `app/settings/account/delete.tsx` :
  - Header rouge avertissement
  - Liste des conséquences (3 bullets)
  - Input password
  - Input "Tapez DELETE pour confirmer"
  - Bouton rouge disabled tant que validation incomplète
  - Confirmation Alert avant le DELETE
  - Sur succès → logout + redirect `/onboarding`

### 2.7 Endpoints à ajouter dans `core/api/endpoints.ts`

```typescript
support: {
  myTickets: '/support/tickets/my',
  ticket: (id: string) => `/support/tickets/${id}` as const,
  ticketByNumber: (n: string) => `/support/tickets/by-number/${n}` as const,
  createTicket: '/support/tickets',
  closeTicket: (id: string) => `/support/tickets/${id}/close` as const,
  ticketMessages: (id: string) => `/support/tickets/${id}/messages` as const,
  categories: '/support/categories',
},
users: {
  // ... existing
  deleteAccount: '/users/profile',          // DELETE
  notifPreferences: '/users/notifications/preferences', // GET/PUT
},
```

---

## 3. CHECKLIST ATOMIQUE PHASE 6

### 6.1 Backend additions (~1j)

- [x] **6.1.1** Migration `notification_preferences JSONB` + `deleted_at` (commit d37b33ab — RGPD account delete soft-delete)
- [x] **6.1.2** Pydantic `NotificationPreferences` (commit d37b33ab)
- [x] **6.1.3** Routes `GET/PUT /users/notifications/preferences` (commit d37b33ab)
- [x] **6.1.4** Pydantic `AccountDeleteRequest` (commit d37b33ab)
- [x] **6.1.5** Route `DELETE /users/profile` soft-delete + tokens revoke (commit d37b33ab)
- [x] **6.1.6** Tests pytest (commit d37b33ab)
- [x] **6.1.7** Push backend → CI staging (commit d37b33ab)

### 6.2 Module mobile support (~1j)

- [x] **6.2.1** `modules/support/types/support.types.ts` (commit d0673199 — file packages/mobile/src/modules/support/types/)
- [x] **6.2.2** `modules/support/services/support-api.ts` (commit d0673199)
- [x] **6.2.3** `modules/support/services/support-hooks.ts` (commit d0673199)
- [x] **6.2.4** Composants `TicketListItem`, `TicketStatusBadge`, `TicketPriorityBadge`, `MessageBubble` (commit d0673199 — files packages/mobile/src/modules/support/components/)
- [x] **6.2.5** Barrel export `modules/support/index.ts` (commit d0673199)
- [x] **6.2.6** Endpoints `core/api/endpoints.ts` section `support` (commit d0673199)
- [x] **6.2.7** i18n 3 langues (commit d0673199)

### 6.3 Connexion écrans support existants (~0.5j)

- [x] **6.3.1** Réécrire `app/support/index.tsx` (commit bca64a2e — wire support screens to the new module)
- [x] **6.3.2** Réécrire `app/support/new.tsx` (commit bca64a2e)
- [x] **6.3.3** Réécrire `app/support/[id].tsx` (commit bca64a2e)

### 6.4 Settings — Notifications preferences (~0.5j)

- [x] **6.4.1** Endpoints + types client (commit b984b542 — settings notifications, biometric, account delete)
- [x] **6.4.2** `app/settings/notifications.tsx` (commit b984b542 — file packages/mobile/src/app/settings/notifications.tsx)
- [x] **6.4.3** Lien depuis profile screen (commit b984b542)
- [x] **6.4.4** i18n 3 langues (commit b984b542)

### 6.5 Settings — Biometric toggle (~0.25j)

- [x] **6.5.1** `app/settings/biometric.tsx` (commit b984b542 — file packages/mobile/src/app/settings/biometric.tsx)
- [x] **6.5.2** Lien depuis profile screen (commit b984b542)
- [x] **6.5.3** i18n 3 langues (commit b984b542)
- [x] **6.5.4** Note S1 latent — fixed by P9.4 (commit 36b1c9b0 P9.4 biometric S1)

### 6.6 Settings — Account delete (~0.5j)

- [x] **6.6.1** Endpoints + types client (commit b984b542)
- [x] **6.6.2** `app/settings/account/delete.tsx` (commit b984b542 — file packages/mobile/src/app/settings/account/delete.tsx)
- [x] **6.6.3** Sur succès → `signOut()` + `router.replace('/onboarding')` (commit b984b542)
- [x] **6.6.4** Lien depuis profile screen — section danger zone (commit b984b542)
- [x] **6.6.5** i18n 3 langues (commit b984b542)

### 6.7 Validation post-P6 (mémoire #35) (~0.5j)

- [x] **6.7.1** `tsc --noEmit` 0 erreur (commits d0673199, bca64a2e, b984b542)
- [x] **6.7.2** ESLint sous 100 warnings (commit a4a65e61)
- [x] **6.7.3** Grep paths hardcodés hors endpoints.ts → vide (commit 5dcf4620 critique)
- [ ] **6.7.4** Smoke tests staging (4 curl) ⚠️ unverified — needs re-check
- [x] **6.7.5** Imports/exports cohérents barrel `@modules/support` (commit d0673199)
- [x] **6.7.6** Aucune régression auth/profile/payment/wizard (commit 5dcf4620 critique)
- [x] **6.7.7** Auto-critique `MOBILE_USER_PHASE_6_CRITIQUE.md` (commit 5dcf4620)
- [x] **6.7.8** Commits sémantiques locaux groupés (d37b33ab, d0673199, bca64a2e, b984b542, 5dcf4620)

---

## 4. CRITÈRES DE VALIDATION (DoD Phase 6)

| # | Critère | Méthode |
|---|---------|---------|
| V1 | Liste mes tickets paginée + filtre status fonctionnel | Test device |
| V2 | Création ticket avec catégorie chargée backend | Test device |
| V3 | Thread messages avec bubbles left/right + reply | Test device |
| V4 | Close ticket avec confirmation | Test device |
| V5 | Notifications preferences toggle persistent | Test device + curl |
| V6 | Biometric toggle activate/deactivate flow | Test device |
| V7 | Account delete : flow complet → logout → redirect | Test device staging |
| V8 | Aucune régression P0..P5.7 | Test device |
| V9 | tsc 0 erreur, ESLint < 100 | CI |
| V10 | Smoke tests staging 4/4 | curl |
| V11 | i18n 3 langues complète | Code review |
| V12 | Auto-critique | Fichier |
| V13 | Commits sémantiques | git log |

---

## 5. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Backend account delete = changement structurant (soft-delete + tokens revoke) | MOYENNE | HAUT | Migration testée localement avant push staging. Tests pytest sur les 3 cas (auth, confirmation, success) |
| Email "blocking" sur soft-delete (suffixe + .deleted-id) peut casser un trigger BD existant | MOYENNE | MOYEN | Vérifier triggers `users` avant migration, désactiver le trigger temporairement si nécessaire |
| Notifications preferences JSONB → si on change la shape plus tard, migration lourde | FAIBLE | FAIBLE | V1 = JSONB simple, validation Pydantic stricte côté backend |
| Bug latent S1 (biométrique) reste en place après P6 | CERTAINE | MOYEN | Documenté + planifié Sprint A hardening, P6 ne le réintroduit pas |
| Support attachments V1.1 attendus par les utilisateurs | FAIBLE | FAIBLE | Documenté V1.1 dans le composant — placeholder UI possible |

---

## 6. GAP HONNÊTE

1. **Test device physique** — V1-V8 nécessitent EAS build + test.
2. **Appointments user-list (mes RDV)** — pas dans P6. Master plan le mentionne mais backend n'a pas l'endpoint dédié. Reporté à P6.5 ou P7.
3. **Calendar view native (`react-native-calendars`)** — explicitement reporté car appointments user-list reporté.
4. **Reminder notifications appointment** — reporté avec le sous-item.
5. **RGPD data export (art. 20)** — reporté à P9 (job async backend).
6. **Audit OWASP partiel (master plan validation)** — sera fait en P9.

---

## 7. RECOMMANDATION PUSH

1. Push 6.1 backend isolé après pytests verts → CI staging vert.
2. Implémenter 6.2..6.6 mobile en commits sémantiques groupés.
3. Auto-critique + commits.
4. **Demander confirmation utilisateur avant push remote mobile** (mémoire #13).
5. Build EAS Android preview pour test device.

---

## 8. NEXT — Après Phase 6

P7 = Batch Requests (business). Pas de dépendance bloquante avec P6.

---

## 9. CHANGELOG

- **2026-04-27 v1.0** : créé post-audit Explore. Scope V1 ajusté : appointments user-list reporté (gap backend), RGPD data export reporté (P9). Inclut additions backend minimales (notif prefs JSONB + account delete soft-delete) qui sont indispensables pour les écrans mobile correspondants.

---
## Validation rétroactive
- **Date** : 2026-04-29
- **Méthode** : audit code + git log
- **Coches livrées rétroactivement** : 32
- **Items unverified** : 1 (smoke tests staging — 4 curl)
- **Items deferred Phase 10** : 0
- **Notes** : Backend RGPD + notif prefs (d37b33ab). Module support complet (`packages/mobile/src/modules/support/`). Écrans support reliés (bca64a2e). Settings notifications+biometric+account/delete (b984b542 — files `packages/mobile/src/app/settings/{notifications,biometric,account/delete}.tsx`). S1 biometric latent fixé en P9.4 (36b1c9b0).
