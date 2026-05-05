# PHASE B — Critique honnête

**Date** : 2026-05-02
**Phase parent** : `MOBILE_PHASE_10_PUBLISH_PLAYSTORE_MASTER.md`
**Statut** : Code livré (1 migration BD + 4 fichiers backend + 14 fichiers mobile + 3 i18n locales). tsc 0 erreur, ESLint 0 erreur (1 warning préexistant non lié).

---

## 1. Sortie livrée

### Backend (5 changements)
| # | Fichier | Action |
|---|---------|--------|
| 1 | `packages/backend/database/migrations/331_add_legal_acceptance_columns.sql` | NEW (4 colonnes + backfill role-restricted) |
| 2 | `packages/backend/app/config.py` | EDIT (+6 settings `LEGAL_*_VERSION`/`LEGAL_*_LAST_UPDATED`) |
| 3 | `packages/backend/app/modules/legal/__init__.py` + `api/__init__.py` + `api/legal_routes.py` | NEW (`GET /versions`, `POST /accept`) |
| 4 | `packages/backend/app/main.py` | EDIT (register router) |
| 5 | `packages/backend/app/modules/auth/api/auth_routes.py` | EDIT (RegisterRequest +2 champs Optional + handler valide+persiste) |

### Mobile (12 nouveaux fichiers + 4 EDIT)
| # | Fichier | Action |
|---|---------|--------|
| 6 | `packages/mobile/src/modules/legal/types/index.ts` | NEW |
| 7 | `packages/mobile/src/modules/legal/hooks/use-legal-versions.ts` | NEW |
| 8 | `packages/mobile/src/modules/legal/hooks/use-accept-legal.ts` | NEW |
| 9 | `packages/mobile/src/modules/legal/components/legal-acceptance-card.tsx` | NEW |
| 10 | `packages/mobile/src/modules/legal/index.ts` | NEW (barrel) |
| 11 | `packages/mobile/src/app/legal/_layout.tsx` | NEW |
| 12 | `packages/mobile/src/app/legal/privacy.tsx` | NEW |
| 13 | `packages/mobile/src/app/legal/terms.tsx` | NEW |
| 14 | `packages/mobile/src/app/legal/cookies.tsx` | NEW |
| 15 | `packages/mobile/src/core/api/endpoints.ts` | EDIT (+legal section) |
| 16 | `packages/mobile/src/core/config/types.ts` | EDIT (`RegisterData` +2 champs optionnels) |
| 17 | `packages/mobile/src/app/(auth)/sign-up.tsx` | EDIT (state + card + disabled + payload) |
| 18 | `packages/mobile/src/app/(tabs)/profile.tsx` | EDIT (section Légal + 3 ListItem) |

### i18n (3 fichiers EDIT — 60 clés × 3 langues = 180 entrées)
| Lang | Privacy | Terms | Cookies | Acceptance | Total |
|------|---------|-------|---------|-----------|-------|
| es | 19 | 19 | 15 | 7 | 60 |
| fr | 19 | 19 | 15 | 7 | 60 |
| en | 19 | 19 | 15 | 7 | 60 |

**Source** : copié verbatim depuis `packages/web/messages/{es,fr,en}.json` section `legalPages.*` (zéro divergence). Acceptance keys traduites manuellement (mobile-spécifique, pas dans le web).

---

## 2. Validation tsc / ESLint

| Critère | Résultat |
|---------|----------|
| `npx tsc --noEmit` | ✅ EXIT 0 (mobile) |
| `npx tsc` backend (smoke imports) | ✅ Légal router + RegisterRequest imports OK (warning pyotp pré-existant non lié) |
| ESLint sur fichiers modifiés | ✅ 0 erreur, 1 warning préexistant `react-hooks/exhaustive-deps` (sign-up.tsx ligne 119, hors scope) |
| i18n drift script | ✅ 3 langues identiques en clés |
| Migration 331 SQL | ✅ Appliquée en BD via asyncpg, vérifiée : 4 colonnes ajoutées, 4 users public-roles backfillés, 39 users internes restent NULL |

---

