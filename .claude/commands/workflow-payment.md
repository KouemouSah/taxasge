# Payment Workflow Command

Implement or enhance payment processing via BANGE Mobile Money API following TaxasGE patterns.

## Context

**BANGE Mobile Money** is the payment gateway for Equatorial Guinea supporting:
- MTN Mobile Money
- Movistar Mobile Money
- Payment confirmation webhooks

## Payment Flow

```
1. Declaration validated → Generate payment invoice
2. Citizen selects payment method → BANGE payment link
3. Citizen enters phone number → BANGE initiates payment
4. Citizen confirms on phone → BANGE processes payment
5. BANGE sends webhook → System confirms payment
6. System generates receipt → Citizen downloads
```

## Instructions

1. **Read .env file** for BANGE credentials: `cat packages/backend/.env | grep BANGE`
2. **Check existing implementation** in `packages/backend/app/services/bange_service.py`
3. **Review webhook endpoint** in `packages/backend/app/api/v1/payments.py`
4. **Test with BANGE sandbox** environment first

## Backend Requirements

### Environment Variables
```bash
# BANGE API Configuration
BANGE_API_URL=https://api.bange.gq/v1
BANGE_API_KEY=your_api_key_here
BANGE_MERCHANT_ID=your_merchant_id
BANGE_WEBHOOK_SECRET=your_webhook_secret
```

### Payment Initiation
```python
# API endpoint: POST /api/v1/payments/initiate
@router.post("/payments/initiate")
async def initiate_payment(
    data: PaymentInitiateRequest,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
) -> PaymentInitiateResponse:
    """
    Initiate BANGE payment.

    Args:
        data: {
            declaration_id: UUID,
            phone_number: str,  # Format: +240XXXXXXXXX
            payment_method: "MTN" | "MOVISTAR"
        }

    Returns:
        {
            payment_id: UUID,
            bange_transaction_id: str,
            amount: Decimal,
            status: "pending",
            expires_at: datetime
        }
    """
    # 1. Validate declaration (status must be "validated")
    # 2. Check amount > 0
    # 3. Create payment record in DB (status: pending)
    # 4. Call BANGE API to initiate payment
    # 5. Save BANGE transaction ID
    # 6. Return payment link/instructions
```

### BANGE API Integration
```python
# services/bange_service.py
class BangeService:
    async def initiate_payment(
        self,
        amount: Decimal,
        phone_number: str,
        payment_method: str,
        reference: str,
        callback_url: str
    ) -> dict:
        """
        Call BANGE API to initiate payment.

        BANGE API Endpoint: POST /payments/initiate
        Request:
        {
            "merchant_id": "...",
            "amount": 50000,
            "currency": "XAF",
            "phone_number": "+240222123456",
            "payment_method": "MTN",
            "reference": "DECL-2025-001",
            "callback_url": "https://taxasge.gq/api/v1/webhooks/bange"
        }

        Response:
        {
            "transaction_id": "BANGE-TXN-123",
            "status": "pending",
            "expires_at": "2025-12-03T12:00:00Z",
            "payment_url": "https://bange.gq/pay/BANGE-TXN-123"
        }
        """
        pass

    async def check_payment_status(
        self,
        transaction_id: str
    ) -> dict:
        """
        Check payment status with BANGE.

        BANGE API Endpoint: GET /payments/{transaction_id}
        Response:
        {
            "transaction_id": "BANGE-TXN-123",
            "status": "completed" | "pending" | "failed" | "cancelled",
            "amount": 50000,
            "paid_at": "2025-12-03T11:30:00Z"
        }
        """
        pass
```

### Webhook Handling
```python
# API endpoint: POST /api/v1/webhooks/bange
@router.post("/webhooks/bange")
async def bange_webhook(
    request: Request,
    db = Depends(get_db)
) -> dict:
    """
    Handle BANGE payment confirmation webhook.

    SECURITY:
    - Verify webhook signature (HMAC-SHA256)
    - Validate transaction ID exists
    - Prevent duplicate processing (idempotency)

    Webhook Payload:
    {
        "transaction_id": "BANGE-TXN-123",
        "merchant_id": "...",
        "amount": 50000,
        "status": "completed",
        "phone_number": "+240222123456",
        "payment_method": "MTN",
        "reference": "DECL-2025-001",
        "paid_at": "2025-12-03T11:30:00Z",
        "signature": "hmac_signature_here"
    }

    Steps:
    1. Verify webhook signature
    2. Find payment record by BANGE transaction_id
    3. Check if already processed (idempotency)
    4. Update payment status to "completed"
    5. Update declaration status to "completed"
    6. Generate official receipt
    7. Send confirmation email to citizen
    8. Return 200 OK (acknowledge webhook)
    """
    # 1. Verify signature
    signature = request.headers.get("X-BANGE-Signature")
    payload = await request.body()
    if not verify_webhook_signature(payload, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # 2. Parse webhook data
    data = await request.json()

    # 3. Process payment confirmation
    await process_payment_confirmation(data, db)

    # 4. Return 200 OK
    return {"status": "ok"}
```

