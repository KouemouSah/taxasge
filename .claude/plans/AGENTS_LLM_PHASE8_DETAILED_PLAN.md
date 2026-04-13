# Phase 8 — Plan détaillé : proactive_alerts hardening + missing workflow scan

## Objectif

Cadrer le flow proactif existant avec le consentement utilisateur (permission `proactive_alerts`) + ajouter un nouveau scan `missing_for_workflow` qui détecte les utilisateurs ayant démarré une demande de service mais manquant de documents requis.

## Décisions d'expert (production-grade)

**1. Breaking change expiry emails → graceful degradation par tier de sévérité**

Arrêter tous les emails d'expiration aux users non opt-in est trop brutal pour un service gouvernemental. Les expirations de documents d'identité légaux (passeport, résidence) relèvent de la **safety net** : ne pas prévenir un citoyen 7 jours avant l'expiration de son passeport expose la plateforme à une responsabilité légale.

Cadre légal : **GDPR Recital 47** autorise le "legitimate interest" pour les traitements nécessaires à prévenir des risques concrets attendus par la personne concernée. Prévenir de l'expiration imminente d'un document d'identité tombe dans ce champ.

**Décision** :
- `expiry_7d` + `expired` → **toujours diffusés par email+push** (safety net, legitimate interest). Aucun consent requis.
- `expiry_30d` + `expiry_60d` + `expiry_90d` + `missing_for_workflow` + `proactive_preparation` → **gated par `proactive_alerts`** (proactive outreach, consent requis).

Les alertes in-app `user_document_alerts` restent créées pour **tous** les tiers (les utilisateurs qui visitent l'app les voient dans l'onglet Alertes).

**2. Permission `proactive_alerts` : default OFF, strict opt-in**

GDPR Article 7 exige un consentement "explicite et non ambigu". Un consent pré-coché = dark pattern interdit par la CNIL + EDPB guidelines. Le toggle reste OFF par défaut, l'utilisateur doit activer via le panneau (gear icon dans Mes Documents, fixé Phase 2).

**3. Pas de LIMIT artificiel sur le scan, safety cap sur les alertes**

Pour 1M users avec ~10% opt-in = 100K candidats, un `LIMIT 5000` arbitraire manquerait des utilisateurs pendant plusieurs jours. Le CRON est idempotent → les alertes non créées un jour le seront le lendemain, mais on préfère tout traiter en un passage.

**Décision** :
- Pas de `LIMIT` sur le SELECT — asyncpg gère 100K rows fetch sans problème
- **Safety cap** : log WARNING si `alerts_created > MAX_ALERTS_WARNING_THRESHOLD = 10_000` dans un run (signal ops : backlog inhabituel, potentiel stuck cron)
- **Concurrence notifications** : `asyncio.Semaphore(NOTIFY_CONCURRENCY = 50)` pour éviter de saturer SMTP/FCM quota
- **Per-run timeout** : pas ajouté (le cron tourne out-of-band, pas de HTTP timeout)

**4. Service_requests.status enum** : à vérifier directement BD avant implémentation (étape préalable à ce plan).

## Contexte critique (exploration directe)

`ProactiveAgentService` EXISTE déjà avec :
- `daily_scan(db)` entry point
- `_scan_expirations()` — crée des alertes d'expiration + **envoie push/email à TOUS les users** (pas de consent check → spam potentiel)
- `_create_proactive_preparations()` — gated par `prepare_renewal` level 2 (correct)
- `_mark_expired_documents()`, `_purge_old_deleted()`, `_cleanup_stale_memories()`, `_enforce_retention_policy()`

Cron endpoint : `POST /api/v1/user-documents/internal/cron/document-scan` avec `verify_cron_auth` (Cloud Scheduler daily 06:00 UTC).

Communications :
- `email_service.send_email()` — SMTP via Supabase
- `push_sending_service.send_to_user(db, user_id, title, body, data)` — FCM
- Table `notification_log` audit trail existante

