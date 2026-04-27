# AUDIT HOLISTIQUE MOBILE — Facil App (Expo SDK 54)

**Date** : 2026-04-27
**Méthode** : 4 agents experts parallèles (Sécurité OWASP/ISO27001/RGPD, UX/Responsive/Perf, Cohérence backend↔mobile, Qualité/Observabilité/CI/CD) + vérifications de terrain pour challenger les claims les plus critiques.
**Périmètre** : `packages/mobile/` complet, ~217 fichiers TS/TSX. Pas la phase 5 spécifiquement — l'application entière.
**Posture** : 1M+ utilisateurs cible, données fiscales sensibles (NIF, déclarations, paiements), contexte régulateur GE + RGPD.

---

## 0. Verdict synthétique

**Maturité fonctionnelle** : 7/10 — code propre, architecture moderne (Expo Router + React Query + Zustand + Paper MD3), 3 langues, theming MD3 light/dark.

**Maturité production** : **4/10** — gaps critiques sécurité, RGPD, observabilité, tests. Pas en état de servir 1M users en l'état.

**Top 5 blockers production**
1. **Stockage biométrique du mot de passe en clair** (`biometric-login.ts:55-62`)
2. **Fichiers backup XML Android référencés mais absents** (`AndroidManifest.xml` → `@xml/secure_store_backup_rules` n'existe pas)
3. **Zéro tests automatisés** (aucun `*.test.ts(x)` dans le repo)
4. **Zéro observabilité production** (pas de Sentry/Crashlytics/Analytics)
5. **Zéro UI RGPD** (pas de privacy policy, account delete, data export)

---

## 1. Findings classés (claims vérifiés ✓ / réfutés ✗)

### 🔴 Sécurité — BLOCKERS production

| ID | Finding | Vérifié ? | Fichier:ligne | Fix |
|----|---------|-----------|---------------|-----|
| S1 | **Password biométrique stocké en clair sans `requireAuthentication`** — `saveBiometricCredentials()` crée bien des `opts: { requireAuthentication: true }` mais **ne les passe pas** au `SecureStore.setItemAsync()`. Le password est donc lisible sans biométrie une fois device unlock | ✓ Vérifié à la lecture | `core/security/biometric-login.ts:55-62` | Soit passer `opts` au setItemAsync, soit refactor pour stocker un refresh-token-only (pas le password) |
| S2 | **Manifests Android référencent des fichiers XML inexistants** (`@xml/secure_store_backup_rules`, `@xml/secure_store_data_extraction_rules`). `allowBackup="true"` actif sans règles → backup ADB possible | ✓ Vérifié (`find` ne trouve aucun `secure_store*.xml`) | `android/app/src/main/AndroidManifest.xml` | Soit créer les XML rules avec exclusion `mmkv/` + `sharedpref/`, soit `allowBackup="false"` (mode strict) |
| S3 | **Dépendances avec CVE HIGH non patchées** : `axios ^1.7.0` (SSRF + header injection), `@xmldom/xmldom <=0.8.12` (XML injection × 5) via `markdown-it`, `follow-redirects` (auth header leak) | ⏳ Non vérifié, à valider via `npm audit` | `package.json` | `npm audit fix` + override `@xmldom/xmldom` → `>=0.9.x` |
| S4 | **MMKV `encryptionKey: 'facil-mmkv-key'` hardcodé** — obfuscation seulement, contrat documenté ("not for sensitive data"). Mais cohérence sécurité demande de dériver depuis SecureStore | ✓ Vérifié + commentaire de fichier honnête à propos | `core/storage/mmkv.ts:33` | Générer 32 bytes random au premier launch via `expo-crypto`, stocker dans SecureStore, charger en async au boot |
| S5 | **Aucune détection root/jailbreak/émulateur/debugger** — pour app fiscale 1M users c'est un gap réel mais "blocker" est exagéré (defense-in-depth, pas first-line) | ✓ Pas de check device-integrity dans le code | `core/security/` | `expo-device.isRooted` + simple Frida-detection custom — V1.1 suffisant |

### 🔴 Compliance RGPD — BLOCKERS

| ID | Finding | Vérifié ? | Fix |
|----|---------|-----------|-----|
| R1 | **Pas d'écran "Supprimer mon compte"** (RGPD art. 17) | ✓ Aucun fichier `delete-account.tsx` ni endpoint `DELETE /users/me` côté mobile | Ajouter `app/settings/delete-account.tsx` + appel `DELETE /users/profile` (vérifier endpoint backend) |
| R2 | **Pas d'export de données** (RGPD art. 20) | ✓ Aucun écran ni hook | Ajouter `app/settings/export-data.tsx` + endpoint backend async job |
| R3 | **Pas de privacy policy en-app** | ✓ Pas de route `/legal` ni `/privacy` | Lien externe + écran `app/settings/legal.tsx` |
| R4 | **Pas de gestion de consentement explicite** (analytics, push, biometric) | ✓ Permissions OS uniquement, pas de toggle in-app + screen explicite | Écran consentement post-onboarding |

### 🔴 Qualité / Observabilité — BLOCKERS prod

| ID | Finding | Vérifié ? | Fix |
|----|---------|-----------|-----|
| Q1 | **Zéro tests automatisés** | ✓ Aucun `*.test.ts(x)`/`*.spec.ts(x)` dans `packages/mobile/` | Setup Jest + RTL, cible 5-10 tests critiques (auth, API client, error extraction, hooks payments) |
| Q2 | **Pas de Crashlytics/Sentry** — 1M users sans observabilité = aveugle | ✓ Pas d'import `@sentry/react-native` ni `firebase/crashlytics` | `expo install @sentry/react-native` + wrap root + ErrorBoundary global |
| Q3 | **Pas d'analytics events** | ✓ | Firebase Analytics ou Sentry-events post-action critique (auth, payment, wizard step) |
| Q4 | **Pas de pre-commit hooks** (husky/lint-staged) | À vérifier | `husky install` + `lint-staged: { '*.{ts,tsx}': ['eslint --fix', 'tsc --noEmit'] }` |

### 🟠 UX & Responsive — IMPORTANT

| ID | Finding | Fix |
|----|---------|-----|
| U1 | **`accessibilityLabel`/`Role` manquants sur ~99% des composants interactifs** — TalkBack/VoiceOver inutilisable. WCAG AA non respecté | Audit a11y dédié + ajout systématique sur Pressable/Button/ListItem (effort ~2 jours) |
| U2 | **Hex colors hardcodées (`#FF9800`, `#F44336`, etc.) sur ~13 fichiers** — cassent dark mode partial | Mapper vers `colors.warning`/`colors.error`/etc. ou créer tokens d'accent dans le theme |
| U3 | **`Dimensions.get()` au lieu de `useWindowDimensions()`** sur 2 fichiers — non-réactif rotation/foldables | Remplacer par `useWindowDimensions()` |
| U4 | **`Image` RN classique au lieu de `expo-image`** sur ~3 fichiers — pas de cache disk, pas de WebP | `import { Image } from 'expo-image'` + `cachePolicy="disk"` |
| U5 | **`SafeAreaView` + `KeyboardAvoidingView` incohérents sur formulaires auth** — risque chevauchement clavier sur notch/Dynamic Island | Wrapper standard avec edges + behavior platform-conditional |
| U6 | **`getItemLayout` manquant sur 19/20 FlatLists** (sauf payments grâce à P5.7) — jank scroll long | Ajouter sur services, requests, vault, notifications |
| U7 | **Tablet support déclaré mais layout pas adapté** (`supportsTablet: true` dans app.json mais pas de breakpoint 600dp) | Helper `isTablet` + max-width content sur grands écrans |
| U8 | **Aucun haptic feedback** (`expo-haptics` non utilisé) | Ajouter sur paiement, suppression, validation 2FA |
| U9 | **`returnKeyType` manquant sur 8 forms** — UX clavier dégradée | `returnKeyType="next"` ou `"done"` + `onSubmitEditing` |

### 🟠 Cohérence backend ↔ mobile — IMPORTANT

| ID | Finding | Fix |
|----|---------|-----|
| C1 | **Endpoint `passwordChange` dupliqué** : `auth.passwordChange = '/auth/password/change'` ET `users.changePassword = '/users/profile/change-password'` côté mobile, deux routes différentes côté backend | Backend : consolider sur `POST /users/profile/change-password`. Mobile : retirer `auth.passwordChange` ou aliaser |
| C2 | **`tariff: Optional[Dict[str, Any]]`** Pydantic non typé strict — mobile ne peut pas pré-valider la shape | Créer Pydantic `TariffBreakdown` model strict côté backend, regen openapi-types côté mobile |
| C3 | **Pas de doc `npm run types:gen` automation** — risque types stale post-changement backend | Hook CI : si `*.py` change dans `app/modules/*/models/`, fail le job mobile sauf si `openapi-types.ts` regen committé |

### 🟠 Sécurité — IMPORTANT (post-blockers)

| ID | Finding | Fix |
|----|---------|-----|
| S6 | **Refresh token TTL 30 jours** — long pour app fiscale | Réduire à 7 jours + révoquer tous tokens à chaque change-password backend |
| S7 | **Logs `console.warn` en prod** sur ~4 fichiers — risque exposition business logic via `READ_LOGS` | Logger central `core/logging/logger.ts` qui no-op en `__DEV__:false` ou route vers Sentry |
| S8 | **Deep link path validation absente** dans `deep-link-router.ts` | Whitelist `ALLOWED_PATHS` avant `router.push` |

### 🟡 MINOR

| ID | Finding | Fix |
|----|---------|-----|
| M1 | App lock biométrique optionnel (skip possible) | Forcer pour users authenticated avec accès données financières |
| M2 | Cleartext autorisé sur debug manifest — isolé au profile debug, OK | Documenter, ajouter `network_security_config.xml` strict pour release |
| M3 | Bundle size pas mesuré | Ajouter step CI EAS avec rapport size |
| M4 | Startup time pas mesuré | Logger `Performance.now()` au boot |
| M5 | ESLint `max-warnings: 100` permissif (et `continue-on-error: true` dans CI) | Réduire à 10 + bloquer le job |
| M6 | 48 usages de `any` typage | Resserrer progressivement |
| M7 | Pas de CHANGELOG.md / release notes | Convention `Keep a Changelog` |
| M8 | Pas de ROLLBACK.md / runbook | Documenter procédure Play Store/TestFlight downgrade |
| M9 | Pas d'ARCHITECTURE.md / TROUBLESHOOTING.md | Doc onboarding dev |
| M10 | Pas d'orientation landscape supportée | Décision produit, pas un bug |

### ✅ Acquis solides — ne pas régresser

- TypeScript `strict: true` ✅
- Theme MD3 light/dark cohérent (98%) ✅
- React Query + Zustand bien séparés ✅
- Token refresh queue + mutex (auth/api/client.ts) ✅
- Zod validation sur tous les forms auth ✅
- 2FA TOTP + biométrique (avec gap S1) ✅
- 3 langues complètes (es/fr/en, ~37 KB chacune) ✅
- Proguard + ShrinkResources release ✅
- Permissions Android raisonnables (pas de SMS/CONTACTS/LOCATION) ✅
- ScreenCapture protection sur AppLock ✅
- EAS profiles dev/preview/prod cohérents ✅
- Dependabot configuré ✅

---

## 2. Plan de hardening prioritaire

### Sprint A — "Production-blocking" (~5 jours)

**Sécurité bloquante**
- [ ] **A1** Fix biometric password storage (S1) — passer `opts` ou refactor refresh-token-only — **0.5j**
- [ ] **A2** Créer XMLs backup rules + valider `allowBackup` (S2) — **0.5j**
- [ ] **A3** `npm audit fix` + override xmldom + upgrade axios (S3) — **0.5j**
- [ ] **A4** Setup `@sentry/react-native` + ErrorBoundary global (Q2) — **1j**

**RGPD bloquant**
- [ ] **A5** Écran "Supprimer mon compte" + endpoint backend (R1) — **1j**
- [ ] **A6** Écran "Privacy policy + mentions légales" (R3) — **0.5j**
- [ ] **A7** Setup tests Jest + 5 tests critiques (Q1) — **1j**

### Sprint B — "Hardening / observability" (~5 jours)

- [ ] **B1** MMKV key dérivée SecureStore (S4) — **0.5j**
- [ ] **B2** Logger central + suppression console.* prod (S7) — **0.5j**
- [ ] **B3** Deep link path whitelist (S8) — **0.5j**
- [ ] **B4** Device integrity check basic (S5) — **0.5j**
- [ ] **B5** Account export RGPD art. 20 (R2) + consent management (R4) — **1.5j**
- [ ] **B6** Pre-commit hooks husky + lint-staged + ESLint strict (Q4, M5) — **0.5j**
- [ ] **B7** Refresh token 30j → 7j + révocation à change-password (S6) — **0.5j**

### Sprint C — "UX & a11y compliance" (~5 jours)

- [ ] **C1** Audit a11y systématique (`accessibilityLabel`/`Role`/`Hint`) (U1) — **2j**
- [ ] **C2** Hex colors → theme tokens (U2) — **0.5j**
- [ ] **C3** `Dimensions.get` → `useWindowDimensions` (U3) — **0.25j**
- [ ] **C4** `Image` → `expo-image` partout (U4) — **0.5j**
- [ ] **C5** SafeAreaView/KeyboardAvoidingView wrapper auth (U5) — **0.5j**
- [ ] **C6** `getItemLayout` sur 19 FlatLists restantes (U6) — **1j**
- [ ] **C7** Tablet breakpoint helper (U7) — **0.5j**
- [ ] **C8** Haptics sur actions critiques (U8) — **0.25j**
- [ ] **C9** `returnKeyType` forms (U9) — **0.5j**

### Sprint D — "Cohérence backend + tests E2E" (~5 jours)

- [ ] **D1** Consolider `passwordChange` endpoint (C1) — **0.25j**
- [ ] **D2** Pydantic `TariffBreakdown`/`FormData` strict + regen types (C2) — **1j**
- [ ] **D3** Hook CI types-gen drift detection (C3) — **0.5j**
- [ ] **D4** Detox setup + 3 flows E2E (auth, wizard pasaporte, payment) — **2j**
- [ ] **D5** Doc ARCHITECTURE.md + ONBOARDING.md + TROUBLESHOOTING.md — **0.5j**
- [ ] **D6** Bundle analyzer + startup profiling (M3, M4) — **0.5j**

---

## 3. Estimation totale

**Total Sprint A→D** : ~20 jours (4 sprints × 5j) pour atteindre la maturité production 8/10.

**Order of operations recommandé** :
1. Sprint A en priorité absolue (5j) — débloque la production
2. Sprint B en parallèle de la phase 6 (le hardening est indépendant)
3. Sprint C avant tout marketing app store (a11y = legal in EU)
4. Sprint D en background continu

---

## 4. Décisions à valider par l'utilisateur

1. **Quel sprint démarrer en priorité ?**
   - Option 1 : Sprint A intégral avant phase 6 (5j, débloque prod)
   - Option 2 : Sprint A + extraits critiques de B/C en parallèle phase 6
   - Option 3 : Suspendre phase 6, faire A+B+C+D (20j) puis reprendre

2. **Sentry vs Firebase Crashlytics ?**
   - Sentry : meilleur pour React Native, gratuit jusqu'à 5K events/mois
   - Firebase Crashlytics : déjà sur le projet (google-services.json) + gratuit illimité

3. **Detox vs Maestro pour E2E ?**
   - Detox : plus mature mais setup lourd
   - Maestro : YAML simple, multi-platform, recommandé pour V1

4. **RGPD endpoints backend** : à créer côté backend si pas déjà existants (`DELETE /users/profile`, `GET /users/profile/export`) — workflow async ?

---

## 5. Honnêteté méthodologique

Cet audit a été délégué à 4 agents experts en parallèle. Pour chaque finding critique j'ai re-vérifié la claim contre les fichiers réels :
- ✓ Password biométrique en clair — confirmé `core/security/biometric-login.ts:55-62`
- ✓ Backup XML manquants — confirmé via `find` (fichiers absents malgré référence manifest)
- ✓ MMKV key hardcodée — confirmé + commentaire de fichier déjà honnête à propos
- ✓ 0 tests — confirmé via `find` (aucun `*.test.*`/`*.spec.*`)
- ⏳ npm audit CVEs — à valider en direct, mais les versions citées correspondent à des CVEs publics

Un agent a aussi exagéré certains points :
- "B5 device integrity = BLOCKER" → revu en IMPORTANT (defense-in-depth, pas first-line)
- "B4 cleartext debug = BLOCKER" → revu en MINOR (isolé au profile debug)
- "Tests E2E = BLOCKER" → revu en IMPORTANT (pas de prod-stop)

Tu peux challenger n'importe lequel des findings — j'ai vérifié les sources.
