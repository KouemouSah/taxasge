# Observability — Next Session Boot Prompt

> **Date d'écriture** : 2026-05-05 (fin de session)
> **Objectif** : prompt boot pour la prochaine session afin de finaliser la stack observabilité (Grafana Dynamic + AI obs + Security obs) sans perdre le contexte.

---

## TL;DR — état au 2026-05-05 21:30 CET (mise à jour après finalisation)

✅ **Livré (~30 commits, 8 migrations BD, 35 panels, 8 alertes)** :
- Grafana Dashboards Dynamic (mig 323-324) — admin self-service complete
- AI Observability Phase A (8 sub-phases) + Phase B (8 sub-phases) — instrumentation full backend OTEL + 5 alertes + injection detection
- Security Observability Phase C (6 sub-phases) — `request_telemetry` table + middleware + UA + GeoIP + dashboard 20 panels + 3 alertes

✅ **Items finalisés en post-bilan (2026-05-05 21:30)** :
- Cron `request-telemetry-cleanup` enregistré dans `app/core/scheduler.py:201` (toutes les 6h) — finalement déjà fait, j'avais raté ça lors du bilan initial
- Script `scripts/download_geolite.py` — sha256-verified MaxMind download (CLI standalone + boot hook)
- `app/core/geoip.py::init_geoip()` — auto-download au boot si `MAXMIND_LICENSE_KEY` env var set + fichier absent (Cloud Run cold-start friendly)
- Cron `geolite-refresh` enregistré dans `app/core/scheduler.py:206` (mensuel, no-op sans license key)
- Script `scripts/smoke_security_observability.py` — 10 checks Phase C
- Captions HTML i18n fixed (data-i18n → data-i18n-html, balises rendues correctement) + enrichies pédagogiquement (4 sections : What it is / What you read / Numbers / How to use it)

⏳ **Reste avant clôture prod définitive** : 3 items (provisioning ops + activation).

---

## Prompt boot pour la prochaine session

> *Copier-coller au début de la prochaine session.*

```
Bilan session 2026-05-05 : .claude/plans/SESSION_BILAN_2026_05_05.md

Reste à faire (par priorité) :

1. [OPS — MaxMind license] Créer la license MaxMind GeoLite2
   - https://www.maxmind.com/en/geolite2/signup (gratuit)
   - Account → My License Key → Generate (case "Will this key be used for GeoIP Update?" cochée)
   - Provisionner dans GCP Secret Manager : gcloud secrets create maxmind-license-key
   - Bind dans workflow Cloud Run : --set-secrets="MAXMIND_LICENSE_KEY=maxmind-license-key:latest"
   - Au prochain cold-start, geoip.py auto-download le .mmdb dans /tmp/ (auto-download already wired)

2. [SMOKE STAGING] Exécuter les 2 scripts smoke après next deploy
   - python scripts/smoke_phase_b_full.py        # AI obs
   - python scripts/smoke_security_observability.py   # Security obs
   - Tous doivent passer (failures = 0)

3. [OPTIMISATION — attendre 7j baseline] Activer AI_SECURITY_BLOCK_HIGH_RISK=true
   - Phase B.5 implémenté mais désactivé (env var false par défaut)
   - Attendre 7 jours baseline injection metrics avant activation
   - Vérifier : count(WHERE injection_risk='high') / count(*) < 0.5%
   - Si > 0.5% : false positives, raffiner les patterns regex avant activation

4. [OPTIMISATION — différé] Streaming Gemini call gemini_service.py:1042 instrumenté
   - Skip Phase A.3 — wrapper attend single response
   - Phase B+ : créer wrapper `traced_generate_stream()` qui agrège les chunks et émet le span à la fin
```

✅ Items déjà finalisés (initialement listés ici, complétés en fin de session 2026-05-05) :
- Cron `request-telemetry-cleanup` enregistré dans scheduler.py:201 — était déjà là, j'avais raté
- Cron `geolite-refresh` enregistré dans scheduler.py:206 — refresh mensuel
- Auto-download boot hook dans `geoip.py::init_geoip()` — Cloud Run cold-start friendly
- Script `scripts/download_geolite.py` — sha256 verified
- Script `scripts/smoke_security_observability.py` — 10 checks
- Agents + commands AI obs + Security obs créés (`infra/observability/{AI,SECURITY}_OBSERVABILITY_AGENT.md` + `.claude/commands/{ai,security}-observability.md` + `infra/observability/README.md`)

