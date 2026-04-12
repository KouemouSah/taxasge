# PLAN DÉTAILLÉ — Phase 2 : Exclusion expiration bundle + cron auto + config externalisée

**Date** : 2026-04-11
**Parent plan** : `.claude/plans/INSPECTION_BUNDLE_PAYMENT_FIX_PLAN.md` (plan général)
**Prérequis** : Phase 1 terminée (commit `c34f9c52` local, migration 291 appliquée)
**Statut** : À VALIDER avant implémentation

---

## 0. ÉTAT ACTUEL (vérifié 2026-04-11, post-P1)

### 0.1 Code existant

**`cleanup_abandoned_requests`** — `packages/backend/app/modules/service_requests/services/service_request_service.py:734-827`

Query problématique ligne 768-774 :
```python
query = """
    SELECT sr.id, sr.reference, sr.user_id, sr.created_at
    FROM service_requests sr
    WHERE sr.status = 'DRAFT'
      AND sr.created_at < $1
    ORDER BY sr.created_at ASC
"""
```

**Problèmes confirmés** :
- **B8** : Aucun filtre sur `workflow_code` ni `commercial_license_id` → tout SR bundle en DRAFT serait supprimé avec ses documents Firebase
- **B9** : Appelée uniquement par l'endpoint admin manuel `POST /api/v1/admin/maintenance/cleanup-abandoned` (permission `admin.manage_system`) — **aucun cron automatique**
- **B10** : `max_age_hours=2` hardcodé dans la signature (ligne 737), aussi dans le Query param de l'endpoint admin (ligne 2954)

**Autres hardcodés associés** (révélés par P1) :
- `PREVIEW_EXPIRY_MINUTES = 30` (ligne 62, module scope)
- `WIZARD_SESSION_TTL_SECONDS = 1800` (`wizard_session_service.py:58`)

### 0.2 Cron infrastructure existante (vérifié)

- **Router** : `packages/backend/app/modules/service_requests/api/cron_routes.py`
- **Prefix** : `/cron` → endpoints sont à `/api/v1/cron/*`
- **Auth** : `Depends(verify_cron_auth)` de `app/core/cron_auth.py` — header `X-Cron-Secret`, fail-closed
- **Endpoints existants** : `/appointment-reminders`, `/cleanup-expired-holds`, `/cleanup-permission-audit-log`, plus SLA jobs
- **Pattern standard** : `async def ... (db: asyncpg.Connection = Depends(get_database), _auth: bool = Depends(verify_cron_auth))`

### 0.3 Config Settings pattern

- **Fichier** : `packages/backend/app/config.py`, classe `Settings(BaseSettings)` Pydantic v1 style
- **Pattern** : `FIELD_NAME: type = Field(default=..., env="ENV_VAR_NAME")`
- Pas de section dédiée "Cleanup" — à créer

### 0.4 État BD (vérifié post-P1)

- **0 DRAFT** actuellement → cron en dry-run sans risque
- **0 SR avec `commercial_license_id`** → le filtre d'exclusion ne supprime aucune donnée aujourd'hui
- **12 SR tous en `source='citizen_wizard'`** (default appliqué par migration 291)

---

## 1. OBJECTIFS P2

1. **Protéger les dossiers bundle** : le cleanup ne doit JAMAIS toucher `workflow_code IN ('BUNDLE_PAYMENT', 'FIELD_INSPECTION')` ni `commercial_license_id IS NOT NULL`
2. **Automatiser** : créer cron endpoint `POST /cron/cleanup-abandoned-requests` avec `verify_cron_auth`
3. **Externaliser** toutes les valeurs hardcodées (`DRAFT_CLEANUP_MAX_HOURS`, `PREVIEW_EXPIRY_MINUTES`, `WIZARD_SESSION_TTL_SECONDS`)
4. **Observabilité** : logger séparément `deleted_count` vs `skipped_bundle_count` (prépare P5)
5. **Tests** : regression 0 suppression de bundle DRAFT + paramétrage config fonctionnel
6. **Zéro régression** sur l'endpoint admin manuel (il doit continuer à marcher)

---

## 2. DÉCISIONS EXPERT VALIDÉES

### D1 — Règle d'exclusion : triple garde-fou

```sql
AND sr.workflow_code NOT IN ('BUNDLE_PAYMENT', 'FIELD_INSPECTION')
AND sr.source NOT IN ('field_inspection', 'admin_import')
AND sr.commercial_license_id IS NULL
```

