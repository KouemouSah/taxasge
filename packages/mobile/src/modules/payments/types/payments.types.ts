/**
 * Payment types — aligned with backend Pydantic models in
 * `packages/backend/app/modules/payments/models/payment.py` and
 * `packages/backend/app/modules/service_requests/models/service_request.py:626`
 * (PaymentStatusResponse).
 */

/** Matches `payment_status_enum` in DB + `PaymentStatus` in Pydantic. */
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

/** Matches `payment_method_enum` in DB + `PaymentMethod` in Pydantic. */
export type PaymentMethod =
  | 'mobile_money'
  | 'card'
  | 'bank_transfer'
  | 'cash'
  | 'check'
  | 'bange_wallet';

/** Matches `payment_type_enum` in DB + `PaymentType` in Pydantic. */
export type PaymentType = 'full' | 'partial' | 'installment' | 'complementary';

/** A single payment record. Mirrors `PaymentResponse` (payment.py:97-119). */
export interface Payment {
  id: string;
  user_id: string;
  tax_declaration_id: string | null;
  fiscal_service_id: number | null;
  payment_plan_id: string | null;
  installment_id: string | null;
  base_amount: number;
  penalties: number;
  interest: number;
  /** Total = base + penalties + interest. */
  amount: number;
  currency: string;
  payment_type: PaymentType;
  payment_method: PaymentMethod;
  bank_reference: string | null;
  bank_transaction_id: string | null;
  status: PaymentStatus;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  declaration_type?: string | null;
  fiscal_service_name?: string | null;
  user_email?: string | null;
}

/** Mirrors `PaymentListResponse` (payment.py:121). */
export interface PaymentListResponse {
  payments: Payment[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Response of `GET /service-requests/{request_id}/payment/status`.
 * Mirrors `PaymentStatusResponse` (service_request.py:626).
 */
export interface PaymentStatusPolled {
  status: PaymentStatus;
  paid: boolean;
  payment_id: string | null;
  amount: number | null;
  currency: string;
  payment_method: PaymentMethod | null;
  completed_at: string | null;
}

export interface PaymentsListFilters {
  page: number;
  page_size: number;
  status?: PaymentStatus;
}

/** Statuses considered terminal — polling stops as soon as one is reached. */
export const TERMINAL_PAYMENT_STATUSES: ReadonlySet<PaymentStatus> = new Set([
  'completed',
  'failed',
  'cancelled',
  'refunded',
]);
