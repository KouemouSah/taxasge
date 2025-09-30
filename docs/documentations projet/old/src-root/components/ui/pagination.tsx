'use client'

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  maxVisiblePages?: number
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisiblePages = 7,
  className
}: PaginationProps) {
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = []
    
    if (totalPages <= maxVisiblePages) {
      // Afficher toutes les pages si peu de pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Logique pour afficher les pages avec ellipses
      const halfVisible = Math.floor(maxVisiblePages / 2)
      
      if (currentPage <= halfVisible + 1) {
        // Début : 1, 2, 3, 4, 5, ..., last
        for (let i = 1; i <= maxVisiblePages - 2; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - halfVisible) {
        // Fin : 1, ..., n-4, n-3, n-2, n-1, n
        pages.push(1)
        pages.push('ellipsis')
        for (let i = totalPages - (maxVisiblePages - 3); i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Milieu : 1, ..., current-1, current, current+1, ..., last
        pages.push(1)
        pages.push('ellipsis')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <nav 
      className={cn("flex items-center justify-center space-x-1", className)}
      aria-label="Pagination"
    >
      {/* Bouton précédent */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center space-x-1"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Précédent</span>
      </Button>

      {/* Pages */}
      <div className="flex items-center space-x-1">
        {visiblePages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <div 
                key={`ellipsis-${index}`}
                className="flex items-center justify-center w-9 h-9"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            )
          }

          const isCurrentPage = page === currentPage

          return (
            <Button
              key={page}
              variant={isCurrentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className={cn(
                "w-9 h-9",
                isCurrentPage && "bg-primary text-primary-foreground"
              )}
              aria-current={isCurrentPage ? "page" : undefined}
            >
              {page}
            </Button>
          )
        })}
      </div>

      {/* Bouton suivant */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center space-x-1"
      >
        <span className="hidden sm:inline">Suivant</span>
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Informations de page (mobile) */}
      <div className="sm:hidden ml-4 text-sm text-muted-foreground">
        {currentPage} / {totalPages}
      </div>
    </nav>
  )
}