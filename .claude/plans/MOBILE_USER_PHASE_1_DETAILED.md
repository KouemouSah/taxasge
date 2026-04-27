# PHASE 1 — Push Notifications + Deep Links + Notification Center (DETAILED PLAN)

**Date** : 2026-04-27
**Phase parent** : `MOBILE_USER_MIGRATION_MASTER_PLAN.md`
**Durée estimée** : 3-4 jours
**Bloque** : tous les flux UX (paiement BANGE, agent decision, appointment) sans canal de communication user
**Pré-requis** : Phase 0 ✅ (commits `e1ad7f42` … `bf8ce555`)

---

## 1. CONTEXTE & STRATÉGIE

L'app **Facil** (citoyen + business) doit recevoir des push notifications pour les événements critiques (paiement validé/rejeté, décision agent, RDV rappel, document expirant, ticket support répondu). Backend P1 est **production-ready** — tout le travail est mobile.

> **Règle d'or P1** : on consomme une infrastructure backend existante. Pas de code backend ajouté en P1 sauf si un manque bloquant est identifié (auquel cas → ticket séparé).

### 1.1 Choix d'architecture validé

- **FCM (Android) + APNs (iOS) natifs** — pas d'Expo Push Service
- `expo-notifications` utilisé UNIQUEMENT pour : (a) demander permissions, (b) récupérer le token natif via `getDevicePushTokenAsync()`, (c) afficher les notifs en foreground, (d) gérer channels Android
- Backend (`firebase-admin[messaging]` + APNs HTTP/2) envoie directement
- Justification : 1M users → un proxy Expo Push de moins en chemin critique ; data-only payloads (deep links silencieux) supportés natifs uniquement ; `firebase-admin` déjà en prod côté backend (Storage)

### 1.2 État backend (vérifié 2026-04-27)

| Composant | Fichier | Statut |
|-----------|---------|--------|
| Endpoint `POST /users/profile/device-token` | `app/modules/users/api/user_routes.py:259-292` | ✅ Présent |
| Schema `DeviceTokenRequest` | mêmes lignes 252-256 | ✅ `{device_token, platform: android\|ios, app: citizen\|inspector}` |
| Stockage | `users.device_push_token` (migration 286) | ✅ 4 colonnes + index |
| `PushSendingService` | `app/modules/communications/services/push_sending_service.py:24+` | ✅ FCM single/multi/topic/by-user, APNs config |
| Templates push i18n (es/fr/en) | table `push_templates` (migration 010) | ✅ 88+ rows multilingues |
| EventBus → push | `app/modules/communications/handlers/notification_handler.py:54+` | ✅ 20+ events mappés |
| User pref `push_notifications` | `users` table | ✅ Respecté par handler |
| Audit | `notification_log` (migration 027) | ✅ Status, retry, provider |

### 1.3 État mobile (vérifié 2026-04-27)

| Élément | Statut |
|---------|--------|
| `expo-notifications@~0.32.16` | ✅ Installé |
| `expo-linking@~8.0.11` | ✅ Installé |
| `app.json` `scheme: "facil"` | ✅ Présent |
| `app.json` `googleServicesFile: "./google-services.json"` | ✅ Configuré |
| `google-services.json` | ✅ Présent à la racine du package |
| `GoogleService-Info.plist` (iOS APNs) | ❌ **Absent — bloquant iOS** |
| Plugin `expo-notifications` config dans `app.json` | ❌ Absent (icon/color/sound notification) |
| `API_ENDPOINTS.users.deviceToken` | ✅ P0 |
| Type `DeviceTokenRequest` (via openapi-types) | ✅ P0 |
| Code utilisant `Notifications.*` | ❌ **Zéro** |
| Notification channels Android | ❌ Absent |
| Deep link handler dans `_layout.tsx` | ❌ Absent |
| Notification Center UI | ❌ Absent |
| Hook `useDeviceTokenRegistration` | ❌ Absent |

### 1.4 Pièges identifiés

