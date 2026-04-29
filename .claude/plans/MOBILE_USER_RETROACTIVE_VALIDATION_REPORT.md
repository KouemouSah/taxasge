# MOBILE USER — RETROACTIVE VALIDATION REPORT

**Date** : 2026-04-29
**Auditeur** : Claude (Opus 4.7) — agissant comme auditeur de migration mobile
**Source** : audit code direct (`packages/mobile/src/`) + `git log --oneline` 200+ commits
**Périmètre** : `MOBILE_USER_PHASE_*_DETAILED.md` (Phase 0 à 9, sans Phase 7 qui n'a pas de plan détaillé écrit — sauté à la demande utilisateur d'après le critique P8)

---

## 1. PHASES REVUES

| Plan | Statut audit | Livré | Unverified | Deferred |
|------|--------------|-------|------------|----------|
| `MOBILE_USER_PHASE_0_DETAILED.md` | Endpoints SoT + types OpenAPI + bundle B3 fix | 41 | 17 | 0 |
| `MOBILE_USER_PHASE_1_DETAILED.md` | Push notifs FCM/APNs + Notification Center + deep links | 23 | 5 | 0 |
| `MOBILE_USER_PHASE_2_DETAILED.md` | Vault module 21 hooks + 3 écrans + i18n + alerts | 32 | 2 | 0 |
| `MOBILE_USER_PHASE_3_DETAILED.md` | Companies CRUD + members + license PDF + bundle alignement | 30 | 1 | 0 |
| `MOBILE_USER_PHASE_4_DETAILED.md` | Vault picker sheet + readiness banner + step-upload wiring | 13 | 1 | 0 |
| `MOBILE_USER_PHASE_5_DETAILED.md` | Payments module + tabs + BANGE polling + receipts vault | 23 | 2 | 0 |
| `MOBILE_USER_PHASE_6_DETAILED.md` | Support tickets + settings (notif/biometric/account delete) + backend RGPD | 32 | 1 | 0 |
| `MOBILE_USER_PHASE_8_DETAILED.md` | i18n drift script + skeleton + perf knobs + expo-image + RQ caching | 25 | 1 | 0 |
| `MOBILE_USER_PHASE_9_DETAILED.md` | OWASP M1-M10 + Sentry + RGPD export + biometric S1 fix | 41 | 2 | 0 |
| **TOTAL** | **9 plans** | **260** | **32** | **0** |

**Note** : Phase 7 (Batch Requests business) n'a pas de plan détaillé écrit — sauté à la demande utilisateur (cf. critique P8 changelog "P7 Batch Requests sauté à la demande"). Aucun plan Phase 7 n'a donc été audité.

---

## 2. ITEMS ENCORE PENDING PAR PHASE

### Phase 0 — 17 items unverified
- **0.1.5** Récupérer OpenAPI JSON staging (curl)
- **0.5.6** Test staging upload company doc → preview Gemini (device)
- **0.6.4** Test upload PDF/JPG/PNG/WebP (device)
- **0.7.1 → 0.7.15** (15 items) Smoke tests E2E staging — login → wizard → bundle → chatbot → support

### Phase 1 — 5 items unverified
- **1.5.3** Tester deep links via `npx uri-scheme open` (device manuel)
- **1.6.3** Smoke token register sur device Android physique
- **1.6.4** Smoke push réel (admin tool)
- **1.6.5** Smoke deep link cold start
- **1.6.6** Smoke refus permission Android 13

### Phase 2 — 2 items unverified
- **2.6.4** Push notif `document_expiring` ouvre `/documents/[id]` (device)
- **2.8.3** Smoke tests staging vault (curl auth gate)

### Phase 3 — 1 item unverified
- **3.7.4** Smoke tests staging companies (5 curl)

### Phase 4 — 1 item unverified
- **4.4.4** Smoke tests staging vault auto-fill (3 curl)

### Phase 5 — 2 items unverified
- **5.1.4** Test pytest backend BANGE return URL override
- **5.6.4** Smoke tests staging payments (3 curl)

### Phase 6 — 1 item unverified
- **6.7.4** Smoke tests staging support + RGPD (4 curl)

### Phase 8 — 1 item unverified
- **8.6.2** Optimistic update `mark-as-read` (endpoint backend probablement manquant — close-ticket couvert)

### Phase 9 — 2 items unverified
- **9.2.8** Source-maps Sentry upload via EAS (depends on DSN secret fourni)
- **9.11.4** Smoke tests staging Sentry capture + RGPD export (device)

---

## 3. ITEMS DEFERRED PHASE 10 — AUCUN

Aucun item livré n'a été marqué `deferred`. Les items hors-scope Phase 9 (M5 SSL pinning, M7 anti-tampering) sont déjà explicitement documentés dans la section "Hors scope V1" du plan P9 et ne sont pas des items de checklist à cocher.

---

## 4. ITEMS COCHÉS QUI AURAIENT DÛ ÊTRE DEFERRED

**Aucun.** L'audit a été conservateur : tout item coché est appuyé par au moins un commit identifié OU un fichier source confirmé via Glob. Les items unverified (smoke tests E2E manuels device) ont été laissés `[ ]` avec ⚠️ flag plutôt que cochés sans preuve.

---

## 5. PATTERN DOMINANT DES ITEMS UNVERIFIED

**32 items unverified au total** se répartissent en 4 catégories :

