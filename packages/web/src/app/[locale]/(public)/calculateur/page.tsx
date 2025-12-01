'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Receipt, Building2, Info, ArrowRight, RefreshCw, Circle, FileText, Variable, Loader2 } from 'lucide-react';
import Breadcrumb from '@/components/ui/breadcrumb';
import { fiscalServicesApi } from '@/modules/fiscal-services/services/api';
import type { FiscalServiceResponse, CalculationMethodEnum } from '@/types/fiscal-service';

// Tax brackets for Equatorial Guinea IRPF (Impuesto sobre la Renta de las Personas Físicas)
const IRPF_BRACKETS = [
  { min: 0, max: 1000000, rate: 0 },           // 0% for 0 - 1,000,000 XAF
  { min: 1000000, max: 3000000, rate: 10 },    // 10% for 1,000,000 - 3,000,000 XAF
  { min: 3000000, max: 5000000, rate: 15 },    // 15% for 3,000,000 - 5,000,000 XAF
  { min: 5000000, max: 10000000, rate: 20 },   // 20% for 5,000,000 - 10,000,000 XAF
  { min: 10000000, max: 15000000, rate: 25 },  // 25% for 10,000,000 - 15,000,000 XAF
  { min: 15000000, max: Infinity, rate: 35 },  // 35% for > 15,000,000 XAF
];

// VAT rates
const VAT_STANDARD_RATE = 15; // 15% standard VAT rate in EG

// Corporate tax rate
const CORPORATE_TAX_RATE = 35; // 35% corporate tax rate

// Variable configuration interface for calculation formulas
interface VariableConfig {
  type: 'number' | 'currency';
  label_es?: string;
  label_fr?: string;
  label_en?: string;
  description_es?: string;
  description_fr?: string;
  description_en?: string;
}

// Calculation config interface matching backend structure
interface CalculationConfig {
  variables?: Record<string, VariableConfig>;
  formula?: string;
  formula_description_es?: string;
  formula_description_fr?: string;
  formula_description_en?: string;
}

// Unified service interface for calculator (supports both API and legacy data)
interface ServiceFormula {
  id: number;
  service_code: string;
  name_es: string;
  name_fr?: string;
  name_en?: string;
  calculation_method: 'percentage_based' | 'formula_based';
  base_percentage?: number;
  expedition_formula?: string;
  calculation_config?: CalculationConfig;
}

type CalculatorType = 'irpf' | 'vat' | 'corporate' | 'services';

interface CalculationResult {
  grossAmount: number;
  taxAmount: number;
  netAmount: number;
  effectiveRate: number;
  breakdown: { bracket: string; taxable: number; rate: number; tax: number }[];
}

function CalculateurPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'es';
  const t = useTranslations('calculatorPage');

  // Check for pre-selected service from URL params
  const serviceCodeParam = searchParams.get('service');
  const serviceIdParam = searchParams.get('service_id');
  const initialTab = (serviceCodeParam || serviceIdParam) ? 'services' : 'irpf';

  const [activeTab, setActiveTab] = useState<CalculatorType>(initialTab);
  const [irpfAmount, setIrpfAmount] = useState<string>('');
  const [vatAmount, setVatAmount] = useState<string>('');
  const [vatType, setVatType] = useState<'add' | 'extract'>('add');
  const [corporateProfit, setCorporateProfit] = useState<string>('');

  // Dynamic services loaded from API
  const [serviceFormulas, setServiceFormulas] = useState<ServiceFormula[]>([]);
  const [loadingServices, setLoadingServices] = useState<boolean>(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  // Service formula states
  const [selectedServiceCode, setSelectedServiceCode] = useState<string>(serviceCodeParam || '');
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    serviceIdParam ? parseInt(serviceIdParam, 10) : null
  );
  const [serviceVariables, setServiceVariables] = useState<Record<string, string>>({});

  // Fetch fiscal services with formula-based or percentage-based calculation methods from API
  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);
      setServicesError(null);

      try {
        // Search for services with calculation methods that require user input
        const response = await fiscalServicesApi.search(
          { calculationMethod: 'percentage_based' as CalculationMethodEnum },
          1,
          100
        );

        // Also fetch formula-based services
        const formulaResponse = await fiscalServicesApi.search(
          { calculationMethod: 'formula_based' as CalculationMethodEnum },
          1,
          100
        );

        // Convert API responses to ServiceFormula format
        const percentageServices: ServiceFormula[] = response.services.map((s: FiscalServiceResponse) => ({
          id: s.id,
          service_code: s.serviceCode,
          name_es: s.nameEs,
          name_fr: undefined, // Will be fetched from translations if needed
          name_en: undefined,
          calculation_method: 'percentage_based' as const,
          base_percentage: s.basePercentage,
          expedition_formula: s.expeditionFormula,
          calculation_config: s.calculationConfig as CalculationConfig | undefined,
        }));

        const formulaServices: ServiceFormula[] = formulaResponse.services.map((s: FiscalServiceResponse) => ({
          id: s.id,
          service_code: s.serviceCode,
          name_es: s.nameEs,
          name_fr: undefined,
          name_en: undefined,
          calculation_method: 'formula_based' as const,
          base_percentage: s.basePercentage,
          expedition_formula: s.expeditionFormula || (s.calculationConfig as CalculationConfig | undefined)?.formula,
          calculation_config: s.calculationConfig as CalculationConfig | undefined,
        }));

        // Combine and deduplicate by id
        const allServices = [...percentageServices, ...formulaServices];
        const uniqueServices = allServices.filter(
          (s, index, self) => index === self.findIndex(t => t.id === s.id)
        );

        setServiceFormulas(uniqueServices);

        // If a service_id was provided in URL, select it
        if (serviceIdParam) {
          const serviceId = parseInt(serviceIdParam, 10);
          const matchingService = uniqueServices.find(s => s.id === serviceId);
          if (matchingService) {
            setSelectedServiceCode(matchingService.service_code);
            setSelectedServiceId(serviceId);
          }
        }
      } catch (error) {
        console.error('Error fetching fiscal services:', error);
        setServicesError(t('errorLoadingServices') || 'Error loading services');
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [serviceIdParam, t]);

  // Get the selected service formula
  const selectedService = useMemo(() => {
    if (selectedServiceId) {
      return serviceFormulas.find(s => s.id === selectedServiceId);
    }
    return serviceFormulas.find(s => s.service_code === selectedServiceCode);
  }, [selectedServiceCode, selectedServiceId, serviceFormulas]);

  // Get localized service name
  const getServiceName = (service: ServiceFormula) => {
    if (locale === 'fr') return service.name_fr;
    if (locale === 'en') return service.name_en;
    return service.name_es;
  };

  // Get localized variable label
  const getVariableLabel = (variable: VariableConfig) => {
    if (locale === 'fr') return variable.label_fr;
    if (locale === 'en') return variable.label_en;
    return variable.label_es;
  };

  // Get localized variable description
  const getVariableDescription = (variable: VariableConfig) => {
    if (locale === 'fr') return variable.description_fr;
    if (locale === 'en') return variable.description_en;
    return variable.description_es;
  };

  // Get localized formula description
  const getFormulaDescription = (config: CalculationConfig | undefined) => {
    if (!config) return '';
    if (locale === 'fr') return config.formula_description_fr || '';
    if (locale === 'en') return config.formula_description_en || '';
    return config.formula_description_es || '';
  };

  // IRPF Calculation
  const irpfResult = useMemo((): CalculationResult | null => {
    const amount = parseFloat(irpfAmount.replace(/[^\d.-]/g, ''));
    if (isNaN(amount) || amount <= 0) return null;

    let remainingIncome = amount;
    let totalTax = 0;
    const breakdown: CalculationResult['breakdown'] = [];

    for (const bracket of IRPF_BRACKETS) {
      if (remainingIncome <= 0) break;

      const taxableInBracket = Math.min(
        remainingIncome,
        bracket.max === Infinity ? remainingIncome : bracket.max - bracket.min
      );

      if (taxableInBracket > 0 && amount > bracket.min) {
        const actualTaxable = Math.min(taxableInBracket, amount - bracket.min);
        if (actualTaxable > 0) {
          const tax = (actualTaxable * bracket.rate) / 100;
          totalTax += tax;
          breakdown.push({
            bracket: bracket.max === Infinity
              ? `> ${formatCurrency(bracket.min)}`
              : `${formatCurrency(bracket.min)} - ${formatCurrency(bracket.max)}`,
            taxable: actualTaxable,
            rate: bracket.rate,
            tax,
          });
        }
      }
      remainingIncome -= taxableInBracket;
    }

    // Recalculate properly using progressive brackets
    let taxableRemaining = amount;
    totalTax = 0;
    breakdown.length = 0;

    for (const bracket of IRPF_BRACKETS) {
      if (taxableRemaining <= 0) break;
      if (amount <= bracket.min) continue;

      const amountInBracket = Math.min(
        amount - bracket.min,
        bracket.max === Infinity ? amount - bracket.min : bracket.max - bracket.min
      );

      const actualAmount = Math.min(amountInBracket, taxableRemaining);
      if (actualAmount > 0 && bracket.rate > 0) {
        const tax = (actualAmount * bracket.rate) / 100;
        totalTax += tax;
        breakdown.push({
          bracket: bracket.max === Infinity
            ? `> ${formatCurrency(bracket.min)}`
            : `${formatCurrency(bracket.min)} - ${formatCurrency(bracket.max)}`,
          taxable: actualAmount,
          rate: bracket.rate,
          tax,
        });
        taxableRemaining -= actualAmount;
      } else if (bracket.rate === 0) {
        taxableRemaining -= amountInBracket;
      }
    }

    return {
      grossAmount: amount,
      taxAmount: totalTax,
      netAmount: amount - totalTax,
      effectiveRate: (totalTax / amount) * 100,
      breakdown,
    };
  }, [irpfAmount]);

  // VAT Calculation
  const vatResult = useMemo((): { baseAmount: number; vatAmount: number; totalAmount: number } | null => {
    const amount = parseFloat(vatAmount.replace(/[^\d.-]/g, ''));
    if (isNaN(amount) || amount <= 0) return null;

    if (vatType === 'add') {
      const vat = (amount * VAT_STANDARD_RATE) / 100;
      return {
        baseAmount: amount,
        vatAmount: vat,
        totalAmount: amount + vat,
      };
    } else {
      const baseAmount = amount / (1 + VAT_STANDARD_RATE / 100);
      const vat = amount - baseAmount;
      return {
        baseAmount,
        vatAmount: vat,
        totalAmount: amount,
      };
    }
  }, [vatAmount, vatType]);

  // Corporate Tax Calculation
  const corporateResult = useMemo((): { profit: number; tax: number; netProfit: number } | null => {
    const profit = parseFloat(corporateProfit.replace(/[^\d.-]/g, ''));
    if (isNaN(profit) || profit <= 0) return null;

    const tax = (profit * CORPORATE_TAX_RATE) / 100;
    return {
      profit,
      tax,
      netProfit: profit - tax,
    };
  }, [corporateProfit]);

  // Service Formula Calculation
  const serviceResult = useMemo((): { result: number; formula: string; breakdown: { variable: string; value: number }[] } | null => {
    if (!selectedService) return null;

    if (selectedService.calculation_method === 'percentage_based') {
      // For percentage-based, we need a base amount
      const baseAmount = parseFloat(serviceVariables['baseAmount']?.replace(/[^\d.-]/g, '') || '0');
      if (isNaN(baseAmount) || baseAmount <= 0 || !selectedService.base_percentage) return null;

      const result = baseAmount * selectedService.base_percentage;
      return {
        result,
        formula: `${selectedService.base_percentage * 100}% × ${formatCurrency(baseAmount)}`,
        breakdown: [{ variable: 'baseAmount', value: baseAmount }]
      };
    }

    if (selectedService.calculation_method === 'formula_based' && selectedService.calculation_config?.variables) {
      const variables = selectedService.calculation_config.variables;
      const values: Record<string, number> = {};
      const breakdown: { variable: string; value: number }[] = [];

      // Parse all variable values
      for (const [key, config] of Object.entries(variables as Record<string, VariableConfig>)) {
        const rawValue = serviceVariables[key]?.replace(/[^\d.-]/g, '') || '';
        const value = parseFloat(rawValue);
        if (isNaN(value)) return null;
        values[key] = config.type === 'number' ? value / 100 : value; // Convert percentage to decimal
        breakdown.push({ variable: key, value });
      }

      // Calculate based on the formula RF + (t * CA)
      // Note: t is already converted to decimal (e.g., 5% -> 0.05)
      if (selectedService.expedition_formula === 'RF + (t * CA)') {
        const RF = values['RF'] || 0;
        const t = values['t'] || 0;
        const CA = values['CA'] || 0;
        const result = RF + (t * CA);

        return {
          result,
          formula: selectedService.expedition_formula,
          breakdown
        };
      }
    }

    return null;
  }, [selectedService, serviceVariables]);

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat(locale, {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' XAF';
  }

  function formatPercent(value: number): string {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }).format(value / 100);
  }

  const handleReset = () => {
    setIrpfAmount('');
    setVatAmount('');
    setCorporateProfit('');
    setServiceVariables({});
  };

  const handleServiceChange = (value: string) => {
    // Value can be either service_code or id prefixed with 'id:'
    if (value.startsWith('id:')) {
      const id = parseInt(value.replace('id:', ''), 10);
      setSelectedServiceId(id);
      const service = serviceFormulas.find(s => s.id === id);
      if (service) {
        setSelectedServiceCode(service.service_code);
      }
    } else {
      setSelectedServiceCode(value);
      setSelectedServiceId(null);
    }
    setServiceVariables({}); // Reset variables when changing service
  };

  const handleVariableChange = (key: string, value: string) => {
    setServiceVariables(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Breadcrumb
        items={[{ label: t('title') }]}
        className="mb-6"
      />

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-lg text-muted-foreground">{t('description')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CalculatorType)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[650px]">
          <TabsTrigger value="irpf" className="gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">{t('incomeTax')}</span>
            <span className="sm:hidden">IRPF</span>
          </TabsTrigger>
          <TabsTrigger value="vat" className="gap-2">
            <Receipt className="h-4 w-4" />
            <span>{t('vat')}</span>
          </TabsTrigger>
          <TabsTrigger value="corporate" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('corporateTax')}</span>
            <span className="sm:hidden">IS</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{t('fiscalServices')}</span>
            <span className="sm:hidden">{t('services')}</span>
          </TabsTrigger>
        </TabsList>

        {/* IRPF Calculator */}
        <TabsContent value="irpf">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* BLOCK 1: Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  {t('incomeTax')}
                </CardTitle>
                <CardDescription>{t('incomeTaxDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="irpf-amount">{t('annualIncome')}</Label>
                  <div className="relative">
                    <Input
                      id="irpf-amount"
                      type="text"
                      placeholder="5,000,000"
                      value={irpfAmount}
                      onChange={(e) => setIrpfAmount(e.target.value)}
                      className="pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      XAF
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t('reset')}
                  </Button>
                </div>

                <Separator />

                {/* Tax Brackets Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Info className="h-4 w-4 text-primary" />
                    {t('taxBrackets')}
                  </div>
                  <div className="space-y-1 bg-gradient-to-br from-muted/30 to-muted/50 p-4 rounded-lg border border-border/50">
                    {/* 0% Bracket */}
                    <div className="flex items-center gap-3 group hover:bg-background/50 p-2 rounded transition-colors">
                      <div className="flex-shrink-0">
                        <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground/90">{formatCurrency(0)} - {formatCurrency(1000000)}</div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          0%
                        </span>
                      </div>
                    </div>

                    {/* 10% Bracket */}
                    <div className="flex items-center gap-3 group hover:bg-background/50 p-2 rounded transition-colors">
                      <div className="flex-shrink-0">
                        <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground/90">{formatCurrency(1000000)} - {formatCurrency(3000000)}</div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          10%
                        </span>
                      </div>
                    </div>

                    {/* 15% Bracket */}
                    <div className="flex items-center gap-3 group hover:bg-background/50 p-2 rounded transition-colors">
                      <div className="flex-shrink-0">
                        <Circle className="h-3 w-3 fill-lime-500 text-lime-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground/90">{formatCurrency(3000000)} - {formatCurrency(5000000)}</div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400">
                          15%
                        </span>
                      </div>
                    </div>

                    {/* 20% Bracket */}
                    <div className="flex items-center gap-3 group hover:bg-background/50 p-2 rounded transition-colors">
                      <div className="flex-shrink-0">
                        <Circle className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground/90">{formatCurrency(5000000)} - {formatCurrency(10000000)}</div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          20%
                        </span>
                      </div>
                    </div>

                    {/* 25% Bracket */}
                    <div className="flex items-center gap-3 group hover:bg-background/50 p-2 rounded transition-colors">
                      <div className="flex-shrink-0">
                        <Circle className="h-3 w-3 fill-orange-500 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground/90">{formatCurrency(10000000)} - {formatCurrency(15000000)}</div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                          25%
                        </span>
                      </div>
                    </div>

                    {/* 35% Bracket */}
                    <div className="flex items-center gap-3 group hover:bg-background/50 p-2 rounded transition-colors">
                      <div className="flex-shrink-0">
                        <Circle className="h-3 w-3 fill-red-500 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground/90">&gt; {formatCurrency(15000000)}</div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          35%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* BLOCK 2: Result */}
            <Card className={irpfResult ? 'border-primary/50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  {t('result')}
                </CardTitle>
                <CardDescription>{t('calculationBreakdown')}</CardDescription>
              </CardHeader>
              <CardContent>
                {irpfResult ? (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">{t('grossIncome')}</p>
                        <p className="text-xl font-bold">{formatCurrency(irpfResult.grossAmount)}</p>
                      </div>
                      <div className="bg-destructive/10 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">{t('totalTax')}</p>
                        <p className="text-xl font-bold text-destructive">{formatCurrency(irpfResult.taxAmount)}</p>
                      </div>
                      <div className="bg-green-500/10 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">{t('netIncome')}</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(irpfResult.netAmount)}</p>
                      </div>
                      <div className="bg-primary/10 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">{t('effectiveRate')}</p>
                        <p className="text-xl font-bold text-primary">{formatPercent(irpfResult.effectiveRate)}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Breakdown */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{t('breakdownByBracket')}</p>
                      <div className="space-y-2">
                        {irpfResult.breakdown.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded">
                            <div>
                              <span className="font-medium">{item.bracket}</span>
                              <span className="text-muted-foreground ml-2">@ {item.rate}%</span>
                            </div>
                            <span className="font-mono">{formatCurrency(item.tax)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>{t('enterAmount')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* VAT Calculator */}
        <TabsContent value="vat">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* BLOCK 1: Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  {t('vat')} ({VAT_STANDARD_RATE}%)
                </CardTitle>
                <CardDescription>{t('vatDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('calculationType')}</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={vatType === 'add' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setVatType('add')}
                      className="flex-1"
                    >
                      {t('addVat')}
                    </Button>
                    <Button
                      variant={vatType === 'extract' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setVatType('extract')}
                      className="flex-1"
                    >
                      {t('extractVat')}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vat-amount">
                    {vatType === 'add' ? t('baseAmount') : t('totalWithVat')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="vat-amount"
                      type="text"
                      placeholder="1,000,000"
                      value={vatAmount}
                      onChange={(e) => setVatAmount(e.target.value)}
                      className="pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      XAF
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t('reset')}
                  </Button>
                </div>

                <Separator />

                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <p className="font-medium mb-1">{t('formula')}:</p>
                  {vatType === 'add' ? (
                    <p>{t('vatAddFormula')}</p>
                  ) : (
                    <p>{t('vatExtractFormula')}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* BLOCK 2: Result */}
            <Card className={vatResult ? 'border-primary/50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  {t('result')}
                </CardTitle>
                <CardDescription>{t('vatBreakdown')}</CardDescription>
              </CardHeader>
              <CardContent>
                {vatResult ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">{t('baseAmount')}</p>
                        <p className="text-xl font-bold">{formatCurrency(vatResult.baseAmount)}</p>
                      </div>
                      <div className="bg-amber-500/10 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">{t('vatAmount')} ({VAT_STANDARD_RATE}%)</p>
                        <p className="text-xl font-bold text-amber-600">{formatCurrency(vatResult.vatAmount)}</p>
                      </div>
                      <div className="bg-primary/10 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">{t('totalWithVat')}</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(vatResult.totalAmount)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>{t('enterAmount')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Corporate Tax Calculator */}
        <TabsContent value="corporate">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* BLOCK 1: Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {t('corporateTax')} ({CORPORATE_TAX_RATE}%)
                </CardTitle>
                <CardDescription>{t('corporateTaxDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="corporate-profit">{t('taxableProfit')}</Label>
                  <div className="relative">
                    <Input
                      id="corporate-profit"
                      type="text"
                      placeholder="10,000,000"
                      value={corporateProfit}
                      onChange={(e) => setCorporateProfit(e.target.value)}
                      className="pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      XAF
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t('reset')}
                  </Button>
                </div>

                <Separator />

                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <p className="font-medium mb-1">{t('formula')}:</p>
                  <p>{t('corporateFormula')}</p>
                </div>
              </CardContent>
            </Card>

            {/* BLOCK 2: Result */}
            <Card className={corporateResult ? 'border-primary/50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  {t('result')}
                </CardTitle>
                <CardDescription>{t('corporateBreakdown')}</CardDescription>
              </CardHeader>
              <CardContent>
                {corporateResult ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">{t('taxableProfit')}</p>
                        <p className="text-xl font-bold">{formatCurrency(corporateResult.profit)}</p>
                      </div>
                      <div className="bg-destructive/10 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">{t('corporateTaxAmount')} ({CORPORATE_TAX_RATE}%)</p>
                        <p className="text-xl font-bold text-destructive">{formatCurrency(corporateResult.tax)}</p>
                      </div>
                      <div className="bg-green-500/10 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">{t('netProfit')}</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(corporateResult.netProfit)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>{t('enterAmount')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Fiscal Services Calculator */}
        <TabsContent value="services">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* BLOCK 1: Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {t('fiscalServices')}
                </CardTitle>
                <CardDescription>{t('fiscalServicesDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Loading State */}
                {loadingServices && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">{t('loadingServices') || 'Loading services...'}</span>
                  </div>
                )}

                {/* Error State */}
                {servicesError && !loadingServices && (
                  <div className="text-center py-8 text-destructive">
                    <Info className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{servicesError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => window.location.reload()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t('retry') || 'Retry'}
                    </Button>
                  </div>
                )}

                {/* Service Selector - only show when loaded */}
                {!loadingServices && !servicesError && (
                  <>
                    <div className="space-y-2">
                      <Label>{t('selectService')}</Label>
                      <Select
                        value={selectedServiceId ? `id:${selectedServiceId}` : selectedServiceCode}
                        onValueChange={handleServiceChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectServicePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceFormulas.length === 0 ? (
                            <SelectItem value="none" disabled>
                              {t('noServicesAvailable') || 'No services available'}
                            </SelectItem>
                          ) : (
                            serviceFormulas.map(service => (
                              <SelectItem key={service.id} value={`id:${service.id}`}>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-muted-foreground">{service.service_code}</span>
                                  <span>{getServiceName(service) || service.name_es}</span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {serviceFormulas.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {t('servicesCount', { count: serviceFormulas.length }) || `${serviceFormulas.length} services available`}
                        </p>
                      )}
                    </div>

                    {/* Dynamic Variables Form */}
                    {selectedService && (
                      <>
                        <Separator />

                        {selectedService.calculation_method === 'percentage_based' && (
                          <div className="space-y-2">
                            <Label htmlFor="baseAmount">{t('baseAmountForPercentage')}</Label>
                            <div className="relative">
                              <Input
                                id="baseAmount"
                                type="text"
                                placeholder="1,000,000"
                                value={serviceVariables['baseAmount'] || ''}
                                onChange={(e) => handleVariableChange('baseAmount', e.target.value)}
                                className="pr-16"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                XAF
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t('percentageRate')}: {selectedService.base_percentage ? `${selectedService.base_percentage * 100}%` : 'N/A'}
                            </p>
                          </div>
                        )}

                        {selectedService.calculation_method === 'formula_based' && selectedService.calculation_config?.variables && (
                          <div className="space-y-4">
                            {Object.entries(selectedService.calculation_config.variables).map(([key, config]) => (
                              <div key={key} className="space-y-2">
                                <Label htmlFor={key} className="flex items-center gap-2">
                                  <Variable className="h-3 w-3" />
                                  {getVariableLabel(config) || key}
                                </Label>
                                <div className="relative">
                                  <Input
                                    id={key}
                                    type="text"
                                    placeholder={config.type === 'currency' ? '1,000,000' : '5'}
                                    value={serviceVariables[key] || ''}
                                    onChange={(e) => handleVariableChange(key, e.target.value)}
                                    className={config.type === 'currency' ? 'pr-16' : ''}
                                  />
                                  {config.type === 'currency' && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                      XAF
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{getVariableDescription(config)}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={handleReset}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            {t('reset')}
                          </Button>
                        </div>

                        <Separator />

                        {/* Formula Info */}
                        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                          <p className="font-medium mb-1">{t('formula')}:</p>
                          {selectedService.calculation_method === 'formula_based' && selectedService.expedition_formula && (
                            <div className="space-y-1">
                              <p className="font-mono text-sm">{selectedService.expedition_formula}</p>
                              {selectedService.calculation_config && (
                                <p className="italic">{getFormulaDescription(selectedService.calculation_config)}</p>
                              )}
                            </div>
                          )}
                          {selectedService.calculation_method === 'percentage_based' && (
                            <p>{t('result')} = {t('baseAmount')} × {selectedService.base_percentage ? `${selectedService.base_percentage * 100}%` : 'N/A'}</p>
                          )}
                        </div>
                      </>
                    )}

                    {!selectedService && serviceFormulas.length > 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>{t('selectServicePrompt')}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* BLOCK 2: Result */}
            <Card className={serviceResult ? 'border-primary/50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  {t('result')}
                </CardTitle>
                <CardDescription>
                  {selectedService ? getServiceName(selectedService) : t('serviceCalculationResult')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {serviceResult ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-primary/10 p-6 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-2">{t('calculatedAmount')}</p>
                        <p className="text-3xl font-bold text-primary">{formatCurrency(serviceResult.result)}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Breakdown */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{t('calculationBreakdown')}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded">
                          <span className="font-medium">{t('formula')}</span>
                          <span className="font-mono">{serviceResult.formula}</span>
                        </div>
                        {serviceResult.breakdown.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded">
                            <span className="font-medium">{item.variable}</span>
                            <span className="font-mono">
                              {item.variable === 't' ? `${item.value}%` : formatCurrency(item.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>{selectedService ? t('enterVariables') : t('selectServiceFirst')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <p className="text-sm text-amber-700 dark:text-amber-400 text-center">
          <Info className="h-4 w-4 inline mr-2" />
          {t('disclaimer')}
        </p>
      </div>
    </div>
  );
}

// Loading skeleton for Suspense fallback
function CalculateurLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-pulse">
      <div className="h-6 bg-muted rounded w-48 mb-4" />
      <div className="h-10 bg-muted rounded w-64 mb-2" />
      <div className="h-4 bg-muted rounded w-96 mb-8" />
      <div className="h-12 bg-muted rounded mb-6" />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-96 bg-muted rounded" />
        <div className="h-96 bg-muted rounded" />
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function CalculateurPage() {
  return (
    <Suspense fallback={<CalculateurLoading />}>
      <CalculateurPageContent />
    </Suspense>
  );
}