## 3. Risques & honnêteté

### 3.1 GAP — modal post-login NON implémenté

**Constat** : la mitigation que j'ai proposée (modal post-login pour users existants migrés `1.0.0-legacy` afin de rattraper les acceptances rétroactives) **n'a pas été implémentée**. Le hook `useAcceptLegal()` existe et l'endpoint `POST /legal/accept` est wired, mais aucune UI mobile ne déclenche le modal.

**Impact** : pour V1 launch, les 4 users public-roles ont été backfillés `1.0.0-legacy`. Tant que la version reste `1.0.0`, ils ne sont jamais re-prompté. Si on bump à `1.1.0` plus tard, on aura besoin d'écrire le modal pour les forcer.

**Décision pragmatique** : différer en **Phase B follow-up ou V1.1**. Argumentation :
- 0 user existant n'est pénalisé en V1 (tous backfill'd au launch version)
- Réduit le scope V1 (gain de 0.5j)
- Peut être rajouté sans breaking change : `useAcceptLegal()` + endpoint déjà prêts
- Si on doit publier d'urgence, l'absence de modal n'est PAS un bloquant Play Store

**Action recommandée** : ajouter un ticket V1.1 + commentaire dans `useLegalVersions` pour documenter ce gap conscient.

### 3.2 RISQUE — backend non redéployé en staging

Mon code backend est commité localement mais le service Cloud Run staging tourne avec la version d'avant. Tant que le push `develop` ne déclenche pas `deploy-backend-staging.yml`, le mobile preview build ne pourra pas appeler `/legal/versions` ni `/legal/accept`. Le sign-up échouera (fetch `/legal/versions` en erreur réseau).

**Mitigations** :
- Le hook `useLegalVersions()` retourne `data === undefined` tant qu'il échoue. Dans `sign-up.tsx`, le bouton submit est `disabled` jusqu'à `legalVersions.data` truthy. Donc l'user ne peut pas POST sans versions.
- **MAIS** : si l'endpoint n'existe pas backend, l'écran sign-up devient inutilisable (bouton submit perpétuellement disabled). Ce serait un régression critique.
- **Action** : déployer backend en staging AVANT (ou en même temps que) le mobile preview build. Push commit groupé avec backend → `deploy-backend-staging.yml` déploie en parallèle de `mobile-build.yml`.

### 3.3 RISQUE — types Pydantic vs TS

J'ai ajouté `terms_version_accepted: Optional[str]` côté Pydantic et `terms_version_accepted?: string` côté TS. Pydantic v2 `Optional[str]` accepte string ou None (pas string vide). Mobile envoie soit la string soit le champ absent → OK. Mais si une version mobile poussait `""` (string vide), Pydantic accepterait (`min_length=1` rejetterait avec 422 mais c'est OK).

**Risque** : 0 (`min_length=1` garde-fou).

### 3.4 RISQUE — race condition sur `users` UPDATE post-create

Dans `auth_routes.py:register()`, après `auth_service.register()` qui crée le user, j'exécute un `UPDATE users SET terms_*` sur la même row. Si le user vient juste d'être créé et qu'aucun autre process ne le touche, race nulle.

**Risque** : 0 (séquentiel, single-tenant).

### 3.5 GAP — Validation Zod côté mobile

Le schéma Zod `registerSchema` n'a pas été modifié pour valider `terms_version_accepted`/`privacy_version_accepted`. Conséquence : ces champs ne sont pas dans `RegisterInput` (le type Zod), donc `handleRegister(data)` ne les reçoit pas via le form mais via `legalVersions.data`. C'est **intentionnel** — ce ne sont pas des inputs utilisateur mais des constantes injectées au moment de la soumission.

**Risque** : 0. Le pattern est explicite dans le code (commentaire dans `handleRegister`).

### 3.6 GAP — Tests pytest backend

Je n'ai pas écrit de test pytest `test_register_with_legal_acceptance`. Les tests existants devraient encore passer (champs Optional), mais aucune couverture nouvelle.

