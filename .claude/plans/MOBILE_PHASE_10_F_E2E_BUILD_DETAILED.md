# PHASE F — Tests E2E + Build AAB v1.0.0 + Internal Testing (Plan détaillé)

**Date** : 2026-05-02
**Phase parent** : `MOBILE_PHASE_10_PUBLISH_PLAYSTORE_MASTER.md`
**Sortie attendue** : AAB v1.0.0 production buildée sur EAS Cloud, soumise sur Play Console Internal Testing track, soft-launch monitoring 5-7 jours.
**Cible time** : 1-2j travail effectif + 5-7j monitoring soft-launch
**Branche** : `develop`

---

## 1. CONTEXTE & ÉTAT ACTUEL

Phases A→E livrées localement (18 commits non-poussés depuis `8025b139`). Phase F = mise en production du premier AAB Play Store.

### 1.1 Audit pré-build (vérifié 2026-05-02)

**`packages/mobile/app.json`** :
- ✅ `version`: `1.0.0`
- ✅ `bundleIdentifier` iOS: `com.taxasge.app`
- ✅ `package` Android: `com.taxasge.app`
- ✅ Sentry plugin wired (`@sentry/react-native/expo`)
- ✅ ProGuard + Shrink resources enabled
- ✅ `minSdkVersion` 25 (Logrocket compatibility)

**`packages/mobile/eas.json`** :
- ✅ `production.android.buildType: app-bundle` (AAB output)
- ✅ `production.android.gradleCommand`: `:app:bundleRelease -Pandroid.enableMinifyInReleaseBuilds=true`
- ✅ `autoIncrement: true` → versionCode auto-incrémenté par EAS Cloud
- ✅ `production.env.EXPO_PUBLIC_ENV: production` (Phase D)
- ✅ `submit.production.android.serviceAccountKeyPath: ./google-play-service-account.json`
- ✅ `submit.production.android.track: internal` (Internal Testing par défaut)

**EAS env vars production** (vérifié `eas env:list --environment=production`) :
- ✅ `LOGROCKET_APP_ID = 0eqns2/facil`
- ✅ `SENTRY_AUTH_TOKEN` (encrypted, sourcemap upload)
- ✅ `EXPO_PUBLIC_SENTRY_DSN = https://545e238a28bb686af83335...sentry.io/4511293911531521` (**ajouté Phase F.2 — était manquant**)

**GitHub Secrets** (`gh secret list`) :
- ✅ `EXPO_TOKEN` (Phase 9.2)
- ✅ `SENTRY_AUTH_TOKEN` (Phase 9.2)
- ✅ `LOGROCKET_APP_ID` (Phase 9.4)
- ✅ `ANDROID_KEYSTORE_BASE64` + `ANDROID_KEYSTORE_PASSWORD` (Phase 9.0)
- ✅ `GOOGLE_PLAY_SA_JSON_BASE64` (Phase D — créé 2026-05-05 23:54)

**GCP Secret Manager** :
- ✅ `expo-token`, `sentry-auth-token`, `logrocket-app-id`, `database-url` (anciens)
- ✅ `google-play-service-account` v1 (Phase D)
- ✅ `sentry-dsn-mobile` v1 (**créé Phase F.2**)

**Workflows GitHub Actions** :
- ✅ `mobile-build.yml` (CI native sur runner GitHub) — déclenchée à chaque push `packages/mobile/**`
- ✅ `mobile-eas-build.yml` (EAS Cloud) — déclenchée sur tag `v*.*.*` → AAB production
- ✅ `mobile-eas-submit.yml` (Phase D — NEW) — déclenchée sur workflow_run réussi du build OU manual dispatch
- ✅ `deploy-backend-staging.yml` — déclenchée à chaque push `packages/backend/**` (déploiera Phase B legal endpoints)

**EAS Build credits** : 30/mois free tier — utilisé 2 ce mois-ci (pre-Phase F), reste **~28 disponibles**

### 1.2 Préalables externes (action user manuelle — voir `MOBILE_PHASE_10_USER_MANUAL_ACTIONS.md`)

| # | Action | Statut | Bloquant |
|---|--------|--------|----------|
| A.1 | Fiche app `com.taxasge.app` créée Play Console | ⏳ user manuel | Oui (sinon submit retourne `App not found`) |
| A.2 | SA `play-publisher@...` invité Play Console "Manage testing tracks" | ⏳ user manuel | Oui (sinon submit retourne 403) |
| A.3 | 24h propagation post-A.2 | ⏳ attendre | Oui |
| A.4 | 8 captures vérifiées sans PII réelle | ⏳ user vérification | Non (V1 launch peut accepter risque) |
| A.5 | Privacy Policy URL accessible publique | ✅ confirmé Phase C (`https://taxasge-frontend-staging-...run.app/es/legal/privacy`) | Non |

---

