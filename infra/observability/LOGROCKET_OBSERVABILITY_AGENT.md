# LogRocket Observability Agent

> **Rôle** : agent réutilisable qui guide un LLM (Claude / autre) pour wirer
> **LogRocket session replay** sur un projet web et/ou mobile, **production-grade**,
> en évitant les 8 pièges classiques rencontrés sur Facil (2026-04-30).
>
> **Invocation** : `/logrocket-observability` (slash-command projet) — voir
> `.claude/commands/logrocket-observability.md`. Sinon prompt direct : « Lance
> l'agent LogRocket selon `infra/observability/LOGROCKET_OBSERVABILITY_AGENT.md` ».
>
> **Audience** : LLM exécutant + utilisateur humain (pour les actions UI / création de compte).
> **Sortie attendue** : SDK init opérationnel sur N surfaces (web / mobile / inspector),
> redaction PII active à 4 niveaux, identify policy enforced, secret en SM/EAS/CI cohérent,
> bridge Sentry actif si Sentry présent, README de l'observabilité projet à jour.

---

## 1. Mission de l'agent

Quand l'utilisateur dit « ajoute LogRocket session replay à ce projet », ou
invoque la slash-command, **fais ces phases dans l'ordre, sans en sauter
aucune** :

| Phase | But | Sortie |
|---|---|---|
| 0 | Prérequis utilisateur (compte, App ID, surfaces à couvrir) | `.env` rempli + plan d'intégration validé |
| 1 | Détection stack projet (Next.js / Vite / CRA / Expo / bare RN / autre) | Adapter SDK + procédure d'init choisis |
| 2 | Wrapper SDK + gating + identify | `core/observability/logrocket.ts` + `LogRocketProvider` |
| 3 | PII redaction (4 layers L1→L4) | Sanitizers + DOM/JSX opt-in patterns appliqués |
| 4 | Secret topology + CI binding | App ID en SM/EAS/CI, build-args / env vars OK |
| 5 | Mobile-only — natifs + minSdk + EAS uploads | `android/build.gradle` + `.easignore` + Maven repos |
| 6 | Sentry bridge (optionnel mais recommandé) | `bridgeLogRocketToSentry()` activé si Sentry présent |
| 7 | Tests + smoke + critique + documentation | Sessions LogRocket vérifiées + README projet à jour |

**Règle d'or** : à chaque phase, **valider explicitement** auprès de l'utilisateur
avant de passer à la suivante. La phase 3 (privacy) **ne peut PAS être sautée**
sur un projet qui manipule des données régulées.

---

## 2. Phase 0 — Prérequis utilisateur

### 0.1 Compte LogRocket (Free Tier ou Team)

Si l'utilisateur n'a pas de compte :
> « Crée-toi un compte sur https://app.logrocket.com/signup . Free tier inclus :
> 1 000 sessions / mois, 1 mois de rétention. Note l'App ID au format `<org>/<project>`
> (visible dans Settings → Project Settings → General). »

### 0.2 Surfaces à couvrir (multi-platform)

L'agent **doit demander** explicitement :
> « Sur quelles surfaces veux-tu wirer LogRocket ?
> (a) Web SPA (Next.js / Vite / CRA),
> (b) Mobile React Native (Expo / bare),
> (c) Mobile native iOS/Android (Swift / Kotlin),
> (d) plusieurs ? Réponds avec a/b/c ou combinaison. »

L'agent **adapte** ensuite sa stratégie :
- **Web only** → `logrocket@12` + `logrocket-react@7` (une seule surface, ~200 lignes wrapper).
- **Mobile RN only** → `@logrocket/react-native@1.62` + `<DeferredEffects>` + minSdk 25.
- **Web + Mobile** → 2 wrappers symétriques + 1 App ID partagé (le quota est mutualisé).
- **Native iOS / Android non-RN** → SDKs natifs + integration manuelle (sortie de scope agent v1).

### 0.3 Stack web (si applicable)

Demander :
> « Quel framework web ? (Next.js / Vite / CRA / Remix / autre) »