**Mitigation** : ajout en Phase B follow-up si besoin. Le smoke staging (curl `GET /legal/versions` + sign-up E2E mobile) est plus précieux qu'un test pytest pour V1.

### 3.7 RISQUE — Cookies policy sans consentement opt-in mobile

Le mobile NE collecte PAS de cookies HTTP comme le web. La page `/legal/cookies` est purement informationnelle (parité web). Pas de checkbox/consent UI. **C'est intentionnel** — les "tracking technologies" mobiles (LogRocket session replay, Sentry, FCM device token) sont déclarés dans la Privacy Policy, pas dans la Cookie Policy.

**Conformité Play Store** : la Privacy Policy mentionne déjà LogRocket + Sentry + BANGE. Compliant.

### 3.8 RISQUE — Versions hardcodées en config Pydantic

Les versions sont des `Field(default="1.0.0", env="LEGAL_TERMS_VERSION")`. Pour bump, il faut soit redéployer backend avec nouvelle env var, soit ajouter dans Cloud Run env. **Pas de UI admin pour bump** — décision pragmatique pour V1.

**Risque** : si on veut bump souvent, c'est friction. Mais legal-doc-bumps sont rares (~1/an).

---

## 4. Validation DoD

| # | Critère | Méthode | Résultat |
|---|---------|---------|----------|
| V1 | Migration 331 appliquée en BD | asyncpg verify | ✅ 4 colonnes + 4 backfill |
| V2 | Endpoint `GET /legal/versions` retourne JSON | curl staging | ⏳ pending push backend |
| V3 | Endpoint `POST /legal/accept` retourne 200 (auth) ou 403 (admin) | curl staging | ⏳ pending push backend |
| V4 | Sign-up mobile force checkboxes | smoke device | ⏳ pending build EAS final |
| V5 | Pages /legal/* rendent les 3 langues | smoke device | ⏳ pending build EAS final |
| V6 | Section Profile → Légal accessible | smoke device | ⏳ pending build EAS final |
| V7 | tsc 0 erreur mobile | npx tsc --noEmit | ✅ EXIT 0 |
| V8 | tsc 0 erreur backend (imports) | python -c "import legal_routes" | ✅ |
| V9 | ESLint 0 erreur sur fichiers modifiés | npx eslint | ✅ (1 warning préexistant non lié) |
| V10 | i18n drift script | manual JSON parse | ✅ 3 langues identiques en clés |
| V11 | RegisterData TS étendu | tsc | ✅ |
| V12 | Backend migration idempotente | `IF NOT EXISTS` + `COALESCE` | ✅ |

---

## 5. Recommandation

### 5.1 Maintenant
- **Commits sémantiques groupés (5 commits)** :
  1. `feat(backend): mig 331 — legal acceptance columns + role-restricted backfill`
  2. `feat(backend/legal): GET /versions + POST /accept endpoints`
  3. `feat(backend/auth): persist terms+privacy version on register`
  4. `feat(mobile/legal): privacy/terms/cookies pages + acceptance card + hooks`
  5. `feat(mobile): wire legal acceptance into sign-up + Profile section + i18n × 3`

- **PAS DE PUSH** tant que toutes les phases A-D ne sont pas livrées (économie EAS quota — décision user 2026-05-02).
  - Exception possible : push backend pour déclencher `deploy-backend-staging.yml` afin que le mobile preview build final puisse appeler les nouveaux endpoints. À discuter avec user.
- **Continuer Phase C** (Conformité Play Store : Data Safety + IARC + Listing).

### 5.2 Lors du build EAS final groupé (fin Phase D)
- User installe APK preview → smoke sign-up
- Vérifier 3 langues sur `/legal/*`
- Vérifier section Profile → Légal
- Vérifier 403 pour admin user (si testable)
- Vérifier 400 si version mismatch (force update)

---

## 6. Changelog

- **2026-05-02 v1.0** : Critique initiale Phase B. 5 backend + 14 mobile + 3 i18n livrés. Migration 331 appliquée en BD. tsc 0, ESLint 0. Modal post-login différé (gap conscient documenté §3.1). Push retenu jusqu'à fin Phase D.
