# LOOKER E1 — Phase 4 : Integration & smoke tests staging

**Date** : 2026-05-04
**Phase** : 4/5
**Statut** : 📋 PRÊT POUR EXÉCUTION POST-DEPLOY
**Effort** : 30 min utilisateur après déploiement staging
**Master plan** : `.claude/plans/LOOKER_E1_AUTOMATION_MASTER_PLAN.md`

---

## 1. Objectif phase

Valider end-to-end que le flux phase 1 → phase 3 fonctionne sur staging :
- Migration appliquée sur la BD staging
- HTTP endpoints répondent correctement (curl smoke tests)
- Frontend admin page accessible et form fonctionnel (UI manual)
- Cache + audit log fonctionnent en runtime

## 2. Pré-requis

| Item | Statut au 2026-05-04 |
|---|---|
| Migration 317 appliquée localement | ✅ DONE (phase 1) |
| Backend service smoke tests | ✅ DONE (6/6 phase 2) |
| Frontend ESLint | ✅ DONE (phase 3) |
| Migration appliquée sur staging | ⏳ après push + GitHub Actions deploy |
| Cloud Run staging redéployé avec phase 2 code | ⏳ idem |
| Firebase Hosting staging redéployé avec phase 3 code | ⏳ idem |

## 3. Smoke test script (à exécuter post-deploy)

### 3.1 Setup environnement

```bash
# Replace these with actual staging values
export STAGING_BASE="https://taxasge-backend-dev-XXXXX.run.app"
export ADMIN_TOKEN="..."           # JWT obtenu via /auth/login admin
export CITIZEN_TOKEN="..."          # JWT d'un compte citoyen pour test 403
```

### 3.2 Test A — GET /reports-config (cache + fallback)

```bash
# A1. GET en tant qu'admin → 200 + 3 entries (sans report_id si table vide)
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$STAGING_BASE/api/v1/dashboards/reports-config" | jq '.reports | length'
# attendu: 3

# A2. GET en tant que citoyen → 403
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $CITIZEN_TOKEN" \
  "$STAGING_BASE/api/v1/dashboards/reports-config"
# attendu: 403

# A3. GET sans token → 401
curl -s -o /dev/null -w "%{http_code}\n" \
  "$STAGING_BASE/api/v1/dashboards/reports-config"
# attendu: 401
```

### 3.3 Test B — GET /admin/configs (admin only)

```bash
# B1. GET en tant qu'admin → 200 + 3 configs avec source labelled
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$STAGING_BASE/api/v1/dashboards/admin/configs" \
  | jq '.configs[] | {dashboard_id, source}'
# attendu: 3 lignes, source = unset (ou env_fallback si LOOKER_REPORTS_*_REPORT_ID env vars existent)

# B2. GET en tant que citoyen → 403 (citoyen n'a pas dashboards.manage)
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $CITIZEN_TOKEN" \
  "$STAGING_BASE/api/v1/dashboards/admin/configs"
# attendu: 403

# B3. GET sans token → 401
curl -s -o /dev/null -w "%{http_code}\n" \
  "$STAGING_BASE/api/v1/dashboards/admin/configs"
# attendu: 401
```

### 3.4 Test C — PUT /admin/configs/{id} (validation + audit)

```bash
# C1. PUT happy path → 200 + DTO source=db
curl -sX PUT -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"looker_report_id":"smoketest-12345-abcdef","is_active":true}' \
  "$STAGING_BASE/api/v1/dashboards/admin/configs/recaudacion" \
  | jq '.source'
# attendu: "db"

# C2. PUT regex fail (report_id trop court) → 422
curl -sX PUT -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"looker_report_id":"abc","is_active":true}' \
  -o /dev/null -w "%{http_code}\n" \
  "$STAGING_BASE/api/v1/dashboards/admin/configs/recaudacion"
# attendu: 422

# C3. PUT extra field (mass assignment) → 422
curl -sX PUT -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"looker_report_id":"smoketest-12345-abcdef","is_active":true,"hacker":"value"}' \
  -o /dev/null -w "%{http_code}\n" \
  "$STAGING_BASE/api/v1/dashboards/admin/configs/recaudacion"
# attendu: 422

# C4. PUT unknown dashboard_id → 404
curl -sX PUT -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"looker_report_id":"smoketest-12345-abcdef","is_active":true}' \
  -o /dev/null -w "%{http_code}\n" \
  "$STAGING_BASE/api/v1/dashboards/admin/configs/nonexistent_id"
# attendu: 404

# C5. PUT en tant que citoyen → 403
curl -sX PUT -H "Authorization: Bearer $CITIZEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"looker_report_id":"smoketest-12345-abcdef","is_active":true}' \
  -o /dev/null -w "%{http_code}\n" \
  "$STAGING_BASE/api/v1/dashboards/admin/configs/recaudacion"
# attendu: 403
```

### 3.5 Test D — Rate limit (10 PUT/min)

```bash
# D1. 11 PUTs successifs → la 11ème renvoie 429
for i in {1..11}; do
  echo -n "Try $i: "
  curl -sX PUT -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"looker_report_id":"smoketest-12345-abcdef","is_active":true}' \
    -o /dev/null -w "%{http_code}\n" \
    "$STAGING_BASE/api/v1/dashboards/admin/configs/recaudacion"
done
# attendu: 1-10 = 200, 11 = 429
```

