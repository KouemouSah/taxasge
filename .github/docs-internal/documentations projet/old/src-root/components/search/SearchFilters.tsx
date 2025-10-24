'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { SearchFilters as SearchFiltersType } from '@/types/tax'
import { formatCurrency } from '@/lib/utils'

interface SearchFiltersProps {
  initialFilters: SearchFiltersType
}

export function SearchFilters({ initialFilters }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFiltersType>(initialFilters)
  const [isExpanded, setIsExpanded] = useState(true)
  const [priceRange, setPriceRange] = useState([0, 100000])
  
  const router = useRouter()
  const searchParams = useSearchParams()

  // Données de filtres (en production, viendraient de l'API)
  const filterOptions = {
    ministries: [
      { id: 'M-001', name: 'Ministerio de Hacienda y Presupuestos', count: 156 },
      { id: 'M-002', name: 'Ministerio de Comercio e Industria', count: 89 },
      { id: 'M-003', name: 'Ministerio de Transportes', count: 67 },
      { id: 'M-004', name: 'Ministerio del Interior', count: 45 },
      { id: 'M-005', name: 'Ministerio de Obras Públicas', count: 78 },
      { id: 'M-006', name: 'Ministerio de Agricultura', count: 34 },
      { id: 'M-007', name: 'Ministerio de Educación', count: 23 },
      { id: 'M-008', name: 'Ministerio de Sanidad', count: 55 }
    ],
    
    serviceTypes: [
      { id: 'license', name: 'Licencias', count: 145 },
      { id: 'permit', name: 'Permisos', count: 123 },
      { id: 'certificate', name: 'Certificados', count: 98 },
      { id: 'registration', name: 'Registros', count: 87 },
      { id: 'declaration', name: 'Declaraciones', count: 65 },
      { id: 'other', name: 'Otros', count: 29 }
    ],
    
    categories: [
      { id: 'transport', name: 'Transporte', count: 89 },
      { id: 'commerce', name: 'Comercio', count: 156 },
      { id: 'identity', name: 'Documentos de Identidad', count: 45 },
      { id: 'tax_declarations', name: 'Declaraciones Fiscales', count: 67 },
      { id: 'customs', name: 'Aduanas', count: 34 },
      { id: 'construction', name: 'Construcción', count: 78 },
      { id: 'agriculture', name: 'Agricultura', count: 23 },
      { id: 'health', name: 'Sanidad', count: 55 }
    ]
  }

  useEffect(() => {
    // Initialiser le range de prix basé sur les filtres URL
    if (initialFilters.minPrice || initialFilters.maxPrice) {
      setPriceRange([
        initialFilters.minPrice || 0,
        initialFilters.maxPrice || 100000
      ])
    }
  }, [initialFilters])

  const updateFilters = (newFilters: Partial<SearchFiltersType>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    
    // Mettre à jour l'URL
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value))
      } else {
        params.delete(key)
      }
    })
    
    // Reset pagination quand on change les filtres
    params.delete('page')
    
    router.push(`/search?${params.toString()}`)
  }

  const clearAllFilters = () => {
    setFilters({})
    setPriceRange([0, 100000])
    
    // Garder seulement la query de recherche
    const params = new URLSearchParams()
    const query = searchParams.get('q')
    if (query) {
      params.set('q', query)
    }
    
    router.push(`/search?${params.toString()}`)
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== null && value !== ''
  )

  const activeFilterCount = Object.values(filters).filter(value => 
    value !== undefined && value !== null && value !== ''
  ).length

  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-foreground">Filtres</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Ministères */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-3 block">
                Ministère
              </Label>
              <Select 
                value={filters.ministry || ''} 
                onValueChange={(value) => updateFilters({ ministry: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les ministères" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les ministères</SelectItem>
                  {filterOptions.ministries.map((ministry) => (
                    <SelectItem key={ministry.id} value={ministry.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{ministry.name}</span>
                        <Badge variant="secondary" className="text-xs ml-2">
                          {ministry.count}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Types de service */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-3 block">
                Type de Service
              </Label>
              <div className="space-y-2">
                {filterOptions.serviceTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type.id}`}
                      checked={filters.serviceType === type.id}
                      onCheckedChange={(checked) => {
                        updateFilters({ 
                          serviceType: checked ? type.id : undefined 
                        })
                      }}
                    />
                    <Label 
                      htmlFor={`type-${type.id}`}
                      className="text-sm flex-1 flex items-center justify-between cursor-pointer"
                    >
                      <span>{type.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {type.count}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Catégories */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-3 block">
                Catégorie
              </Label>
              <Select 
                value={filters.category || ''} 
                onValueChange={(value) => updateFilters({ category: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les catégories</SelectItem>
                  {filterOptions.categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{category.name}</span>
                        <Badge variant="secondary" className="text-xs ml-2">
                          {category.count}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fourchette de prix */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-3 block">
                Fourchette de Prix
              </Label>
              <div className="space-y-4">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  onValueCommit={(value) => {
                    updateFilters({
                      minPrice: value[0] > 0 ? value[0] : undefined,
                      maxPrice: value[1] < 100000 ? value[1] : undefined
                    })
                  }}
                  max={100000}
                  min={0}
                  step={1000}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatCurrency(priceRange[0])}</span>
                  <span>{formatCurrency(priceRange[1])}</span>
                </div>
              </div>
            </div>

            {/* Options avancées */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-3 block">
                Options
              </Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="online-available"
                    checked={filters.isOnlineAvailable || false}
                    onCheckedChange={(checked) => {
                      updateFilters({ 
                        isOnlineAvailable: checked ? true : undefined 
                      })
                    }}
                  />
                  <Label htmlFor="online-available" className="text-sm cursor-pointer">
                    Disponible en ligne
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="urgent-available"
                    checked={filters.isUrgentAvailable || false}
                    onCheckedChange={(checked) => {
                      updateFilters({ 
                        isUrgentAvailable: checked ? true : undefined 
                      })
                    }}
                  />
                  <Label htmlFor="urgent-available" className="text-sm cursor-pointer">
                    Traitement urgent disponible
                  </Label>
                </div>
              </div>
            </div>

            {/* Résumé des filtres actifs */}
            {hasActiveFilters && (
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Filtres actifs
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs"
                  >
                    Tout effacer
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {filters.ministry && (
                    <Badge variant="secondary" className="text-xs">
                      Ministère
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-auto p-0"
                        onClick={() => updateFilters({ ministry: undefined })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  
                  {filters.serviceType && (
                    <Badge variant="secondary" className="text-xs">
                      Type
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-auto p-0"
                        onClick={() => updateFilters({ serviceType: undefined })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  
                  {filters.category && (
                    <Badge variant="secondary" className="text-xs">
                      Catégorie
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-auto p-0"
                        onClick={() => updateFilters({ category: undefined })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  
                  {(filters.minPrice || filters.maxPrice) && (
                    <Badge variant="secondary" className="text-xs">
                      Prix
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-auto p-0"
                        onClick={() => {
                          updateFilters({ minPrice: undefined, maxPrice: undefined })
                          setPriceRange([0, 100000])
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}