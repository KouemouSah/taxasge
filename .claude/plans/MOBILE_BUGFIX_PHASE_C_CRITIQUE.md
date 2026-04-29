# PHASE C — Auto-critique & DoD Validation

**Date** : 2026-04-29
**Phase** : `MOBILE_BUGFIX_PHASE_C_RESUME_DETAILED.md`
**Statut** : ✅ Code livré (commit `a0192ac5`), tsc 0, ESLint 0. Smoke device en attente Phase D.

---

## 1. Bilan factuel

### Avant
- `_layout.tsx::queryClient` configuré avec `refetchOnWindowFocus: false`, pas de `refetchOnReconnect`. Aucun bridge `AppState`/`NetInfo` ↔ `focusManager`/`onlineManager`.
- Conséquence : sockets killed par Android Doze / iOS power management restent "in flight" pour React Query → spinner indéfini sur /servicios et /empresas après long background (m9.jpg).
- `useNetwork` (`core/hooks/use-network.ts`) écoutait `NetInfo` mais exposait juste l'état au composant — pas connecté à React Query.
- `AppState` listener existait dans `core/security/app-lock.tsx` mais uniquement pour le verrou biométrique.

### Après
| Surface | Changement |
|---------|------------|
| `core/api/query-listeners.ts` | **NOUVEAU** — `setupQueryListeners(queryClient)` enregistre 2 subscriptions : (a) AppState → focusManager + cold-resume invalidation > 5min ; (b) NetInfo → onlineManager. Retourne cleanup. |
| `_layout.tsx::queryClient` | `refetchOnWindowFocus: false → true`, `refetchOnReconnect: true` ajouté. Comments explicitent le pourquoi (RN n'a pas de `window.focus`, le bridge fait le pont). |
| `_layout.tsx::DeferredEffects` | `useEffect(() => setupQueryListeners(queryClient), [])` ajouté entre les autres `useEffect` (Sentry, device integrity, notifications). |

### Stats
- 2 fichiers modifiés (1 nouveau, 1 modifié)
- `tsc --noEmit` : EXIT=0
- ESLint sur `query-listeners.ts` + `_layout.tsx` : 0 warning
- 0 nouveau dependency installée — `AppState` (RN core), `NetInfo` (`@react-native-community/netinfo` déjà présent), React Query (déjà présent)

---

## 2. Validation DoD Phase C

| # | Critère | Méthode | Résultat |
|---|---------|---------|----------|
| V1 | `setupQueryListeners` enregistre 2 subscriptions cleanup-able | revue code | ✅ `query-listeners.ts:62-66 + 79-83` |
| V2 | `focusManager.setFocused(true)` sur `'active'`, `false` sinon | revue code | ✅ `query-listeners.ts:51` |
| V3 | `onlineManager.setOnline(false)` quand `state.isConnected === false` | revue code | ✅ `query-listeners.ts:73-78` |
| V4 | Cold-resume > 5min déclenche `invalidateQueries` ciblé | revue code | ✅ `query-listeners.ts:52-67` |
| V5 | Auth queries (`['auth']`) NON invalidées au resume | revue prefix list | ✅ `CRITICAL_QUERY_PREFIXES` n'inclut PAS `auth`/`session`/`refresh-token` |
| V6 | Payment polling (`['payments']`) NON invalidé | revue prefix list | ✅ pas dans la liste |
| V7 | Coexistence avec `app-lock.tsx::AppState` | revue + grep | ✅ Les deux utilisent `AppState.addEventListener`, indépendants. Pas de mutation partagée. |
| V8 | tsc 0 erreur | CI local | ✅ EXIT=0 |
| V9 | ESLint 0 nouveau warning | CI local | ✅ EXIT=0 |
| V10 | Smoke device "background 6min" | EAS preview | ⏳ pending Phase D |
| V11 | Smoke "mode avion ON/OFF" reprise queries paused | EAS preview | ⏳ pending Phase D |

---

## 3. Risques de régression — analyse honnête

| Risque | Probabilité | Impact | Mitigation appliquée |
|--------|-------------|--------|----------------------|
| `refetchOnWindowFocus: true` cause refetch bruyants sur switch d'app rapide | MOYENNE | FAIBLE | `staleTime: 2min` borne à 1× / 2min par query. Si nuisible → ciblage via `meta.refetchOnFocus: 'always'` sur seules les listings. |
| Cold-resume invalidation cause flicker UI | MOYENNE | FAIBLE | C'est l'UX souhaité — montrer que la donnée se rafraîchit. Bien pire = afficher données stale d'il y a 6h+. |
| `onlineManager.setOnline(false)` met queries en `paused` → spinners visibles | FAIBLE | NULL | Comportement souhaité. Reprise auto au retour réseau. |
| Conflit listeners AppState (app-lock + query) | NULL | NULL | API supporte plusieurs subscribers, pas de mutation partagée. |
| `NetInfo.isInternetReachable === null` mal géré | NULL | NULL | Code traite explicitement `null` comme "ne pas trancher" → ne désactive pas online (`reachable !== false`). |
| Cold-resume invalidation en plein milieu d'une requête en cours | FAIBLE | FAIBLE | `invalidateQueries` marque comme stale, ne cancel pas. La requête en vol termine, suivie d'un refetch si l'observer est encore présent. |
| Régression workflows non-bundle (Pasaporte, Conducir, etc.) | NULL | NULL | Pas de toucher au code workflow. Le QueryClient sert tous les hooks → tous bénéficient du fix. |
| Le seuil 5min mal calibré | FAIBLE | FAIBLE | Constante module `RESUME_THRESHOLD_MS` documentée. Réglable par PR si feedback. |

---

## 4. Gap honnête

1. **Smoke device pas fait** — V10/V11 conditionnels au build EAS preview (groupé Phase D).
2. **Pas de telemetry** — on ne sait pas si le bug se reproduit en prod après ce fix. À ajouter via Sentry breadcrumb dans Phase D : `breadcrumb('cold-resume invalidate', { elapsed_ms })`.
3. **Pas de test unitaire** — testing AppState transitions demande un harness dédié (Jest + RN testing library + mock AppState). Cohérent avec règle "tests E2E Phase 10".
4. **Le seuil 5min est arbitraire** — choisi sur la base "couvre les heures du bug, ignore les switches courts". Pourrait être 3 min ou 10 min. Tunable plus tard si feedback terrain.
5. **Aucune invalidation des queries qui n'utilisent pas le préfixe canonique** — les hooks legacy avec queryKey du genre `['my-companies']` (pluriel) au lieu de `['companies']` (singulier au préfixe) ne seront PAS touchés. À auditer Phase D.
6. **Pas de différenciation iOS/Android** — Android Doze + iOS background fetch ont des comportements différents. Le pattern `AppState` couvre les deux mais l'agressivité du système diffère. À surveiller.

---

## 5. Recommandation push

Phase C est **isolée** et complémentaire à A+B. Les 3 phases peuvent être push ensemble.

État local au 2026-04-29 fin Phase C : **10 commits** non-push depuis la dernière base.

Commit Phase C : `a0192ac5 fix(mobile): query-client — wire AppState/NetInfo + cold-resume invalidation (B6 m9)`.

Push reste **en attente confirmation utilisateur** (mémoire #13). Recommandation : continuer Phase D (audit Sentry + retroactive checklists + EAS build) avant push final pour livrer un soft-launch cohérent.

---

## 6. Next — Phase D

- D.1 Lecture Sentry top 20 issues mobile (token disponible `debug/.env`)
- D.2 Audit câblage exhaustif (~30 routers backend vs modules mobile)
- D.3 Validation rétroactive checklists Phase 0-9
- D.4 EAS preview build (token Expo `GpS6tyEUc-...` scope `facil/`)
- D.5 Smoke device groupé (V1-V11 Phase A/B/C)
- D.6 Push final + GitHub Actions vert

---

## 7. Changelog

- **2026-04-29 v1.0** : créé après implémentation Phase C. tsc/ESLint OK. Auto-critique honnête.
