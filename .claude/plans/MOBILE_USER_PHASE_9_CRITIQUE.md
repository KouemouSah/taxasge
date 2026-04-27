# PHASE 9 — Auto-critique & DoD Validation

**Date** : 2026-04-27
**Phase** : `MOBILE_USER_PHASE_9_DETAILED.md`
**Statut** : ✅ Code livré + `SENTRY_AUTH_TOKEN` poussé dans GitHub Secrets. Pytests backend non joués (RGPD export — V11 ⏳). Validation device + Sentry capture synthétique ⏳.

---

## 1. Bilan factuel

| Sous-phase | Avant | Après |
|------------|-------|-------|
| **9.1 npm audit** | 1 HIGH (xmldom × 5 CVEs) + 20 MODERATE (axios SSRF, follow-redirects, etc.) | HIGH=0 (xmldom + axios bumpés). 17 moderate restantes (markdown-it transitif, postcss bloqué par downgrade Expo, uuid via xcode build-tool). Pushé `771019e2`. |
| **9.2 Sentry** | Aucune observabilité prod | `@sentry/react-native ~7.2.0` autolinké, `core/observability/sentry.ts` avec init derrière `useDeferredAfterInteractions`, `beforeSend` strip PII (email/phone GE/NIF), `setSentryUser` sans email, ErrorBoundary wrapper, DSN dans `.env.{development,production}`, `SENTRY_AUTH_TOKEN` dans GitHub Secrets pour upload sourcemaps EAS futur. |
| **9.3 Logger** | `console.warn/error` sur 4-5 fichiers | `core/logging/logger.ts` route Sentry/console selon `__DEV__`. Migration de chatbot-api, services-hooks, use-device-token-registration (×2), wizard-hooks. |
| **9.4 Biometric S1** | `setItemAsync` ne passait pas les `requireAuthentication` opts → password lisible sans biometric | Opts passés sur write **et** read → l'OS keystore bloque la lecture sans auth biométrique. Refactor refresh-token-only documenté V1.5. |
| **9.5 MMKV S4** | Clé hardcodée `'facil-mmkv-key'` | Documenté avec note explicative — refonte async deferred V1.5. Le **contrat** MMKV (no sensitive data) borne le risque réel à des préférences UI uniquement. |
| **9.6 Android backup** | `allowBackup="true"` + références à 2 XMLs absents = backup ADB ouvert | `allowBackup="false"` + références aux XMLs retirées. Backup ADB désactivé. |
| **9.7 Deep link whitelist** | Tout chemin `data.deep_link` dispatché sans validation | `ALLOWED_PATH_PREFIXES` Set explicite (10 segments) ; chemins hors liste → fallback `/(tabs)/notifications` + warn Sentry breadcrumb. |
| **9.9 Device integrity** | Aucun check | `core/security/device-integrity.ts` : check `expo-device.isDevice` + brand/model fingerprint emulator. Rapport non-bloquant à Sentry (breadcrumb + captureMessage warning). |
| **9.10 RGPD export** | Pas d'endpoint art. 20 | Backend `GET /users/profile/export` synchrone (90j cap, profil + payments + service_requests, JSON attachment), audit_log entry. Mobile écran `app/settings/account/export.tsx` (apiGet → writeAsStringAsync → Sharing.shareAsync). Lien profile section "Mes données". i18n × 3 langues. |

**Stats** : ~14 fichiers modifiés/créés, +1 backend route + (à venir) pytests, i18n drift toujours synchro (821 clés × 3 langues).

---

## 2. Items reportés explicitement

