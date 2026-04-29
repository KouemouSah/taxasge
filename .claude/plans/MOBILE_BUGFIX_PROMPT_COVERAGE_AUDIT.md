# Audit de couverture — prompt initial vs livré

**Date** : 2026-04-29
**Source** : prompt utilisateur de démarrage (8 préoccupations explicites + 4 méta-règles)
**État au moment de l'audit** : 4 commits locaux non-push

---

## 1. Couverture des bugs explicitement listés dans le prompt

| # | Préoccupation | Image | Statut | Commit | Notes |
|---|--------------|-------|--------|--------|-------|
| 1 | Onboarding — bouton "Explorer sans compte" collé au texte | `onboard.jpg` | ✅ Livré | `adc92e4f` | Phase A — `desc.marginBottom 28→36` + `lastSlideButtons.gap 10→12` + `paddingTop:12` |
| 2 | Calculatrice non câblée backend | (texte) | ⚠️ Livré avec ambiguïté | `75e7130d` + `232139f3` | Voir §2 ci-dessous |
| 3 | Tickets — input et FAB coupés par nav system | `m11.jpg`, `m12.jpg` | ✅ Livré | `309cc848` | Phase A — `useSafeAreaInsets` sur les 2 écrans |
| 4 | Documents — content chevauche filtres / centré au lieu d'en haut / empty mal disposé | `m3.jpg`, `m4.jpg`, `m5.jpg`, `m6.jpg` | ✅ Livré | `748cb252` | Phase A — `flex:1` + `flexGrow:1` + `paddingTop:48` empty |
| 5a | Mes entreprises — "Ajouter" ouvre liste recherche au lieu OCR-create + idem wizard solicitude commerciale | `m13.jpg` | ✅ Livré | `cb0e8223` | Phase B — FAB → `/bundle-wizard?mode=new` + CTA toujours visible + 8e champ NIF parité |
| 5b | License card — variantes couleur échéance/total/payé + centrer bouton télécharger + historique paiements dans menu kebab | `m14.jpg` | ✅ Livré | `e86461df` | Phase A — chips colorés + bouton centré + route `/companies/[id]/payments` |
| 6 | Resume from background — Services + Empresas ne rechargent pas après bascule | `m9.jpg` | ❌ **NON livré** | — | Phase C jamais implémentée. Bloquant soft-launch. |
| 7 | Directorio — toutes les entreprises ne se chargent pas (pagination) | (texte) | ✅ Livré | `5d878c56` | Phase B — `useInfiniteQuery` + `onEndReached` + footer loader |

**Score : 7/8 bugs traités** (87,5%). B6 reste à implémenter.

---

## 2. Ambiguïté B2 calculatrice — auto-critique honnête

Le prompt dit : **"câbler EXACTEMENT tel que le backend"**.

Interprétation possible 1 (parité web) — choisie : le web `calculateur/page.tsx` fait du calcul **client-side** (IRPF brackets, VAT 15%, Corporate 35%, formula evaluator) + un seul appel backend `GET /homepage/calculator/config` pour permettre à l'admin de surcharger les pourcentages/formules sans redéploiement. C'est ce qu'on a porté sur mobile.

Interprétation possible 2 (calc serveur strict) : appeler `POST /api/v1/fiscal-services/calculate` pour CHAQUE calcul afin que le serveur soit la source unique de vérité. Cet endpoint existe (`fiscal_service_routes.py:502`, `Depends(get_current_user)` requis).

**Ce qui a été livré** : Interprétation 1 (parité web exacte).

**Pourquoi** :
- Phrase 1 du prompt : "câbler exactement tel que le backend". Phrase 2 (du master plan v1.0) : parité fonctionnelle web↔mobile = règle de base.
- Le web n'utilise PAS `POST /calculate` (vérifié exhaustivement dans `calculateur/page.tsx`). Si on appelait `POST /calculate` côté mobile uniquement, on créerait une **divergence** mobile/web — l'inverse de la règle de parité.
- L'endpoint `POST /calculate` requiert l'auth (`Depends(get_current_user)`) ; la calculatrice citoyenne doit fonctionner en mode public (avant login) — usage pré-inscription.