## 2. ARCHITECTURE & FLUX

### 2.1 Pipeline complet de Phase F

```
┌────────────────────────────────────────────────────────────────┐
│  Step 1 : push develop  (18 commits A-E)                       │
│  ─────────────────────────────────────────────────────────────  │
│   ↓ trigger automatic                                           │
│  ┌──────────────────────┐  ┌────────────────────────────────┐  │
│  │ mobile-build.yml     │  │ deploy-backend-staging.yml     │  │
│  │ (CI test natif APK)  │  │ (déploie /legal endpoints +    │  │
│  │  ~25 min             │  │  migration 331 backfill)       │  │
│  └──────────────────────┘  └────────────────────────────────┘  │
│   ↓ both green                                                  │
│  Step 2 : tag v1.0.0  (manual)                                  │
│  ─────────────────────────────────────────────────────────────  │
│   ↓ trigger automatic                                           │
│  ┌──────────────────────┐                                       │
│  │ mobile-eas-build.yml │  → EAS Cloud                          │
│  │ profile=production   │     ↓                                 │
│  │ platform=android     │     AAB build (~25 min)               │
│  └──────────────────────┘     versionCode auto-incremented      │
│   ↓ workflow_run success on tag                                 │
│  Step 3 : auto submit                                           │
│  ─────────────────────────────────────────────────────────────  │
│  ┌──────────────────────┐                                       │
│  │ mobile-eas-submit.yml│  → Play Console                       │
│  │ track=internal       │     Internal Testing track            │
│  │ --latest             │     ↓                                 │
│  └──────────────────────┘     AAB visible (within 30 min)       │
│   ↓                                                             │
│  Step 4 : Play App Signing enrolment (manual, first time)       │
│  Step 5 : invite testeurs internes                              │
│  Step 6 : soft-launch monitoring 5-7j                           │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 Tests E2E Maestro — décision V1

**Recommandation V1** : **SKIPPER** les E2E Maestro pour le launch initial.

**Rationale** :
- Phase 9 livré tsc 0 erreur, ESLint 0 erreur, npm audit HIGH=0 — qualité code testée
- Soft-launch Internal Testing avec 10-20 testeurs humains = E2E manuel par crowdsourcing
- E2E Maestro = setup ~4-6h, maintenance non-triviale, faux-positifs sur device farms
- Si bug critique détecté Internal Testing → patch v1.0.1 rapide

**Recommandation V1.1** : ajouter Maestro CI pour les 5 flows critiques (login, wizard, vault, companies, support) une fois la base de testers stable.

→ **Phase F.4 (Maestro) reste optionnelle / skippable**.

---

## 3. CHECKLIST OPÉRATIONNELLE

### F.1 Plan détaillé ✅
- [x] Ce fichier

### F.2 Audit pré-build + correctifs
- [x] `app.json` version 1.0.0 confirmé
- [x] `eas.json` production env complet
- [x] GitHub Secrets vérifiés (8 secrets requis présents)
- [x] **CORRECTIF** : `sentry-dsn-mobile` créé GCP Secret + `EXPO_PUBLIC_SENTRY_DSN` ajouté EAS env preview+production
- [x] EAS Build credits restants ~28/30

### F.3 Push 18 commits A→E
- [ ] User confirme push
- [ ] `git push origin develop`
- [ ] Vérifier `mobile-build.yml` green (CI native APK + AAB)
- [ ] Vérifier `deploy-backend-staging.yml` green (legal endpoints déployés)
- [ ] Vérifier `deploy-frontend-staging.yml` green (re-déploiement neutre)
- [ ] Vérifier migration 331 appliquée en BD staging (déjà appliqué local Phase B, vérifier sur Cloud Run instance)

### F.4 Tests E2E Maestro (optionnel — décision V1 = skipper)
- [ ] (skipped V1 — voir §2.2 rationale)

### F.5 Tag v1.0.0 + EAS build production
- [ ] User actions A.1+A.2 confirmées (fiche app + SA invité Play Console)
- [ ] **Attendre 24h** post-A.2 propagation
- [ ] `git tag v1.0.0 && git push origin v1.0.0`
- [ ] Vérifier `mobile-eas-build.yml` triggered sur tag
- [ ] Suivre EAS Cloud build https://expo.dev/accounts/emacsah/projects/facil/builds
- [ ] Build success ~25 min → AAB disponible
- [ ] Récupérer build ID + SHA fingerprint pour `MOBILE_PHASE_10_D_SIGNING_KEYS.md`

### F.6 Soumission Play Console Internal Testing
- [ ] Trigger automatique `mobile-eas-submit.yml` via workflow_run sur tag (ou manual dispatch fallback)
- [ ] Vérifier upload Play Console (~5-10 min)
- [ ] **Première fois** : Play Console demande "Use Play App Signing ?" → choisir YES + suivre PEPK procédure (`MOBILE_PHASE_10_D_SIGNING_KEYS.md` §2)
- [ ] Vérifier release Internal Testing track status = "In review" puis "Available"
- [ ] Capturer SHA fingerprints app signing key (post-Play App Signing) + documenter

### F.7 Inviter testeurs internes (action user)
- [ ] Play Console → Internal testing → Testers → "Create email list"
- [ ] Liste : équipe Facil + early adopters (10-20 emails)
- [ ] Envoyer opt-in URL aux testeurs
- [ ] Vérifier qu'au moins 5 testeurs ont installé via Play Store

### F.8 Soft-launch monitoring (5-7 jours)
- [ ] J+1 : Sentry crash-free > 99.5%, ANR < 0.5%
- [ ] J+1 : LogRocket frustration index < 5%
- [ ] J+3 : 0 issue P1 ouverte, 0 crash bloquant
- [ ] J+5 : retour qualitatif testeurs (formulaire ou support tickets)
- [ ] J+7 : décision GO/NO-GO promotion Production

### F.9 Critique + commits Phase F
- [ ] `MOBILE_PHASE_10_F_CRITIQUE.md`
- [ ] Commits sémantiques :
  1. `chore(mobile): EXPO_PUBLIC_SENTRY_DSN added to EAS env (preview+production)`
  2. `docs(mobile): Phase F plan + critique`

---

## 4. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Push 18 commits déclenche `deploy-backend-staging.yml` qui échoue (migration 331 SQL erreur) | FAIBLE | HAUT | Migration déjà appliquée à BD via asyncpg en Phase B. Backend deploy juste recharge le code, ne re-applique pas. |
| `mobile-build.yml` échoue (CI native — keystore signing) | FAIBLE | MOYEN | Builds successifs récents OK ; aucune touch sur android/ depuis dernier vert |
| EAS Cloud build échoue (deps Expo SDK 54, gradle resources) | FAIBLE | HAUT | Build récent (1er mai 2026, AAB v1.0.0 build #6) OK. Si fail, log EAS dashboard donne diag. |
| `mobile-eas-submit.yml` 403 (SA pas invité ou pas propagé) | MOYENNE | HAUT | User doit faire A.1+A.2 ET attendre 24h. Workflow retournera erreur claire si manqué. |
| Play App Signing enrolment échec (PEPK tool, mauvaise upload key) | FAIBLE | HAUT | Suivre exactement `MOBILE_PHASE_10_D_SIGNING_KEYS.md` §2.1 step-by-step |
| Crash bloquant en Internal Testing | MOYENNE | HAUT | Sentry alerts (Phase G), patch v1.0.1 prêt, rollback Internal Testing track sans impact prod |
| Sentry mobile pas d'events (DSN missing) | ❌ RÉSOLU Phase F.2 | — | DSN ajouté EAS env |
| Captures Play Console contiennent PII réelle | MOYENNE | MOYEN | User vérifie A.4 avant upload, sinon re-capture compte test |

---

## 5. DÉCISIONS

- **Tests E2E Maestro** : **SKIPPED V1** — relais sur soft-launch humain Internal Testing
- **Tag stratégie** : `v1.0.0` initial, patches `v1.0.X` si bug Internal Testing
- **Track initial** : `internal` (10-20 testeurs invités par email)
- **Promotion Production** : Phase G (après 5-7j sans crash bloquant)
- **Phased rollout Production** : décision Phase G (probable 20%→50%→100% sur 7-10j)
- **Custom domain `taxasge.gob.gq`** : V1.1 (V1 utilise URL Cloud Run telle quelle)

---

## 6. SUIVI

- **2026-05-02 v1.0** : Plan détaillé créé. Audit pré-build complet — bug critique trouvé (`EXPO_PUBLIC_SENTRY_DSN` absent EAS env) et CORRIGÉ Phase F.2. Tous les pré-requis techniques satisfaits, reste actions user manuelles A.1-A.4.

---

## 7. SORTIE ATTENDUE PHASE F

| Livrable | Statut attendu |
|----------|----------------|
| Plan détaillé + critique | ✅ Phase F.1 + F.9 |
| GCP Secret `sentry-dsn-mobile` | ✅ Phase F.2 |
| EAS env `EXPO_PUBLIC_SENTRY_DSN` (preview+production) | ✅ Phase F.2 |
| 18 commits A-E pushés sur `develop` | Phase F.3 (action user confirme) |
| AAB v1.0.0 buildée EAS Cloud | Phase F.5 (consomme 1 EAS build) |
| AAB uploadée Play Console Internal Testing | Phase F.6 (action user A.1+A.2 préalables) |
| 10+ testeurs invités | Phase F.7 (action user) |
| Soft-launch 5-7j sans crash bloquant | Phase F.8 (monitoring) |
| Critique Phase F | `MOBILE_PHASE_10_F_CRITIQUE.md` |
