/**
 * Communications Module Types
 * TypeScript interfaces for communications and email templates
 */

// =============================================================================
// TEMPLATE VARIABLE
// =============================================================================

export interface TemplateVariable {
  name: string
  description: string
  example?: string
  required: boolean
}

// =============================================================================
// EMAIL TEMPLATE
// =============================================================================

export interface EmailTemplateBase {
  templateCode: string
  nameEs: string
  nameFr?: string
  nameEn?: string
  subjectEs: string
  subjectFr?: string
  subjectEn?: string
  descriptionEs?: string
  descriptionFr?: string
  descriptionEn?: string
  htmlFilePath: string
  variables: TemplateVariable[]
  category?: string
  isActive: boolean
}

export interface EmailTemplateCreate extends Omit<EmailTemplateBase, 'htmlFilePath'> {
  htmlContent: string
}

export interface EmailTemplateUpdate {
  nameEs?: string
  nameFr?: string
  nameEn?: string
  subjectEs?: string
  subjectFr?: string
  subjectEn?: string
  descriptionEs?: string
  descriptionFr?: string
  descriptionEn?: string
  htmlContent?: string
  variables?: TemplateVariable[]
  category?: string
  isActive?: boolean
}

export interface EmailTemplateResponse extends EmailTemplateBase {
  id: number
  createdAt: string
  updatedAt?: string
  createdBy?: string  // UUID as string
  updatedBy?: string  // UUID as string
  createdByName?: string
  updatedByName?: string
}

export interface EmailTemplatePreview {
  templateCode: string
  htmlContent: string
  variables: TemplateVariable[]
}

