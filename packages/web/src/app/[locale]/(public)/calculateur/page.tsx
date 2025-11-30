'use client';

import { useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Receipt, Building2, Info, ArrowRight, RefreshCw, Circle, FileText, Variable } from 'lucide-react';
import Breadcrumb from '@/components/ui/breadcrumb';

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

// Service formulas from database (extracted via extract_formulas.py)
interface VariableConfig {
  type: 'number' | 'currency';
  label_es: string;
  label_fr: string;
  label_en: string;
  description_es: string;
  description_fr: string;
  description_en: string;
}

interface CalculationConfig {
  variables: Record<string, VariableConfig>;
  formula_description_es?: string;
  formula_description_fr?: string;
  formula_description_en?: string;
}

interface ServiceFormula {
  id: number;
  service_code: string;
  name_es: string;
  name_fr: string;
  name_en: string;
  calculation_method: 'percentage_based' | 'formula_based';
  base_percentage?: number;
  expedition_formula?: string;
  calculation_config?: CalculationConfig;
}

const SERVICE_FORMULAS: ServiceFormula[] = [
  {
    id: 871,
    service_code: 'T-646',
    name_es: 'Canon anual de concesiones',
    name_fr: 'Redevance annuelle des concessions',
    name_en: 'Annual concession fee',
    calculation_method: 'formula_based',
    expedition_formula: 'RF + (t * CA)',
    calculation_config: {
      variables: {
        t: {
          type: 'number',
          label_es: 'Tasa de la cuota (%)',
          label_fr: 'Taux de la redevance (%)',
          label_en: 'Fee rate (%)',
          description_es: 'Tasa fijada por el pliego de condiciones (ingresar en porcentaje, ej: 5 para 5%)',
          description_fr: 'Taux fixé par le cahier des charges (entrer en pourcentage, ex: 5 pour 5%)',
          description_en: 'Rate set by specifications (enter as percentage, e.g.: 5 for 5%)'
        },
        CA: {
          type: 'currency',
          label_es: 'Facturación anual (XAF)',
          label_fr: "Chiffre d'affaires annuel (XAF)",
          label_en: 'Annual turnover (XAF)',
          description_es: 'Ingresos de la concesión durante el año',
          description_fr: "Recettes de la concession sur l'année",
          description_en: 'Concession revenues for the year'
        },
        RF: {
          type: 'currency',
          label_es: 'Cuota fija anual (XAF)',
          label_fr: 'Redevance fixe annuelle (XAF)',
          label_en: 'Annual fixed fee (XAF)',
          description_es: 'Tarifa fija, determinada por contrato o revisada según un índice económico',
          description_fr: 'Forfaitaire, déterminée au contrat ou révisée selon un indice économique',
          description_en: 'Flat rate, determined by contract or revised according to an economic index'
        }
      },
      formula_description_es: 'Según los términos del convenio',
      formula_description_fr: 'Selon les termes de la convention',
      formula_description_en: 'According to the terms of the agreement'
    }
  },
  {
    id: 876,
    service_code: 'T-651',
    name_es: 'Reconocimiento y comprobación de calidad, higiene del medio ambiente',
    name_fr: 'Reconnaissance et vérification de la qualité, hygiène environnementale',
    name_en: 'Quality recognition and environmental hygiene verification',
    calculation_method: 'percentage_based',
    base_percentage: 0.2
  },
  {
    id: 877,
    service_code: 'T-652',
    name_es: 'Inspección técnica',
    name_fr: 'Inspection technique',
    name_en: 'Technical inspection',
    calculation_method: 'percentage_based',
    base_percentage: 0.2
  },
  {
    id: 879,
    service_code: 'T-654',
    name_es: 'Buque de línea no regular',
    name_fr: 'Navire de ligne non régulier',
    name_en: 'Non-regular line vessel',
    calculation_method: 'percentage_based',
    base_percentage: 0.02
  }
];

type CalculatorType = 'irpf' | 'vat' | 'corporate' | 'services';

interface CalculationResult {
  grossAmount: number;
  taxAmount: number;
  netAmount: number;
  effectiveRate: number;
  breakdown: { bracket: string; taxable: number; rate: number; tax: number }[];
}

export default function CalculateurPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'es';
  const t = useTranslations('calculatorPage');

  // Check for pre-selected service from URL params
  const serviceCodeParam = searchParams.get('service');
  const initialTab = serviceCodeParam ? 'services' : 'irpf';

  const [activeTab, setActiveTab] = useState<CalculatorType>(initialTab);
  const [irpfAmount, setIrpfAmount] = useState<string>('');
  const [vatAmount, setVatAmount] = useState<string>('');
  const [vatType, setVatType] = useState<'add' | 'extract'>('add');
  const [corporateProfit, setCorporateProfit] = useState<string>('');

  // Service formula states
  const [selectedServiceCode, setSelectedServiceCode] = useState<string>(serviceCodeParam || '');
  const [serviceVariables, setServiceVariables] = useState<Record<string, string>>({});

  // Get the selected service formula
  const selectedService = useMemo(() => {
    return SERVICE_FORMULAS.find(s => s.service_code === selectedServiceCode);
  }, [selectedServiceCode]);

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

    if (selectedService.calculation_method === 'formula_based' && selectedService.calculation_config) {
      const variables = selectedService.calculation_config.variables;
      const values: Record<string, number> = {};
      const breakdown: { variable: string; value: number }[] = [];

      // Parse all variable values
      for (const [key, config] of Object.entries(variables)) {
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

  const handleServiceChange = (serviceCode: string) => {
    setSelectedServiceCode(serviceCode);
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
                  <div className="space-y-2 bg-gradient-to-br from-muted/30 to-muted/50 p-4 rounded-lg border border-border/50">
                    {/* 0% Bracket */}
                    <div className="flex items-center gap-3 group hover:bg-background/50 p-2 rounded transition-colors">
                      <div className="flex-shrink-0">
                        <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground/90">0 - 1,000,000 XAF</div>
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
                        <div className="text-xs font-medium text-foreground/90">1M - 3M XAF</div>
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
                        <div className="text-xs font-medium text-foreground/90">3M - 5M XAF</div>
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
                        <div className="text-xs font-medium text-foreground/90">5M - 10M XAF</div>
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
                        <div className="text-xs font-medium text-foreground/90">10M - 15M XAF</div>
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
                        <div className="text-xs font-medium text-foreground/90">&gt; 15M XAF</div>
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
                {/* Service Selector */}
                <div className="space-y-2">
                  <Label>{t('selectService')}</Label>
                  <Select value={selectedServiceCode} onValueChange={handleServiceChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectServicePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_FORMULAS.map(service => (
                        <SelectItem key={service.service_code} value={service.service_code}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">{service.service_code}</span>
                            <span>{getServiceName(service)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

                    {selectedService.calculation_method === 'formula_based' && selectedService.calculation_config && (
                      <div className="space-y-4">
                        {Object.entries(selectedService.calculation_config.variables).map(([key, config]) => (
                          <div key={key} className="space-y-2">
                            <Label htmlFor={key} className="flex items-center gap-2">
                              <Variable className="h-3 w-3" />
                              {getVariableLabel(config)}
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

                {!selectedService && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>{t('selectServicePrompt')}</p>
                  </div>
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
