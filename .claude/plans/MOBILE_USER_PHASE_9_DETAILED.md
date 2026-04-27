# PHASE 9 — OWASP Mobile + Observabilité (DETAILED PLAN)

**Date** : 2026-04-27
**Phase parent** : `MOBILE_USER_MIGRATION_MASTER_PLAN.md`
**Durée estimée** : 4-5 jours
**Bloquant pour suite** : Non (P10 = E2E + App Stores)
**Pré-requis** : P0..P8 ✅ + V1.1 quick-wins (A1..B3) ✅
**Convergence** : ce plan exécute la majorité du **Sprint A + B** de
`MOBILE_HOLISTIC_AUDIT_2026_04_27.md` ainsi que la section "Observabilité" du
master plan. **Pas de duplication** — chaque item fait soit référence à
l'audit holistique (ID Sx/Qx/Rx), soit au master plan (Mx).

---

## 1. CONTEXTE

L'audit holistique du 2026-04-27 a déjà inventorié les gaps OWASP / RGPD /
observabilité. P9 est l'**exécution** de ces findings, plus le câblage Sentry
prévu par le master plan. Items déjà faits par les phases précédentes :

| Audit ID | Done in | Note |
|----------|---------|------|
| Q1 (zéro tests) | partial — pytest backend P5.1/P6.1 | E2E mobile = P10 |
| R1 (account delete) | P6.1 + P6.6 | RGPD art. 17 livré |
| R3/R4 partial | P6.5+P6.6 | privacy/consent surface partielle |

Items qui **restent à faire** dans P9 :

| OWASP / Audit | Description | Sous-phase |
|---------------|-------------|------------|
| M1 / S1 | Password biométrique stocké sans `requireAuthentication` | **9.4** |
| M2 / S3 | npm audit HIGH/MODERATE non patchés | **9.1** |
| M5 / Q2 | Pas d'observabilité prod (Sentry/Crashlytics) | **9.2** |
| M5 / S7 | console.* en prod | **9.3** |
| M9 / S2 | `allowBackup="true"` + XMLs absents | **9.6** |
| M9 / S4 | MMKV `encryptionKey` hardcodé | **9.5** |
| M4 / S8 | Deep link path validation manquante | **9.7** |
| M3 / S6 | Refresh token TTL 30j + pas de revoke à change-password | **9.8** *(backend)* |
| M7 / S5 | Pas de device integrity check | **9.9** |
| R2 | RGPD data export | **9.10** |
| **Reportés explicitement** | M5 SSL pinning (pas de cert prod stable), M7 anti-tampering (gros chantier), M10 (déjà OK : aucune crypto custom) | hors P9 |

### 1.1 Pièges identifiés

| # | Piège | Mitigation |
|---|-------|------------|
| **P1** | `npm audit fix` peut bumper des deps Expo et casser SDK 54 | Filtrer : ne fixer que les vulns sans incidence Expo, lock major versions |
| **P2** | Sentry RN init synchrone bloque le boot ; mais async retarde le capture des erreurs early | Init derrière `runAfterInteractions` (cf. P9.2) + `beforeSend` qui buffer les erreurs avant init complète |
| **P3** | Biometric refresh-token-only = besoin d'API backend `refresh + login` flow ; vérifier que `/auth/refresh` accepte un refresh token "biometric-marked" | Vérifier backend avant impl ; sinon stocker access+refresh tokens (pas le password) avec `requireAuthentication: true` |
| **P4** | MMKV migration de clé hardcodée → SecureStore-derived = casse la lecture des données existantes | Stratégie de migration : si legacy data décodable, re-encoder ; sinon flush et accepter un "logout-like" |
| **P5** | `allowBackup` à false sur Android peut casser certains scenarios MDM en entreprise | Pour app citoyenne, OK. Documenter |
| **P6** | Sentry source maps upload via CI = besoin de config GitHub Actions + secret SENTRY_AUTH_TOKEN | Config Sentry fournit le step EAS ; si pas accès au secret, déférer V1.1 |
| **P7** | Refresh token TTL 30 → 7j = breaking pour utilisateurs actuels (déconnexion forcée) | Soft rollout : nouvelle TTL pour nouveaux tokens, anciens gardent 30j naturellement |

