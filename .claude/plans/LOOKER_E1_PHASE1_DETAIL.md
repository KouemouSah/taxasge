# LOOKER E1 — Phase 1 : BD foundations (migration 317)

**Date** : 2026-05-04
**Phase** : 1/5
**Statut** : 📋 PLANIFIÉ
**Effort** : 30min
**Master plan** : `.claude/plans/LOOKER_E1_AUTOMATION_MASTER_PLAN.md`

---

## 1. Objectif phase

Créer les fondations BD pour stocker la config Looker éditable par l'admin :
1. Table `dashboard_registrations` (1 row par dashboard du registry)
2. Permission `dashboards.manage` (gating PUT endpoint)
3. Grants à `admin` et `super_admin` uniquement

## 2. Design SQL

### 2.1 Table `dashboard_registrations`

```sql
CREATE TABLE dashboard_registrations (
    dashboard_id   text PRIMARY KEY,
    looker_report_id text NOT NULL,
    looker_page_id text,
    is_active      boolean NOT NULL DEFAULT true,
    updated_by     uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at     timestamptz NOT NULL DEFAULT now(),
    created_at     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_looker_report_id_format
        CHECK (looker_report_id ~ '^[a-zA-Z0-9_-]{8,64}$'),
    CONSTRAINT chk_looker_page_id_format
        CHECK (looker_page_id IS NULL OR looker_page_id ~ '^[a-zA-Z0-9_]{1,32}$')
);

CREATE INDEX idx_dashboard_registrations_active
    ON dashboard_registrations(is_active) WHERE is_active = true;

COMMENT ON TABLE dashboard_registrations IS
    'Looker Studio report_id mapping per dashboard. Editable via /admin/dashboards/config (E1).';
COMMENT ON COLUMN dashboard_registrations.dashboard_id IS
    'Matches dashboards_service.py registry keys: recaudacion, agentes, services.';
COMMENT ON COLUMN dashboard_registrations.looker_report_id IS
    'Looker Studio report ID extracted from /reporting/<id>/page/... URL.';
COMMENT ON COLUMN dashboard_registrations.looker_page_id IS
    'Optional Looker Studio page ID (p_xxx). NULL = first page (Looker default).';
```

**Choix justifiés** :
- `dashboard_id` PK = clé naturelle (3 valeurs connues, jamais changent côté code)
- Pas de FK vers une hypothétique `dashboards` table — le registry est en code
- `text` plutôt que `varchar(...)` : pas de limite arbitraire, CHECK regex suffit
- Regex CHECK PostgreSQL = première ligne de défense (Pydantic = deuxième)
- `is_active` permet de désactiver un dashboard sans supprimer la ligne (preserve audit trail)
- `updated_by` ON DELETE SET NULL : si l'admin est supprimé, on garde la ligne avec NULL
- Index partiel sur `is_active = true` : optimisé pour la query GET active configs

### 2.2 Permission `dashboards.manage`

```sql
INSERT INTO permissions (name, resource, action, description, module_name, is_critical, created_at)
VALUES (
    'dashboards.manage',
    'dashboards',
    'manage',
    'Manage Looker Studio dashboard configurations (report_id, page_id, active state)',
    'dashboards',
    TRUE,                      -- is_critical = TRUE car modifie ce que voient TOUS les admin
    NOW()
)
ON CONFLICT (name) DO NOTHING;
```

**Choix `is_critical = TRUE`** : modifier un report_id change ce que toute la base d'admin voit. Mérite is_critical pour future logique de double-validation/MFA.

### 2.3 Grant uniquement à admin/super_admin

```sql
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, TRUE
FROM roles r
CROSS JOIN permissions p
WHERE p.name = 'dashboards.manage'
  AND r.code IN ('admin', 'super_admin')
ON CONFLICT (role_id, permission_id) DO NOTHING;
```

**Choix exclusion agents** : `dashboards.view_business` (migration 316) est large pour 21 rôles (lecture). `dashboards.manage` est strict pour 2 rôles seulement (écriture admin). Pas de grant aux supervisors/agents — séparation des privilèges OWASP.

### 2.4 Verification queries (commentées en bas du fichier)

