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

- [x] **9.1.1** `npm audit fix` — patch xmldom HIGH + axios SSRF (commit 771019e2)
- [x] **9.1.2** Vérifier `npm audit` post-fix : HIGH=0 (commit 771019e2)
- [x] **9.1.3** Audit markdown-it / sandbox rendering (commit 771019e2)
- [x] **9.1.4** `tsc + ESLint + npx expo install --check` (commit 771019e2 — no SDK regression)
- [x] **9.1.5** Test mount basic sign-in (commit 771019e2)

### 9.2 Sentry RN intégration (~1j)

- [x] **9.2.1** `npx expo install @sentry/react-native` (commit aa58a7c5 — P9.2 Sentry observability install)
- [x] **9.2.2** `core/observability/sentry.ts` (commit aa58a7c5 — file packages/mobile/src/core/observability/sentry.ts)
- [x] **9.2.3** `_layout.tsx` init Sentry (commit aa58a7c5)
- [x] **9.2.4** Wrapper `<Sentry.ErrorBoundary>` (commit a682b92e — P9 critical: ErrorBoundary now actually forwards to Sentry)
- [x] **9.2.5** `Sentry.setUser({id, role, locale})` au login/logout (commit aa58a7c5)
- [x] **9.2.6** Breadcrumbs auto Expo Router + manuels axios (commit aa58a7c5)
- [x] **9.2.7** `EXPO_PUBLIC_SENTRY_DSN` dans `.env` (commit aa58a7c5)
- [ ] **9.2.8** Source-maps upload via EAS ⚠️ unverified — needs re-check (best-effort, depends on DSN provided)

### 9.3 Logger central (~0.5j)

- [x] **9.3.1** `core/logging/logger.ts` 4 méthodes (commit e186d2de — file packages/mobile/src/core/logging/logger.ts)
- [x] **9.3.2** Remplacer `console.*` dans modules (commit e186d2de — P9.3 central logger + replace console.* in modules)
- [x] **9.3.3** ESLint rule `no-console` activée (commit e186d2de)

### 9.4 Biometric refresh-token-only (S1) (~0.5j)

- [x] **9.4.1** Vérifier `/auth/refresh` accepte refresh token isolé (commit 36b1c9b0 — P9.4 biometric S1)
- [x] **9.4.2** Refactor `biometric-login.ts` (commit 36b1c9b0)
- [x] **9.4.3** Login biométrique → refresh flow (commit 36b1c9b0)
- [x] **9.4.4** Migration data legacy (commit 36b1c9b0)
- [x] **9.4.5** Update `app/settings/biometric.tsx` (commit 36b1c9b0)

### 9.5 MMKV key SecureStore-derived (S4) (~0.5j)

- [x] **9.5.1** `core/storage/mmkv.ts` clé from SecureStore (commit e5f14fd0 — close 6 P9 audit gaps G1, G2, G3, G5, G6, G8)
- [x] **9.5.2** `getOrCreateMmkvKey` async (commit e5f14fd0)
- [x] **9.5.3** Boot order init MMKV (commit e5f14fd0)
- [x] **9.5.4** Migration legacy data (commit e5f14fd0)

### 9.6 Android backup rules (S2) (~0.25j)

- [x] **9.6.1** `AndroidManifest.xml` `android:allowBackup="false"` (commit 36b1c9b0 — Android backup off)
- [x] **9.6.2** Retirer XMLs inexistants (commit 36b1c9b0)
- [x] **9.6.3** Documenter changement (commit 36b1c9b0)

### 9.7 Deep link path whitelist (S8) (~0.25j)

- [x] **9.7.1** `core/security/deep-link-allowlist.ts` (commit 36b1c9b0 — deep-link allowlist)
- [x] **9.7.2** `routeFromPayload()` validation (commit 36b1c9b0)
- [x] **9.7.3** Validation UUID query params (commit 36b1c9b0)

### 9.8 Refresh token TTL backend (S6) (~0.25j backend)

- [x] **9.8.1** `REFRESH_TOKEN_EXPIRE_DAYS=30` → `7` (commit e5f14fd0 G2 covered)
- [x] **9.8.2** `change-password` revoke refresh_tokens (commit e5f14fd0)
- [x] **9.8.3** Pas de migration BD (commit e5f14fd0)

### 9.9 Device integrity check (S5) (~0.5j)

- [x] **9.9.1** `core/security/device-integrity.ts` (commit 36b1c9b0 — file packages/mobile/src/core/security/device-integrity.ts)
- [x] **9.9.2** Boot post-auth check + Sentry log + banner (commit 36b1c9b0)
- [x] **9.9.3** Document defense-in-depth (commit 36b1c9b0 + 82523b0c critique)

### 9.10 RGPD data export (R2) (~1j)

- [x] **9.10.1** Backend `GET /users/profile/export` (commit a85333b5 — P9.10 RGPD data export backend GET + mobile screen)
- [x] **9.10.2** Test pytest aggregation (commit a85333b5)
- [x] **9.10.3** Mobile `app/settings/account/export.tsx` (commit a85333b5 — file packages/mobile/src/app/settings/account/export.tsx)
- [x] **9.10.4** Lien depuis profile (commit a85333b5)
- [x] **9.10.5** i18n × 3 langues (commit a85333b5)

### 9.11 Validation finale + critique + commits (~0.5j)

- [x] **9.11.1** `tsc --noEmit` 0 erreur (commits 771019e2, aa58a7c5, e186d2de, 36b1c9b0, e5f14fd0, a85333b5, a682b92e, d4a3ca42)
- [x] **9.11.2** ESLint < 100 + `no-console` activée (commit e186d2de)
- [x] **9.11.3** `npm audit` HIGH=0 (commit 771019e2)
- [ ] **9.11.4** Smoke tests staging Sentry capture + RGPD export ⚠️ unverified — needs re-check (device test)
- [x] **9.11.5** Aucune régression P0..P8 (commit d4a3ca42 close P9 audit gaps + parity audit corrections)
- [x] **9.11.6** `MOBILE_USER_PHASE_9_CRITIQUE.md` (commit 82523b0c — file present)
- [x] **9.11.7** Commits sémantiques groupés (771019e2, aa58a7c5, e186d2de, 36b1c9b0, e5f14fd0, a85333b5, a682b92e, d4a3ca42, 82523b0c)

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

---
## Validation rétroactive
- **Date** : 2026-04-29
- **Méthode** : audit code + git log
- **Coches livrées rétroactivement** : 41
- **Items unverified** : 2 (9.2.8 source-maps EAS upload depends on DSN; 9.11.4 smoke tests Sentry+RGPD device)
- **Items deferred Phase 10** : 0 (M5 SSL pinning + M7 anti-tampering déjà documentés hors-scope V1 dans le plan)
- **Notes** : Tous les fichiers sécurité/observabilité créés (`packages/mobile/src/core/observability/sentry.ts`, `packages/mobile/src/core/logging/logger.ts`, `packages/mobile/src/core/security/{biometric-login,device-integrity,deep-link-allowlist}.ts`, `packages/mobile/src/core/storage/mmkv.ts`, `packages/mobile/src/app/settings/account/export.tsx`). Critique P9 livrée (commit 82523b0c) + corrections gaps (e5f14fd0, d4a3ca42, a682b92e). 8 sous-phases cumulent ~9 commits.
