# Plan — Admin Empresas Alignment & Licence Lifecycle

## Contexte

Audit complet du module Admin Empresas révèle 6 problèmes. Ce plan les corrige
par phases de risque croissant, en respectant les règles métier du bundle workflow.

## Architecture métier (rappel)

```
Citoyen → Bundle Workflow → Crée company + licence + obligations
                                    ↓
Agents OMS → Traitent obligations (1 par 1, scoped par entité/ministère)
                                    ↓
Auto-completion → Toutes obligations completed → licence.status = "complete"
                                    ↓
PDF auto-généré + email citoyen → Licence commerciale valide
                                    ↓
Fin année fiscale → Admin lance "Renovar" batch → Nouveau dossier N+1
```

**Règle d'or** : la licence n'est PAS créée manuellement. Elle est le RÉSULTAT
du bundle workflow. Les superviseurs TRAITENT, ils ne CRÉENT PAS.

## Données BD actuelles (2026-04-20)

- 62 companies (toutes actives, 48 vérifiées, 14 non-vérifiées)
- 62 licences (60 open, 2 partial, 0 complete)
- 521 obligations (496 pending, 17 payment_pending, 4 completed, 4 processing)
- 10 types de commerce × 9 zones utilisées (D2, D3 sans entreprises)
- MV dashboard gelée depuis 2026-03-20 (1 mois de retard)

---

## Phase 1 — Fix données dashboard + config rules 500 (CRITIQUE)

### P1.1 — Supprimer la dépendance MV, passer en queries live + cache Redis

**Problème** : `mv_company_global_stats` non rafraîchie depuis 1 mois. Les données
affichées sont fausses (50 au lieu de 62 entreprises).

**Solution** : remplacer le fallback MV par une query live cachée 60s en Redis.
Supprimer la dépendance au cron.

**Fichiers** :
- `packages/backend/app/modules/companies/api/company_dashboard_routes.py`
  - `get_global_stats()` : supprimer le check `_mv_exists`, toujours faire la query live
  - Wrapper Redis `get_cache().get("company_global_stats")` avec TTL 60s
  - Si cache hit → return. Sinon → query live → cache → return.
- Idem pour `get_zone_stats()` et `get_analytics()`

**Validation** :
- [ ] Endpoint retourne 62 (pas 50)
- [ ] Response < 500ms avec cache
- [ ] Refresh automatique après 60s
- [ ] Dashboard affiche les vrais chiffres

### P1.2 — Fix "Cobertura Zona" calcul

**Problème** : affiche "100%" mais seulement 9/12 zones ont des entreprises.

**Fichier** : `company_dashboard_routes.py` → vérifier la formule. "Cobertura"
devrait être `zones_with_companies / total_zones * 100`.

**Validation** :
- [ ] Affiche 75% (9/12) au lieu de 100%

### P1.3 — Fix config rules 500 error

**Problème** : route `PUT /config-rules/{id}` catch seulement `ValueError`.
Les erreurs DB (trigger `trg_auto_recompute_config`) ne sont pas catchées.

**Fichiers** :
- `packages/backend/app/modules/fiscal_services/api/config_rules_routes.py`
  - Ajouter `except Exception as e:` avec logging + 422/500 structuré
- `packages/backend/app/modules/fiscal_services/repositories/config_rules_repository.py`
  - Wrapper try/except sur `conn.fetchrow()` dans `update_rule()`

**Validation** :
- [ ] Toggle is_enabled ne retourne plus 500
- [ ] Pénalités désactivables (is_enabled = false)
- [ ] Erreurs DB remontées avec message utile

### Checklist Phase 1
- [ ] P1.1 : queries live + cache Redis 60s
- [ ] P1.2 : cobertura calcul corrigé
- [ ] P1.3 : config rules error handling
- [ ] Tests backend passent
- [ ] Type-check frontend
- [ ] Commit local

---

## Phase 2 — Formulaire création manuelle entreprise (MOYEN)

### P2.1 — Backend: endpoint POST /companies/admin/create

