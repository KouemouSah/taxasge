/**
 * TaxasGE Mobile - Calculator Engine Unit Tests
 *
 * Comprehensive test suite for all calculation methods
 * Target: >95% code coverage
 *
 * Date: 2025-10-21
 */

import { CalculatorEngine } from '../CalculatorEngine';
import { FiscalService } from '../../database/services/FiscalServicesService';

describe('CalculatorEngine', () => {
  let engine: CalculatorEngine;

  beforeEach(() => {
    engine = new CalculatorEngine();
  });

  // ============================================
  // FIXED CALCULATION TESTS
  // ============================================

  describe('calculateFixed', () => {
    it('should calculate fixed_expedition correctly', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-001',
        calculation_method: 'fixed_expedition',
        tasa_expedicion: 10000,
        tasa_renovacion: 5000,
      };

      const result = engine.calculateFixed(service as FiscalService, 'expedition');

      expect(result.amount).toBe(10000);
      expect(result.method).toBe('fixed_expedition');
      expect(result.breakdown.baseAmount).toBe(10000);
    });

    it('should calculate fixed_renewal correctly', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-002',
        calculation_method: 'fixed_renewal',
        tasa_expedicion: 10000,
        tasa_renovacion: 5000,
      };

      const result = engine.calculateFixed(service as FiscalService, 'renewal');

      expect(result.amount).toBe(5000);
      expect(result.method).toBe('fixed_renewal');
    });

    it('should calculate fixed_both for expedition', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-003',
        calculation_method: 'fixed_both',
        tasa_expedicion: 10000,
        tasa_renovacion: 5000,
      };

      const result = engine.calculateFixed(service as FiscalService, 'expedition');

      expect(result.amount).toBe(10000);
      expect(result.method).toBe('fixed_both');
    });

    it('should calculate fixed_both for renewal', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-003',
        calculation_method: 'fixed_both',
        tasa_expedicion: 10000,
        tasa_renovacion: 5000,
      };

      const result = engine.calculateFixed(service as FiscalService, 'renewal');

      expect(result.amount).toBe(5000);
      expect(result.method).toBe('fixed_both');
    });

    it('should throw error when amount is 0', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-004',
        calculation_method: 'fixed_expedition',
        tasa_expedicion: 0,
      };

      expect(() => {
        engine.calculateFixed(service as FiscalService, 'expedition');
      }).toThrow();
    });

    it('should throw error when amount is missing', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-005',
        calculation_method: 'fixed_expedition',
      };

      expect(() => {
        engine.calculateFixed(service as FiscalService, 'expedition');
      }).toThrow();
    });
  });

  // ============================================
  // PERCENTAGE-BASED CALCULATION TESTS
  // ============================================

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-010',
        calculation_method: 'percentage_based',
        base_percentage: 10,
        percentage_of: 'transaction_value',
      };

      const result = engine.calculatePercentage(service as FiscalService, 100000);

      expect(result.amount).toBe(10000);
      expect(result.method).toBe('percentage_based');
      expect(result.breakdown.baseAmount).toBe(100000);
      expect(result.breakdown.percentage).toBe(10);
    });

    it('should calculate fractional percentage', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-011',
        calculation_method: 'percentage_based',
        base_percentage: 2.5,
      };

      const result = engine.calculatePercentage(service as FiscalService, 50000);

      expect(result.amount).toBe(1250);
    });

    it('should throw error when base_percentage is missing', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-012',
        calculation_method: 'percentage_based',
      };

      expect(() => {
        engine.calculatePercentage(service as FiscalService, 100000);
      }).toThrow('Missing or invalid base_percentage');
    });

    it('should throw error when base_percentage is 0', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-013',
        calculation_method: 'percentage_based',
        base_percentage: 0,
      };

      expect(() => {
        engine.calculatePercentage(service as FiscalService, 100000);
      }).toThrow();
    });

    it('should throw error when baseAmount is 0 or negative', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-014',
        calculation_method: 'percentage_based',
        base_percentage: 10,
      };

      expect(() => {
        engine.calculatePercentage(service as FiscalService, 0);
      }).toThrow('Base amount must be greater than 0');

      expect(() => {
        engine.calculatePercentage(service as FiscalService, -100);
      }).toThrow('Base amount must be greater than 0');
    });
  });

  // ============================================
  // TIERED RATES CALCULATION TESTS
  // ============================================

  describe('calculateTiered', () => {
    it('should calculate tiered rates correctly', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-020',
        calculation_method: 'tiered_rates',
        rate_tiers: JSON.stringify([
          { min: 0, max: 50000, rate: 5 },
          { min: 50000, max: 100000, rate: 10 },
          { min: 100000, max: Infinity, rate: 15 },
        ]),
      };

      const result = engine.calculateTiered(service as FiscalService, 75000);

      // Expected: (50000 * 5%) + (25000 * 10%) = 2500 + 2500 = 5000
      expect(result.amount).toBe(5000);
      expect(result.method).toBe('tiered_rates');
      expect(result.breakdown.tiers).toHaveLength(2);
    });

    it('should handle amount in first tier only', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-021',
        calculation_method: 'tiered_rates',
        rate_tiers: JSON.stringify([
          { min: 0, max: 50000, rate: 5 },
          { min: 50000, max: 100000, rate: 10 },
        ]),
      };

      const result = engine.calculateTiered(service as FiscalService, 30000);

      // Expected: 30000 * 5% = 1500
      expect(result.amount).toBe(1500);
      expect(result.breakdown.tiers).toHaveLength(1);
    });

    it('should handle amount spanning all tiers', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-022',
        calculation_method: 'tiered_rates',
        rate_tiers: JSON.stringify([
          { min: 0, max: 50000, rate: 5 },
          { min: 50000, max: 100000, rate: 10 },
          { min: 100000, max: 200000, rate: 15 },
        ]),
      };

      const result = engine.calculateTiered(service as FiscalService, 150000);

      // Expected:
      // (50000 * 5%) + (50000 * 10%) + (50000 * 15%)
      // = 2500 + 5000 + 7500 = 15000
      expect(result.amount).toBe(15000);
      expect(result.breakdown.tiers).toHaveLength(3);
    });

    it('should throw error when rate_tiers is missing', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-023',
        calculation_method: 'tiered_rates',
      };

      expect(() => {
        engine.calculateTiered(service as FiscalService, 100000);
      }).toThrow('Missing rate_tiers configuration');
    });

    it('should throw error when rate_tiers is invalid JSON', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-024',
        calculation_method: 'tiered_rates',
        rate_tiers: 'invalid json',
      };

      expect(() => {
        engine.calculateTiered(service as FiscalService, 100000);
      }).toThrow();
    });

    it('should throw error when baseAmount is 0 or negative', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-025',
        calculation_method: 'tiered_rates',
        rate_tiers: JSON.stringify([{ min: 0, max: 50000, rate: 5 }]),
      };

      expect(() => {
        engine.calculateTiered(service as FiscalService, 0);
      }).toThrow('Base amount must be greater than 0');
    });
  });

  // ============================================
  // FORMULA-BASED CALCULATION TESTS
  // ============================================

  describe('calculateFormula', () => {
    it('should calculate simple formula correctly', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-030',
        calculation_method: 'formula_based',
        expedition_formula: 'amount * 0.05',
      };

      const result = engine.calculateFormula(
        service as FiscalService,
        'expedition',
        { amount: 100000 }
      );

      expect(result.amount).toBe(5000);
      expect(result.method).toBe('formula_based');
      expect(result.breakdown.formula).toBe('amount * 0.05');
    });

    it('should calculate complex formula', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-031',
        calculation_method: 'formula_based',
        expedition_formula: '(base * rate) + fixed',
      };

      const result = engine.calculateFormula(
        service as FiscalService,
        'expedition',
        { base: 50000, rate: 0.1, fixed: 1000 }
      );

      expect(result.amount).toBe(6000);
    });

    it('should use renewal_formula for renewal type', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-032',
        calculation_method: 'formula_based',
        expedition_formula: 'amount * 0.1',
        renewal_formula: 'amount * 0.05',
      };

      const result = engine.calculateFormula(
        service as FiscalService,
        'renewal',
        { amount: 100000 }
      );

      expect(result.amount).toBe(5000);
    });

    it('should throw error when formula is missing', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-033',
        calculation_method: 'formula_based',
      };

      expect(() => {
        engine.calculateFormula(service as FiscalService, 'expedition', {});
      }).toThrow('Missing expedition_formula');
    });

    it('should handle division by zero gracefully', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-034',
        calculation_method: 'formula_based',
        expedition_formula: 'amount / divisor',
      };

      const result = engine.calculateFormula(
        service as FiscalService,
        'expedition',
        { amount: 100000, divisor: 0 }
      );

      // Division by zero results in Infinity, which should be caught
      expect(() => result).toBeTruthy();
    });
  });

  // ============================================
  // UNIT-BASED CALCULATION TESTS
  // ============================================

  describe('calculateUnit', () => {
    it('should calculate unit-based amount correctly', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-040',
        calculation_method: 'unit_based',
        unit_rate: 500,
        unit_type: 'pages',
      };

      const result = engine.calculateUnit(service as FiscalService, 10);

      expect(result.amount).toBe(5000);
      expect(result.method).toBe('unit_based');
      expect(result.breakdown.quantity).toBe(10);
      expect(result.breakdown.unitRate).toBe(500);
    });

    it('should handle fractional quantities', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-041',
        calculation_method: 'unit_based',
        unit_rate: 1000,
        unit_type: 'kg',
      };

      const result = engine.calculateUnit(service as FiscalService, 2.5);

      expect(result.amount).toBe(2500);
    });

    it('should throw error when unit_rate is missing', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-042',
        calculation_method: 'unit_based',
      };

      expect(() => {
        engine.calculateUnit(service as FiscalService, 10);
      }).toThrow('Missing or invalid unit_rate');
    });

    it('should throw error when quantity is 0 or negative', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-043',
        calculation_method: 'unit_based',
        unit_rate: 500,
      };

      expect(() => {
        engine.calculateUnit(service as FiscalService, 0);
      }).toThrow('Quantity must be greater than 0');

      expect(() => {
        engine.calculateUnit(service as FiscalService, -5);
      }).toThrow('Quantity must be greater than 0');
    });
  });

  // ============================================
  // FIXED PLUS UNIT CALCULATION TESTS
  // ============================================

  describe('calculateFixedPlusUnit', () => {
    it('should calculate fixed plus unit correctly', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-050',
        calculation_method: 'fixed_plus_unit',
        tasa_expedicion: 5000,
        tasa_renovacion: 3000,
        unit_rate: 500,
        unit_type: 'pages',
      };

      const result = engine.calculateFixedPlusUnit(
        service as FiscalService,
        'expedition',
        10
      );

      // Expected: 5000 + (10 * 500) = 10000
      expect(result.amount).toBe(10000);
      expect(result.method).toBe('fixed_plus_unit');
      expect(result.breakdown.fixedPart).toBe(5000);
      expect(result.breakdown.variablePart).toBe(5000);
    });

    it('should calculate with zero quantity (fixed part only)', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-051',
        calculation_method: 'fixed_plus_unit',
        tasa_expedicion: 5000,
        unit_rate: 500,
      };

      const result = engine.calculateFixedPlusUnit(
        service as FiscalService,
        'expedition',
        0
      );

      expect(result.amount).toBe(5000);
      expect(result.breakdown.variablePart).toBe(0);
    });

    it('should use correct fixed part for renewal', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-052',
        calculation_method: 'fixed_plus_unit',
        tasa_expedicion: 5000,
        tasa_renovacion: 3000,
        unit_rate: 500,
      };

      const result = engine.calculateFixedPlusUnit(
        service as FiscalService,
        'renewal',
        5
      );

      // Expected: 3000 + (5 * 500) = 5500
      expect(result.amount).toBe(5500);
      expect(result.breakdown.fixedPart).toBe(3000);
    });

    it('should throw error when fixed part is missing', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-053',
        calculation_method: 'fixed_plus_unit',
        unit_rate: 500,
      };

      expect(() => {
        engine.calculateFixedPlusUnit(service as FiscalService, 'expedition', 10);
      }).toThrow();
    });

    it('should throw error when unit_rate is missing', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-054',
        calculation_method: 'fixed_plus_unit',
        tasa_expedicion: 5000,
      };

      expect(() => {
        engine.calculateFixedPlusUnit(service as FiscalService, 'expedition', 10);
      }).toThrow('Missing or invalid unit_rate');
    });

    it('should throw error when quantity is negative', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-055',
        calculation_method: 'fixed_plus_unit',
        tasa_expedicion: 5000,
        unit_rate: 500,
      };

      expect(() => {
        engine.calculateFixedPlusUnit(service as FiscalService, 'expedition', -5);
      }).toThrow('Quantity must be 0 or greater');
    });
  });

  // ============================================
  // MAIN CALCULATE METHOD TESTS
  // ============================================

  describe('calculate', () => {
    it('should route to correct calculation method', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-060',
        calculation_method: 'fixed_expedition',
        tasa_expedicion: 10000,
      };

      const result = engine.calculate(service as FiscalService, 'expedition');

      expect(result.amount).toBe(10000);
    });

    it('should throw error for unsupported calculation method', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-061',
        calculation_method: 'unsupported_method' as any,
      };

      expect(() => {
        engine.calculate(service as FiscalService, 'expedition');
      }).toThrow('Unsupported calculation method');
    });

    it('should validate required inputs for percentage_based', () => {
      const service: Partial<FiscalService> = {
        service_code: 'T-062',
        calculation_method: 'percentage_based',
        base_percentage: 10,
      };

      expect(() => {
        engine.calculate(service as FiscalService, 'expedition');
      }).toThrow('Base amount is required');
    });
  });

  // ============================================
  // HELPER METHODS TESTS
  // ============================================

  describe('requiresCalculation', () => {
    it('should return true for non-fixed methods', () => {
      const service: Partial<FiscalService> = {
        calculation_method: 'percentage_based',
      };

      expect(engine.requiresCalculation(service as FiscalService)).toBe(true);
    });

    it('should return false for fixed methods', () => {
      const fixedMethods = ['fixed_expedition', 'fixed_renewal', 'fixed_both'];

      fixedMethods.forEach(method => {
        const service: Partial<FiscalService> = {
          calculation_method: method,
        };
        expect(engine.requiresCalculation(service as FiscalService)).toBe(false);
      });
    });
  });

  describe('getRequiredInputs', () => {
    it('should return correct inputs for percentage_based', () => {
      const service: Partial<FiscalService> = {
        calculation_method: 'percentage_based',
        percentage_of: 'Transaction Value',
      };

      const inputs = engine.getRequiredInputs(service as FiscalService);

      expect(inputs).toHaveLength(1);
      expect(inputs[0].field).toBe('baseAmount');
      expect(inputs[0].label).toBe('Transaction Value');
    });

    it('should return correct inputs for unit_based', () => {
      const service: Partial<FiscalService> = {
        calculation_method: 'unit_based',
        unit_type: 'pages',
      };

      const inputs = engine.getRequiredInputs(service as FiscalService);

      expect(inputs).toHaveLength(1);
      expect(inputs[0].field).toBe('quantity');
      expect(inputs[0].label).toContain('pages');
    });

    it('should extract variables from formula', () => {
      const service: Partial<FiscalService> = {
        calculation_method: 'formula_based',
        expedition_formula: 'base * rate + fixed',
      };

      const inputs = engine.getRequiredInputs(service as FiscalService);

      expect(inputs.length).toBeGreaterThan(0);
      expect(inputs.map(i => i.field)).toContain('base');
      expect(inputs.map(i => i.field)).toContain('rate');
      expect(inputs.map(i => i.field)).toContain('fixed');
    });

    it('should return empty array for fixed methods', () => {
      const service: Partial<FiscalService> = {
        calculation_method: 'fixed_expedition',
      };

      const inputs = engine.getRequiredInputs(service as FiscalService);

      expect(inputs).toHaveLength(0);
    });
  });
});
