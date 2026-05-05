# GRAFANA DASHBOARDS DYNAMIC — Plan d'implémentation

**Objectif** : permettre l'ajout/édition/suppression de dashboards Grafana (et Looker) sans redéploiement, via l'admin UI déjà en place. Wirer les 7 dashboards Grafana manquants en BD (10 live → 3 actuellement exposés dans l'app).

**Date** : 2026-05-05
**Branch** : `develop`
**Contexte mémoire** : Règles #37 (boot non-destructif perms), #38 (Looker MV→VIEW wrapper), #14 (commits par phase + push validé), #24 (`json.dumps` pour JSONB asyncpg)

---

## 0. Audit préalable (résultat)

| Composant | État | Référence |
|---|---|---|
| Table BD dual-provider | ✅ EXISTE | `database/migrations/319_dashboard_provider_dual.sql` (ENUM `dashboard_provider_enum`, colonnes `provider`/`grafana_dashboard_uid`/`grafana_org_id`, CHECK regex `^[a-zA-Z0-9_-]{4,40}$`) |
| Routes backend admin | ✅ EXISTENT | `app/modules/dashboards/api/dashboards_routes.py` GET/PUT `/api/v1/dashboards/admin/configs[/{id}]` (perm `dashboards.manage`, rate-limit 10/min) |
| Service + cache | ✅ EXISTE | `dashboard_config_service.py` (`dashboard_configs:reports_v2`, TTL 300s, audit log, cache invalidation) |
| Embed builder Grafana | ✅ EXISTE | `_build_grafana_embed_url()` ligne 45 (`/d-solo/<uid>/<slug>?orgId=N&theme=light&kiosk=tv&from=now-90d&to=now`) |
| Page frontend admin | ✅ EXISTE | `web/src/app/[locale]/(dashboard)/dashboard/admin/dashboards/config/page.tsx` |
| Form provider-aware | ✅ EXISTE | `DashboardConfigForm.tsx:250-359` (radio Looker/Grafana + champs UID + org_id) |
| Permission `dashboards.manage` | ✅ EXISTE | seedée mig 317, mirror in-code `dashboards_permissions.py:48-55` |
| Nav link | ✅ EXISTE | `AdminSidebar.tsx` (commit `c1dced74`) |
| **Bottleneck** | ❌ BLOQUE | `_REPORTS_METADATA` dict hardcodé 3 clés à `dashboards_routes.py:157-173`. Mirror à `services/dashboards_service.py:147-164`. Tout `dashboard_id` inconnu de ce dict est silencieusement dropped (404 sur `upsert_config`, ligne 283). |

**Conclusion** : pas besoin de tout reconstruire. Trois changements suffisent :
1. **Migrer le metadata in-code vers la BD** (titre i18n, description, rls_mode, display_order, embed_mode, panel_id)
2. **Ajouter POST + DELETE** pour permettre la création/suppression complète depuis l'UI
3. **Ajouter le bouton "Import depuis Grafana"** qui appelle l'API Grafana et propose les dashboards manquants

---

## Phase 1 — Schéma BD + seed (mig 323)

**Fichier** : `packages/backend/database/migrations/323_dashboards_metadata_dynamic.sql`

### 1.1 Ajout des colonnes metadata sur `dashboard_registrations`

```sql
ALTER TABLE dashboard_registrations
  ADD COLUMN IF NOT EXISTS title_es        text,
  ADD COLUMN IF NOT EXISTS title_fr        text,
  ADD COLUMN IF NOT EXISTS title_en        text,
  ADD COLUMN IF NOT EXISTS description_es  text,
  ADD COLUMN IF NOT EXISTS description_fr  text,
  ADD COLUMN IF NOT EXISTS description_en  text,
  ADD COLUMN IF NOT EXISTS rls_mode        text NOT NULL DEFAULT 'authenticated'
    CHECK (rls_mode IN ('public', 'authenticated', 'admin_only')),
  ADD COLUMN IF NOT EXISTS embed_mode      text NOT NULL DEFAULT 'kiosk'
    CHECK (embed_mode IN ('kiosk', 'solo', 'panel')),
  ADD COLUMN IF NOT EXISTS panel_id        int,
  ADD COLUMN IF NOT EXISTS display_order   int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_time_range text NOT NULL DEFAULT 'now-90d',
  ADD COLUMN IF NOT EXISTS icon_name       text,
  ADD COLUMN IF NOT EXISTS category        text;

-- Cohérence: panel_id obligatoire si embed_mode='solo' ou 'panel'
ALTER TABLE dashboard_registrations
  ADD CONSTRAINT chk_panel_id_for_solo
  CHECK (embed_mode = 'kiosk' OR panel_id IS NOT NULL);
```

### 1.2 Seed des 3 existants + 7 Grafana

```sql
-- Backfill des 3 existants depuis _REPORTS_METADATA
UPDATE dashboard_registrations SET
  title_es = 'Recaudación', title_fr = 'Recouvrement', title_en = 'Revenue Collection',
  description_es = '...', description_fr = '...', description_en = '...',
  rls_mode = 'authenticated', display_order = 10, category = 'finance'
WHERE dashboard_id = 'recaudacion';
-- ... idem agentes, services

-- 7 nouveaux Grafana (dashboard_id = slug, uid à compléter par admin via UI)
INSERT INTO dashboard_registrations
  (dashboard_id, provider, grafana_org_id, is_active, rls_mode, embed_mode,
   title_es, title_fr, title_en, display_order, category)
VALUES
  ('payments-overview',     'grafana', 1, false, 'authenticated', 'kiosk', '...', '...', '...', 20, 'finance'),
  ('field-inspections',     'grafana', 1, false, 'authenticated', 'kiosk', '...', '...', '...', 30, 'operations'),
  ('audit-trail',           'grafana', 1, false, 'admin_only',     'kiosk', '...', '...', '...', 40, 'security'),
  ('agents-workload',       'grafana', 1, false, 'authenticated', 'kiosk', '...', '...', '...', 50, 'operations'),
  ('treasury-by-site',      'grafana', 1, false, 'authenticated', 'kiosk', '...', '...', '...', 60, 'finance'),
  ('compliance-events',     'grafana', 1, false, 'admin_only',     'kiosk', '...', '...', '...', 70, 'security'),
  ('channel-mix',           'grafana', 1, false, 'authenticated', 'kiosk', '...', '...', '...', 80, 'operations')
ON CONFLICT (dashboard_id) DO NOTHING;
```

> `is_active=false` → invisibles tant que l'admin n'a pas saisi le UID + activé.

### 1.3 Backfill (titres trilingues finaux)

À renseigner depuis `infra/grafana/dashboards/*.json` (titres existants).

### Checklist phase 1
- [ ] Migration `323_*.sql` créée et idempotente (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`)
- [ ] CHECK panel_id ↔ embed_mode validée
- [ ] 3 lignes existantes backfillées avec titre i18n
- [ ] 7 lignes nouvelles insérées avec `is_active=false`
- [ ] `psql -f` test local OK
- [ ] Push → CI green → migration auto-appliquée au boot

---

## Phase 2 — Backend dynamique

### 2.1 Supprimer `_REPORTS_METADATA` in-code

**Fichier** : `app/modules/dashboards/api/dashboards_routes.py`

- Supprimer le dict (lignes 157-173)
- `GET /reports-config` lit maintenant `dashboard_registrations` ORDER BY `display_order` + filtre `is_active=true` + filtre RBAC sur `rls_mode`
- Mirror : nettoyer `services/dashboards_service.py:147-164` (utilisé par le data API Looker connector — préserver les 3 entrées qu'il attend, ou faire pointer vers la BD)

### 2.2 Nouveaux endpoints CRUD

```python
POST   /api/v1/dashboards/admin/configs             # Créer un nouveau dashboard
DELETE /api/v1/dashboards/admin/configs/{dashboard_id}   # Soft-delete (is_active=false) ou hard-delete avec audit
```

Validation Pydantic + Zod + BD CHECK (3 couches synchronisées) :
- `dashboard_id` regex `^[a-z][a-z0-9_-]{2,40}$`
- `grafana_dashboard_uid` regex `^[a-zA-Z0-9_-]{4,40}$` (déjà en BD)
- `panel_id` requis si `embed_mode != 'kiosk'`
- `rls_mode ∈ {public, authenticated, admin_only}`

Rate-limit 10/min comme PUT (rule #27 : `rate_limit_dep()` retourne déjà `Depends`).

### 2.3 Endpoint "Import depuis Grafana"

```python
POST /api/v1/dashboards/admin/grafana/import
# Body: { selected_uids: [{uid, slug, title_es, title_fr, title_en, embed_mode, ...}] }
# Server-side: appelle Grafana API /api/search avec GRAFANA_SA_TOKEN (env var),
#              renvoie la liste des dashboards Grafana non encore en BD
GET /api/v1/dashboards/admin/grafana/discover
# → liste {uid, title, slug, folder, tags} pour pré-remplissage UI
```

**Auth Grafana** : `GRAFANA_SA_TOKEN` en env var (Secret Manager). Header `Authorization: Bearer ...`. Cache 5 min de la liste (Redis) pour éviter de hammerer l'API à chaque ouverture du modal.

### 2.4 Cache + audit

- Invalider `dashboard_configs:reports_v2` après chaque POST/PUT/DELETE
- Audit log INSERT (action_type ∈ `dashboard_create`, `dashboard_update`, `dashboard_delete`, `dashboard_import`) — dans la même transaction que la mutation

### Checklist phase 2
- [ ] `_REPORTS_METADATA` supprimé, GET `/reports-config` lit BD
- [ ] POST `/admin/configs` créé (rate-limit + audit + cache invalidation)
- [ ] DELETE `/admin/configs/{id}` créé (soft-delete par défaut)
- [ ] GET `/admin/grafana/discover` (liste Grafana API)
- [ ] POST `/admin/grafana/import` (bulk insert)
- [ ] Pydantic models v2 strict + 3-couches regex sync
- [ ] `pytest tests/modules/dashboards/ -v` OK
- [ ] `mypy app/modules/dashboards --strict` OK
- [ ] Smoke test curl staging : 403 sans `dashboards.manage`, 200 avec, 422 sur regex invalide
- [ ] `GRAFANA_SA_TOKEN` ajouté dans Secret Manager + Cloud Run env

---

## Phase 3 — Frontend dynamique

### 3.1 Liste admin — actions ajoutées

**Fichier** : `web/src/modules/dashboards-admin/components/DashboardConfigsListPage.tsx`

- Ajouter bouton **"+ Nouveau dashboard"** → ouvre `DashboardConfigForm` en mode `create`
- Ajouter bouton **"📥 Importer depuis Grafana"** → modal `GrafanaImportModal`
- Ajouter action **"🗑 Supprimer"** par ligne (confirmation modal)
- Toggle **"Actif/Inactif"** par ligne (PATCH is_active)

### 3.2 GrafanaImportModal (nouveau)

```
┌────────────────────────────────────────────────────────────┐
│ Importer depuis Grafana                              [×]   │
├────────────────────────────────────────────────────────────┤
│ Connecté à : kouemousah.grafana.net                        │
│ 7 dashboards non importés                                  │
│                                                            │
│ ☐ Payments Overview      [finance]    UID: a1b2c3d4       │
│ ☐ Field Inspections      [ops]        UID: e5f6g7h8       │
│ ☐ Audit Trail            [security]   UID: i9j0k1l2       │
│ ...                                                        │
│                                                            │
│ Pour chaque coché : titre FR/ES/EN éditable inline        │
│                                                            │
│              [Annuler]  [Importer (3 sélectionnés)]       │
└────────────────────────────────────────────────────────────┘
```

Appelle `GET /admin/grafana/discover` à l'ouverture, puis `POST /admin/grafana/import` avec la sélection.

### 3.3 Form étendu

`DashboardConfigForm.tsx` — ajouter champs :
- `dashboard_id` (création uniquement, immutable après)
- `title_es/fr/en` (3 inputs)
- `description_es/fr/en` (3 textareas)
- `rls_mode` (radio public/authenticated/admin_only)
- `embed_mode` (radio kiosk/solo/panel)
- `panel_id` (input number, conditionnel si embed_mode != kiosk)
- `display_order` (input number)
- `category` (select: finance/operations/security/other)

### 3.4 Page utilisateur — affichage dynamique

**Fichier** : `web/src/app/[locale]/(dashboard)/dashboard/admin/dashboards/page.tsx` (ou nouveau `business-dashboards/page.tsx`)

```tsx
// Fetch GET /reports-config (filtré côté serveur par RBAC + is_active)
// Render: grid de cards groupées par category
<DashboardCategorySection title="Finance" icon="💰">
  <DashboardCard slug="recaudacion" />   // existant
  <DashboardCard slug="payments-overview" />   // nouveau
  <DashboardCard slug="treasury-by-site" />   // nouveau
</DashboardCategorySection>
<DashboardCategorySection title="Operations" icon="⚙️">
  ...
</DashboardCategorySection>
```

Click sur une card → `/dashboards/[slug]` plein écran avec `<DashboardEmbed />` (déjà existant, provider-aware).

### Checklist phase 3
- [ ] Bouton + Nouveau dashboard fonctionnel
- [ ] GrafanaImportModal affiche les dashboards non importés (filtre côté serveur)
- [ ] Sélection multiple + import fonctionnel
- [ ] DELETE soft-delete avec confirmation
- [ ] Toggle is_active inline
- [ ] Form étendu avec tous les nouveaux champs i18n
- [ ] Page utilisateur regroupe par category
- [ ] `npm run type-check` OK
- [ ] `npx eslint src --max-warnings=100` OK
- [ ] Test manuel : créer un dashboard, l'éditer, le supprimer, l'importer en bulk

---

## Phase 4 — Documentation + critique

### 4.1 Doc

- `docs/documentation/grafana-dashboards.html` : ajouter section "Adding a new dashboard from the admin UI" (procédure utilisateur)
- README admin : pointer vers `/dashboard/admin/dashboards/config`
- Mémoire : créer `memory/project_grafana_dynamic_2026_05_05.md`

### 4.2 Critique honnête à écrire en fin de phase

- Couverture des 10 dashboards (3 existants + 7 nouveaux = 10)
- Test E2E : login admin → import 1 dashboard → vérifier qu'il apparaît côté utilisateur en kiosk
- Sécurité : `GRAFANA_SA_TOKEN` jamais exposé côté frontend (toujours via backend)
- Performance : cache 5 min, pas de N+1 sur la liste
- i18n : toutes les clés `dashboards.*` présentes en EN/FR/ES

### Checklist phase 4
- [ ] Doc HTML mise à jour (3 langues)
- [ ] Mémoire `memory/project_grafana_dynamic_2026_05_05.md` créée
- [ ] Critique écrite avec gap honnête éventuel
- [ ] Smoke staging : import bulk fonctionne, embed s'affiche avec orgId correct
- [ ] Push validé par utilisateur (Règle #13)

---

## Risques & mitigations

| Risque | Mitigation |
|---|---|
| `GRAFANA_SA_TOKEN` non configuré → import échoue | Endpoint `/discover` renvoie 503 explicite + message UI "configurer GRAFANA_SA_TOKEN dans Secret Manager" |
| Dashboard supprimé en BD mais URL bookmark utilisateur reste | Soft-delete par défaut + page detail retourne 404 propre avec lien retour |
| Conflit dashboard_id (slug déjà utilisé) | UNIQUE constraint + 409 propre côté API |
| Embed iframe bloqué par CSP | Allowlist `kouemousah.grafana.net` dans CSP frame-src (déjà en place pour les 3 actuels) |
| RLS mode `public` exposerait données sensibles | CHECK constraint + audit lourd lors du switch vers `public` (notification admin) |

---

## Ordre d'implémentation

1. **Phase 1 BD** : migration 323 + seed → push → CI green → migration appliquée auto
2. **Phase 2 backend** : refacto `_REPORTS_METADATA` → BD + nouveaux endpoints CRUD + import → push → CI green
3. **Phase 3 frontend** : actions liste + modal import + form étendu + page user → push → CI green
4. **Phase 4 doc + critique** → push final

**Commits locaux par phase** (Règle #14, #32). Push après validation globale (Règle #13).

---

## Effort estimé

| Phase | Complexité | Heures |
|---|---|---|
| 1 BD + seed | Faible | 1-2h |
| 2 backend | Moyenne | 4-6h |
| 3 frontend | Moyenne | 4-6h |
| 4 doc + critique | Faible | 1-2h |
| **Total** | | **10-16h** |

---

**Validation utilisateur requise avant Phase 1.**