L'agent adapte :
- **Next.js** → `NEXT_PUBLIC_*` env vars + Provider client component.
- **Vite** → `VITE_*` env vars + init dans `main.tsx`.
- **CRA** → `REACT_APP_*` env vars + init dans `App.tsx`.
- **Remix** → `process.env` (ne pas inliner dans loader, init dans entry.client).

### 0.4 Stack mobile (si applicable)

Demander :
> « Mobile : Expo (managed / CNG / non-CNG) ou bare React Native ? »

L'agent adapte :
- **Expo CNG** → `app.json plugins` + `expo prebuild` régénère `/android` `/ios`.
- **Expo non-CNG** → édition directe `android/build.gradle` (committée).
- **Bare RN** → édition directe natifs + `react-native link` ou autolinking.

### 0.5 Sentry présent ?

Demander :
> « Sentry est-il déjà wiré sur ce projet ? (oui/non/partiellement) »

Si oui → activer le bridge `bridgeLogRocketToSentry()` en Phase 6.
Si non ou partiel → laisser le bridge en stub no-op pour activation future.

### 0.6 Compliance / régulation

Demander :
> « Le projet manipule-t-il des données régulées ? (RGPD / HIPAA / PCI-DSS / autre) »

Si oui → **Phase 3 (PII redaction) devient bloquante** : aucune Phase 4-7 sans
audit redaction signé par l'utilisateur. L'agent **n'autorise PAS** un
contournement.

### Gate Phase 0 → Phase 1
- ✅ App ID LogRocket fourni (format `<org>/<project>`)
- ✅ Surfaces et stacks identifiées
- ✅ Présence Sentry confirmée (oui/non)
- ✅ Niveau compliance connu

---

## 3. Phase 1 — Détection stack + adapter

L'agent **lit** les fichiers projet pour confirmer la stack :

```bash
# Web
ls package.json && grep -E '"next"|"vite"|"react-scripts"|"@remix-run"' package.json

# Mobile
ls packages/mobile/package.json packages/inspector/package.json
grep -E '"expo"|"react-native"' packages/mobile/package.json
ls packages/mobile/android/build.gradle  # presence = non-CNG mode
```

L'agent **construit** un tableau d'adapter (au format §11 Annexe) avec les
mappings spécifiques à chaque stack.

### Gate Phase 1 → Phase 2
- ✅ Stack confirmée par lecture du `package.json`
- ✅ Adapter d'init choisi (Next.js Provider / Vite main / Expo DeferredEffects)

---

## 4. Phase 2 — Wrapper SDK + gating + identify

### 2.1 Pattern wrapper (canonical)

Créer `<src-root>/core/observability/logrocket.ts` (ou équivalent projet) :

```ts
import LogRocket from 'logrocket'; // OU '@logrocket/react-native'
import setupLogRocketReact from 'logrocket-react'; // web only

const APP_ID = process.env.NEXT_PUBLIC_LOGROCKET_APP_ID ?? '';
const IS_DEV = process.env.NODE_ENV === 'development'; // OR __DEV__ for RN
const IS_BROWSER = typeof window !== 'undefined'; // web only

let initialized = false;

export function isLogRocketActive(): boolean {
  return initialized && !!APP_ID && !IS_DEV && IS_BROWSER;
}

export function initLogRocket(): void {
  if (initialized) return;
  initialized = true;
  if (!APP_ID || IS_DEV || !IS_BROWSER) return;

  LogRocket.init(APP_ID, {
    dom: { inputSanitizer: true, textSanitizer: false },
    network: { requestSanitizer, responseSanitizer },
    console: { isEnabled: { warn: true, error: true, log: false } },
    release: process.env.NEXT_PUBLIC_BUILD_VERSION ?? 'dev',
    shouldCaptureIP: false,
  });
  setupLogRocketReact();
  bridgeLogRocketToSentry();
}

export function identifyLogRocket(user: { id: string; role?: string; locale?: string } | null): void {
  if (!isLogRocketActive()) return;
  if (!user) { LogRocket.startNewSession(); return; }
  LogRocket.identify(user.id, { role: user.role ?? 'unknown', locale: user.locale ?? 'es' });
}

export function trackLogRocket(event: string, props?: Record<string, string | number | boolean>): void {
  if (!isLogRocketActive()) return;
  LogRocket.track(event, props);
}

export function captureLogRocketException(err: unknown, extra?: Record<string, string | number | boolean>): void {
  if (!isLogRocketActive()) return;
  if (err instanceof Error) LogRocket.captureException(err, extra ? { extra } : undefined);
  else LogRocket.captureMessage(typeof err === 'string' ? err : JSON.stringify(err), { extra });
}
```

