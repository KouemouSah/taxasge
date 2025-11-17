/**
 * TaxasGE Mobile - Service Details Service
 * Handles retrieval and formatting of service details (documents, procedures, steps)
 * Date: 2025-11-16
 */

import { DatabaseService } from '../DatabaseService';
import TranslationService from '../../services/TranslationService';

/**
 * Service Document type based on v_service_documents view
 */
export interface ServiceDocument {
  fiscal_service_id: string;
  document_code: string;
  document_name: string;
  document_name_fr?: string;
  document_name_en?: string;
  is_required_expedition: number; // 0 or 1 (SQLite boolean)
  is_required_renewal: number; // 0 or 1
  validity_duration_months: number | null;
}

/**
 * Service Procedure type based on procedure_templates + service_procedure_assignments
 */
export interface ServiceProcedure {
  id: string;
  template_code: string;
  name_es: string;
  name_fr?: string;
  name_en?: string;
  description_es: string | null;
  description_fr?: string;
  description_en?: string;
  category: string | null;
  usage_count: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  // From service_procedure_assignments
  applies_to: 'expedition' | 'renewal' | 'both';
  display_order: number;
}

/**
 * Procedure Step type based on procedure_template_steps
 */
export interface ProcedureStep {
  id: string;
  template_id: string;
  step_number: number;
  description_es: string;
  description_fr?: string;
  description_en?: string;
  instructions_es: string | null;
  instructions_fr?: string;
  instructions_en?: string;
  estimated_duration_minutes: number | null;
  location_address: string | null;
  office_hours: string | null;
  requires_appointment: number; // 0 or 1
  is_optional: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

/**
 * Complete service details response
 */
export interface ServiceCompleteDetails {
  documents: ServiceDocument[];
  procedures: ServiceProcedure[];
  procedureSteps: Map<string, ProcedureStep[]>;
}

/**
 * Get document name based on language
 */
export const getDocumentName = (doc: ServiceDocument, language: 'es' | 'fr' | 'en'): string => {
  if (language === 'fr' && doc.document_name_fr) return doc.document_name_fr;
  if (language === 'en' && doc.document_name_en) return doc.document_name_en;
  return doc.document_name || doc.document_code; // Fallback to Spanish
};

/**
 * Get procedure name based on language
 */
export const getProcedureName = (proc: ServiceProcedure, language: 'es' | 'fr' | 'en'): string => {
  if (language === 'fr' && proc.name_fr) return proc.name_fr;
  if (language === 'en' && proc.name_en) return proc.name_en;
  return proc.name_es || proc.template_code; // Fallback to Spanish
};

/**
 * Get step description based on language
 */
export const getStepDescription = (step: ProcedureStep, language: 'es' | 'fr' | 'en'): string => {
  if (language === 'fr' && step.description_fr) return step.description_fr;
  if (language === 'en' && step.description_en) return step.description_en;
  return step.description_es || `Paso ${step.step_number}`; // Fallback to Spanish
};

/**
 * Get step instructions based on language
 */
export const getStepInstructions = (step: ProcedureStep, language: 'es' | 'fr' | 'en'): string | null => {
  if (language === 'fr' && step.instructions_fr) return step.instructions_fr;
  if (language === 'en' && step.instructions_en) return step.instructions_en;
  return step.instructions_es; // Fallback to Spanish
};

/**
 * Service Details Service Class
 */
class ServiceDetailsService {
  /**
   * Get complete service details (documents + procedures + steps)
   */
  async getCompleteDetails(serviceId: string): Promise<ServiceCompleteDetails> {
    console.log('[ServiceDetailsService] Fetching complete details for service:', serviceId);

    try {
      const db = DatabaseService.getInstance();

      // Load all translations in parallel
      console.log('[ServiceDetailsService] Loading translations...');
      const [documentTranslations, procedureTranslations, stepTranslations] = await Promise.all([
        TranslationService.getTranslationsForEntityType('document_template'),
        TranslationService.getTranslationsForEntityType('procedure_template'),
        TranslationService.getTranslationsForEntityType('procedure_step'),
      ]);
      console.log('[ServiceDetailsService] Translations loaded');

      // Get documents
      const documents = await db.query<ServiceDocument>(
        'SELECT * FROM v_service_documents WHERE fiscal_service_id = ?',
        [serviceId]
      );

      console.log(`[ServiceDetailsService] Found ${documents.length} documents`);

      // Enrich documents with translations
      const enrichedDocuments = documents.map(doc => {
        const trans = documentTranslations[doc.document_code];
        return {
          ...doc,
          document_name_fr: trans?.fr?.name,
          document_name_en: trans?.en?.name,
        };
      });

      // Get procedures
      const procedures = await db.query<ServiceProcedure>(
        `SELECT
          pt.*,
          spa.applies_to,
          spa.display_order
        FROM service_procedure_assignments spa
        JOIN procedure_templates pt ON spa.template_id = pt.id
        WHERE spa.fiscal_service_id = ?
        ORDER BY spa.display_order, pt.template_code`,
        [serviceId]
      );

      console.log(`[ServiceDetailsService] Found ${procedures.length} procedures`);

      // Enrich procedures with translations
      const enrichedProcedures = procedures.map(proc => {
        const trans = procedureTranslations[proc.template_code];
        return {
          ...proc,
          name_fr: trans?.fr?.name,
          name_en: trans?.en?.name,
          description_fr: trans?.fr?.description,
          description_en: trans?.en?.description,
        };
      });

      // Get steps for each procedure
      const procedureSteps = new Map<string, ProcedureStep[]>();

      for (const proc of enrichedProcedures) {
        const steps = await db.query<ProcedureStep>(
          `SELECT * FROM procedure_template_steps
          WHERE template_id = ?
          ORDER BY step_number`,
          [proc.id]
        );

        // Enrich steps with translations
        const enrichedSteps = steps.map(step => {
          const stepCode = `${proc.template_code}:step_${step.step_number}`;
          const trans = stepTranslations[stepCode];
          return {
            ...step,
            description_fr: trans?.fr?.description,
            description_en: trans?.en?.description,
            instructions_fr: trans?.fr?.instructions,
            instructions_en: trans?.en?.instructions,
          };
        });

        procedureSteps.set(proc.id, enrichedSteps);
        console.log(`[ServiceDetailsService] Found ${enrichedSteps.length} steps for procedure ${proc.template_code}`);
      }

      return {
        documents: enrichedDocuments,
        procedures: enrichedProcedures,
        procedureSteps,
      };
    } catch (error) {
      console.error('[ServiceDetailsService] Error fetching complete details:', error);

      // Return empty data on error instead of throwing
      return {
        documents: [],
        procedures: [],
        procedureSteps: new Map(),
      };
    }
  }