---

## 2. ARCHITECTURE DES CHANGEMENTS

### 2.1 Layout

```
packages/mobile/
└── src/
    ├── core/
    │   ├── logging/                       # NEW
    │   │   └── logger.ts                  # Replaces console.* in modules
    │   ├── observability/                 # NEW
    │   │   ├── sentry.ts                  # init + helpers
    │   │   └── breadcrumbs.ts
    │   ├── security/
    │   │   ├── biometric-login.ts         # MODIFIED — refresh-token-only
    │   │   ├── device-integrity.ts        # NEW — basic root/emulator check
    │   │   └── deep-link-allowlist.ts     # NEW
    │   ├── storage/
    │   │   └── mmkv.ts                    # MODIFIED — key from SecureStore
    │   └── notifications/
    │       └── deep-link-router.ts        # MODIFIED — validate path
    ├── app/
    │   ├── _layout.tsx                    # MODIFIED — Sentry init + AppLock
    │   └── settings/
    │       └── account/
    │           └── export.tsx             # NEW — RGPD art. 20
    └── components/ui/
        └── error-boundary.tsx             # MODIFIED — report to Sentry

packages/mobile/android/
└── app/src/main/
    ├── AndroidManifest.xml                # MODIFIED — allowBackup=false OR rules
    └── res/xml/
        ├── secure_store_backup_rules.xml      # NEW
        └── secure_store_data_extraction_rules.xml  # NEW

packages/backend/
└── app/modules/users/api/user_routes.py   # MODIFIED — GET /users/profile/export
└── (refresh token TTL change in app/config.py)
```

### 2.2 Décisions clés

**Sentry vs Firebase Crashlytics** : retient **Sentry**.
- Firebase Crashlytics est déjà configuré (google-services.json) mais on
  paye le runtime.
- Sentry RN gère React Error Boundaries + breadcrumbs route changes natif.
- Quota gratuit (5K events/mois) suffit V1 sur staging.
- Source-maps upload via CLI standard.

**Logger central — règles** :
- `__DEV__: true` → tout passe à `console.*`.
- `__DEV__: false` → routé vers Sentry breadcrumb si pas erreur, sinon
  `Sentry.captureException` ou drop.
- API : `logger.info(tag, msg, ctx?)`, `logger.warn(tag, msg, ctx?)`,
  `logger.error(tag, err, ctx?)`.

**Biometric refresh-token-only** :
- Stocker `{email, refresh_token}` dans SecureStore avec `requireAuthentication: true`.
- Au tap "Login biométrique" : SecureStore déclenche biométrique → on lit
  `refresh_token` → on appelle `/auth/refresh` → reçoit access+refresh new pair.
- Plus de password en clair.
- Si refresh token expiré, fallback : "Login avec mot de passe".

**MMKV key migration** :
- Stocker `mmkv_encryption_key` dans SecureStore (random 32 bytes au 1er
  launch).
- Au boot : tenter de lire la clé. Si absente, en générer une et flush
  l'ancienne MMKV (best-effort — on perd quelques préférences UI mais aucun
  secret n'y était stocké, contrat documenté).

**Android allowBackup** : passer à **`false`**. Plus simple que des règles
XML imparfaites. App citoyenne pas concernée par MDM corporate.

**Deep link path whitelist** :
- Liste explicite des paths autorisés depuis push : `payments`,
  `wizard/payment-result`, `service-requests`, `documents`, `support`,
  `notifications`, `companies`.
- Tout path hors liste → fallback `/` ou drop.

