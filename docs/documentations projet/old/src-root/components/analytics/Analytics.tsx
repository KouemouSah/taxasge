'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Script from 'next/script'

// Configuration Google Analytics
const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

// Types pour les événements personnalisés
interface CustomEvent {
  action: string
  category: string
  label?: string
  value?: number
}

// Déclaration globale pour gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: any
    ) => void
  }
}

export function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!GA_TRACKING_ID || !window.gtag) return

    // Track page views
    window.gtag('config', GA_TRACKING_ID, {
      page_location: window.location.href,
      page_title: document.title,
    })
  }, [pathname, searchParams])

  // Ne pas charger en développement
  if (process.env.NODE_ENV === 'development' || !GA_TRACKING_ID) {
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_location: window.location.href,
              page_title: document.title,
              // Configuration pour TaxasGE
              custom_map: {
                'custom_parameter_1': 'tax_service_id',
                'custom_parameter_2': 'calculation_amount',
                'custom_parameter_3': 'user_language'
              },
              // Respect de la vie privée
              anonymize_ip: true,
              allow_google_signals: false,
              allow_ad_personalization_signals: false
            });
          `,
        }}
      />
    </>
  )
}

// Fonctions utilitaires pour tracking des événements TaxasGE
export const trackEvent = (event: CustomEvent) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
    })
  }
}

// Événements spécifiques TaxasGE
export const trackTaxView = (taxId: string, taxName: string) => {
  trackEvent({
    action: 'tax_view',
    category: 'engagement',
    label: `${taxId}: ${taxName}`,
  })
}

export const trackCalculation = (taxId: string, amount: number, calculationType: string) => {
  trackEvent({
    action: 'tax_calculation',
    category: 'conversion',
    label: `${taxId}: ${calculationType}`,
    value: amount,
  })
}

export const trackSearch = (query: string, resultsCount: number) => {
  trackEvent({
    action: 'search',
    category: 'engagement',
    label: query,
    value: resultsCount,
  })
}

export const trackFavoriteAdd = (taxId: string) => {
  trackEvent({
    action: 'favorite_add',
    category: 'engagement',
    label: taxId,
  })
}

export const trackPDFExport = (taxId: string, exportType: string) => {
  trackEvent({
    action: 'pdf_export',
    category: 'conversion',
    label: `${taxId}: ${exportType}`,
  })
}

export const trackLanguageChange = (newLanguage: string) => {
  trackEvent({
    action: 'language_change',
    category: 'user_preference',
    label: newLanguage,
  })
}

export const trackOfflineUsage = (feature: string) => {
  trackEvent({
    action: 'offline_usage',
    category: 'technical',
    label: feature,
  })
}