  /**
   * Get only documents for a service
   */
  async getDocuments(serviceId: string): Promise<ServiceDocument[]> {
    try {
      const db = DatabaseService.getInstance();

      // Load translations
      const documentTranslations = await TranslationService.getTranslationsForEntityType('document_template');

      const documents = await db.query<ServiceDocument>(
        'SELECT * FROM v_service_documents WHERE fiscal_service_id = ?',
        [serviceId]
      );

      // Enrich with translations
      return documents.map(doc => {
        const trans = documentTranslations[doc.document_code];
        return {
          ...doc,
          document_name_fr: trans?.fr?.name,
          document_name_en: trans?.en?.name,
        };
      });
    } catch (error) {
      console.error('[ServiceDetailsService] Error fetching documents:', error);
      return [];
    }
  }

  /**
   * Get only procedures for a service
   */
  async getProcedures(serviceId: string): Promise<ServiceProcedure[]> {
    try {
      const db = DatabaseService.getInstance();

      // Load translations
      const procedureTranslations = await TranslationService.getTranslationsForEntityType('procedure_template');

      const procedures = await db.query<ServiceProcedure>(
        `SELECT
          pt.*,
          spa.applies_to,
          spa.display_order
        FROM service_procedure_assignments spa
        JOIN procedure_templates pt ON spa.template_id = pt.id
        WHERE spa.fiscal_service_id = ?
        ORDER BY spa.display_order, pt.template_code`,
        [serviceId]
      );

      // Enrich with translations
      return procedures.map(proc => {
        const trans = procedureTranslations[proc.template_code];
        return {
          ...proc,
          name_fr: trans?.fr?.name,
          name_en: trans?.en?.name,
          description_fr: trans?.fr?.description,
          description_en: trans?.en?.description,
        };
      });
    } catch (error) {
      console.error('[ServiceDetailsService] Error fetching procedures:', error);
      return [];
    }
  }

  /**
   * Get steps for a specific procedure template
   */
  async getSteps(templateId: string): Promise<ProcedureStep[]> {
    try {
      const db = DatabaseService.getInstance();

      // Get template_code first
      const template = await db.query<{ template_code: string }>(
        'SELECT template_code FROM procedure_templates WHERE id = ?',
        [templateId]
      );

      if (template.length === 0) {
        console.warn('[ServiceDetailsService] Template not found:', templateId);
        return [];
      }

      const templateCode = template[0].template_code;

      // Load translations
      const stepTranslations = await TranslationService.getTranslationsForEntityType('procedure_step');

      const steps = await db.query<ProcedureStep>(
        `SELECT * FROM procedure_template_steps
        WHERE template_id = ?
        ORDER BY step_number`,
        [templateId]
      );

      // Enrich with translations
      return steps.map(step => {
        const stepCode = `${templateCode}:step_${step.step_number}`;
        const trans = stepTranslations[stepCode];
        return {
          ...step,
          description_fr: trans?.fr?.description,
          description_en: trans?.en?.description,
          instructions_fr: trans?.fr?.instructions,
          instructions_en: trans?.en?.instructions,
        };
      });
    } catch (error) {
      console.error('[ServiceDetailsService] Error fetching steps:', error);
      return [];
    }
  }
}

// Export singleton instance
export const serviceDetailsService = new ServiceDetailsService();

// Export default for convenience
export default serviceDetailsService;
