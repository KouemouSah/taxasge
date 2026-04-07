# PLAN : Agent Workflow Orchestrator

**Date** : 2026-04-07
**Statut** : PLANIFICATION
**Prerequis** : Module "Mes Documents" + Assistant enrichi (COMPLETE)

---

## PROBLEME

L'agent IA actuel est NIVEAU 0 (informationnel). Il retourne des liens et des infos mais ne FAIT rien. L'utilisateur peut deja faire tout ca via les menus. L'agent n'apporte ZERO valeur ajoutee.

## OBJECTIF

Un agent NIVEAU 2 qui :
1. **Cree** une wizard session programmatiquement
2. **Selectionne** le workflow + solicitud_type + motivo selon la demande
3. **Charge** les documents depuis le coffre-fort (sans re-upload)
4. **Pre-remplit** les formulaires avec les donnees extraites
5. **Presente** un resume a l'utilisateur pour confirmation
6. **Redirige** vers le wizard a l'etape de verification (pas l'etape 1)

L'utilisateur gagne : skip les 5 premieres etapes du wizard (selection, upload, extraction).

---

## ARCHITECTURE

```
Utilisateur : "Prepare mon renouvellement de passeport"
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│  CHATBOT : detecte intent → appelle tool                │
│  auto_prepare_wizard(workflow="PASAPORTE_RENOVACION")   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  TOOL auto_prepare_wizard (NOUVEAU)                     │
│                                                         │
│  1. Determine workflow_code + solicitud_type + motivo    │
│     - "renouvellement passeport" → PASAPORTE_RENOVACION │
│     - solicitud_type = "renovacion"                     │
│     - motivo = VENCIMIENTO (par defaut, ou demande)     │
│                                                         │
│  2. Verifie readiness (documents coffre-fort)            │
│     - Appelle check_readiness() existant                │
│     - Si documents manquants → retourne liste manquants │
│       + "Voulez-vous continuer sans ces documents ?"    │
│                                                         │
│  3. Cree wizard session                                 │
│     - POST /wizard-sessions (interne, meme process)     │
│     - session_id genere                                 │
│                                                         │
│  4. Charge documents depuis coffre-fort                  │
│     - Pour chaque doc disponible dans user_documents:   │
│       a. Download fichier depuis Firebase (signed URL)  │
│       b. POST /wizard-sessions/{id}/documents/preview   │
│       c. Si confidence > 0.85 → auto-confirm            │
│       d. Sinon → marque pour revision utilisateur       │
│                                                         │
│  5. Pre-remplit form_data                                │
│     - Aggrege extracted_data de tous les documents      │
│     - PUT /wizard-sessions/{id}/form-data               │
│                                                         │
│  6. Retourne resume au chatbot                           │
│     - session_id                                        │
│     - documents charges (N/M)                           │
│     - documents necessitant revision                    │
│     - formulaire pre-rempli (% completion)              │
│     - lien vers wizard a l'etape de verification        │
│     - tarif estime                                      │
│     - action: { type: "open_wizard", url, session_id }  │
└─────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  CHATBOT : formate la reponse                           │
│                                                         │
│  "J'ai prepare votre renouvellement de passeport :      │
│   ✅ 3/3 documents charges depuis votre coffre-fort     │
│   ✅ Formulaire pre-rempli (85%)                        │
│   💰 Tarif estime : 7,500 XAF                          │
│   📋 Il reste a verifier les informations extraites     │
│                                                         │
│   [Ouvrir le wizard pour finaliser ↗]  ← bouton action │
│  "                                                      │
└─────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  FRONTEND : l'utilisateur clique le bouton              │
│  → Redirige vers /wizard/session/{session_id}           │
│  → Le wizard detecte que les docs sont deja charges     │
│  → Saute directement a l'etape form_review              │
│  → L'utilisateur verifie, corrige si besoin             │
│  → Continue vers paiement + RDV normalement             │
└─────────────────────────────────────────────────────────┘
```

---

## COMPOSANTS A CREER

### Backend (3 fichiers)

#### 1. Nouveau tool chatbot : `auto_prepare_wizard`
**Fichier** : `chatbot_tools_authenticated.py` (extension)

```python
async def auto_prepare_wizard(db, **kwargs) -> dict:
    """
    [NIVEAU 2] Prepare automatiquement une wizard session
    avec documents du coffre-fort et formulaire pre-rempli.

    Params:
        workflow_code: str — "PASAPORTE_RENOVACION" ou nom en langage naturel
        solicitud_type: str — "expedicion", "renovacion", "duplicado"
        motivo: str — "VENCIMIENTO", "PERDIDA", "ROBO", "DETERIORO"
        skip_missing_docs: bool — continuer meme si docs manquants

    Returns:
        session_id, documents_loaded, form_completion_pct,
        estimated_cost, wizard_url, requires_user_action
    """
```

