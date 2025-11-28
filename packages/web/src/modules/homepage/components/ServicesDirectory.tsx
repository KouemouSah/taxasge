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

// Alphabet for grouping
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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
        // Load 100 services to display grouped by letter
        const data = await getServicesByType(selectedType, {
          language: locale,
          limit: 100,
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

  // Group services by first letter for display
  const groupServicesByLetter = (services: ServiceByType[]): Record<string, ServiceByType[]> => {
    const grouped: Record<string, ServiceByType[]> = {};
    services.forEach((service) => {
      const name = getServiceName(service);
      const firstLetter = name.charAt(0).toUpperCase();
      // Only include valid letters A-Z
      if (ALPHABET.includes(firstLetter)) {
        if (!grouped[firstLetter]) {
          grouped[firstLetter] = [];
        }
        grouped[firstLetter].push(service);
      }
    });
    return grouped;
  };

  const groupedServices = servicesData ? groupServicesByLetter(servicesData.services) : {};
  const availableLetters = Object.keys(groupedServices).sort();

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

        {/* Services Display - Grouped by Letter */}
        {!loading && servicesData && servicesData.services.length > 0 && (
          <>
            {/* Alphabetical anchor navigation */}
            <div className="mb-6 flex flex-wrap gap-1 justify-center bg-muted/50 p-3 rounded-lg">
              {ALPHABET.map((letter) => {
                const hasServices = availableLetters.includes(letter);
                return (
                  <a
                    key={letter}
                    href={hasServices ? `#letter-${letter}` : undefined}
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                      hasServices
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                        : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                    }`}
                  >
                    {letter}
                  </a>
                );
              })}
            </div>

            {/* Services grouped by letter */}
            <div className="space-y-8">
              {availableLetters.map((letter) => (
                <div key={letter} id={`letter-${letter}`} className="scroll-mt-20">
                  {/* Letter Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                      {letter}
                    </div>
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-sm text-muted-foreground">
                      {groupedServices[letter].length} services
                    </span>
                  </div>

                  {/* Services Grid - 3 columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {groupedServices[letter].slice(0, 10).map((service) => (
                      <Card
                        key={service.id}
                        className="group cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
                        onClick={() => router.push(`/${locale}/services/${service.id}`)}
                      >
                        <div className="p-4">
                          <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                            {getServiceName(service)}
                          </h3>
                          {service.tasa_expedicion !== null && service.tasa_expedicion !== undefined && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {service.tasa_expedicion === 0
                                ? 'Gratis'
                                : `${service.tasa_expedicion.toLocaleString()} GNF`}
                            </p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Show "more" indicator if there are more than 10 services for this letter */}
                  {groupedServices[letter].length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      +{groupedServices[letter].length - 10} más...
                    </p>
                  )}
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
