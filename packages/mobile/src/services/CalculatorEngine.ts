/**
 * TaxasGE Mobile - Calculator Core Engine
 *
 * Handles all calculation methods based on fiscal_services configuration.
 * Supports 8 calculation methods with strict validation.
 *
 * CRITICAL RULE FOR formula_based METHOD:
 * - ALWAYS get variable names from calculation_config.variables
 * - NEVER parse the formula text to extract variables
 * - Formula text may contain Spanish/French words that are NOT variable names
 * - Any new formula must have calculation_config.variables properly defined
 *
 * Date: 2025-10-21
 */

import { FiscalService } from '../database/services/FiscalServicesService';

// ============================================
// INTERFACES
// ============================================

export interface CalculationInput {
  baseAmount?: number;      // For percentage_based, tiered_rates
  quantity?: number;         // For unit_based, fixed_plus_unit
  customInputs?: Record<string, number>; // For formula_based
}

export interface CalculationResult {
  amount: number;
  breakdown: CalculationBreakdown;
  method: string;
}

export interface CalculationBreakdown {
  baseAmount?: number;
  percentage?: number;
  quantity?: number;
  unitRate?: number;
  tiers?: Array<{
    from: number;
    to: number;
    rate: number;
    amount: number;
  }>;
  formula?: string;
  steps?: string[];
  fixedPart?: number;
  variablePart?: number;
}

export interface RateTier {
  min: number;
  max: number;
  rate: number;
}

// ============================================
// CALCULATOR ENGINE
// ============================================

export class CalculatorEngine {
  /**
   * Main calculation entry point
   */
  calculate(
    service: FiscalService,
    type: 'expedition' | 'renewal',
    inputs?: CalculationInput
  ): CalculationResult {
    const method = service.calculation_method;

    console.log(`[CalculatorEngine] Calculating for service ${service.service_code}, method: ${method}, type: ${type}`);

    switch (method) {
      case 'fixed_expedition':
      case 'fixed_renewal':
      case 'fixed_both':
        return this.calculateFixed(service, type);

      case 'percentage_based':
        if (!inputs?.baseAmount) {
          throw new Error('Base amount is required for percentage-based calculation');
        }
        return this.calculatePercentage(service, inputs.baseAmount);

      case 'tiered_rates':
        if (!inputs?.baseAmount) {
          throw new Error('Base amount is required for tiered rates calculation');
        }
        return this.calculateTiered(service, inputs.baseAmount);

      case 'formula_based':
        if (!inputs?.customInputs) {
          throw new Error('Custom inputs are required for formula-based calculation');
        }
        return this.calculateFormula(service, type, inputs.customInputs);

      case 'unit_based':
        if (!inputs?.quantity) {
          throw new Error('Quantity is required for unit-based calculation');
        }
        return this.calculateUnit(service, inputs.quantity);

      case 'fixed_plus_unit':
        if (!inputs?.quantity) {
          throw new Error('Quantity is required for fixed plus unit calculation');
        }
        return this.calculateFixedPlusUnit(service, type, inputs.quantity);

      default:
        throw new Error(`Unsupported calculation method: ${method}`);
    }
  }

  /**
   * Calculate fixed amount (fixed_expedition, fixed_renewal, fixed_both)
   */
  calculateFixed(
    service: FiscalService,
    type: 'expedition' | 'renewal'
  ): CalculationResult {
    let amount = 0;
    const method = service.calculation_method;

    // Determine which rate to use
    if (method === 'fixed_expedition') {
      amount = service.tasa_expedicion || 0;
    } else if (method === 'fixed_renewal') {
      amount = service.tasa_renovacion || 0;
    } else if (method === 'fixed_both') {
      amount = type === 'expedition'
        ? (service.tasa_expedicion || 0)
        : (service.tasa_renovacion || 0);
    }

    // CRITICAL VALIDATION: Ensure we have a valid amount
    if (!amount || amount === 0) {
      throw new Error(
        `No ${type} amount configured for service ${service.service_code}. ` +
        `Expected: tasa_${type === 'expedition' ? 'expedicion' : 'renovacion'} > 0`
      );
    }

    return {
      amount,
      method,
      breakdown: {
        baseAmount: amount,
        steps: [
          `Method: ${String(method)}`,
          `Type: ${String(type)}`,
          `Amount: ${String(amount)} XAF`,
        ].filter(step => typeof step === 'string' && step.trim() !== ''),
      },
    };
  }

