# SOFT-DELETE / ARCHIVE COMPANIES — Plan d'implémentation

**Date** : 2026-04-28
**Auteur** : Claude (Opus 4.7) — agissant comme expert backend + frontend + mobile
**Trigger** : Audit `MOBILE_USER_PARITY_AUDIT_2026_04_28.md` finding **SOFT-DELETE**.
**Master plan** : `MOBILE_USER_MIGRATION_MASTER_PLAN.md` — à exécuter **avant Phase 10**.
**Précédents BD** :
- `313_users_soft_delete.sql` — `users.deleted_at TIMESTAMPTZ`, purge cron 30 jours.
- `287_user_documents_vault.sql:92` — `archived_at TIMESTAMPTZ` pattern.

---

## 0. CONTEXTE & MOTIVATION

### 0.1 Constat

Backend `DELETE /companies/{id}` (`company_routes.py:581` → `company_repository.delete()` ligne 179) effectue un **hard-delete sans aucune protection** :

```python
async with conn.transaction():
    await conn.execute("DELETE FROM user_company_roles WHERE company_id = $1", cid)
    result = await conn.execute("DELETE FROM companies WHERE id = $1", cid)
```

Aucun check sur :
- `commercial_licenses` (licences en cours)
- `service_payments` (paiements in-flight)
- `service_requests` (demandes ouvertes)
- `field_inspections` (inspections terrain en cours)
- `license_obligations` (obligations fiscales pendantes)