export interface EmailTemplateListResponse {
  templates: EmailTemplateResponse[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// =============================================================================
// API REQUEST PARAMS
// =============================================================================

export interface EmailTemplateListParams {
  page?: number
  pageSize?: number
  category?: string
  isActive?: boolean
}

export interface EmailTemplateSearchParams {
  q: string
  page?: number
  pageSize?: number
}

// =============================================================================
// PUSH TEMPLATE
// =============================================================================

export type PlatformEnum = 'all' | 'ios' | 'android' | 'web'

export interface PushTemplateBase {
  templateCode: string
  nameEs: string
  nameFr?: string
  nameEn?: string
  titleEs: string
  titleFr?: string
  titleEn?: string
  bodyEs: string
  bodyFr?: string
  bodyEn?: string
  imageUrl?: string
  iconUrl?: string
  clickAction?: string
  dataPayload?: Record<string, unknown>
  variables?: string[]
  platform: PlatformEnum
  ttlSeconds: number
  isActive: boolean
}

export interface PushTemplateCreate extends PushTemplateBase {}

export interface PushTemplateUpdate {
  nameEs?: string
  nameFr?: string
  nameEn?: string
  titleEs?: string
  titleFr?: string
  titleEn?: string
  bodyEs?: string
  bodyFr?: string
  bodyEn?: string
  imageUrl?: string
  iconUrl?: string
  clickAction?: string
  dataPayload?: Record<string, unknown>
  variables?: string[]
  platform?: PlatformEnum
  ttlSeconds?: number
  isActive?: boolean
}

export interface PushTemplateResponse extends PushTemplateBase {
  id: number
  createdAt: string
  updatedAt?: string
  createdBy?: string  // UUID as string
}

export interface PushTemplateListResponse {
  templates: PushTemplateResponse[]
  total: number
  page: number
  pageSize: number
}

export interface PushNotificationPreview {
  title: string
  body: string
  imageUrl?: string
  iconUrl?: string
  platform: PlatformEnum
  variablesUsed: Record<string, string>
}

export interface PushTemplateListParams {
  page?: number
  pageSize?: number
  isActive?: boolean
  platform?: PlatformEnum
  search?: string
}

export interface PushTemplateStats {
  total: number
  active: number
  inactive: number
  byPlatform: {
    all: number
    ios: number
    android: number
    web: number
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  EmailTemplateBase as EmailTemplate,
}

// Re-export webhook types
export * from './webhook'

// =============================================================================
// SMS TEMPLATE
// =============================================================================

export type SmsTemplateCategory = 'auth' | 'notifications' | 'payments' | 'declarations' | 'reminders' | 'alerts'

export interface SmsTemplateBase {
  templateCode: string
  nameEs: string
  nameFr?: string
  nameEn?: string
  contentEs: string
  contentFr?: string
  contentEn?: string
  variables: string[]
  category: SmsTemplateCategory
  maxSegments: number
  isActive: boolean
}

export interface SmsTemplateCreate extends SmsTemplateBase {}

export interface SmsTemplateUpdate {
  nameEs?: string
  nameFr?: string
  nameEn?: string
  contentEs?: string
  contentFr?: string
  contentEn?: string
  variables?: string[]
  category?: SmsTemplateCategory
  maxSegments?: number
  isActive?: boolean
}

export interface SmsTemplateResponse extends SmsTemplateBase {
  id: number
  createdAt: string
  updatedAt?: string
  createdBy?: string  // UUID as string
  updatedBy?: string  // UUID as string
  contentEsLength?: number
  contentFrLength?: number
  contentEnLength?: number
  contentEsSegments?: number
  contentFrSegments?: number
  contentEnSegments?: number
}

export interface SmsTemplateListResponse {
  templates: SmsTemplateResponse[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SmsCharacterCount {
  content: string
  characterCount: number
  segmentCount: number
  charactersPerSegment: number
  charactersRemaining: number
  usesUnicode: boolean
}

export interface SmsTemplateRenderRequest {
  templateCode: string
  language: 'es' | 'fr' | 'en'
  variables: Record<string, string | number>
}

export interface SmsTemplateRenderResponse {
  templateCode: string
  language: string
  renderedContent: string
  characterCount: number
  segmentCount: number
  variablesUsed: Record<string, string | number>
}

export interface SmsTemplateListParams {
  page?: number
  pageSize?: number
  category?: SmsTemplateCategory
  isActive?: boolean
  search?: string
}

export interface SmsCategoryStats {
  category: SmsTemplateCategory
  totalTemplates: number
  activeTemplates: number
}

// =============================================================================
// USSD CONFIGURATION
// =============================================================================

export type UssdOperator = 'getesa' | 'muni' | 'other_api_sms'

export type MenuActionType =
  | 'balance'
  | 'payment'
  | 'tax_info'
  | 'service_search'
  | 'declaration_status'
  | 'support'
  | 'custom'

export interface MenuOption {
  key: string
  labelEs: string
  labelFr?: string
  labelEn?: string
  nextMenu?: string
  action?: MenuActionType
  actionParams?: Record<string, unknown>
}

export interface MenuNode {
  id: string
  titleEs: string
  titleFr?: string
  titleEn?: string
  options: MenuOption[]
  isRoot?: boolean
  parentMenu?: string
}

export interface UssdConfigBase {
  operatorName: UssdOperator
  operatorCode: string
  shortCode: string
  apiEndpoint?: string
  authConfig?: Record<string, unknown>
  menuStructure: MenuNode[]
  sessionTimeoutSeconds: number
  maxInputLength: number
  isActive: boolean
}

export interface UssdConfigCreate extends UssdConfigBase {}

export interface UssdConfigUpdate {
  operatorName?: UssdOperator
  operatorCode?: string
  shortCode?: string
  apiEndpoint?: string
  authConfig?: Record<string, unknown>
  menuStructure?: MenuNode[]
  sessionTimeoutSeconds?: number
  maxInputLength?: number
  isActive?: boolean
}

export interface UssdConfigResponse extends UssdConfigBase {
  id: number
  createdAt: string
  updatedAt?: string
  createdBy?: string  // UUID as string
}

export interface UssdConfigListParams {
  page?: number
  pageSize?: number
  isActive?: boolean
}

export interface MenuValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  menuCount: number
  optionCount: number
  maxDepth: number
}

export interface UssdConfigListResponse {
  configs: UssdConfigResponse[]
  total: number
  page: number
  pageSize: number
}

export interface UssdOperatorInfo {
  value: UssdOperator
  name: string
  description: string
}