  /**
   * Calculate percentage-based amount
   */
  calculatePercentage(
    service: FiscalService,
    baseAmount: number
  ): CalculationResult {
    // CRITICAL VALIDATION
    if (!service.base_percentage || service.base_percentage <= 0) {
      throw new Error(
        `Missing or invalid base_percentage for service ${service.service_code}. ` +
        `Current value: ${service.base_percentage}`
      );
    }

    if (baseAmount <= 0) {
      throw new Error('Base amount must be greater than 0');
    }

    const percentage = service.base_percentage;
    const amount = baseAmount * (percentage / 100);

    return {
      amount,
      method: 'percentage_based',
      breakdown: {
        baseAmount,
        percentage,
        steps: [
          `Base amount: ${String(baseAmount)} XAF`,
          `Percentage: ${String(percentage)}%`,
          `Calculation: ${String(baseAmount)} × ${String(percentage)}% = ${String(amount)} XAF`,
          (service.percentage_of && typeof service.percentage_of === 'string' && service.percentage_of.trim())
            ? `Applied to: ${String(service.percentage_of)}`
            : '',
        ].filter(step => typeof step === 'string' && step.trim() !== ''),
      },
    };
  }

  /**
   * Calculate tiered rates
   */
  calculateTiered(
    service: FiscalService,
    baseAmount: number
  ): CalculationResult {
    // CRITICAL VALIDATION
    if (!service.rate_tiers) {
      throw new Error(
        `Missing rate_tiers configuration for service ${service.service_code}`
      );
    }

    if (baseAmount <= 0) {
      throw new Error('Base amount must be greater than 0');
    }

    let tiers: RateTier[];
    try {
      tiers = JSON.parse(service.rate_tiers);
      if (!Array.isArray(tiers) || tiers.length === 0) {
        throw new Error('Invalid rate_tiers format');
      }
    } catch (error) {
      throw new Error(
        `Failed to parse rate_tiers for service ${service.service_code}: ${error}`
      );
    }

    // Calculate amount per tier
    const tierBreakdown: Array<{
      from: number;
      to: number;
      rate: number;
      amount: number;
    }> = [];

    let totalAmount = 0;
    const steps: string[] = [`Base amount: ${String(baseAmount)} XAF`, 'Tier breakdown:'];

    // Sort tiers by min value
    const sortedTiers = [...tiers].sort((a, b) => a.min - b.min);

    for (const tier of sortedTiers) {
      if (baseAmount <= tier.min) {
        // Base amount doesn't reach this tier
        continue;
      }

      const applicableAmount = Math.min(baseAmount, tier.max) - tier.min;
      const tierAmount = applicableAmount * (tier.rate / 100);
      totalAmount += tierAmount;

      tierBreakdown.push({
        from: tier.min,
        to: tier.max,
        rate: tier.rate,
        amount: tierAmount,
      });

      steps.push(
        `  ${String(tier.min)} - ${String(tier.max)}: ${String(applicableAmount)} XAF × ${String(tier.rate)}% = ${String(tierAmount)} XAF`
      );
    }

    steps.push(`Total: ${String(totalAmount)} XAF`);

    return {
      amount: totalAmount,
      method: 'tiered_rates',
      breakdown: {
        baseAmount,
        tiers: tierBreakdown,
        steps,
      },
    };
  }

