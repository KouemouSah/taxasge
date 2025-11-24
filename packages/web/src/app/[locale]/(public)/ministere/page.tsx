import { getTranslations } from 'next-intl/server';

/**
 * Ministère Page - Localized
 * Displays list of ministries and their fiscal services
 *
 * Routes:
 * - /es/ministere
 * - /fr/ministere
 * - /en/ministere
 */

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'nav' });

  return {
    title: `${t('ministries')} - TaxasGE`,
    description: 'Ministerios de Guinea Ecuatorial y sus servicios fiscales',
  };
}

export default async function MinisterePage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'nav' });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{t('ministries')}</h1>
        <p className="text-lg text-muted-foreground">
          Explora los 8 ministerios de Guinea Ecuatorial y sus servicios fiscales
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* TODO: Fetch ministries from backend API */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-xl font-semibold mb-2">Ministerio de Hacienda</h3>
          <p className="text-sm text-muted-foreground">
            Gestión de impuestos y servicios fiscales principales
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-xl font-semibold mb-2">Ministerio de Economía</h3>
          <p className="text-sm text-muted-foreground">
            Servicios económicos y desarrollo empresarial
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-xl font-semibold mb-2">Ministerio de Trabajo</h3>
          <p className="text-sm text-muted-foreground">
            Impuestos laborales y seguridad social
          </p>
        </div>
      </div>
    </div>
  );
}
