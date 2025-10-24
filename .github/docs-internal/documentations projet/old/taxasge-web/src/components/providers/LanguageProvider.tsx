'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

type Language = 'es' | 'fr' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Traductions de base (sera étendu avec un système complet)
const translations = {
  es: {
    'nav.home': 'Inicio',
    'nav.search': 'Buscar',
    'nav.calculate': 'Calcular',
    'nav.chat': 'Asistente IA',
    'nav.dashboard': 'Panel',
    'hero.title': 'Servicios Fiscales de Guinea Ecuatorial',
    'hero.subtitle': '547 servicios fiscales oficiales con calculadora y asistente IA',
    'hero.search.placeholder': 'Buscar servicios fiscales...',
    'actions.search': 'Buscar Servicios',
    'actions.calculate': 'Calculadora Fiscal',
    'actions.favorites': 'Mis Favoritos',
    'actions.assistant': 'Asistente IA',
    'stats.services': 'Servicios Fiscales',
    'stats.ministries': 'Ministerios',
    'stats.users': 'Usuarios Activos',
    'stats.calculations': 'Cálculos Realizados',
  },
  fr: {
    'nav.home': 'Accueil',
    'nav.search': 'Rechercher',
    'nav.calculate': 'Calculer',
    'nav.chat': 'Assistant IA',
    'nav.dashboard': 'Tableau de bord',
    'hero.title': 'Services Fiscaux de Guinée Équatoriale',
    'hero.subtitle': '547 services fiscaux officiels avec calculatrice et assistant IA',
    'hero.search.placeholder': 'Rechercher services fiscaux...',
    'actions.search': 'Rechercher Services',
    'actions.calculate': 'Calculatrice Fiscale',
    'actions.favorites': 'Mes Favoris',
    'actions.assistant': 'Assistant IA',
    'stats.services': 'Services Fiscaux',
    'stats.ministries': 'Ministères',
    'stats.users': 'Utilisateurs Actifs',
    'stats.calculations': 'Calculs Réalisés',
  },
  en: {
    'nav.home': 'Home',
    'nav.search': 'Search',
    'nav.calculate': 'Calculate',
    'nav.chat': 'AI Assistant',
    'nav.dashboard': 'Dashboard',
    'hero.title': 'Equatorial Guinea Tax Services',
    'hero.subtitle': '547 official tax services with calculator and AI assistant',
    'hero.search.placeholder': 'Search tax services...',
    'actions.search': 'Search Services',
    'actions.calculate': 'Tax Calculator',
    'actions.favorites': 'My Favorites',
    'actions.assistant': 'AI Assistant',
    'stats.services': 'Tax Services',
    'stats.ministries': 'Ministries',
    'stats.users': 'Active Users',
    'stats.calculations': 'Calculations Made',
  },
}

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>('es')

  useEffect(() => {
    // Détecter langue du navigateur ou localStorage
    const savedLanguage = localStorage.getItem('taxasge-language') as Language
    const browserLanguage = navigator.language.split('-')[0] as Language
    
    if (savedLanguage && ['es', 'fr', 'en'].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    } else if (['es', 'fr', 'en'].includes(browserLanguage)) {
      setLanguage(browserLanguage)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('taxasge-language', lang)
    
    // Mettre à jour l'attribut lang du document
    document.documentElement.lang = lang
  }

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    return value || key
  }

  const value = {
    language,
    setLanguage: handleSetLanguage,
    t,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}