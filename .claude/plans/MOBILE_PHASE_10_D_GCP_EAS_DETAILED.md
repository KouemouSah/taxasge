# PHASE D — Configuration GCP + EAS Submit + Play App Signing (Plan détaillé)

**Date** : 2026-05-02
**Phase parent** : `MOBILE_PHASE_10_PUBLISH_PLAYSTORE_MASTER.md`
**Sortie attendue** : pipeline `eas submit --profile production` fonctionnel, Service Account GCP créé + invité dans Play Console, Play App Signing enrôlé, Sentry mobile distingue prod vs preview.
**Cible time** : 0.5-1j
**Branche** : `develop`

---

## 1. CONTEXTE & DÉPENDANCES

Phase B (legal) + Phase C (compliance docs) livrées en local (commits non poussés). Phase D = configuration **infrastructure** Google Cloud + Expo Application Services + Play Console pour permettre `eas submit` automatisé.

**État actuel — vérifié 2026-05-02** :

### 1.1 GCP Service Accounts (`taxasge-dev`, vérifié `gcloud iam service-accounts list`)
| SA | Email | Usage |
|----|-------|-------|
| Default compute | `392159428433-compute@developer.gserviceaccount.com` | Cloud Run runtime |
| Firebase Hosting | `firebase-app-hosting-compute@taxasge-dev.iam.gserviceaccount.com` | Firebase Hosting |
| Firebase Admin | `firebase-adminsdk-fbsvc@taxasge-dev.iam.gserviceaccount.com` | Firebase Admin SDK (FCM) |
| Backend SA | `taxasge-backend-sa@taxasge-dev.iam.gserviceaccount.com` | Cloud Run deploy + secret access |
| Vertex Express | `vertex-express@taxasge-dev.iam.gserviceaccount.com` | Vertex AI (Gemini) |

❌ **MANQUANT** : `play-publisher@taxasge-dev.iam.gserviceaccount.com` — à créer Phase D.3

### 1.2 GCP Secrets (vérifié `gcloud secrets list --project=taxasge-dev`)
26 secrets existants. Les pertinents pour mobile :
- ✅ `expo-token` (rotated 2026-04-30)
- ✅ `sentry-auth-token` (rotated 2026-04-30)
- ✅ `logrocket-app-id`
- ✅ `logrocket-pat`
- ❌ `google-play-service-account` — **à créer Phase D.3**
- ⚠️ `sentry-dsn-backend` + `sentry-dsn-web` existent — **PAS de `sentry-dsn-mobile`** (le mobile utilise EXPO_PUBLIC_SENTRY_DSN passé via EAS env, à vérifier où il est stocké)

### 1.3 EAS Project (vérifié `eas project:info` 2026-05-02)
- **Project** : `@emacsah/facil`
- **ID** : `14918b5d-b6e3-4e37-8860-a92d090dd247`
- **Latest production build** : `14dc2b6d-...` (1 mai 2026, AAB v1.0.0 build #6)
- **Active build (this session)** : `e1efa264-...` IN_PROGRESS preview Android
- **EAS Build credits** : 30/mois free tier (~28 restants — ne pas consommer avant fin Phase D)

### 1.4 Mobile keystore (existant)
- Location : `packages/mobile/android/app/facil-release.keystore` (committé git, gitignored par alias dans `.gitignore` ?)
- GitHub Secrets : `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` (utilisés par `mobile-build.yml`)
- ⚠️ **Vérification Phase D.5** : confirmer que la même keystore est utilisée par EAS Cloud build (sinon les signatures divergent → impossible mise à jour Play Store)

### 1.5 eas.json submit config actuel (`packages/mobile/eas.json`)
```json
"submit": {
  "production": {
    "android": {
      "serviceAccountKeyPath": "./google-play-service-account.json",
      "track": "internal"
    }
  }
}
```

⚠️ **Problème** : le path référence un fichier qui **n'existe pas** dans le repo (gitignored à raison — c'est un secret). Le workflow GitHub Actions devra :
1. Pull le secret depuis Secret Manager
2. Écrire un fichier temporaire à ce path
3. Lancer `eas submit`
4. Cleanup