**Justification** :
- **Exclusion par `workflow_code`** : couvre les cas où un SR bundle serait créé sans passer par la migration 291 (legacy)
- **Exclusion par `source`** : catch les imports admin et field inspections
- **Exclusion par `commercial_license_id`** : source de vérité ultime (si un SR est lié à une licence, il ne peut jamais être supprimé par cleanup)

Les 3 conditions sont ET (**AND**) — n'importe laquelle qui match protège le SR. Défense en profondeur : si une colonne est corrompue, les 2 autres compensent.

### D2 — Fréquence cron

**Horaire** (`0 * * * *`) — aligné avec les autres crons du projet et les SLA :
- Suffisamment réactif pour éviter l'accumulation de DRAFT
- Volume prod actuel = 0 DRAFT, donc pas de contention
- 24 exécutions/jour → monitoring clair dans logs
- Alternative quotidienne rejetée : risque que les utilisateurs voient des DRAFT orphelins s'ils reprennent après 6h

Le script Cloud Scheduler sera configuré séparément par l'utilisateur (hors scope code P2) — on livre juste l'endpoint HTTP.

### D3 — Configuration Settings à externaliser

Nouvelle section `Cleanup & Expiration` dans `app/config.py` :

```python
# ========================================================================
# CLEANUP & EXPIRATION
# ========================================================================

# DRAFT service_requests cleanup (normal requests only, bundle excluded)
DRAFT_CLEANUP_MAX_HOURS: int = Field(default=2, env="DRAFT_CLEANUP_MAX_HOURS")

# Gemini extraction preview cache TTL
PREVIEW_EXPIRY_MINUTES: int = Field(default=30, env="PREVIEW_EXPIRY_MINUTES")

# Wizard session TTL (Redis cache)
WIZARD_SESSION_TTL_SECONDS: int = Field(default=1800, env="WIZARD_SESSION_TTL_SECONDS")
```

**Why** : les 3 valeurs sont liées à l'expiration utilisateur et doivent être ajustables par env sans redeploy (règle "ne rien hardcoder" + "1M+ utilisateurs, ajustement runtime").

**Refactor minimal** : les modules `service_request_service.py` et `wizard_session_service.py` lisent `settings.X` au lieu des constantes module-scope. Valeurs par défaut inchangées → zéro impact comportemental.

### D4 — Return stats enrichies

La fonction `cleanup_abandoned_requests` doit retourner :
```python
{
    "deleted_requests": int,      # Actuels: DRAFT supprimés
    "deleted_documents": int,     # Actuels
    "deleted_files": int,         # Actuels
    "skipped_bundle": int,        # NOUVEAU: nombre de bundle DRAFT trouvés et protégés
    "errors": List[str],          # Actuels
    "max_age_hours": int,         # NOUVEAU: valeur effective utilisée (traçabilité config)
}
```

Le compteur `skipped_bundle` doit **toujours rester à 0 en prod** — si > 0, c'est le signe qu'un bundle DRAFT s'est accumulé, ce qui ne devrait jamais arriver avec P1 (les bundles passent directement à `SUBMITTED` via `CollectionService`). Cette métrique servira d'alerte en P5.

### D5 — Garde-fou ultime (belt and suspenders)

Même si le code filtre, on ajoute une **safety query** qui vérifie qu'aucune licence n'est liée aux IDs candidats avant DELETE :

```python
# Before DELETE: verify none of the IDs is linked to a commercial_license
safety_check = await db.fetchval(
    """
    SELECT COUNT(*) FROM commercial_licenses
    WHERE service_request_id = ANY($1::uuid[])
    """,
    [r["id"] for r in abandoned_requests],
)
if safety_check > 0:
    raise RuntimeError(
        f"Cleanup safety check FAILED: {safety_check} licenses reference these SRs. "
        "Aborting to prevent data loss."
    )
```

Cette vérification est **paranoïaque** : elle ne coûte qu'une query supplémentaire et évite tout drame en cas de bug dans la query de filtrage.

### D6 — Transaction atomique par SR

Le loop actuel fait DELETE document → DELETE Firebase → DELETE SR dans un try/except qui peut laisser des états partiels (Firebase supprimé, SR non supprimée). Pas en scope P2 (refactor lourd), mais **documenté comme dette P5**.

---

## 3. ARCHITECTURE CIBLE

### 3.1 Flow cible `cleanup_abandoned_requests`

