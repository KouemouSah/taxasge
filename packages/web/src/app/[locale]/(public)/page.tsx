import { getTranslations } from 'next-intl/server';
import {
  HeroSection,
  StatsSection,
  FeaturesSection,
  ServicesDirectory,
} from '@/modules/homepage/components';

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
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <ServicesDirectory />
    </>
  );
}