**Refresh token TTL** :
- Backend : `REFRESH_TOKEN_EXPIRE_DAYS=7` (au lieu de 30).
- À change-password : revoke all refresh_tokens du user (déjà partiellement
  fait — vérifier que c'est en place).

**RGPD data export** :
- Backend `GET /users/profile/export` async → renvoie 202 + `Location:
  /users/profile/export/{job_id}`. Job écrit JSON profil + payments + docs
  metadata dans Firebase, signe URL 24h, envoie email avec lien.
- V1 minimaliste : endpoint synchrone qui renvoie JSON profil + payments
  list + service requests list (pas de PDF, pas de docs vault metadata —
  reporté V2).

---

## 3. CHECKLIST ATOMIQUE PHASE 9

### 9.1 npm audit fix (~0.5j)

- [ ] **9.1.1** `npm audit fix` (sans `--force`) — bump xmldom, axios,
      brace-expansion, follow-redirects sans toucher aux majors Expo
- [ ] **9.1.2** Vérifier `npm audit` post-fix : viser HIGH=0
- [ ] **9.1.3** Pour markdown-it (no fix avail) : auditer si `react-native-markdown-display` est utilisé en prod — si oui, sandbox le rendering
- [ ] **9.1.4** `tsc + ESLint + npx expo install --check` (alignement SDK)
- [ ] **9.1.5** Test mount basic (sign-in screen) en metro pour confirmer pas de regression

### 9.2 Sentry RN intégration (~1j)

- [ ] **9.2.1** `npx expo install @sentry/react-native`
- [ ] **9.2.2** `core/observability/sentry.ts` : `Sentry.init({dsn, environment, tracesSampleRate: 0.1, beforeSend})`
- [ ] **9.2.3** `_layout.tsx` : init Sentry derrière `useDeferredAfterInteractions`
- [ ] **9.2.4** Wrapper `<Sentry.ErrorBoundary>` au-dessus de `<ErrorBoundary>` existant pour capture
- [ ] **9.2.5** `Sentry.setUser({id, role, locale})` au login + `Sentry.setUser(null)` au logout — pas de PII (email, phone exclus)
- [ ] **9.2.6** Breadcrumbs auto Expo Router (route changes) + manuels sur API errors via axios interceptor
- [ ] **9.2.7** `EXPO_PUBLIC_SENTRY_DSN` dans `.env` + `.env.production` (placeholder, secret à fournir)
- [ ] **9.2.8** Source-maps upload : config `sentry.properties` + step EAS post-build (best-effort, à finaliser quand DSN fourni)

### 9.3 Logger central (~0.5j)

- [ ] **9.3.1** `core/logging/logger.ts` : 4 méthodes (`debug`/`info`/`warn`/`error`) avec routing dev/prod + Sentry
- [ ] **9.3.2** Remplacer `console.warn/log/error` dans :
  - `chatbot-api.ts`, `notifications/hooks/*`, `auth-provider.tsx`,
  - `wizard-hooks.ts`, autres trouvés via grep `console\.`
- [ ] **9.3.3** ESLint rule `no-console` activée (avec exceptions sur logger.ts + scripts)

### 9.4 Biometric refresh-token-only (S1) (~0.5j)

- [ ] **9.4.1** Vérifier que `/auth/refresh` accepte un refresh token isolé (pas de session active requise)
- [ ] **9.4.2** Refactor `biometric-login.ts` :
  - `saveBiometricCredentials({email, refreshToken})` — pas de password
  - `setItemAsync(KEY, val, {requireAuthentication: true, authenticationPrompt})` — passe les opts
- [ ] **9.4.3** Au tap "Login biométrique" : lire refresh token (déclenche biométrique) → call `/auth/refresh` → set access+refresh + setUser context
- [ ] **9.4.4** Migration data : si l'ancien `email + password` est trouvé, l'effacer et demander re-auth
- [ ] **9.4.5** Update `app/settings/biometric.tsx` pour le flow refresh-token-only

### 9.5 MMKV key SecureStore-derived (S4) (~0.5j)

- [ ] **9.5.1** `core/storage/mmkv.ts` : remplacer `'facil-mmkv-key'` par `getOrCreateMmkvKey()` (lit/écrit dans SecureStore)
- [ ] **9.5.2** `getOrCreateMmkvKey` async — au 1er launch, génère 32 bytes random via `expo-crypto`, stocke dans SecureStore, retourne
- [ ] **9.5.3** Boot order : init MMKV après SecureStore lecture (probablement async dans `_layout.tsx`)
- [ ] **9.5.4** Migration : si legacy MMKV décodable avec ancien clé, lire valeurs → flush → ré-écrire avec nouvelle clé. Sinon flush silencieux

### 9.6 Android backup rules (S2) (~0.25j)

- [ ] **9.6.1** Modifier `android/app/src/main/AndroidManifest.xml` : `android:allowBackup="false"`
- [ ] **9.6.2** Retirer les références aux XMLs inexistants (`fullBackupContent`, `dataExtractionRules`)
- [ ] **9.6.3** Documenter dans le commit que ce changement empêche le backup ADB des données app, conforme au profil sécurité d'une app citoyenne

### 9.7 Deep link path whitelist (S8) (~0.25j)

- [ ] **9.7.1** `core/security/deep-link-allowlist.ts` — exporte `ALLOWED_DEEP_LINK_PREFIXES: readonly string[]`
- [ ] **9.7.2** Modifier `core/notifications/deep-link-router.ts:routeFromPayload()` : valider le path avant `router.push`. Tout chemin hors liste → fallback `/(tabs)` ou drop avec breadcrumb
- [ ] **9.7.3** Idem pour les query params : valider UUID quand attendu (pattern déjà appliqué P5.7 sur payments — étendre)

### 9.8 Refresh token TTL backend (S6) (~0.25j backend)

- [ ] **9.8.1** Vérifier `app/config.py` : `REFRESH_TOKEN_EXPIRE_DAYS=30` → `7`
- [ ] **9.8.2** Vérifier que `POST /users/profile/change-password` revoke tous les refresh_tokens du user (pattern audit `change-password` event handler — déjà partiellement fait selon code review)
- [ ] **9.8.3** Pas de migration BD nécessaire — les tokens existants restent valides 30j naturellement, les nouveaux ont 7j

### 9.9 Device integrity check (S5) (~0.5j)

- [ ] **9.9.1** `core/security/device-integrity.ts` : check `Device.isDevice` (rejette emulator), check basic Frida indicators (process name patterns), check root indicators Android (`/system/xbin/su` accessibility via `expo-file-system` is limited)
- [ ] **9.9.2** Au boot post-auth : si rejected, log à Sentry + show banner "Appareil non sécurisé" non-bloquant (V1 informatif uniquement)
- [ ] **9.9.3** Document : ce check est une **defense-in-depth**, pas une protection forte. Un attaquant déterminé bypasse trivialement

### 9.10 RGPD data export (R2) (~1j)

- [ ] **9.10.1** Backend `GET /users/profile/export` : agrégation profil + payments + service_requests + audit_logs derniers 90j → JSON complet, response 200 avec content-disposition attachment
- [ ] **9.10.2** Test pytest sur l'agrégation (ownership check, taille raisonnable)
- [ ] **9.10.3** Mobile `app/settings/account/export.tsx` : bouton "Demander mon export" → `apiGet` → `expo-file-system.writeAsStringAsync` → `Sharing.shareAsync(uri)` pour partager le JSON
- [ ] **9.10.4** Lien depuis profile screen sous "Mes données"
- [ ] **9.10.5** i18n × 3 langues

### 9.11 Validation finale + critique + commits (~0.5j)

- [ ] **9.11.1** `tsc --noEmit` 0 erreur
- [ ] **9.11.2** ESLint sous 100 warnings + nouvelle rule `no-console` activée
- [ ] **9.11.3** `npm audit` HIGH=0
- [ ] **9.11.4** Smoke tests staging (Sentry capture exception synthétique + RGPD export)
- [ ] **9.11.5** Aucune régression P0..P8
- [ ] **9.11.6** `MOBILE_USER_PHASE_9_CRITIQUE.md`
- [ ] **9.11.7** Commits sémantiques groupés (par sous-phase)

---

## 4. CRITÈRES DE VALIDATION (DoD Phase 9)

| # | Critère | Méthode |
|---|---------|---------|
| V1 | npm audit HIGH=0 | `npm audit` |
| V2 | Sentry capture exception synthétique → dashboard | Test manuel staging |
| V3 | Aucun console.* en prod (sauf logger.ts) | grep |
| V4 | Biometric login fonctionne sans stocker password | Test device |
| V5 | MMKV clé chiffrement dérivée SecureStore | Code review |
| V6 | Android allowBackup=false | Manifest |
| V7 | Deep link path hors whitelist → fallback | Test simulé |
| V8 | Refresh token TTL backend = 7j | config.py |
| V9 | Device integrity check loggé en cas root/emulator | Test simulé |
| V10 | RGPD export fonctionne (JSON téléchargé) | Test device staging |
| V11 | tsc 0 erreur, ESLint < 100 | CI |
| V12 | Auto-critique livrée | Fichier |
| V13 | Commits sémantiques | git log |

---

## 5. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| `npm audit fix` casse Expo SDK 54 alignment | MOYENNE | HAUT | `--no-force` + `npx expo install --check` post-fix |
| Sentry init bloque le boot | FAIBLE | MOYEN | Init dans `runAfterInteractions` |
| Biometric refresh flow casse les utilisateurs actuels | MOYENNE | MOYEN | Fallback explicite "Login mot de passe" + clear ancienne data |
| MMKV migration perd les préférences UI | FAIBLE | FAIBLE | Best-effort migration ; doc dit "MMKV pas pour secrets" |
| Refresh TTL 30j → 7j = users actifs forcés à se reconnecter chaque semaine | MOYENNE | MOYEN | UX acceptable pour app fiscale 1M users (sécurité > confort) |
| Sentry DSN absent → init no-op (pas de capture) | CERTAINE V1 | FAIBLE | Init guard sur DSN présent — utiliser uniquement quand utilisateur fournit |
| RGPD export performance (1M users requests + payments lourd) | FAIBLE | MOYEN | V1 limit 90j, pagination si > 1000 items |

---

## 6. HORS SCOPE V1 — explicitement reporté

1. **M5 SSL Certificate Pinning (`expo-ssl-pinning`)** — Cloud Run cert
   change parfois ; rotation manuelle complexe. V1.1 quand TLS topology stable.
2. **M7 Anti-tampering binaire** — gros chantier (`react-native-jail-monkey` +
   custom). Defense-in-depth, pas first-line. V2.
3. **M10 Crypto custom** — déjà OK, aucun crypto custom dans le code (BCrypt
   via backend, AES via expo-crypto).
4. **Pen-test interne** — externe, à organiser séparément.
5. **Source-maps upload via EAS** — dépend du DSN Sentry fourni par l'utilisateur.

---

## 7. RECOMMANDATION PUSH

Ordre d'exécution recommandé :
1. **9.1** npm audit (push isolé pour valider CI)
2. **9.6** Android backup (push avec 9.1 — petit changement infra)
3. **9.8** Backend TTL (push isolé backend)
4. **9.2 + 9.3** Sentry + logger (push ensemble)
5. **9.4** Biometric refactor (push avec test smoke local)
6. **9.5** MMKV key migration
7. **9.7** Deep link whitelist
8. **9.9** Device integrity
9. **9.10** RGPD export (backend + mobile)
10. Critique + push final

Demander confirmation utilisateur avant chaque push remote (mémoire #13).

---

## 8. NEXT — Après Phase 9

P10 = E2E Maestro/Detox + App Stores (5j). Aucune dépendance bloquante avec P9.

---

## 9. CHANGELOG

- **2026-04-27 v1.0** : créé en convergence avec MOBILE_HOLISTIC_AUDIT_2026_04_27.md.
  Items déjà faits par les phases précédentes exclus pour éviter duplication.
  M5 SSL pinning + M7 anti-tampering reportés explicitement.
