import { NextRequest, NextResponse } from 'next/server'
import { taxService } from '@/lib/api/taxService'

// GET /api/taxes - Liste des services fiscaux
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get('q') || ''
    const ministry = searchParams.get('ministry') || undefined
    const sector = searchParams.get('sector') || undefined
    const category = searchParams.get('category') || undefined
    const serviceType = searchParams.get('type') || undefined
    const minPrice = searchParams.get('min') ? parseFloat(searchParams.get('min')!) : undefined
    const maxPrice = searchParams.get('max') ? parseFloat(searchParams.get('max')!) : undefined
    const sort = searchParams.get('sort') || 'relevance'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const language = searchParams.get('language') || 'es'

    const filters = {
      ministry,
      sector,
      category,
      serviceType,
      minPrice,
      maxPrice,
      sort,
      page,
      limit,
      language,
    }

    // Si pas de query, retourner tous les services avec pagination
    if (!query) {
      const allServices = await taxService.searchTaxes('', filters)
      return NextResponse.json({
        success: true,
        data: allServices,
        meta: {
          page,
          limit,
          total: allServices.total,
          totalPages: allServices.totalPages,
        }
      })
    }

    // Recherche avec query
    const results = await taxService.searchTaxes(query, filters)
    
    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        query,
        page,
        limit,
        total: results.total,
        totalPages: results.totalPages,
      }
    })

  } catch (error) {
    console.error('API /taxes error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des services fiscaux',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

// POST /api/taxes/search - Recherche avancée
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      query = '',
      filters = {},
      sort = 'relevance',
      page = 1,
      limit = 20,
      language = 'es'
    } = body

    const searchFilters = {
      ...filters,
      sort,
      page,
      limit,
      language,
    }

    const results = await taxService.searchTaxes(query, searchFilters)
    
    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        query,
        filters: searchFilters,
        page,
        limit,
        total: results.total,
        totalPages: results.totalPages,
      }
    })

  } catch (error) {
    console.error('API /taxes/search error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la recherche avancée',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}