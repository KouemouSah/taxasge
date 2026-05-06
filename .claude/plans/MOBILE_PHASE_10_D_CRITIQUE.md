# PHASE D — Critique honnête

**Date** : 2026-05-02
**Phase parent** : `MOBILE_PHASE_10_PUBLISH_PLAYSTORE_MASTER.md`
**Statut** : Service account créé en GCP (vérifié `gcloud iam service-accounts list`), JSON key stockée en Secret Manager + GitHub Secret. eas.json + sentry.ts modifiés. Workflow CI submit créé. tsc 0, ESLint 0.

---

## 1. Sortie livrée

| # | Action | Résultat |
|---|--------|----------|
| 1 | GCP Service Account `play-publisher@taxasge-dev.iam.gserviceaccount.com` | ✅ Créé (vérifié) |
| 2 | JSON key generated + stocké dans GCP Secret `google-play-service-account` v1 | ✅ 2355 bytes, fichier local supprimé |
| 3 | GitHub Secret `GOOGLE_PLAY_SA_JSON_BASE64` synchronisé | ✅ 3160 bytes base64 |
| 4 | `packages/mobile/eas.json` — ajout `EXPO_PUBLIC_ENV` × 3 profils | ✅ |
| 5 | `packages/mobile/src/core/observability/sentry.ts` — `environment` via `EXPO_PUBLIC_ENV` avec fallback URL legacy | ✅ |
| 6 | `.github/workflows/mobile-eas-submit.yml` (NEW) | ✅ Manual dispatch + auto sur tag push |
| 7 | `.claude/plans/MOBILE_PHASE_10_D_SIGNING_KEYS.md` (NEW) | ✅ Reference Android + Play App Signing + SA rotation |
| 8 | `MOBILE_PHASE_10_D_GCP_EAS_DETAILED.md` | ✅ |
| 9 | tsc + ESLint sur fichiers modifiés | ✅ 0 erreur |

---

## 2. Action user manuelle restante (CRITIQUE pour Phase F)

### 2.1 ⚠️ Inviter le service account dans Play Console

**Sans cette étape, `eas submit` échoue avec `403 PermissionDenied`.**

**Étapes** :
1. Aller sur https://play.google.com/console
2. Settings → Developer account → **Users and permissions**
3. **Invite new users** → email : `play-publisher@taxasge-dev.iam.gserviceaccount.com`
4. Account permissions : aucune (sera grayed out)
5. App permissions → Facil (`com.taxasge.app`) :
   - ✅ View app information
   - ✅ Manage testing tracks
   - ❌ Manage production releases (rester manuel V1)
   - ❌ Manage store presence
6. Send invitation

⏰ **Délai propagation** : 24h. Ne pas tenter `eas submit` avant.

### 2.2 ⚠️ Si l'app `com.taxasge.app` n'existe pas encore en Play Console

L'invitation ci-dessus suppose que la fiche app a déjà été créée. Si ce n'est pas le cas :
1. Play Console → All apps → **Create app**
2. App name : `Facil`
3. Default language : Spanish (es-ES)
4. App or game : App
5. Free or paid : Free
6. Country availability : selon décisions Phase C

Puis revenir au step 2.1 pour inviter le SA.

---

## 3. Risques & honnêteté

### 3.1 GAP — pas de smoke `eas submit --dry-run`

Sans l'invitation Play Console (point 2.1), je ne peux PAS valider que la chaîne JSON-key → eas submit fonctionne. Le `--dry-run` lui-même nécessite la permission. Donc tant que :
- L'app `com.taxasge.app` n'est pas créée Play Console
- L'invitation SA n'est pas faite + propagée

→ aucune validation E2E possible. **Action requise user** avant Phase F.

### 3.2 RISQUE — keystore SHA pas capturé

Le doc `SIGNING_KEYS.md` documente la procédure pour capturer SHA-1 et SHA-256, mais je n'ai pas le password en main pour exécuter `keytool -list -v`. Les fingerprints sont marqués TODO.