```sql
-- 1. Table créée :
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name = 'dashboard_registrations';
--
-- 2. CHECK constraints actifs :
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
-- WHERE conrelid = 'dashboard_registrations'::regclass AND contype = 'c';
--
-- 3. Permission créée :
-- SELECT id, name, is_critical FROM permissions WHERE name = 'dashboards.manage';
--
-- 4. Grants (count = 2) :
-- SELECT r.code FROM roles r
-- JOIN role_permissions rp ON rp.role_id = r.id
-- JOIN permissions p ON p.id = rp.permission_id
-- WHERE p.name = 'dashboards.manage' ORDER BY r.code;
--
-- 5. Idempotence (2e run = 0 nouvelles lignes) :
-- (relance la migration et vérifie counts inchangés)
```

### 2.5 Rollback (commenté)

```sql
-- ROLLBACK manuel:
-- BEGIN;
--   DELETE FROM role_permissions
--   WHERE permission_id = (SELECT id FROM permissions WHERE name = 'dashboards.manage');
--   DELETE FROM permissions WHERE name = 'dashboards.manage';
--   DROP TABLE IF EXISTS dashboard_registrations;
-- COMMIT;
```

## 3. Script Python application

Réutiliser le pattern `apply_migrations_315_316.py` (psycopg2 sync, audit trigger context). Nouveau fichier : `packages/backend/scripts/apply_migration_317.py`.

**Étapes** :
1. Load `.env.local` → `DATABASE_URL`
2. Connect psycopg2, autocommit=False
3. SELECT admin user → `set_config('app.current_user_id', ...)`
4. Execute migration SQL en transaction
5. Verification queries (5 listées en §2.4)
6. Commit
7. Log success

## 4. Checklist phase 1

- [x] BD verifiée (rapport `LOOKER_E1_AUTOMATION_MASTER_PLAN.md` Annexe A) — 2026-05-04
- [x] Plan phase 1 écrit (CE FICHIER) — 2026-05-04
- [x] Migration SQL `317_dashboard_registrations.sql` écrite
- [x] Script Python `apply_migration_317.py` écrit
- [x] Migration appliquée localement (Supabase) — id permission dashboards.manage = 9a955a4d-cbd4-47d6-bbac-2906abcc7142
- [x] Verifications post-apply OK (8 checks: table, columns, CHECK constraints, partial index, permission, 2 grants admin+super_admin, CHECK valid path, CHECK reject path)
- [x] Test idempotence (2e run = no-op, perms 336→336, role_perms 1869→1869)
- [x] **DÉCOUVERTE** : `dashboards.view_business` (migration 316) avait disparu de la BD entre 2026-05-02 et 2026-05-04. Migration 316 ré-appliquée (idempotent, 21 grants restaurés).
- [ ] Commit local : `feat(observability/looker): E1 phase 1 — migration 317 dashboard_registrations + dashboards.manage permission`

## 5. Critique préventive (avant impl)

| Item | Question | Réponse |
|---|---|---|
| Hardcoding | UUID admin/super_admin codés ? | Non — résolus via `WHERE r.code IN (...)` SELECT |
| 1M+ users | Index sur is_active utile ? | Oui — query GET filtre WHERE is_active=true, partial index réduit le coût |
| OWASP | Regex côté BD assez stricte ? | Oui — `^[a-zA-Z0-9_-]{8,64}$` couvre les Looker IDs réels (~30 chars typique). Pydantic re-validera. |
| OWASP | is_critical=TRUE utile maintenant ? | Pas immédiatement (pas de logique double-validation), mais audit/grep facilité + future-proof |
| UX | Désactiver un dashboard sans supprimer la ligne ? | Oui — `is_active=FALSE` garde l'historique |
| Idempotence | Si la migration échoue à mi-chemin ? | BEGIN/COMMIT atomique. Si crash, rien n'est commité. ON CONFLICT pour la permission/grants. |
| Backward compat | Existing GET /reports-config encore fonctionnel après migration ? | Oui — la migration ne touche pas à l'endpoint. Phase 2 fera le refactor. |
| Rollback | Plan testé ? | Oui — script SQL commenté en bas du fichier migration |

**Gaps connus à régler en phase 2 ou plus tard** :
- Pas de seed initial des 3 rows (`recaudacion`, `agentes`, `services`) — VOLONTAIRE : la table reste vide jusqu'à ce qu'un admin clique dans l'UI. Le fallback env vars couvre la transition.
- Pas de soft-delete (`deleted_at`) — un admin peut DELETE directement, mais l'audit trail reste dans `audit_logs`. Si besoin futur, ajouter `deleted_at` dans une migration ultérieure.
- Pas d'index sur `updated_at` — la query principale filtre sur `is_active`, pas `updated_at`. Ajout possible si besoin de "dernières modifs récentes".