**Risque résiduel** : si l'utilisateur entendait l'interprétation 2, le port actuel ne répond pas à son besoin. À clarifier avant push. Si interprétation 2 confirmée → ajouter une option "calcul serveur" dans le tab Services qui appelle `POST /calculate` (mode connecté uniquement).

---

## 3. Couverture des préoccupations méta-fonctionnelles du prompt

| # | Méta-préoccupation | Statut | Notes |
|---|---|---|---|
| M1 | "App correctement câblée backend, expose toutes les fonctionnalités frontend dans la même logique" | ⚠️ Partiel | Phase D audit jamais lancé. Au-delà de B2/B5a/B7, on n'a pas comparé exhaustivement les ~30 routers backend vs les modules mobile. |
| M2 | Sentry — token fourni dans `debug/.env`, lecture des logs attendue | ❌ Non fait | Le token est dispo (`sntryu_b54...`). Aucun appel API Sentry réalisé pour identifier crashes/erreurs en prod. |
| M3 | "Détecter tout type de bugs : crashes silencieux, erreurs non gérées, alignement, câblage..." | ⚠️ Partiel | Couvre les bugs que l'utilisateur a vus à l'œil nu. Pas d'audit code-base systématique pour `try/except` muets, console.error en prod, endpoints orphelins. |
| M4 | EAS preview build — credentials dans `debug/.env` | ⏳ Reporté Phase D | Token Expo dispo (`GpS6tyEUc-g8b3IOXDfnAoK5Hq9jvzq71-23pr7A`, scope `facil/`). Build pas lancé encore. |
| M5 | Validation rétroactive checklists Phase 0-9 + suivi MOBILE_USER_PHASE_9_DETAILED.md | ❌ Non fait | À faire avant push final selon prompt explicite. |
| M6 | OWASP, 1M+ users, sécurité, intuitif, rien hardcodé | ✅ Respecté sur les implémentations livrées | Formula evaluator = recursive-descent (pas eval), apiClient via baseUrl env, fallback graceful, pas de credential en dur. |
| M7 | Plan général + plan par phase enregistré dans `.claude/plans/` | ✅ Respecté | `MOBILE_BUGFIX_PHASE9_TO_10_MASTER_PLAN.md` + `MOBILE_BUGFIX_PHASE_A_LAYOUT_DETAILED.md` + `MOBILE_BUGFIX_PHASE_B_WIRING_DETAILED.md` + critiques A/B. |
| M8 | Tests à la fin de chaque phase, mise à jour checklist | ⚠️ Partiel | tsc + ESLint OK. Smoke device pas fait (groupé Phase D). Checklist plans A/B pas mise à jour avec coches finales (à faire dans cette session). |
| M9 | "Si tâche complexe, déléguer aux agents et orchestrer" | ✅ Respecté | Agents utilisés : (a) cartographie endpoints calculator, (b) investigation root-cause 500 backend. |
| M10 | "Auto-amélioration" et "critique à la fin de chaque phase" | ✅ Respecté | `MOBILE_BUGFIX_PHASE_A_CRITIQUE.md` + `MOBILE_BUGFIX_PHASE_B_CRITIQUE.md` (12-18 sections chacun). |

---

## 4. Gaps bloquants avant push

### G1 — B6 Resume from background (Phase C)
- **Cause probable** : `QueryClient` configuré sans `refetchOnWindowFocus`/`refetchOnAppFocus`, sans `AppState`/`NetInfo` listener qui ré-active `focusManager`/`onlineManager` après long background.
- **Symptôme** : spinner figé indéfiniment lors du retour app après plusieurs heures.
- **Fix attendu** :
  1. `core/api/query-client.ts` — `defaultOptions: { queries: { staleTime: 30s, gcTime: 5min, refetchOnReconnect: true, refetchOnMount: true } }`
  2. `app/_layout.tsx` — `AppState.addEventListener('change', s => focusManager.setFocused(s === 'active'))`
  3. `app/_layout.tsx` — `NetInfo.addEventListener(state => onlineManager.setOnline(!!state.isConnected))`
  4. Forcer `queryClient.invalidateQueries({ queryKey: ['services'] })` + `['empresas']` après resume si > staleTime.