### 3.6 Test E — Cache + reflect after PUT

```bash
# E1. PUT changes report_id
curl -sX PUT -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"looker_report_id":"updated-99999-zzzzz","is_active":true}' \
  "$STAGING_BASE/api/v1/dashboards/admin/configs/recaudacion" > /dev/null

# E2. GET /reports-config doit voir le nouveau report_id immédiatement
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$STAGING_BASE/api/v1/dashboards/reports-config" \
  | jq '.reports[] | select(.dashboard_id=="recaudacion") | .looker_report_id'
# attendu: "updated-99999-zzzzz"
```

### 3.7 Test F — Audit log

```bash
# Connexion psql staging et vérification que les PUT du test C/E ont créé des audit_logs
psql "$STAGING_DATABASE_URL" -c "
SELECT user_id, action, entity_id, new_values
FROM audit_logs
WHERE entity_type='dashboard_config'
  AND entity_id='recaudacion'
  AND created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;
"
# attendu: au moins 5 lignes (1 par PUT réussi des tests C1, E1 + retries éventuels)
```

### 3.8 Cleanup post-tests

```bash
# Remettre l'état à zéro
psql "$STAGING_DATABASE_URL" -c "DELETE FROM dashboard_registrations WHERE dashboard_id='recaudacion';"
# Optionnel : purger les audit_logs de test
# psql "$STAGING_DATABASE_URL" -c "DELETE FROM audit_logs WHERE entity_type='dashboard_config' AND created_at > NOW() - INTERVAL '1 hour';"
```

## 4. Test UI manuel (Firebase Hosting staging)

### 4.1 Accès page

1. Login en tant qu'admin sur staging
2. Aller sur `/dashboard/admin/dashboards` → cards visibles, badge "Awaiting setup" sur les 3
3. Cliquer "Configurer" en haut à droite OU sur le lien "Awaiting setup" d'une card
4. Atterrir sur `/dashboard/admin/dashboards/config`
5. Vérifier : 3 cartes config, source=unset, formulaire vide, badge gris

### 4.2 Soumission valide

1. Renseigner `looker_report_id` valide (ex: `abc123-def456-ghi789`)
2. Cliquer "Guardar"
3. Vérifier : toast success, badge change à "BD", updated_at affiché
4. Recharger la page → la valeur persiste

### 4.3 Validation Zod

1. Saisir `looker_report_id="abc"` (trop court)
2. Tenter de soumettre → message d'erreur Zod inline
3. Le PUT n'est PAS envoyé (validation client bloque)

### 4.4 Effet immédiat sur landing

1. Revenir sur `/dashboard/admin/dashboards`
2. La card pour le dashboard configuré devrait être cliquable maintenant (badge "Awaiting setup" disparu)
3. Cliquer dessus → embed iframe charge le rapport Looker (tant qu'il existe vraiment côté Looker Studio)

### 4.5 Permission check

1. Logout admin, login en tant que citoyen
2. Tenter d'accéder direct à `/dashboard/admin/dashboards/config`
3. Attendu : page rendue mais le hook useDashboardConfigs renvoie 403, banner "Acceso denegado" affiché

### 4.6 i18n check

1. Switcher langue UI (es/fr/en)
2. Vérifier que tous les labels du form, badges, messages sont traduits

## 5. Critères d'acceptation phase 4

- [ ] Migration 317 appliquée sur staging (via push develop → GitHub Actions ou via le script `apply_migration_317.py`)
- [ ] Tests A1-A3 (GET /reports-config) passent
- [ ] Tests B1-B3 (GET /admin/configs) passent
- [ ] Tests C1-C5 (PUT validation + auth) passent
- [ ] Test D1 (rate limit 429) passe
- [ ] Test E1-E2 (cache invalidation cohérente) passent
- [ ] Test F (audit log row INSERT) passe
- [ ] UI 4.1 (navigation admin → config) OK
- [ ] UI 4.2 (form valid submit + persistance) OK
- [ ] UI 4.3 (Zod client-side validation) OK
- [ ] UI 4.4 (effet immédiat sur landing) OK
- [ ] UI 4.5 (403 citoyen sur la page config) OK
- [ ] UI 4.6 (i18n 3 langues) OK

## 6. Si un test échoue

| Symptôme | Diagnostic probable |
|---|---|
| 401 sur tous les tests | JWT expiré, refresh token |
| 403 inattendu sur PUT admin | Vérifier que `dashboards.manage` est granté (migration 317 appliquée?) |
| 422 inattendu sur valid input | Pydantic regex désynchronisé avec Zod — comparer les patterns |
| 404 sur PUT recaudacion | Vérifier que le dashboard_id matche le registry (`recaudacion`/`agentes`/`services`) |
| Cache n'invalide pas | Redis Upstash down? Vérifier env var REDIS_URL Cloud Run |
| Audit log absent | Vérifier que la transaction du PUT a bien commit (logs Sentry) |
| UI 403 alors que admin | Vérifier que le user a `dashboards.manage` ET `dashboards.view_business` |

## 7. Sortie phase 4

À la fin :
- ✅ Tous les smoke tests passent sur staging
- ✅ UI manual checks OK
- ✅ Phase 5 peut commencer (push to remote)