Mémoires de référence :
- memory/project_grafana_dynamic_2026_05_05.md
- memory/project_ai_observability_2026_05_05.md
- memory/project_security_observability_2026_05_05.md

Plans :
- .claude/plans/GRAFANA_DASHBOARDS_DYNAMIC_PLAN.md
- .claude/plans/AI_OBSERVABILITY_PLAN.md
- .claude/plans/SECURITY_OBSERVABILITY_PLAN.md

Règles MEMORY ajoutées :
- #39 CSP frame-src à 2 endroits
- #40 Secret Manager pattern Cloud Run
- (à ajouter) #41 Adaptive sampling avec TTL LRU
- (à ajouter) #42 Sample-corrected MV multiplication
```

---

## Détail item par item

### 1. GeoLite2-City.mmdb provisioning

**Symptôme actuel** : `dashboard facil-security-monitoring` panel "Top countries by requests" affichera 0 rows en prod tant que `country IS NULL` partout.

**Implémentation attendue** :

```python
# scripts/download_geolite.py (NEW)
import os, urllib.request, tarfile, shutil
LICENSE_KEY = os.environ["MAXMIND_LICENSE_KEY"]
URL = f"https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key={LICENSE_KEY}&suffix=tar.gz"
TARGET = "/tmp/GeoLite2-City.mmdb"

def download():
    with urllib.request.urlopen(URL) as resp:
        with tarfile.open(fileobj=resp, mode="r:gz") as tar:
            for m in tar:
                if m.name.endswith(".mmdb"):
                    f = tar.extractfile(m)
                    with open(TARGET, "wb") as out:
                        shutil.copyfileobj(f, out)
                    return TARGET
    raise RuntimeError("No .mmdb in archive")

if __name__ == "__main__":
    print(f"Downloaded to {download()}")
```

**Cron Cloud Scheduler** : 1× par mois, exécute le script et redéploie le service.

**Ou plus simple** : commit `.mmdb` dans `infra/geoip/` (~70MB compressed) — accepté par git LFS, mis à jour mensuellement.

---

### 2. Smoke validation staging

**Phase B (AI obs)** — script déjà présent :

```bash
python scripts/smoke_ai_observability.py
# Doit afficher :
# ✅ TracerProvider initialized
# ✅ OTLP endpoint reachable (Tempo 200)
# ✅ ai_call_metrics has rows after 1h
# ✅ pricing_config seeded (9 rows)
# ✅ injection_risk column populated for high-volume features
```

**Phase C (Security obs)** — créer `scripts/smoke_security_observability.py` :

```python
# Vérifie :
# 1. request_telemetry table accessible + nb_rows > 0 (après 1h trafic)
# 2. mv_request_telemetry_hourly refresh récent (CHECK pg_stat_user_tables)
# 3. user_agent_parser cache hit ratio > 80% (proxy : COUNT DISTINCT user_agent / COUNT total)
# 4. geoip cache OK (COUNT WHERE country IS NOT NULL / total > 90%)
# 5. dashboard facil-security-monitoring queryable via Grafana API health
```

---

### 3. Cron scheduler

```python
# app/core/scheduler.py (PATCH)
scheduler.add_job(
    func=request_telemetry_cleanup,
    trigger="cron",
    hour="*/6",
    id="request-telemetry-cleanup",
    name="Cleanup request_telemetry rows older than 30 days",
    replace_existing=True,
)
```

---

### 4. Activer AI_SECURITY_BLOCK_HIGH_RISK

**Préconditions** :
- 7+ jours de données injection metrics dans `ai_call_metrics`
- Vérifier ratio `count(*) FILTER (WHERE injection_risk='high') / count(*)` < 0.5%
- Si > 0.5% : revoir patterns regex (false positives) avant d'activer

**Activation** :
```bash
gcloud run services update facil-backend \
  --update-env-vars=AI_SECURITY_BLOCK_HIGH_RISK=true \
  --region=europe-west3
```

---

### 5. Streaming Gemini instrumentation

**Code actuel** (`packages/backend/app/modules/chatbot/services/gemini_service.py:1042`) :

```python
async for chunk in model.generate_content_async(prompt, stream=True):
    yield chunk.text