**Problème** : l'admin ne peut créer une entreprise que par CSV. Pas de formulaire.

**Endpoint** : `POST /api/v1/companies/admin/create`
- Permission : `company.manage`
- Payload : `{ legal_name, nif, commerce_type, zone_code, forma_juridica, ... }`
- Logique :
  1. Valider NIF unicité
  2. Résoudre zone_code → zone_id
  3. Valider commerce_type existe dans service_bundles
  4. INSERT companies
  5. Auto-créer licence (fiscal_year = current year)
  6. Auto-générer obligations depuis bundle items pour la zone
  7. Log audit `company_created_admin`

**Fichiers** :
- `packages/backend/app/modules/companies/api/company_routes.py` — nouveau endpoint
- `packages/backend/app/modules/companies/models/` — CreateCompanyAdminRequest

### P2.2 — Frontend: dialog création dans Gestión de Empresas

**Fichier** : `packages/web/src/app/[locale]/(dashboard)/dashboard/admin/companies/page.tsx`
- Bouton "Nueva Empresa" → Dialog avec formulaire
- Champs : legal_name*, NIF*, commerce_type* (select depuis bundles), zone* (select depuis zones), forma_juridica, etc.
- Après création : redirect vers détail + toast success
- Badge "Creado manualmente" vs "Creado por workflow"

### Checklist Phase 2
- [ ] Endpoint POST create avec auto-licence + auto-obligations
- [ ] Frontend dialog avec validation
- [ ] NIF dupliqué → message explicite
- [ ] Commerce type validé contre service_bundles
- [ ] Badge source (manual vs workflow)
- [ ] Commit local

---

## Phase 3 — Guards métier + badges automatiques (HAUT)

### P3.1 — Guards sur transitions de licence

**Règles métier à implémenter** :

| Action | Condition | Guard |
|--------|-----------|-------|
| Suspender | licence `complete` | BLOQUÉ — licence conforme, pas suspendable |
| Suspender | licence `open/partial/overdue` | AUTORISÉ — non-paiement, fraude, inspection |
| Cerrar | licence `complete` | AUTORISÉ — avec confirmation "Cette action est irréversible" |
| Cerrar | licence avec obligations `processing` | BLOQUÉ — attendre fin traitement agents |
| Renovar | licence PAS `complete` | BLOQUÉ — "Toutes les obligations doivent être payées" |
| Renovar | année N+1 déjà existante | BLOQUÉ — "Licence 2027 déjà créée" |

**Fichiers** :
- `packages/backend/app/modules/fiscal_services/api/license_routes.py`
  - PUT status : ajouter guards dans la map `admin_transitions`
  - POST renew : vérifier licence complete + pas de doublon fiscal_year
- `packages/backend/app/modules/fiscal_services/services/license_service.py`
  - `validate_transition(license, target_status)` → raise ValueError avec message i18n

### P3.2 — Badges de validation automatique

**Concept** : quand le système valide automatiquement une transition, afficher
un badge "Validación automática" distinct des actions manuelles.

- `license_compliance_events.triggered_by` : `"system_auto"` vs `"agent_manual"` vs `"admin"`
- Frontend : badge vert "Auto" pour events system_auto, badge bleu "Agent" pour manual

**Fichiers** :
- `license_service.py` → `update_license_counters()` : ajouter `triggered_by="system_auto"` dans l'event log
- Frontend licence détail : afficher badges sur l'historique

### P3.3 — Amélioration CSV import (zone_code, auto-licence)

**Améliorer l'import CSV existant** :
- Accepter `zone_code` (A1, B2, etc.) au lieu de UUID
- Auto-calculer `regimen_fiscal` = 'bundle' (toujours pour les entreprises bundle)
- Après approbation draft : auto-créer licence + obligations (comme P2.1)

**Fichier** : `company_classification_routes.py` → `import_csv` endpoint

### Checklist Phase 3
- [ ] Guards sur toutes les transitions (6 règles)
- [ ] Messages d'erreur i18n (es/fr/en)
- [ ] Badges auto/manual/admin dans l'historique
- [ ] CSV import avec zone_code + auto-licence
- [ ] Commit local

