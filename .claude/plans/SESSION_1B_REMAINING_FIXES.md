# Plan — Corrections restantes Session 1B

**Date** : 2026-03-19
**Source** : Audit SQL Performance (AUDIT_SQL_PERFORMANCE_CRITICAL.md)

## Phase A — Quick Wins (impact immédiat)

### A1. Escalations : filtre `direction` côté serveur
**Effort** : 30min | **Priorité** : MOYEN
**Problème** : Si 20 items chargés dont 15 sent / 5 received, l'onglet received est incomplet.
**Fix** : Ajouter param `direction` au WHERE SQL de l'endpoint my-escalations.
Le frontend envoie `direction=sent|received` selon l'onglet actif → pagination correcte par direction.

### A2. 7 index manquants (sessions, tokens, users)
**Effort** : 30min | **Priorité** : HAUT
**Fix** : Migration SQL avec CREATE INDEX CONCURRENTLY.
```sql
-- Auth hot path (Redis fallback)
CREATE INDEX CONCURRENTLY idx_sessions_access_token_status ON sessions (access_token) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_sessions_refresh_token_status ON sessions (refresh_token) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_refresh_tokens_token_active ON refresh_tokens (token) WHERE is_revoked = false;
-- User flows
CREATE INDEX CONCURRENTLY idx_users_password_reset_token ON users (password_reset_token) WHERE password_reset_token IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_users_email_verification ON users (email_verification_code) WHERE email_verification_code IS NOT NULL;
-- Licenses + analytics
CREATE INDEX CONCURRENTLY idx_commercial_licenses_company_year ON commercial_licenses (company_id, fiscal_year);
-- Service requests notifications
CREATE INDEX CONCURRENTLY idx_sr_history_request_action ON service_request_history (service_request_id, action, performed_at DESC);
```

### A3. C8 LATERAL sort restriction
**Effort** : 15min | **Priorité** : FAIBLE
**Fix** : Retirer `license_count` et `member_count` du dict `allowed_sort` dans company_repository.py.
Les colonnes LATERAL ne sont plus triables (empêche full scan).

### A4. Menu-config preview page_size=999
**Effort** : 15min | **Priorité** : FAIBLE
**Fix** : Changer le fetch preview de 999 → 100 (max backend).

## Phase B — Refactors structurels (session dédiée)

### B1. C7 Analytics MV pour dashboard empresas
**Effort** : 3h | **Priorité** : MOYEN
**Problème** : 6 requêtes agrégées sans MV fallback → timeout à 1M+ companies.
**Fix** : Créer mv_company_analytics (top debtors, fee type stats, monthly trend).
Migration + refresh cron + fallback route (pattern existant zone-stats).

### B2. Entity filter agents côté serveur
**Effort** : 1h | **Priorité** : FAIBLE (search serveur compense)
**Fix** : Ajouter param `entity_code` au backend GET /profiles.

### B3. N+1 bulk_create fiscal services
**Effort** : 2h | **Priorité** : MOYEN
**Fix** : Remplacer loop INSERT par single `INSERT...SELECT FROM unnest()`.
Concerne : fiscal_service_repository.py bulk_create + bulk_update_status.

### B4. SELECT * → colonnes explicites
**Effort** : 2h | **Priorité** : MOYEN
**Fix** : service_request_repository find_by_id/find_by_user/find_by_agent.
Remplacer SELECT * par liste de colonnes (évite 10KB+ JSONB inutiles dans les listes).

## Ordre d'exécution

Phase A : A2 (index) → A1 (escalation direction) → A3 (LATERAL) → A4 (menu preview)
Phase B : B1 → B2 → B3 → B4 (session ultérieure)
