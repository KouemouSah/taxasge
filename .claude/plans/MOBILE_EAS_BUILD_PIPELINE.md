# Mobile / Inspector — EAS Build Pipeline

**Date** : 2026-04-30
**Auteur** : équipe TaxasGE (config validée par claude-opus-4-7)
**Statut** : ✅ Pipeline opérationnel pour Android. iOS pré-câblé, gated off jusqu'à création du compte Apple Developer.

---

## 1. Vue d'ensemble

Deux apps Expo distinctes partagent la même infrastructure CI/CD :

| App | Slug expo.dev | Project ID (immuable) | Tag namespace | Bundle ID |
|-----|---------------|------------------------|---------------|-----------|
| **Mobile (citoyen)** | `facil` | `14918b5d-b6e3-4e37-8860-a92d090dd247` | `v*.*.*` | `com.facil` |
| **Inspector (agent terrain)** | `facil-inspeccion` | `9c09c811-b7cc-4504-aad2-029b4bcbafe8` | `inspector-v*.*.*` | `com.facil.inspeccion` |

Les deux projets sont totalement isolés sur expo.dev — un build mobile ne peut pas atterrir dans le projet inspector et vice-versa.

URLs expo.dev :
- Mobile : https://expo.dev/accounts/emacsah/projects/facil/builds
- Inspector : https://expo.dev/accounts/emacsah/projects/facil-inspeccion/builds

---

## 2. Flux automatique : push → production build

```
git push origin develop  (modifs packages/mobile/** OU packages/inspector/**)
                ↓
    auto-tag-mobile-inspector.yml  (déclenché par push develop sur paths ciblés)
                ↓
        détecte les changes (diff $before..HEAD)
                ↓
    bump patch + push tag (avec GH_PAT, pas GITHUB_TOKEN)
                ↓
   ┌────────────┴────────────┐
   ↓                         ↓
v1.0.X                inspector-v1.0.X
   ↓                         ↓
mobile-eas-build.yml   inspector-build.yml
   ↓                         ↓
EAS Cloud → profile=production
   ↓                         ↓
Android .aab (+ iOS .ipa quand activé) déposé sur expo.dev
   ↓                         ↓
Téléchargement / soumission Play Store / App Store
```

### Garanties d'isolation

1. **`projectId` immuable** dans `app.json → extra.eas.projectId` — c'est l'UUID lu par `eas-cli` pour router le build.
2. **`WORKING_DIR` distinct** par workflow (`packages/mobile` vs `packages/inspector`) — `eas build` lit l'`app.json` du CWD courant.
3. **Bundle identifiers distincts** — `com.facil` vs `com.facil.inspeccion` — les deux APK coexistent sur le même device.
4. **Tag namespaces distincts** — `v1.0.X` (mobile) vs `inspector-v1.0.X` (inspector) — un tag mobile ne déclenche PAS le workflow inspector.

### Déclenchement manuel

Pour shipper sans push de code (rare) :

```bash
# Mobile
gh workflow run "Mobile EAS Build (Cloud)" --ref develop \
  -f profile=production -f platform=android

# Inspector
gh workflow run "Inspector EAS Build (Cloud)" --ref develop \
  -f profile=production -f platform=android
```

Pour shipper depuis un tag manuellement créé :

```bash
# Mobile
git tag v1.0.5 && git push origin v1.0.5

# Inspector
git tag inspector-v1.0.5 && git push origin inspector-v1.0.5
```

---

## 3. Configuration par fichier

### Workflows GitHub Actions

| Fichier | Rôle |
|---------|------|
| `.github/workflows/auto-tag-mobile-inspector.yml` | Détecte changes mobile/inspector sur push develop, bump patch, push tag |
| `.github/workflows/mobile-eas-build.yml` | Build EAS Cloud pour mobile (déclenché par tag `v*.*.*` ou manual) |
| `.github/workflows/inspector-build.yml` | Build EAS Cloud pour inspector (déclenché par tag `inspector-v*.*.*` ou manual) |

