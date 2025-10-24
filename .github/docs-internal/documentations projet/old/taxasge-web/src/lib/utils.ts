import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatage des devises
export function formatCurrency(
  amount: number, 
  currency: string = 'XAF',
  locale: string = 'es-GQ'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch (error) {
    // Fallback si locale non supportée
    return `${amount.toLocaleString()} ${currency}`
  }
}

// Formatage des nombres
export function formatNumber(
  number: number,
  locale: string = 'es-GQ'
): string {
  try {
    return new Intl.NumberFormat(locale).format(number)
  } catch (error) {
    return number.toLocaleString()
  }
}

// Formatage des dates
export function formatDate(
  date: string | Date,
  locale: string = 'es-GQ',
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    }).format(dateObj)
  } catch (error) {
    return date.toString()
  }
}

// Formatage des dates relatives
export function formatRelativeTime(
  date: string | Date,
  locale: string = 'es-GQ'
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'hace un momento'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `hace ${hours} hora${hours > 1 ? 's' : ''}`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `hace ${days} día${days > 1 ? 's' : ''}`
    } else {
      return formatDate(dateObj, locale, { month: 'short', day: 'numeric' })
    }
  } catch (error) {
    return formatDate(date, locale)
  }
}

// Validation email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validation téléphone (format international)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+[1-9]\d{1,14}$/
  return phoneRegex.test(phone)
}

// Génération d'ID unique
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `${prefix}${timestamp}${randomStr}`
}

// Debounce pour optimiser les recherches
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle pour limiter les appels
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Capitalisation des mots
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Titre case pour noms propres
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ')
}

// Slug pour URLs
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer accents
    .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces, tirets
    .trim()
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-') // Supprimer tirets multiples
}

// Extraction des initiales
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

// Validation force du mot de passe
export function getPasswordStrength(password: string): {
  score: number
  feedback: string[]
} {
  let score = 0
  const feedback: string[] = []

  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Au moins 8 caractères')
  }

  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Au moins une minuscule')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Au moins une majuscule')
  }

  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Au moins un chiffre')
  }

  if (/[^a-zA-Z\d]/.test(password)) {
    score += 1
  } else {
    feedback.push('Au moins un caractère spécial')
  }

  return { score, feedback }
}

// Copie dans le presse-papier
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback pour navigateurs plus anciens
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const result = document.execCommand('copy')
      document.body.removeChild(textArea)
      return result
    }
  } catch (error) {
    console.error('Copy to clipboard failed:', error)
    return false
  }
}

// Détection du type d'appareil
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  
  if (width < 768) {
    return 'mobile'
  } else if (width < 1024) {
    return 'tablet'
  } else {
    return 'desktop'
  }
}

// Détection des capacités du navigateur
export function getBrowserCapabilities() {
  if (typeof window === 'undefined') {
    return {
      serviceWorker: false,
      pushNotifications: false,
      webShare: false,
      speechRecognition: false,
      geolocation: false,
      camera: false,
    }
  }

  return {
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window,
    webShare: 'share' in navigator,
    speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    geolocation: 'geolocation' in navigator,
    camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
  }
}

// Gestion des erreurs avec contexte
export function createErrorHandler(context: string) {
  return (error: any, fallback?: any) => {
    console.error(`[${context}] Error:`, error)
    
    // En développement, afficher plus de détails
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack trace:', error.stack)
    }
    
    // Retourner fallback si fourni
    return fallback
  }
}

// Validation des données avec schémas
export function validateRequired<T>(
  data: Partial<T>,
  requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = []
  
  requiredFields.forEach(field => {
    if (!data[field]) {
      missingFields.push(String(field))
    }
  })
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  }
}

// Formatage des tailles de fichier
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Génération de couleurs cohérentes
export function generateColorFromString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = hash % 360
  return `hsl(${hue}, 70%, 50%)`
}

// Utilitaires pour localStorage avec gestion d'erreurs
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue || null
    } catch (error) {
      console.error(`Failed to get ${key} from localStorage:`, error)
      return defaultValue || null
    }
  },
  
  set: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Failed to set ${key} in localStorage:`, error)
      return false
    }
  },
  
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Failed to remove ${key} from localStorage:`, error)
      return false
    }
  },
  
  clear: (): boolean => {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
      return false
    }
  },
}

// Utilitaires pour URL et navigation
export function buildSearchURL(query: string, filters: Record<string, any> = {}): string {
  const params = new URLSearchParams()
  
  if (query) params.set('q', query)
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })
  
  return `/search?${params.toString()}`
}

// Utilitaires pour performance
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now()
  
  const result = fn()
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const end = performance.now()
      console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`)
    })
  } else {
    const end = performance.now()
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`)
    return result
  }
}