- **Estimation** : 30-45 min code + 15 min test smoke staging.

### G2 — Audit Sentry (lecture logs prod)
- **Action minimale** : `curl -H "Authorization: Bearer $SENTRY_TOKEN" "https://sentry.io/api/0/projects/{org}/{project}/issues/?query=is:unresolved+age:-7d&limit=50"`.
- **Action exploitable** : récupérer les top 20 issues mobile, classifier par sévérité, fixer ceux de priorité critical/high.
- **Estimation** : 20 min lecture + temps variable de fix selon les issues.

### G3 — Validation rétroactive checklists Phase 0-9
- L'utilisateur l'a explicitement demandé : "à la fin de ton implémentation, je propose que tu valide chaque sous plan de chaque phase déjà implémenté de ce plan".
- Action : ouvrir chaque `MOBILE_USER_PHASE_*_DETAILED.md`, vérifier en code/git que chaque ligne est livrée, cocher la checkbox, ajouter un changelog v1.X.
- **Estimation** : 60-90 min selon profondeur.

### G4 — Smoke device + EAS build preview
- Validation device (V1-V9 Phase A, V1-V8 Phase B/B7) toutes en `⏳ pending`.
- Action : `eas build --profile preview` puis test manuel des écrans modifiés.
- **Estimation** : 20 min build + 30 min smoke.

---

## 5. Recommandation push

### Option A — Push partiel maintenant
Pousser les 4 commits B1+B3+B4+B5b+B5a+B2+B7 (Phase A et B complètes). Continuer Phase C (B6) et D (audit + retroactive) en session(s) suivante(s).
- **Avantage** : déclenche backend deploy → endpoint calculator/config 200 testable + GitHub Actions vert.
- **Risque** : utilisateurs récupèrent une version qui résout 7/8 bugs visibles mais garde le bug "spinner figé après long background" (B6) qui crée plus de friction que les 7 fixes réunis selon impact.

### Option B — Continuer Phase C+D avant push (recommandé)
Implémenter B6 maintenant + audit Sentry rapide + retroactive checklists, puis push une fois cohérent.
- **Avantage** : push unique, pas de fragmentation, soft-launch propre.
- **Risque** : session plus longue, mais cohérent avec la règle utilisateur "implémenter totalement, ne pas livrer en morceaux".

**Choix par défaut** : Option B. À confirmer par l'utilisateur.

---

## 6. Prochaines étapes proposées

1. **Phase C — B6 resume from background** (30-45 min)
   - Plan détaillé dans `MOBILE_BUGFIX_PHASE_C_RESUME_DETAILED.md`
   - Implémentation `QueryClient` + AppState + NetInfo
   - Smoke staging

2. **Phase D — audit complet + EAS build** (1-2h)
   - Sentry top 20 issues
   - Audit câblage exhaustif (~30 routers backend vs mobile)
   - Retroactive checklists Phase 0-9
   - EAS preview build
   - Smoke device groupé

3. **Push final** une fois Phase C+D vertes
   - 7-10 commits locaux à push d'un coup vers `develop`
   - Vérification GitHub Actions vert backend + mobile CI
   - Smoke staging V16 calc + V9 directorio (post-fix backend cache Redis purgé)

---

## 7. Changelog

- **2026-04-29 v1.0** : audit créé en réponse à demande utilisateur "vérifier que toutes les préoccupations du prompt sont implémentées". Score 7/8 bugs visibles, 4 gaps méta (Sentry, B6, retroactive, EAS). Recommandation Option B.