### Configs Expo

| Fichier | Rôle |
|---------|------|
| `packages/mobile/eas.json` | Profils mobile : development / preview / preview-device / production |
| `packages/mobile/app.json` | Slug `facil`, projectId mobile, bundle `com.facil` |
| `packages/inspector/eas.json` | Profils inspector : development / preview / production (Android + iOS pré-câblés) |
| `packages/inspector/app.json` | Slug `facil-inspeccion`, projectId inspector, bundle `com.facil.inspeccion` |

### Secrets GitHub requis

| Secret | Usage |
|--------|-------|
| `EXPO_TOKEN` | PAT Expo (org `emacsah`), build permissions. Job-scoped dans les 2 workflows EAS. |
| `GH_PAT` | PAT GitHub avec scope `repo`. Utilisé par auto-tag pour déclencher la cascade tag → build (GITHUB_TOKEN bloqué par GitHub pour les déclenchements en cascade). |

### Variables GitHub (Settings → Variables → Actions)

| Variable | Default | Effet |
|----------|---------|-------|
| `MOBILE_BUILD_PLATFORM` | (vide → `android`) | Plateforme(s) cible pour les builds mobile sur tag-push. Valeurs : `android`, `ios`, `all`. |
| `INSPECTOR_BUILD_PLATFORM` | (vide → `android`) | Idem pour inspector. |

---

## 4. État actuel des plateformes

### Android — ✅ OPÉRATIONNEL

- Credentials gérés par EAS (`Build Credentials MrxVP82XHo` mobile, équivalent inspector).
- Builds preview/production fonctionnent.
- Validations effectuées :
  - Mobile preview build `38aeb0b4-1300-4861-82cc-9c19d79af830` → finished, 17min cloud time, APK dispo
  - Inspector EAS Build run `25158590884` (workflow_dispatch test) → succès complet (TypeScript check ✓, EAS build queued ✓)

### iOS — 🔒 PRÉ-CÂBLÉ, gated off

- Profils EAS définis dans `eas.json` (preview = simulator, production = autoIncrement).
- Workflows lisent `vars.{MOBILE,INSPECTOR}_BUILD_PLATFORM` (default `android`) — il suffit de flipper la variable à `all` pour activer iOS.
- Bloquant restant : **compte Apple Developer Program absent** + credentials iOS jamais uploadés sur EAS.

Voir section **Guide d'activation iOS** ci-dessous.

---

## 5. Loop-safety du auto-tag

Le workflow auto-tag est conçu pour ne JAMAIS provoquer de boucle infinie :

- **Aucune modification de fichier source** — les versions ne sont pas bumpées dans `package.json` / `app.json`. Les tags sont des pointeurs lightweight, pas des versions sémantiques portées par les sources.
- **Tags lightweight uniquement** — créés par `git tag -a "$TAG" -m "..." && git push origin "$TAG"`. Pas de commit additionnel.
- **Marker `[skip-release]`** — n'importe quel commit dont le message contient `[skip-release]` saute le tagging. Utile pour les refactors / docs / chores.
- **paths-filter au workflow level** — uniquement les paths `packages/mobile/**` et `packages/inspector/**` déclenchent le workflow. Un commit sur backend / web / docs / `.claude/` ne fire PAS auto-tag.
- **GH_PAT** — la cascade `tag pushed by auto-tag → mobile-eas-build / inspector-build` ne fonctionnerait pas avec GITHUB_TOKEN (bloqué par GitHub pour éviter les boucles). GH_PAT contourne cette restriction de manière contrôlée.

---

## 6. Guide d'activation iOS — quand le compte Apple Developer sera créé

### Pré-requis

