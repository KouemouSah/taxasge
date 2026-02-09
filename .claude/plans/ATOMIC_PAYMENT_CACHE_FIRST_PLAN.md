# Plan: Atomic Cache-First Payment (persist + pay in one call)

## Context

Le wizard cache-first fait actuellement **2 appels HTTP séquentiels** pour payer :
1. `POST /wizard-sessions/{id}/persist` — crée `service_request` + upload Firebase
2. `POST /service-requests/{id}/payment/initiate` — crée `service_payment` via processeur

**Problème** : Si l'appel #2 échoue, on a un `service_request` orphelin en BD sans paiement.
La session cache est déjà supprimée (appel #1 réussi) → l'utilisateur ne peut pas réessayer proprement.

**Solution** : Un seul endpoint atomique `POST /wizard-sessions/{id}/initiate-payment` qui fait persist + payment dans une seule transaction BD.

## Fichiers à modifier

| Fichier | Action |
|---------|--------|
| `packages/backend/app/modules/service_requests/models/wizard_session.py` | +2 models Pydantic |
| `packages/backend/app/modules/service_requests/services/wizard_session_service.py` | +méthode `initiate_payment()` |
| `packages/backend/app/modules/service_requests/api/wizard_session_routes.py` | +endpoint route |
| `packages/web/src/modules/service-requests/types/wizard-session.ts` | +types TS + transform |
| `packages/web/src/modules/service-requests/services/wizard-session-api.ts` | +méthode API client |
| `packages/web/src/modules/service-requests/hooks/useWizardSession.ts` | +méthode hook |
| `packages/web/src/app/[locale]/(dashboard)/dashboard/service-requests/wizard/session/[sessionId]/page.tsx` | Refactor handleInitiatePayment, cleanup dead code, auto-redirect appointment |

## Étapes d'implémentation

### 1. Backend: Nouveaux models Pydantic (`wizard_session.py`)

Ajouter après `WizardPersistResult` (ligne ~341) :

```python
class WizardInitiatePaymentRequest(BaseModel):
    """Request to atomically persist session + initiate payment."""
    payment_method: str = Field(...)
    phone_number: Optional[str] = Field(None)
    return_url: Optional[str] = Field(None)

class WizardInitiatePaymentResponse(BaseModel):
    """Combined persist + payment result."""
    # Persist
    success: bool
    service_request_id: Optional[UUID] = None
    reference: Optional[str] = None
    # Payment
    payment_id: Optional[str] = None
    payment_reference: Optional[str] = None
    payment_status: Optional[str] = None
    redirect_url: Optional[str] = None
    requires_action: bool = False
    action_type: Optional[str] = None
    message_es: Optional[str] = None
    expires_at: Optional[datetime] = None
    # Workflow capabilities (for frontend navigation)
    requires_appointment: bool = False
    # Errors
    error: Optional[str] = None
    error_code: Optional[str] = None
```

### 2. Backend: Méthode service `initiate_payment()` (`wizard_session_service.py`)

Nouvelle méthode publique sur `WizardSessionService`, après `persist_to_db()`. Réutilise le pattern de `persist_to_db()` mais ajoute l'initiation du paiement dans la même transaction.

**Flow :**
1. Charger session, vérifier status = `READY_FOR_PAYMENT`
2. Valider `PaymentMethod`, vérifier phone si mobile_money
3. Vérifier tariff existe et `total_amount > 0`
4. Marquer session `PAYMENT_INITIATED` (anti double-click)
5. `async with db.transaction():` :
   - Créer `service_request` (via `service_request_repository.create`)
   - Update status → `PAYMENT_PENDING`
   - Upload docs Firebase + créer records documents
   - Construire `PaymentContext` avec le vrai `service_request_id`
   - Appeler `payment_processor_registry.initiate_payment(db, context)`
   - Si `!success` → raise exception → rollback
6. Post-commit : delete session du cache, publish event
7. Return `WizardInitiatePaymentResponse` (inclut `requires_appointment` du workflow)

**Rollback :** Si exception → rollback DB (auto), cleanup Firebase uploads, restaurer session `READY_FOR_PAYMENT` en cache.

**Imports à utiliser (existants dans le projet) :**
- `payment_processor_registry` from `app.modules.payments.services.processors`
- `PaymentContext` from `app.modules.payments.services.processors.base`
- `PaymentMethod` from `app.modules.payments.models.payment`
- `firebase_storage_service` from `app.modules.documents.services.storage_service`

### 3. Backend: Nouveau endpoint (`wizard_session_routes.py`)

```python
@router.post("/{session_id}/initiate-payment",
    response_model=WizardInitiatePaymentResponse)
async def initiate_payment(session_id, body, db, current_user):
    result = await wizard_session_service.initiate_payment(
        session_id=session_id,
        user_id=current_user.id,
        db=db,
        payment_method=body.payment_method,
        phone_number=body.phone_number,
        user_email=current_user.email,
        user_phone=current_user.phone_number,
        user_name=f"{current_user.first_name} {current_user.last_name}".strip(),
    )
    return result
```

### 4. Frontend: Types (`wizard-session.ts`)

Ajouter :
- `BackendInitiatePaymentResponse` (snake_case, inclut `requires_appointment`)
- `InitiatePaymentResult` (camelCase)
- `transformInitiatePayment()` function

### 5. Frontend: API Client (`wizard-session-api.ts`)

```typescript
async initiatePayment(sessionId, paymentMethod, phoneNumber?): Promise<InitiatePaymentResult> {
  const raw = await this.request<BackendInitiatePaymentResponse>(
    `/${sessionId}/initiate-payment`,
    { method: 'POST', body: JSON.stringify({ payment_method, phone_number }) }
  )
  return transformInitiatePayment(raw)
}
```

### 6. Frontend: Hook (`useWizardSession.ts`)

Ajouter `initiatePayment(paymentMethod, phoneNumber?)` au hook. Garder `persistAndPay` pour compatibilité (services gratuits, edge cases).

### 7. Frontend: Page (`page.tsx`) — Logique de redirection post-paiement

**Remplacer `handleInitiatePayment`** : un seul appel atomique + logique de redirection.

**Règles de navigation post-paiement :**
1. Si `result.redirectUrl` → redirect BANGE (l'utilisateur quitte la page)
2. Si `result.requiresAppointment === true` → **avancer automatiquement vers le step appointment**
3. Sinon → redirect vers `/dashboard/service-requests/{requestId}`

```typescript
const handleInitiatePayment = useCallback(async () => {
  // ... validation ...
  const result = await initiatePayment(selectedPaymentMethod, phoneNumber)
  if (!result?.success) { setPaymentError(result?.error || '...'); return }

  setPersistedRequestId(result.serviceRequestId)

  // 1. BANGE redirect
  if (result.redirectUrl) {
    window.location.href = result.redirectUrl
    return
  }

  // 2. Workflow avec appointment → avancer au step appointment
  if (result.requiresAppointment) {
    setCurrentStepIndex((prev) => prev + 1)
    return
  }

  // 3. Sinon → page détail
  router.push(`/${locale}/dashboard/service-requests/${result.serviceRequestId}`)
}, [...])
```

**Supprimer dead code :**
- `handlePersistAndPay` (lignes 388-407)
- Cas payment→appointment dans `handleNext` (lignes 527-535)
- Import `PaymentInitiateResult` (ligne 71)

## Gestion d'erreurs

| Point de défaillance | Comportement | Expérience utilisateur |
|---|---|---|
| Session not found/expired | HTTP 404/410, pas de transaction | Message d'erreur, recommencer |
| Validation errors en session | HTTP 400, session intacte | Retour aux étapes précédentes |
| PaymentMethod invalide | HTTP 400, session intacte | Message d'erreur |
| Transaction BD échoue | Rollback auto, Firebase cleanup, session restaurée | Peut réessayer |
| Firebase upload échoue | Rollback BD, cleanup partiel, session restaurée | Peut réessayer |
| BANGE API échoue | Rollback BD + Firebase, session restaurée | Peut réessayer |

## Compatibilité

- `POST /service-requests/{id}/payment/initiate` (V1) — **inchangé**
- `POST /wizard-sessions/{id}/persist` — **gardé** pour services gratuits (montant=0)
- `persistAndPay` dans le hook — **gardé** comme deprecated

## Vérification

1. **Backend** : Tester avec curl le nouvel endpoint avec `payment_method: "cash"` (pas de BANGE API)
2. **Frontend** : Vérifier que le bouton "Payer" fait UN seul appel réseau
3. **Type-check** : `npm run type-check` dans `packages/web`
4. **Flux appointment** : Workflow Pasaporte → Payment (cash) → vérifie redirection automatique vers appointment step
5. **Flux sans appointment** : Workflow Contrato → Payment (cash) → vérifie redirection vers page détail
6. **Rollback** : Payment method invalide → session restaurée en cache, retry possible