---

## Phase 4 — Accès superviseur OMS aux licences (MOYEN)

### P4.1 — Permissions scoped pour superviseurs OMS

**Principe** : le superviseur OMS voit les licences qui ont des obligations
pour SON entité. Il ne gère PAS la licence globalement.

**Nouvelles permissions** :
- `license.view_scoped` — voir licences avec obligations dans son scope
- `license.recommend_suspension` — recommander (pas exécuter) une suspension

**Fichiers** :
- `packages/backend/app/modules/permissions/module_permissions/fiscal_service_permissions.py`
  - Ajouter `license.view_scoped` aux rôles superviseur OMS
- `packages/backend/app/modules/fiscal_services/api/license_routes.py`
  - Nouveau endpoint `GET /licenses/my-scope` — filtre par ministry_id du superviseur

### P4.2 — Vue licence dans le dashboard superviseur OMS

**Fichier frontend** : page superviseur OMS → nouvel onglet "Licencias"
- Liste des licences avec obligations dans SON scope
- Pour chaque licence : obligations de SON entité seulement
- Compliance score partiel (pour son entité)
- Bouton "Recommander suspension" → crée un ticket admin (pas de suspension directe)

### P4.3 — Workflow de suspension scoped

**Flux** :
1. Superviseur clique "Recommander suspension" avec motif
2. Crée `license_suspension_requests` (nouvelle table)
3. Admin reçoit notification
4. Admin approuve/rejette dans Licencias Comerciales
5. Si approuvé → suspension effective + notification citoyen

**Pourquoi ce flux** : un superviseur TESORO ne devrait pas suspendre une licence
qui a des obligations AYUNTAMIENTO en cours de traitement par un autre superviseur.
La suspension est une action transversale qui nécessite la vue globale de l'admin.

### Checklist Phase 4
- [ ] Permissions scoped ajoutées
- [ ] Endpoint my-scope avec filtre ministry_id
- [ ] Vue licence dans dashboard superviseur OMS
- [ ] Workflow recommandation → approbation admin
- [ ] Notifications admin + citoyen
- [ ] Commit local

---

## Phase 5 — Rénovation batch fin d'année + alertes (MOYEN)

### P5.1 — Rénovation batch automatique

**Concept** : en fin d'année fiscale, l'admin lance un batch de rénovation
pour TOUTES les licences complètes.

**Endpoint** : `POST /api/v1/licenses/admin/renew-batch`
- Filtre : `status = 'complete' AND fiscal_year = current_year`
- Pour chaque licence : créer licence N+1 avec nouvelles obligations
- Log audit avec compteur (succès/échecs/skippées)
- Rapport CSV téléchargeable

### P5.2 — Alertes automatiques pré-rénovation

- J-30 avant deadline : alerte admin "X licences à renouveler"
- J-15 : email aux entreprises avec obligations non payées
- J-1 : notification urgente aux superviseurs OMS

### P5.3 — Colonne "Código" optionnelle dans Bundles

- Toggle column visibility dans la page Bundles Comerciales
- Remplacer par code ministère (T/M/C) si masqué

### Checklist Phase 5
- [ ] Batch renewal endpoint + rapport
- [ ] Alertes pré-deadline (J-30, J-15, J-1)
- [ ] Colonne código toggle
- [ ] Commit local

---

## Hors scope

- Import document certificado_padron batch (OCR trop lent, CSV suffit)
- Création licence par superviseur (contraire au flux métier)
- Rénovation individuelle par superviseur (action admin/batch)

## Risques

| Risque | Mitigation |
|--------|-----------|
| Suppression MV casse le cron existant | Garder la MV, mais l'ignorer côté API |
| Guards bloquent des actions admin légitimes | Bouton "Forcer" avec log audit |
| Supervisor scope mal calculé | Réutiliser `resolve_agent_context()` existant |
| Batch renewal crée des doublons | Guard `fiscal_year + company_id` unique |