Table `user_document_alerts` (migration 287) :
- 13 alert_types dans le CHECK (dont `missing_for_workflow`, `proactive_preparation`, `renewal_suggestion`, les 5 expiry tiers)
- `is_read`, `is_dismissed`, `is_actioned`, `trigger_date`, `expires_at`
- Idempotency via `WHERE NOT EXISTS` (pas d'unique constraint formel)

**2 failles critiques à fixer** :
1. `_scan_expirations` diffuse push+email à tous → doit être gaté par `proactive_alerts`
2. `proactive_alerts` permission existe dans la BD mais aucun code ne la check

## Architecture

### Principe de séparation consent

- **Création d'alerte in-app** (`user_document_alerts` INSERT) → **toujours** (safety net government). Les utilisateurs voient les alertes dans l'onglet Alertes de Mes Documents peu importe l'opt-in.
- **Diffusion push/email** (`_send_expiry_notification`) → **opt-in via `proactive_alerts`**. Sans permission active, les alertes existent en BD mais ne sortent pas du système.

Cette sémantique respecte OWASP (safety) + GDPR (consent) : les notifications sensibles (expiration document gouvernemental) restent visibles si l'utilisateur visite l'app, mais nous n'envoyons pas d'email non-sollicité.

### Nouveau scan : missing_for_workflow

Détecte les utilisateurs qui ont démarré une demande (`service_requests` en statut draft/pending) mais qui ont des documents requis manquants pour leur workflow. Crée une alerte `missing_for_workflow` avec action `upload_document`.

### Batch + rate limiting

- `max_users_per_run` paramètre (default 5000) → LIMIT sur la query de scan
- Rate limit per-user : max 5 push/email par run (déjà géré implicitement car 1 alerte par doc)
- Log si limit atteint pour tuning ops

## Fichiers modifiés

| Fichier | Type | Changement |
|---|---|---|
| `proactive_agent_service.py` | M | Permission gate dans `_scan_expirations` + nouveau `_scan_missing_documents_for_workflow` + batch LIMIT |
| `chatbot_tools_authenticated.py` | M | Catalog : `proactive_alerts.status='available'` |
| `tests/unit/user_documents/test_proactive_agent_service.py` | NOUVEAU | Tests |

## Implémentation

### 1. Helper `_has_proactive_alerts_permission`

Ajouter dans `ProactiveAgentService` :

```python
async def _has_proactive_alerts_permission(
    self, db: asyncpg.Connection, user_id
) -> bool:
    """Check if user has opted in to proactive push/email notifications.
    
    Creating in-app alerts is unconditional (safety net) but external
    delivery (email + push) requires explicit consent via the
    `proactive_alerts` permission.
    """
    return bool(
        await db.fetchval(
            """
            SELECT EXISTS (
                SELECT 1 FROM user_agent_permissions
                WHERE user_id = $1::uuid
                  AND permission_type = 'proactive_alerts'
                  AND is_active = TRUE
            )
            """,
            user_id,
        )
    )
```

### 2. Modification `_scan_expirations`

Dans la boucle actuelle, après INSERT de l'alerte in-app, **gater** l'appel à `_send_expiry_notification` :

```python
if "INSERT 0 1" in result:
    alerts_created += 1
    doc_name = (...)
    # Gate external delivery by opt-in consent
    if await self._has_proactive_alerts_permission(db, row["user_id"]):
        try:
            await self._send_expiry_notification(...)
        except Exception as notif_err:
            logger.debug(...)
    else:
        logger.debug(
            f"[ProactiveAgent] External notification skipped for "
            f"user={row['user_id']} (no proactive_alerts consent)"
        )
```

Aussi ajouter un batch limit sur la query :
```sql
...WHERE ud.expiry_date <= ($1::date + INTERVAL '90 days')
    AND ud.expiry_date >= ($1::date - INTERVAL '30 days')
ORDER BY ud.expiry_date ASC
LIMIT $2
```
Avec `LIMIT 5000` configurable via class constant.

### 3. Nouveau scan `_scan_missing_documents_for_workflow`

```python
async def _scan_missing_documents_for_workflow(
    self, db: asyncpg.Connection
) -> int:
    """
    Detect users with an in-progress service_request whose required
    documents are incomplete, and create `missing_for_workflow` alerts.
    
    Gated by Level 2 `proactive_alerts` permission so only opted-in
    users receive both the in-app alert AND the external notification.
    """
    # Only scan users who opted in — the whole intent of this scan is
    # proactive outreach, not safety net.
    rows = await db.fetch(
        """
        SELECT DISTINCT
            sr.id AS request_id,
            sr.user_id,
            sr.workflow_code,
            sr.status AS request_status,
            sr.created_at,
            u.email AS user_email,
            u.full_name,
            u.preferred_language
        FROM service_requests sr
        JOIN users u ON u.id = sr.user_id
        JOIN user_agent_permissions uap ON uap.user_id = sr.user_id
            AND uap.permission_type = 'proactive_alerts'
            AND uap.is_active = TRUE
        WHERE sr.status IN ('draft', 'pending_documents')
          AND sr.created_at >= CURRENT_DATE - INTERVAL '30 days'
        LIMIT $1
        """,
        self.MAX_USERS_PER_RUN,
    )
    
    alerts_created = 0
    for row in rows:
        # Use the existing ReadinessService to compute missing docs
        missing = await self._get_missing_docs_for_workflow(
            db, row["user_id"], row["workflow_code"]
        )
        if not missing:
            continue
        
        result = await db.execute(
            """
            INSERT INTO user_document_alerts (
                user_id, alert_type, severity,
                title_es, title_fr, title_en,
                message_es, message_fr, message_en,
                suggested_action, action_params, trigger_date
            )
            SELECT $1, 'missing_for_workflow', 'warning',
                $2, $3, $4, $5, $6, $7,
                'upload_document', $8::jsonb, CURRENT_DATE
            WHERE NOT EXISTS (
                SELECT 1 FROM user_document_alerts
                WHERE user_id = $1
                  AND alert_type = 'missing_for_workflow'
                  AND (action_params->>'request_id')::uuid = $9
                  AND is_dismissed = FALSE
                  AND created_at >= NOW() - INTERVAL '7 days'
            )
            """,
            ...
        )
        # 7-day dedup window so we don't re-nag users daily
        if "INSERT 0 1" in result:
            alerts_created += 1
            try:
                await self._send_missing_docs_notification(db, row, missing)
            except Exception as exc:
                logger.debug(f"... non-critical: {exc}")
    
    return alerts_created
```

### 4. `daily_scan` — Intégration

Ajouter l'appel au nouveau scan :
```python
try:
    results["missing_workflow_alerts"] = (
        await self._scan_missing_documents_for_workflow(db)
    )
except Exception as e:
    logger.error(f"[ProactiveAgent] Missing workflow scan failed: {e}")
    results["errors"].append(f"missing_workflow: {str(e)}")
```

### 5. Class constants

```python
class ProactiveAgentService:
    MAX_USERS_PER_RUN = 5000  # LIMIT on batch queries
    MISSING_DOCS_DEDUP_DAYS = 7  # don't re-alert same request in <7d
```

### 6. Catalog update

Dans `chatbot_tools_authenticated.py` :

```python
{
    "key": "proactive_alerts",
    "status": "available",  # ← was "coming_soon"
    "tool_name": "proactive_scan_background",  # not a chat tool, background cron
    "max_level": 2,
    "icon": "Bell",
    "always_on": False,
},
```

## Tests (tests/unit/user_documents/test_proactive_agent_service.py)

Couvrir :
1. `_has_proactive_alerts_permission` true/false
2. `_scan_expirations` respecte le consent : crée alerte in-app mais skip notification externe si pas de perm
3. `_scan_expirations` batch LIMIT respecté
4. `_scan_missing_documents_for_workflow` : users sans opt-in skipped (query JOIN)
5. `_scan_missing_documents_for_workflow` : alertes créées seulement pour missing docs
6. Dedup 7 jours : même request → pas de 2e alerte
7. Idempotency : 2e scan → 0 nouvelles alertes

## Checklist Phase 8

### Backend
- [ ] `_has_proactive_alerts_permission` helper ajouté
- [ ] `_scan_expirations` : permission gate + batch LIMIT
- [ ] `_scan_missing_documents_for_workflow` nouveau méthode
- [ ] `_get_missing_docs_for_workflow` helper (réutilise `check_readiness` existant si possible)
- [ ] `_send_missing_docs_notification` helper
- [ ] `daily_scan` intègre le nouveau scan
- [ ] `MAX_USERS_PER_RUN` + `MISSING_DOCS_DEDUP_DAYS` class constants
- [ ] Python syntax OK (py_compile)

### Catalog
- [ ] `AGENT_PERMISSION_CATALOG.proactive_alerts.status = 'available'`

### Tests
- [ ] Unit tests (6+ cases)
- [ ] Test BD direct : grant `proactive_alerts` → run scan → vérifier alerte créée + notification sent
- [ ] Test BD direct : user sans opt-in → alerte créée mais notification skip (vérifier log)
- [ ] pytest passe

### Self-critique + commit
- [ ] Self-critique complète
- [ ] Commit local

## Risques & mitigations

| Risque | Mitigation |
|--------|-----------|
| **Breaking change : users actuels arrêtent de recevoir emails expiry** | Les alertes in-app restent visibles → safety preserved. Communiquer dans release notes : "Pour continuer à recevoir des emails d'expiration, activez 'Alertes proactives' dans les paramètres de l'assistant." |
| Scan quotidien > 5000 users | LIMIT + cursor pour prochaine exécution (future). Alertes prioritaires par expiry_date ASC : les plus urgentes passent en premier |
| Spam alertes dans la même semaine | Dedup 7 jours sur `(user_id, request_id, alert_type)` |
| GDPR / consent audit | `user_agent_permissions.granted_at` + `user_document_alerts.created_at` sont horodatés → audit trail |
| `service_requests.status` enum values | Vérifier directement en BD avant implémentation pour éviter enum mismatch |
| Missing docs computation coûteuse | Réutiliser `check_readiness` service existant (déjà optimisé) |

## Ce qui N'EST PAS dans Phase 8

- Quiet hours / user timezone (UTC seulement, cron à 06:00 UTC = 07:00 CET = mid-morning Equatorial Guinea)
- Per-channel opt-out (email vs push) — granularité single permission pour l'instant
- User notification inbox dédiée (on utilise `user_document_alerts` + AlertsTab existant)
- Cron scheduling code (géré out-of-band via Cloud Scheduler)
- Frontend notification UI changes

## Estimation

- Helper permission + refactor `_scan_expirations` : 20 min
- Nouveau `_scan_missing_documents_for_workflow` + helper readiness : 30 min
- Catalog flip : 2 min
- Tests (6+) : 45 min
- Test BD direct : 15 min
- Self-critique + fix : 15 min
- Commit : 2 min
- **Total : ~2h 10min**
