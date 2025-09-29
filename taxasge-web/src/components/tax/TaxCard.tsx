'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Heart, Calculator, Clock, Building, FileText, ExternalLink, Star } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Tax } from '@/types/tax'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useFavorites } from '@/hooks/useFavorites'
import { formatCurrency } from '@/lib/utils'

interface TaxCardProps {
  tax: Tax
  viewMode?: 'grid' | 'list'
  showCategory?: boolean
  showMinistry?: boolean
  showDescription?: boolean
  compact?: boolean
}

export function TaxCard({ 
  tax, 
  viewMode = 'grid',
  showCategory = true,
  showMinistry = true,
  showDescription = true,
  compact = false
}: TaxCardProps) {
  const { language } = useLanguage()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [isHovered, setIsHovered] = useState(false)

  const taxName = tax.name[language] || tax.name.es
  const taxDescription = tax.description?.[language] || tax.description?.es || ''
  const isFav = isFavorite(tax.id)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(tax.id)
  }

  const handleCalculateClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.open(`/calculate?service=${tax.id}`, '_blank')
  }

  if (viewMode === 'list') {
    return (
      <Card 
        className="group hover:shadow-md transition-all duration-200 hover:border-primary/30"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-4">
          <Link href={`/taxes/${tax.id}`} className="block">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {taxName}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {tax.id}
                      </Badge>
                      {tax.serviceType && (
                        <Badge variant="secondary" className="text-xs">
                          {tax.serviceType}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFavoriteClick}
                      className={`p-1 ${isFav ? 'text-red-500' : 'text-muted-foreground'}`}
                    >
                      <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCalculateClick}
                      className="p-1 text-muted-foreground hover:text-primary"
                    >
                      <Calculator className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {showDescription && taxDescription && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {taxDescription}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {/* Prix */}
                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="text-muted-foreground">Expédition:</span>
                      <span className="font-semibold text-foreground ml-1">
                        {formatCurrency(tax.prices.expedition)}
                      </span>
                    </div>
                    {tax.prices.renewal && (
                      <div>
                        <span className="text-muted-foreground">Renouvellement:</span>
                        <span className="font-semibold text-foreground ml-1">
                          {formatCurrency(tax.prices.renewal)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Délai */}
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{tax.processingTime}</span>
                  </div>

                  {/* Ministère */}
                  {showMinistry && (
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Building className="h-3 w-3" />
                      <span className="truncate">{tax.ministry}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Mode grille (par défaut)
  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline" className="text-xs font-mono">
                {tax.id}
              </Badge>
              {tax.isOnlineAvailable && (
                <Badge variant="secondary" className="text-xs">
                  En ligne
                </Badge>
              )}
              {tax.isUrgentAvailable && (
                <Badge variant="destructive" className="text-xs">
                  Urgent
                </Badge>
              )}
            </div>
            
            <Link href={`/taxes/${tax.id}`}>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                {taxName}
              </h3>
            </Link>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFavoriteClick}
            className={`p-1 ${isFav ? 'text-red-500' : 'text-muted-foreground'} hover:scale-110 transition-transform`}
          >
            <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Link href={`/taxes/${tax.id}`} className="block">
          {/* Description */}
          {showDescription && taxDescription && !compact && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
              {taxDescription}
            </p>
          )}

          {/* Informations principales */}
          <div className="space-y-3">
            {/* Prix */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expédition</span>
                <span className="font-semibold text-lg text-foreground">
                  {formatCurrency(tax.prices.expedition)}
                </span>
              </div>
              
              {tax.prices.renewal && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Renouvellement</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(tax.prices.renewal)}
                  </span>
                </div>
              )}
            </div>

            {/* Métadonnées */}
            <div className="space-y-2 text-xs text-muted-foreground">
              {/* Délai de traitement */}
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{tax.processingTime}</span>
              </div>

              {/* Catégorie */}
              {showCategory && (
                <div className="flex items-center space-x-1">
                  <FileText className="h-3 w-3" />
                  <span className="truncate">{tax.category}</span>
                </div>
              )}

              {/* Ministère */}
              {showMinistry && (
                <div className="flex items-center space-x-1">
                  <Building className="h-3 w-3" />
                  <span className="truncate">{tax.ministry}</span>
                </div>
              )}
            </div>

            {/* Note de popularité */}
            {tax.popularity && tax.popularity > 0.7 && (
              <div className="flex items-center space-x-1 text-xs text-amber-600">
                <Star className="h-3 w-3 fill-current" />
                <span>Service populaire</span>
              </div>
            )}
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-border">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={handleCalculateClick}
          >
            <Calculator className="h-3 w-3 mr-1" />
            Calculer
          </Button>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/taxes/${tax.id}`}>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Voir détails complets</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  )
}