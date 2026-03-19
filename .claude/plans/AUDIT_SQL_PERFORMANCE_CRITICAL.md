# AUDIT CRITIQUE — Performance SQL, Robustesse & Sécurité

**Date** : 2026-03-19
**Scope** : TOUS les modules backend (auth, users, permissions, companies, fiscal_services, payments, communications, service_requests, declarations, documents, admin, menu_config, translations, support, chatbot)
**Méthodologie** : Analyse statique de ~400 requêtes SQL distinctes

---

## RÉSUMÉ EXÉCUTIF

| Sévérité | Count | Impact |
|----------|-------|--------|
| CRITIQUE | 12 | Production down / Sécurité / Data corruption |
| MAJEUR | 20 | Performance dégradée à l'échelle |
| MINEUR | 25+ | Optimisations recommandées |

---

## CRITIQUES (12) — À corriger immédiatement

### C1. SQL Injection — `document_repository.py:500`
```python
where_clause = f"WHERE user_id = '{user_id}'" if user_id else ""
```
**Impact** : Injection SQL via user_id. Seule injection trouvée dans tout le codebase.
**Fix** : Paramétrisé `WHERE user_id = $1`.

### C2. SQL Injection potentielle — `base.py:103`
```python
f"ORDER BY {order_by}"
```
**Impact** : `order_by` interpolé sans whitelist dans BaseRepository.find_all(). Les appelants passent des chaînes hardcodées aujourd'hui, mais aucune validation.
**Fix** : Whitelist dict comme dans company_repository.

### C3. Receipt number race condition — `receipt_service.py:304`
```python
SELECT COUNT(*) + 1 as next_num FROM service_payments WHERE receipt_number IS NOT NULL
```
**Impact** : Deux paiements simultanés → même numéro de reçu. `ON CONFLICT DO NOTHING` = reçu perdu silencieusement.
**Fix** : PostgreSQL SEQUENCE.

### C4. N+1 critique — Permission check `permission_service.py:253`
```python
for perm in user_perms: get_by_id(perm.permission_id)  # 50 queries pour 50 permissions
```
**Impact** : Chaque appel get_user_permissions fait N queries. `get_all_permission_names()` existe mais n'est pas utilisé.
**Fix** : Utiliser `get_all_permission_names()`.

### C5. Token refresh non-transactionnel — `auth_service.py:464-488`
Revoke old session → create new session → create refresh token : 3 opérations sans transaction.
**Impact** : Crash entre revoke et create = utilisateur bloqué.
**Fix** : `async with conn.transaction()`.

### C6. Translation sync N+1 — `frontend_translation_routes.py:380-516`
Individual SELECT + INSERT/UPDATE par clé de traduction.
**Impact** : Milliers de round-trips pour un sync. Le plus gros N+1 du codebase.
**Fix** : Batch `INSERT...ON CONFLICT DO UPDATE`.

### C7. Analytics sans MV — `company_dashboard_routes.py:266-357`
6 requêtes agrégées lourdes en parallel sur UNE seule connexion asyncpg. Pas de MV fallback.
**Impact** : Timeout à 1M+ companies.
**Fix** : Créer MV pour analytics comme zone-stats/global-stats.

### C8. LATERAL subquery sort — `company_repository.py:306-331`
`list_all()` avec 2 LATERAL subqueries. Sort par `license_count` ou `member_count` force le calcul sur TOUTES les companies avant LIMIT.
**Impact** : Sort par colonne calculée = full scan.
**Fix** : Interdire sort sur colonnes LATERAL ou pré-calculer dans MV.

### C9. `open_license` tient transaction pendant I/O — `license_service.py:59-259`
PDF generation + EventBus publish dans le scope transaction.
**Impact** : Lock sur commercial_licenses pendant ~200ms de I/O.
**Fix** : Déplacer PDF/event après le COMMIT.

### C10. Unbounded page_size — `agent_routes.py:260,416`
`page_size: int = Query(default=1000, ge=1)` — pas de `le=`.
**Impact** : Client malveillant peut demander page_size=999999. DoS.
**Fix** : Ajouter `le=100`.