  /**
   * Calculate formula-based amount
   */
  calculateFormula(
    service: FiscalService,
    type: 'expedition' | 'renewal',
    customInputs: Record<string, number>
  ): CalculationResult {
    // Get the appropriate formula
    const formula = type === 'expedition'
      ? service.expedition_formula
      : service.renewal_formula;

    // CRITICAL VALIDATION
    if (!formula) {
      throw new Error(
        `Missing ${type}_formula for service ${service.service_code}`
      );
    }

    // Evaluate the formula
    const amount = this.evaluateFormula(formula, customInputs);

    return {
      amount,
      method: 'formula_based',
      breakdown: {
        formula,
        steps: [
          `Formula: ${String(formula)}`,
          `Inputs: ${String(JSON.stringify(customInputs))}`,
          `Result: ${String(amount)} XAF`,
        ].filter(step => typeof step === 'string' && step.trim() !== ''),
      },
    };
  }

  /**
   * Calculate unit-based amount
   */
  calculateUnit(
    service: FiscalService,
    quantity: number
  ): CalculationResult {
    // CRITICAL VALIDATION
    if (!service.unit_rate || service.unit_rate <= 0) {
      throw new Error(
        `Missing or invalid unit_rate for service ${service.service_code}. ` +
        `Current value: ${service.unit_rate}`
      );
    }

    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const amount = quantity * service.unit_rate;

    return {
      amount,
      method: 'unit_based',
      breakdown: {
        quantity,
        unitRate: service.unit_rate,
        steps: [
          `Quantity: ${String(quantity)} ${String(service.unit_type || 'units')}`,
          `Unit rate: ${String(service.unit_rate)} XAF`,
          `Calculation: ${String(quantity)} × ${String(service.unit_rate)} = ${String(amount)} XAF`,
        ].filter(step => typeof step === 'string' && step.trim() !== ''),
      },
    };
  }

  /**
   * Calculate fixed plus unit amount
   */
  calculateFixedPlusUnit(
    service: FiscalService,
    type: 'expedition' | 'renewal',
    quantity: number
  ): CalculationResult {
    // CRITICAL VALIDATION
    const fixedPart = type === 'expedition'
      ? service.tasa_expedicion
      : service.tasa_renovacion;

    if (!fixedPart || fixedPart <= 0) {
      throw new Error(
        `Missing ${type === 'expedition' ? 'tasa_expedicion' : 'tasa_renovacion'} ` +
        `for service ${service.service_code}`
      );
    }

    if (!service.unit_rate || service.unit_rate <= 0) {
      throw new Error(
        `Missing or invalid unit_rate for service ${service.service_code}`
      );
    }

    if (quantity < 0) {
      throw new Error('Quantity must be 0 or greater');
    }

    const variablePart = quantity * service.unit_rate;
    const amount = fixedPart + variablePart;

    return {
      amount,
      method: 'fixed_plus_unit',
      breakdown: {
        fixedPart,
        quantity,
        unitRate: service.unit_rate,
        variablePart,
        steps: [
          `Fixed part (${String(type)}): ${String(fixedPart)} XAF`,
          `Variable part: ${String(quantity)} × ${String(service.unit_rate)} = ${String(variablePart)} XAF`,
          `Total: ${String(fixedPart)} + ${String(variablePart)} = ${String(amount)} XAF`,
        ].filter(step => typeof step === 'string' && step.trim() !== ''),
      },
    };
  }

