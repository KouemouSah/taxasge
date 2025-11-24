import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Calculateur Page - Localized
 * Tax calculator for different types of taxes
 *
 * Routes:
 * - /es/calculateur
 * - /fr/calculateur
 * - /en/calculateur
 */

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'nav' });

  return {
    title: `${t('calculator')} - TaxasGE`,
    description: 'Calcula tus impuestos de forma rápida y precisa',
  };
}

export default async function CalculateurPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'nav' });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{t('calculator')}</h1>
        <p className="text-lg text-muted-foreground">
          Calcula tus impuestos de forma rápida y precisa
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle>Impuesto sobre la Renta</CardTitle>
            <CardDescription>
              Calcula tu impuesto sobre ingresos personales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Para personas físicas con ingresos laborales
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle>IVA (TVA)</CardTitle>
            <CardDescription>
              Calcula el impuesto sobre el valor agregado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Para empresas y comerciantes
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle>Impuesto de Sociedades</CardTitle>
            <CardDescription>
              Calcula el impuesto para empresas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Para sociedades y corporaciones
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
