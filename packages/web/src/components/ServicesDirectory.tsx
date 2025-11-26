'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Building, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getCategoryDirectory, getDefaultCategoryDirectory, type CategoryDirectory } from '@/core/api/homepage';

export const ServicesDirectory = () => {
  const router = useRouter();
  const locale = useLocale();
  const [directory, setDirectory] = useState<CategoryDirectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('directory');
  const tCommon = useTranslations('common');

  useEffect(() => {
    async function fetchDirectory() {
      try {
        setLoading(true);
        setError(null);
        const data = await getCategoryDirectory(locale);
        setDirectory(data);
      } catch (err) {
        console.error('Failed to fetch category directory:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load category directory';
        setError(errorMessage);
        // Use default/fallback directory on error
        setDirectory(getDefaultCategoryDirectory());
      } finally {
        setLoading(false);
      }
    }

    fetchDirectory();
  }, [locale]);

  // Display only top 8 categories
  const topCategories = directory?.categories.slice(0, 8) || [];

  // Get localized category name and description
  const getCategoryName = (category: any) => {
    if (locale === 'es') return category.name_es;
    if (locale === 'fr') return category.name_fr || category.name_es;
    return category.name_en || category.name_es;
  };

  const getCategoryDescription = (category: any) => {
    if (locale === 'es') return category.description_es;
    if (locale === 'fr') return category.description_fr || category.description_es;
    return category.description_en || category.description_es;
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold mb-3">{t('title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {loading
              ? t('loadingDescription')
              : t('description', {
                  services: directory?.total_services || 0,
                  categories: directory?.total_categories || 0,
                })}
          </p>
        </div>

        {/* Error Alert */}
        {error && !loading && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('errorLoading')}: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">{t('loading')}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && topCategories.length === 0 && (
          <Card className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('empty')}</h3>
            <p className="text-muted-foreground">{t('emptyDescription')}</p>
          </Card>
        )}

        {/* Category Grid */}
        {!loading && topCategories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topCategories.map((category) => (
              <Card
                key={category.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300"
                onClick={() => router.push(`/${locale}/services?category=${category.category_code}`)}
              >
                <div className="p-6 space-y-4">
                  {/* Category Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {category.icon && <span className="text-xl">{category.icon}</span>}
                      </div>
                      <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors line-clamp-2">
                        {getCategoryName(category)}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  {getCategoryDescription(category) && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {getCategoryDescription(category)}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="pt-4 border-t space-y-2">
                    {/* Service Count */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-primary">
                        {t('servicesCount', { count: category.service_count })}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>

                    {/* Ministry/Sector Info */}
                    {(category.ministry_name || category.sector_name) && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Building className="mr-1 h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{category.ministry_name || category.sector_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* View All Button (bottom) */}
        {!loading && topCategories.length > 0 && directory && directory.total_categories > 8 && (
          <div className="mt-8 text-center">
            <Button
              size="lg"
              onClick={() => router.push(`/${locale}/categories`)}
              className="min-w-[200px]"
            >
              {t('seeAllCategories')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ServicesDirectory;