  /**
   * Safely evaluate a formula string
   * SECURITY: Uses Function constructor with whitelist validation
   */
  private evaluateFormula(
    formula: string,
    inputs: Record<string, number>
  ): number {
    try {
      // Replace variables with their values
      let evaluableFormula = formula;

      Object.keys(inputs).forEach(key => {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        evaluableFormula = evaluableFormula.replace(
          regex,
          inputs[key]?.toString() || '0'
        );
      });

      // Whitelist only safe mathematical operators
      const safeFormula = evaluableFormula.replace(/[^0-9+\-*/().\s]/g, '');

      // SECURITY: Validate formula doesn't contain dangerous patterns
      if (safeFormula !== evaluableFormula.replace(/\s+/g, ' ').trim()) {
        // Check if the formula looks like descriptive text instead of math
        const hasMultipleWords = formula.split(/\s+/).length > 3;
        const hasOnlyLetters = /^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/.test(formula);

        if (hasMultipleWords && hasOnlyLetters) {
          throw new Error(
            'La fórmula contiene texto descriptivo en lugar de una expresión matemática. ' +
            'Se esperaba una fórmula como "t * CA * RF" con las variables: ' +
            Object.keys(inputs).join(', ')
          );
        }

        throw new Error(
          'Fórmula contiene caracteres inválidos. Solo se permiten: números, +, -, *, /, (, ), y las variables: ' +
          Object.keys(inputs).join(', ')
        );
      }

      // Evaluate using Function constructor (safer than eval)
      const result = new Function(`'use strict'; return (${safeFormula})`)();

      // Validate result
      const amount = parseFloat(result);
      if (isNaN(amount) || !isFinite(amount)) {
        throw new Error('Formula evaluation resulted in invalid number');
      }

      return amount;
    } catch (error) {
      console.error('[CalculatorEngine] Formula evaluation error:', error);
      throw new Error(
        `Failed to evaluate formula: ${formula}. Error: ${error}`
      );
    }
  }

  /**
   * Validate if a service requires calculation (not a simple fixed amount)
   */
  requiresCalculation(service: FiscalService): boolean {
    const method = service.calculation_method;
    return method !== 'fixed_expedition'
      && method !== 'fixed_renewal'
      && method !== 'fixed_both';
  }

  /**
   * Get the formula description for display in the UI
   */
  getFormulaDescription(
    service: FiscalService,
    language: 'es' | 'fr' | 'en' = 'es'
  ): string | undefined {
    if (service.calculation_method !== 'formula_based') {
      return undefined;
    }

    let config: any = null;
    if (service.calculation_config) {
      try {
        if (service.calculation_config === '[object Object]') {
          return undefined;
        }
        config = typeof service.calculation_config === 'string'
          ? JSON.parse(service.calculation_config)
          : service.calculation_config;
      } catch (e) {
        return undefined;
      }
    }

    const descKey = `formula_description_${language}`;
    const description = config?.[descKey];

    return typeof description === 'string' && description.trim() !== ''
      ? description
      : undefined;
  }

