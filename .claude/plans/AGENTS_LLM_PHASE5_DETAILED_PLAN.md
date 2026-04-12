# Phase 5 — Plan détaillé : Niveau 3 Executive Tools (confirmation_code single-use)

## Objectif

Rendre les tools Level 3 (`submit_prepared_request`, `book_appointment`) utilisables avec consentement **par action** (pas par toggle persistant), conformément à l'architecture OWASP A04 pour actes gouvernementaux. La mécanique repose sur un `confirmation_code` à usage unique stocké en Redis (TTL 5min), scellé par un hash SHA-256 des arguments canonicalisés.

## Contexte critique (rappel)

Migration `287_user_documents_vault.sql` : `user_agent_permissions` CHECK rejette `level=3` et les permission_types `submit_request`/`book_appointment`. → Impossible d'utiliser `user_agent_permissions` pour les tools Level 3. Une **nouvelle table** `agent_executive_audit_log` + cache Redis sont nécessaires.

## Architecture

### Flow end-to-end

```
1. User: "Soumets ma demande de passeport (session abc)"
                ↓ Gemini multi-round
2. Gemini function call: submit_prepared_request(session_id="abc", payment_method="cash")
                ↓ tool (sans confirmation_code)
3. executive_consent.issue_code()
   - Rate limit check (5 codes/h/user)
   - Génère code (secrets.token_urlsafe 24 chars)
   - args_hash = SHA-256(JSON canonique des kwargs sans user_id/confirmation_code)
   - Stocke Redis: key=agent:exec:{user_id}:{code}, value={tool, full_args, args_hash, summary}, TTL 300s
   - Audit log INSERT avec outcome='issued'
   - Return: {status: 'confirmation_required', confirmation_code, summary, tool_name}
                ↓ chatbot_service_rag extrait l'action
4. Action émise: {type: 'confirm_executive', confirmation_code, summary, tool_name, label_key}
                ↓ frontend MessageItem dispatcher
5. User clique bouton "Confirmer et exécuter" → ExecutiveConfirmModal ouvre
6. Modal affiche summary + bouton Confirmer (destructive variant)
7. Confirm → POST /chatbot/execute-confirmed {confirmation_code}
                ↓ backend endpoint
8. executive_consent.redeem_code()
   - Récupère {tool, full_args, args_hash} de Redis
   - Compare args_hash stocké vs recalculé (prévient replay)
   - DELETE la clé Redis (single-use)
   - Audit log UPDATE avec outcome='redeemed'
   - Dispatch vers le tool '_exec' correspondant (real execution)
9. Result retourné comme un message assistant dans le chat
```

### Composants

**1. Migration `292_agent_executive_audit_log.sql`** (append-only)
```sql
CREATE TABLE agent_executive_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tool_name VARCHAR(64) NOT NULL
        CHECK (tool_name IN ('submit_prepared_request', 'book_appointment')),
    confirmation_code_hash VARCHAR(128) NOT NULL,  -- SHA-256 du code (on ne stocke pas le code en clair)
    args_hash VARCHAR(128) NOT NULL,
    summary TEXT NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    redeemed_at TIMESTAMPTZ,
    outcome VARCHAR(32) NOT NULL DEFAULT 'issued'
        CHECK (outcome IN ('issued', 'redeemed', 'expired', 'invalid_args', 'rate_limited', 'execution_failed')),
    error_message TEXT
);
CREATE INDEX idx_aeal_user_issued ON agent_executive_audit_log(user_id, issued_at DESC);
CREATE INDEX idx_aeal_outcome ON agent_executive_audit_log(outcome);

-- Trigger: interdire les updates qui ne sont pas 'redeemed_at' + 'outcome' + 'error_message'
-- (gardé simple : on accepte UPDATE mais seulement par le service dédié)
```

**2. Config `app/config.py`** — nouveau feature flag
```python
FEATURE_EXECUTIVE_TOOLS: bool = Field(default=False, env="FEATURE_EXECUTIVE_TOOLS")
```

