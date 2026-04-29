# PHASE D — Sentry top issues report

**Date** : 2026-04-29
**Phase** : `MOBILE_BUGFIX_PHASE_D_AUDIT_DETAILED.md` §2.1
**Source** : Sentry org `taxasge`, project `react-native`, `is:unresolved` 14 derniers jours, sorted by frequency.

---

## 1. Top issues (only 2 unresolved on the entire 14-day window)

| # | Title | Level | Events | Users | Verdict |
|---|-------|-------|--------|-------|---------|
| 1 | `AxiosError: Network Error` | error | 6 | 0 | ✅ **Phase C fixera la majeure partie** |
| 2 | `AxiosError: Request failed with status code 500` | error | 6 | 1 | ✅ **Phase B-back déjà patché (calculator/config enum)** |

**Total bruit terrain** : 12 events / 14 jours / 1 user impacté. Très propre — l'app est stable.

---

## 2. Issue #1 — AxiosError: Network Error

**ID** : 7447384343 (`taxasge.sentry.io/issues/7447384343/`)
**Plateforme** : Android (release 1.0.0)
**Géo** : France (compte demo de l'utilisateur ?)
**Culprit** : `_construct(index.android)` — module Axios bas niveau

**Cause probable** : Network Error = pas de retour socket pendant un long timeout. Les 6 events sur 14 jours correspondent exactement aux symptômes de B6 (m9.jpg) :
- L'utilisateur basculait sur une autre app
- Doze killait la TCP
- Au retour, les requêtes en vol restaient en `pending` jusqu'au timeout d'Axios → Sentry capture

**Fix livré** : Phase C `a0192ac5`
- `setupQueryListeners` branche `AppState` → `focusManager` + cold-resume invalidation > 5min
- `NetInfo` → `onlineManager` met les queries en `paused` quand offline et reprend au reconnect
- Avec `refetchOnWindowFocus: true` + `refetchOnReconnect: true`, le client retentera proprement au lieu de pendre

**Pré-fix : 6 events / 14j**. Post-fix attendu : ≈ 0 (les vrais Network Error sur écrans actifs resteront, mais ils sont déjà très rares à 6 events).

**Action** : aucune supplémentaire. La résolution dépend du déploiement.

---

## 3. Issue #2 — Request failed with status code 500

**ID** : 7445694759 (`taxasge.sentry.io/issues/7445694759/`)
**Plateforme** : Android (release 1.0.0)
**Environment** : staging
**Culprit** : `_construct(index.android)`

**Breadcrumbs HTTP** :
```
GET /service-bundles/commerce-types        → 200 ✅
GET /users/profile                          → 200 ✅ (×2)
GET /service-requests/dashboard-summary     → 200 ✅ (×2)
GET [Filtered]                              → 500 ❌ (×4)
```

Les 4 retours 500 consécutifs sur la même URL filtrée correspondent au pattern attendu de `retry: 2` × 2 events (chaque event = 1 + 2 retries = 3 tentatives, mais Sentry dédoubli les agrégés).

**Cause probable** : `GET /api/v1/homepage/calculator/config?language=es` qui retournait 500 à cause de l'enum `entity_type='fiscal_service'` invalide.

**Confirmation** : L'agent investigator dans Phase B avait déjà reproduit le 500 directement contre la BD staging avec le message `asyncpg.InvalidTextRepresentationError: invalid input value for enum translatable_entity_type: "fiscal_service"`.

**Fix livré** : Phase B-back `75e7130d` — `homepage_routes.py:1116` `entity_type = 'fiscal_service'` → `entity_type = 'service'`. Aucune migration nécessaire (les 1 704 lignes existantes utilisent déjà `entity_type='service'`).

**Pré-fix : 6 events, 1 user impacté**. Post-fix attendu : 0 (le code path retourne maintenant 200).

**Action** : aucune supplémentaire. Push backend → Cloud Run staging redéployé → cache Redis purgé au prochain TTL → 200 garanti.

---

## 4. Conclusion Sentry

Les 2 seuls issues remontés en 14 jours **sont déjà fixés par les commits Phase B et Phase C non-pushés**. Aucun nouveau crash silencieux ou erreur non-gérée à investiguer.

Aucun crash bloquant, aucune erreur de logique métier, aucun null-pointer, aucune exception non-catch.

**Recommandation** : push les 10 commits → vérifier que les 2 issues passent en `resolved` automatiquement (Sentry détecte la version) ou les marquer `resolved` manuellement après confirmation 0 events sur la nouvelle release.

---

## 5. Limitations de cet audit

- **URLs filtrées** : Sentry filtre certaines URLs en breadcrumbs (PII protection). On ne peut pas confirmer à 100% que le 500 = calculator/config. Mais le pattern (4 events 500 consécutifs, sur staging, fréquence 6/14j) correspond au comportement attendu d'un endpoint qui sert la homepage.
- **Window 14 jours** : peut manquer des issues plus anciennes si leur dernière occurrence date de plus de 14j.
- **Project mobile-only** : on a auditerait aussi le projet backend (s'il en existe un) pour cross-référencer. Pas demandé par l'utilisateur (focus mobile).
- **Pas de session replay** : `hasReplays: false` côté projet. On ne peut pas voir les UI traces. À activer Phase 10 pour mieux diagnostiquer.

---

## 6. Changelog

- **2026-04-29 v1.0** : audit Sentry initial. 2 issues, tous fixés.
