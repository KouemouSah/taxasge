# PHASE 1 — Auto-critique & DoD Validation

**Date** : 2026-04-27
**Phase** : `MOBILE_USER_PHASE_1_DETAILED.md`
**Statut global** : ✅ Code complet & propre, ⏳ validation device physique requise avant push (compte test Android).

---

## 1. Bilan factuel

| Catégorie | Avant P1 | Après P1 |
|-----------|----------|----------|
| Code utilisant `Notifications.*` | Aucun | `core/notifications/` (5 fichiers, ~440 LOC) + `modules/notifications/` (3 hooks + 4 composants + 1 screen, ~700 LOC) |
| `app.json` | Pas de plugin notifications | Plugin `expo-notifications` configuré (icon, color, channel collapsed title) |
| Permissions natives | `VIBRATE` seul | + `POST_NOTIFICATIONS` (Android 13+), iOS `UIBackgroundModes: ["remote-notification"]` |
| Channels Android | Aucun | 6 channels (default, payment, agent_decision, appointment, support, documents) avec importance + vibration adaptées |
| Token registration | Aucune | `useDeviceTokenRegistration` — perm → `getDevicePushTokenAsync` → POST endpoint avec `app: 'citizen'`, idempotent MMKV, listener rotation FCM |
| Foreground handler | Aucun | `setNotificationHandler` (banner + sound + badge) |
| Deep link routing | Aucun | `resolveRouteFromPayload` + `routeFromPayload` (10 types couverts), fallback `/notifications` |
| Cold-start tap | Aucun | `getInitialNotificationResponse` après auth bootstrap dans `_layout.tsx` |
| Notification Center | Aucun | Stack route `/notifications` avec inbox MMKV (max 100), bell icon header dashboard avec badge non-lu |
| i18n | Bloc minimal | 3 langues complètes : `notifications.empty.{title,body}`, `unreadCount`, `actions.markAllRead`, `permission.{title,enable,openSettings}` |

**Stats** : 12 nouveaux fichiers + 6 modifiés + 3 i18n locales étendus.

---

## 2. DoD Phase 1 — Validation

| # | Critère | Méthode | Statut |
|---|---------|---------|--------|
| V1 | Token FCM Android enregistré côté backend après login | SQL staging | ⏳ **Test device requis** |
| V2 | App envoie `app: 'citizen'` (pas le default `inspector`) | Code review + DB | ✅ Code review confirme `app: 'citizen'` hardcodé en `device-token-service.ts:registerDeviceToken` |
| V3 | Push reçu en foreground affiche bannière + son | Test device | ⏳ Test device requis |
| V4 | Push reçu app killée → tap ouvre la bonne route | Test device cold start | ⏳ Test device requis |
| V5 | Notification Center affiche les push reçus, mark-as-read, badge unread | Test device | ⏳ Test device requis (mais code 100% présent) |
| V6 | Permission denied → banner CTA "Activer notifs" présent | Test device | ⏳ Test device requis (composant + i18n présents) |
| V7 | `tsc --noEmit` 0 erreur | CI | ✅ |
| V8 | ESLint sous seuil 100 warnings | CI | ✅ — 82 warnings (3 nouveaux par rapport à P0, tous mineurs `console.warn` dev-only) |
| V9 | iOS APNs : token reçu OU dette explicite documentée | Test ou critique | ⚠️ **Dette documentée** — voir §4 |
| V10 | Auto-critique écrite | Fichier | ✅ (ce fichier) |
| V11 | Commits locaux groupés sémantiquement | `git log` | ⏳ À exécuter |
| V12 | Aucune régression Phase 0 (smoke tests P0 toujours OK) | Test device + curl | ⏳ Test device requis |

---

## 3. Risques de régression — Analyse adversariale

### 3.1 Risques élevés

**R1. `_layout.tsx` ajoute 2 hooks (`useDeviceTokenRegistration`, `useNotifications`) directement dans `RootNavigator`** — ces hooks dépendent de `useAuth()` (déjà consommé via `useAuth().isLoading`), donc ils sont automatiquement gated par `AuthProvider`. Risque : `useNotifications` setupListeners au mount, même unauthenticated → mais c'est OK, listeners ne déclenchent rien sans push entrant. Pas de régression.

**R2. `getDevicePushTokenAsync()` peut throw sur émulateur sans Google Play Services** — l'appel est dans un try/catch (`runRegistration` dans le hook), donc l'erreur est capturée et le statut passe à `'error'`. L'app continue de fonctionner, simplement sans push. **Mitigation** : dev en émulateur reste safe.

**R3. MMKV `facil-notifications` instance — encryption key hardcoded** (`'facil-notif-key'`) — comme `facil-mmkv-key` dans `mmkv.ts`. C'est de l'obfuscation basique, pas de la sécurité forte. Acceptable pour notifications (pas de PII forte). À documenter dans le futur audit OWASP P9.

### 3.2 Risques moyens

**R4. Cold start deep link race condition** — `getInitialNotificationResponse` est appelé dans un `useEffect` qui s'active sur `[isLoading, isAuthenticated]`. Si auth bootstrap échoue (token expiré non-renouvelable), `isAuthenticated` reste false et le deep link n'est pas résolu. Comportement attendu : user voit la page de login, le deep link cible est perdu. **Mitigation** : V2 — stocker le payload reçu en MMKV jusqu'à login réussi puis router. Hors scope P1.

**R5. Backend last-wins token** (limitation V1 connue) — si user a 2 devices Android, seul le dernier registered reçoit les push. Pas de régression introduite par P1, mais la limitation devient visible. **Mitigation** : ticket post-P1 pour table `user_devices` multi-device.

