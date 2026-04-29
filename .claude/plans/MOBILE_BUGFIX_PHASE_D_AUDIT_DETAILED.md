# PHASE D — Audit & retroactive validation (DETAILED PLAN)

**Date** : 2026-04-29
**Phase parent** : `MOBILE_BUGFIX_PHASE9_TO_10_MASTER_PLAN.md` §3 Phase D
**Prérequis** : Phases A, B, C livrées et commitées (10 commits locaux).
**Bloquant pour push final** : OUI — l'utilisateur a demandé explicitement audit Sentry + retroactive checklists.

---

## 1. CONTEXTE

À la sortie de la Phase C, le code corrigeant les 8 bugs visibles + dette technique backend (calculator/config 500, page cap directorio) est commité localement. Reste, avant de pousser :

1. **Lecture des logs Sentry prod** — token fourni dans `debug/.env`. L'utilisateur a explicitement demandé qu'on l'exploite pour identifier crashes silencieux et erreurs non gérées.
2. **Audit câblage exhaustif** mobile↔backend — au-delà des bugs B1-B7 visibles à l'œil, scan systématique des ~30 routers backend vs modules mobile pour repérer les endpoints orphelins ou dupliqués.
3. **Validation rétroactive checklists Phase 0-9** — l'utilisateur a noté : "lorsqu'on a implémenté les autres plans nous n'avons pas validé les checklist dans ces plans pour les mettre à jour comme déjà exécutées".
4. **EAS preview build** — token Expo dispo, faire un build de preview pour valider device les fixes Phase A/B/C.
5. **Smoke device groupé** — V1-V11 marqués `⏳ pending` dans toutes les critiques A/B/C.

---

## 2. ARCHITECTURE DE L'AUDIT

### 2.1 D.1 Sentry — top issues

**Endpoint** : `https://sentry.io/api/0/`. Token en header `Authorization: Bearer sntryu_b54...`.

Étapes :
1. Lister les organisations accessibles : `GET /organizations/`
2. Lister les projets de l'org : `GET /organizations/{org-slug}/projects/`
3. Identifier le projet mobile (probablement `facil-mobile` ou similaire)
4. Lister les issues unresolved récentes : `GET /projects/{org}/{project}/issues/?query=is:unresolved+age:-7d&limit=50&statsPeriod=7d&sort=freq`
5. Pour chaque issue critique : `GET /issues/{id}/events/?limit=1` pour le stack trace

Action attendue :
- Classifier les top 20 par sévérité (critical / high / medium / low) + fréquence
- Pour les 5 premiers : ouvrir le code, comprendre la cause, fixer ou créer un ticket dédié
- Documenter dans `MOBILE_BUGFIX_PHASE_D_SENTRY_REPORT.md`

### 2.2 D.2 Audit câblage — backend↔mobile matrix

