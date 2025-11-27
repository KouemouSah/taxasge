import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Building2, Receipt } from 'lucide-react';

/**
 * Calculateur Page - Localized
 * Tax calculator for different types of taxes
 *
 * Routes:
 * - /es/calculateur
 * - /fr/calculateur
 * - /en/calculateur
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'calculatorPage' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function CalculateurPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'calculatorPage' });

  const calculators = [
    {
      icon: Calculator,
      title: t('incomeTax'),
      description: t('incomeTaxDesc'),
      info: t('incomeTaxInfo'),
    },
    {
      icon: Receipt,
      title: t('vat'),
      description: t('vatDesc'),
      info: t('vatInfo'),
    },
    {
      icon: Building2,
      title: t('corporateTax'),
      description: t('corporateTaxDesc'),
      info: t('corporateTaxInfo'),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-lg text-muted-foreground">{t('description')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {calculators.map((calc, index) => {
          const Icon = calc.icon;
          return (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow relative overflow-hidden"
            >
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="text-xs">
                  {t('comingSoon')}
                </Badge>
              </div>
              <CardHeader className="pt-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{calc.title}</CardTitle>
                </div>
                <CardDescription className="mt-2">
                  {calc.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{calc.info}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-muted/50 rounded-lg">
        <p className="text-center text-muted-foreground">
          {t('comingSoonDesc')}
        </p>
      </div>
    </div>
  );
}
