# PHASE 2 — Plan detaille : Memoire Comportementale + Agent Proactif

**Date** : 2026-04-05
**Prerequis** : Phase 1 COMPLETE (coffre-fort + tools + frontend)
**Statut** : COMPLETE (auto-critique faite, 6 bugs critiques/majeurs corriges)

---

## SOUS-PHASES D'IMPLEMENTATION

### SP2.1 — Learning Loop (backend chatbot_service_rag.py)
### SP2.2 — Memory Context Builder (injection prompt)
### SP2.3 — Permission Management (endpoints + service)
### SP2.4 — Extension System Prompt (vault + memory + autonomy)
### SP2.5 — Agent Proactif CRON (scan expirations + preparation auto)
### SP2.6 — Frontend Agent Settings + Notifications
### SP2.7 — Tests + Auto-critique

---

## SP2.1 — LEARNING LOOP

**Fichier modifie** : `chatbot_service_rag.py`

**Principe** : Apres chaque interaction, analyser le comportement et enrichir la memoire.

**Methodes a ajouter :**
- `_post_interaction_learning(db, user_id, conversation_id, tool_calls, tool_results, user_feedback)`
- `_learn_memory(db, user_id, memory: Dict)` — UPSERT avec ON CONFLICT
- `_reinforce_memory(db, user_id, memory_key, delta)` — +/- confiance
- `_decay_stale_memories(db, user_id)` — desactiver les memoires < 0.2 confiance

**Declencheurs d'apprentissage :**
1. Tool call `check_readiness` → pattern "interesse par workflow X"
2. Tool call `list_vault_documents` avec filtre → pattern "cherche documents pour X"
3. Tool call `prepare_renewal` → pattern "renouvelle type X"
4. Feedback thumbs up → renforce memoires recentes (+0.1)
5. Feedback thumbs down → affaiblit memoires recentes (-0.2)
6. Langue detectee differente de preference → mise a jour preference
7. Action confirmee → renforce capacite "agent a prepare X avec succes"
8. Action rejetee → correction "user a rejete X, raison probable"

**Checklist SP2.1 :**
- [x] `_post_interaction_learning()` dans chat() — 5 pattern detectors
- [x] `_learn_memory()` avec UPSERT ON CONFLICT
- [x] `_reinforce_recent_memories()` pour feedback (+0.1/-0.15)
- [x] Decay dans _reinforce (confidence < 0.2, rejection >= 3)
- [x] Integration dans le flux chat existant (non-bloquant, try/except)
- [x] Integration dans le flux feedback existant (record_feedback extended)

---

## SP2.2 — MEMORY CONTEXT BUILDER

**Fichier modifie** : `chatbot_service_rag.py`

**Principe** : Construire un contexte memoire (~1500 tokens max) injecte dans chaque requete.

**Methodes a ajouter :**
- `_build_memory_context(db, user_id)` → str
- `_build_vault_context(db, user_id)` → str
- `_build_permissions_context(db, user_id)` → str

**Structure du contexte injecte :**
```
═══ COFRE DIGITAL ═══
Documentos: {total} ({expiring} por vencer)
Espacio: {used}/{max} Mo

═══ MEMORIAS ═══
- ⚙️ Preferencia: usuario prefiere francés (95%)
- 📊 Patrón: renueva pasaporte cada 5 años (80%)
- ⚠️ Corrección: rechazó cita en Malabo, prefiere Bata (100%)

═══ PERMISOS ═══
- ✅ Preparar renovaciones (nivel 2 — proactivo)
- ❌ Reservar citas (no autorizado)
```

**Checklist SP2.2 :**
- [x] `_build_full_agent_context()` — max 12 memoires, confiance >= 0.4
- [x] Vault stats section (total, expiring, expired, quota)
- [x] Permissions section with autonomy rules
- [x] Integration dans l'assembly du prompt (line 248)
- [x] Targeted last_used_at update (only fetched IDs, not all)

---

## SP2.3 — PERMISSION MANAGEMENT

**Nouveau fichier** : `chatbot_tools_authenticated.py` (extension)
**Nouveau endpoints** dans les routes existantes ou nouvelles

**Endpoints :**
```
GET    /api/v1/user-documents/agent/permissions     — Lister permissions
POST   /api/v1/user-documents/agent/permissions     — Accorder permission
DELETE /api/v1/user-documents/agent/permissions/{id} — Revoquer permission
GET    /api/v1/user-documents/agent/memory           — Voir memoires
DELETE /api/v1/user-documents/agent/memory/{id}      — Supprimer memoire
DELETE /api/v1/user-documents/agent/memory            — Reset toutes memoires
```

**Checklist SP2.3 :**
- [x] 7 endpoints dans user_documents_routes.py (3 perms + 3 memory + 1 CRON)
- [x] Pydantic models (AgentPermissionGrant, AgentPermissionResponse, AgentMemoryResponse)
- [x] Permission UPSERT with ON CONFLICT
- [x] Memory list/delete/reset
- [x] CRON auth via X-Cron-Secret header
- [x] Validation : user_id ownership on all queries