### 2.2 Identify policy — TypeScript-enforced

L'identify signature **doit** restreindre les champs autorisés :

```ts
type SafeUser = { id: string; role?: string; locale?: string };
//                ↑ pas de email, phone, NIF, address, name, etc.
```

Tout `as any` bypass est un **anti-pattern** que l'agent doit refuser.

### 2.3 Init invocation

- **Next.js** : `<LogRocketProvider>` client component dans `Providers.tsx` (ou `_app.tsx`).
- **Vite** : `initLogRocket()` direct dans `main.tsx` après `createRoot`.
- **Expo RN** : `initLogRocket()` dans `<DeferredEffects>` (cf. §3.3 ci-dessous).

### 2.4 ⚠️ Piège #1 — Init eager dans Expo

Sur RN, `initLogRocket()` direct dans `_layout.tsx` ralentit le cold-start.
**Toujours** wrapper dans `InteractionManager.runAfterInteractions` ou un
composant `<DeferredEffects>` qui s'exécute après le premier paint :

```tsx
function DeferredEffects() {
  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      initSentry();
      initLogRocket();
    });
    return () => handle.cancel();
  }, []);
  return null;
}
```

### Gate Phase 2 → Phase 3
- ✅ Wrapper créé avec gating triple (`!APP_ID || IS_DEV || !IS_BROWSER`)
- ✅ TypeScript signature `SafeUser` enforcée sur identify
- ✅ Init invoqué au bon endroit selon stack

---

## 5. Phase 3 — PII redaction (4 layers, **bloquant** si compliance)

### 3.1 L1 — SDK options

| Option | Web | Mobile RN | Effet |
|---|---|---|---|
| `inputSanitizer` | `true` | n/a | Masque `<input>` content |
| `textSanitizer` | `false` (capture) | `'excluded'` (redact) | Masque/affiche les `<Text>` |
| `shouldCaptureIP` / `enableIPCapture` | `false` | `false` | Pas de géoloc |
| `console.isEnabled` | `{warn, error}` only | idem | Drop log/info/debug |

Le **default opposé entre web et mobile** est délibéré (cf. §3 doc HTML).

### 3.2 L2 — Network sanitizers

```ts
const requestSanitizer = (request) => {
  if (request.headers) {
    delete request.headers['Authorization'];
    delete request.headers['authorization'];
    delete request.headers['Cookie'];
    delete request.headers['cookie'];
  }
  if (
    request.url.includes('/auth/login') ||
    request.url.includes('/auth/register') ||
    request.url.includes('/auth/password-reset') ||
    request.url.includes('/auth/2fa')
  ) {
    request.body = undefined;
  }
  return request;
};

const responseSanitizer = (response) => {
  const url = response.url ?? '';
  if (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/2fa')) {
    response.body = undefined;
  }
  return response;
};
```

L'agent **doit adapter** la liste des endpoints aux routes d'auth du projet
(pas de hardcoding générique). Lire `.env`/routes pour identifier `/auth/*`,
`/login/*`, `/oauth/*`, `/sso/*`, etc.

### 3.3 L3 — DOM / JSX opt-in

| Surface | Pattern | Sémantique |
|---|---|---|
| **Web** | `<div data-private="redact">` | Opt-out (capture par défaut) |
| **Mobile RN** | `<LRAllow>...</LRAllow>` | Opt-in (redact par défaut) |

L'agent **doit** auditer les fichiers contenant des champs PII connus
(grep `nif|passport|address|phone|email`) et appliquer le tagging approprié.

### 3.4 L4 — Identify policy

Déjà couvert §2.2.

