'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'es' | 'fr' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Dictionnaire de traductions (à externaliser dans un fichier JSON)
const translations: Record<Language, Record<string, string>> = {
  es: {
    'hero.title': 'TaxasGE',
    'hero.subtitle': 'Gestión Fiscal Simplificada para Guinea Ecuatorial',
    'hero.search.placeholder': 'Buscar servicios fiscales...',
    'nav.home': 'Inicio',
    'nav.search': 'Buscar',
    'nav.calculate': 'Calculadora',
    'nav.chat': 'Asistente',
    'nav.dashboard': 'Panel',
    'actions.favorites': 'Favoritos',
    'stats.services': 'Servicios',
    'stats.ministries': 'Ministerios',
    'stats.users': 'Usuarios',
    'stats.calculations': 'Cálculos',
  },
  fr: {
    'hero.title': 'TaxasGE',
    'hero.subtitle': 'Gestion Fiscale Simplifiée pour la Guinée Équatoriale',
    'hero.search.placeholder': 'Rechercher des services fiscaux...',
    'nav.home': 'Accueil',
    'nav.search': 'Rechercher',
    'nav.calculate': 'Calculatrice',
    'nav.chat': 'Assistant',
    'nav.dashboard': 'Tableau de bord',
    'actions.favorites': 'Favoris',
    'stats.services': 'Services',
    'stats.ministries': 'Ministères',
    'stats.users': 'Utilisateurs',
    'stats.calculations': 'Calculs',
  },
  en: {
    'hero.title': 'TaxasGE',
    'hero.subtitle': 'Simplified Tax Management for Equatorial Guinea',
    'hero.search.placeholder': 'Search tax services...',
    'nav.home': 'Home',
    'nav.search': 'Search',
    'nav.calculate': 'Calculator',
    'nav.chat': 'Assistant',
    'nav.dashboard': 'Dashboard',
    'actions.favorites': 'Favorites',
    'stats.services': 'Services',
    'stats.ministries': 'Ministries',
    'stats.users': 'Users',
    'stats.calculations': 'Calculations',
  },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es')

  useEffect(() => {
    // Charger la langue depuis localStorage au montage
    const storedLang = localStorage.getItem('taxasge-language') as Language
    if (storedLang && ['es', 'fr', 'en'].includes(storedLang)) {
      setLanguageState(storedLang)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('taxasge-language', lang)
  }

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
