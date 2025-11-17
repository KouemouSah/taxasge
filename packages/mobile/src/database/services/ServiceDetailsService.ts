/**
 * TaxasGE Mobile - Service Details Service
 * Handles retrieval and formatting of service details (documents, procedures, steps)
 * Date: 2025-11-16
 */

import { DatabaseService } from '../DatabaseService';

/**
 * Service Document type based on v_service_documents view
 */
export interface ServiceDocument {
  fiscal_service_id: string;
  document_code: string;
  document_name: string;
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
  description_es: string | null;
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
  instructions_es: string | null;
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
  // For now, only ES is stored in SQLite offline version
  // Translation would come from entity_translations in pro version
  return doc.document_name || doc.document_code;
};

/**
 * Get procedure name based on language
 */
export const getProcedureName = (proc: ServiceProcedure, language: 'es' | 'fr' | 'en'): string => {
  // For now, only ES is stored in SQLite offline version
  return proc.name_es || proc.template_code;
};

/**
 * Get step description based on language
 */
export const getStepDescription = (step: ProcedureStep, language: 'es' | 'fr' | 'en'): string => {
  // For now, only ES is stored in SQLite offline version
  return step.description_es || `Paso ${step.step_number}`;
};

/**
 * Get step instructions based on language
 */
export const getStepInstructions = (step: ProcedureStep, language: 'es' | 'fr' | 'en'): string | null => {
  // For now, only ES is stored in SQLite offline version
  return step.instructions_es;
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

      // Get documents
      const documents = await db.query<ServiceDocument>(
        'SELECT * FROM v_service_documents WHERE fiscal_service_id = ?',
        [serviceId]
      );

      console.log(`[ServiceDetailsService] Found ${documents.length} documents`);

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

      // Get steps for each procedure
      const procedureSteps = new Map<string, ProcedureStep[]>();

      for (const proc of procedures) {
        const steps = await db.query<ProcedureStep>(
          `SELECT * FROM procedure_template_steps
          WHERE template_id = ?
          ORDER BY step_number`,
          [proc.id]
        );

        procedureSteps.set(proc.id, steps);
        console.log(`[ServiceDetailsService] Found ${steps.length} steps for procedure ${proc.template_code}`);
      }

      return {
        documents,
        procedures,
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
      return await db.query<ServiceDocument>(
        'SELECT * FROM v_service_documents WHERE fiscal_service_id = ?',
        [serviceId]
      );
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
      return await db.query<ServiceProcedure>(
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
      return await db.query<ProcedureStep>(
        `SELECT * FROM procedure_template_steps
        WHERE template_id = ?
        ORDER BY step_number`,
        [templateId]
      );
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