**R6. `useNotificationBadge` polling 5s** — choix volontaire car MMKV n'a pas d'event emitter cross-component natif. 5s = compromis batterie/réactivité. Quand `useNotifications` est monté (NotificationCenter screen), le badge est mis à jour synchroneement par le `refresh()` shared. Pas de problème.

### 3.3 Risques faibles

**R7. `useTranslation()` dans `notification-empty-state.tsx` mais pas mémoïsé** — composant léger, re-render OK.

**R8. Linking schema parse** — `resolveRouteFromPayload` parse le `deep_link` via `Linking.parse` ; si la string est mal formée, retourne `parsed.path = undefined` → fallback OK. Tested mentally, pas observé en runtime.

**R9. iOS `getDevicePushTokenAsync` retourne un APNs token hexadécimal — Firebase l'accepte tel quel via FCM/APNs unified send** — backend `PushSendingService` via `firebase_admin.messaging` qui dispatche correctement. Pas d'action mobile.

---

## 4. Dette explicite — iOS APNs

**Mise à jour (post-revue user)** : `taxasge/config/` contient déjà les vrais
fichiers Firebase pour 2 environnements :

| Fichier | Projet Firebase |
|---------|----------------|
| `config/GoogleService-Info.dev.plist` | taxasge-dev (sender 392159428433) |
| `config/GoogleService-Info.pro.plist` | taxasge-pro (sender 430718042574) |
| `config/google-services.dev.json` | taxasge-dev |
| `config/google-services.prod.json` | taxasge-pro |

Le `packages/mobile/google-services.json` à la racine du package est une copie
de la variante DEV (déjà tracké git, commit `3de631e1`). **Pendant la revue,
j'ai dupliqué `config/GoogleService-Info.dev.plist` → `packages/mobile/GoogleService-Info.plist`
et ajouté `googleServicesFile: "./GoogleService-Info.plist"` dans `app.json` ios.**

Restent côté ops (hors code mobile) :

1. **APNs Auth Key (.p8)** uploadée dans Firebase Console > Project Settings >
   Cloud Messaging > Apple app config (Team ID + Key ID). À vérifier sur le
   projet `taxasge-dev` (et `taxasge-pro` avant store).
2. **EAS credentials** : `eas credentials -p ios` pour activer l'entitlement
   Apple Push Notifications + provisioning profile.
3. **Apple Developer** : bundle id `com.taxasge.app` enregistré, capability
   "Push Notifications" activée.

**Dette environnementale identifiée (hors scope P1)** : `eas.json` ne fait
aucun switch dev/prod côté Firebase. Les profils `preview` et `production`
pointent tous deux sur le backend staging et utilisent la config Firebase
DEV. Avant le release prod (P10), il faudra wirer un script ou un `prebuild`
hook qui copie le bon `.plist` / `.json` selon le profile. **Ticket à créer**
pour P10 (build production).

## 5. Smoke tests — état réel

Premier test live (après warmup Cloud Run) :
- `POST /api/v1/users/profile/device-token` sans token JWT → **HTTP 403 `{"detail":"Not authenticated"}`** (réponse de la dépendance `HTTPBearer` avant validation Pydantic — confirme path + method corrects).

Tests authenticated impossibles depuis cette session (pas de token user test). La validation se fait via :

- Code review (✅) — payload `{device_token, platform, app: 'citizen'}` strictement aligné avec `DeviceTokenRequest` Pydantic vérifié dans openapi-types.
- Type check `tsc --noEmit` (✅).
- Test device avec compte test (à faire avant push P1).

**Plan smoke test post-build** :
1. Build EAS preview (Android dev client) avec `npm run build:dev`
2. Installer sur device physique Android (Google Play Services requis)
3. Login compte test → vérifier permission prompt → accepter
4. SQL staging : `SELECT device_push_token, device_push_platform, device_push_app, device_push_updated_at FROM users WHERE email='<test>'` → 4 colonnes peuplées avec `'citizen'`
5. Trigger push (outil admin backend OU test manuel via FCM Firebase Console "Send test message" avec le token)
6. Vérifier : foreground = bannière, background = system tray, tap = deep link OK
7. Tuer l'app → push → tap → app ouvre la bonne route après auth bootstrap

---

## 6. Ce qui n'a pas été fait (gap honnête)

1. **Test device physique** (V1, V3-V6, V12) — voir §5.
2. **Smoke test endpoint live** — staging indisponible cette session, validation purement statique.
3. **Test push end-to-end** — nécessite déclenchement event backend (paiement test ou admin tool).
4. **Universal links HTTPS** (`https://facil.gob.gq/...`) — reportés à P10 (avant store submission, association iOS/Android requise).
5. **Multi-device support** — limitation backend V1 (1 token/user), à traiter en post-P1 via table `user_devices`.

---

## 7. Recommandation push

**OK pour commits locaux automatiques** (mémoire #32). Avant push remote :

1. Build EAS preview (`npm run build:preview` ou `:dev`).
2. Test device physique Android : login + permission + token enregistré + push test (FCM Console).
3. Fixer tout bug détecté → commit additionnel `fix(mobile): ...`.
4. Push après validation utilisateur (mémoire #13/#14).

---

## 8. Phase 2 — Pré-requis

- Vault Backend `/user-documents/*` confirmé exposé (✅ déjà dans P0 endpoints.ts).
- SHA-256 deduplication backend opérationnelle (✅ commit `39e5080a`).
- Auto-fill wizard via `useVaultDocument` endpoint (✅ déjà câblé en P0 mobile).
- Aucun pré-requis bloquant — P2 peut démarrer dès validation P1.