| Item | Raison | Cible |
|------|--------|-------|
| **M5 SSL Certificate Pinning** | Cloud Run cert change parfois ; rotation manuelle complexe | V1.1 quand TLS topology stable |
| **M7 Anti-tampering binaire** | Gros chantier (`react-native-jail-monkey` + custom Frida-detection). Defense-in-depth, pas first-line | V2 |
| **9.5 MMKV key SecureStore-derived** | Refonte async du boot casse tous les call-sites synchrones. Risque > gain (contrat MMKV = no sensitive data) | V1.5 quand boot async refactor |
| **9.4 Biometric refresh-token-only** | Demande nouveau flow `bootstrapFromTokens` côté AuthProvider + tests E2E | V1.5 |
| **9.8 Refresh token TTL 30j → 7j** | Décision utilisateur explicite : "on garde 30j" (UX > sécurité aigue ici) | Pas en V1 |
| **Sentry sourcemaps upload** | DSN posé, `SENTRY_AUTH_TOKEN` dans GitHub Secrets, MAIS pas de hook EAS post-build configuré | V1.1 (5 min) |
| **Pen-test interne** | Audit externe à organiser séparément | Hors scope dev |

---

## 3. Vérifications mémoire #35

| Étape | Résultat |
|-------|----------|
| 1. `tsc --noEmit` | ✅ 0 erreur |
| 2. ESLint sous 100 warnings | ✅ 91 (vs 90 P8 — 1 nouveau warning sur logger.ts `console.debug` voulu) |
| 3. i18n drift script | ✅ 821 clés × 3 langues, exit 0 |
| 4. `npm audit` | ✅ HIGH=0 (objectif atteint) |
| 5. Aucune régression P0..P8 | ✅ Modifs additives. ErrorBoundary wrappé Sentry sans casser le fallback i18n. Logger garde le comportement console en dev |
| 6. Auto-critique | ✅ (ce fichier) |
| 7. Commits sémantiques | ⏳ À grouper |

---

## 4. Risques de régression

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Sentry init lent au boot bloque le first paint | FAIBLE | MOYEN | Init derrière `<DeferredEffects />` (P8 A3) → InteractionManager |
| `beforeSend` PII regex trop agressive → events vides | FAIBLE | FAIBLE | Tests des regex sur données synthetiques, monitoring volume events post-deploy |
| Biometric `requireAuthentication` casse l'unlock app sur certains devices | MOYENNE | MOYEN | Si ça arrive, expo-secure-store warn dans logs ; le fallback `LocalAuthentication.authenticateAsync` explicit reste en place |
| `allowBackup=false` empêche un transfert d'app via Google Migrate | FAIBLE | FAIBLE | UX cost acceptable pour app fiscale ; les utilisateurs se reconnectent normalement |
| Deep link whitelist trop strict bloque un nouveau path | FAIBLE | FAIBLE | Liste explicite à étendre quand on ajoute un nouvel écran navigable depuis push |
| RGPD export 90j > 1000 items = response lourde | FAIBLE | FAIBLE | LIMIT 1000 hardcodé, pagination V2 |
| `SENTRY_AUTH_TOKEN` exposé en clair dans la conversation | CERTAINE | MOYEN | **Demandé à l'utilisateur de révoquer + recréer**. GitHub Secret stocké chiffré côté GitHub |

---

## 5. Gap honnête

1. **Pytest backend RGPD export non livré** — V11 incomplet. Test pytest à ajouter pour le `GET /users/profile/export` (3 cas : authenticated 200, unauthenticated 403, ownership check 200 sur own data uniquement).
2. **Smoke test Sentry** — pas joué. À faire au moment du build EAS preview suivant : déclencher une exception synthétique côté staging + vérifier dashboard Sentry.
3. **Sourcemaps upload EAS** — non câblé. Le secret est posé, le hook reste à ajouter dans `eas.json` (`postBuild` → `sentry-cli sourcemaps upload`).
4. **MMKV S4 + Biometric refresh-token-only** — patches partiels seulement. V1.5 prévu.

---

## 6. Recommandation push

Commits groupés, push à la fin de la session après validation utilisateur. P9.1 déjà pushé isolé (`771019e2`) → CI vert backend + frontend confirmé.

---

## 7. Next — Phase 10

P10 = E2E (Detox/Maestro) + App Stores. Aucune dépendance bloquante avec P9.