**3. Service `app/modules/chatbot/services/executive_consent.py`** — nouveau fichier
```python
import hashlib
import json
import secrets
from typing import Any, Dict, Optional, Tuple
from loguru import logger
import asyncpg

from app.core.cache import get_cache, check_rate_limit

CONSENT_KEY_PREFIX = "agent:exec_consent"
CONSENT_TTL_SECONDS = 300  # 5 minutes
MAX_PENDING_PER_USER = 5
ALLOWED_TOOLS = {"submit_prepared_request", "book_appointment"}


def canonicalize_args(args: Dict[str, Any]) -> str:
    """Canonical JSON representation for hash stability."""
    # Exclude user_id + confirmation_code from the hash (they're flow-control, not payload)
    filtered = {k: v for k, v in args.items() if k not in ("user_id", "confirmation_code")}
    return json.dumps(filtered, sort_keys=True, separators=(",", ":"), default=str)


def hash_args(args: Dict[str, Any]) -> str:
    return hashlib.sha256(canonicalize_args(args).encode()).hexdigest()


def hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


async def issue_confirmation_code(
    db: asyncpg.Connection,
    user_id: str,
    tool_name: str,
    args: Dict[str, Any],
    summary: str,
) -> Tuple[Optional[str], Optional[str]]:
    """
    Issue a new single-use confirmation code.

    Returns (code, error). On success code is set and error is None.
    On failure code is None and error is a user-facing message key.
    """
    if tool_name not in ALLOWED_TOOLS:
        return None, "executive.tool_not_allowed"

    # Rate limit: 5 pending codes / user / hour
    allowed, _ = await check_rate_limit(
        user_id, "exec_consent_issue", MAX_PENDING_PER_USER, 3600
    )
    if not allowed:
        await _audit_log(db, user_id, tool_name, "", hash_args(args), summary, "rate_limited")
        return None, "executive.rate_limited"

    code = secrets.token_urlsafe(24)
    args_h = hash_args(args)

    cache = get_cache()
    key = f"{CONSENT_KEY_PREFIX}:{user_id}:{code}"
    stored = {
        "tool": tool_name,
        "args": args,
        "args_hash": args_h,
        "summary": summary,
    }
    await cache.set(key, stored, ttl=CONSENT_TTL_SECONDS)

    await _audit_log(db, user_id, tool_name, hash_code(code), args_h, summary, "issued")
    return code, None


async def redeem_confirmation_code(
    db: asyncpg.Connection,
    user_id: str,
    code: str,
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Validate and consume a confirmation code.

    Returns (payload, error). On success payload = {tool, args, summary} and the
    Redis key is DELETED (single-use). On failure payload is None.
    """
    cache = get_cache()
    key = f"{CONSENT_KEY_PREFIX}:{user_id}:{code}"
    stored = await cache.get(key)

    if not stored:
        return None, "executive.code_expired_or_invalid"

    # Re-hash args to defend against cache tampering (defense in depth)
    recomputed = hash_args(stored.get("args", {}))
    if recomputed != stored.get("args_hash"):
        await _audit_log(
            db, user_id, stored.get("tool", "?"),
            hash_code(code), recomputed, stored.get("summary", ""),
            "invalid_args", error="args_hash mismatch on redemption"
        )
        return None, "executive.invalid_args"

    # Single-use: delete immediately (before execution, to prevent double-redeem)
    await cache.delete(key)

    # Mark audit log as redeemed
    await _mark_redeemed(db, user_id, hash_code(code), recomputed)

    return stored, None


async def _audit_log(
    db: asyncpg.Connection,
    user_id: str,
    tool_name: str,
    code_hash: str,
    args_hash: str,
    summary: str,
    outcome: str,
    error: Optional[str] = None,
) -> None:
    """Insert an audit log entry (append-only)."""
    try:
        await db.execute(
            """
            INSERT INTO agent_executive_audit_log
                (user_id, tool_name, confirmation_code_hash, args_hash, summary, outcome, error_message)
            VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)
            """,
            user_id, tool_name, code_hash, args_hash, summary, outcome, error,
        )
    except Exception as e:
        logger.error(f"executive_consent audit_log failed: {e}")


async def _mark_redeemed(db, user_id, code_hash, args_hash) -> None:
    try:
        await db.execute(
            """
            UPDATE agent_executive_audit_log
            SET redeemed_at = NOW(), outcome = 'redeemed'
            WHERE user_id = $1::uuid
              AND confirmation_code_hash = $2
              AND args_hash = $3
              AND outcome = 'issued'
            """,
            user_id, code_hash, args_hash,
        )
    except Exception as e:
        logger.error(f"executive_consent mark_redeemed failed: {e}")
```

