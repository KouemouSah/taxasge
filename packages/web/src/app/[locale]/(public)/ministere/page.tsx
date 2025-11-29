'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Loader2, LayoutGrid, List, ArrowRight, Search } from 'lucide-react';
import Breadcrumb from '@/components/ui/breadcrumb';
import { getMinistryDirectory, type MinistryItem } from '@/core/api/homepage';

type ViewMode = 'kanban' | 'list';
type SortOption = 'name-asc' | 'name-desc' | 'count-desc';

export default function MinisterePage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'es';
  const t = useTranslations('ministriesPage');
  const tCommon = useTranslations('common');

  const [ministries, setMinistries] = useState<MinistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('count-desc');

  useEffect(() => {
    async function fetchMinistries() {
      try {
        setLoading(true);
        setError(null);

        // Fetch ministry directory from homepage API
        const result = await getMinistryDirectory(locale);
        setMinistries(result.ministries);
      } catch (err) {
        console.error('Failed to fetch ministries:', err);
        setError(t('errorLoading'));
      } finally {
        setLoading(false);
      }
    }

    fetchMinistries();
  }, [locale, t]);

  // Filter and sort ministries based on search query and sort option
  const filteredMinistries = useMemo(() => {
    let result = ministries;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(ministry =>
        ministry.name?.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...result];
    switch (sortOption) {
      case 'name-asc':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-desc':
        sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'count-desc':
        sorted.sort((a, b) => (b.service_count || 0) - (a.service_count || 0));
        break;
    }

    return sorted;
  }, [ministries, searchQuery, sortOption]);

  const handleMinistryClick = (ministry: MinistryItem) => {
    router.push(`/${locale}/ministere/${ministry.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Breadcrumb
        items={[{ label: t('title') }]}
        className="mb-6"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
          <p className="text-lg text-muted-foreground">
            {t('description')}
          </p>
        </div>

        {!loading && ministries.length > 0 && (
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">{tCommon('viewKanban')}</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">{tCommon('viewList')}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Search and Sort */}
      {!loading && ministries.length > 0 && (
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-5"
            />
          </div>
          <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">{t('sortNameAsc')}</SelectItem>
              <SelectItem value="name-desc">{t('sortNameDesc')}</SelectItem>
              <SelectItem value="count-desc">{t('sortCountDesc')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">{t('loading')}</span>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {!loading && !error && ministries.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t('noMinistries')}</p>
        </div>
      )}

      {!loading && !error && ministries.length > 0 && filteredMinistries.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t('noResults')}</p>
        </div>
      )}

      {/* Kanban View */}
      {!loading && !error && filteredMinistries.length > 0 && viewMode === 'kanban' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMinistries.map((ministry) => (
            <Card
              key={ministry.id}
              className="group cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={() => handleMinistryClick(ministry)}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {ministry.name}
                    </h3>
                    <Badge variant="secondary">
                      {t('servicesCount', { count: ministry.service_count })}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('viewServices')}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && !error && filteredMinistries.length > 0 && viewMode === 'list' && (
        <div className="space-y-4">
          {filteredMinistries.map((ministry) => (
            <Card
              key={ministry.id}
              className="group cursor-pointer hover:shadow-md transition-all duration-300"
              onClick={() => handleMinistryClick(ministry)}
            >
              <div className="p-6 flex items-center gap-6">
                <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {ministry.name}
                  </h3>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {t('servicesCount', { count: ministry.service_count })}
                </Badge>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
