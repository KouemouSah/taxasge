/**
 * Companies feature types — re-exports from api-types + UI-only derived shapes.
 */

import type {
  AddMemberRequest,
  CompanyCreate,
  CompanyInfo,
  CompanyListResponse,
  CompanyMember,
  CompanyMemberRole,
  CompanyResponse,
  CompanySearchResult,
  CompanyUpdate,
  UpdateMemberRoleRequest,
} from '@core/api/api-types';

export type {
  AddMemberRequest,
  CompanyCreate,
  CompanyInfo,
  CompanyListResponse,
  CompanyMember,
  CompanyMemberRole,
  CompanyResponse,
  CompanySearchResult,
  CompanyUpdate,
  UpdateMemberRoleRequest,
};

// ---------------------------------------------------------------------------
// UI-only derived types
// ---------------------------------------------------------------------------

/** Roles a member can be assigned to. `company_owner` is implicit at create time
 *  and never exposed as a picker option (only one owner per company). */
export type AssignableMemberRole =
  | 'company_admin'
  | 'company_accountant'
  | 'company_member';

export const ASSIGNABLE_MEMBER_ROLES: AssignableMemberRole[] = [
  'company_admin',
  'company_accountant',
  'company_member',
];

/** Hardcoded enum of fiscal regimes shown in the Company form picker. */
export type RegimenFiscal = 'bundle' | 'estimacion_objetiva' | 'estimacion_directa' | 'pendiente';

/** Form values used by the create + edit company forms (RHF + zod). */
export interface CompanyFormValues {
  legal_name: string;
  tax_id: string;
  representante_legal: string;
  regimen_fiscal?: RegimenFiscal | null;
  zone_id?: string | null;
  commerce_type?: string | null;
  forma_juridica?: string | null;
  sector_actividad?: string | null;
  address?: string | null;
  city_name?: string | null;
  provincia?: string | null;
  email?: string | null;
  phone?: string | null;
}