| # | Piège | Mitigation |
|---|-------|------------|
| **P1** | `DeviceTokenRequest.app` default backend = `'inspector'` | Mobile citoyen DOIT passer `app: 'citizen'` explicite |
| **P2** | Backend stocke **1 token par user** (last-wins, pas multi-device) | Documenter limitation V1 ; multi-device en post-P1 (table dédiée `user_devices`) |
| **P3** | Aucun endpoint exposé pour lire `notification_log` côté citoyen | Notification Center V1 = cache local MMKV des push reçus ; backend endpoint planifié post-P8 |
| **P4** | BANGE `return_url` web par défaut (`FRONTEND_URL/dashboard/...`) — `payment_routes.py` ne pousse pas un deep link mobile | Câbler le deep link handler `facil://payments/:id/result` en P1 ; intégration BANGE end-to-end (faire passer le return_url custom) traitée en **P5** |
| **P5** | iOS APNs nécessite `GoogleService-Info.plist` + APNs auth key dans Firebase Console | Doc dans le plan : EAS credentials, Firebase Console upload APNs |
| **P6** | Android 13+ exige permission `POST_NOTIFICATIONS` (runtime) | `expo-notifications` la gère, mais doit être appelée explicitement |
| **P7** | Notifications data-only (silent) ne déclenchent pas l'UI mais peuvent mettre à jour le state (badge, refresh) — ne pas confondre avec notifs visibles | Distinction `data` vs `notification` payload côté backend déjà présente |

---

## 2. ARCHITECTURE DES CHANGEMENTS

### 2.1 Layout final

```
packages/mobile/
├── app.json                          # + plugin expo-notifications config
├── google-services.json              # ✅ déjà là (FCM Android)
├── GoogleService-Info.plist          # NEW (APNs iOS via EAS)
├── src/
│   ├── core/
│   │   └── notifications/            # NEW
│   │       ├── notifications-service.ts    # init, permissions, channels, listeners
│   │       ├── device-token-service.ts     # getDevicePushTokenAsync + register
│   │       ├── deep-link-router.ts         # parse data payload → expo-router push
│   │       ├── notifications-storage.ts    # MMKV cache des notifs reçues
│   │       ├── types.ts                    # NotificationPayload, ChannelId, etc.
│   │       └── index.ts
│   ├── app/
│   │   ├── _layout.tsx               # MODIFIED — wire NotificationsProvider
│   │   └── (tabs)/
│   │       └── notifications.tsx     # NEW — Notification Center screen
│   └── modules/
│       └── notifications/            # NEW
│           ├── components/
│           │   ├── notification-item.tsx
│           │   ├── notification-empty-state.tsx
│           │   └── notification-permissions-banner.tsx
│           ├── hooks/
│           │   ├── use-device-token-registration.ts
│           │   ├── use-notifications.ts
│           │   └── use-notification-badge.ts
│           └── types.ts
```

### 2.2 Flux d'enregistrement device token

```
App boot
  └─► AuthProvider bootstrap (token JWT en mémoire)
       └─► onAuthSuccess (login OU refresh OK)
            └─► useDeviceTokenRegistration():
                 1. Notifications.requestPermissionsAsync()         ← Android 13+ obligatoire
                 2. if granted:
                    a. Notifications.getDevicePushTokenAsync()      ← retourne FCM (Android) ou APNs (iOS)
                    b. POST /users/profile/device-token
                       { device_token, platform: 'android'|'ios', app: 'citizen' }
                    c. Stocker en MMKV (last_token_registered) pour idempotence
                 3. else: noop (banner d'invite affiché en background dans Notification Center)
```

**Idempotence** : on ne POST que si `device_token` ≠ `last_token_registered` MMKV (évite spam endpoint à chaque foreground).

**Re-registration** : déclenchée à chaque login + au cold start si auth déjà active + sur `addPushTokenListener` (rotation FCM).

### 2.3 Channels Android

| Channel ID | Importance | Usage |
|-----------|------------|-------|
| `default` | DEFAULT | Notifs génériques fallback |
| `payment` | HIGH | Paiement validé / rejeté / reçu disponible |
| `agent_decision` | HIGH | Décision agent (approuvé / rejeté / docs demandés) |
| `appointment` | DEFAULT | Rappel RDV J-1 / J / no-show |
| `support` | DEFAULT | Réponse ticket support |
| `documents` | LOW | Document expirant, alerte vault |

Sound : `default` partout. Vibration : ON sur HIGH, OFF sur LOW.

### 2.4 Deep links — schéma `facil://`

Routes deep link supportées (mappées vers Expo Router) :

