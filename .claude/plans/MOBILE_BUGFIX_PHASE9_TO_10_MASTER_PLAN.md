# MOBILE BUGFIX PHASE 9 → PHASE 10 — MASTER PLAN

**Date** : 2026-04-29
**Auteur** : Claude (Opus 4.7 — expert mobile/backend)
**Phase parent** : `MOBILE_USER_MIGRATION_MASTER_PLAN.md`
**Position** : entre **P9** (livrée mais avec V1.5 reportés) et **P10** (E2E + stores). Bugfix gating avant P10.
**Cible app** : `packages/mobile/` — Facil citizen + business
**Source des bugs** : remontée terrain utilisateur (images `Documentations/workflow/debug/tesoro/`) + audit Sentry + audit câblage mobile↔backend.

---

## 1. CONTEXTE & POSITIONNEMENT

P9 a livré OWASP partiel + Sentry init + RGPD export, mais avec des reports V1.5 (biometric refresh-token-only, MMKV key derivation). Avant P10 (E2E + soumission stores), il reste un bloc de **bugs UX/fonctionnels** remontés sur device qui empêcheraient un soft-launch propre. Ce plan exécute ce bloc en 4 phases serrées, chacune commit-validée localement, push à la fin de chaque phase après auto-critique.

### Sources de vérité (rappel CLAUDE.md)
1. BD (interroger `information_schema`)
2. Routes FastAPI (`packages/backend/app/main.py` + `*_routes.py`)
3. Code mobile existant (Expo Router + React Query)
4. Code web existant (`packages/web/`) **= référence parité fonctionnelle**