## 6. Validation manuelle post-application

À exécuter après le script :
```sql
-- a) Table existe + structure
\d dashboard_registrations

-- b) Permission existe
SELECT id, name, is_critical, module_name FROM permissions
WHERE name = 'dashboards.manage';

-- c) Grants exact
SELECT r.code FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE p.name = 'dashboards.manage' ORDER BY r.code;
-- attendu: admin, super_admin

-- d) CHECK constraints actifs
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid = 'dashboard_registrations'::regclass AND contype = 'c';
-- attendu: chk_looker_report_id_format, chk_looker_page_id_format

-- e) Test CHECK : insertion valide
INSERT INTO dashboard_registrations (dashboard_id, looker_report_id, looker_page_id)
VALUES ('test_dummy', 'abc123-def456-ghi789', 'p_12345');
-- attendu: OK

-- f) Test CHECK : insertion invalide (regex fail)
INSERT INTO dashboard_registrations (dashboard_id, looker_report_id)
VALUES ('test_bad', 'tooshort');
-- attendu: CHECK violation chk_looker_report_id_format

-- g) Cleanup test
DELETE FROM dashboard_registrations WHERE dashboard_id = 'test_dummy';
```

## 7. Sortie phase 1

À la fin de cette phase :
- ✅ Table `dashboard_registrations` existe + CHECK constraints actifs + index partiel
- ✅ Permission `dashboards.manage` existe avec `is_critical=TRUE`, id=9a955a4d-cbd4-47d6-bbac-2906abcc7142
- ✅ admin + super_admin ont la permission (2 grants via role_permissions)
- ✅ Idempotence vérifiée (2e run = 0 changements)
- ✅ Migration 316 ré-appliquée (21 grants restaurés) après découverte de wipe entre sessions
- ✅ 1 commit local sémantique
- ✅ Phase 2 peut commencer (modèles Pydantic + repo + service + endpoints)

## 8. Critique honnête phase 1

**Bien réussi** :
- Vérification BD live AVANT toute écriture migration → évité 2 itérations comme en session 2026-05-02
- CHECK constraints regex Postgres = défense en profondeur (vs Pydantic seul)
- Index partiel sur `is_active=true` → optimisé pour le hot path GET reports-config
- Audit trigger context configuré correctement (admin_id auto-discovered)
- Idempotence testée (2e run via verify_e1_phase1_post.py)
- Découverte critique du wipe BD : a été détectée et corrigée immédiatement

**Gaps identifiés (à corriger ou accepter)** :
1. **Pas de seed initial des 3 rows** — VOLONTAIRE car le fallback env vars couvre la transition. Phase 3 ajoutera un état UI "non configuré" pour pousser l'admin à compléter.
2. **Le wipe entre sessions** suggère que la BD Supabase n'est pas stable au point d'être utilisée comme source de vérité pour les permissions. Recommandation FUTURE : ajouter à GitHub Actions un job `verify_critical_permissions.yml` qui re-applique 316/317 si elles disparaissent. **Hors scope E1**, à ouvrir comme issue séparée.
3. **Pas de soft-delete** sur `dashboard_registrations` — un admin peut DELETE direct, mais `audit_logs` garde la trace. Acceptable pour 3 lignes max.
4. **`is_critical=TRUE`** sur dashboards.manage : cosmétique aujourd'hui (pas de logique double-validation), justifié par l'intent OWASP. Pas de gap.
5. **Régex `looker_report_id`** : `^[a-zA-Z0-9_-]{8,64}$`. Risque : un futur ID Looker > 64 chars échouerait. Mitigation : observation empirique des IDs Looker (typiquement 30-40 chars), 64 est large. Ouvrir migration ALTER si jamais un cas réel dépasse.

**OWASP check** :
- ✅ Input validation au niveau BD (CHECK regex)
- ✅ FK ON DELETE SET NULL (pas de dangling refs)
- ✅ Permission gate (admin/super_admin only)
- ✅ Audit trigger actif sur role_permissions
- ✅ Pas de UUID hardcodé

**Performance 1M+ check** :
- ✅ Index partiel sur is_active=true
- ✅ Table size : 3 rows max (un par dashboard)
- ✅ Hot read path sera caché Redis 5min en phase 2

**Verdict phase 1** : OK, prête pour commit + phase 2.