1. **Apple Developer Program** souscrit pour l'organisation TaxasGE (compte payant 99 USD/an, pas un compte individuel).
2. **App Store Connect** accès admin pour `emacsah` (compte propriétaire des projets EAS).
3. **Bundle identifiers** déjà déclarés dans App Store Connect :
   - `com.facil` (mobile citoyen)
   - `com.facil.inspeccion` (inspector)
4. **App Store Connect API Key** (.p8) générée dans App Store Connect → Users and Access → Integrations → App Store Connect API. Conserver le fichier `.p8`, le Key ID et l'Issuer ID.

### Étape 1 — Uploader les credentials iOS sur EAS (1 fois pour mobile, 1 fois pour inspector)

```bash
# Pour Mobile
cd packages/mobile
EXPO_TOKEN="<facil PAT>" eas credentials --platform ios
# Suivre le wizard interactif :
#   - Choisir profile = production
#   - Upload App Store Connect API Key (.p8) + Key ID + Issuer ID
#   - Laisser EAS gérer le Distribution Certificate + Provisioning Profile
#   - EAS génère et stocke tout en ligne dans le projet `facil`

# Pour Inspector
cd packages/inspector
EXPO_TOKEN="<facil PAT>" eas credentials --platform ios
# Mêmes étapes, projet `facil-inspeccion`
```

Les credentials sont alors stockées sur expo.dev — plus jamais besoin de les retoucher (sauf rotation).

### Étape 2 — Compléter les placeholders dans `inspector/eas.json`

Ouvrir `packages/inspector/eas.json` et remplir le bloc `submit.production.ios` :

```json
"submit": {
  "production": {
    "ios": {
      "ascAppId": "<l'Application ID numérique d'App Store Connect>",
      "appleTeamId": "<le Team ID de la membership Apple Developer>"
    }
  }
}
```

Trouver `ascAppId` : App Store Connect → My Apps → Facil Inspeccion → App Information → "Apple ID" (chaîne de chiffres).
Trouver `appleTeamId` : Apple Developer → Membership → Team ID (chaîne alphanumérique de 10 caractères).