1. **Smoke tests staging (curl)** — 26 items (Phase 0.7.1-15, 2.8.3, 3.7.4, 4.4.4, 5.6.4, 6.7.4, 9.11.4) : code livré et type-check OK, mais l'archive de l'exécution `curl` staging avec token user n'a pas été journalisée dans les commits ou critiques. **Ces items pourraient être cochés rétroactivement si un script de smoke test E2E est ajouté en CI ou si l'utilisateur confirme l'avoir exécuté.**
2. **Smoke tests device manuel (Android physique)** — 5 items (Phase 1.5.3, 1.6.3-1.6.6, 2.6.4) : tests qui nécessitent un build EAS et un device physique avec FCM. Code livré mais résultats non archivés.
3. **Backend pytest** — 1 item (Phase 5.1.4) : pytest BANGE return URL override pas confirmé exécuté ; le fix code est livré (commit c1052e6d) et CI staging passe.
4. **Optimistic mark-as-read backend manquant** — 1 item (Phase 8.6.2) : endpoint backend probablement manquant, close-ticket couvert à la place.

---

## 6. TOP 5 ITEMS CRITIQUES À RE-VÉRIFIER

| Rang | Item | Phase | Pourquoi critique |
|------|------|-------|-------------------|
| 1 | **0.7.1-15** Smoke tests E2E staging | P0 | 15 items — base du contrat endpoints. Si non exécuté, pas de garantie de non-régression backend↔mobile post-rebuild endpoints.ts |
| 2 | **1.6.4** Smoke push réel device | P1 | Validation FCM bout-en-bout — si le token est registered mais aucun push n'a été reçu, on est aveugle sur la chaîne de prod |
| 3 | **5.1.4** Pytest BANGE return URL | P5 | Un bug de validator anti-open-redirect = vulnérabilité critique. Le code est en place mais la couverture pytest n'est pas confirmée |
| 4 | **9.11.4** Smoke Sentry capture + RGPD export | P9 | Validation finale OWASP avant Phase 10. Sentry sans test d'intégration = aveugle prod |
| 5 | **2.6.4** Push `document_expiring` deep link | P2 | Intersection P1↔P2 : si la chaîne push→deep link→vault est cassée, alertes expiration silencieuses |

---

## 7. RECOMMANDATIONS

1. **Créer un script smoke-test E2E staging** : un fichier `scripts/smoke-test-staging.sh` (curl + jq) qui exécute les 26 items unverified `staging` en moins de 2 min, intégrable en CI nightly. Cocherait rétroactivement Phases 0/2/3/4/5/6/9.
2. **Plan device test pre-Phase 10** : un sprint dédié de 1-2 jours sur device Android physique avec FCM enabled pour valider les 5 items "device manuel" P1 + 2.6.4. Documenter screenshots dans `.claude/plans/MOBILE_USER_DEVICE_VALIDATION_*.md`.
3. **Backend pytest BANGE** : ajouter `pytest packages/backend/tests/test_payments.py::test_bange_return_url_override` au prochain merge backend ; si déjà présent, confirmer son exit code dans CI logs.
4. **Sentry DSN provisioning** : avant Phase 10, fournir le DSN Sentry (currently placeholder). Cela débloque 9.2.8 (source-maps EAS) et 9.11.4 (capture synthétique).
5. **Phase 7 décision** : Batch Requests sauté — soit créer un plan détaillé Phase 7 (cohérence checklist), soit acter explicitement dans le master plan que Phase 7 = post-V1 backlog (déjà mentionné comme "Hors scope V1" dans master plan).

---

## 8. STATISTIQUES GLOBALES

- **Total checkboxes auditées** : 292 (260 livrés + 32 unverified + 0 deferred)
- **Taux de livraison rétroactif** : 89.0% (260 / 292)
- **Taux unverified** : 11.0% (32 / 292)
- **Phases avec ≥ 95% livraison** : Phase 2 (94%), Phase 3 (97%), Phase 4 (93%), Phase 6 (97%), Phase 8 (96%)
- **Phases avec < 80% livraison** : Phase 0 (71% — pénalisée par 15 smoke tests E2E)
- **Méthode** : conservateur — aucun coche ajoutée sans preuve commit OU fichier source. Tout item douteux = laissé `[ ]` + ⚠️ flag.

---

## 9. FICHIERS MODIFIÉS

```
.claude/plans/MOBILE_USER_PHASE_0_DETAILED.md  (41 ticks + section validation)
.claude/plans/MOBILE_USER_PHASE_1_DETAILED.md  (23 ticks + section validation)
.claude/plans/MOBILE_USER_PHASE_2_DETAILED.md  (32 ticks + section validation)
.claude/plans/MOBILE_USER_PHASE_3_DETAILED.md  (30 ticks + section validation)
.claude/plans/MOBILE_USER_PHASE_4_DETAILED.md  (13 ticks + section validation)
.claude/plans/MOBILE_USER_PHASE_5_DETAILED.md  (23 ticks + section validation)
.claude/plans/MOBILE_USER_PHASE_6_DETAILED.md  (32 ticks + section validation)
.claude/plans/MOBILE_USER_PHASE_8_DETAILED.md  (25 ticks + section validation)
.claude/plans/MOBILE_USER_PHASE_9_DETAILED.md  (41 ticks + section validation)
.claude/plans/MOBILE_USER_RETROACTIVE_VALIDATION_REPORT.md  (NEW)
```

Aucun fichier `MOBILE_BUGFIX_*.md` n'a été touché (consigne respectée).

---

## 10. NEXT ACTIONS

- [ ] Décision utilisateur : exécuter recommandation 1 (smoke-test E2E script) ou skip et accepter le 11% unverified ?
- [ ] Décision utilisateur : Phase 7 plan détaillé OU acter "post-V1 backlog" dans master plan ?
- [ ] Sentry DSN à fournir avant Phase 10 (P10 build production).
