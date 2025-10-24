/**
 * TaxasGE Mobile - Calculator Core Engine
 *
 * Handles all calculation methods based on fiscal_services configuration.
 * Supports 8 calculation methods with strict validation.
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
          `Method: ${method}`,
          `Type: ${type}`,
          `Amount: ${amount} XAF`,
        ],
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
          `Base amount: ${baseAmount} XAF`,
          `Percentage: ${percentage}%`,
          `Calculation: ${baseAmount} × ${percentage}% = ${amount} XAF`,
          service.percentage_of ? `Applied to: ${service.percentage_of}` : '',
        ].filter(Boolean),
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
    const steps: string[] = [`Base amount: ${baseAmount} XAF`, 'Tier breakdown:'];

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
        `  ${tier.min} - ${tier.max}: ${applicableAmount} XAF × ${tier.rate}% = ${tierAmount} XAF`
      );
    }

    steps.push(`Total: ${totalAmount} XAF`);

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
          `Formula: ${formula}`,
          `Inputs: ${JSON.stringify(customInputs)}`,
          `Result: ${amount} XAF`,
        ],
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
          `Quantity: ${quantity} ${service.unit_type || 'units'}`,
          `Unit rate: ${service.unit_rate} XAF`,
          `Calculation: ${quantity} × ${service.unit_rate} = ${amount} XAF`,
        ],
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
          `Fixed part (${type}): ${fixedPart} XAF`,
          `Variable part: ${quantity} × ${service.unit_rate} = ${variablePart} XAF`,
          `Total: ${fixedPart} + ${variablePart} = ${amount} XAF`,
        ],
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
        throw new Error('Formula contains invalid characters');
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
   * Get required input fields for a calculation method
   */
  getRequiredInputs(service: FiscalService): {
    field: string;
    label: string;
    type: 'number' | 'currency' | 'formula';
  }[] {
    const method = service.calculation_method;

    switch (method) {
      case 'percentage_based':
        return [
          {
            field: 'baseAmount',
            label: service.percentage_of || 'Base Amount',
            type: 'currency',
          },
        ];

      case 'tiered_rates':
        return [
          {
            field: 'baseAmount',
            label: 'Base Amount',
            type: 'currency',
          },
        ];

      case 'unit_based':
        return [
          {
            field: 'quantity',
            label: `Quantity (${service.unit_type || 'units'})`,
            type: 'number',
          },
        ];

      case 'fixed_plus_unit':
        return [
          {
            field: 'quantity',
            label: `Quantity (${service.unit_type || 'units'})`,
            type: 'number',
          },
        ];

      case 'formula_based':
        // Extract variables from formula
        const formula = service.expedition_formula || service.renewal_formula || '';
        const variables = this.extractFormulaVariables(formula);
        return variables.map(v => ({
          field: v,
          label: v,
          type: 'number' as const,
        }));

      default:
        return [];
    }
  }

  /**
   * Extract variable names from a formula string
   */
  private extractFormulaVariables(formula: string): string[] {
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
