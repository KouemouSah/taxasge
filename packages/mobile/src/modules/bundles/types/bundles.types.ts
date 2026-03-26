export interface CommerceType {
  id: string;
  commerce_type: string;
  name_es: string;
  bundle_code: string;
  description_es?: string;
  installment_eligible: boolean;
}

export interface CommerceZone {
  id: string;
  zone_code: string;
  name_es: string;
  zone_tier: string;
  zone_rank?: number;
  description_es?: string;
  display_order?: number;
}

export interface SimulatorFeeItem {
  service_code: string;
  service_name: string;
  amount: string;
  fee_type: string;
  ministry_name?: string;
}

export interface SimulatorFeeGroup {
  fee_type: string;
  label_es?: string;
  items: SimulatorFeeItem[];
  subtotal: string;
}

export interface SimulatorDocument {
  document_template_id: number;
  document_name_es: string;
  is_required: boolean;
}

export interface SimulatorResponse {
  bundle: { name_es: string; commerce_type: string; installment_eligible: boolean };
  zone: { zone_code: string; name_es: string; zone_tier: string };
  fee_groups: SimulatorFeeGroup[];
  grand_total: string;
  currency: string;
  documents: SimulatorDocument[];
}