**Complexite** : ~200 lignes. Utilise les services existants :
- `wizard_session_service.start_session()`
- `wizard_session_service.preview_document()`
- `wizard_session_service.confirm_document()`
- `wizard_session_service.save_form_data()`
- `user_documents_repository.find_for_workflow()`

#### 2. Service d'orchestration : `workflow_orchestrator_service.py`
**Fichier** : `packages/backend/app/modules/user_documents/services/workflow_orchestrator_service.py`

Separe la logique du tool pour reutilisabilite :
- `prepare_wizard_from_vault()` — cree session + charge docs + pre-remplit
- `_resolve_workflow()` — traduit langage naturel → workflow_code + params
- `_load_vault_documents()` — download + upload vers session
- `_auto_fill_form_data()` — aggrege extracted_data → form_data

#### 3. FunctionDeclaration Gemini
**Fichier** : `chatbot_tools.py` (extension)

```python
FunctionDeclaration(
    name="auto_prepare_wizard",
    description="Préparer automatiquement une demande de service en chargeant les documents depuis le coffre-fort numérique de l'utilisateur. UTILISER quand l'utilisateur dit 'prépare ma demande de...', 'je veux renouveler mon...', 'initie mon dossier de...'",
    parameters={
        "type": "object",
        "properties": {
            "workflow_name": {"type": "string", "description": "Nom du trámite en langage naturel"},
            "solicitud_type": {"type": "string", "enum": ["expedicion", "renovacion", "duplicado"]},
            "motivo": {"type": "string", "enum": ["VENCIMIENTO", "PERDIDA", "ROBO", "DETERIORO"]},
        },
        "required": ["workflow_name"],
    },
)
```

### Frontend (2 modifications)

#### 1. Rendu du bouton action dans MessageItem
Le `MessageItem` supporte deja `ChatAction` avec `type: "start_workflow"` et `url`. Verifier qu'il rend un bouton cliquable.

#### 2. Wizard : detecter session pre-remplie
Le wizard doit detecter qu'une session a deja des documents et sauter les etapes completees. Probablement deja gere par le step management existant.

---

## CE QUE L'UTILISATEUR VERRA

### Scenario 1 : Tout est pret (tous les documents dans le coffre-fort)

```
User: "Prepare mon renouvellement de passeport"
Agent: [appelle auto_prepare_wizard]
       [cree session, charge 3 docs, pre-remplit formulaire]

Agent: "J'ai préparé votre renouvellement de passeport :
        ✅ 3/3 documents chargés (DIP, Passeport ancien, Photo)
        ✅ Formulaire pré-rempli à 90%
        💰 Tarif estimé : 7,500 XAF

        Il reste à vérifier les informations et procéder au paiement.

        [Finaliser ma demande →]"

User: [clique] → redirige vers wizard etape form_review
```

### Scenario 2 : Documents manquants

```
User: "Prepare ma demande de residencia"
Agent: [appelle check_readiness → 8/13 docs]

Agent: "Pour votre demande de résidence, il manque 5 documents :
        ❌ Certificat médical
        ❌ Certificat de bonne conduite
        ❌ Attestation bancaire
        ❌ Cédule personnelle
        ❌ Déclaration jurée

        Voulez-vous :
        1. Préparer avec les 8 documents disponibles (les manquants seront à ajouter dans le wizard)
        2. D'abord ajouter les documents manquants à votre coffre-fort"

User: "Continue avec les 8"
Agent: [appelle auto_prepare_wizard(skip_missing=True)]
       [charge 8 docs, laisse 5 vides]

Agent: "Demande préparée avec 8/13 documents.
        [Finaliser ma demande →] (5 documents à ajouter manuellement)"
```

### Scenario 3 : L'agent demande des precisions

```
User: "Je veux un passeport"
Agent: "Est-ce une première demande (expédition) ou un renouvellement ?"
User: "Renouvellement"
Agent: "Pour quelle raison ? Vencimiento, perte, vol, ou détérioration ?"
User: "Mon passeport expire bientôt"
Agent: [maintenant a toutes les infos]
       [appelle auto_prepare_wizard(
           workflow="PASAPORTE_RENOVACION",
           solicitud_type="renovacion",
           motivo="VENCIMIENTO"
       )]
```

---

## ESTIMATION

| Composant | Effort | Lignes |
|-----------|--------|--------|
| Tool `auto_prepare_wizard` | 1 jour | ~100 |
| Service `workflow_orchestrator_service.py` | 1 jour | ~250 |
| FunctionDeclaration + merge | 30 min | ~30 |
| Frontend bouton action (si pas deja gere) | 2h | ~50 |
| Tests | 1 jour | ~100 |
| **Total** | **3 jours** | **~530** |

---

## RISQUES

