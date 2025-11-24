'use client';

import { Users, FileCheck, Building2, TrendingUp, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getHomepageStats, getDefaultStats, type HomepageStats } from '@/lib/api/homepageApi';

export const StatsSection = () => {
  const [stats, setStats] = useState<HomepageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('stats');
  const tCommon = useTranslations('common');

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);
        const data = await getHomepageStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch homepage stats:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load statistics';
        setError(errorMessage);
        // Use default/fallback stats on error
        setStats(getDefaultStats());
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const displayStats = [
    {
      icon: FileCheck,
      value: loading ? '...' : stats?.total_services.toString() || '0',
      label: t('fiscalServices'),
      description: t('fiscalServicesDesc'),
      color: 'text-primary',
    },
    {
      icon: Building2,
      value: loading ? '...' : stats?.total_ministries.toString() || '0',
      label: t('ministries'),
      description: t('ministriesDesc'),
      color: 'text-red-600',
    },
    {
      icon: Users,
      value: loading ? '...' : stats?.total_categories.toString() || '0',
      label: t('categories'),
      description: t('categoriesDesc'),
      color: 'text-yellow-600',
    },
    {
      icon: TrendingUp,
      value: loading ? '...' : stats?.total_sectors.toString() || '0',
      label: t('sectors'),
      description: t('sectorsDesc'),
      color: 'text-green-600',
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t('title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t('description')}</p>
        </div>

        {/* Error Alert */}
        {error && !loading && (
          <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t('errorLoading')}: {error}.</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="font-semibold text-foreground">{stat.label}</div>
                    <div className="text-sm text-muted-foreground">{stat.description}</div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