```
async def cleanup_abandoned_requests(db, max_age_hours=None):
    settings = get_settings()
    effective_hours = max_age_hours or settings.DRAFT_CLEANUP_MAX_HOURS
    cutoff = datetime.utcnow() - timedelta(hours=effective_hours)

    # Query 1: Find bundle DRAFTs (for metrics/logging, not deleted)
    bundle_candidates = await db.fetch("""
        SELECT COUNT(*) FROM service_requests
        WHERE status = 'DRAFT' AND created_at < $1
          AND (
              workflow_code IN ('BUNDLE_PAYMENT', 'FIELD_INSPECTION')
              OR source IN ('field_inspection', 'admin_import')
              OR commercial_license_id IS NOT NULL
          )
    """, cutoff)
    skipped_bundle = bundle_candidates[0][0]

    # Query 2: Find abandoned non-bundle DRAFTs
    abandoned = await db.fetch("""
        SELECT sr.id, sr.reference, sr.user_id, sr.created_at
        FROM service_requests sr
        WHERE sr.status = 'DRAFT'
          AND sr.created_at < $1
          AND sr.workflow_code NOT IN ('BUNDLE_PAYMENT', 'FIELD_INSPECTION')
          AND sr.source NOT IN ('field_inspection', 'admin_import')
          AND sr.commercial_license_id IS NULL
        ORDER BY sr.created_at ASC
    """, cutoff)

    # Safety check (D5): verify none are linked to a license
    if abandoned:
        ids = [r["id"] for r in abandoned]
        safety_count = await db.fetchval(
            "SELECT COUNT(*) FROM commercial_licenses WHERE service_request_id = ANY($1::uuid[])",
            ids,
        )
        if safety_count > 0:
            raise RuntimeError(
                f"Cleanup safety check FAILED: {safety_count} linked licenses found. Aborting."
            )

    # Loop DELETE documents + Firebase + SR (unchanged)
    ...

    return {
        "deleted_requests": ...,
        "deleted_documents": ...,
        "deleted_files": ...,
        "skipped_bundle": skipped_bundle,
        "errors": [...],
        "max_age_hours": effective_hours,
    }
```

### 3.2 Nouveau cron endpoint

```python
@router.post(
    "/cleanup-abandoned-requests",
    summary="Cleanup abandoned DRAFT service requests (bundle excluded)",
    description="""
    Called hourly by Cloud Scheduler to delete abandoned DRAFT requests.

    EXCLUDES (never deleted):
    - workflow_code IN ('BUNDLE_PAYMENT', 'FIELD_INSPECTION')
    - source IN ('field_inspection', 'admin_import')
    - commercial_license_id IS NOT NULL

    These are commercial license dossiers that must remain active until
    explicitly closed.

    Uses settings.DRAFT_CLEANUP_MAX_HOURS (default 2h, env-configurable).
    """
)
async def cron_cleanup_abandoned_requests(
    db: asyncpg.Connection = Depends(get_database),
    _auth: bool = Depends(verify_cron_auth),
):
    from app.modules.service_requests.services.service_request_service import (
        service_request_service,
    )
    stats = await service_request_service.cleanup_abandoned_requests(db=db)

    logger.info(
        "Cron cleanup_abandoned_requests: deleted=%d docs=%d files=%d skipped_bundle=%d max_age_hours=%d errors=%d",
        stats["deleted_requests"], stats["deleted_documents"], stats["deleted_files"],
        stats["skipped_bundle"], stats["max_age_hours"], len(stats["errors"]),
    )

    # Anomaly alert: if skipped_bundle > 0, some bundle DRAFT accumulated
    if stats["skipped_bundle"] > 0:
        logger.warning(
            "ANOMALY: %d bundle DRAFT requests found during cleanup (should be 0 — "
            "bundles should always be in SUBMITTED/other non-DRAFT status)",
            stats["skipped_bundle"],
        )

    return stats
```

---

## 4. CHECKLIST P2

### P2.A — Correction query cleanup

- [x] P2.A.1 : Ouvrir `service_request_service.py:734`
- [x] P2.A.2 : Rendre `max_age_hours` `Optional[int] = None` — lire `settings.DRAFT_CLEANUP_MAX_HOURS` si None
- [x] P2.A.3 : Remplacer la query SELECT par la version filtrée (D1 triple exclusion)
- [x] P2.A.4 : Ajouter query compteur `skipped_bundle` (avant la query SELECT ou en parallèle)
- [x] P2.A.5 : Ajouter safety check `commercial_licenses.service_request_id = ANY(...)` (D5) avec `raise RuntimeError` si > 0
- [x] P2.A.6 : Étendre le dict retourné avec `skipped_bundle` et `max_age_hours` (D4)
- [x] P2.A.7 : Logger final inclut `skipped_bundle=%d max_age_hours=%d`

### P2.B — Configuration externalisée

