# RAPPORT EXPERT V3 : Module "Mes Documents" + Agent IA Enrichi

**Date** : 2026-04-05
**Statut** : ARCHITECTURE V3 — Extension assistant existant + memoire comportementale
**Version** : 3.0

---

## AUTO-CRITIQUE V2 → V3

| Erreur V2 | Correction V3 |
|-----------|--------------|
| Module `ai_assistant/` SEPARE | **SUPPRIME** — On enrichit le chatbot existant (`/dashboard/chat`) |
| Tables `ai_assistant_sessions` + `ai_assistant_messages` | **SUPPRIME** — On utilise `chatbot_conversations` existant |
| 15 nouveaux outils | **7 nouveaux** (documents vault) + 8 existants deja en place |
| Gemini 2.0 Flash | **gemini-2.5-flash** deja configure (avec thinking budget) |
| Nouveau streaming SSE | **DEJA EN PLACE** — `/chat/stream` existant |
| Nouveau system prompt | **EXTENSION** du prompt existant (3 langues, 1300+ lignes) |

---

## TABLE DES MATIERES

1. [Critique des suggestions utilisateur](#1-critique)
2. [Architecture finale](#2-architecture)
3. [Sous-module A : Coffre-fort Documents](#3-coffre-fort)
4. [Sous-module B : Extension GeminiDocumentProcessor](#4-extension-gemini)
5. [Sous-module C : Enrichissement Assistant Existant](#5-enrichissement-assistant)
6. [Sous-module D : Memoire Comportementale (Self-Learning)](#6-memoire)
7. [Sous-module E : Agent Proactif (Alertes + Preparation auto)](#7-proactif)
8. [Schema de donnees final](#8-schema)
9. [Plan d'implementation PRO](#9-plan)

---

## 1. CRITIQUE DES SUGGESTIONS UTILISATEUR

### 1.1 "Utiliser l'assistant existant" — CORRECT, je corrige

**Ce qui existe DEJA et que j'avais ignore :**

| Fonctionnalite | Existant | Fichier |
|----------------|----------|---------|
| 8 tools authentifies | `get_my_requests`, `get_my_payments`, `get_my_appointments`, `get_my_documents`, `get_my_next_actions`, `get_my_profile`, `get_my_notifications`, `get_request_detail` | `chatbot_tools_authenticated.py` |
| 11 tools publics | `search_fiscal_services`, `get_workflow_guide`, `get_document_checklist`, `start_workflow`, etc. | `chatbot_tools.py` |
| Streaming SSE | `POST /chat/stream` avec chunks type/status/done | `chatbot_routes.py` |
| Conversation persistence | `chatbot_conversations` table | `chatbot_service_rag.py` |
| User preferences | `chatbot_user_preferences` table (langue, zone, ville, topics) | migration 282 |
| Feedback | Thumbs up/down + texte, `POST /feedback` | `chatbot_routes.py` |
| Thinking budget | 0/1024/8192 tokens selon complexite | `chatbot_service_rag.py` |
| Self-evaluation | Quality score < 0.4 → retry avec tools | `chatbot_service_rag.py` |
| UI dashboard | Page `/dashboard/chat` + FloatingChatbot | `ChatPage.tsx`, `FloatingChatbot.tsx` |
| UI reusable agent | `AgentChatUI.tsx` + `ArtifactRenderer.tsx` | `components/agent-chat/` |

**Conclusion** : Creer un module `ai_assistant/` etait du code duplique. On ENRICHIT l'existant.

### 1.2 "L'agent gere les niveaux lui-meme" — JE CHALLENGE

**Pourquoi c'est RISQUE pour une plateforme gouvernementale :**

| Critere | Claude Code (reference) | Facil Assistant |
|---------|------------------------|-----------------|
| Domain | Code source (reversible) | Demarches gouvernementales (IRREVERSIBLE) |
| Cout d'erreur | `git revert` | Frais perdus + delais + rejet |
| Responsabilite | Developpeur (controle) | Citoyen (victime si erreur agent) |
| Cadre legal | Aucun | Droit administratif GE |
| Sandbox | Oui (git worktree) | NON — actions reelles |

**Mon contre-proposition : AUTONOMIE PROGRESSIVE CONSENTIE**

```
┌─────────────────────────────────────────────────────────────────┐
│  NIVEAU 0 — INFORMATIONNEL (par defaut, tous users)             │
│  Agent repond, consulte, guide. ZERO action.                    │
│  Exemples : "Quel est le statut de ma demande ?"               │
│             "Combien coute un passeport ?"                      │
│  → Pas de confirmation necessaire                               │
│  → 19 tools existants suffisent                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  NIVEAU 1 — PREPARATOIRE (active apres opt-in utilisateur)      │
│  Agent PREPARE des actions, les presente, user CONFIRME.        │
│  Exemples : "Prepare ma demande de passeport"                  │
│             → Agent check docs, pre-remplit, presente resume    │
│             → User valide → wizard session creee pre-remplie    │
│  Permission : user doit activer "Autoriser la preparation"     │
│  → Permission persistante dans user_agent_permissions           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  NIVEAU 2 — PROACTIF (active apres apprentissage)               │
│  Agent ANTICIPE et prepare SANS qu'on lui demande.              │
│  Exemples : DNI expire dans 30j → agent prepare le dossier     │
│             → Notification : "Dossier pret, confirmer ?"        │
│  Permission : agent RECOMMANDE l'activation apres 3+ usages    │
│  du Niveau 1 pour le meme type de workflow.                     │
│  → "Je vois que vous renouvelez regulierement vos documents.   │
│     Voulez-vous que je prepare automatiquement les prochains ?"│
│  → User accepte → permission persistee                          │
│  → SOUMISSION = TOUJOURS un tap/clic de confirmation            │
└─────────────────────────────────────────────────────────────────┘
```

**REGLE INVIOLABLE** : L'agent ne soumet JAMAIS une demande sans confirmation explicite. Meme au Niveau 2, il PREPARE et NOTIFIE, l'utilisateur CONFIRME.

### 1.3 "Self-learning comme Claude Code" — JE NUANCE

**Comment Claude Code "apprend" :**
- Fichier `MEMORY.md` avec memoire structuree (pas du ML)
- Feedback utilisateur stocke dans des fichiers memoire
- Contexte injecte dans le system prompt a chaque conversation
- PAS de fine-tuning du modele

**Ce qu'on PEUT faire (equivalent exact) :**

```python
# Table user_agent_memory — equivalent de MEMORY.md
# Chaque entree = une "lecon apprise" par l'agent sur cet utilisateur

user_agent_memory = {
    # Preferences apprises
    "pref_001": {
        "type": "preference",
        "content": "User prefere les reponses en francais malgre interface en espagnol",
        "confidence": 0.95,  # Observe 19 fois sur 20
        "learned_from": "language_detection",
        "created_at": "2026-03-15"
    },
    # Patterns comportementaux
    "pattern_001": {
        "type": "behavioral",
        "content": "User renouvelle son passeport tous les 5 ans. Dernier: 2021-06-15",
        "confidence": 1.0,
        "learned_from": "service_request_history",
        "created_at": "2026-04-01"
    },
    # Corrections utilisateur
    "correction_001": {
        "type": "correction",
        "content": "User a rejete la suggestion de RDV a Malabo — prefere Bata",
        "confidence": 1.0,
        "learned_from": "action_rejected",
        "created_at": "2026-04-02"
    },
    # Permissions accordees
    "permission_001": {
        "type": "permission",
        "content": "User autorise preparation automatique des renouvellements d'identite",
        "scope": "identity_renewals",
        "granted_at": "2026-04-03"
    }
}
```

**Ce qu'on NE PEUT PAS faire :**
- Fine-tuner Gemini sur les interactions (Vertex AI ne le permet pas pour Flash)
- Faire du "vrai" apprentissage continu (weights update)
- Garantir que l'agent ne reproduira jamais une erreur (stateless per request)

**Ce qu'on fait A LA PLACE (et c'est suffisant) :**
1. **Memoire structuree** : table BD avec "lecons" enrichie a chaque interaction
2. **Injection contextuelle** : les "lecons" pertinentes injectees dans le system prompt
3. **Scoring** : chaque memoire a une `confidence` qui monte/descend selon les confirmations/rejets
4. **Decay** : les memoires non confirmees perdent en confiance avec le temps
5. **Nettoyage** : memoires a confiance < 0.3 supprimees automatiquement

### 1.4 "Agent autonome comme OpenClaw/Cowork" — JE REFORMULE

**Ce qui est PERTINENT de OpenClaw/Cowork :**
- Capacite de reflexion multi-etapes (plan → execute → verify)
- Utilisation d'outils (function calling)
- Contexte persistant entre sessions
- Actions executees avec consentement

**Ce qui est DIFFERENT pour Facil :**
- OpenClaw agit dans un environnement code (sandbox, reversible)
- Facil agit dans un environnement administratif (reel, irreversible)
- OpenClaw peut "experimenter" (essayer, echouer, recommencer)
- Facil DOIT reussir du premier coup (cout financier + delais)

**Architecture "Agent Reflexif" proposee :**

```
┌─────────────────────────────────────────────────────────────────┐
│  BOUCLE DE REFLEXION (a chaque requete)                         │
│                                                                  │
│  1. PERCEVOIR                                                    │
│     - Lire le message utilisateur                                │
│     - Charger contexte : preferences, memoire, historique        │
│     - Charger etat : documents coffre, demandes actives, alertes │
│                                                                  │
│  2. RAISONNER (thinking budget Gemini)                           │
│     - Quel est l'objectif de l'utilisateur ?                     │
│     - Quels outils utiliser ?                                    │
│     - Ai-je appris quelque chose de pertinent ?                  │
│     - Y a-t-il un risque ?                                       │
│                                                                  │
│  3. AGIR                                                         │
│     - Niveau 0 : Repondre directement                            │
│     - Niveau 1 : Preparer + presenter + attendre confirmation    │
│     - Niveau 2 : Preparation proactive + notification            │
│                                                                  │
│  4. APPRENDRE (post-interaction)                                 │
│     - User a confirme → renforcer la memoire (confidence +0.1)   │
│     - User a rejete → corriger la memoire (confidence -0.2)      │
│     - Nouveau pattern detecte → creer nouvelle memoire           │
│     - Feedback thumbs → ajuster qualite reponse                  │
│                                                                  │
│  5. NOTIFIER (si proactif)                                       │
│     - Action preparee → push + in-app + email                    │
│     - Expiration proche → alerte avec action suggeree            │
└─────────────────────────────────────────────────────────────────┘
```

### 1.5 Points oublies par l'utilisateur (ajoutes par l'expert)

1. **Onboarding agent** : A la premiere utilisation, l'agent doit se presenter, expliquer ses capacites, et demander les premieres permissions. Pas de "cold start".

2. **Rate limiting des actions** : Meme au Niveau 2, l'agent ne peut pas preparer plus de 3 dossiers/semaine sans confirmation. Anti-spam.

3. **Audit trail des actions agent** : CHAQUE action de l'agent (preparation, notification, execution) est loguee avec : qui, quoi, quand, resultat, confirmation user.

4. **Revocation de permissions** : L'utilisateur peut a tout moment revoquer une permission accordee. Accessible dans settings.

5. **Limites de contexte** : La memoire comportementale ne doit pas depasser ~2000 tokens dans le system prompt (sinon dilution du contexte RAG).

6. **Privacy** : Les "lecons apprises" sont des DONNEES PERSONNELLES → droit d'acces, droit d'effacement, droit de rectification.

7. **Degradation gracieuse** : Si Gemini est down, l'agent ne doit PAS bloquer l'acces aux documents ni aux demandes. Mode lecture seule.

---

## 2. ARCHITECTURE FINALE

### 2.1 Ce qu'on NE CREE PAS (vs V2)

| Element V2 supprime | Raison |
|---------------------|--------|
| Module `ai_assistant/` | L'assistant existant suffit |
| Tables `ai_assistant_sessions`, `ai_assistant_messages` | `chatbot_conversations` existe |
| 15 outils metier | 8 existent deja, on ajoute 7 pour le coffre-fort |
| System prompt complet | On etend le prompt existant (3 langues) |
| `AssistantWidget.tsx` | `FloatingChatbot.tsx` existe |
| `AssistantPage.tsx` | `/dashboard/chat` existe |
| Service streaming | `/chat/stream` existe |

### 2.2 Ce qu'on CREE

```
NOUVEAU :
├── Backend
│   ├── user_documents/ module        — Coffre-fort (CRUD, upload, quota)
│   ├── Extension GeminiDocumentProcessor  — post_process_for_vault() (~150 lignes)
│   ├── Extension chatbot_tools_authenticated.py  — 7 nouveaux tools vault
│   ├── Extension chatbot_service_rag.py  — learning loop + proactive agent
│   ├── user_agent_memory table + service  — Memoire comportementale
│   ├── user_agent_permissions table  — Permissions autonomie
│   ├── proactive_agent_service.py    — Preparation automatique (CRON)
│   └── Migration SQL (1 migration, toutes les tables)
│
├── Frontend
│   ├── user-documents/ module        — Page coffre-fort complete
│   ├── Extension /dashboard/chat     — Nouveaux quick actions + vault integration
│   ├── Extension FloatingChatbot     — Badge alertes + vault context
│   ├── ActionConfirmCard.tsx         — Composant confirmation actions agent
│   ├── ProactiveNotification.tsx     — Notification agent proactif
│   └── AgentSettingsPanel.tsx        — Gestion permissions + memoire
│
└── i18n : extensions es/fr/en pour coffre-fort + agent enrichi
```

### 2.3 Architecture des tools (final)

```
TOOLS EXISTANTS (ne pas toucher) :
├── PUBLIC (11)
│   ├── search_fiscal_services
│   ├── get_service_details
│   ├── search_companies
│   ├── get_ministry_directory
│   ├── get_office_locations
│   ├── get_workflow_guide
│   ├── get_service_categories
│   ├── get_platform_info
│   ├── search_bundles
│   ├── start_workflow
│   └── get_document_checklist
│
├── AUTHENTIFIE EXISTANT (8)
│   ├── get_my_requests
│   ├── get_request_detail
│   ├── get_my_payments
│   ├── get_my_appointments
│   ├── get_my_notifications
│   ├── get_my_profile
│   ├── get_my_next_actions
│   └── get_my_documents         ← documents PAR REQUEST (existant)

TOOLS NOUVEAUX (7 — coffre-fort + proactif) :
├── COFFRE-FORT (5)
│   ├── list_vault_documents     — Tous les docs du coffre-fort (filtres)
│   ├── check_readiness          — Completude pour un workflow
│   ├── get_expiring_documents   — Docs qui expirent bientot
│   ├── get_vault_stats          — Stats coffre-fort (quota, counts)
│   └── suggest_next_uploads     — Docs recommandes a uploader
│
├── PROACTIF (2)
│   ├── prepare_renewal          — [Niveau 1+] Preparer un renouvellement
│   └── get_agent_memory         — [Debug/transparency] Voir ce que l'agent a appris
```

**Total : 26 tools** (11 public + 8 auth existant + 7 nouveau)

---

## 3. SOUS-MODULE A : COFFRE-FORT DOCUMENTS

*(Identique V2, pas de changement — table user_documents + CRUD + Firebase + quota 100Mo)*

*(Voir V2 section 2 pour les details complets)*

**Changements specifiques V3 :**
- Quota : 100 Mo (confirme)
- Signed URLs : 15 min
- Deduplication : SHA-256
- Versioning : `replaces_document_id`

---

## 4. SOUS-MODULE B : EXTENSION GeminiDocumentProcessor

*(Identique V2 — `post_process_for_vault()` ajoute au processeur existant)*

*(Voir V2 section 3 pour les details complets)*

---

## 5. SOUS-MODULE C : ENRICHISSEMENT ASSISTANT EXISTANT

### 5.1 Modifications `chatbot_tools_authenticated.py`

```python
# AJOUT DE 5 TOOLS COFFRE-FORT

async def list_vault_documents(
    user_id: str,
    category: Optional[str] = None,
    expiry_status: Optional[str] = None,  # valid, expiring_soon, expired
    workflow_code: Optional[str] = None,
    limit: int = 10,
    db: asyncpg.Connection = None
) -> Dict[str, Any]:
    """
    Lista todos los documentos del cofre digital del usuario.
    Incluye documentos personales, importados del wizard, y generados.
    """
    filters = []
    params = [user_id]
    idx = 2

    base_query = """
        SELECT ud.id, ud.document_type, ud.document_category,
               ud.file_name, ud.display_name, ud.expiry_date,
               ud.extraction_confidence, ud.status, ud.source,
               ud.is_verified, ud.created_at,
               ud.holder_name, ud.document_number,
               array_agg(DISTINCT udwt.workflow_code) FILTER (WHERE udwt.workflow_code IS NOT NULL) as workflow_tags
        FROM user_documents ud
        LEFT JOIN user_document_workflow_tags udwt ON udwt.user_document_id = ud.id
        WHERE ud.user_id = $1 AND ud.deleted_at IS NULL AND ud.status != 'deleted'
    """

    if category:
        filters.append(f"ud.document_category = ${idx}")
        params.append(category)
        idx += 1

    if expiry_status == "valid":
        filters.append("(ud.expiry_date IS NULL OR ud.expiry_date > CURRENT_DATE + INTERVAL '90 days')")
    elif expiry_status == "expiring_soon":
        filters.append("ud.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'")
    elif expiry_status == "expired":
        filters.append("ud.expiry_date < CURRENT_DATE")

    if workflow_code:
        filters.append(f"EXISTS (SELECT 1 FROM user_document_workflow_tags t WHERE t.user_document_id = ud.id AND t.workflow_code = ${idx})")
        params.append(workflow_code)
        idx += 1

    if filters:
        base_query += " AND " + " AND ".join(filters)

    base_query += f" GROUP BY ud.id ORDER BY ud.created_at DESC LIMIT ${idx}"
    params.append(limit)

    rows = await db.fetch(base_query, *params)
    documents = []
    for row in rows:
        doc = dict(row)
        if doc.get("expiry_date"):
            days = (doc["expiry_date"] - date.today()).days
            doc["days_until_expiry"] = days
            doc["expiry_status"] = "expired" if days < 0 else "critical" if days < 30 else "warning" if days < 90 else "valid"
        documents.append(doc)

    return {
        "documents": documents,
        "count": len(documents),
        "summary": f"{len(documents)} documentos encontrados en el cofre digital"
    }


async def check_readiness(
    user_id: str,
    workflow_code: str,
    db: asyncpg.Connection = None
) -> Dict[str, Any]:
    """
    Verifica que documentos tiene y cuales le faltan para un tramite especifico.
    Compara el cofre-fort con workflow_document_requirements.
    """
    # Documents requis pour ce workflow
    required = await db.fetch("""
        SELECT wdr.document_code, wdr.document_name_es, wdr.is_required,
               wdr.condition_type, wdr.condition_value
        FROM workflow_document_requirements wdr
        WHERE wdr.workflow_code = $1 AND wdr.is_active = TRUE
        ORDER BY wdr.display_order
    """, workflow_code)

    # Documents du user tagges pour ce workflow
    available = await db.fetch("""
        SELECT ud.id, ud.document_type, ud.expiry_date, ud.status,
               udwt.document_code
        FROM user_documents ud
        JOIN user_document_workflow_tags udwt ON udwt.user_document_id = ud.id
        WHERE ud.user_id = $1 AND udwt.workflow_code = $2
          AND ud.status = 'active' AND ud.deleted_at IS NULL
    """, user_id, workflow_code)

    available_codes = {r["document_code"] for r in available}
    ready = []
    missing = []
    expiring = []

    for req in required:
        code = req["document_code"]
        if code in available_codes:
            doc = next(d for d in available if d["document_code"] == code)
            if doc.get("expiry_date") and doc["expiry_date"] < date.today():
                expiring.append({"code": code, "name": req["document_name_es"], "status": "expired"})
            elif doc.get("expiry_date") and (doc["expiry_date"] - date.today()).days < 30:
                expiring.append({"code": code, "name": req["document_name_es"], "status": "expiring_soon",
                                "days": (doc["expiry_date"] - date.today()).days})
            else:
                ready.append({"code": code, "name": req["document_name_es"]})
        else:
            if req["is_required"]:
                missing.append({"code": code, "name": req["document_name_es"], "required": True})

    total = len(required)
    available_count = len(ready) + len(expiring)
    score = round((available_count / total * 100) if total > 0 else 0)

    return {
        "workflow_code": workflow_code,
        "readiness_score": score,
        "total_required": total,
        "available": available_count,
        "missing_count": len(missing),
        "ready": ready,
        "missing": missing,
        "expiring": expiring,
        "can_start": len(missing) == 0 and all(e["status"] != "expired" for e in expiring),
        "summary": f"Preparacion {score}% — {available_count}/{total} documentos listos"
    }


async def get_expiring_documents(
    user_id: str,
    days_ahead: int = 90,
    db: asyncpg.Connection = None
) -> Dict[str, Any]:
    """Documentos que expiran en los proximos N dias."""
    rows = await db.fetch("""
        SELECT id, document_type, display_name, file_name, expiry_date, holder_name
        FROM user_documents
        WHERE user_id = $1 AND expiry_date IS NOT NULL
          AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $2 * INTERVAL '1 day'
          AND status = 'active' AND deleted_at IS NULL
        ORDER BY expiry_date ASC
    """, user_id, days_ahead)

    docs = []
    for row in rows:
        days = (row["expiry_date"] - date.today()).days
        docs.append({
            **dict(row),
            "days_until_expiry": days,
            "urgency": "critical" if days < 7 else "high" if days < 30 else "medium" if days < 60 else "low",
            "suggested_action": f"Iniciar renovacion de {row['display_name'] or row['document_type']}"
        })

    return {
        "expiring_documents": docs,
        "count": len(docs),
        "critical_count": sum(1 for d in docs if d["urgency"] == "critical"),
        "summary": f"{len(docs)} documentos expiran en los proximos {days_ahead} dias"
    }


async def get_vault_stats(
    user_id: str,
    db: asyncpg.Connection = None
) -> Dict[str, Any]:
    """Statistiques du coffre-fort."""
    stats = await db.fetchrow("""
        SELECT
            COUNT(*) FILTER (WHERE status = 'active') as total_active,
            COUNT(*) FILTER (WHERE source = 'personal') as personal_count,
            COUNT(*) FILTER (WHERE source = 'wizard_import') as wizard_count,
            COUNT(*) FILTER (WHERE source = 'platform_generated') as generated_count,
            COALESCE(SUM(file_size_bytes) FILTER (WHERE source IN ('personal')), 0) as quota_used_bytes,
            COUNT(*) FILTER (WHERE expiry_date < CURRENT_DATE AND status = 'active') as expired_count,
            COUNT(*) FILTER (WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days') as expiring_count
        FROM user_documents
        WHERE user_id = $1 AND deleted_at IS NULL
    """, user_id)

    quota_max = 100 * 1024 * 1024  # 100 Mo
    return {
        **dict(stats),
        "quota_max_bytes": quota_max,
        "quota_percentage": round(stats["quota_used_bytes"] / quota_max * 100, 1),
        "summary": f"Cofre: {stats['total_active']} docs, {round(stats['quota_used_bytes']/1024/1024, 1)}/{100} Mo"
    }


async def suggest_next_uploads(
    user_id: str,
    db: asyncpg.Connection = None
) -> Dict[str, Any]:
    """Suggere les documents a uploader pour maximiser la readiness."""
    # Trouver les workflows les plus demandes qui ont des documents manquants
    suggestions = await db.fetch("""
        WITH popular_workflows AS (
            SELECT workflow_code, COUNT(*) as usage_count
            FROM service_requests
            WHERE user_id = $1
            GROUP BY workflow_code
            ORDER BY usage_count DESC
            LIMIT 5
        ),
        needed_docs AS (
            SELECT pw.workflow_code, wdr.document_code, wdr.document_name_es, wdr.is_required
            FROM popular_workflows pw
            JOIN workflow_document_requirements wdr ON wdr.workflow_code = pw.workflow_code
            WHERE wdr.is_active = TRUE AND wdr.is_required = TRUE
              AND NOT EXISTS (
                  SELECT 1 FROM user_document_workflow_tags udwt
                  JOIN user_documents ud ON ud.id = udwt.user_document_id
                  WHERE udwt.workflow_code = pw.workflow_code
                    AND udwt.document_code = wdr.document_code
                    AND ud.user_id = $1 AND ud.status = 'active' AND ud.deleted_at IS NULL
              )
        )
        SELECT DISTINCT document_code, document_name_es,
               array_agg(DISTINCT workflow_code) as needed_for_workflows
        FROM needed_docs
        GROUP BY document_code, document_name_es
        ORDER BY array_length(array_agg(DISTINCT workflow_code), 1) DESC
        LIMIT 5
    """, user_id)

    return {
        "suggestions": [dict(s) for s in suggestions],
        "count": len(suggestions),
        "summary": f"{len(suggestions)} documentos recomendados para subir a su cofre digital"
    }
```

### 5.2 Modifications `chatbot_tools_authenticated.py` — Tools proactifs

```python
# AJOUT DE 2 TOOLS PROACTIFS

async def prepare_renewal(
    user_id: str,
    document_id: str,
    workflow_code: Optional[str] = None,
    db: asyncpg.Connection = None
) -> Dict[str, Any]:
    """
    [NIVEAU 1+] Prepare un renouvellement de document.
    Verifie les permissions agent, prepare les donnees, retourne un resume.
    L'utilisateur DOIT confirmer avant execution.
    """
    # Verifier permission
    has_permission = await db.fetchval("""
        SELECT EXISTS (
            SELECT 1 FROM user_agent_permissions
            WHERE user_id = $1 AND permission_type = 'prepare_renewal'
              AND (scope IS NULL OR scope = $2)
              AND is_active = TRUE
        )
    """, user_id, workflow_code)

    if not has_permission:
        return {
            "status": "permission_required",
            "message": "Para preparar renovaciones automaticamente, necesita activar esta funcion en la configuracion del asistente.",
            "action": "request_permission",
            "permission_type": "prepare_renewal"
        }

    # Charger le document
    doc = await db.fetchrow("""
        SELECT * FROM user_documents WHERE id = $1 AND user_id = $2
    """, document_id, user_id)

    if not doc:
        return {"status": "error", "message": "Documento no encontrado"}

    # Determiner le workflow de renouvellement
    if not workflow_code:
        # Deduire du type de document
        workflow_map = {
            "dip_gq": "verificacion_funcionario",
            "pasaporte": "pasaporte_renovacion",
            "permiso_residencia": "residencia",
            "licencia_conducir": "conducir_renovacion",
            "carnet_funcionario": "carnet_funcionario",
        }
        workflow_code = workflow_map.get(doc["document_type"])

    if not workflow_code:
        return {"status": "error", "message": "No se puede determinar el tramite de renovacion para este tipo de documento"}

    # Verifier readiness
    readiness = await check_readiness(user_id, workflow_code, db=db)

    # Calculer tarif
    tariff_info = "Consulte la pagina del servicio para el coste exacto"

    return {
        "status": "prepared",
        "document": {
            "type": doc["document_type"],
            "name": doc["display_name"] or doc["file_name"],
            "expiry_date": str(doc["expiry_date"]) if doc["expiry_date"] else None,
        },
        "workflow_code": workflow_code,
        "readiness": readiness,
        "tariff_info": tariff_info,
        "action": "confirm_to_create_wizard_session",
        "message": f"Renovacion preparee: {readiness['readiness_score']}% de documents prets. Confirmer pour creer la demande ?",
        "requires_confirmation": True
    }


async def get_agent_memory(
    user_id: str,
    db: asyncpg.Connection = None
) -> Dict[str, Any]:
    """
    [TRANSPARENCE] Montre ce que l'agent a appris sur l'utilisateur.
    L'utilisateur peut voir et supprimer des memoires.
    """
    memories = await db.fetch("""
        SELECT id, memory_type, content, confidence, learned_from,
               confirmation_count, rejection_count, created_at, last_used_at
        FROM user_agent_memory
        WHERE user_id = $1 AND is_active = TRUE
        ORDER BY confidence DESC, last_used_at DESC
        LIMIT 20
    """, user_id)

    permissions = await db.fetch("""
        SELECT permission_type, scope, granted_at, usage_count
        FROM user_agent_permissions
        WHERE user_id = $1 AND is_active = TRUE
    """, user_id)

    return {
        "memories": [dict(m) for m in memories],
        "permissions": [dict(p) for p in permissions],
        "memory_count": len(memories),
        "summary": f"El asistente ha aprendido {len(memories)} cosas sobre sus preferencias y tiene {len(permissions)} permisos activos."
    }
```

### 5.3 Extension system prompt existant

```python
# AJOUT au system prompt existant (dans gemini_service.py)
# Section ajoutee APRES la section tools existante

VAULT_CONTEXT_TEMPLATE = """
═══ COFRE DIGITAL DEL USUARIO ═══
Documentos totales: {vault_total}
Documentos expirando (< 90 dias): {expiring_count}
Documentos expirados: {expired_count}
Espacio usado: {quota_used_mb}/{quota_max_mb} Mo

═══ MEMORIAS APRENDIDAS ═══
{learned_memories}

═══ PERMISOS DEL ASISTENTE ═══
{agent_permissions}

═══ REGLAS DE AUTONOMIA ═══
- Nivel 0 (siempre): Consultar, informar, guiar. Sin confirmacion.
- Nivel 1 (si permiso): Preparar acciones, presentar resumen. Confirmacion REQUERIDA.
- Nivel 2 (si permiso proactivo): Anticipar y preparar. Notificar. Confirmacion para ejecutar.
- REGLA INVIOLABLE: NUNCA ejecutar una accion sin confirmacion explicita del usuario.
- Si el usuario ha concedido un permiso, mencionarlo naturalmente: "Como me ha autorizado a preparar renovaciones..."
- Si no hay permiso, sugerir activarlo de forma no intrusiva (maximo 1 vez par session).
"""
```

### 5.4 Extension frontend `/dashboard/chat`

```
Modifications au dashboard/chat existant :
├── Quick actions enrichies :
│   ├── "Mes documents qui expirent" (appelle get_expiring_documents)
│   ├── "Readiness check pour [workflow]" (appelle check_readiness)
│   ├── "Stats de mon coffre-fort" (appelle get_vault_stats)
│   └── "Ce que l'assistant a appris" (appelle get_agent_memory)
│
├── ActionConfirmCard.tsx (NOUVEAU composant)
│   ├── S'affiche quand l'agent propose une action Niveau 1+
│   ├── Resume de l'action preparee
│   ├── Bouton "Confirmer" (vert) + "Rejeter" (rouge)
│   ├── Le rejet declenche le learning (memoire correction)
│   └── La confirmation declenche l'execution
│
├── AgentSettingsPanel.tsx (NOUVEAU, accessible via settings chat)
│   ├── Liste des permissions accordees (toggle on/off)
│   ├── Liste des memoires apprises (avec bouton supprimer)
│   ├── Niveau d'autonomie global (0/1/2)
│   └── Bouton "Reinitialiser les apprentissages"
│
├── ProactiveNotification.tsx (NOUVEAU)
│   ├── Badge sur FloatingChatbot quand action proactive prete
│   ├── Mini-card : "J'ai prepare votre renouvellement DNI"
│   └── Actions : "Voir" | "Plus tard" | "Ne plus suggerer"
│
└── Extension FloatingChatbot.tsx
    ├── Badge count = alertes non lues + actions proactives
    └── Click badge → ouvre le chat avec contexte alerte/action
```

---

## 6. SOUS-MODULE D : MEMOIRE COMPORTEMENTALE (Self-Learning)

### 6.1 Table `user_agent_memory`

```sql
CREATE TABLE user_agent_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Type de memoire
    memory_type VARCHAR(30) NOT NULL,
    -- 'preference'    : langue, zone, ville, format prefere
    -- 'behavioral'    : patterns (renouvelle tous les 5 ans, prefere Bata)
    -- 'correction'    : rejets/corrections (a rejete RDV Malabo → prefere Bata)
    -- 'capability'    : ce que l'agent sait faire pour CE user (a deja prepare un passeport)
    -- 'context'       : info contextuelle (travaille dans le secteur petrolier)

    -- Contenu (injecte dans le prompt)
    content TEXT NOT NULL,             -- Description en langage naturel
    content_key VARCHAR(100),          -- Cle technique (preferred_city, renewal_frequency, etc.)
    content_value JSONB,               -- Valeur structuree

    -- Scoring
    confidence NUMERIC(3,2) DEFAULT 0.5,  -- 0.0-1.0 (monte avec confirmations, descend avec rejets)
    confirmation_count INTEGER DEFAULT 0,  -- Nombre de fois confirmee
    rejection_count INTEGER DEFAULT 0,     -- Nombre de fois rejetee

    -- Source d'apprentissage
    learned_from VARCHAR(50) NOT NULL,     -- 'explicit_feedback', 'action_confirmed', 'action_rejected',
                                           -- 'preference_detected', 'pattern_detected', 'conversation_analysis'
    source_conversation_id UUID,           -- Conversation qui a declenche l'apprentissage

    -- Lifecycle
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,              -- Derniere injection dans le prompt
    expires_at TIMESTAMPTZ,                -- Auto-expiration (NULL = indefini)

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_uam_user_active ON user_agent_memory(user_id, is_active, confidence DESC)
    WHERE is_active = TRUE;
CREATE UNIQUE INDEX idx_uam_user_key ON user_agent_memory(user_id, content_key)
    WHERE is_active = TRUE AND content_key IS NOT NULL;
```

### 6.2 Table `user_agent_permissions`

```sql
CREATE TABLE user_agent_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    permission_type VARCHAR(50) NOT NULL,
    -- 'prepare_renewal'       : preparer des renouvellements
    -- 'prepare_request'       : preparer des demandes
    -- 'suggest_appointments'  : suggerer des RDV
    -- 'proactive_alerts'      : alertes proactives (toujours active par defaut)
    -- 'auto_classify'         : classifier automatiquement les documents uploades

    scope VARCHAR(100),                -- NULL = tous workflows, sinon workflow_code specifique
    level INTEGER DEFAULT 1,           -- 1 = preparatoire, 2 = proactif

    -- Tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,

    -- Lifecycle
    is_active BOOLEAN DEFAULT TRUE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,

    UNIQUE(user_id, permission_type, scope)
);
```

### 6.3 Learning loop (dans `chatbot_service_rag.py`)

```python
async def _post_interaction_learning(
    self,
    db: asyncpg.Connection,
    user_id: str,
    conversation_id: str,
    user_message: str,
    assistant_response: str,
    tool_calls: List[Dict],
    tool_results: List[Dict],
    user_feedback: Optional[str] = None,  # 'positive', 'negative', None
):
    """
    Boucle d'apprentissage post-interaction.
    Appele APRES chaque reponse de l'assistant.
    """
    if not user_id or not db:
        return

    # 1. Detecter les preferences depuis les tool calls
    for tool_call in tool_calls:
        if tool_call["name"] == "check_readiness":
            # User a demande readiness pour un workflow → pattern
            await self._learn_memory(db, user_id, {
                "type": "behavioral",
                "key": f"interested_in_{tool_call['args']['workflow_code']}",
                "content": f"Usuario interesado en tramite: {tool_call['args']['workflow_code']}",
                "learned_from": "pattern_detected",
                "conversation_id": conversation_id,
            })

        if tool_call["name"] == "list_vault_documents" and tool_call["args"].get("workflow_code"):
            await self._learn_memory(db, user_id, {
                "type": "behavioral",
                "key": f"workflow_focus_{tool_call['args']['workflow_code']}",
                "content": f"Usuario busca documentos para: {tool_call['args']['workflow_code']}",
                "learned_from": "pattern_detected",
                "conversation_id": conversation_id,
            })

    # 2. Renforcer/affaiblir les memoires utilisees
    if user_feedback == "positive":
        # Les memoires injectees dans cette conversation sont renforcees
        await db.execute("""
            UPDATE user_agent_memory
            SET confidence = LEAST(confidence + 0.1, 1.0),
                confirmation_count = confirmation_count + 1,
                last_used_at = NOW(),
                updated_at = NOW()
            WHERE user_id = $1 AND is_active = TRUE AND last_used_at > NOW() - INTERVAL '5 minutes'
        """, user_id)

    elif user_feedback == "negative":
        await db.execute("""
            UPDATE user_agent_memory
            SET confidence = GREATEST(confidence - 0.2, 0.0),
                rejection_count = rejection_count + 1,
                updated_at = NOW()
            WHERE user_id = $1 AND is_active = TRUE AND last_used_at > NOW() - INTERVAL '5 minutes'
        """, user_id)

    # 3. Nettoyer les memoires a faible confiance
    await db.execute("""
        UPDATE user_agent_memory
        SET is_active = FALSE, updated_at = NOW()
        WHERE user_id = $1 AND confidence < 0.2 AND rejection_count >= 3
    """, user_id)


async def _learn_memory(
    self,
    db: asyncpg.Connection,
    user_id: str,
    memory: Dict[str, Any]
):
    """Cree ou renforce une memoire."""
    await db.execute("""
        INSERT INTO user_agent_memory (
            user_id, memory_type, content, content_key,
            learned_from, source_conversation_id, confidence
        ) VALUES ($1, $2, $3, $4, $5, $6, 0.5)
        ON CONFLICT (user_id, content_key) WHERE is_active = TRUE
        DO UPDATE SET
            confirmation_count = user_agent_memory.confirmation_count + 1,
            confidence = LEAST(user_agent_memory.confidence + 0.1, 1.0),
            last_used_at = NOW(),
            updated_at = NOW()
    """, user_id, memory["type"], memory["content"],
        memory.get("key"), memory["learned_from"],
        memory.get("conversation_id"))


async def _build_memory_context(
    self,
    db: asyncpg.Connection,
    user_id: str
) -> str:
    """
    Construit le contexte memoire a injecter dans le system prompt.
    Limite a ~1500 tokens (15-20 memoires max).
    """
    memories = await db.fetch("""
        SELECT content, memory_type, confidence
        FROM user_agent_memory
        WHERE user_id = $1 AND is_active = TRUE AND confidence >= 0.4
        ORDER BY confidence DESC, last_used_at DESC NULLS LAST
        LIMIT 15
    """, user_id)

    if not memories:
        return "No hay memorias aprendidas todavia."

    lines = []
    for m in memories:
        emoji = {"preference": "⚙️", "behavioral": "📊", "correction": "⚠️",
                 "capability": "✅", "context": "📋"}.get(m["memory_type"], "•")
        lines.append(f"- {emoji} {m['content']} (confianza: {m['confidence']:.0%})")

    return "\n".join(lines)
```

---

## 7. SOUS-MODULE E : AGENT PROACTIF (CRON)

### 7.1 Service proactif

```python
# proactive_agent_service.py — Execute par CRON quotidien (06:00 UTC)

async def daily_proactive_scan():
    """
    Scan quotidien pour preparer des actions proactives.
    UNIQUEMENT pour les utilisateurs qui ont accorde la permission Niveau 2.
    """
    async with get_db_connection() as db:
        # 1. Trouver les users avec permission proactive + docs expirants
        users_with_expiring = await db.fetch("""
            SELECT DISTINCT ud.user_id, ud.id as document_id,
                   ud.document_type, ud.display_name, ud.expiry_date,
                   uap.scope as permitted_scope
            FROM user_documents ud
            JOIN user_agent_permissions uap ON uap.user_id = ud.user_id
                AND uap.permission_type = 'prepare_renewal'
                AND uap.level >= 2
                AND uap.is_active = TRUE
            WHERE ud.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
              AND ud.status = 'active'
              AND ud.deleted_at IS NULL
              AND NOT EXISTS (
                  -- Pas deja une alerte proactive non dismissee
                  SELECT 1 FROM user_document_alerts uda
                  WHERE uda.user_document_id = ud.id
                    AND uda.alert_type = 'proactive_preparation'
                    AND uda.is_dismissed = FALSE
              )
        """)

        for row in users_with_expiring:
            # Verifier readiness
            readiness = await check_readiness(
                str(row["user_id"]), row["document_type"], db=db
            )

            if readiness.get("can_start"):
                # Creer une alerte proactive avec lien vers preparation
                await db.execute("""
                    INSERT INTO user_document_alerts (
                        user_id, user_document_id, alert_type, severity,
                        title_es, title_fr, title_en,
                        message_es, message_fr, message_en,
                        suggested_action, action_params, trigger_date
                    ) VALUES ($1, $2, 'proactive_preparation', 'info',
                        $3, $4, $5, $6, $7, $8,
                        'start_renewal', $9::jsonb, CURRENT_DATE
                    )
                """, row["user_id"], row["document_id"],
                    f"Renovacion preparada: {row['display_name'] or row['document_type']}",
                    f"Renouvellement prepare: {row['display_name'] or row['document_type']}",
                    f"Renewal prepared: {row['display_name'] or row['document_type']}",
                    f"Su {row['display_name'] or row['document_type']} expira el {row['expiry_date']}. "
                    f"Todos los documentos estan listos. ¿Desea iniciar la renovacion?",
                    f"Votre {row['display_name'] or row['document_type']} expire le {row['expiry_date']}. "
                    f"Tous les documents sont prets. Voulez-vous demarrer le renouvellement ?",
                    f"Your {row['display_name'] or row['document_type']} expires on {row['expiry_date']}. "
                    f"All documents are ready. Would you like to start the renewal?",
                    json.dumps({
                        "document_id": str(row["document_id"]),
                        "workflow_code": row["document_type"],
                        "readiness_score": readiness["readiness_score"]
                    }),
                )

                # Envoyer notification push
                await send_push_notification(
                    user_id=row["user_id"],
                    title="Facil Assistant",
                    body=f"Renouvellement prepare pour {row['display_name'] or row['document_type']}",
                    data={"type": "proactive_preparation", "document_id": str(row["document_id"])}
                )
```

---

## 8. SCHEMA DE DONNEES FINAL

### Tables NOUVELLES (4)

```
1. user_documents              — Coffre-fort unifie (V2 identique)
2. user_document_workflow_tags — Tags workflow (V2 identique)
3. user_agent_memory           — Memoire comportementale (NOUVEAU V3)
4. user_agent_permissions      — Permissions autonomie (NOUVEAU V3)
```

### Tables EXISTANTES reutilisees (pas de modification)

```
5. chatbot_conversations       — Conversations (existant)
6. chatbot_user_preferences    — Preferences (existant)
7. user_document_alerts        — Alertes (V2, ajoute proactive_preparation)
8. user_document_access_log    — Audit trail (V2 identique)
```

---

## 9. PLAN D'IMPLEMENTATION PRO (3 PHASES)

### Phase 1 : COFFRE-FORT + EXTENSION GEMINI + INTEGRATION ASSISTANT

```
BACKEND :
[ ] Migration SQL unique : tables user_documents, user_document_workflow_tags,
    user_document_access_log, user_document_alerts, user_agent_memory, user_agent_permissions
[ ] Extension GeminiDocumentProcessor : post_process_for_vault()
[ ] Module user_documents/ : routes CRUD complet, upload, quota 100Mo, download, search, stats
[ ] Auto-import hook dans wizard_session_service (wizard → coffre-fort)
[ ] Auto-import documents generes (recus, certificats)
[ ] 7 nouveaux tools dans chatbot_tools_authenticated.py
[ ] Extension system prompt (vault context + memory context + autonomy rules)
[ ] Deduplication SHA-256, versioning, bulk actions
[ ] Thumbnail generation async
[ ] Tests complets (models, repository, routes, tools)

FRONTEND :
[ ] Module user-documents/ complet (4 tabs, cards, filtres, search, preview)
[ ] Integration /dashboard/chat : quick actions enrichies
[ ] ActionConfirmCard.tsx dans le chat
[ ] AgentSettingsPanel.tsx (permissions + memoire)
[ ] Extension FloatingChatbot (badge alertes)
[ ] Integration wizard : bouton "Depuis Mes Documents"
[ ] i18n : es/fr/en complet
```

### Phase 2 : MEMOIRE COMPORTEMENTALE + AGENT PROACTIF

```
BACKEND :
[ ] Learning loop dans chatbot_service_rag.py (_post_interaction_learning)
[ ] Memory builder (_build_memory_context) inject dans chaque requete
[ ] Memory CRUD (create, reinforce, weaken, deactivate)
[ ] Permission management endpoints
[ ] Proactive agent service (CRON quotidien)
[ ] Integration alertes proactives avec module communications
[ ] Tests learning loop (10+ scenarios)

FRONTEND :
[ ] ProactiveNotification.tsx
[ ] Extension AgentSettingsPanel : niveau autonomie, historique memoires
[ ] Vue "Ce que l'assistant a appris" (transparence)
[ ] Boutons revocation permissions
[ ] Onboarding agent (premiere utilisation)
```

### Phase 3 : POLISH + PERFORMANCE + SECURITY

```
[ ] Performance testing : 1M users, 8M documents simulation
[ ] Security audit OWASP : penetration testing
[ ] Firebase storage rules mises a jour
[ ] Memory decay : CRON nettoyage memoires faible confiance
[ ] Rate limiting actions proactives (max 3/semaine)
[ ] Export ZIP async
[ ] Tests E2E : flux complet (upload → classification → alerte → proactive → wizard reuse)
[ ] Documentation API Swagger
```

---

## RESUME V3

| Aspect | V1 | V2 | V3 |
|--------|----|----|-----|
| Modules backend | 4 nouveaux | 2 + 1 ext | **1 + 3 extensions** |
| Assistant | Module separe | Module separe | **Extension existant** |
| Tables nouvelles | 8 | 6 | **4** (+ 4 existantes reutilisees) |
| Tools IA | 15 nouveaux | 15 nouveaux | **7 nouveaux** + 19 existants |
| Learning | Aucun | Aucun | **Memoire comportementale** |
| Proactivite | Alertes CRON | Alertes CRON | **Agent proactif + preparation auto** |
| Autonomie | 3 niveaux fixes | 3 niveaux fixes | **Progressive consentie** (0→1→2) |
| Gemini | 2.0 Flash | 2.0 Flash | **2.5 Flash** (existant, thinking budget) |

**Code nouveau estime : ~2000 lignes backend + ~1500 lignes frontend**
(vs ~4000 V1, vs ~2500 V2)

---

*Rapport V3 — 2026-04-05 — Post-critique self-learning + enrichissement assistant existant*