| Deep link | Route Expo Router | Usage |
|-----------|-------------------|-------|
| `facil://requests/:id` | `/service-requests/[id]` | Détail demande après décision agent |
| `facil://payments/:id/result` | `/payments/[id]/result` | Retour paiement BANGE |
| `facil://appointments/:id` | `/(tabs)/appointments/[id]` | Rappel RDV |
| `facil://support/:ticketNumber` | `/support/[ticketNumber]` | Réponse ticket |
| `facil://documents/:id` | `/(tabs)/documents/[id]` | Vault doc expirant (P2) |
| `facil://notifications` | `/(tabs)/notifications` | Centre notifs (depuis push tap) |

**Universal links** (https://facil.gob.gq/...) : reportés à P10 (avant Store submission, association requise).

### 2.5 Notification Center — Architecture V1

Storage : MMKV array `notifications` (max 100 items, FIFO purge)

```ts
type StoredNotification = {
  id: string;            // server notif_id si présent, sinon uuid
  channelId: string;
  title: string;
  body: string;
  data: Record<string, string>;
  receivedAt: number;    // epoch ms
  readAt: number | null;
  deepLink: string | null;
};
```

Push reçu (foreground OU background tap) → ajout MMKV → badge non-lu mis à jour → si tap : marquer read + naviguer.

V1 ne synchronise PAS avec `notification_log` backend (Piège P3). En V2 (post-P8), endpoint `GET /users/profile/notifications` ajouté → merge serveur + local.

---

## 3. CHECKLIST ATOMIQUE PHASE 1

### 3.1 Configuration native (jour 1 matin)

- [ ] **1.1.1** Ajouter le plugin `expo-notifications` dans `app.json` plugins :
  ```json
  ["expo-notifications", {
    "icon": "./assets/images/notification-icon.png",
    "color": "#1565C0",
    "sounds": [],
    "androidMode": "default"
  }]
  ```
- [ ] **1.1.2** Créer `assets/images/notification-icon.png` (96x96 monochrome blanc, fond transparent — exigence Android)
- [ ] **1.1.3** `app.json` Android `permissions`: ajouter `"POST_NOTIFICATIONS"` (Android 13+)
- [ ] **1.1.4** `app.json` iOS `infoPlist`: vérifier que `UIBackgroundModes` inclut `remote-notification` (sinon ajouter)
- [ ] **1.1.5** Documenter dans README setup APNs : (a) générer Apple APNs auth key (.p8) sur developer.apple.com, (b) uploader dans Firebase Console > Project Settings > Cloud Messaging > Apple app config, (c) `eas credentials` pour configurer le push entitlement iOS
- [ ] **1.1.6** `GoogleService-Info.plist` à obtenir depuis Firebase Console (iOS app `com.taxasge.app`) et ajouter à `packages/mobile/`
- [ ] **1.1.7** `app.json` iOS : `googleServicesFile: "./GoogleService-Info.plist"` (si pas déjà via EAS)

### 3.2 Service notifications (jour 1 après-midi)

- [ ] **1.2.1** `core/notifications/types.ts` — types `NotificationChannelId`, `NotificationPayload`, `StoredNotification`, `DeepLinkData`
- [ ] **1.2.2** `core/notifications/notifications-service.ts`:
  - `initNotifications()` — appelé une fois au boot dans `_layout.tsx` :
    - `Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true }) })`
    - Création des channels Android via `setNotificationChannelAsync()`
  - `setupListeners(onReceive, onResponse)` — abstrait `addNotificationReceivedListener` et `addNotificationResponseReceivedListener`
  - `cleanupListeners()` — pour useEffect cleanup
- [ ] **1.2.3** `core/notifications/device-token-service.ts`:
  - `requestPermission(): Promise<'granted' | 'denied' | 'undetermined'>` — wrapper `requestPermissionsAsync` qui gère iOS + Android 13
  - `getNativeDeviceToken(): Promise<{ token: string; platform: 'android' | 'ios' } | null>` — wrapper `getDevicePushTokenAsync` ; type validation
  - `registerDeviceToken(token, platform): Promise<void>` — POST endpoint avec `app: 'citizen'`
  - `getStoredToken() / setStoredToken()` — MMKV pour idempotence
- [ ] **1.2.4** `core/notifications/deep-link-router.ts`:
  - `routeFromPayload(data: Record<string, string>, router): void` — parse `data.deep_link` ou champs (`type`, `entity_id`) → `router.push(...)`
  - Table de mapping (champ `type` du payload → route)
  - Fallback : si payload illisible → ouvrir Notification Center
- [ ] **1.2.5** `core/notifications/notifications-storage.ts`:
  - MMKV instance dédiée (`facil-notifications`)
  - `addNotification(payload)` — push en tête, purge FIFO à 100
  - `getNotifications()`, `markAsRead(id)`, `markAllAsRead()`, `deleteNotification(id)`, `clearAll()`
  - `getUnreadCount()`
- [ ] **1.2.6** `core/notifications/index.ts` — barrel export

### 3.3 Hooks consumer (jour 2 matin)

- [ ] **1.3.1** `modules/notifications/hooks/use-device-token-registration.ts`:
  - useEffect qui s'active sur `isAuthenticated && !isLoading`
  - Sequence : permission → getNativeDeviceToken → registerDeviceToken
  - Idempotent (skip si token == storedToken)
  - Listener `Notifications.addPushTokenListener` pour rotation FCM → re-register
  - Retourne `{ status: 'idle'|'granted'|'denied'|'registered'|'error', requestPermission(), }` pour UI banner
- [ ] **1.3.2** `modules/notifications/hooks/use-notifications.ts`:
  - Subscribe à `notifications-service.setupListeners` 
  - On received foreground : ajouter à MMKV + invalidate badge query
  - On response (tap) : `routeFromPayload` + mark as read
  - Retourne `{ notifications, unreadCount, markAsRead, markAllAsRead, delete, clearAll }`
- [ ] **1.3.3** `modules/notifications/hooks/use-notification-badge.ts`:
  - React Query : `['notifications', 'unread-count']` lit MMKV
  - Invalidate sur add/markAsRead

### 3.4 UI Notification Center (jour 2 après-midi)

- [ ] **1.4.1** `modules/notifications/components/notification-item.tsx` :
  - Flat list item (design natif Android, mémoire #15) — 64dp, dot coloré selon channel, divider
  - Title bold + body 2 lignes ellipsées + relative time
  - Tap → markAsRead + navigate via deepLink
  - Long press / swipe → delete (bottom sheet ou snackbar undo)
- [ ] **1.4.2** `modules/notifications/components/notification-empty-state.tsx` — illustration vide + CTA "Activer les notifications" si denied
- [ ] **1.4.3** `modules/notifications/components/notification-permissions-banner.tsx` — banner card haut d'écran si permission denied avec CTA `Linking.openSettings()`
- [ ] **1.4.4** `app/(tabs)/notifications.tsx` — écran complet :
  - Header avec actions "Tout marquer lu" + "Tout supprimer"
  - FlatList avec separator, RefreshControl (pull-to-refresh refetch storage)
  - Filtre channel optionnel (Tous / Paiements / RDV / Support)
  - Empty state si vide ; banner permission si denied
- [ ] **1.4.5** Ajouter onglet "Notifications" dans `(tabs)/_layout.tsx` avec badge unread count
- [ ] **1.4.6** i18n : 3 langues, clés `notifications.*` dans `core/i18n/translations/{es,fr,en}.json`

### 3.5 Intégration root + deep links (jour 3 matin)

- [ ] **1.5.1** `app/_layout.tsx` MODIFIED :
  - Importer `initNotifications()` au boot (avant `SplashScreen.hideAsync`)
  - Wrapper `<NotificationsProvider>` qui orchestre `useDeviceTokenRegistration` + `useNotifications` (déclenchés UNIQUEMENT après auth bootstrap)
  - Handle initial deep link (cold start) : `Notifications.getLastNotificationResponseAsync()` au mount
- [ ] **1.5.2** Configurer `expo-router` deep link parsing : Linking config dans `app/_layout.tsx` (prefixes `[Linking.createURL('/'), 'facil://']`)
- [ ] **1.5.3** Tester chaque deep link manuellement via `npx uri-scheme open facil://payments/abc/result --android` (et iOS sim)
- [ ] **1.5.4** Edge case cold start : si app killée et tap sur push → `useEffect` racine doit lire `getLastNotificationResponseAsync` et router APRÈS auth bootstrap (sinon redirect vers `/index` perd la cible)

### 3.6 Tests + smoke (jour 3 après-midi)

- [ ] **1.6.1** `tsc --noEmit` clean
- [ ] **1.6.2** ESLint clean (sous seuil 100 warnings)
- [ ] **1.6.3** Smoke test enregistrement token sur **device physique Android** (FCM nécessite Google Play Services — pas d'émulateur sans ça) :
  - Login → permission accordée → POST device-token retourne 200
  - Vérifier en BD staging : `SELECT device_push_token, device_push_platform, device_push_app FROM users WHERE email = '<test>'` → 3 colonnes peuplées avec `'citizen'`
- [ ] **1.6.4** Smoke test push réel : déclencher event backend (paiement test ou outil admin si disponible) → notif reçue device → tap → deep link OK
- [ ] **1.6.5** Smoke test deep link cold start : tuer l'app → push → tap → app ouvre directement sur la route cible
- [ ] **1.6.6** Smoke test refus permission : Android 13 → simuler refus → vérifier banner s'affiche dans Notification Center
- [ ] **1.6.7** iOS smoke test deferred si APNs cert pas encore dans Firebase Console → marquer comme dette explicite dans critique

### 3.7 Auto-critique + commits (jour 3 fin)

- [ ] **1.7.1** Rédiger `.claude/plans/MOBILE_USER_PHASE_1_CRITIQUE.md` (DoD, risques, dette iOS si applicable)
- [ ] **1.7.2** Commits sémantiques locaux (mémoire #32 — auto sans demander) :
  1. `chore(mobile): configure expo-notifications plugin + Android channels`
  2. `feat(mobile): notifications service core (token, channels, listeners, storage)`
  3. `feat(mobile): notification center UI + tabs integration`
  4. `feat(mobile): deep link routing + token registration on auth`
  5. `docs(mobile): Phase 1 plan & auto-critique`

---

## 4. CRITÈRES DE VALIDATION (DoD Phase 1)

| # | Critère | Méthode |
|---|---------|---------|
| V1 | Token FCM Android enregistré côté backend après login | SQL staging `SELECT device_push_token FROM users WHERE id = ?` |
| V2 | App envoie `app: 'citizen'` (pas le default `inspector`) | DB `device_push_app = 'citizen'` |
| V3 | Push reçu en foreground affiche bannière + son | Test device |
| V4 | Push reçu app killée → tap ouvre la bonne route | Test device cold start |
| V5 | Notification Center affiche les push reçus, mark-as-read, badge unread | Test device |
| V6 | Permission denied → banner CTA "Activer notifs" présent | Test device |
| V7 | `tsc --noEmit` 0 erreur | CI |
| V8 | ESLint sous seuil 100 warnings | CI |
| V9 | iOS APNs : token reçu OU dette explicite documentée | Test ou critique |
| V10 | Auto-critique écrite | Fichier |
| V11 | Commits locaux groupés sémantiquement | `git log` |
| V12 | Aucune régression Phase 0 (smoke tests P0 toujours OK) | Test device |

---

## 5. RISQUES PHASE 1 & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| iOS APNs cert pas configuré dans Firebase Console à temps | HAUTE | MOYEN | iOS dette explicite dans critique. Push iOS testé en dev build interne ; release iOS post-EAS-credentials. |
| FCM token rotation casse l'idempotence MMKV | FAIBLE | FAIBLE | `addPushTokenListener` re-register automatiquement |
| Cold start deep link race condition (router pas prêt) | MOYENNE | MOYEN | Attendre `isLoading=false` (auth) avant router.push ; effet idempotent |
| Backend last-wins token écrase le token d'un autre device du même user | MOYENNE | MOYEN (dette UX) | Doc V1 limitation ; multi-device en post-P1 (table `user_devices`) — ticket à créer |
| Notification permission refusée par utilisateur 1ère fois | HAUTE | FAIBLE | Banner persistant dans Notification Center + onboarding suggère activation |
| Push payload data-only ne déclenche pas l'UI mais doit refresh state | MOYENNE | FAIBLE | Listener foreground appelle queryClient.invalidateQueries selon `data.invalidate_keys` |
| Test push réel impossible sans outil admin staging | MOYENNE | MOYEN | Si pas dispo, créer un endpoint test interne `POST /admin/notifications/test-push` (hors scope mais à demander backend si bloquant) |

---

## 6. DÉLÉGATION AGENTS

- **1.5.x deep links** : test manuel via Bash (`uri-scheme`), pas délégué
- **1.6.x smoke tests** : moi-même (devices, tokens auth, BD)
- **1.4.x UI Notification Center** : moi-même (cohérence design natif)
- Reste : moi-même, séquentiel et critique

---

## 7. NEXT — Après Phase 1

Phase 2 (`Document Vault` + Auto-fill Wizard) sera détaillée dans `.claude/plans/MOBILE_USER_PHASE_2_DETAILED.md` après validation P1.

---

## 8. CHANGELOG

- **2026-04-27 v1.0** : création post-audit backend (Explore agent) + audit mobile direct.
