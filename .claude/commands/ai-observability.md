---
description: Invoke the AI Observability Agent to instrument LLM calls (Gemini / OpenAI / Anthropic) production-grade on this project. Reusable across projects via infra/observability/AI_OBSERVABILITY_AGENT.md.
argument-hint: [setup|audit|wire|dashboard|fix <issue>] (optional, default = full pipeline)
---

# AI Observability Agent

Lis et exécute **strictement** le document
`infra/observability/AI_OBSERVABILITY_AGENT.md` (8 phases avec gates).

## Comportement selon $ARGUMENTS

- **`setup`** → Phase 0 + Phase 1 uniquement (token OTLP, audit call sites)
- **`audit`** → Phase 2 (audit système existant — singleton manager, circuit breaker)
- **`wire`** → Phase 3 + Phase 4 + Phase 5 + Phase 6 (BD + wrapper + migration call sites + bootstrap)
- **`dashboard`** → Phase 7 (dashboard 12 panels + 3 alertes)
- **`fix <issue>`** → garde-fou ciblé (ex: `fix xaf0`, `fix streaming`)
- **vide** → flux complet 0 → 8

## Règles non-négociables

1. **Phases dans l'ordre** : pas de gate sautée. Validation utilisateur entre chaque phase.
2. **Phase 0 obligatoire** : pas de Phase 1 sans token OTLP + instance_id décodé + provider LLM identifié.
3. **Phase 2 (audit existant) obligatoire** : `Glob/Grep` exhaustif AVANT toute implémentation pour ne pas dupliquer un VertexAIManager-like existant. Décision COEXISTENCE/MERGE/NEW documentée.
4. **Pas de push git automatique** : à la fin, demander explicitement « OK pour `git push origin <branch>` ? ».
5. **Pas de token OTLP en clair** : `.env` gitignored uniquement. Décoder via `base64 -d` pour extraire la région.
6. **`normalize_model_name()` testé** sur les 3 formats : Vertex AI prefix `publishers/google/models/`, Gemini direct `models/`, OpenAI legacy `chat-`.
7. **Migration call sites 1-par-1** : pas de bulk. Smoke test après chaque fichier.
8. **Streaming wrappers à part** : si Phase 4.3 (`traced_generate_stream`) pas dispo, lister les call sites stream dans `_REMAINING_INSTRUMENTATION.md`.
9. **`relativeTimeRange.from > 0`** : alert rule queries doivent avoir `{"from": 3600, "to": 0}` (1h lookback). Pas `{"from": 0, "to": 0}`.
10. **PII redaction** : jamais de prompt brut dans les spans ou la BD. `hash_prompt(p)` SHA-256 truncated 8 hex chars uniquement.

## Sortie attendue

À la fin du flux complet (sans args) :
- 1 module `app/core/ai_telemetry.py` (4 fonctions : sync / async / stream / helpers)
- 2 migrations BD : `ai_call_metrics` + `ai_pricing_config`
- N call sites instrumentés (+ `_REMAINING_INSTRUMENTATION.md` pour les stream/legacy)
- TracerProvider + 4 instrumenters wirés au lifespan
- 1 dashboard Grafana 12+ panels
- 3 alertes (cost / error / p95) + optionnel 4-5 (Tempo quota / injection)
- HTML doc 3 langues + wiki page + mémoire projet
- Commits locaux sémantiques (1 par phase)
- Demande explicite de push

## Anti-patterns à refuser

L'agent **doit refuser** si l'utilisateur demande :
- Coller le token OTLP directement dans la conversation
- Sauter Phase 2 (audit existant) (« vas-y, balance le wrapper »)
- Bulk-migrer les call sites en un seul commit
- Push git sans validation explicite
- Hardcoder `instance_id` ou `glc_token` dans le code
- Skip `normalize_model_name()` (« on verra plus tard »)
- Mettre les prompts bruts dans la BD (« pour le debug »)
- Activer 100% sampling sur stack > 1M users sans Pro tier (cf. piège quota Tempo)
- Skip Phase 7 (« on fera le dashboard plus tard »)
- Plan APRÈS impl (cf. erreur Phase C 2026-05-05 : plan committé après les sub-phases)

Dans ces cas, expliquer la raison et proposer la voie correcte.

## Garde-fous actifs (faiblesses gérées pendant le flux)

L'agent **N'enregistre PAS** ces faiblesses comme dette technique. Il les
**neutralise pendant l'exécution** via les garde-fous §10 du document agent :

| # | Faiblesse | Garde-fou pendant l'exécution |
|---|---|---|
| 1 | Confusion CAP token UUID vs instance_id numérique | Phase 0.2 — décode token base64, croise avec URL `/stacks/<id>/grafana` |
| 2 | Système existant (VertexAIManager-like) ignoré | Phase 2 — `Glob/Grep` obligatoire avant impl |
| 3 | Streaming `usage_metadata` partiel = cost = 0 | Phase 4.3 — agrégation au fil des chunks |
| 4 | `model_name` not normalized = cost_xaf = 0 | Phase 4.4 — `normalize_model_name()` strip prefixes |
| 5 | Migration call sites en bulk = régression silencieuse | Phase 5 — 1-par-1 + smoke test |
| 6 | Alert `relativeTimeRange.from = 0` rejected | Phase 7 — `{"from": 3600, "to": 0}` |
| 7 | Regex injection FR/ES sous-pondérés | Phase optionnelle 7 — bumper poids 55 → 60 |
| 8 | Plan committé après impl | Phase 0 — plan AVANT |

**Si une faiblesse non-listée est rencontrée**, l'agent doit :
1. Documenter dans §10 du document agent
2. Proposer un garde-fou actif (pas juste un disclaimer)
3. Mettre à jour cette table

→ L'agent **n'autorise PAS** un flux qui aurait des faiblesses non-couvertes.

## Reproductibilité multi-projets

Cet agent fonctionne sur **n'importe quel projet** Python/FastAPI :
1. Copier `infra/observability/AI_OBSERVABILITY_AGENT.md` dans le nouveau repo
2. Copier `.claude/commands/ai-observability.md` (ce fichier)
3. Adapter les chemins (`app/core/` ou équivalent du projet)
4. Lancer `/ai-observability` → l'agent guide depuis zéro

Le projet **Facil (taxasge)** a servi de validation : 17 call sites instrumentés
(12 Phase A.3 + 5 différés Phase B+), 1 dashboard 15 panels, 5 alertes (cost,
error, p95, Tempo quota, injection spike), doc 3 langues. Voir
`.claude/plans/SESSION_BILAN_2026_05_05.md`.

## See also

- `/grafana-dashboards` — agent sœur pour les dashboards génériques (BI / business)
- `/security-observability` — agent sœur pour la télémétrie HTTP (IP/UA/Geo)
- `/logrocket-observability` — agent sœur pour le session replay (web/mobile/inspector)
