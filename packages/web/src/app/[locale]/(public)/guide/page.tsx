import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, HelpCircle, BookOpen, Users } from 'lucide-react';
import Breadcrumb from '@/components/ui/breadcrumb';

/**
 * Guide Page - Localized
 * User guides and documentation for tax services
 *
 * Routes:
 * - /es/guide
 * - /fr/guide
 * - /en/guide
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'guidePage' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'guidePage' });

  const guides = [
    {
      icon: FileText,
      title: t('howToDeclaration'),
      description: t('howToDeclarationDesc'),
      category: t('declarationsCategory'),
    },
    {
      icon: HelpCircle,
      title: t('faq'),
      description: t('faqDesc'),
      category: t('faqCategory'),
    },
    {
      icon: BookOpen,
      title: t('legislation'),
      description: t('legislationDesc'),
      category: t('legalCategory'),
    },
    {
      icon: Users,
      title: t('forBusinesses'),
      description: t('forBusinessesDesc'),
      category: t('businessCategory'),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <Breadcrumb
        items={[{ label: t('title') }]}
        className="mb-6"
      />

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-lg text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {guides.map((guide, index) => {
          const Icon = guide.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      {guide.category}
                    </div>
                    <CardTitle className="text-xl">{guide.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{guide.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
