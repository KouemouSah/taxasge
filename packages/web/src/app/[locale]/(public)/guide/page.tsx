import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, HelpCircle, BookOpen, Users } from 'lucide-react';

/**
 * Guide Page - Localized
 * User guides and documentation for tax services
 *
 * Routes:
 * - /es/guide
 * - /fr/guide
 * - /en/guide
 */

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'nav' });

  return {
    title: `${t('guide')} - TaxasGE`,
    description: 'Guías y documentación para servicios fiscales',
  };
}

export default async function GuidePage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'nav' });

  const guides = [
    {
      icon: FileText,
      title: 'Cómo Hacer una Declaración',
      description: 'Guía paso a paso para completar tu declaración fiscal',
      category: 'Declaraciones',
    },
    {
      icon: HelpCircle,
      title: 'Preguntas Frecuentes',
      description: 'Respuestas a las preguntas más comunes sobre impuestos',
      category: 'FAQ',
    },
    {
      icon: BookOpen,
      title: 'Legislación Fiscal',
      description: 'Marco legal y normativas fiscales de Guinea Ecuatorial',
      category: 'Legal',
    },
    {
      icon: Users,
      title: 'Para Empresas',
      description: 'Guía especial para empresas y autónomos',
      category: 'Empresas',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{t('guide')}</h1>
        <p className="text-lg text-muted-foreground">
          Guías y recursos para gestionar tus obligaciones fiscales
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