**4. Tool rewrites `chatbot_tools_authenticated.py`** — 2-step flow

```python
async def submit_prepared_request(db, **kwargs) -> dict:
    from app.config import get_settings
    settings = get_settings()

    if not settings.FEATURE_EXECUTIVE_TOOLS:
        return {
            "status": "feature_coming_soon",
            "message": "L'envoi automatique ... sera disponible prochainement.",
        }

    from app.modules.chatbot.services.executive_consent import (
        issue_confirmation_code, redeem_confirmation_code,
    )

    user_id = kwargs.get("user_id", "")
    confirmation_code = kwargs.get("confirmation_code")
    session_id = kwargs.get("session_id", "")

    if not user_id or not session_id:
        return {"error": "Se requiere session_id"}

    # Step 1: no code → issue
    if not confirmation_code:
        summary = _build_submit_summary(kwargs)
        code, err = await issue_confirmation_code(
            db, user_id, "submit_prepared_request", kwargs, summary
        )
        if err:
            return {"status": "error", "error_key": err}
        return {
            "status": "confirmation_required",
            "confirmation_code": code,
            "summary": summary,
            "tool_name": "submit_prepared_request",
        }

    # Step 2: code present → redeem + execute
    payload, err = await redeem_confirmation_code(db, user_id, confirmation_code)
    if err:
        return {"status": "error", "error_key": err}

    # Execute the real logic (restored from pre-Phase 4 code, guarded by the redeemed code)
    return await _submit_prepared_request_exec(db, payload["args"])


async def _submit_prepared_request_exec(db, args: dict) -> dict:
    """Real execution — previously inline in submit_prepared_request."""
    user_id = args.get("user_id", "")
    session_id = args.get("session_id", "")
    payment_method = args.get("payment_method", "cash")
    # ... the full logic that existed pre-Phase 4 ...
```

Same pattern for `book_appointment` / `_book_appointment_exec`.

**Note** : On ré-introduit la logique d'exécution qui a été supprimée Phase 4. On peut la retrouver dans `git show ee0e3ab6 -- packages/backend/app/modules/chatbot/services/chatbot_tools_authenticated.py` (ou avant Phase 4 via `14b165b2~1`).

**5. Chatbot service rag** — émission action `confirm_executive`

Dans `_extract_actions_from_tools` (chatbot_service_rag.py :2155+ et :2170+) :
```python
elif fn_name == "submit_prepared_request":
    if result.get("status") == "confirmation_required":
        actions.append({
            "type": "confirm_executive",
            "label": "Confirmer et envoyer",
            "label_key": "chatbot.actions.confirmAndSubmit",
            "confirmation_code": result["confirmation_code"],
            "summary": result["summary"],
            "tool_name": result["tool_name"],
        })
    # ... existing branches
```

**6. Nouveau endpoint `POST /chatbot/execute-confirmed`**

