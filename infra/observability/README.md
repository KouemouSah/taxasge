# Observability stack — agents réutilisables

> **Index** des agents observabilité réutilisables. Chaque agent vit dans
> son propre fichier `.md` + une slash-command associée. Tous fonctionnent
> sur n'importe quel projet en copiant 2 fichiers (le doc agent + la slash
> command) et en adaptant les chemins.

---

## Pourquoi 4 agents séparés ?

Chaque agent couvre une **dimension observabilité différente** avec ses propres
patterns, pièges, et reuse instructions. Mélanger = doc indigeste et reuse cassé.

| Dimension | Agent | Slash command | Quand utiliser |
|---|---|---|---|
| **Frontend sessions** (replay, click stream, JS errors) | `LOGROCKET_OBSERVABILITY_AGENT.md` | `/logrocket-observability` | Web/mobile/inspector — debug UX, support tickets, conversion funnel |
| **Backend HTTP traffic** (per-endpoint metrics + traces) | `GRAFANA_DASHBOARDS_AGENT.md` | `/grafana-dashboards` | Latency par endpoint, error rate, KPIs business |
| **LLM calls** (Gemini / OpenAI / Anthropic cost + latency) | `AI_OBSERVABILITY_AGENT.md` | `/ai-observability` | Cost tracking par feature/modèle, p95 latency, prompt injection |
| **Security** (IP/UA/Geo + injection persistence) | `SECURITY_OBSERVABILITY_AGENT.md` | `/security-observability` | Détecter attaques, controler trafic anormal, audit RGPD |

---

## Stack convergente — Grafana Cloud + Sentry + LogRocket

Les 4 agents convergent vers la même backbone :

```
┌─────────────────────────┐
│ Frontend (web/mobile)   │ → LogRocket (sessions) + Sentry (errors)
└─────────────────────────┘
            ↓ HTTP
┌─────────────────────────┐
│ Backend FastAPI         │ → Sentry (errors) ─┐
│  ├─ Pure ASGI mw        │ → request_telemetry┤
│  │   (security obs)     │   table BD          │
│  ├─ OTEL instrumented   │ → Tempo (traces) ───┼─→ Grafana Cloud
│  │   (FastAPI/asyncpg/  │   Mimir (metrics)   │   (Tempo / Mimir / Loki)
│  │   httpx/redis)       │   Loki (logs)       │
│  └─ ai_telemetry wrapper│ → ai_call_metrics ──┘
│     (Gemini calls)      │   table BD
└─────────────────────────┘
            ↓
┌─────────────────────────┐
│ Postgres (Supabase)     │ → request_telemetry, ai_call_metrics
│                         │   audit_logs (state changes)
└─────────────────────────┘
```

Tout dashboardable depuis Grafana via les datasources :
- Postgres (pour les tables `request_telemetry`, `ai_call_metrics`, `audit_logs`, business tables)
- Tempo (pour les traces OTEL)
- Mimir (pour les RED metrics auto-derived par Application Observability)
- Loki (pour les logs structurés)

---

## Comment utiliser sur un nouveau projet

### Étape 1 — Setup Grafana (Phase 0 commune)

1. Crée un workspace Grafana Cloud Free (`https://<nom>.grafana.net`)
2. Crée une **Service Account token** (`glsa_*`) — pour l'API admin
3. Crée un **Cloud Access Policy token** (`glc_*`) — pour OTLP write
4. Note l'**instance ID numérique** (visible dans `https://grafana.com/orgs/<org>/stacks/<INSTANCE_ID>/grafana`)

### Étape 2 — Décide quelles dimensions tu couvres

Recommandé : commence par **Grafana Dashboards** (le plus visible immédiatement),
puis **AI Observability** si tu as des appels LLM, puis **Security
Observability** pour le compliance, puis **LogRocket** pour le frontend.

### Étape 3 — Lance l'agent correspondant

```
/grafana-dashboards          # 8 phases, dashboards business
/ai-observability            # 8 phases, instrumentation LLM
/security-observability      # 8 phases, télémétrie HTTP
/logrocket-observability     # 7 phases, session replay
```

Chaque agent a des **gates de validation** entre phases — tu peux interrompre
et reprendre.

### Étape 4 — Reuse 5 fichiers

À la fin de chaque agent, il liste 5 fichiers à copier dans le nouveau repo +
les commandes pour les wirer. C'est le path de reuse minimum (~30 min par
agent sur projet existant).

---

## État de validation (Facil — 2026-05-05)

| Agent | Validation | Bilan |
|---|---|---|
| `/grafana-dashboards` | ✅ 10 dashboards production livrés | `memory/session_2026_05_04_grafana_e1.md` |
| `/ai-observability` | ✅ 17 call sites instrumentés (12 + 5 différés stream), 12 panels, 5 alertes | `memory/project_ai_observability_2026_05_05.md` |
| `/security-observability` | ✅ table 31 cols + middleware ASGI + UA + GeoIP + 20 panels + 3 alertes | `memory/project_security_observability_2026_05_05.md` |
| `/logrocket-observability` | ✅ 3 surfaces wirées (web, mobile, inspector) | `.claude/plans/OBSERVABILITY_STACK.md` |

---

## Patterns transversaux (à connaître avant de lancer un agent)

### 1. Secret Manager pattern Cloud Run

Tout token/API key DOIT passer par Secret Manager + `--set-secrets=` (pas
`--set-env-vars=`). Détails MEMORY règle #40.

### 2. CSP frame-src à 2 endroits (Next.js)

Tout nouveau provider d'embed iframe (Grafana, Looker, etc.) DOIT être ajouté
dans `middleware.ts` ET `next.config.mjs`. Détails MEMORY règle #39.

### 3. Cron registration obligatoire (scheduler)

Tout endpoint `/cron/*` DOIT être enregistré dans `app/core/scheduler.py` (ou
équivalent). Sinon il ne tourne JAMAIS. Détails MEMORY règle #23.

### 4. asyncpg JSONB = `json.dumps()` obligatoire

asyncpg attend un string pour les colonnes JSONB, pas un dict Python. Détails
MEMORY règle #24.

### 5. Boot non-destructif sur permissions

Toute permission ajoutée par migration SQL SURVIT au boot (`cleanup_obsolete=False`
par défaut). Détails MEMORY règle #37.

---

## See also

- `infra/grafana/GRAFANA_DASHBOARDS_AGENT.md`
- `infra/observability/AI_OBSERVABILITY_AGENT.md`
- `infra/observability/SECURITY_OBSERVABILITY_AGENT.md`
- `infra/observability/LOGROCKET_OBSERVABILITY_AGENT.md`
- `.claude/plans/SESSION_BILAN_2026_05_05.md` — bilan session de création
- `.claude/plans/OBSERVABILITY_NEXT_SESSION_BOOT.md` — endoff next session