  /**
   * Get required input fields for a calculation method with i18n support
   * Enhanced version with advanced features
   */
  getRequiredInputs(
    service: FiscalService,
    language: 'es' | 'fr' | 'en' = 'es'
  ): {
    field: string;
    label: string;
    placeholder: string;
    type: 'number' | 'currency' | 'formula';
    hint?: string;
    unit?: string; // Unit of measurement (e.g., "m²", "km²", "hectares")
    section?: string; // Group section for organization
    order?: number; // Display order
    required?: boolean; // Is this field required?
    min?: number; // Minimum value
    max?: number; // Maximum value
  }[] {
    const method = service.calculation_method;

    const LABELS = {
      baseAmount: {
        es: 'Monto Base',
        fr: 'Montant de Base',
        en: 'Base Amount',
      },
      baseAmountPlaceholder: {
        es: 'Ingrese el monto base',
        fr: 'Entrez le montant de base',
        en: 'Enter base amount',
      },
      quantity: {
        es: 'Cantidad',
        fr: 'Quantité',
        en: 'Quantity',
      },
      quantityPlaceholder: {
        es: 'Ingrese la cantidad',
        fr: 'Entrez la quantité',
        en: 'Enter quantity',
      },
      units: {
        es: 'unidades',
        fr: 'unités',
        en: 'units',
      },
    };

    switch (method) {
      case 'percentage_based':
        // Show configured percentage in hint
        const percentageHintRaw = service.base_percentage
          ? {
              es: `Se aplicará el ${service.base_percentage}%`,
              fr: `${service.base_percentage}% sera appliqué`,
              en: `${service.base_percentage}% will be applied`,
            }[language]
          : undefined;

        // Ensure hint is a valid string or undefined
        const percentageHint = percentageHintRaw && typeof percentageHintRaw === 'string' && percentageHintRaw.trim() !== ''
          ? String(percentageHintRaw)
          : undefined;

        // Ensure label is a valid string
        const percentageLabel = (typeof service.percentage_of === 'string' && service.percentage_of.trim())
          ? service.percentage_of
          : LABELS.baseAmount[language];

        return [
          {
            field: 'baseAmount',
            label: String(percentageLabel),
            placeholder: String(LABELS.baseAmountPlaceholder[language]),
            type: 'currency',
            hint: percentageHint,
          },
        ];

      case 'tiered_rates':
        return [
          {
            field: 'baseAmount',
            label: String(LABELS.baseAmount[language]),
            placeholder: String(LABELS.baseAmountPlaceholder[language]),
            type: 'currency',
          },
        ];

      case 'unit_based':
        const unitType = (typeof service.unit_type === 'string' && service.unit_type.trim())
          ? service.unit_type
          : LABELS.units[language];

        const unitBasedHintRaw = service.unit_rate
          ? {
              es: `${service.unit_rate} XAF por ${unitType}`,
              fr: `${service.unit_rate} XAF par ${unitType}`,
              en: `${service.unit_rate} XAF per ${unitType}`,
            }[language]
          : undefined;

        const unitBasedHint = unitBasedHintRaw && typeof unitBasedHintRaw === 'string' && unitBasedHintRaw.trim() !== ''
          ? String(unitBasedHintRaw)
          : undefined;

        return [
          {
            field: 'quantity',
            label: String(`${LABELS.quantity[language]} (${unitType})`),
            placeholder: String(LABELS.quantityPlaceholder[language]),
            type: 'number',
            hint: unitBasedHint,
          },
        ];

      case 'fixed_plus_unit':
        const unitTypeFixed = (typeof service.unit_type === 'string' && service.unit_type.trim())
          ? service.unit_type
          : LABELS.units[language];

        const fixedPlusUnitHintRaw = service.unit_rate
          ? {
              es: `Precio fijo + ${service.unit_rate} XAF por ${unitTypeFixed}`,
              fr: `Prix fixe + ${service.unit_rate} XAF par ${unitTypeFixed}`,
              en: `Fixed price + ${service.unit_rate} XAF per ${unitTypeFixed}`,
            }[language]
          : undefined;

        const fixedPlusUnitHint = fixedPlusUnitHintRaw && typeof fixedPlusUnitHintRaw === 'string' && fixedPlusUnitHintRaw.trim() !== ''
          ? String(fixedPlusUnitHintRaw)
          : undefined;

        return [
          {
            field: 'quantity',
            label: String(`${LABELS.quantity[language]} (${unitTypeFixed})`),
            placeholder: String(LABELS.quantityPlaceholder[language]),
            type: 'number',
            hint: fixedPlusUnitHint,
          },
        ];

      case 'formula_based':
        // ============================================================
        // CRITICAL: ALWAYS use calculation_config.variables
        // NEVER parse the formula text for variables!
        // Formula text may contain Spanish/French words that are NOT variable names
        // ============================================================
        let config: any = null;
        if (service.calculation_config) {
          try {
            // Check if it's the invalid "[object Object]" string
            if (service.calculation_config === '[object Object]') {
              console.warn('[CalculatorEngine] Invalid calculation_config detected: [object Object]');
              config = null;
            } else {
              config = typeof service.calculation_config === 'string'
                ? JSON.parse(service.calculation_config)
                : service.calculation_config;
            }
          } catch (e) {
            console.warn('[CalculatorEngine] Failed to parse calculation_config:', e);
            config = null;
          }
        }

        // Get variables from calculation_config.variables ONLY
        const variables = config?.variables ? Object.keys(config.variables) : [];

        console.log('[CalculatorEngine] formula_based variables for', service.service_code, ':', variables);

        // Validate that we have variables defined
        if (variables.length === 0) {
          console.error(
            `[CalculatorEngine] No variables defined in calculation_config.variables for service ${service.service_code}. ` +
            `Please ensure calculation_config has a "variables" object.`
          );
          return [];
        }

        // Get formula description from calculation_config
        const formulaDescKey = `formula_description_${language}`;
        const formulaDescription = config?.[formulaDescKey];

        return variables.map(v => {
          const varConfig = config?.variables?.[v];

          // CRITICAL: Ensure label is ALWAYS a valid string
          let label: string = v; // Default to variable name
          const labelFromConfig = varConfig?.[`label_${language}`];
          if (typeof labelFromConfig === 'string' && labelFromConfig.trim() !== '') {
            label = labelFromConfig;
          }

          // Build hint - ensure it's always a string or undefined
          const descriptionFromConfig = varConfig?.[`description_${language}`];
          let hint: string | undefined = undefined;

          if (typeof descriptionFromConfig === 'string' && descriptionFromConfig.trim()) {
            hint = descriptionFromConfig;
          } else if (typeof formulaDescription === 'string' && formulaDescription.trim()) {
            hint = formulaDescription;
          }

          // Extract unit if present
          const unit = varConfig?.unit ? String(varConfig.unit) : undefined;

          // Extract section for grouping
          // CRITICAL: section must be a simple string, not an object
          // If section_XX (language-specific) exists and is a string, use it
          // Otherwise fallback to section if it's a string
          // Reject any objects to prevent [object Object] rendering
          let section: string | undefined = undefined;

          const sectionLangKey = `section_${language}`;
          const sectionLang = varConfig?.[sectionLangKey];
          const sectionBase = varConfig?.section;

          if (typeof sectionLang === 'string' && sectionLang.trim() !== '') {
            section = String(sectionLang);
          } else if (typeof sectionBase === 'string' && sectionBase.trim() !== '') {
            section = String(sectionBase);
          }
          // If section is an object or invalid, leave it undefined

          // Extract order (for sorting)
          const order = typeof varConfig?.order === 'number' ? varConfig.order : undefined;

          // Extract required flag (default to true)
          const required = varConfig?.required !== false; // Default to required

          // Extract min/max validation
          const min = typeof varConfig?.min === 'number' ? varConfig.min : undefined;
          const max = typeof varConfig?.max === 'number' ? varConfig.max : undefined;

          // CRITICAL: Ensure ALL return values are valid strings
          const fieldType: 'number' | 'currency' | 'formula' = varConfig?.type === 'currency' ? 'currency' as const : 'number' as const;

          return {
            field: String(v), // Ensure field is a string
            label: String(label), // Ensure label is a string
            placeholder: String({
              es: `Ingrese ${label}`,
              fr: `Entrez ${label}`,
              en: `Enter ${label}`,
            }[language] || `Enter ${label}`),
            type: fieldType,
            hint: hint && typeof hint === 'string' && hint.trim() !== '' ? String(hint) : undefined,
            unit: unit && typeof unit === 'string' && unit.trim() !== '' ? String(unit) : undefined,
            section: section && typeof section === 'string' && section.trim() !== '' ? String(section) : undefined,
            order: order,
            required: required,
            min: min,
            max: max,
          };
        }).sort((a, b) => {
          // Sort by order if provided, otherwise maintain original order
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          return 0;
        });

      default:
        return [];
    }
  }

  /**
   * DEPRECATED: Do NOT use this function!
   *
   * Extract variable names from a formula string
   *
   * WARNING: This function was used to parse formula text for variables,
   * but it causes issues because formula text may contain Spanish/French
   * words that are NOT variable names.
   *
   * ALWAYS use calculation_config.variables instead!
   *
   * This function is kept here only as a reference of what NOT to do.
   */
  private extractFormulaVariables_DEPRECATED_DO_NOT_USE(formula: string): string[] {
    // Match variable names (alphabetic sequences)
    const matches = formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g);

    if (!matches) {
      return [];
    }

    // Remove duplicates and common math functions
    const commonFunctions = ['Math', 'abs', 'max', 'min', 'floor', 'ceil', 'round'];
    const variables = [...new Set(matches)].filter(
      v => !commonFunctions.includes(v)
    );

    return variables;
  }
}

// Export singleton instance
export const calculatorEngine = new CalculatorEngine();