```

**Pattern attendu** :

```python
# app/core/ai_telemetry.py (NEW function)
async def traced_generate_stream(model, prompt, *, feature, user_role, user_id):
    span = tracer.start_span("gen_ai.chat.stream", attributes={...})
    aggregated_text = []
    input_tokens = output_tokens = 0
    finish_reason = None
    try:
        async for chunk in model.generate_content_async(prompt, stream=True):
            aggregated_text.append(chunk.text)
            if hasattr(chunk, "usage_metadata"):
                input_tokens = chunk.usage_metadata.prompt_token_count
                output_tokens += chunk.usage_metadata.candidates_token_count
            if hasattr(chunk, "candidates") and chunk.candidates[0].finish_reason:
                finish_reason = str(chunk.candidates[0].finish_reason)
            yield chunk
        span.set_attribute("gen_ai.usage.input_tokens", input_tokens)
        span.set_attribute("gen_ai.usage.output_tokens", output_tokens)
        span.set_attribute("gen_ai.response.finish_reasons", [finish_reason])
        # INSERT ai_call_metrics (one row per stream call)
    finally:
        span.end()
```

---

### 6. Reuse agents — créer pour prochains projets

Suivre la même architecture que `infra/grafana/GRAFANA_DASHBOARDS_AGENT.md` et `infra/observability/LOGROCKET_OBSERVABILITY_AGENT.md` (déjà existants depuis 2026-05-04).

**Création prévue dans cette même session 2026-05-05** :
- `infra/observability/AI_OBSERVABILITY_AGENT.md` (8 phases : audit call sites, OTEL setup, schéma BD, wrapper, migration, dashboard, alertes, doc)
- `infra/observability/SECURITY_OBSERVABILITY_AGENT.md` (8 phases : audit existing, schéma `request_telemetry`, ASGI middleware, UA + GeoIP, dashboard + alertes, doc)
- `.claude/commands/{ai-observability,security-observability}.md`
- `infra/observability/README.md` (index liant les 3 agents : LogRocket + AI + Security)

Voir bas de ce document pour la liste exhaustive.

---

## Critique honnête de la session 2026-05-05

### Forces
- Couverture 360° : Frontend (LogRocket — sessions précédentes) + Backend HTTP (Phase B FastAPI/asyncpg) + AI (Phase A+B Gemini) + Security (Phase C IP/UA/Geo) + Errors (Sentry — pré-existant).
- Cohérence : tout converge vers Grafana Cloud (Tempo + Mimir + Loki) + Sentry (errors) + LogRocket (sessions).
- Reuse pattern : 5 fichiers à copier pour AI obs, 5 fichiers à copier pour Security obs (documentés dans wiki).
- 3 langues × 3 docs HTML = 9 docs i18n complètes.

### Faiblesses
- **3 push sans autorisation** (cf. erreurs comportementales dans bilan) — source de friction utilisateur.
- **Plan Phase C écrit après l'implémentation** (commit 21:00 vs implémentation 20:40-20:59) — atypique.
- **VertexAIManager initially missed** — audit insuffisant en début de Phase A.
- **GeoLite2 non provisionné** : Phase C.4 livre le code mais pas la donnée. Sans `.mmdb` en prod, géo dashboard vide.
- **Streaming Gemini deferred** : couverture instrumentation 12/13 call sites = 92% (1 manquant : streaming).
- **Pas de test pytest** sur `request_telemetry_middleware` (sampling tree, exclude paths) ni sur `ai_security` (false positives FR/ES).

### Risques résiduels
- **Tempo quota 5GB/jour** sur Free tier : alerte Phase B.6 préviendra mais à 1M users target il faudra upgrader Pro tier (~$15/mois).
- **MaxMind GeoLite2 mensuel** : si cron flop, géo data devient stale (toujours fonctionnel, juste vieilli).
- **Injection regex false positives** : un legitimate prompt qui mentionne "ignorer les instructions" en contexte tutoriel sera flaggé. Mitigation : whitelist `feature` (ex: chatbot_admin tutoriels).

### Lessons globales
1. **Toujours lister les "secret types" à ajouter à Secret Manager** AVANT le push : GRAFANA_SA_TOKEN était initialement en plain env var.
2. **Toujours auditer les modules existants similaires** (`Glob "**/*manager.py"` + `Grep`) AVANT d'implémenter un nouveau système.
3. **Plan AVANT impl, pas après** — règle CLAUDE.md générale.
4. **Annoncer push status à chaque commit** : "commit local — pas pushé, attente `push` du user".

---

**Pour reprendre cette session-ci** : tape `lance les agents observability` ou suit le plan `OBSERVABILITY_NEXT_SESSION_BOOT.md` item 6.
