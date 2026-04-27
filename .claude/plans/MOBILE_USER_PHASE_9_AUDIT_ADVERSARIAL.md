# PHASE 9 — Audit adversarial du code livré

**Date** : 2026-04-27
**Posture** : pas la critique DoD optimiste — relecture honnête en mode reviewer
hostile, à la recherche de bugs réels, raccourcis, gaps non documentés.

## Méthode

J'ai relu chaque fichier modifié de P9.1 → P9.10 + le critique précédent.
Pour chaque finding je distingue :
- 🔴 **Bug réel** (corrigé pendant cette critique)
- 🟠 **Gap honnête non documenté précédemment**
- 🟡 **Choix discutable** (pas un bug, à nuancer)
- ✅ **Faux positif** (j'ai vérifié, c'est en fait OK)

---

## 🔴 Bugs réels trouvés et corrigés

### B1 — `SentryErrorBoundary` ne capturait jamais les erreurs

**Fichier** : `app/_layout.tsx` + `components/ui/error-boundary.tsx`
**Diagnostic** :
```
<SentryErrorBoundary>          ← outer (Sentry's built-in)
  <ErrorBoundary>              ← inner (our i18n fallback)
    <RootNavigator />
  </ErrorBoundary>
</SentryErrorBoundary>
```
Quand un composant du tree throw, l'inner `<ErrorBoundary>` l'intercepte via
`getDerivedStateFromError` et rend son fallback. **L'erreur ne propage pas**
vers le parent `<SentryErrorBoundary>`. Conséquence : **Sentry ne capture
aucune erreur de rendu** — toute la valeur d'observability error-tracking
était nulle pour les erreurs React.

**Fix livré pendant la critique** :
- `ErrorBoundary` gagne un `componentDidCatch` qui appelle
  `captureException(error, { tag, extra: componentStack })`.
- Le wrapper `<SentryErrorBoundary>` est retiré (redondant).
- `SentryErrorBoundary` retiré de l'import dans `_layout.tsx`.

**Impact** : la critique précédente (`MOBILE_USER_PHASE_9_CRITIQUE.md`)
affirmait "ErrorBoundary wrappé Sentry" — c'était techniquement vrai mais
**fonctionnellement faux**. Sans ce fix, l'observability d'erreurs JS aurait
été morte en prod.

---

## 🟠 Gaps honnêtes non documentés précédemment

### G1 — Frontend export sync timeout 30s

**Fichier** : `app/settings/account/export.tsx`, `core/api/client.ts`
Le client axios timeout à `appConfig.api.timeout = 30000ms`. Le backend
`GET /users/profile/export` agrège jusqu'à 1000 payments + 1000 service_requests
+ profile en synchrone. Pour un user actif (rarement) cela peut dépasser 30s →
axios timeout → user voit "Could not export your data".
**Pas fixé** dans P9. Workaround V1 : la limite 90j tient le worst-case
sous quelques secondes. À monitorer.

### G2 — Backend export ne signale pas la troncature

**Fichier** : `app/modules/users/api/user_routes.py:467,481`
Les SELECT ont `LIMIT 1000` sans flag dans la réponse pour dire "X items
truncated". Si un user a 1100 paiements, il en récupère 1000 + zéro indice.
**Fix simple** futur : ajouter `truncated_at_limit: bool` dans `counts`.

### G3 — Sentry `beforeSend` regex NIF trop restrictive

**Fichier** : `core/observability/sentry.ts:172`
Pattern `/\b(?:NIF|nif|TAX|tax)[\s:]*[A-Z0-9]{6,12}\b/g` ne match QUE si les
labels "NIF" ou "TAX" sont présents juste avant. Un message qui logge un NIF
brut sans label (ex: `"Conflict on doc 12345678X"`) **passe**. Pour Equatorial
Guinea le format NIF n'est pas uniformisable en regex défensive sans
faux-positifs sur des UUIDs / IDs internes. **Trade-off acceptable V1** :
defense-in-depth, pas zero-leak.

### G4 — Pas de smoke test Sentry

DSN configuré, `SENTRY_AUTH_TOKEN` dans GitHub Secrets, mais on n'a **pas
envoyé d'exception synthétique** pour vérifier que le pipeline marche. Reporté
au build EAS preview suivant — déclencher une erreur volontaire sur staging,
vérifier Sentry dashboard reçoit l'event.

### G5 — Sentry sourcemaps upload jamais câblé

J'ai mis `SENTRY_AUTH_TOKEN` dans GitHub Secrets mais **aucun hook EAS
post-build** n'invoque `sentry-cli sourcemaps upload`. Sans ça, les stack
traces en prod resteront minified. Reporté V1.1 (5 min de config).

### G6 — `reportDeviceIntegrity()` ne refire pas après auth state change

