/**
 * Service Bundles — Types for commerce zone-based pricing.
 */

export interface CommerceZone {
  id: string;
  zoneCode: string;
  zoneTier: string;
  zoneRank: number;
  nameEs: string;
  descriptionEs?: string;
  displayOrder: number;
}

export interface ServiceBundle {
  id: string;
  bundleCode: string;
  commerceType: string;
  nameEs: string;
  descriptionEs?: string;
  legalReference?: string;
  isActive: boolean;
  installmentEligible: boolean;
  maxInstallments: number;
  installmentFrequency: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  zoneCount: number;
}

export interface BundleItem {
  id: string;
  bundleId: string;
  fiscalServiceId: number;
  zoneId: string;
  ministryId?: number;
  amount: number;
  isFixedAcrossZones: boolean;
  displayOrder: number;
  notes?: string;
  isActive: boolean;
  // Enriched
  serviceCode?: string;
  serviceName?: string;
  ministryName?: string;
}

export interface BundleWithItems {
  bundle: ServiceBundle;
  items: BundleItem[];
  totalAmount: number | string;
  currency: string;
  installmentEligible: boolean;
  maxInstallments: number;
}

export interface ZoneTotal {
  zone: CommerceZone;
  totalAmount: number | string;
  itemCount: number;
}

export interface PricingMatrix {
  bundle: ServiceBundle;
  zones: CommerceZone[];
  items: BundleItem[];
  zoneTotals: ZoneTotal[];
  currency: string;
}

export interface BundleDocument {
  documentTemplateId: number;
  documentNameEs: string;
  templateCode?: string;
  isRequired: boolean;
}

export interface InstallmentPreviewItem {
  installmentNumber: number;
  amountDue: number | string;
  dueDate: string;
  cumulativePaid: number | string;
}

export interface InstallmentPreview {
  bundleCode: string;
  totalAmount: number | string;
  numInstallments: number;
  frequency: string;
  gracePeriodDays: number;
  lateFeeRate: string;
  installments: InstallmentPreviewItem[];
  currency: string;
}

export interface BundleListResponse {
  items: ServiceBundle[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BundleItemCreateInput {
  fiscalServiceId: number;
  zoneId: string;
  ministryId?: number;
  amount: number;
  isFixedAcrossZones?: boolean;
  displayOrder?: number;
  notes?: string;
  isActive?: boolean;
}

export interface BundleCreateInput {
  bundleCode: string;
  commerceType: string;
  nameEs: string;
  descriptionEs?: string;
  legalReference?: string;
  isActive?: boolean;
  installmentEligible?: boolean;
  maxInstallments?: number;
  installmentFrequency?: string;
}

export interface BundleUpdateInput {
  bundleCode?: string;
  commerceType?: string;
  nameEs?: string;
  descriptionEs?: string;
  legalReference?: string;
  isActive?: boolean;
  installmentEligible?: boolean;
  maxInstallments?: number;
  installmentFrequency?: string;
}

export interface CopyZonePricesInput {
  sourceZoneId: string;
  targetZoneId: string;
  multiplier?: number;
}
