import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Hero from '@/components/Hero';
import StatsSection from '@/components/StatsSection';
import FeaturesSection from '@/components/FeaturesSection';
import ServicesDirectory from '@/components/ServicesDirectory';

/**
 * Homepage - Localized
 *
 * Routes:
 * - /es (Spanish - default)
 * - /fr (French)
 * - /en (English)
 */

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'common' });

  return {
    title: t('appName') + ' - ' + t('appDescription'),
    description: t('appDescription'),
  };
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsSection />
      <FeaturesSection />
      <ServicesDirectory />
    </>
  );
}