### C11. Debug endpoints non-authentifiés — `main.py`
6 endpoints `/api/v1/debug/*` sans `Depends(get_current_user)`.
**Impact** : Exposition de diagnostics à tout le monde.
**Fix** : Ajouter auth ou supprimer en production.

### C12. `eval()` dans calculation_service — `calculation_service.py:321`
```python
eval(formula, {"__builtins__": {}}, namespace)
```
**Impact** : Si un admin injecte une formule malveillante dans calculation_config JSONB.
**Fix** : Utiliser `asteval` ou `simpleeval`.

---

## MAJEURS (20) — Performance dégradée à l'échelle

### Index manquants (7)

| Table.Column | Usage | Impact |
|---|---|---|
| `sessions(access_token, status)` | Auth fallback hot path (Redis down) | **CRITIQUE** — every request |
| `refresh_tokens(token)` WHERE is_revoked=false | Every token refresh | **HIGH** |
| `users.password_reset_token` | Password reset flow | MEDIUM |
| `users.email_verification_code` | Email verification | MEDIUM |
| `commercial_licenses(company_id, fiscal_year)` | Analytics JOINs | HIGH |
| `service_request_history(service_request_id, action, performed_at)` | Notifications, timeline | HIGH |
| `service_requests(status, assigned_to)` partial WHERE submitted+null | Pending assignment | MEDIUM |

### N+1 patterns (5)

| Location | Pattern | Impact |
|---|---|---|
| `session_service.py:196-204` | revoke_all loops individual revokes | MAJOR |
| `fiscal_service_repository.py:995-1089` | bulk_create/bulk_update individual queries | MAJOR |
| `payment_repository.py:170-192` | Installment creation loop | MAJOR |
| `support_repository.py:214` | Correlated subquery message_count per ticket | MEDIUM |
| `escalation_sla_service.py:216-228` | History INSERT per escalated row | MEDIUM |

### Requêtes non-limitées (4)

| Location | Query | Risk |
|---|---|---|
| `base.py:88` / `user_repository.py:135` | find_all() sans LIMIT par défaut | HIGH — OOM à 1M users |
| `user_repository.py:498` | search_users email ILIKE sans LIMIT | MEDIUM |
| `agent_routes.py:260,416` | page_size default 1000 sans max | HIGH |
| `support messages` | list_messages sans LIMIT | LOW |

### SELECT * sur tables larges (4)

| Location | Table | JSONB columns ignorées |
|---|---|---|
| `service_request_repository.py:63,159,361` | service_requests | form_data, extracted_data, validations (~10KB each) |
| `payment_repository.py:84` | payments | metadata |
| `agent_queue_service.py:276` | agent_work_queue | payload |
| `declaration_repository.py:177` | tax_declarations | metadata |

---

## CACHE : Problèmes identifiés

| Module | Cache utilisé | Problème |
|---|---|---|
| **Translations** | `get_translations_cache()` EXISTE (1h TTL) | **JAMAIS APPELÉ** — chaque requête traduction hit la BD |
| **Admin stats** | Aucun | 3 full scans users + 3 full scans audit_logs sans cache |
| **Support** | Aucun | list_categories() et get_stats() non cachés |
| **Chatbot semantic search** | Aucun | La requête la plus lourde (100 lignes, 7 JOINs, vector) non cachée |
| **Menu config** | 5min TTL | OK |
| **Permissions** | 10min TTL | OK |
| **Services** | 1h TTL | OK |

---

## TRANSACTIONS : Problèmes identifiés

| Location | Problème | Sévérité |
|---|---|---|
| `auth_service.py:464-488` | Token refresh non-transactionnel (revoke+create) | CRITIQUE |
| `payment_sla_service.py:239-306` | Expiration multi-table sans transaction explicite | HIGH |
| `fiscal_service_repository.py:877-898` | Cascade delete (4 tables) sans transaction | MAJOR |
| `license_service.py:59-259` | Transaction trop longue (inclut I/O) | MAJOR |
| `user_repository.py:1041-1104` | failed_login SELECT+UPDATE non-atomique | MINOR |