**Risque** :
- Une entreprise avec licence active peut disparaître → orphelins FK silencieux
- Audit trail rompu (rapports fiscaux GE, conformité légale 10 ans)
- RGPD non respecté (rétention obligatoire pour rapports fiscaux > droit à l'oubli)
- Endpoint actuellement appelable via curl par tout `company_owner` ou admin avec `company.delete`

### 0.2 Constat parité

- **Web** : `/empresas/[companyId]/page.tsx` n'expose AUCUN bouton Edit/Delete pour citoyen (vérifié grep — seuls CreditCard, Eye, ArrowUpDown, RefreshCw).
- **Mobile** : commit `efcb351f` a retiré les boutons Edit/Delete et codifié la logique de garde role dans `useCompanyMembership` (sans l'exposer).
- **Backend** : endpoint reste ouvert sans protection — vulnérabilité réelle exploitable par token compromis.

### 0.3 Décision retenue

**Remplacer le DELETE par un ARCHIVE soft-delete pour citoyen** :
- Citoyen → "Archiver mon entreprise" (soft) avec checks de dépendances (409 Conflict si bloqueurs)
- Admin → restore + hard-delete (avec permission dédiée)
- Audit trail préservé, RGPD compliant (rétention 10 ans GE pour fiscalité)
- UI cohérente web ↔ mobile via hook `useCompanyMembership` (mobile shipped, web à porter)

---

## 1. ARCHITECTURE GÉNÉRALE

### 1.1 Schéma BD — companies (changements)

```sql
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS archive_reason VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS archived_by UUID NULL REFERENCES users(id);
```

Valeurs `archive_reason` :
- `'archived_by_owner'` (citoyen self-service)
- `'archived_by_admin'` (intervention admin)
- `'merged'` (fusion d'entreprises, futur)
- `'inactive_long_term'` (cron auto-archive, futur — entreprises sans activité 2+ ans)

### 1.2 Endpoints backend

| Méthode | Path | Rôle | Description |
|---------|------|------|-------------|
| POST | `/companies/{id}/archive` | `company_owner` | Soft-delete : `is_active=false, archived_at=NOW(), archive_reason='archived_by_owner', archived_by=user_id`. **Bloque (409)** si licences actives, paiements in-flight, SR ouvertes, ou inspections en cours. |
| POST | `/companies/{id}/unarchive` | `company.unarchive` (admin) | Restaure : `is_active=true, archived_at=NULL, archive_reason=NULL, archived_by=NULL`. |
| DELETE | `/companies/{id}` | `company.hard_delete` (admin uniquement, **plus de fallback citoyen**) | Hard-delete avec mêmes protections que archive (409 si dépendances) + check `archived_at IS NOT NULL` (préalable archive 30j). |

### 1.3 Filtrage des listes citoyen

Toutes les requêtes citoyen doivent ajouter `WHERE archived_at IS NULL` :
- `GET /companies` (`company_routes.py:478` `list_companies`)
- `GET /bundle-workflow/my-companies` (`bundle_workflow_service.py:40` `my_companies_status`)
- `GET /bundle-workflow/my-companies/{id}` (`bundle_workflow_service.py:118` — refuser si `archived_at IS NOT NULL` côté citoyen)
- `GET /companies/{id}/members` (idem)

Admin lists (`/admin/all`, `/supervisor/my-companies`, `/admin/search`) **n'appliquent pas** ce filtre — les admins doivent voir tout.

### 1.4 UI exposition

**Web** (`packages/web`) :
- `/empresas/[companyId]/page.tsx` — bouton "Archivar" dans le header, visible uniquement si `useCompanyMembership.isOwner` ET `archived_at IS NULL`.
- Dialog confirmation avec liste des "blockers" (licences actives, paiements, etc.).
- Si archived (admin route) — bouton "Restaurar" si role admin.

**Mobile** (`packages/mobile`) :
- `app/companies/[id].tsx` — entrée `Menu.Item` "Archivar mi empresa" visible uniquement si `useCompanyMembership.isOwner` ET `company.is_active === true`.
- Dialog confirmation (composant `CompanyArchiveDialog` — réutilise pattern `CompanyDeleteDialog` existant).
- Snackbar success → `router.back()` (l'entreprise disparaît de la liste).

### 1.5 Pas de purge automatique

Différence majeure avec `users.deleted_at` (purge cron 30j) : les companies **ne sont JAMAIS purgées automatiquement**. Rétention légale GE 10 ans pour rapports fiscaux. Hard-delete admin réservé aux cas exceptionnels (test data, doublons).

---

## 2. PHASES D'EXÉCUTION

### Phase 1 — Backend (BD + endpoints + protections) (~1.5j)

#### 1.1 Migration SQL `314_companies_soft_delete.sql`

- [ ] `ALTER TABLE companies ADD archived_at TIMESTAMPTZ NULL`
- [ ] `ALTER TABLE companies ADD archive_reason VARCHAR(50) NULL`
- [ ] `ALTER TABLE companies ADD archived_by UUID NULL REFERENCES users(id)`
- [ ] Index partiel : `CREATE INDEX idx_companies_archived_at ON companies(archived_at) WHERE archived_at IS NOT NULL`
- [ ] Permission seed : `INSERT INTO permissions (name, description) VALUES ('company.unarchive', '...'), ('company.hard_delete', '...')`
- [ ] Lier la permission `company.unarchive` aux rôles admin (`role_permissions` INSERT)
- [ ] Lier la permission `company.hard_delete` aux rôles admin (le retirer du flow citoyen)
- [ ] Comment SQL sur les colonnes (self-doc)

**Validation** :
- [ ] `psql` direct : `\d+ companies` montre les 3 nouvelles colonnes
- [ ] `SELECT name FROM permissions WHERE name LIKE 'company.%'` retourne `archive`, `unarchive`, `hard_delete`
- [ ] Migration idempotente (`IF NOT EXISTS`)

#### 1.2 Repository `company_repository.py`

- [ ] Nouvelle méthode `archive(conn, company_id, user_id, reason)` : UPDATE companies + INSERT audit_log
- [ ] Nouvelle méthode `unarchive(conn, company_id)` : UPDATE companies (archived_at, archive_reason, archived_by → NULL) + INSERT audit_log
- [ ] Nouvelle méthode `check_archive_blockers(conn, company_id)` retourne `Dict[str, int]` :
  - `active_licenses`: count `commercial_licenses WHERE company_id=$1 AND status NOT IN ('cancelled', 'expired', 'revoked')`
  - `pending_payments`: count `service_payments WHERE company_id=$1 AND workflow_status NOT IN ('completed', 'cancelled', 'refunded')`
  - `open_requests`: count `service_requests WHERE company_id=$1 AND status NOT IN ('completed', 'cancelled', 'rejected')`
  - `active_inspections`: count `field_inspections WHERE company_id=$1 AND status IN ('pending', 'in_progress')`
- [ ] Méthode existante `delete()` : ajouter check `archive_blockers` ET `archived_at IS NOT NULL` (préalable). Renvoyer ValueError sinon.
- [ ] Méthode existante `list_by_user`, `get_by_id` etc. : ajouter `WHERE archived_at IS NULL` pour citoyens (paramètre `include_archived=False` par défaut)

**Validation** :
- [ ] Tests pytest sur les 3 méthodes (`archive`, `unarchive`, `check_archive_blockers`) avec fixtures
- [ ] Tests pytest sur `delete()` rejet quand non-archived

#### 1.3 Service `company_service.py` (créer si absent, sinon étendre)

- [ ] Méthode `archive_company(db, company_id, user_id)` :
  1. Vérifier ownership (`company_owner` only)
  2. Appeler `check_archive_blockers` → si non vide, raise `ArchiveBlockedError(blockers)`
  3. Appeler `repository.archive(...)` dans une transaction
  4. INSERT `audit_logs` (entity_type='company', action='archive', user_id, details={blockers checked})
- [ ] Méthode `unarchive_company(db, company_id, admin_user_id)` :
  1. Vérifier permission `company.unarchive`
  2. Appeler `repository.unarchive(...)` dans une transaction
  3. INSERT `audit_logs`
- [ ] Méthode `hard_delete_company(db, company_id, admin_user_id)` :
  1. Vérifier permission `company.hard_delete`
  2. Vérifier `archived_at IS NOT NULL` (préalable obligatoire)
  3. Vérifier `check_archive_blockers` → si non vide, raise (un company archivé peut avoir gagné de nouvelles dépendances ?)
  4. Appeler `repository.delete(...)` dans une transaction
  5. INSERT `audit_logs`

#### 1.4 Routes `company_routes.py`

- [ ] **Nouvelle route** `POST /companies/{id}/archive` :
  - Auth required (`get_current_user`)
  - Body vide
  - 200 OK → `{"message": "Company archived", "archived_at": "..."}`
  - 403 si non `company_owner`
  - 409 si blockers → `{"detail": "Cannot archive: company has active dependencies", "blockers": {...}}`
  - 404 si company introuvable
- [ ] **Nouvelle route** `POST /companies/{id}/unarchive` :
  - `permission_required("company.unarchive")`
  - 200 OK → `{"message": "Company restored"}`
  - 404 si introuvable, 400 si déjà active
- [ ] **Modifier route existante** `DELETE /companies/{id}` :
  - Remplacer la check `company_owner` actuelle par `permission_required("company.hard_delete")`
  - Ajouter check préalable `archived_at IS NOT NULL`
  - Garder le fallback `company.delete` permission pour back-compat admins existants ? **Décision** : non, migration claire — admin a `company.hard_delete`, citoyen a 0.

**Validation** :
- [ ] Tests pytest 200/403/404/409 sur les 3 routes
- [ ] Curl manuel : un user `company_owner` reçoit 403 sur DELETE (n'a pas `company.hard_delete`)
- [ ] Curl manuel : un user `company_owner` peut archive si pas de licence active, 409 sinon

#### 1.5 Filtrage citoyen sur les lectures

- [ ] `bundle_workflow_service.py:40` `my_companies_status` — ajouter `AND c.archived_at IS NULL` à la query
- [ ] `bundle_workflow_service.py:118` `my_company_detail` — vérifier `archived_at IS NULL`, sinon 404
- [ ] `company_routes.py:478` `list_companies` — paramètre query `?include_archived=false` par défaut, `true` réservé admins
- [ ] `company_routes.py:497` `get_company` — refuser citoyen si archived

**Validation** :
- [ ] Tests pytest : créer 2 companies dont 1 archived, GET list user-scope retourne 1 seule
- [ ] Tests pytest : GET archived company en tant que citoyen → 404

---

### Phase 2 — Web (~1.5j)

#### 2.1 Module `web/src/modules/companies/`

- [ ] Hook `useCompanyMembership(companyId, currentUserId)` (port du mobile) — retourne `{ membership, isOwner, isAdmin, canEdit, canDelete, canManageMembers, canArchive }`
- [ ] Hook `useArchiveCompany()` mutation : `POST /companies/{id}/archive`, gère 409 (blockers) en lisant le payload.
- [ ] Hook `useUnarchiveCompany()` mutation (admin)
- [ ] Hook `useHardDeleteCompany()` mutation (admin) — remplace `useDeleteCompany` legacy
- [ ] Service API : `companiesApi.archive(id)`, `companiesApi.unarchive(id)`, `companiesApi.hardDelete(id)`
- [ ] Marquer `companiesApi.delete` legacy avec JSDoc `@deprecated` pointant vers `archive`/`hardDelete`

#### 2.2 UI `/empresas/[companyId]/page.tsx`

- [ ] Bouton "Archivar empresa" dans le header (icône `Archive`), visible si `canArchive` (= `isOwner` ET `!company.archived_at`)
- [ ] Dialog `<ArchiveCompanyDialog />` :
  - Avertissement explicite (voir specs UX ci-dessous)
  - Si 409 retour : afficher la liste des blockers (X licences actives, Y paiements, etc.) + bouton "Comprendre" qui redirige vers `/empresas/[id]/obligations`
- [ ] Après succès : redirect `/empresas` avec toast success
- [ ] Si `archived_at IS NOT NULL` ET role admin : afficher bouton "Restaurar" (audit log entry)
- [ ] Si `archived_at IS NOT NULL` ET role citoyen : ne devrait jamais arriver côté citoyen (404 backend), mais fallback "Esta empresa fue archivada"

#### 2.3 i18n web

- [ ] `companies.archive.button`, `.title`, `.confirm`, `.warning`, `.blockers.*` × 3 langues (es/fr/en)
- [ ] `companies.unarchive.*`, `companies.hardDelete.*`

#### 2.4 Filtrage des listes web

- [ ] `/empresas/page.tsx` : par défaut `?include_archived=false` (déjà côté backend)
- [ ] `/admin/companies/page.tsx` : toggle "Mostrar archivadas" (si admin)

**Validation Phase 2** :
- [ ] tsc + ESLint web
- [ ] Test manuel : archiver une company sans licence → succès → disparaît de la liste citoyen
- [ ] Test manuel : archiver une company avec licence active → 409 + liste des blockers affichée
- [ ] Test manuel : un admin voit la company archivée dans `/admin/companies` et peut restorer

---

### Phase 3 — Mobile (~0.5j)

Le hook `useCompanyMembership` est **déjà shipped** (commit `efcb351f`). Il reste à brancher l'UI.

#### 3.1 Module `mobile/src/modules/companies/`

- [ ] Hook `useArchiveCompany()` mutation (`POST /companies/{id}/archive`)
- [ ] Service API : `companiesApi.archive(id)` dans `companies-api.ts`
- [ ] Endpoint dans `endpoints.ts` : `companies.archive: (id) => '/companies/{id}/archive'`
- [ ] Composant `<CompanyArchiveDialog />` (réutiliser le pattern `CompanyDeleteDialog` existant — afficher la liste des blockers si 409)

#### 3.2 UI `app/companies/[id].tsx`

- [ ] Réintroduire `useCompanyMembership(id, user?.id)` (déjà shipped, juste à appeler)
- [ ] Réintroduire l'import `useAuth`
- [ ] Conditionnel `{canArchive && <Menu.Item ... title={t('companies.archive.menuLabel')} />}`
- [ ] Mount `<CompanyArchiveDialog visible={archiveVisible} ... />`

#### 3.3 i18n mobile

- [ ] `companies.archive.menuLabel`, `companies.archive.dialogTitle`, `.dialogBody`, `.confirmButton`, `.cancelButton`, `.success`, `.errors.blockers`, `.errors.unknown` × 3 langues

**Validation Phase 3** :
- [ ] `tsc --noEmit` 0 erreur
- [ ] ESLint < 100 warnings
- [ ] i18n drift script
- [ ] Smoke test EAS preview Android — archiver une company test → vérifier disparition liste

---

### Phase 4 — Admin restore + audit (~1j) **OPTIONAL — peut être différé V1.1**

#### 4.1 Backend

- [ ] Vue admin `GET /admin/companies/archived` (paginée, filtres date / archived_by / reason)
- [ ] Audit log enrichi (`details` JSONB) avec snapshot pré-archive

#### 4.2 Frontend admin (web)

- [ ] Page `/admin/companies/archived` avec liste + filters
- [ ] Bouton "Restaurar" (POST /unarchive)
- [ ] Bouton "Eliminar definitivamente" (POST /hard-delete) — confirmation double
- [ ] Audit trail visible

---

## 3. SPÉCIFICATIONS UX

### 3.1 Dialog d'archive — texte

**Titre** : "Archivar esta empresa"

**Corps** :
> Esta empresa será archivada. Ya no aparecerá en tu lista de empresas y no podrás iniciar nuevos trámites para ella.
>
> **Esto NO es una eliminación :**
> - Los registros (licencias, pagos, recibos) quedan conservados conforme a la ley fiscal.
> - Un administrador puede restaurarla en cualquier momento.
> - Los miembros de la empresa pierden el acceso.
>
> ¿Quieres continuar?

**Bouton confirm** : "Sí, archivar"
**Bouton cancel** : "Cancelar"

### 3.2 Dialog blockers (409)

**Titre** : "No se puede archivar"

**Corps** :
> Esta empresa no puede ser archivada porque tiene actividades en curso :
> - {{count_licenses}} licencia(s) activa(s)
> - {{count_payments}} pago(s) en proceso
> - {{count_requests}} solicitud(es) abierta(s)
> - {{count_inspections}} inspección(es) en curso
>
> Resuelve estas actividades antes de archivar.

**Bouton** : "Ver mis obligaciones" (deep-link vers `/companies/[id]?tab=obligations`)

---

## 4. CRITÈRES DE VALIDATION (DoD du plan)

| # | Critère | Mesure |
|---|---------|--------|
| V1 | Migration SQL appliquée sur staging | `psql \d+ companies` |
| V2 | 3 endpoints `/archive`, `/unarchive`, modifié `DELETE` | Curl staging |
| V3 | 4 protections (licenses, payments, SR, inspections) renvoient 409 avec liste blockers | Tests pytest + curl |
| V4 | Citizen lists masquent les archived | Tests pytest |
| V5 | Web UI bouton "Archivar" + dialog | Test manuel |
| V6 | Mobile UI bouton "Archivar" + dialog | Smoke test EAS preview |
| V7 | Hook `useCompanyMembership` consommé web ET mobile | Code review |
| V8 | Audit log persisté pour chaque archive/unarchive | `SELECT * FROM audit_logs WHERE entity_type='company'` |
| V9 | DELETE backend hard-delete uniquement avec `company.hard_delete` permission | Test pytest 403 |
| V10 | i18n 3 langues couvertes | Script drift = 0 |
| V11 | tsc + ESLint OK web + mobile | CI vert |
| V12 | Auto-critique livrée + commits sémantiques | Git log |

---

## 5. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Migration backward-incompatible (downgrade Cloud Run pendant rollout) | FAIBLE | MOYEN | Migration purement additive (3 colonnes nullable, pas de DROP). Code backend gère `archived_at IS NULL` comme legacy = "active". |
| Permission `company.hard_delete` pas seedée → admins ne peuvent plus delete | MOYENNE | MOYEN | Seed dans la migration + test pytest end-to-end avant deploy. |
| Companies déjà créées avec `is_active=false` (= legacy) confondues avec archived | FAIBLE | FAIBLE | Migration documente la sémantique : `is_active=false AND archived_at IS NULL` = legacy disabled, `archived_at IS NOT NULL` = soft-archived. Filtrage citoyen utilise `archived_at IS NULL` (pas `is_active`) pour rester strict. |
| 409 dialog trop verbose si beaucoup de blockers | FAIBLE | FAIBLE | Tronquer à top 3 par catégorie, "y X autres..." |
| Cron auto-archive futur (inactif > 2 ans) trop agressif | FAIBLE | MOYEN | Pas implémenté V1, juste documenté dans le plan. Quand on l'ajoute, exiger validation manuelle pour les premières runs. |
| Mobile EAS preview indisponible (pas de credentials utilisateur sous la main) | MOYENNE | FAIBLE | Validation web uniquement V1, smoke mobile reporté Phase 10. |

---

## 6. HORS SCOPE V1 (reportés)

1. **Cron auto-archive** entreprises inactives 2+ ans (besoin métier à valider).
2. **Recovery user-side** : citoyen demande restore par ticket support → admin manuel.
3. **Bulk archive** côté admin (UI multi-sélection).
4. **Notifications email** archive/unarchive (peut être ajouté plus tard via communication templates).
5. **Anonymisation RGPD** des champs PII si demande explicite (NIF, representante_legal, email) — autre flow, pas archive.

---

## 7. ORDRE D'EXÉCUTION RECOMMANDÉ

1. **Phase 1.1 + 1.2** — Migration SQL + repository (push backend isolé pour valider CI vert)
2. **Phase 1.3 + 1.4 + 1.5** — Service + routes + filtrage (push backend final)
3. **Phase 3** — Mobile (push isolé pour valider App users + EAS preview tests)
4. **Phase 2** — Web (push isolé)
5. **Phase 4** — Admin (push final ou différé V1.1 selon agenda)

À chaque phase :
- Commits locaux sémantiques par sous-tâche
- Auto-critique avant push (mémoire #14)
- Demande confirmation utilisateur explicite (mémoire #13)
- CI GitHub Actions vert avant phase suivante (règle critique CLAUDE.md)

---

## 8. INTERACTIONS AVEC LES AUTRES PLANS

- **`MOBILE_USER_PHASE_9_DETAILED.md`** : aucune interférence (P9 OWASP / observabilité orthogonal).
- **`MOBILE_USER_PARITY_AUDIT_2026_04_28.md`** : ce plan résout `SOFT-DELETE` et `WEB-PARITY-MEMBERSHIP` listés en gaps restants.
- **`MOBILE_USER_MIGRATION_MASTER_PLAN.md`** : ce plan est une **dépendance soft pour Phase 10** (E2E + App Stores). Pas bloquant techniquement, mais souhaitable pour livrer une expérience citoyen safe.

---

## 9. CHANGELOG

- **2026-04-28 v1.0** — création post-push C1→C6 mobile parity. Approuvé par l'utilisateur.