---

## 2. ARCHITECTURE PROPOSÉE

### 2.1 Service Account `play-publisher`

```bash
# Création (action user requise — les commandes seront proposées en confirmation)
gcloud iam service-accounts create play-publisher \
  --display-name="Play Publisher (EAS submit)" \
  --description="Used by EAS submit to upload AAB to Play Console Internal Testing track" \
  --project=taxasge-dev

# Génération JSON key (ATTENTION : le fichier est éphémère, transit Secret Manager direct)
TMP_KEY=$(mktemp)
gcloud iam service-accounts keys create "$TMP_KEY" \
  --iam-account=play-publisher@taxasge-dev.iam.gserviceaccount.com \
  --project=taxasge-dev

# Stockage secret
gcloud secrets create google-play-service-account \
  --data-file="$TMP_KEY" \
  --project=taxasge-dev

# Cleanup local
rm -f "$TMP_KEY"

# Vérifier
gcloud secrets versions list google-play-service-account --project=taxasge-dev
```

### 2.2 Invitation Play Console (action user manuel)

Le service account email `play-publisher@taxasge-dev.iam.gserviceaccount.com` doit être **invité** dans Play Console côté `kouemou.sah@gmail.com` :

1. Play Console → Settings → Developer account → Users and permissions
2. Click "Invite new users" → Email = `play-publisher@taxasge-dev.iam.gserviceaccount.com`
3. Permissions :
   - **Account permissions** : (none — service account, pas humain)
   - **App permissions** : Facil (`com.taxasge.app`) → cocher :
     - ✅ View app information
     - ✅ Manage testing tracks (releases to Internal Testing only — recommandé)
     - ❌ Manage production releases (NE PAS cocher en V1 — promotion Production se fera manuellement par user)
     - ❌ Manage store presence (NE PAS cocher — listing manuel)
4. Send invitation. Note : pour un service account, l'invitation est immédiatement effective (pas de mail de confirmation à cliquer).
5. **Délai propagation** : ~24h pour qu'EAS puisse vraiment uploader. Tester avec `eas submit --dry-run`.

### 2.3 GitHub Actions `mobile-eas-submit.yml` (NEW)

Workflow déclenché manuellement (workflow_dispatch) ou sur tag push qui :
1. Setup Node + EAS CLI
2. `gcloud auth` via federated identity (ou service-account-key GitHub secret)
3. Pull `google-play-service-account` secret de GCP → fichier temporaire
4. Pull `expo-token` secret → env var EXPO_TOKEN
5. `eas submit --profile production --platform android --latest --non-interactive`
6. Cleanup fichier temporaire

**Décision V1 simple** : passer par GitHub secret intermédiaire (`GOOGLE_PLAY_SA_JSON_BASE64`) plutôt que GCP federated identity (plus complexe). Trade-off : duplication du secret (GCP + GitHub) mais pipeline robuste.

### 2.4 Sentry environnement prod vs preview

`packages/mobile/src/core/observability/sentry.ts:65-67` actuel :
```ts
environment: process.env.EXPO_PUBLIC_API_URL?.includes('staging') ? 'staging' : 'production'
```

Décision user D2 (master plan) : `taxasge-dev` = prod V1, donc l'URL backend reste `taxasge-backend-staging-...run.app` même pour le build production EAS. Conséquence : **TOUS les events Sentry seraient tagged `staging`** (le mobile prod utilise une URL "staging").

**Solution** : ajouter une env var `EXPO_PUBLIC_ENV` distincte de l'URL :
- `eas.json` `preview.env.EXPO_PUBLIC_ENV = "preview"`
- `eas.json` `production.env.EXPO_PUBLIC_ENV = "production"`

Modifier `sentry.ts` :
```ts
environment: process.env.EXPO_PUBLIC_ENV ?? 'development'
```