**Fichier** : `_layout.tsx <DeferredEffects />`
Le check tourne une fois au cold-start. Si un user signOut/signIn dans la
même session, on ne re-reporte pas. **Acceptable V1** : c'est de la
télémétrie cold-start, pas un check périodique.

### G7 — Migration biometric P9.4 pas testée on-device

Les entries SecureStore écrites avant P9.4 (sans `requireAuthentication`)
seront tentées d'être lues avec `requireAuthentication: true` au prochain
`getBiometricCredentials`. **En théorie** Android Keystore retourne null
silencieusement (les flags ne matchent pas), donc l'utilisateur est forcé à
re-login. **Pas vérifié on device**. Si Android crash au lieu de retourner
null, l'app peut devenir non utilisable jusqu'à clear data. À valider.

### G8 — Pas de pytest pour `GET /users/profile/export`

Promis dans le plan détaillé (V11), pas livré. Vrai gap, à rattraper.

### G9 — `@sentry/react-native ~7.2.0` pas validé en build EAS

SDK très récent, n'a pas tourné en build EAS Android pour l'instant.
Risque d'incompatibilité New Architecture / SDK 54. À valider au prochain
EAS build.

### G10 — `postcss <8.5.10` reste en moderate sans alerting

J'ai écarté ce fix car il demande un downgrade Expo (refusé). Mais
postcss XSS via `</style>` est exploitable côté **build pipeline** (Metro
bundler), pas runtime APK. Conclusion juste, mais aurait dû être plus
explicite dans le commit message.

---

## 🟡 Choix discutables (pas des bugs)

### D1 — RGPD export inclut email + phone + document_number en clair

C'est **EXACTEMENT le but** de RGPD art. 20 : restituer à l'utilisateur ses
propres données. Pas un leak. Mais le commit message aurait dû le souligner
pour éviter qu'un reviewer pense "tiens, on dump des PII".

### D2 — `device-integrity.ts` heuristics super faibles

Le commentaire de fichier dit "not a hard gate, defense in depth". Vrai. Mais
un attaquant root qui définit `Build.BRAND` à "samsung" passe les checks.
**Soit on assume** (V1), **soit on intègre `react-native-jail-monkey`** (V2).
Pas un bug, choix conscient.

### D3 — MMKV S4 reporté V1.5 — pas vraiment résolu

L'audit holistique listait MMKV key hardcodée comme issue sécurité. Mon fix
P9.5 = **un commentaire**, pas un fix. Honnête mais pas idéal. Le contrat
"no sensitive data" tient parce que le code respecte la discipline, pas parce
que le système l'enforce.

### D4 — Refresh token TTL 30j gardé sur décision utilisateur

Valide selon ton choix explicite, mais nous laisse exposés 30 jours sur
device volé sans révocation manuelle. À documenter dans la procédure
incident response.

---

## ✅ Faux positifs vérifiés

### F1 — Backend export `LIMIT 1000` "couper au mauvais endroit"

J'avais paniqué que l'ORDER BY puisse couper aux mauvais items. En fait
l'ORDER BY desc + LIMIT donne les **1000 plus récents**, ce qui est ce qu'un
user attend pour un export 90 jours. OK.

### F2 — `setSentryUser` flow signOut

J'ai vérifié : l'effet dans `auth-provider.tsx` réagit à `state.user` →
`null` au signOut → `Sentry.setUser(null)` via le helper. OK.

### F3 — `allowBackup` Android

J'ai modifié à la fois le manifest local (gitignored) et `app.json`
`android.allowBackup: false`. Le manifest local sera ignoré au prebuild
suivant qui régénère depuis `app.json`. OK.

### F4 — `axios ^1.15.2` SSRF

Vérifié dans le advisory : la fix est dans 1.12.0, on est à 1.15.2. Bien
patché.

---

## Bilan

| Catégorie | Count | Action |
|-----------|------:|--------|
| 🔴 Bug réel | 1 | Fixé pendant la critique (B1) |
| 🟠 Gap non documenté | 10 | Documenté ici, action selon priorité |
| 🟡 Choix discutable | 4 | Documenté (assumé) |
| ✅ Faux positif | 4 | Vérifié OK |

**Verdict honnête** : le P9 livré marchait fonctionnellement (HIGH=0,
RGPD export, deep link allowlist, device integrity télémétrie, Android
backup off, etc.) mais **l'erreur de wrapping Sentry/ErrorBoundary aurait
rendu l'observability inutile en prod**. Catch grâce à la relecture.

Plusieurs gaps moyens (G1-G10) restent ouverts mais tous documentés —
roadmap V1.1 / V1.5 claire.

## Action suivante

1. Commit du fix B1 (`error-boundary.tsx` + `_layout.tsx`).
2. Push de tous les commits P9.
3. Au prochain build EAS preview : déclencher une erreur synthétique
   pour valider que Sentry capture (G4) → si oui, fermer aussi G9
   (compat SDK 54).