### 3.5 ⚠️ Piège #2 — `as any` bypass

Si un développeur fait :
```ts
identifyLogRocket({ id, email, role } as any);
```
…l'email passe quand même. **Code review obligatoire** : l'agent ajoute un
`eslint-disable` rule custom ou un commit hook qui interdit `as any` dans les
fichiers `core/observability/*`.

### Gate Phase 3 → Phase 4
- ✅ L1 SDK options validés (capture vs redact défaut conforme à l'audience)
- ✅ L2 sanitizers couvrent toutes les routes d'auth du projet
- ✅ L3 audit DOM/JSX fait (si compliance) — au moins les champs PII connus
- ✅ L4 TypeScript signature stricte
- ⏸ **Si compliance** : audit PII signé par l'utilisateur dans le commit message

---

## 6. Phase 4 — Secret topology + CI binding

### 4.1 Secret store choice

| Cloud | Secret store | Bind to runtime |
|---|---|---|
| GCP | Secret Manager (`gcloud secrets`) | `--set-secrets` Cloud Run / build-args |
| AWS | Secrets Manager | task definition `secrets` / build env |
| Azure | Key Vault | Container App MSI / build env |
| GitHub-only | Repo secrets | `${{ secrets.NAME }}` direct |
| EAS Cloud | `eas env:create` | build-time injection |

L'agent **détecte** le cloud via :
```bash
ls .github/workflows/  # pattern: deploy-frontend-staging.yml
grep -E "gcloud|aws|azure" .github/workflows/*.yml
```

### 4.2 ⚠️ Piège #3 — `NEXT_PUBLIC_*` doit être bake-time

Cloud Run `--set-env-vars` ne fonctionne **pas** pour `NEXT_PUBLIC_*` (Next.js
les bake dans le bundle au `next build`). Toujours injecter via Docker
`--build-arg` :

```yaml
# .github/workflows/deploy-frontend-staging.yml
- run: |
    gcloud builds submit \
      --substitutions=_NEXT_PUBLIC_LOGROCKET_APP_ID=${{ secrets.LOGROCKET_APP_ID }}
```

Et dans le Dockerfile :
```dockerfile
ARG NEXT_PUBLIC_LOGROCKET_APP_ID
ENV NEXT_PUBLIC_LOGROCKET_APP_ID=$NEXT_PUBLIC_LOGROCKET_APP_ID
```

### 4.3 EAS env vars — `plaintext` pas `secret`

EAS `secret`-typed env vars **redactent** les valeurs du bundle. Pour
`EXPO_PUBLIC_*` qui doivent être bakés, utiliser `--visibility plaintext` :

```bash
EXPO_TOKEN=... eas env:create --environment preview \
  --name EXPO_PUBLIC_LOGROCKET_APP_ID \
  --value "$APP_ID" --visibility plaintext --non-interactive
```

C'est OK car l'App ID est **publique** (visible dans DevTools network anyway).

### Gate Phase 4 → Phase 5
- ✅ Secret en SM/Key Vault/Secrets Manager
- ✅ Mirror GitHub repo secrets (si Actions utilisé)
- ✅ Docker build-args (web) ou EAS env (mobile) corrects

---

## 7. Phase 5 — Mobile : natifs + minSdk + EAS uploads

**Skip cette phase si projet web-only.**

### 5.1 ⚠️ Piège #4 — `minSdkVersion 24 vs 25` (LogRocket RN)

`@logrocket/react-native@1.62` requiert `minSdkVersion 25`. Expo SDK 54 default
est 24. Manifest merger fail :

```
uses-sdk:minSdkVersion 24 cannot be smaller than version 25
declared in library [com.logrocket:logrocket:1.62.0]
```

**Fix** :

1. `android/build.gradle` (canonical en non-CNG) :
   ```groovy
   ext { minSdkVersion = 25 }
   ```
2. `app.json` `expo-build-properties` (canonical en CNG) :
   ```json
   { "android": { "minSdkVersion": 25 } }
   ```

**Trade-off documenté** : ferme l'install base Android 7.0 (~0.4% global,
quasi-zéro en marché émergent type Afrique de l'Ouest).

### 5.2 ⚠️ Piège #5 — Maven repo LogRocket

LogRocket RN est hébergé sur un Maven repo dédié, pas Maven Central :

`android/build.gradle` :
```groovy
allprojects {
  repositories {
    maven { url 'https://maven.logrocket.com' }
    // ... autres repos
  }
}
```

`app.json` (informational en non-CNG) :
```json
{
  "plugins": [
    ["expo-build-properties", {
      "android": { "extraMavenRepos": ["https://maven.logrocket.com"] }
    }]
  ]
}
```

### 5.3 ⚠️ Piège #6 — `.gitignore` strip `/android` à l'upload EAS

Si `/android` est dans `.gitignore` (default Expo template), EAS
upload exclut les natifs → `ENOENT gradlew` au phase FIX_GRADLEW.

**Fix** : créer `.easignore` qui override `.gitignore` :
```
# .easignore — explicitly include /android even though gitignored
!/android
!/ios
```

### Gate Phase 5 → Phase 6
- ✅ `minSdkVersion = 25` en 2 endroits (gradle + app.json)
- ✅ Maven repo LogRocket déclaré
- ✅ `.easignore` présent (si `/android` gitignored)

---

## 8. Phase 6 — Sentry bridge (optionnel)

Skip si Sentry pas wiré sur la même surface.

### 6.1 Bridge web (Next.js)

```ts
import * as Sentry from '@sentry/nextjs';

export function bridgeLogRocketToSentry(): void {
  if (!isLogRocketActive()) return;
  LogRocket.getSessionURL((sessionURL) => {
    Sentry.getCurrentScope().setExtra('logrocketURL', sessionURL);
  });
}
```

Appel : depuis `initLogRocket()` à la fin de l'init (cf. §2.1).

### 6.2 Bridge mobile (RN)

Symétrique, en remplaçant `@sentry/nextjs` par `@sentry/react-native`. Si
Sentry RN pas encore wiré sur cette surface, garder un stub no-op.

### Gate Phase 6 → Phase 7
- ✅ Si Sentry présent : bridge actif sur cette surface
- ✅ Sinon : stub no-op documenté (comment activer plus tard)

---

## 9. Phase 7 — Tests + smoke + critique + documentation

### 7.1 Smoke test session

```bash
# Web
NEXT_PUBLIC_LOGROCKET_APP_ID="<org>/<project>" NODE_ENV=production npm run start
# Naviguer 30s sur l'app → vérifier session apparaît dans LogRocket UI
```

```bash
# Mobile
EXPO_PUBLIC_LOGROCKET_APP_ID="<org>/<project>" eas build --profile preview --platform android
# Installer l'APK, lancer 30s → vérifier session
```

### 7.2 Vérifications obligatoires

L'agent **doit lister** :

- [ ] Sessions apparaissent dans `app.logrocket.com/<org>/<project>/sessions`
- [ ] User identification fonctionne (id visible dans le panneau session)
- [ ] PII fields sont masquées dans le replay (vérification visuelle)
- [ ] Authorization header **n'apparaît pas** dans les network requests du replay
- [ ] Si Sentry bridge actif : `extra.logrocketURL` visible sur events Sentry

### 7.3 Documentation

Ajouter ou créer dans le projet :
- `infra/observability/README.md` — index des outils wirés
- Lien depuis le README principal du projet
- Mention dans le doc onboarding (`Quick Start`, `Local dev`)

### 7.4 Commit + push

Format suggéré :
```
feat(observability/logrocket): wire session replay on N surfaces

- Wrapper SDK with 4-layer PII redaction
- Identify policy: id + role + locale only
- Sentry bridge active (web|mobile|both|stub)
- Secret topology: SM → CI → runtime (build-time bake)
- Mobile: minSdk 25, Maven repo, .easignore

Smoke tested: <N> sessions verified in LogRocket UI.
PII audit: <signed by user>.
```

### Gate Phase 7 → fin
- ✅ Sessions visibles en prod LogRocket UI
- ✅ Audit PII signé (si compliance)
- ✅ Documentation à jour
- ✅ Commits locaux sémantiques
- ⏸ **Demande validation explicite avant `git push`** (pas de push auto)

---

## 10. Faiblesses connues — gérées comme garde-fous actifs

| # | Faiblesse | Garde-fou pendant l'exécution |
|---|---|---|
| 1 | Init eager bloque cold-start (RN) | Phase 2.4 — wrapper dans `InteractionManager.runAfterInteractions` |
| 2 | `as any` bypass de l'identify policy | Phase 3.5 — TS signature stricte + lint rule |
| 3 | `NEXT_PUBLIC_*` bake-time vs runtime | Phase 4.2 — `--build-arg` Docker, pas `--set-env-vars` |
| 4 | `minSdkVersion 24 vs 25` LogRocket RN | Phase 5.1 — bump en 2 endroits (gradle + app.json) |
| 5 | Maven repo LogRocket pas Central | Phase 5.2 — déclaration explicite |
| 6 | `.gitignore /android` strip à l'upload EAS | Phase 5.3 — `.easignore` override |
| 7 | App ID `secret`-typed sur EAS = redacted | Phase 4.3 — `--visibility plaintext` |
| 8 | Free tier 1K sessions/mois saturée | Phase 0.2 — alerte si stack > 1 surface — proposer Team plan ou shaving rate |

**Si une faiblesse non-listée est rencontrée**, l'agent doit :
1. Documenter la nouvelle faiblesse dans cette table
2. Proposer un garde-fou actif (pas juste un disclaimer)
3. Mettre à jour le slash-command anti-patterns

---

## 11. Annexe — Stack adapter table

| Concept | Next.js | Vite / CRA | Expo (CNG) | Expo (non-CNG) | Bare RN |
|---|---|---|---|---|---|
| Env var prefix | `NEXT_PUBLIC_` | `VITE_` / `REACT_APP_` | `EXPO_PUBLIC_` | `EXPO_PUBLIC_` | `process.env.*` |
| Init location | `<Provider>` client | `main.tsx` post-createRoot | `<DeferredEffects>` | idem | `App.tsx` post-mount |
| SDK packages | `logrocket@12 + logrocket-react@7 + @sentry/nextjs` | `logrocket@12 + logrocket-react@7` | `@logrocket/react-native@1.62 + @sentry/react-native` | idem | idem |
| Bake-time injection | Docker `--build-arg` | Vite build env | EAS env plaintext | EAS env plaintext | env at native build |
| Native config (Android minSdk) | n/a | n/a | `app.json plugins expo-build-properties` (canonical) | `android/build.gradle` (canonical) | `android/build.gradle` |
| Maven repo location | n/a | n/a | `app.json plugins extraMavenRepos` (canonical) | `android/build.gradle` (canonical) | idem |
| EAS uploads | n/a | n/a | EAS auto | `.easignore` override required | n/a |
| Sentry bridge | `@sentry/nextjs scope.setExtra` | `@sentry/browser scope.setExtra` | `@sentry/react-native scope.setExtra` | idem | idem |

L'agent **lit cette table** au début de chaque phase pour adapter ses
artefacts. Pas d'inférence : si la stack est inconnue, demander à
l'utilisateur.

---

## 12. Reproductibilité multi-projets

Cet agent fonctionne sur **n'importe quel projet** :
1. Copier `infra/observability/LOGROCKET_OBSERVABILITY_AGENT.md` dans le nouveau repo
2. Copier `.claude/commands/logrocket-observability.md` (slash-command)
3. Adapter les chemins (`src/core/observability/` ou équivalent du projet)
4. Lancer `/logrocket-observability` → l'agent guide depuis zéro

**Validation** : projet **Facil (taxasge)** — wirage 3 surfaces (web, mobile,
inspector) en une session, 8 pièges neutralisés. Voir
`.claude/plans/OBSERVABILITY_STACK.md` pour le bilan complet de
l'implémentation initiale.

---

**Version** : 1.0 (2026-05-04)
**Auteur** : Distillé de la session Facil Observability LogRocket+Sentry
**Maintenance** : à mettre à jour à chaque nouveau piège rencontré sur futur projet