Côté mobile, vérifier que `packages/mobile/eas.json` a aussi un bloc équivalent (à ajouter si absent au moment de l'activation).

### Étape 3 — Flipper les repo variables GitHub

GitHub → Settings → Variables → Actions :

| Variable | Valeur à mettre |
|----------|-----------------|
| `MOBILE_BUILD_PLATFORM` | `all` (Android + iOS) ou `ios` (iOS seul) |
| `INSPECTOR_BUILD_PLATFORM` | `all` ou `ios` |

Pas besoin de re-déployer les workflows — la lecture est dynamique à chaque run.

### Étape 4 — Test bout-en-bout

```bash
# Faire un petit changement no-op dans mobile (ex. README.md dans packages/mobile/)
echo "" >> packages/mobile/README.md
git add packages/mobile/README.md
git commit -m "test(ci): trigger iOS build smoke test"
git push origin develop
```

Suivre :
1. Run de `auto-tag-mobile-inspector.yml` → vérifier qu'un tag `v1.0.X` est créé
2. Run de `mobile-eas-build.yml` (déclenché par le tag) → vérifier que `Resolve build parameters` résout `platform=all`
3. EAS Cloud → 2 builds en parallèle (Android .aab + iOS .ipa)
4. expo.dev/accounts/emacsah/projects/facil/builds → 2 builds visibles

### Étape 5 — Soumission App Store (manuelle, première fois)

Une fois la build iOS finie sur EAS :

```bash
cd packages/mobile
EXPO_TOKEN="<token>" eas submit --platform ios --latest
# Soumet le dernier build à TestFlight automatiquement
```

Pour automatiser plus tard, intégrer `eas submit --platform ios --auto-submit` dans une étape post-build du workflow.

### Checklist d'activation iOS

- [ ] Apple Developer Program actif (TaxasGE org, pas individuel)
- [ ] Bundle IDs déclarés sur App Store Connect (`com.facil`, `com.facil.inspeccion`)
- [ ] App Store Connect API Key (.p8) générée et conservée en lieu sûr
- [ ] `eas credentials --platform ios` exécuté pour mobile
- [ ] `eas credentials --platform ios` exécuté pour inspector
- [ ] `submit.production.ios.ascAppId` rempli dans `inspector/eas.json`
- [ ] `submit.production.ios.appleTeamId` rempli dans `inspector/eas.json`
- [ ] Idem pour `mobile/eas.json` (bloc submit.production.ios)
- [ ] `MOBILE_BUILD_PLATFORM` = `all` dans GitHub Variables
- [ ] `INSPECTOR_BUILD_PLATFORM` = `all` dans GitHub Variables
- [ ] Test bout-en-bout : 1 tag mobile → 1 build Android + 1 build iOS sur expo.dev
- [ ] Test bout-en-bout : 1 tag inspector → 1 build Android + 1 build iOS sur expo.dev
- [ ] Premier `eas submit --platform ios --latest` exécuté pour TestFlight (mobile)
- [ ] Idem pour inspector

---

## 7. Troubleshooting (incidents 2026-04-30)

| Symptôme | Cause | Fix |
|----------|-------|-----|
| `An Expo user account is required to proceed` | EXPO_TOKEN pas propagé au step `run: eas build` (le `expo/expo-github-action@v8` ne le passe qu'à son propre context) | Bloc `env: EXPO_TOKEN` au scope job (commit `1267b964`) |
| Tag créé par auto-tag ne déclenche pas le workflow downstream | GitHub bloque les déclenchements en cascade quand le tag est push avec GITHUB_TOKEN (loop prevention) | Switcher `actions/checkout` à `token: ${{ secrets.GH_PAT }}` (commit `9eb62985`) |
| `EXPO_TOKEN secret not configured` lors du dispatch initial | Secret EXPO_TOKEN absent du repo | `gh secret set EXPO_TOKEN` avec le PAT Expo `facil` (commit `ca0521fb`) |
| Inspector build natif Gradle échouait sur CMake 3.22 vs 3.31 | RN 0.81 New Architecture exige CMake 3.31+, le runner ubuntu-latest pré-installe 3.22 | Migration entière vers EAS Cloud (rewrite `inspector-build.yml`, commit `f2bfc0c1`) |

---

## 8. Évolutions futures envisagées

| Idée | Quand | Effort |
|------|-------|--------|
| **Skip release commits** déjà supporté via `[skip-release]` | — | livré |
| **Bumper la minor** au lieu de la patch sur push | Si volume releases > 1/jour | trivial (un IFS dans le bash) |
| **Changelog auto** depuis les commits depuis le dernier tag | Phase 10 | 1h |
| **Slack/Discord notification** sur tag créé / build fini | Phase 10 | 30min |
| **Eas submit auto** (TestFlight + Play internal) après build production | Quand iOS activé + Play Console wired | 1h |
| **Sentry release upload** automatique post-build (sourcemaps) | Quand SENTRY_AUTH_TOKEN re-créé après revoke | 30min |

---

## 9. Sources

- Auto-tag : `.github/workflows/auto-tag-mobile-inspector.yml`
- Mobile EAS : `.github/workflows/mobile-eas-build.yml`
- Inspector EAS : `.github/workflows/inspector-build.yml`
- Plan cache mobile : `.claude/plans/MOBILE_CACHE_AUDIT_2026_04_30.md`
- Critique cache : `.claude/plans/MOBILE_CACHE_C1_C4_CRITIQUE_2026_04_30.md`

## 10. Changelog

- **2026-04-30 v1.0** : création du document après mise en place complète du pipeline (commits `f2bfc0c1`, `66ff501d`, `9eb62985`). Validation manuelle Inspector EAS run `25158590884` ✓ et Mobile preview build `38aeb0b4` ✓.
