---
description: Invoke the Security Observability Agent to wire HTTP request telemetry (IP/UA/Geo + injection persistence) production-grade on this project. Reusable across projects via infra/observability/SECURITY_OBSERVABILITY_AGENT.md.
argument-hint: [setup|audit|wire|dashboard|injection|fix <issue>] (optional, default = full pipeline)
---

# Security Observability Agent

Lis et exécute **strictement** le document
`infra/observability/SECURITY_OBSERVABILITY_AGENT.md` (8 phases avec gates).

## Comportement selon $ARGUMENTS

- **`setup`** → Phase 0 + Phase 1 uniquement (MaxMind license, audit sources existantes)
- **`audit`** → Phase 1 (gap analysis audit_logs / Sentry / OTEL Tempo)
- **`wire`** → Phase 2 + Phase 3 + Phase 4 + Phase 5 (BD + middleware + UA + GeoIP)
- **`dashboard`** → Phase 6 (dashboard 20 panels + 3 alertes)
- **`injection`** → Phase 7 ciblé (extension AI obs avec injection columns)
- **`fix <issue>`** → garde-fou ciblé (ex: `fix mv-undercount`, `fix bot-misclassified`)
- **vide** → flux complet 0 → 8

## Règles non-négociables

1. **Phases dans l'ordre** : pas de gate sautée. Validation utilisateur entre chaque phase.
2. **Phase 0 obligatoire** : pas de Phase 1 sans MaxMind license dans `.env` testée + Grafana datasource healthy.
3. **Phase 1 (audit existant) obligatoire** : tableau audit_logs / Sentry / OTEL Tempo / LogRocket avec gap analysis. Décision table dédiée justifiée.
4. **Pure ASGI middleware** : jamais `BaseHTTPMiddleware` (consomme body).
5. **MV sample-corrected** : multiplier `100/sampled_pct` dans tout COUNT/SUM. Sinon dashboards 10× sous-estimés.
6. **Cron `*-cleanup` enregistré dans scheduler** : `grep` post-impl obligatoire. Sinon raw rows accumulent à l'infini.
7. **GeoIP `.mmdb` provisionné** : sans le fichier physique, `geoip.py` retourne EMPTY → géo dashboard vide. Cron mensuel obligatoire.
8. **Pas de push git automatique** : à la fin, demander explicitement.
9. **Pas de license MaxMind en clair** : `.env` gitignored uniquement.
10. **`relativeTimeRange.from > 0`** : alert queries `{"from": 3600, "to": 0}`. Pas `0`.

## Sortie attendue

À la fin du flux complet (sans args) :
- 1 migration BD : `request_telemetry` + MV rollup hourly + cron cleanup
- 1 module `app/core/request_telemetry_middleware.py` (pure ASGI, sampling adaptatif)
- 1 module `app/core/user_agent_parser.py` (LRU 4096)
- 1 module `app/core/geoip.py` (MaxMind GeoLite2 offline + LRU 4096)
- 1 script `scripts/download_geolite.py` + cron mensuel registered
- 1 cron `request-telemetry-cleanup` registered dans scheduler (toutes les 6h)
- 1 dashboard Grafana 20+ panels (5 row sections)
- 3 alertes (IP spike / failed login / bot share)
- (Optionnel) 3 colonnes injection sur `ai_call_metrics` + 3 panels dashboard AI
- HTML doc 3 langues + wiki page + mémoire projet
- Commits locaux sémantiques (1 par phase)
- Demande explicite de push

## Anti-patterns à refuser

L'agent **doit refuser** si l'utilisateur demande :
- Coller la MaxMind license directement dans la conversation
- Sauter Phase 1 (« crée juste la table on verra l'audit après »)
- Utiliser `BaseHTTPMiddleware` au lieu de pure ASGI (cf. piège #5)
- Skip sample correction dans la MV (cf. piège #3 — counts sous-estimés × sampled_pct)
- Push git sans validation explicite
- Hardcoder GeoIP DB path dans le code (utiliser env var)
- Skip cron `*-cleanup` (cf. piège #4)
- Activer auto-block injection high-risk avant 7 jours baseline (false positive risk)
- Charger `.mmdb` synchrone dans le request handler (cf. boot init obligatoire)

Dans ces cas, expliquer la raison et proposer la voie correcte.

## Garde-fous actifs (faiblesses gérées pendant le flux)

L'agent **N'enregistre PAS** ces faiblesses comme dette technique. Il les
**neutralise pendant l'exécution** via les garde-fous §10 du document agent :

| # | Faiblesse | Garde-fou pendant l'exécution |
|---|---|---|
| 1 | License MaxMind hardcodée | Phase 0.2 — `.env` gitignored |
| 2 | Duplication de `audit_logs` | Phase 1 — tableau audit obligatoire |
| 3 | MV sans sample correction | Phase 2 — multiplier `100/sampled_pct` |
| 4 | Cron jamais enregistré | Phase 2 — vérif `grep` post-impl scheduler |
| 5 | `BaseHTTPMiddleware` consomme body | Phase 3 — pure ASGI uniquement |
| 6 | `.mmdb` jamais refresh | Phase 5 — cron mensuel obligatoire |
| 7 | Regex injection FR/ES sous-pondérés (Phase 7 optionnelle) | Bumper poids 55 → 60 vs EN |

**Si une faiblesse non-listée est rencontrée**, l'agent doit :
1. Documenter dans §10 du document agent
2. Proposer un garde-fou actif (pas juste un disclaimer)
3. Mettre à jour cette table

→ L'agent **n'autorise PAS** un flux qui aurait des faiblesses non-couvertes.

## Reproductibilité multi-projets

Cet agent fonctionne sur **n'importe quel projet** Python/FastAPI :
1. Copier `infra/observability/SECURITY_OBSERVABILITY_AGENT.md` dans le nouveau repo
2. Copier `.claude/commands/security-observability.md` (ce fichier)
3. Adapter les chemins (`app/core/` ou équivalent du projet)
4. Lancer `/security-observability` → l'agent guide depuis zéro

Le projet **Facil (taxasge)** a servi de validation : 6 sub-phases C.1-C.6
livrées en une session, 20 panels, 3 alertes, doc 3 langues. Voir
`.claude/plans/SESSION_BILAN_2026_05_05.md`.

## See also

- `/grafana-dashboards` — agent sœur pour les dashboards BI (business)
- `/ai-observability` — agent sœur pour la télémétrie LLM (Gemini/OpenAI/Anthropic)
- `/logrocket-observability` — agent sœur pour le session replay (web/mobile/inspector)

Si **AI obs déjà déployé** (table `ai_call_metrics` existe), Phase 7 ajoute la
persistance prompt injection — sinon Phase 7 est skipped.
