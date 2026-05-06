# Phase 7 — Endpoints restants à scoper par entité (hors-scope Phase 1-6)
**Date** : 2026-05-06
**Suite logique de** : `TESORO_BUGS_MASTER_PLAN_2026_05_06.md`
**Demande user** : "planifie et traite les hors scope vu que ils relèvent toujours du même problème"

## Contexte

Les endpoints suivants ont été identifiés en Phase 4 (audit `/treasury/*`) comme NON scopés par entité (colonne TESORO=NO + entity_code=NO + tctx=NO + authz=NO). Ils relèvent tous du même Bug 1 racine : un supervisor d'une entité voit potentiellement les données des autres entités.

| # | Endpoint | Méthode | Risque | Notes |
|---|----------|---------|--------|-------|
| 1 | `/treasury/exports` | GET | Moyen | Liste les exports — fuite des exports d'autres entités |
| 2 | `/treasury/exports/templates` | GET | Faible | Catalogue des templates — probablement global légitime |
| 3 | `/treasury/exports/generate` | POST | Élevé | Génère un export — peut produire un export contenant données autres entités |
| 4 | `/treasury/exports/{export_id}` | GET | Moyen | Détail d'un export par ID — risque si IDs prévisibles |
| 5 | `/treasury/exports/{export_id}/download` | GET | Élevé | Download du fichier — fuite de données réelles |
| 6 | `/treasury/payments/{payment_id}` | GET | Moyen | Détail payment — par ID donc accès direct |
| 7 | `/treasury/payments/{payment_id}/audit` | GET | Moyen | Historique audit d'un payment — par ID |
| 8 | `/treasury/payments/{payment_id}/reassign` | POST | Élevé | Réassigne — sécurité critique |
| 9 | `/treasury/batch/{batch_id}/validate` | POST | Élevé | Validation batch — sécurité critique |
| 10 | `/treasury/payment-methods` (GET/POST/PUT/DELETE/PATCH) | Multi | Faible | Catalogue payment methods global légitime ? À confirmer |
| 11 | `/treasury/anomalies/{anomaly_id}` (GET/PATCH/POST) | Multi | Moyen | Détail anomalie par ID |
| 12 | `/treasury/anomalies/detect` | POST | Élevé | Détection — peut détecter sur d'autres entités |
| 13 | `/treasury/reconciliation/suggestions` | GET | Moyen | Suggestions reconciliation |
| 14 | `/treasury/reconciliation/auto-match` | POST | Élevé | Auto-match — sécurité |
| 15 | `/treasury/analyst/ask` | POST | ✓ Déjà fixé indirectement | Via `treasury_analyst_service.py` (sub-agent #2 en cours) |
| 16 | `/treasury/analyst/briefing` | GET | ✓ Idem |
| 17 | `/treasury/analyst/export` | POST | ✓ Idem |
| 18 | `/treasury/analytics/statistics` `correlations` `trends` `anomalies` `predictions` `report` `explore` | GET | ✓ Déjà fixé indirectement | Via `treasury_analytics.py` (sub-agent #2 en cours) |

## Stratégie de fix

Tous les endpoints partagent le même pattern de scoping. Solution unifiée :

### Pattern par défaut
```python
tctx = await _get_treasury_context(db, current_user.id)
target_entity_code = (
    None if tctx.has_global_scope or not tctx.entity_code
    else tctx.entity_code
)
```

### Catégorie A : Endpoints LIST/QUERY (filtre WHERE)
Pour : `/treasury/exports` (GET), `/treasury/anomalies/detect`, `/treasury/reconciliation/suggestions`
**Action** : ajouter clause WHERE conditionnelle paramétrée comme déjà fait Phase 3-4.

### Catégorie B : Endpoints PAR-ID (vérification ownership)
Pour : `/treasury/payments/{id}`, `/treasury/payments/{id}/audit`, `/treasury/exports/{id}`, `/treasury/anomalies/{id}`, `/treasury/payments/{id}/reassign`, `/treasury/batch/{id}/validate`
**Action** : avant toute action, fetch la ressource et vérifier que `resource.entity_code == target_entity_code` (si scope strict). Sinon 403 Forbidden. Pattern déjà existant dans `_authorize_payment_action` du fichier.

### Catégorie C : Catalogues GLOBAUX légitimes
Pour : `/treasury/payment-methods/*`, `/treasury/exports/templates`
**Action** : pas de scoping (catalogue système commun).

### Catégorie D : Mutations sensibles (POST/PATCH/PUT/DELETE)
Pour : `/treasury/exports/generate`, `/treasury/reconciliation/auto-match`, `/treasury/anomalies` (POST), `/treasury/anomalies/{id}` (PATCH/POST), `/treasury/payment-methods` (POST/PUT/DELETE/PATCH)
**Action** : double check — input validé contre le scope du caller AVANT exécution. Si l'input concerne une autre entité, 403.

## Plan détaillé Phase 7

### 7.A — Lister tous les endpoints à fixer (≤ 10 min)
Script Python pour générer la liste exhaustive depuis `admin_routes.py` avec leur catégorie A/B/C/D.

### 7.B — Fix Catégorie A (LIST/QUERY) — endpoints visibles dans menus
Endpoints prioritaires :
- `/treasury/exports` (GET liste) → SQL filter
- `/treasury/reconciliation/suggestions` (GET liste) → SQL filter
- `/treasury/anomalies/detect` (POST détection) → input scope + SQL filter

### 7.C — Fix Catégorie B (PAR-ID) — sécurité critique
Tous les endpoints `{id}` qui touchent payments/exports/anomalies. Utiliser `_authorize_payment_action` existant ou créer `_authorize_export_action` / `_authorize_anomaly_action` similaires.

Pattern :
```python
async def _authorize_export_action(db, tctx, export_id):
    row = await db.fetchrow(
        "SELECT entity_code FROM treasury_exports WHERE id = $1",
        export_id
    )
    if not row:
        raise HTTPException(404, "Export not found")
    if not tctx.has_global_scope and row['entity_code'] != tctx.entity_code:
        raise HTTPException(403, "Export belongs to another entity")
```

### 7.D — Fix Catégorie D (mutations) — input validation
Les mutations qui acceptent un `entity_code` ou `payment_id` en body/path doivent vérifier que l'input correspond au scope. Pattern unifié.

### 7.E — Tests fonctionnels (manuels post-deploy)
- Login `tesoreria.ge` (TESORO supervisor) → essayer `/treasury/exports` → ne voir que TESORO exports
- Login `supayuntamiento1` (AYUNTAMIENTO) → essayer `/treasury/exports` → ne voir que AYUNTAMIENTO exports
- Login admin (`treasury.view_all`) → voir tous les exports

## Checklist Phase 7

- [ ] 7.A.1 Lister tous les endpoints sans scope entity (audit Python)
- [ ] 7.A.2 Catégoriser A/B/C/D
- [ ] 7.B.1 Fix `/treasury/exports` (GET liste)
- [ ] 7.B.2 Fix `/treasury/exports/generate` (POST)
- [ ] 7.B.3 Fix `/treasury/exports/{id}` (GET détail)
- [ ] 7.B.4 Fix `/treasury/exports/{id}/download` (GET fichier)
- [ ] 7.B.5 Fix `/treasury/reconciliation/suggestions` (GET)
- [ ] 7.B.6 Fix `/treasury/reconciliation/auto-match` (POST)
- [ ] 7.B.7 Fix `/treasury/anomalies/detect` (POST)
- [ ] 7.C.1 Fix `/treasury/payments/{id}` (GET) — vérifier authz
- [ ] 7.C.2 Fix `/treasury/payments/{id}/audit` (GET) — vérifier authz
- [ ] 7.C.3 Fix `/treasury/payments/{id}/reassign` (POST) — vérifier authz
- [ ] 7.C.4 Fix `/treasury/batch/{id}/validate` (POST) — vérifier authz
- [ ] 7.C.5 Fix `/treasury/anomalies/{id}` * (GET/PATCH/POST) — vérifier authz
- [ ] 7.D.1 Compile-check Python tous fichiers modifiés
- [ ] 7.D.2 Critique honnête de la phase (gaps documentés)
- [ ] 7.D.3 Commit local sémantique

## Risques

1. **Migration des données existantes** : si certains exports ou anomalies en BD n'ont pas leur `entity_code` correctement renseigné (legacy), le filtre les exclura. À vérifier avec SELECT distinct.
2. **Régression sur les supervisors globaux** : doivent continuer à voir tout. `target_entity_code is None` garantit ce comportement.
3. **Authz 403 → UX** : le frontend doit gérer correctement ces 403 (toast informatif au lieu de page blanche). À valider.
4. **Performance** : certains endpoints scannent des tables de millions de rows. Vérifier que les filtres EXISTS / entity_code utilisent bien des indexes existants.

## Hors scope Phase 7 (à reporter Phase 8+)

- Refactor `treasury_analyst_service.py` pour propager `_entity_code` dynamiquement via kwargs (sub-agent #2 en cours peut le faire, sinon Phase 8).
- Audit complet des autres modules (`/api/v1/inspection/*`, `/api/v1/oms/*`) qui peuvent avoir le même bug. Hors scope car non rapporté par user.
- Pages frontend qui affichent les exports / anomalies — vérifier qu'elles n'ont pas de hardcoded TESORO en frontend.