| Risque | Mitigation |
|--------|------------|
| Session expire pendant preparation (30min) | La preparation prend <30s, pas de risque |
| Documents coffre-fort expires | Verifier expiry_date avant chargement |
| Gemini re-extraction inutile | Les docs du coffre-fort ont deja extraction_data — SKIP Gemini si confidence > 0.85 |
| Formulaire mal pre-rempli | L'utilisateur verifie TOUJOURS avant soumission |
| Permission autonomie | Verifier `user_agent_permissions` Niveau 1+ avant execution |

---

## DEPENDANCES

- Module "Mes Documents" (COMPLETE) — `user_documents_repository.find_for_workflow()`
- Wizard session service (EXISTANT) — `start_session()`, `preview_document()`, etc.
- Chatbot tools (EXISTANT) — merge dans CHATBOT_AUTH_FUNCTION_MAP
- Frontend MessageItem actions (EXISTANT) — `ChatAction` rendering

---

## PHASES

### Phase 1 : Tool basique (1.5 jours)
- [x] `auto_prepare_wizard` tool dans chatbot_tools_authenticated.py (40 lignes)
- [x] `workflow_orchestrator_service.py` — logique metier complete (350 lignes)
      - _resolve_workflow() : natural language → workflow_code + params (map + DB fallback)
      - _check_vault_readiness() : compare vault docs vs workflow_document_requirements
      - _create_wizard_session() : appelle wizard_session_service.start_session()
      - _load_vault_documents_into_session() : download Firebase → preview → auto-confirm si >85%
      - _pre_fill_form_data() : merge extracted_data → form_data
- [x] FunctionDeclaration dans chatbot_tools.py + merge CHATBOT_AUTH_FUNCTION_MAP
- [ ] Test avec vrai utilisateur — NON FAIT (necessite documents dans le coffre-fort)

### Phase 2 : UX avancee (1 jour)
- [x] Gestion documents manquants — retourne status "missing_documents" avec liste + choix skip
- [x] Detection automatique solicitud_type + motivo — WORKFLOW_NAME_MAP + SOLICITUD_TYPE_MAP + MOTIVO_MAP
- [x] Bouton action dans la reponse chatbot :
      - ChatResponse.actions field ajoute au Pydantic model
      - API route passe actions au frontend
      - _extract_actions_from_tools() gere auto_prepare_wizard + prepare_renewal
      - ChatAction type etendu avec 'open_wizard'
      - MessageItem rend le bouton avec icone ExternalLink
- [ ] Wizard saute les etapes pre-remplies — NON FAIT
      Le wizard charge la session normalement. Les docs sont deja uploades et confirmes
      dans la session cache, donc l'utilisateur voit les docs deja charges quand il ouvre
      le wizard. MAIS il ne saute PAS automatiquement a form_review — il montre toutes
      les etapes avec les docs deja remplis. L'UX est acceptable (l'utilisateur peut
      "Next" rapidement) mais pas optimale.

### Phase 3 : Optimisation (0.5 jour)
- [ ] Skip Gemini si extraction_data deja disponible — NON FAIT
      Le preview_document() re-lance Gemini a chaque fois. L'optimisation necessiterait
      de modifier wizard_session_service pour accepter une extraction pre-calculee.
      Impact: ~2s de latence par doc au lieu de 0. Acceptable pour V1.
- [ ] Verification permission agent Niveau 1+ — NON FAIT
      Le tool s'execute sans verifier user_agent_permissions. Tout utilisateur authentifie
      peut l'utiliser. A ajouter en Phase 4 si le systeme de permissions est active.
- [x] Lint check — 0 erreurs (warnings any pre-existants)
- [x] Syntax check Python — tous fichiers valides
- [x] Auto-critique :
      - SQL parameterize ($1, $2) partout ✅
      - User ownership (user_id filter) partout ✅
      - Expiry check sur vault docs ✅
      - Error handling (try/except par doc, continue si echec) ✅
      - Lazy imports (evite circular) ✅
      - Firebase download timeout 30s ✅
- [ ] Tests unitaires du orchestrator — NON FAIT

### Elements NON implementes (Phase 4 future)

| Element | Raison du report |
|---------|-----------------|
| Skip Gemini re-extraction | Necessite modification wizard_session_service (risque regression) |
| Verification permission Niveau 1+ | Systeme de permissions pas encore active pour tous les users |
| Wizard saute etapes pre-remplies | Necessite modification frontend wizard step management |
| Tests unitaires orchestrator | Necessite mock du wizard_session_service (complexe) |
| Test avec vrai utilisateur | Necessite documents dans le coffre-fort (BD vide) |
| Estimation tarif dans la reponse | prepare_for_payment() necessite session complete |

---

*Plan mis a jour le 2026-04-07 — Implementation P1+P2 COMPLETE, P3 partielle*