**Impact** : si Firebase Cloud Messaging (FCM) ou Google Sign-In nécessite ces SHA pour la confirmation hardware-attested, on peut bloquer en debug. **Mitigation** : on les capturera lors de la première Phase F (l'AAB build sur EAS Cloud expose le SHA dans le dashboard).

### 3.3 RISQUE — workflow `mobile-eas-submit.yml` non testé

Le workflow est syntaxiquement valide YAML mais n'a jamais tourné. Possible erreurs runtime :
- `expo/expo-github-action@v8` peut ne pas propager EXPO_TOKEN aux steps suivants (mémoire #ci.yml — déjà adressé en propageant via env: job-level)
- Le node script qui patch `eas.json` track override pourrait casser sur certaines versions Node
- `git checkout -- eas.json` cleanup peut échouer si pas dans un git repo (paranoid `|| true`)

**Mitigation** : premier vrai run sera un dry-run sur Phase F avec l'option `--dry-run` ajoutée temporairement.

### 3.4 GAP — `EXPO_PUBLIC_SENTRY_DSN` source pas confirmée

J'ai modifié `sentry.ts` pour utiliser `EXPO_PUBLIC_ENV` (env var ajoutée à `eas.json`), mais je n'ai pas vérifié OÙ `EXPO_PUBLIC_SENTRY_DSN` est injecté dans le bundle EAS production. Possibilités :
- (a) Via `eas env:create` au scope project (variables persistées côté EAS Cloud)
- (b) Via `eas.json` env (il n'y est PAS — j'aurais ajouté sinon)
- (c) Via plugin Expo `@sentry/react-native/expo` qui auto-load depuis `expo.extra.sentry`

**Action V1.1** : audit `eas env:list --environment=production` pour confirmer. Si manquant, le mobile prod n'enverra PAS d'events Sentry — bug silencieux. **Pas bloquant pour publish** mais bloquant pour observability post-launch.

### 3.5 RISQUE — sentry.ts — fallback URL detection conserve "staging"

Avec ma modif, si `EXPO_PUBLIC_ENV` est absent (cas où on builderait avant le merge de Phase D), le fallback URL garde `staging`. Pas un bug, juste un comportement legacy attendu.

### 3.6 RISQUE — Play App Signing irréversible

Une fois enrolled (Phase F lors du premier upload AAB), on ne peut plus distribuer l'app hors écosystème Google sans changer le package ID. Décision intentionnelle (industry standard 2025+) mais lock-in à comprendre.

### 3.7 GAP — pas de federated identity

Décision V1 : GitHub Secret base64 du JSON key. Plus simple mais duplication du secret (GCP Secret Manager + GitHub Secret). Si l'un des deux est compromis, l'autre l'est aussi.

**V1.1** : migrer vers GCP Workload Identity Federation (GitHub Actions OIDC → Google service account directement). Setup 15-30 min, supprime la duplication.

---

## 4. Validation DoD

| # | Critère | Méthode | Résultat |
|---|---------|---------|----------|
| V1 | Service account créé GCP | `gcloud iam service-accounts list` | ✅ vérifié |
| V2 | JSON key stockée Secret Manager | `gcloud secrets versions list google-play-service-account` | ✅ v1 enabled |
| V3 | GitHub Secret synchronisé | `gh secret list \| grep GOOGLE_PLAY_SA_JSON_BASE64` | ✅ |
| V4 | eas.json `EXPO_PUBLIC_ENV` × 3 profils | `cat eas.json` | ✅ |
| V5 | sentry.ts `environment` via EXPO_PUBLIC_ENV | `grep EXPO_PUBLIC_ENV sentry.ts` | ✅ |
| V6 | Workflow CI submit syntaxe valide | YAML lint | ✅ valid |
| V7 | tsc 0 erreur | `npx tsc --noEmit` | ✅ |
| V8 | ESLint 0 erreur sur fichiers modifiés | `npx eslint` | ✅ |
| V9 | Documentation SIGNING_KEYS.md complète | review | ✅ (fingerprints TODO Phase F) |
| V10 | Invitation SA Play Console | manuel user | ⏳ ACTION REQUISE |
| V11 | Smoke `eas submit --dry-run` | post invitation 24h | ⏳ Phase F |

---

## 5. Recommandation push

### 5.1 Maintenant
- **Commits sémantiques** :
  1. `feat(mobile/eas): EXPO_PUBLIC_ENV var + Sentry environment field`
  2. `ci(mobile): mobile-eas-submit.yml — automated AAB submit to Play Console`
  3. `docs(mobile): SIGNING_KEYS.md + Phase D plan + critique`

- **PAS DE PUSH** tant que toutes les phases A-D ne sont pas livrées (économie EAS quota — décision user).

### 5.2 Action user manuelle requise
1. Créer la fiche app `com.taxasge.app` sur Play Console (si pas fait)
2. Inviter `play-publisher@taxasge-dev.iam.gserviceaccount.com` avec rôle "Manage testing tracks"
3. Attendre 24h propagation
4. Continuer Phase E (assets) en parallèle

### 5.3 Phase E (Assets) en parallèle — peut être lancée immédiatement
- Icon 512×512
- Feature graphic 1024×500
- 8 screenshots × 3 langues
- Texts déjà prêts dans `MOBILE_PHASE_10_C_PLAY_CONSOLE_FORMS.md`

---

## 6. Changelog

- **2026-05-02 v1.0** : Phase D livrée. SA créé, secrets stockés, workflow CI prêt, sentry env splittée. Action user manuelle restante : invitation SA Play Console + création app si nécessaire. tsc + ESLint passent.