Dans `chatbot_routes.py` :
```python
class ExecuteConfirmedRequest(BaseModel):
    confirmation_code: str
    locale: LanguageCode = "es"

@router.post("/execute-confirmed")
async def execute_confirmed(
    body: ExecuteConfirmedRequest,
    request: Request,
    current_user: UserResponse = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    """Directly redeem an executive confirmation code + run the tool.
    Bypasses Gemini to avoid round-trip and token cost."""
    from app.modules.chatbot.services.chatbot_tools import FUNCTION_REGISTRY

    # Rate limit: 20 redemptions/min/user (normal usage ≤ 1-2/min)
    allowed, _ = await check_rate_limit(
        str(current_user.id), "/chatbot/execute-confirmed", 20, 60
    )
    if not allowed:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    # Probe-read the payload to find which tool to call (without consuming yet)
    # Actually: redeem happens inside the tool itself. Here we dispatch.
    # Call submit_prepared_request with confirmation_code → it redeems + executes
    # But we don't know which tool the code belongs to without reading Redis first.

    from app.modules.chatbot.services.executive_consent import (
        CONSENT_KEY_PREFIX, get_cache,
    )
    cache = get_cache()
    probe_key = f"{CONSENT_KEY_PREFIX}:{current_user.id}:{body.confirmation_code}"
    stored = await cache.get(probe_key)
    if not stored:
        raise HTTPException(status_code=404, detail={"code": "CODE_EXPIRED_OR_INVALID"})

    tool_name = stored["tool"]
    tool_fn = FUNCTION_REGISTRY.get(tool_name)
    if not tool_fn:
        raise HTTPException(status_code=400, detail={"code": "TOOL_NOT_FOUND"})

    # Call the tool with the original args + confirmation_code
    # The tool will redeem from Redis (single-use) + execute
    full_args = {**stored["args"], "user_id": str(current_user.id), "confirmation_code": body.confirmation_code}
    result = await tool_fn(db, **full_args)

    return {"status": "ok", "result": result}
```

**7. Frontend type `ChatAction`** — nouveau type + champs
```typescript
type:
  | 'start_workflow'
  | 'open_wizard'
  | 'open_settings'
  | 'view_pricing'
  | 'view_documents'
  | 'appointment_booked'
  | 'confirm_executive'  // nouveau
// nouveaux champs optionnels
confirmation_code?: string
summary?: string
tool_name?: string
```