### Règles d'exécution
- Commit local par sous-phase validée. Push en fin de phase après auto-critique. **Confirmation utilisateur obligatoire avant push** (mémoire #13).
- Aucun hardcodage. Aucun mock. Tout via `appConfig`/env/backend.
- Si un bug nécessite un endpoint absent backend → on l'**ajoute backend AVANT mobile**.
- Aucune régression sur les workflows non-bundle stables (mémoire #16).
- Délégation aux agents quand recherche multi-fichiers ou parité web↔mobile.

---

## 2. INVENTAIRE DES BUGS

### 2.1 Remontés par l'utilisateur (avec captures)

| ID | Bug | Image | Type | Sévérité |
|----|-----|-------|------|----------|
| **B1** | Onboarding — bouton "Explorer sans compte" collé au texte "Lancez votre première demande" | `onboard.jpg` | Visual | 🟡 P3 |
| **B2** | Calculatrice — pas câblée backend, ne réagit pas | (fonctionnel) | Functional | 🔴 P1 |
| **B3** | Tickets — input "Tapez votre réponse..." + FAB "Nouveau ticket" coupés par barre nav système | `m11.jpg`, `m12.jpg` | Visual + Safe-area | 🔴 P1 |
| **B4** | Documents — contenu chevauche les filtres tags ; un seul doc s'affiche centré verticalement au lieu d'en haut ; empty state mal disposé | `m3.jpg`–`m6.jpg` | Visual | 🟠 P2 |
| **B5a** | Mes entreprises — "Ajouter entreprise" ouvre la liste de recherche au lieu du flow création (upload doc → extract). Idem dans wizard solicitude commerciale (m13). Désynchro vs web. | `m13.jpg` | Functional | 🔴 P1 |
| **B5b** | Détail entreprise (Tienda El Sol) — pas de variantes couleur pour échéance/total/payé ; bouton "Télécharger licence" pas centré ; "Historique de paiements" devrait être dans menu trois-points | `m14.jpg` | Visual | 🟠 P2 |
| **B6** | Resume from background — après plusieurs heures, Services + Empresas ne rechargent pas (spinner figé). Forcer fermeture/réouverture | `m9.jpg` | Functional | 🔴 P1 |
| **B7** | Directorio public — toutes les entreprises ne se chargent pas (limite/pagination) | (texte user) | Functional | 🟠 P2 |

### 2.2 À détecter par audit (en cours via agent)
- Endpoints mobile cassés / non câblés vs backend (post P0+P9)
- Console.* en prod (Phase 9 disait HIGH=0 sauf logger.ts)
- `try/catch` qui silencent erreurs sans Sentry
- Modules backend (FastAPI routers) sans pendant mobile
- Sentry events haute fréquence (via token Sentry)

> Le résultat de l'agent + les findings Sentry alimenteront **B8..Bn** dans `MOBILE_BUGFIX_PHASE_3_AUDIT_DETAILED.md`.

---

## 3. PHASES

### Phase A — Layout & Safe-area (visual fixes)
**Bugs couverts** : B1, B3, B4, B5b
**Pourquoi groupés** : tous purement UI/Layout, pas de backend, faible risque de régression. Patches indépendants → push isolé en bloc.

### Phase B — Câblage fonctionnel mobile↔backend
**Bugs couverts** : B2, B5a, B7
**Pourquoi groupés** : tous des trous de câblage. Demande lecture web + endpoint backend + nouveaux écrans/hooks mobile. **Bloquant pour soft-launch**.

### Phase C — Resilience & Resume from background
**Bug couvert** : B6
**Pourquoi isolé** : nécessite refactor QueryClient config + AppState/NetInfo listeners + tests staging multi-heures. Risque de régression sur tous les listings.

### Phase D — Audit findings + retroactive validation
**Couvre** :
- Bugs détectés par agent + Sentry (B8..Bn)
- Validation rétroactive checklists Phase 0..9 (mémoire user request)
- Update `MOBILE_USER_PHASE_9_DETAILED.md` checklist
- Build EAS preview + push GitHub Actions vert

---

## 4. CHECKLIST GÉNÉRALE (par phase)

### Phase A — Layout & Safe-area (~0.5j)

- [ ] **A.1** Plan détaillé `.claude/plans/MOBILE_BUGFIX_PHASE_A_LAYOUT_DETAILED.md`
- [ ] **A.2** B1 onboarding — déplacer bloc texte + ajuster spacing
- [ ] **A.3** B3 tickets — `useSafeAreaInsets` + `KeyboardAvoidingView` + bottom padding sur FAB
- [ ] **A.4** B4 documents — empty state position-top, FlatList paddingBottom système, sticky filter row
- [ ] **A.5** B5b licence — palette XAF (échéance/total/payé), centrage CTA, menu 3-points avec historique
- [ ] **A.6** Auto-critique + commits sémantiques par bug
- [ ] **A.7** Push après confirmation utilisateur, vérifier GitHub Actions vert

### Phase B — Câblage fonctionnel mobile↔backend (~1j)

- [ ] **B.1** Plan détaillé `.claude/plans/MOBILE_BUGFIX_PHASE_B_WIRING_DETAILED.md`
- [ ] **B.2** B2 calculator — câblage routes backend `/calculator/*` (vérifier endpoints, hooks React Query, écran)
- [ ] **B.3** B5a companies create flow — refactor "Ajouter entreprise" → upload doc + extract (parité web)
- [ ] **B.4** B5a wizard solicitude commerciale — entry point company create dans wizard
- [ ] **B.5** B7 directory pagination — page_size, infinite scroll, totalCount
- [ ] **B.6** Auto-critique + commits sémantiques + push après confirmation

### Phase C — Resume from background (~0.5j)

- [ ] **C.1** Plan détaillé `.claude/plans/MOBILE_BUGFIX_PHASE_C_RESUME_DETAILED.md`
- [ ] **C.2** Configuration QueryClient global : `refetchOnWindowFocus`, `refetchOnMount`, `staleTime`, `gcTime`
- [ ] **C.3** AppState listener → `focusManager.setFocused()` (React Query)
- [ ] **C.4** NetInfo listener → `onlineManager.setOnline()` (React Query)
- [ ] **C.5** Forcer invalidation au resume après `staleTime` dépassé sur listes critiques (services, empresas, dashboard)
- [ ] **C.6** Tests : background app 5min / 1h / overnight → reopen → vérif reload
- [ ] **C.7** Auto-critique + commits + push

### Phase D — Audit & retroactive validation (~0.5j)

- [ ] **D.1** Lecture rapport agent câblage + Sentry findings
- [ ] **D.2** Plan détaillé `.claude/plans/MOBILE_BUGFIX_PHASE_D_AUDIT_DETAILED.md`
- [ ] **D.3** Fix bugs additionnels B8..Bn (par sévérité)
- [ ] **D.4** Validation rétroactive checklists `MOBILE_USER_PHASE_0..9_DETAILED.md` (avec vérification réelle, pas case cochée à l'aveugle)
- [ ] **D.5** Update `MOBILE_USER_PHASE_9_DETAILED.md` section 8 SUIVI DU PLAN
- [ ] **D.6** Build EAS preview avec credentials Expo (`Documentations/workflow/debug/.env`)
- [ ] **D.7** Auto-critique globale + push

---

## 5. CRITÈRES DE VALIDATION (DoD du plan complet)

| # | Critère | Méthode |
|---|---------|---------|
| V1 | 100% des bugs B1..B7 reportés résolus avec captures de validation | smoke test device |
| V2 | Aucune régression sur workflows non-bundle (Pasaporte, Conducir, Residencia, Bundle citoyen) | smoke staging |
| V3 | tsc --noEmit 0 erreur | CI |
| V4 | ESLint sous 100 warnings | CI |
| V5 | npm audit HIGH=0 | npm audit |
| V6 | i18n drift script exit 0 | script |
| V7 | Sentry capture exception synthétique sur staging | dashboard Sentry |
| V8 | EAS build preview vert | expo.dev |
| V9 | GitHub Actions verts pour tous les pushes | github.com |
| V10 | Checklists `MOBILE_USER_PHASE_0..9_DETAILED.md` à jour | git diff |
| V11 | Auto-critique livrée par phase | fichiers `.claude/plans/MOBILE_BUGFIX_PHASE_*_CRITIQUE.md` |
| V12 | Resume from background OK après 1h+ background sur Services + Empresas | smoke test device |

---

## 6. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Endpoint backend calculator manquant ou refactoré | MOYENNE | HAUT | Audit web/backend AVANT mobile ; ajout backend si gap |
| Création entreprise via OCR — endpoint web spécifique non disponible mobile | MOYENNE | HAUT | Réutiliser le même endpoint web, parité document upload |
| QueryClient refactor casse listings stables | MOYENNE | MOYEN | Test smoke sur 5 listings critiques avant push ; rollback isolé |
| Backend pagination directory limite hardcodée | FAIBLE | MOYEN | Augmenter limite + pagination cursor côté mobile |
| Sentry rate-limit sur capture exceptions test | FAIBLE | FAIBLE | Synthetic exceptions seulement |
| EAS build casse à cause de deps Expo SDK 54 | FAIBLE | HAUT | `npx expo install --check` avant build, lock major versions |

---

## 7. RECOMMANDATION D'EXÉCUTION

Ordre recommandé :
1. Phase A (rapide, faible risque) → push
2. Phase B (câblage fonctionnel) → push isolé chaque sous-bug
3. Phase C (resume background) → test étendu avant push
4. Phase D (audit + rétroactive) → push final + EAS build preview

Délégation possible :
- Recherche mobile↔backend : agent `general-purpose` (DÉJÀ LANCÉ pour la cartographie initiale)
- Implémentation visuelle B1/B3/B4 : direct (rapide)
- B5 companies create — possible délégation `taxasge-frontend-dev` si parité web complexe
- C : direct (refactor critique core/)

---

## 8. SUIVI

- 2026-04-29 v1.0 : créé. Phase A en cours d'analyse.
- 2026-04-29 v1.1 : Phase A LIVRÉE (4 commits) — B1, B3, B4, B5b. Plan détaillé `MOBILE_BUGFIX_PHASE_A_LAYOUT_DETAILED.md`. Critique `MOBILE_BUGFIX_PHASE_A_CRITIQUE.md`.
- 2026-04-29 v1.2 : Phase B LIVRÉE (4 commits) — B5a, B2 mobile, B2 backend dette technique, B7. Plan détaillé `MOBILE_BUGFIX_PHASE_B_WIRING_DETAILED.md`. Critique `MOBILE_BUGFIX_PHASE_B_CRITIQUE.md` v1.2.
- Phase A : ✅ Livré, push pending
- Phase B : ✅ Livré (B5a + B2 + B7), push pending
- Phase C : ✅ Livré (B6 query-client listeners + cold-resume invalidation). Plan `MOBILE_BUGFIX_PHASE_C_RESUME_DETAILED.md`. Critique `MOBILE_BUGFIX_PHASE_C_CRITIQUE.md`.
- Phase D : ✅ Livré (audit Sentry + wiring matrix + retroactive Phase 0-9 + cleanup `unarchiveCompany`). Plan `MOBILE_BUGFIX_PHASE_D_AUDIT_DETAILED.md`. Critique `MOBILE_BUGFIX_PHASE_D_CRITIQUE.md`. Reports : `_SENTRY_REPORT.md` + `_WIRING_MATRIX.md` + `MOBILE_USER_RETROACTIVE_VALIDATION_REPORT.md`. EAS preview + smoke device repoussés post-push.

### Bilan retroactive Phase 0-9 (audit agent 2026-04-29)
- 9 plans Phase 0-9 review (Phase 7 jamais écrite)
- 260/292 cases (89.0%) cochées rétroactivement avec ancrage commit SHA ou fichier source
- 32 unverified (11%) flaggés `⚠️ unverified — needs re-check` — 26/32 = smoke tests staging curl jamais archivés (code wiré, manque seulement les logs)
- 0 item deferred Phase 10
- Recommandation : `scripts/smoke-test-staging.sh` CI nightly (P10-12 backlog)

### Bilan commits locaux non-push (au 2026-04-29 fin Phase B)

| SHA | Phase | Bug | Sujet |
|-----|-------|-----|-------|
| `adc92e4f` | A | B1 | onboarding spacing |
| `309cc848` | A | B3 | support safe-area |
| `748cb252` | A | B4 | documents top-aligned |
| `e86461df` | A | B5b | license card chips + payments route |
| `cb0e8223` | B | B5a | companies create OCR via bundle wizard mode=new |
| `75e7130d` | B | B2-back | calculator/config 500 entity_translations enum |
| `232139f3` | B | B2 | calculator full port (irpf/vat/corporate/services) |
| `5d878c56` | B | B7 | directorio infinite scroll |
| `565df1b3` | B | B7-back | public directory remove arbitrary page cap |
| `a0192ac5` | C | B6 | query-client AppState/NetInfo + cold-resume invalidation |
| `6393bf5d` | D | wiring | remove admin-only unarchiveCompany from citizen surface |

11 commits prêts à push (+ commit docs final à venir). Audit couverture prompt = 7/8 bugs visibles + 4 méta-gaps documentés (`MOBILE_BUGFIX_PROMPT_COVERAGE_AUDIT.md`).

---

## 9. CHANGELOG

- **2026-04-29 v1.0** : Création initiale après remontée terrain user (m9.jpg, m11-m14.jpg, onboard.jpg, m3-m6.jpg) + audit cartographie agent en cours.