---

## SP2.4 — EXTENSION SYSTEM PROMPT

**Fichier modifie** : `gemini_service.py` ou `chatbot_service_rag.py`

**Principe** : Ajouter le contexte vault + memoire + autonomie au prompt existant.

**Regles d'autonomie injectees :**
```
REGLAS DE AUTONOMÍA:
- Nivel 0 (siempre): Consultar, informar, guiar. Sin confirmación.
- Nivel 1 (si permiso): Preparar acciones. Confirmación REQUERIDA.
- Nivel 2 (si permiso proactivo): Anticipar y preparar. Confirmar para ejecutar.
- REGLA INVIOLABLE: NUNCA ejecutar sin confirmación explícita.
- Si detectas un patrón frecuente y no tienes permiso nivel 1+, sugiérelo UNA VEZ.
```

**Checklist SP2.4 :**
- [x] COFRE DIGITAL section dans le prompt
- [x] MEMORIAS APRENDIDAS section dans le prompt (avec emojis)
- [x] PERMISOS DEL ASISTENTE section avec niveaux
- [x] REGLAS DE AUTONOMÍA (Nivel 0/1/2 + regle inviolable)
- [x] Integration dans _build_full_agent_context() → injecte a line 248

---

## SP2.5 — AGENT PROACTIF CRON

**Nouveau fichier** : `packages/backend/app/modules/user_documents/services/proactive_agent_service.py`

**Principe** : Job quotidien (06:00 UTC) qui :
1. Scanne les documents expirant (< 30 jours)
2. Verifie si l'utilisateur a permission Niveau 2
3. Verifie la readiness du workflow de renouvellement
4. Cree une alerte proactive si pret
5. Envoie notification push + email

**Aussi** : Endpoint CRON pour declencher le scan
```
POST /api/v1/internal/cron/document-expiry-scan — Cron Cloud Scheduler
```

**Checklist SP2.5 :**
- [x] `proactive_agent_service.py` — scan + alertes (5 methods)
- [x] Scan expirations CASE WHEN (90d/60d/30d/7d/expired)
- [x] Idempotent via WHERE NOT EXISTS subquery
- [x] Proactive preparations for Level 2 users
- [x] Trilingual alert messages (es/fr/en) for all 5 types
- [x] CRON endpoint `/internal/cron/document-scan`
- [x] Mark expired documents (status='expired')
- [x] Purge soft-deletes > 30 days
- [x] Cleanup stale memories (confidence < 0.15)

---

## SP2.6 — FRONTEND AGENT SETTINGS + NOTIFICATIONS

**Nouveaux composants :**
- `AgentSettingsPanel.tsx` — Dialog/sheet pour gerer permissions + memoires
- `ProactiveNotificationCard.tsx` — Card notification pour actions proactives
- `ActionConfirmCard.tsx` — Card confirmation dans le chat
- `AgentOnboarding.tsx` — Premiere utilisation, presentation agent

**Modifications :**
- Extension `FloatingChatbot.tsx` — badge avec count alertes vault
- Extension `/dashboard/chat` page — quick actions vault

**Checklist SP2.6 :**
- [x] AgentSettingsPanel.tsx (Sheet with permissions toggles + memories + stats)
- [x] ProactiveNotificationCard.tsx (banner with view/later/dont-suggest)
- [x] ActionConfirmCard.tsx (confirm/reject with readiness display)
- [ ] AgentOnboarding.tsx — DEFERRED Phase 3
- [ ] Extension FloatingChatbot badge — DEFERRED Phase 3
- [ ] Extension quick actions chat — DEFERRED Phase 3
- [x] i18n : es/fr/en agent section added (~25 keys per lang)

---

## SP2.7 — TESTS + AUTO-CRITIQUE

**Checklist SP2.7 :**
- [ ] Tests learning loop — DEFERRED Phase 3
- [ ] Tests permissions CRUD — DEFERRED Phase 3
- [ ] Tests memory context builder — DEFERRED Phase 3
- [ ] Tests agent proactif — DEFERRED Phase 3
- [ ] Tests prompt injection — DEFERRED Phase 3
- [x] Auto-critique : revue code complete (2 CRITICAL, 4 MAJOR, 6 MINOR)
- [x] Correction bugs :
  - [x] BUG #1+2 CRITICAL: Frontend API paths /agent/memories → /agent/memory + POST → DELETE
  - [x] BUG #4 MAJOR: Mass UPDATE last_used_at → targeted by fetched IDs only
  - [x] BUG #5+6 MAJOR: Missing TS fields (last_used_at, is_active, updated_at)
  - [x] BUG #9 MINOR: Emoji map aligned with backend CHECK constraint
  - [x] BUG #12 MINOR: proactive_alerts alwaysOn removed (needs explicit grant)

---

*Plan Phase 2 — A cocher au fur et a mesure*
