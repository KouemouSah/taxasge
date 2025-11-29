'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, ArrowLeft, FolderTree, Grid3x3, Briefcase, Info } from 'lucide-react';
import Breadcrumb from '@/components/ui/breadcrumb';
import { getMinistryDetails, type MinistryDetails, type MinistryServiceItem } from '@/core/api/homepage';

export default function MinistryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'es';
  const ministryId = params?.id as string;
  const t = useTranslations('ministryDetail');
  const tCommon = useTranslations('common');

  const [ministry, setMinistry] = useState<MinistryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const servicesPerPage = 12;

  // Fetch ministry details
  useEffect(() => {
    async function fetchMinistryDetails() {
      if (!ministryId) return;

      try {
        setLoading(true);
        setError(null);

        const result = await getMinistryDetails(parseInt(ministryId), {
          language: locale,
          page: currentPage,
          limit: servicesPerPage,
        });

        setMinistry(result);
      } catch (err) {
        console.error('Failed to fetch ministry details:', err);
        setError(t('errorLoading'));
      } finally {
        setLoading(false);
      }
    }

    fetchMinistryDetails();
  }, [ministryId, locale, currentPage, t]);

  const handleServiceClick = (serviceId: number) => {
    router.push(`/${locale}/services/${serviceId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-12 w-96 mb-4" />
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !ministry) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{error || t('notFound')}</h2>
          <Button onClick={() => router.push(`/${locale}/ministere`)} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToMinistries')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Breadcrumb
        items={[
          { label: t('ministries'), href: `/${locale}/ministere` },
          { label: ministry.name }
        ]}
        className="mb-6"
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <div className="p-4 rounded-lg bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">{ministry.name}</h1>
              {ministry.is_active && (
                <Badge variant="default">{tCommon('active')}</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {t('code')}: {ministry.ministry_code}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/ministere`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalSectors')}</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ministry.sector_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalCategories')}</CardTitle>
            <Grid3x3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ministry.category_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalServices')}</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ministry.service_count}</div>
          </CardContent>
        </Card>
      </div>

      {/* Ministry Information */}
      {ministry.description && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {t('information')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{ministry.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Services List */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">{t('services')}</h2>
      </div>

      {ministry.services.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t('noServices')}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ministry.services.map((service: MinistryServiceItem) => (
              <Card
                key={service.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleServiceClick(service.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{service.name}</CardTitle>
                  <Badge variant="secondary" className="w-fit">
                    {service.category_name}
                  </Badge>
                </CardHeader>
                <CardContent>
                  {service.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('expeditionPrice')}:</span>
                    <span className="font-semibold">
                      {service.expedition_price === 0 ? tCommon('free') : `${service.expedition_price.toLocaleString()} FCFA`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {ministry.total_pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                {tCommon('previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('page')} {ministry.current_page} {tCommon('of')} {ministry.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === ministry.total_pages}
              >
                {tCommon('next')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