- [x] P2.B.1 : Ajouter section `Cleanup & Expiration` dans `app/config.py` (D3)
- [x] P2.B.2 : Ajouter `DRAFT_CLEANUP_MAX_HOURS: int = Field(default=2, env="DRAFT_CLEANUP_MAX_HOURS")`
- [x] P2.B.3 : Ajouter `PREVIEW_EXPIRY_MINUTES: int = Field(default=30, env="PREVIEW_EXPIRY_MINUTES")`
- [x] P2.B.4 : Ajouter `WIZARD_SESSION_TTL_SECONDS: int = Field(default=1800, env="WIZARD_SESSION_TTL_SECONDS")`
- [x] P2.B.5 : Refactor `service_request_service.py:62-63` :
  - Garder les constantes module-scope pour rétrocompatibilité (aucun casse) MAIS
  - Les initialiser depuis settings : `PREVIEW_EXPIRY_MINUTES = get_settings().PREVIEW_EXPIRY_MINUTES`
- [x] P2.B.6 : Refactor `wizard_session_service.py:58` : idem avec `WIZARD_SESSION_TTL_SECONDS`
- [x] P2.B.7 : Documenter dans `packages/backend/.env.local.example` (ou similaire) les 3 nouvelles vars

### P2.C — Nouveau cron endpoint

- [x] P2.C.1 : Ouvrir `cron_routes.py`, trouver un bon endroit (après `cleanup-expired-holds`)
- [x] P2.C.2 : Ajouter fonction `cron_cleanup_abandoned_requests` selon §3.2
- [x] P2.C.3 : Utiliser pattern standard `Depends(get_database)` + `Depends(verify_cron_auth)`
- [x] P2.C.4 : Appel `service_request_service.cleanup_abandoned_requests(db=db)` (sans override, laisse lire settings)
- [x] P2.C.5 : Logger WARNING si `skipped_bundle > 0` (anomaly alert)
- [x] P2.C.6 : Retour du dict stats directement (JSON-sérialisable)

### P2.D — Tests

Fichier : `packages/backend/tests/unit/service_requests/test_cleanup_abandoned.py`

- [x] P2.D.1 : Fixture `conn` avec outer transaction + rollback
- [x] P2.D.2 : Fixture `tmp_draft_factory` qui crée des SR DRAFT avec `workflow_code` + `created_at` custom
- [x] P2.D.3 : `test_cleanup_deletes_normal_draft_older_than_cutoff`
  - Créer SR `PASAPORTE_NUEVO` DRAFT `created_at = NOW() - 3h`
  - Appeler `cleanup_abandoned_requests(max_age_hours=2)`
  - Assert : `deleted_requests = 1`, `skipped_bundle = 0`, SR supprimée
- [x] P2.D.4 : `test_cleanup_does_not_delete_bundle_payment_draft`
  - Créer SR `BUNDLE_PAYMENT` DRAFT `created_at = NOW() - 5h` (mais via INSERT manuel car trigger bloquerait — exemption avec commercial_license_id valide)
  - Appeler cleanup
  - Assert : `skipped_bundle = 1`, SR toujours présente
- [x] P2.D.5 : `test_cleanup_does_not_delete_field_inspection_draft`
  - Idem pour `FIELD_INSPECTION`
- [x] P2.D.6 : `test_cleanup_does_not_delete_sr_with_license_linked`
  - SR workflow normal MAIS avec `commercial_license_id` défini (cas théorique)
  - Assert : pas supprimé
- [x] P2.D.7 : `test_cleanup_safety_raises_if_license_links_orphan_sr`
  - Simuler un état corrompu : SR sans filtre, mais `commercial_licenses.service_request_id = SR.id`
  - Assert : `RuntimeError` raised, aucune suppression
- [x] P2.D.8 : `test_cleanup_uses_config_default_when_max_age_none`
  - Mock `settings.DRAFT_CLEANUP_MAX_HOURS = 5`
  - Appeler sans `max_age_hours`
  - Assert : `max_age_hours` retourné = 5
- [x] P2.D.9 : `test_cleanup_respects_explicit_max_age_override`
  - Appeler avec `max_age_hours=10`
  - Assert : `max_age_hours` retourné = 10
- [x] P2.D.10 : `test_cron_endpoint_requires_auth` (requête sans X-Cron-Secret → 403)
- [x] P2.D.11 : `test_cron_endpoint_runs_successfully_with_auth` (200 + stats JSON)

### P2.E — Validation & auto-critique

