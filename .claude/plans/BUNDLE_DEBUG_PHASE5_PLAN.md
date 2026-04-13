# PHASE 5 — SÉCURITÉ OWASP + PERF 1M+

**Master plan** : `BUNDLE_DEBUG_MASTER_PLAN_2026_04_13.md`
**Date** : 2026-04-13
**Priorité** : 🟢 MOYENNE — durcissement défensif
**Temps estimé** : ~2 h
**Statut** : 🔵 EN COURS (worktree)

---

## 1. OBSERVATIONS

### 1.1 Audit sécurité actuelle

| # | Zone | État | Commentaire |
|---|---|---|---|
| A | Auth sur endpoints bundle | ✅ | `get_current_user` sur toutes les 7 routes |
| B | Owner guard `initiate` | 🟡 AUDIT LOG | Log "third-party payment" mais n'empêche pas |
| C | Owner guard `initiate_payment` | ❌ **ABSENT** | Pas même un log → incohérence |
| D | Rate limiting | ❌ **ABSENT** | `check_rate_limit` helper existe (cache.py:907) mais pas appliqué |
| E | Lock timeouts | ✅ (Phase 1) | `SET LOCAL lock_timeout/statement_timeout` en place |
| F | Injection SQL | ✅ | asyncpg parameterized partout |
| G | Stack leak 5xx | ✅ | `global_exception_handler` sanitize déjà |
| H | CORS | ✅ | Origins restreintes en prod |
| I | CSRF | n/a | Bearer token, pas de cookies de session |

### 1.2 Audit perf (BD réelle)
**Indexes critiques bundle** — tous présents et partial :

| Table | Index clé | Type | OK ? |
|---|---|---|---|
| `commercial_licenses` | `pkey` + `idx_cl_status` (partial open/partial/overdue) | btree partial | ✅ |
| `commercial_licenses` | `idx_cl_deadline` (partial) | btree partial | ✅ |
| `commercial_licenses` | `idx_cl_service_request` (partial NOT NULL) | btree partial | ✅ |
| `license_obligations` | `license_obligations_license_id_fkey` implicit | btree | ✅ |
| `license_obligations` | `idx_obligations_due_date` (partial not paid/cancelled) | btree partial | ✅ |
| `service_requests` | `idx_sr_commercial_license_unique` UNIQUE partial | btree unique partial | ✅ |
| `service_requests` | `idx_sr_company` (partial) | btree partial | ✅ |
| `service_requests` | `idx_sr_workflow_status_created` composite | btree composite | ✅ |
| `service_payments` | `idx_service_payments_request_status` (partial) | btree partial | ✅ |
| `service_payments` | `idx_sp_fee_type` (partial NOT NULL) | btree partial | ✅ |

**Aucune missing index détectée** sur le chemin critique bundle. L'indexation est excellente.

### 1.3 FK constraints — toutes `ON DELETE RESTRICT` ou `SET NULL` (jamais CASCADE sur commercial_licenses root).

### 1.4 Row counts estimés
```
commercial_licenses = 13
license_obligations = 60
service_payments = 11
service_requests = 12
```
Staging DB fresh — pas encore de données de charge. Les tests de charge sont donc reportés en Phase 5 (Phase 6 peut faire un smoke test à 10 users concurrents).

---

## 2. DESIGN

### 2.1 Owner guard cohérent — audit log sur `initiate_payment`
**Non-regression** : garder la politique "third-party payment autorisé" (cohérent avec `initiate`).
**Ajout** : log structuré `AUDIT: third-party bundle payment — user X pays license Y owned by Z` au début de `initiate_payment`. Cela permet :
- Traçabilité post-hoc (qui a payé quoi pour qui)
- Alerting si spike anormal détecté

### 2.2 Rate limit sur `initiate-payment` endpoint
- **Per user** : 10 requêtes / 60 s (très généreux — un user normal ne relance pas un paiement)
- **Per IP** : 30 requêtes / 60 s (pour tolérance NAT partagés)
- Fail-closed déjà géré par `check_rate_limit` (cache.py)
- HTTP 429 + message i18n existant `ErrorCode.RATE_LIMITED`
- Log serveur pour détection d'abus

### 2.3 Rate limit sur `initiate` et `initiate-from-upload`
Ces endpoints créent des licences en BD. Spam → pollution + coût Gemini (OCR preview).
- **Per user** : 20 / 60 s
- **Per IP** : 60 / 60 s

### 2.4 Helper générique rate limit
Créer un dependency FastAPI réutilisable `rate_limit_dependency(endpoint, max_requests, window_seconds)` dans `app/core/rate_limit.py`.

### 2.5 Test d'intégration sécurité
- Test 1 : rate limit declenche 429 après N+1 requêtes
- Test 2 : rate limit fail-closed si cache down (fake Redis)
- Test 3 : Owner guard audit log émis pour third-party
- Test 4 : Lock timeout fait échouer en NOWAIT → raise PAYMENT_ALREADY_IN_PROGRESS

---

## 3. CHECKLIST D'IMPLÉMENTATION

### 3.1 Helper rate limit
- [ ] Créer `app/core/rate_limit.py` avec fonction `rate_limit(identifier, endpoint, max, window)` + dependency `rate_limit_dep()`
- [ ] Tests unitaires du helper

### 3.2 Câblage endpoints bundle
- [ ] `initiate-payment` : 10/min user + 30/min IP
- [ ] `initiate` : 20/min user + 60/min IP
- [ ] `initiate-from-upload` : 10/min user + 30/min IP (cher car Gemini)
- [ ] `classify-preview` : 20/min user + 60/min IP (cher aussi)

### 3.3 Audit log initiate_payment
- [ ] Ajouter le log structuré au début de `initiate_payment` (après license_row fetch)
- [ ] Test qui vérifie la présence du log (via caplog pytest)

### 3.4 Tests
- [ ] `tests/unit/core/test_rate_limit.py` — helper unit tests
- [ ] `tests/unit/fiscal_services/test_bundle_security.py` — audit log + rate limit integration

### 3.5 Lint + critique + commit
- [ ] flake8
- [ ] commit local

---

## 4. SCOPE OUT PHASE 5 (reporté)

- **Test de charge réel** (100 users concurrents) → nécessite infra de test, reporté Phase 6 ou post-release
- **Prometheus metrics** → nécessite config infra, non critique
- **Refactor owner guard en "block" plutôt que log** → changement de politique métier, nécessite décision produit

---

## 5. RISQUES

### R-P5-1 : Rate limit agressif bloque utilisateurs légitimes
Un user qui clique "retry" 3 fois rapidement ne doit pas être bloqué.
**Mitigation** : 10/min est déjà généreux. Frontend Phase 3 a déjà un cooldown par catalog (5s pour `PAYMENT_ALREADY_IN_PROGRESS`), ce qui s'aligne.

### R-P5-2 : Rate limit sur un endpoint d'un admin legit qui fait du bulk
Les admins n'utilisent pas `initiate-payment` (endpoint citoyen). Risque zéro.

### R-P5-3 : Helper rate_limit dependency FastAPI et body parsing
FastAPI dependencies s'exécutent avant le body → on peut lire `request.client.host` et `current_user.id` pour l'identifier. OK.