**8. Nouveau composant `ExecutiveConfirmModal.tsx`**
```typescript
'use client';
import { AlertDialog, ... } from '@/components/ui/alert-dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary?: string;
  confirmationCode?: string;
  onConfirm: (code: string) => Promise<void>;
}

export function ExecutiveConfirmModal({ open, onOpenChange, summary, confirmationCode, onConfirm }: Props) {
  const t = useTranslations('chatbot.executive');
  const [isExecuting, setIsExecuting] = useState(false);

  const handleConfirm = async () => {
    if (!confirmationCode) return;
    setIsExecuting(true);
    try {
      await onConfirm(confirmationCode);
      onOpenChange(false);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {t('confirmTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-wrap">
            {summary}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isExecuting}>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isExecuting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isExecuting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t('confirmButton')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**9. MessageItem dispatcher** — branch `confirm_executive`
```typescript
if (action.type === 'confirm_executive' && onConfirmExecutive) {
  return (
    <Button
      key={i}
      type="button"
      size="sm"
      variant="destructive"
      className="h-8 text-xs gap-1.5"
      onClick={() => onConfirmExecutive(action)}
    >
      <AlertTriangle className="h-3 w-3" strokeWidth={1.5} />
      {labelText}
    </Button>
  );
}
```

Props ajoutée: `onConfirmExecutive?: (action: ChatAction) => void`.

**10. Dashboard chat page**
- State: `confirmModalOpen`, `confirmModalAction`
- Handler `onConfirmExecutive(action) → ouvre modal avec action data`
- Handler `onModalConfirm(code) → POST /chatbot/execute-confirmed → push message assistant`
- Mount `<ExecutiveConfirmModal>`

**11. API client `chatbot/services/api.ts`** — nouvelle méthode
```typescript
executeConfirmed: async (confirmationCode: string, locale: string): Promise<{status: string; result: unknown}> => {
  const res = await apiClient.post('/chatbot/execute-confirmed', {
    confirmation_code: confirmationCode,
    locale,
  });
  return res.data;
},
```

**12. i18n clés**
`chatbot.actions.confirmAndSubmit` = "Confirmer et exécuter" / "Confirmar y ejecutar" / "Confirm and execute"
`chatbot.executive.confirmTitle` = "Confirmer l'action" / ...
`chatbot.executive.cancel` = "Annuler"
`chatbot.executive.confirmButton` = "Confirmer"

## Scope de cette Phase 5

**DANS Phase 5** :
- Infrastructure complète (migration, service consent, flag, audit log)
- Stubs des tools avec consent flow (renvoient un résultat mock si flag ON)
- Endpoint `/chatbot/execute-confirmed`
- Frontend modal + dispatcher + wiring
- i18n
- Feature flag **OFF par défaut**

**HORS Phase 5 (Phase 5.5 dédiée si besoin)** :
- Restauration de la logique d'exécution réelle `_submit_prepared_request_exec` et `_book_appointment_exec`
- Historique des exécutions dans AgentSettingsPanel
- Tests E2E
- Monitoring

**Justification** : le feature flag OFF protège la prod. Le stub exec renvoie `{status: "executed_stub", message: "Execution réelle disponible prochainement"}`. Dès que la logique réelle est restaurée en 5.5, flip le flag et la feature est active. Cette séparation évite de mélanger **infrastructure de sécurité** et **logique métier** dans le même commit critique.

## Fichiers modifiés / créés

| Fichier | Type | Phase 5 |
|---|---|---|
| `packages/backend/database/migrations/292_agent_executive_audit_log.sql` | NOUVEAU | ✅ |
| `packages/backend/app/config.py` | M (feature flag) | ✅ |
| `packages/backend/app/modules/chatbot/services/executive_consent.py` | NOUVEAU | ✅ |
| `packages/backend/app/modules/chatbot/services/chatbot_tools_authenticated.py` | M (tool rewrites skeletons) | ✅ |
| `packages/backend/app/modules/chatbot/services/chatbot_service_rag.py` | M (action emission) | ✅ |
| `packages/backend/app/modules/chatbot/api/chatbot_routes.py` | M (endpoint) | ✅ |
| `packages/web/src/modules/chatbot/types/index.ts` | M (type `confirm_executive`) | ✅ |
| `packages/web/src/modules/chatbot/components/ExecutiveConfirmModal.tsx` | NOUVEAU | ✅ |
| `packages/web/src/modules/chatbot/components/MessageItem.tsx` | M (dispatcher branch) | ✅ |
| `packages/web/src/app/[locale]/(dashboard)/dashboard/chat/page.tsx` | M (state + handler + mount) | ✅ |
| `packages/web/src/modules/chatbot/services/api.ts` (ou équivalent) | M (executeConfirmed method) | ✅ |
| `packages/web/messages/{fr,es,en}.json` | M (i18n keys) | ✅ |
| Restauration logique `_exec` fonctions | — | 5.5 |
| Historique exécutions dans AgentSettingsPanel | — | 5.5 |

## Checklist Phase 5

### Migration
- [x] `292_agent_executive_audit_log.sql` créée avec CHECK constraints sur tool_name et outcome
- [x] Index `idx_aeal_user_issued` + `idx_aeal_outcome`
- [x] COMMENT SQL sur table + 2 colonnes sensibles

### Backend config
- [x] `FEATURE_EXECUTIVE_TOOLS: bool = False` dans config.py (ligne 444)

### Backend service
- [x] `executive_consent.py` avec `issue_confirmation_code` + `redeem_confirmation_code`
- [x] `canonicalize_args` + `hash_args` + `hash_code` (SHA-256 hex)
- [x] `_audit_log` + `_mark_redeemed` best-effort (non-blocking)
- [x] Rate limit 5/h intégré via `check_rate_limit`
- [x] Single-use `cache.delete` AVANT return (anti-double-redeem)
- [x] `peek_confirmation_code` pour probe-read sans consommer
- [x] `record_execution_failure` pour marquer les erreurs d'exécution

### Backend tools
- [x] `submit_prepared_request` : flag check, 2-step flow, exec stub
- [x] `book_appointment` : flag check, 2-step flow, exec stub
- [x] `_build_submit_summary` helper
- [x] `_build_appointment_summary` helper
- [x] `_submit_prepared_request_exec` / `_book_appointment_exec` stubs (Phase 5.5)

### Backend chatbot_service_rag
- [x] Action emission `confirm_executive` pour `submit_prepared_request.confirmation_required`
- [x] Action emission `confirm_executive` pour `book_appointment.confirmation_required`
- [x] `label_key` `chatbot.actions.confirmAndSubmit`

### Backend endpoint
- [x] `POST /chatbot/execute-confirmed` avec `get_current_user`
- [x] Rate limit 20/min/user
- [x] Probe-read via `peek_confirmation_code`
- [x] Injection `user_id` + `confirmation_code` dans kwargs
- [x] Dispatch via `CHATBOT_AUTH_FUNCTION_MAP`
- [x] Import `BaseModel` + `Field` pydantic ajouté

### Frontend
- [x] Type `confirm_executive` + `confirmation_code`/`summary`/`tool_name` sur `ChatAction`
- [x] Composant `ExecutiveConfirmModal.tsx` avec AlertDialog destructive + Loader + error display
- [x] `MessageItem` branche `confirm_executive` → `onConfirmExecutive(action)` (skip silencieux si absent)
- [x] Dashboard chat page : state `confirmModalOpen` + `pendingAction`, callback `handleConfirmExecutive`, handler `handleExecuteConfirmed`, mount `ExecutiveConfirmModal`
- [x] API client `chatbotApi.executeConfirmed(code, locale)` method
- [x] Push result via `sendMessage` (Phase 5.5 refactorera en push direct assistant message)

### i18n
- [x] `chatbot.actions.confirmAndSubmit` en fr/es/en
- [x] `chatbot.executive.confirmTitle` / `defaultSummary` / `cancel` / `confirmButton` en fr/es/en

### Validation
- [x] Type-check passe — `tsc --noEmit` EXIT=0
- [x] Lint passe — eslint EXIT=0 (0 errors, 35 warnings préexistants `any` hors scope)
- [x] Python syntax OK — `py_compile` sur 5 fichiers backend
- [ ] Test manuel avec `FEATURE_EXECUTIVE_TOOLS=true` local (flow confirm → exec stub) — à valider staging
- [ ] Test sécurité : replay même code (single-use) — à valider staging
- [ ] Test sécurité : rate limit 5/h enforced — à valider staging
- [x] Critique post-implémentation : flag default OFF protège prod, clear code jamais en BD (SHA-256 only), args_hash re-verification, append-only audit log, delete before execution anti-race, fallback gracieux public chat
- [ ] Commit local

## Risques & mitigations

| Risque | Mitigation |
|--------|-----------|
| Feature flag ON accidentel en prod | Default False + tests env CI |
| Redis crash → tous les codes perdus | Acceptable (user re-demande) ; Redis a HA en prod |
| Replay avec args modifiés | args_hash canonicalisé + re-vérifié au redemption |
| Double-redeem (race condition) | DELETE en Redis AVANT execution (atomique) |
| Abuse rate limit (5/h trop haut ?) | Ajustable via config ; 5 = réalisable manuellement, bloque les bots |
| Audit log INSERT bloque le flow | Try/except + log warning, non-blocking |
| Canonicalization ≠ entre issue et redeem | Même fonction `canonicalize_args`, test unitaire |
| `FUNCTION_REGISTRY` non-exposé | À vérifier — si absent, dispatcher inline dans l'endpoint |

## Estimation

- Migration + config + executive_consent service : 30 min
- Tool rewrites (skeletons) : 20 min
- Action emission backend : 10 min
- Endpoint /execute-confirmed : 20 min
- Frontend modal + dispatcher + wiring : 30 min
- i18n + critique + tests : 20 min
- Commit : 2 min
- **Total : ~2h 10min**
