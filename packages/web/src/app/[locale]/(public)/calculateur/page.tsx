'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Calculator, Receipt, Building2, Info, ArrowRight, RefreshCw } from 'lucide-react';
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

type CalculatorType = 'irpf' | 'vat' | 'corporate';

interface CalculationResult {
  grossAmount: number;
  taxAmount: number;
  netAmount: number;
  effectiveRate: number;
  breakdown: { bracket: string; taxable: number; rate: number; tax: number }[];
}

export default function CalculateurPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'es';
  const t = useTranslations('calculatorPage');

  const [activeTab, setActiveTab] = useState<CalculatorType>('irpf');
  const [irpfAmount, setIrpfAmount] = useState<string>('');
  const [vatAmount, setVatAmount] = useState<string>('');
  const [vatType, setVatType] = useState<'add' | 'extract'>('add');
  const [corporateProfit, setCorporateProfit] = useState<string>('');

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
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Info className="h-4 w-4 text-primary" />
                    {t('taxBrackets')}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
                    <p>0 - 1,000,000 XAF: 0%</p>
                    <p>1,000,000 - 3,000,000 XAF: 10%</p>
                    <p>3,000,000 - 5,000,000 XAF: 15%</p>
                    <p>5,000,000 - 10,000,000 XAF: 20%</p>
                    <p>10,000,000 - 15,000,000 XAF: 25%</p>
                    <p>&gt; 15,000,000 XAF: 35%</p>
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
