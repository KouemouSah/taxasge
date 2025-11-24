import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

/**
 * Services Page - Localized
 *
 * Routes:
 * - /es/services
 * - /fr/services
 * - /en/services
 */

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'nav' });

  return {
    title: `${t('services')} - TaxasGE`,
    description: 'Lista de servicios fiscales de Guinea Ecuatorial',
  };
}

export default function ServicesPage() {
  const t = useTranslations('nav');

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">{t('services')}</h1>
      <p className="text-muted-foreground">
        Page en construction - Liste des services fiscaux
      </p>
    </div>
  );
}