→ Sentry filtre `environment:production` montre les events des AAB Play Store (Internal/Production tracks). `environment:preview` = APK testers internes. `environment:development` = `__DEV__` build (mais on no-op de toute façon en dev).

### 2.5 Sentry DSN mobile — où stocké ?

Le mobile lit `process.env.EXPO_PUBLIC_SENTRY_DSN`. Cette var doit être set côté EAS — vérifier où.

**À AUDITER Phase D.2** : EAS env vars pour `EXPO_PUBLIC_SENTRY_DSN` sur les profils preview + production. Si absent → ajouter via `eas env:create`.

### 2.6 Play App Signing — keystore

**Décision** : Google Play App Signing (Google managed signing) — l'industry standard.

Comment ça marche :
- Le développeur upload une **upload key** (la keystore actuelle `facil-release.keystore`)
- Google génère et stocke une **app signing key** (jamais accessible au dev)
- Quand on uploade un AAB, il est signé avec l'upload key, Google re-signe avec l'app signing key avant distribution

**Avantages** :
- Si l'upload keystore est perdue, on peut la regénérer côté Google
- Optimisations Play (split APKs par device — réduit taille DL ~30%)

**Action V1 (Phase D.5)** :
1. Première fois qu'on uploade un AAB sur Play Console, Google demande "Use Play App Signing ?" → choisir **YES**
2. Choisir "Export and upload a key from my Java keystore" (puisqu'on a déjà `facil-release.keystore`)
3. Suivre instructions Google (générer un fichier ZIP encrypté avec PEPK tool)
4. Upload ZIP dans Play Console → Google extrait la clé et la stocke
5. Documenter SHA-1 + SHA-256 fingerprints (utiles pour FCM, Google Sign-In éventuel)

---

## 3. CHECKLIST OPÉRATIONNELLE

### D.1 Plan détaillé ✅
- [x] Ce fichier

### D.2 Audit état EAS env vars
- [ ] `eas env:list --environment=preview --scope=project`
- [ ] `eas env:list --environment=production --scope=project`
- [ ] Confirmer `EXPO_PUBLIC_SENTRY_DSN` présent ou à ajouter

### D.3 Service Account GCP + secret (action user requise)
- [ ] User confirme la création du SA `play-publisher` (commandes proposées)
- [ ] `gcloud iam service-accounts create play-publisher`
- [ ] `gcloud iam service-accounts keys create` → JSON
- [ ] `gcloud secrets create google-play-service-account --data-file=...`
- [ ] Vérifier `gcloud secrets versions list google-play-service-account`

### D.4 Invitation Play Console (action user manuel)
- [ ] Inviter `play-publisher@taxasge-dev.iam.gserviceaccount.com` dans Play Console
- [ ] Permissions: Manage testing tracks for Facil app
- [ ] Attendre 24h pour propagation

### D.5 Modification eas.json + sentry.ts
- [ ] Ajouter `EXPO_PUBLIC_ENV=preview` dans `eas.json` preview profile
- [ ] Ajouter `EXPO_PUBLIC_ENV=production` dans `eas.json` production profile
- [ ] Modifier `sentry.ts` ligne 65-67 → utiliser `EXPO_PUBLIC_ENV`
- [ ] tsc + ESLint check

### D.6 GitHub Actions workflow `mobile-eas-submit.yml`
- [ ] Créer `.github/workflows/mobile-eas-submit.yml`
- [ ] Workflow_dispatch + tag-based trigger
- [ ] Pull `google-play-service-account` via gcloud secret OR GitHub secret base64 (décision plus simple)
- [ ] `eas submit --profile production --latest --non-interactive`
- [ ] Cleanup tmpfile

### D.7 Documentation `.claude/plans/MOBILE_PHASE_10_D_SIGNING_KEYS.md`
- [ ] Documenter SHA-1 + SHA-256 keystore actuel
- [ ] Procédure Play App Signing enrolment (à exécuter Phase F lors du 1er upload)
- [ ] Procédure rotation upload key si nécessaire

### D.8 Audit eas submit dry-run (post invitation propagation)
- [ ] `eas submit --profile production --dry-run --platform android` doit passer (24h après invitation)
- [ ] Si erreur → diagnostic permission + retry

### D.9 Critique honnête Phase D
- [ ] `MOBILE_PHASE_10_D_CRITIQUE.md`

### D.10 Commits sémantiques
1. `feat(mobile/eas): EXPO_PUBLIC_ENV env var + Sentry environment field`
2. `ci(mobile): mobile-eas-submit.yml — automated AAB submit to Play Console`
3. `docs(mobile): SIGNING_KEYS.md + Phase D plan + critique`

---

## 4. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Service account email invitation Play Console : 24h propagation | HAUTE | MOYEN | Faire D.4 le jour J, attendre 24h avant Phase F submit |
| Keystore SHA mismatch entre EAS Cloud et GitHub Actions builds | MOYENNE | HAUT | Documenter SHA fingerprints + vérifier `eas credentials --platform android` que la upload key matches |
| Play App Signing enrollment irréversible | FAIBLE | HAUT | Une fois enrolled on ne peut plus distribuer hors Google Signing. Décision intentionnelle (best practice 2025+). |
| Federated identity GCP → GitHub OIDC complexe à setup | MOYENNE | FAIBLE | Décision simple : utiliser GitHub secret base64 du JSON (duplication minor du secret) |
| EAS submit échoue silencieusement sans message clair | FAIBLE | MOYEN | Ajouter `--non-interactive` + log captures + workflow `eas submit:list` après pour vérifier |
| Sentry DSN mobile pas dans EAS env (envoyé via app.json plugin uniquement) | MOYENNE | MOYEN | D.2 audit + ajout via `eas env:create` si manquant |
| `EXPO_PUBLIC_ENV` casse Sentry env detection actuelle (URL-based) | FAIBLE | FAIBLE | Modifier sentry.ts pour utiliser EXPO_PUBLIC_ENV en priorité, fallback sur URL detection |

---

## 5. DÉCISIONS

- **Service account name** : `play-publisher` (clear naming, distingue de `taxasge-backend-sa`)
- **Permissions Play Console** : Internal Testing track only (V1 — promotion Production manuelle par user)
- **Federated identity vs GitHub secret base64** : GitHub secret base64 (plus simple V1, V1.1 migration vers Workload Identity Federation)
- **Sentry env var** : `EXPO_PUBLIC_ENV` (clean, indépendant de l'URL backend)
- **Play App Signing** : YES (industry standard, enrollment au 1er upload AAB en Phase F)
- **Eas Submit trigger** : workflow_dispatch + tag push (cohérent avec `mobile-eas-build.yml` existant)

---

## 6. SUIVI

- **2026-05-02 v1.0** : Plan détaillé créé après audit `gcloud iam` + `gcloud secrets list` + lecture sentry.ts + eas.json. 5 SA existants, `play-publisher` à créer. 26 secrets, `google-play-service-account` à créer. Sentry env detection via URL — à migrer vers `EXPO_PUBLIC_ENV`.

---

## 7. SORTIE ATTENDUE PHASE D

| Livrable | Localisation |
|----------|--------------|
| Plan détaillé | ✅ ce fichier |
| Service Account GCP | `play-publisher@taxasge-dev.iam.gserviceaccount.com` |
| GCP Secret | `google-play-service-account` v1 |
| Workflow CI | `.github/workflows/mobile-eas-submit.yml` |
| eas.json modifié | +`EXPO_PUBLIC_ENV` × 2 profils |
| sentry.ts modifié | `environment` field via `EXPO_PUBLIC_ENV` |
| Documentation | `.claude/plans/MOBILE_PHASE_10_D_SIGNING_KEYS.md` |
| Critique | `MOBILE_PHASE_10_D_CRITIQUE.md` |
| Commits | 3 sémantiques sur develop, pas push (groupé fin Phase E) |