### Security: Webhook Signature Verification
```python
import hmac
import hashlib

def verify_webhook_signature(
    payload: bytes,
    signature: str,
    secret: str = settings.BANGE_WEBHOOK_SECRET
) -> bool:
    """
    Verify BANGE webhook signature.

    BANGE uses HMAC-SHA256 signature.
    """
    expected_signature = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)
```

## Frontend Requirements

### Payment Initiation UI
```typescript
// Payment form component
interface PaymentFormProps {
  declaration: Declaration;
  amount: number;
}

function PaymentForm({ declaration, amount }: PaymentFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'MTN' | 'MOVISTAR'>('MTN');

  const { mutate: initiatePayment, isLoading } = useMutation({
    mutationFn: (data) => api.payments.initiate(data),
    onSuccess: (data) => {
      // Redirect to BANGE payment page or show instructions
      toast.success('Pago iniciado. Complete el pago en su teléfono.');
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      {/* Amount display */}
      {/* Phone number input with validation */}
      {/* Payment method selector (MTN/MOVISTAR) */}
      {/* Submit button */}
    </form>
  );
}
```

### Payment Status Tracking
```typescript
// Poll payment status or use websocket
function PaymentStatus({ paymentId }: { paymentId: string }) {
  const { data: payment } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => api.payments.get(paymentId),
    refetchInterval: (data) => {
      // Stop polling when completed/failed
      return data?.status === 'pending' ? 5000 : false;
    }
  });

  return (
    <div>
      {payment?.status === 'pending' && (
        <div>
          <Spinner />
          <p>Esperando confirmación de pago...</p>
          <p>Complete el pago en su teléfono móvil</p>
        </div>
      )}

      {payment?.status === 'completed' && (
        <div>
          <CheckCircle className="text-green-500" />
          <p>¡Pago confirmado!</p>
          <Button onClick={() => downloadReceipt(payment.receipt_url)}>
            Descargar Recibo
          </Button>
        </div>
      )}

      {payment?.status === 'failed' && (
        <div>
          <XCircle className="text-red-500" />
          <p>Pago fallido. Intente nuevamente.</p>
          <Button onClick={() => retryPayment()}>Reintentar</Button>
        </div>
      )}
    </div>
  );
}
```

## Testing

### Sandbox Testing
```python
# Use BANGE sandbox for testing
BANGE_API_URL=https://sandbox.bange.gq/v1  # Sandbox URL
BANGE_API_KEY=sandbox_key_here

# Test phone numbers (sandbox)
TEST_PHONE_SUCCESS = "+240222000001"  # Always succeeds
TEST_PHONE_FAIL = "+240222000002"     # Always fails
TEST_PHONE_TIMEOUT = "+240222000003"  # Times out
```

### Unit Tests
```python
# tests/test_payments.py
async def test_initiate_payment_success():
    # Mock BANGE API response
    # Call initiate_payment endpoint
    # Assert payment record created
    # Assert BANGE transaction ID saved

async def test_webhook_valid_signature():
    # Create valid webhook payload
    # Generate valid signature
    # Call webhook endpoint
    # Assert payment confirmed

async def test_webhook_invalid_signature():
    # Create webhook payload
    # Use wrong signature
    # Call webhook endpoint
    # Assert 401 Unauthorized

async def test_webhook_idempotency():
    # Send same webhook twice
    # Assert processed only once
```

## Error Handling

### Common Errors
```python
# Payment initiation errors
- Invalid phone number format
- Insufficient funds (from BANGE)
- Payment method not supported
- Network timeout

# Webhook errors
- Invalid signature
- Transaction not found
- Already processed
- Amount mismatch
```

## Checklist

- [ ] BANGE credentials configured in .env
- [ ] Payment initiation endpoint created
- [ ] BANGE service integration completed
- [ ] Webhook endpoint created
- [ ] Webhook signature verification implemented
- [ ] Idempotency check added
- [ ] Payment status polling implemented
- [ ] Receipt generation on success
- [ ] Email notifications sent
- [ ] Frontend payment form created
- [ ] Payment status tracking UI added
- [ ] Error handling for all scenarios
- [ ] Sandbox testing completed
- [ ] Unit tests written
- [ ] Security audit completed