- [x] P2.E.1 : Relire diff complet
- [x] P2.E.2 : Grep `PREVIEW_EXPIRY_MINUTES` et `WIZARD_SESSION_TTL_SECONDS` pour vérifier aucune référence oubliée
- [x] P2.E.3 : Lancer la suite de tests P2 : `pytest tests/unit/service_requests/test_cleanup_abandoned.py -v`
- [x] P2.E.4 : Relancer les tests P1 pour vérifier aucune régression : `pytest tests/unit/inspections/test_collection_service.py -v`
- [x] P2.E.5 : Test E2E manuel : appeler l'endpoint cron avec `curl -X POST -H "X-Cron-Secret: $SECRET"` contre staging (après déploiement)
- [x] P2.E.6 : Rédiger auto-critique dans `.claude/plans/INSPECTION_BUNDLE_P2_RETRO.md`
- [x] P2.E.7 : Commit local avec message structuré
- [x] P2.E.8 : **NE PAS PUSH** avant validation utilisateur globale (règle 14)

---

## 5. MATRICE DE RISQUES P2

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|-----------|
| Safety check (D5) faux-positif bloque le cleanup légitime | Faible | 🟡 Moyen | Log DEBUG les IDs détectés, l'exception montre le count → investigation rapide |
| `PREVIEW_EXPIRY_MINUTES` refactor casse le cache (conversion s/min) | Faible | 🟠 Haut | Tests existants sur wizard_session couvrent le TTL — vérifier avant commit |
| Cron tourne en prod avant Cloud Scheduler config → erreur 503 si CRON_SECRET absent | Faible | 🟢 Bas | Endpoint fail-closed par design, pas de risque fonctionnel |
| `get_settings()` au niveau module-scope cache une ancienne valeur en cas de hot reload | Moyenne | 🟡 Moyen | Lire `settings.X` à chaque appel de fonction (pas au module import) |
| Test P2.D.4 (bundle DRAFT) nécessite contourner le trigger P1 | Moyenne | 🟡 Moyen | Créer avec un `commercial_license_id` valide (l'état DRAFT bundle est théorique mais valide au niveau contrainte) |
| L'endpoint admin manuel devient incohérent avec le cron (2 chemins d'appel) | Faible | 🟢 Bas | Les 2 appellent la même fonction sous-jacente → garantie d'uniformité |
| Le compteur `skipped_bundle` augmente en prod → accumulation bundle DRAFT inattendue | Inconnue | 🟠 Haut | Log WARNING dans le cron → alerte manuelle. Investigation P5 si observé |

---

## 6. CRITÈRES DE PASSAGE EN P3

P2 est **DONE** quand :

- ✅ Query cleanup filtre correctement (triple exclusion)
- ✅ Safety check déclenche si état corrompu détecté
- ✅ 3 settings externalisées + lues correctement
- ✅ Cron endpoint `/cron/cleanup-abandoned-requests` opérationnel avec auth
- ✅ 11 tests P2.D passent (11/11)
- ✅ Régressions P1 non cassées (19/19 tests inspections)
- ✅ Stats enrichies (`skipped_bundle`, `max_age_hours`) présentes dans la réponse
- ✅ Plan P2 cochée à 100%
- ✅ Auto-critique écrite (`INSPECTION_BUNDLE_P2_RETRO.md`)
- ✅ Commit local créé (pas push)

---

## 7. LIVRABLES

| Livrable | Fichier |
|----------|---------|
| Refactor cleanup fonction | `packages/backend/app/modules/service_requests/services/service_request_service.py` |
| Externalisation settings | `packages/backend/app/config.py` |
| Refactor module scope PREVIEW_EXPIRY | `packages/backend/app/modules/service_requests/services/service_request_service.py` |
| Refactor module scope WIZARD_SESSION_TTL | `packages/backend/app/modules/service_requests/services/wizard_session_service.py` |
| Nouveau cron endpoint | `packages/backend/app/modules/service_requests/api/cron_routes.py` |
| Tests | `packages/backend/tests/unit/service_requests/test_cleanup_abandoned.py` |
| Doc env vars | `packages/backend/.env.local.example` (si présent) |
| Rétro | `.claude/plans/INSPECTION_BUNDLE_P2_RETRO.md` |

---

## 8. NOTES HORS SCOPE P2 (reportées)

- **Soft-delete `deleted_at`** sur `service_requests` → reporté en P5 (défense en profondeur)
- **Transaction atomique par SR** dans le loop DELETE (D6) → reporté en P5 (refactor Firebase)
- **Métriques Prometheus** `cleanup_abandoned_requests_*` → P5
- **Cron Cloud Scheduler config** (Terraform/IaC) → hors code, à configurer par l'ops
- **Alerte PagerDuty** `skipped_bundle > 0` → P5

---

**FIN DU PLAN DÉTAILLÉ P2**

Statut : **À VALIDER** — réponds "GO IMPL P2" pour démarrer, ou "QUESTION …" / "MODIFIE …" pour ajustements.
