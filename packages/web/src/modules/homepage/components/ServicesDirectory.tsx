'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowRight,
  AlertCircle,
  Loader2,
  FileText,
  Award,
  Home,
  ClipboardCheck,
  Search,
  FileSpreadsheet,
  Package,
  Receipt,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  getServicesByType,
  getDefaultServicesByType,
  type ServiceType,
  type ServicesByTypeResponse,
  type ServiceByType,
} from '@/core/api/homepage';

// Service type configuration with icons
const SERVICE_TYPES: Array<{
  type: ServiceType;
  icon: typeof FileText;
  colorClass: string;
}> = [
  { type: 'document_processing', icon: FileText, colorClass: 'text-blue-600' },
  { type: 'license_permit', icon: Award, colorClass: 'text-purple-600' },
  { type: 'residence_permit', icon: Home, colorClass: 'text-green-600' },
  { type: 'registration_fee', icon: ClipboardCheck, colorClass: 'text-yellow-600' },
  { type: 'inspection_fee', icon: Search, colorClass: 'text-red-600' },
  { type: 'administrative_tax', icon: FileSpreadsheet, colorClass: 'text-indigo-600' },
  { type: 'customs_duty', icon: Package, colorClass: 'text-orange-600' },
  { type: 'declaration_tax', icon: Receipt, colorClass: 'text-pink-600' },
];

export const ServicesDirectory = () => {
  const router = useRouter();
  const locale = useLocale();
  // Default to first service type (document_processing)
  const [selectedType, setSelectedType] = useState<ServiceType>('document_processing');
  const [servicesData, setServicesData] = useState<ServicesByTypeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('directory');
  const tServiceTypes = useTranslations('serviceTypes');

  // Fetch services when type changes - load more services (100) to show grouped by letter
  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        setError(null);
        // Load 300 services (optimized: covers most letters without overload)
        const data = await getServicesByType(selectedType, {
          language: locale,
          limit: 300,
        });
        setServicesData(data);
      } catch (err) {
        console.error('Failed to fetch services by type:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load services';
        setError(errorMessage);
        setServicesData(getDefaultServicesByType(selectedType));
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, [selectedType, locale]);

  const getServiceName = (service: ServiceByType) => {
    if (locale === 'es') return service.name_es;
    if (locale === 'fr') return service.name_fr || service.name_es;
    return service.name_en || service.name_es;
  };

  const handleTypeClick = (type: ServiceType) => {
    setSelectedType(type);
  };

  const handleViewMore = () => {
    router.push(`/${locale}/services?service_type=${selectedType}`);
  };

  // Group services by first character: A-Z, 0-9 (grouped as "#"), others (grouped as "*")
  const groupServicesByLetter = (services: ServiceByType[]): Record<string, ServiceByType[]> => {
    const grouped: Record<string, ServiceByType[]> = {};
    services.forEach((service) => {
      const name = getServiceName(service);
      const firstChar = name.charAt(0).toUpperCase();

      let groupKey: string;
      if (/^[A-Z]$/.test(firstChar)) {
        groupKey = firstChar; // Letters A-Z
      } else if (/^[0-9]$/.test(firstChar)) {
        groupKey = '#'; // Numbers grouped under "#"
      } else {
        groupKey = '*'; // Special characters grouped under "*"
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(service);
    });
    return grouped;
  };

  const groupedServices = servicesData ? groupServicesByLetter(servicesData.services) : {};
  // Sort: # (numbers) first, then A-Z, then * (special) at end
  const availableLetters = Object.keys(groupedServices).sort((a, b) => {
    if (a === '#') return -1;
    if (b === '#') return 1;
    if (a === '*') return 1;
    if (b === '*') return -1;
    return a.localeCompare(b);
  });

  // Group letters in chunks of 3 for 3-column layout (A/B/C, D/E/F, etc.)
  const groupLettersInChunks = (letters: string[]): string[][] => {
    const chunks: string[][] = [];
    for (let i = 0; i < letters.length; i += 3) {
      chunks.push(letters.slice(i, i + 3));
    }
    return chunks;
  };

  const letterChunks = groupLettersInChunks(availableLetters);

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold mb-3">{t('title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t('description')}</p>
        </div>

        {error && !loading && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('errorLoading')}: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Service Type Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {SERVICE_TYPES.map(({ type, icon: Icon, colorClass }) => (
            <Card
              key={type}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedType === type ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onClick={() => handleTypeClick(type)}
            >
              <div className="p-6 flex flex-col items-center text-center space-y-3">
                <div
                  className={`h-12 w-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center ${
                    selectedType === type ? 'bg-primary/20' : ''
                  }`}
                >
                  <Icon className={`h-6 w-6 ${colorClass}`} />
                </div>
                <h3 className="font-semibold text-sm leading-tight">
                  {tServiceTypes(`${type}.name`)}
                </h3>
              </div>
            </Card>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">{t('loading')}</span>
          </div>
        )}

        {/* Services Display - 3 Column Layout by Letter */}
        {!loading && servicesData && servicesData.services.length > 0 && (
          <>
            {/* Services grouped by letter in 3-column layout */}
            <div className="space-y-8">
              {letterChunks.map((chunk, chunkIndex) => (
                <div key={chunkIndex} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {chunk.map((letter) => (
                    <div key={letter} id={`letter-${letter}`} className="scroll-mt-20">
                      {/* Letter Header */}
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                          {letter}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {groupedServices[letter].length} services
                        </span>
                      </div>

                      {/* Services List - Vertical with alternating colors */}
                      <div className="space-y-0">
                        {groupedServices[letter].slice(0, 8).map((service, index) => (
                          <div
                            key={service.id}
                            className={`group cursor-pointer p-2 rounded transition-colors ${
                              index % 2 === 0 ? 'bg-muted/30' : 'bg-background'
                            } hover:bg-primary/10`}
                            onClick={() => router.push(`/${locale}/services/${service.id}`)}
                          >
                            <p className="text-sm group-hover:text-primary transition-colors line-clamp-1">
                              {getServiceName(service)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Show "more" indicator if there are more than 8 services for this letter */}
                      {groupedServices[letter].length > 8 && (
                        <p className="text-xs text-muted-foreground mt-1 pl-2">
                          +{groupedServices[letter].length - 8} más...
                        </p>
                      )}
                    </div>
                  ))}
                  {/* Fill empty columns if chunk has less than 3 letters */}
                  {chunk.length < 3 && Array.from({ length: 3 - chunk.length }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                </div>
              ))}
            </div>

            {/* View More Button */}
            <div className="mt-12 text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('showing', {
                  count: servicesData.services.length,
                  total: servicesData.total,
                })}
              </p>
              {servicesData.has_more && (
                <Button onClick={handleViewMore} size="lg" className="min-w-[200px]">
                  {t('seeMore')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && servicesData && servicesData.services.length === 0 && (
          <Card className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('empty')}</h3>
            <p className="text-muted-foreground">{t('emptyDescription')}</p>
          </Card>
        )}
      </div>
    </section>
  );
};

export default ServicesDirectory;