Délégation à un agent général-purpose :
- Lister tous les routers FastAPI avec leur prefix dans `packages/backend/app/main.py`
- Pour chaque router, lister les endpoints et trouver le module mobile correspondant
- Identifier :
  - **Orphelins backend** : endpoints exposés mais aucun consommateur mobile (peut être normal si admin-only)
  - **Orphelins mobile** : appels API qui n'existent pas backend
  - **Désynchros** : endpoints utilisés mais avec un format différent (param manquant, auth manquante)
  - **Câblage partiel** : modules mobile qui exposent moins que ce que le backend offre (ex. citoyen utilisateur ne voit que 1 endpoint sur 5 d'un router)

Output attendu : `MOBILE_BUGFIX_PHASE_D_WIRING_MATRIX.md` avec tableau exhaustif.

### 2.3 D.3 Retroactive Phase 0-9

Délégation à un agent général-purpose :
- Pour chaque `MOBILE_USER_PHASE_{0..9}_DETAILED.md` :
  - Ouvrir le fichier
  - Pour chaque case `- [ ]` non cochée, vérifier en code/git si livré
  - Cocher les cases livrées
  - Ajouter une section "validation rétroactive" en fin de fichier avec date
  - Ne PAS cocher arbitrairement — si non vérifiable, garder `- [ ]` et noter "à valider"

Output : 10 fichiers mis à jour + un fichier consolidé `MOBILE_USER_RETROACTIVE_VALIDATION_REPORT.md`.

### 2.4 D.4 EAS preview build

- Token : `GpS6tyEUc-g8b3IOXDfnAoK5Hq9jvzq71-23pr7A` (scope `facil/`)
- Vérifier `eas.json` profile `preview` configuré
- Lancer `EXPO_TOKEN=... npx eas build --profile preview --platform android` (Android first, plus rapide que iOS, dispense bundle ID provision)
- Récupérer le lien de build APK
- Smoke device : tester chaque écran modifié (Phase A/B/C) sur APK

### 2.5 D.5 Smoke device groupé

Checklist regroupée des V (Validation) reportés :

| Phase | V | Description |
|-------|---|------------|
| A | V1 | B1 gap onboarding |
| A | V2 | B3 FAB ticket visible |
| A | V3 | B3 reply bar visible |
| A | V4 | B4 chips séparés items |
| A | V5 | B4 doc unique en haut |
| A | V6 | B4 empty state aligné top |
| A | V7 | B5b chips colorés license |
| A | V8 | B5b bouton télécharger centré |
| A | V9 | B5b historique dans kebab |
| B | V1-V7 | B2 calculs corrects (IRPF/VAT/Corp/Service) |
| B | V8 | B2 fallback DEFAULT_CALCULABLE_SERVICES |
| B | V9 (post-fix) | B2 endpoint config 200 |
| B | V11/V12 | B5a flow OCR-create |
| B | V9 | B7 directorio infinite scroll |
| C | V10 | B6 background 6min → invalidation |
| C | V11 | B6 mode avion → reprise |

### 2.6 D.6 Push final

- Vérifier qu'aucun fichier ne contient secret/token (grep `sntryu_\|EXPO_TOKEN`)
- Push avec `git push origin develop`
- Watch GitHub Actions :
  - Backend deploy doit redéployer Cloud Run staging avec le fix calculator/config 500
  - Mobile CI (lint + tsc + tests) doit passer
- Smoke staging post-deploy :
  - `curl /homepage/calculator/config?language=es` → 200
  - `curl /public/companies/search?page=1` → 200

---

## 3. CHECKLIST ATOMIQUE PHASE D

### D.1 Plan validé ✅
- [x] Plan rédigé et enregistré dans `.claude/plans/`

### D.2 Sentry top issues (~20 min)
- [ ] **D.2.1** `curl https://sentry.io/api/0/organizations/ -H "Authorization: Bearer sntryu_b54..."` → identifier org slug
- [ ] **D.2.2** Lister projets de l'org → identifier projet mobile
- [ ] **D.2.3** Récupérer top 20 issues unresolved 7 derniers jours
- [ ] **D.2.4** Récupérer stack trace pour les 5 plus critiques
- [ ] **D.2.5** Documenter dans `MOBILE_BUGFIX_PHASE_D_SENTRY_REPORT.md`
- [ ] **D.2.6** Classifier critical/high/medium/low + plan d'action (fix ici ou ticket Phase 10)

### D.3 Audit câblage (~30 min, délégué)
- [ ] **D.3.1** Délégation agent : lister routers backend + endpoints
- [ ] **D.3.2** Délégation agent : pour chaque endpoint, identifier consommateur mobile
- [ ] **D.3.3** Output `MOBILE_BUGFIX_PHASE_D_WIRING_MATRIX.md` avec gaps
- [ ] **D.3.4** Pour chaque gap critique citoyen-facing : créer ticket ou fixer immédiatement

### D.4 Retroactive Phase 0-9 (~45 min, délégué)
- [ ] **D.4.1** Délégation agent : ouvrir Phase 0-9 plans, vérifier checklists
- [ ] **D.4.2** Mise à jour `- [ ]` → `- [x]` quand livré
- [ ] **D.4.3** Section "validation rétroactive" + date dans chaque plan
- [ ] **D.4.4** Output consolidé `MOBILE_USER_RETROACTIVE_VALIDATION_REPORT.md`
- [ ] **D.4.5** Mise à jour explicite `MOBILE_USER_PHASE_9_DETAILED.md` section 8 SUIVI

### D.5 EAS preview build (~20 min build, async)
- [ ] **D.5.1** Vérifier `packages/mobile/eas.json` profile `preview`
- [ ] **D.5.2** Login EAS avec token `EXPO_TOKEN=GpS...`
- [ ] **D.5.3** `eas build --profile preview --platform android` (Android first)
- [ ] **D.5.4** Récupérer URL APK
- [ ] **D.5.5** (optionnel) `eas build --profile preview --platform ios` si TestFlight nécessaire

### D.6 Smoke device groupé (~30 min, manuel post-EAS)
- [ ] **D.6.1** Smoke V1-V9 Phase A
- [ ] **D.6.2** Smoke V1-V12 Phase B
- [ ] **D.6.3** Smoke V10-V11 Phase C (background test)
- [ ] **D.6.4** Capturer screenshots dans `Documentations/workflow/debug/tesoro/post-fix/`

### D.7 Push final + GitHub Actions (~10 min)
- [ ] **D.7.1** Audit secrets : `grep -rn "sntryu_\|EXPO_TOKEN\|GpS6ty" packages/ --include="*.ts" --include="*.py" --include="*.tsx"` doit retourner 0 hit
- [ ] **D.7.2** Confirmation utilisateur explicite avant push (mémoire #13)
- [ ] **D.7.3** `git push origin develop`
- [ ] **D.7.4** Watch backend deploy Cloud Run staging vert
- [ ] **D.7.5** Watch mobile CI vert
- [ ] **D.7.6** Smoke staging endpoints post-deploy

### D.8 Critique + clôture (~10 min)
- [ ] **D.8.1** `MOBILE_BUGFIX_PHASE_D_CRITIQUE.md`
- [ ] **D.8.2** Mise à jour Master Plan §8 SUIVI : Phase D ✅
- [ ] **D.8.3** Recommandation Phase 10 (E2E + stores)

---

## 4. CRITÈRES DE VALIDATION (DoD Phase D)

| # | Critère | Méthode |
|---|---------|---------|
| V1 | Sentry top issues identifiées et classifiées | rapport |
| V2 | Câblage matrix livré, gaps citoyen-facing résolus | matrix |
| V3 | Phase 0-9 checklists à jour avec preuve git | retroactive report |
| V4 | EAS preview build vert | expo.dev |
| V5 | Smoke device V1-V11 verts ou tickets ouverts | screenshots |
| V6 | Aucun secret commité | grep |
| V7 | Push develop déclenche backend deploy + mobile CI verts | github.com |
| V8 | Endpoint calculator/config 200 post-deploy | curl |
| V9 | Endpoint directorio paginé fonctionnel post-deploy | curl |

---

## 5. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Token Sentry expiré | FAIBLE | MOYEN | Vérifier en début de phase. Si expiré → demander à l'utilisateur. |
| Org Sentry / projet non accessible avec ce token | MOYENNE | MOYEN | Le token a peut-être un scope limité. Tester `GET /organizations/` d'abord. |
| EAS build échoue (deps manquantes, eas.json mal configuré) | MOYENNE | MOYEN | Build local d'abord en debug pour valider, puis EAS. |
| Audit câblage révèle des dizaines de gaps | MOYENNE | HAUT | Trier par sévérité, fixer les critiques bloquants soft-launch ici, reste en Phase 10. |
| Smoke device Android Honor (utilisateur) impossible | FAIBLE | FAIBLE | Le user a son propre device pour smoke. On déclenche le EAS build, lui fait le smoke. |
| Push casse staging (backend deploy échoue) | FAIBLE | HAUT | Backend fix = one-liner SQL safe. CI block si tests cassent. Rollback via revert commit. |

---

## 6. ORDRE D'EXÉCUTION

1. **D.2** Sentry — séquentiel (Bash + analyse, ~20 min)
2. **D.3 + D.4** Délégations agent (parallèle, ~30-45 min wallclock chacune)
3. **D.5** EAS build (async, déclenche puis attend)
4. **D.6** Smoke device une fois EAS vert
5. **D.7** Push avec confirmation user
6. **D.8** Critique + clôture

---

## 7. CHANGELOG

- **2026-04-29 v1.0** : créé en démarrage Phase D.
