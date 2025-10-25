'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Mic, X, Clock, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface SearchInterfaceProps {
  initialQuery?: string
}

export function SearchInterface({ initialQuery = '' }: SearchInterfaceProps) {
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  useEffect(() => {
    // Charger recherches récentes depuis localStorage
    const saved = localStorage.getItem('taxasge-recent-searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load recent searches:', error)
      }
    }
  }, [])

  useEffect(() => {
    // Générer suggestions basées sur la requête
    if (query.length >= 2) {
      const mockSuggestions = generateSuggestions(query)
      setSuggestions(mockSuggestions)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [query])

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return

    // Sauvegarder dans recherches récentes
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('taxasge-recent-searches', JSON.stringify(updated))

    // Naviguer vers résultats
    const params = new URLSearchParams(searchParams.toString())
    params.set('q', searchQuery.trim())
    params.delete('page') // Reset pagination
    
    router.push(`/search?${params.toString()}`)
    setShowSuggestions(false)
  }

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Recherche vocale non supportée par votre navigateur')
      return
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.lang = 'es-GQ' // Espagnol Guinée Équatoriale
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setQuery(transcript)
      handleSearch(transcript)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('taxasge-recent-searches')
  }

  return (
    <div className="relative">
      {/* Barre de recherche principale */}
      <form 
        onSubmit={(e) => {
          e.preventDefault()
          handleSearch()
        }}
        className="relative"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('hero.search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(query.length >= 2)}
            className="pl-12 pr-24 py-4 text-lg border-2 border-border focus:border-primary rounded-xl shadow-sm"
          />
          
          {/* Boutons dans l'input */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {/* Recherche vocale */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleVoiceSearch}
              className={`p-2 ${isListening ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`}
              title="Recherche vocale"
            >
              <Mic className="h-4 w-4" />
            </Button>
            
            {/* Bouton recherche */}
            <Button 
              type="submit"
              size="sm"
              disabled={!query.trim()}
              className="px-4"
            >
              Rechercher
            </Button>
          </div>
        </div>
      </form>

      {/* Suggestions et recherches récentes */}
      {(showSuggestions || (!query && recentSearches.length > 0)) && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg border-2">
          <CardContent className="p-0">
            {/* Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="p-4 border-b">
                <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Suggestions
                </div>
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(suggestion)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors flex items-center space-x-2"
                    >
                      <Search className="h-3 w-3 text-muted-foreground" />
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recherches récentes */}
            {!query && recentSearches.length > 0 && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-muted-foreground flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Recherches récentes
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Effacer
                  </Button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(search)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors flex items-center space-x-2"
                    >
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{search}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overlay pour fermer suggestions */}
      {showSuggestions && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  )
}

// Fonction pour générer suggestions (sera remplacée par API)
function generateSuggestions(query: string): string[] {
  const allSuggestions = [
    'Permis de conduire',
    'Patente commerciale',
    'Carte de séjour',
    'Déclaration TVA',
    'Licence d\'exportation',
    'Certificat de résidence',
    'Autorisation de travail',
    'Permis de construire',
    'Licence de transport',
    'Déclaration douanière',
    'Certificat d\'origine',
    'Permis d\'exploitation',
    'Licence professionnelle',
    'Autorisation sanitaire',
    'Permis environnemental'
  ]

  return allSuggestions
    .filter(suggestion => 
      suggestion.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 5)
}

// Déclaration types pour Speech Recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}