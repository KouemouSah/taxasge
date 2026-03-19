# Session 1B — Correction Bugs + Vérification Sécurité

## Objectif
Corriger TOUS les bugs identifiés avant de passer aux sessions d'enrichissement.
Zéro bug en production avant d'avancer.

## Bugs à corriger

### CRITIQUES (bloquants)
- [ ] **Simulator licencias-comerciales 500** — `GET /service-bundles/simulator?commerce_type=X&zone_code=Y` retourne 500. Investiguer le backend endpoint, la query SQL, les données.
- [ ] **Pages legal manquantes** — `/legal/privacy`, `/legal/terms`, `/legal/cookies` retournent 404. Créer les pages ou les stubs.
- [ ] **Dashboard admin Pilotaje** — vérifier que le fix JSX closing tag fonctionne après déploiement. Si crash persiste, investiguer côté client.

### MAJEURS (fonctionnels)
- [ ] **Gestión Empresas** — vérifier que les 50 companies s'affichent après expiration cache permissions (10min). Si toujours 0, investiguer le middleware de permissions + cache Redis.
- [ ] **Config Rules** — vérifier que "Error al cargar" est résolu après permissions fiscal_service.view_bundles assignées. Si persiste, investiguer l'endpoint backend.
- [ ] **PDF Licence** — vérifier que le fix `m.name_es` fonctionne. Tester le download depuis la page admin/licenses/[id].
- [ ] **Classification Borradores** — l'onglet tourne puis erreur. Vérifier l'endpoint `/classification/drafts` — peut-être un problème de sérialisation des champs UUID.
- [ ] **Annuaire public** — vérifier que la page /annuaire fonctionne et affiche les 50 companies (is_active + is_verified).

### MINEURS (UX)
- [ ] **Cache permissions** — le TTL Redis de 10min cause un délai entre l'assignation de permissions et leur effet. Documenter ou réduire le TTL.
- [ ] **Leaflet crash** — la carte choroplèthe a été supprimée du dashboard admin. Prévoir le remplacement par SVG pur (session 5).

## Vérification Sécurité

### Permissions
- [ ] Vérifier que chaque endpoint est protégé par la bonne permission
- [ ] Tester qu'un agent_tesoro NE PEUT PAS accéder aux endpoints admin
- [ ] Tester qu'un agent_tesoro NE VOIT PAS les obligations ayuntamiento
- [ ] Tester que l'annuaire public NE retourne PAS email/phone/capital
- [ ] Vérifier les 26 permissions fantômes identifiées dans l'audit (hors scope companies mais à documenter)

### SQL Injection
- [ ] Grep TOUS les f-strings dans les queries SQL — vérifier qu'aucun n'accepte d'input utilisateur
- [ ] Vérifier que TOUTES les queries utilisent $1, $2 (paramétrisé)
- [ ] Le seul f-string accepté est REFRESH MATERIALIZED VIEW avec whitelist hardcodée

### UUID/Type Safety
- [ ] Vérifier que TOUS les endpoints convertissent les path params str → UUID avant de passer à asyncpg
- [ ] Tester avec un UUID invalide → doit retourner 422, pas 500

### Rate Limiting
- [ ] Vérifier que les endpoints publics ont le rate limiting actif
- [ ] Tester avec >100 req/min → doit retourner 429
- [ ] Vérifier le fallback quand Redis est down (graceful degradation)

### CORS/Headers
- [ ] Vérifier que les endpoints publics n'envoient pas de cookies withCredentials
- [ ] Vérifier les headers CORS pour le domaine de production

## Méthodologie
Pour chaque bug :
1. Reproduire (screenshot ou curl)
2. Diagnostiquer (logs backend, network tab, BD query)
3. Corriger
4. Vérifier (tester l'endpoint directement)
5. Lint + syntax check
6. Commit local (PAS de push avant que TOUT soit corrigé)

## Ordre de traitement
1. Vérifier les bugs qui pourraient être résolus par l'expiration du cache (permissions)
2. Corriger le simulator 500 (impact utilisateur public)
3. Créer les pages legal (404)
4. Vérifier chaque endpoint avec curl/mcp_postgres
5. Tests de sécurité
6. Push unique final