---

## ROBUSTESSE : Anti-patterns

| Pattern | Occurrences | Impact |
|---|---|---|
| `await get_database()` sur async generator | **0 restant** (corrigé) | — |
| `db_manager.execute*()` + `Depends(get_database)` dans même request | Auth + routes | 2 connexions par request |
| `updated_at = "NOW()"` string au lieu de SQL | user_repository:157, system_repository:155 | Bug — timestamp pas mis à jour |
| `logger.info()` per search result (chatbot) | semantic_search_repository:260 | Log flood en prod |
| 7 instances HybridCache séparées | cache.py | 7 pools Redis au lieu de 1 |

---

## PAGE_SIZE : Frontend vs Backend

| Frontend sends | Backend max | Endpoint | Statut |
|---|---|---|---|
| 999 | **100** | workflow-mappings | **422 ERROR** (en prod actuellement) |
| 1000 | 1000 | document-templates | OK mais lourd |
| 1000 | 1000 | procedure-templates | OK mais lourd |
| 1000 | **aucun max** | agent pending queue | **DANGER** |
| 1000 | **aucun max** | agent validation queue | **DANGER** |

---

## ACTIONS PRIORITAIRES (par ordre)

### Phase 1 — Sécurité (immédiat)
1. [ ] Fix SQL injection `document_repository.py:500`
2. [ ] Fix `base.py:103` ORDER BY — ajouter whitelist
3. [ ] Protéger endpoints debug ou supprimer
4. [ ] Remplacer `eval()` par `simpleeval`

### Phase 2 — Stabilité (court terme)
5. [ ] Receipt number → PostgreSQL SEQUENCE
6. [ ] Token refresh → transaction
7. [ ] SLA expiration → transaction
8. [ ] `open_license` → séparer I/O du scope transaction
9. [ ] Ajouter `le=100` aux agent routes page_size
10. [ ] Fix `updated_at = "NOW()"` bug

### Phase 3 — Performance (moyen terme)
11. [ ] Créer 7 index manquants (sessions, refresh_tokens, users, etc.)
12. [ ] Activer translations cache (déjà codé, jamais appelé)
13. [ ] Cache chatbot semantic search (30-60s TTL)
14. [ ] Remplacer N+1 bulk_create par batch INSERT
15. [ ] COUNT(*) OVER() partout au lieu de 2 queries
16. [ ] SELECT colonnes explicites (pas SELECT *)

### Phase 4 — Scalabilité (long terme)
17. [ ] MV pour analytics dashboard
18. [ ] pg_trgm indexes pour ILIKE fallback
19. [ ] Batch overdue UPDATE (chunks 1000)
20. [ ] Partager 1 pool Redis (pas 7)
21. [ ] Parallel webhook/email sending (asyncio.gather)

---

## MÉTRIQUES ESTIMÉES (post-optimisation)

| Endpoint | Actuel estimé | Après Phase 2-3 | Objectif |
|---|---|---|---|
| Auth (Redis OK) | ~5ms | ~5ms | < 10ms |
| Auth (Redis down) | ~500ms (full scan) | ~5ms (indexed) | < 10ms |
| User list (1M) | ~2000ms | ~50ms (indexed+paginated) | < 100ms |
| Company list (1M) | ~1500ms | ~80ms (MV+indexed) | < 100ms |
| Company search | ~300ms (ILIKE) | ~20ms (trgm index) | < 50ms |
| Dashboard stats | ~800ms (3 scans) | ~50ms (cached) | < 100ms |
| Chatbot search | ~500ms (vector+7 JOINs) | ~100ms (cached) | < 200ms |
| Translation query | ~100ms (DB hit) | ~1ms (cache hit) | < 5ms |
| Directorio public | ~200ms | ~30ms (indexed) | < 50ms |

---

*Ce rapport est une analyse statique. Les temps réels dépendent de la taille des données, de la configuration PostgreSQL, et du réseau Cloud Run ↔ Supabase.*
