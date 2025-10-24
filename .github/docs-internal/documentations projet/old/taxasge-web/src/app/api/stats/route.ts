import { NextRequest, NextResponse } from 'next/server'
import { taxService } from '@/lib/api/taxService'

// GET /api/stats - Statistiques globales TaxasGE
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, 1y
    const language = searchParams.get('language') || 'es'

    // Récupérer statistiques depuis le service
    const stats = await taxService.getStats()
    
    // Statistiques additionnelles (mock pour développement)
    const additionalStats = {
      // Utilisation par période
      usage: {
        searches_today: 1247,
        calculations_today: 432,
        new_users_today: 23,
        active_users_now: 156,
      },
      
      // Services populaires
      popular_services: [
        { id: 'T-001', name: 'Permis de Conduire', views: 2341, calculations: 567 },
        { id: 'T-002', name: 'Patente Commerciale', views: 1876, calculations: 234 },
        { id: 'T-003', name: 'Carte de Séjour', views: 1654, calculations: 432 },
        { id: 'T-004', name: 'Déclaration TVA', views: 1432, calculations: 123 },
        { id: 'T-005', name: 'Licence Export', views: 1234, calculations: 89 },
      ],
      
      // Répartition par ministère
      ministry_distribution: {
        'Ministère des Finances': 156,
        'Ministère du Commerce': 89,
        'Ministère des Transports': 67,
        'Ministère de l\'Intérieur': 45,
        'Autres': 190,
      },
      
      // Tendances temporelles
      trends: {
        daily_searches: [120, 145, 167, 189, 201, 234, 267],
        daily_calculations: [45, 56, 67, 78, 89, 98, 107],
        weekly_users: [1200, 1340, 1456, 1567, 1678, 1789, 1890],
      },
      
      // Performance
      performance: {
        avg_search_time: 0.234, // secondes
        avg_calculation_time: 0.156,
        uptime_percentage: 99.8,
        error_rate: 0.02,
      },
      
      // Satisfaction utilisateur
      satisfaction: {
        rating: 4.7,
        total_ratings: 1234,
        nps_score: 67,
        completion_rate: 0.89,
      }
    }

    const combinedStats = {
      ...stats,
      ...additionalStats,
      meta: {
        period,
        language,
        generated_at: new Date().toISOString(),
        cache_ttl: 300, // 5 minutes
      }
    }

    return NextResponse.json({
      success: true,
      data: combinedStats,
    })

  } catch (error) {
    console.error('API /stats error:', error)
    
    // Fallback avec données statiques en cas d'erreur
    const fallbackStats = {
      totalServices: 547,
      totalMinistries: 8,
      totalUsers: 15247,
      totalCalculations: 89432,
      usage: {
        searches_today: 0,
        calculations_today: 0,
        new_users_today: 0,
        active_users_now: 0,
      },
      popular_services: [],
      ministry_distribution: {},
      trends: {
        daily_searches: [],
        daily_calculations: [],
        weekly_users: [],
      },
      performance: {
        avg_search_time: 0,
        avg_calculation_time: 0,
        uptime_percentage: 0,
        error_rate: 0,
      },
      satisfaction: {
        rating: 0,
        total_ratings: 0,
        nps_score: 0,
        completion_rate: 0,
      },
      meta: {
        period: '30d',
        language: 'es',
        generated_at: new Date().toISOString(),
        fallback: true,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }

    return NextResponse.json(
      {
        success: false,
        data: fallbackStats,
        error: 'Erreur lors de la récupération des statistiques',
        message: 'Données de fallback utilisées'
      },
      { status: 500 }
    )
  }
}

// POST /api/stats/track - Enregistrer événement analytics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      event_type,
      event_data = {},
      user_id,
      session_id,
      timestamp = new Date().toISOString()
    } = body

    // Validation
    if (!event_type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Type d\'événement requis',
          message: 'event_type est obligatoire'
        },
        { status: 400 }
      )
    }

    // En production, ceci serait envoyé vers un service d'analytics
    // Pour le développement, on log simplement
    console.log('📊 Analytics Event:', {
      event_type,
      event_data,
      user_id,
      session_id,
      timestamp,
      user_agent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    })

    return NextResponse.json({
      success: true,
      data: {
        event_id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        recorded_at: timestamp,
      }
    })

  } catch (error) {
    console.error('API /stats/track error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de l\'enregistrement de l\'événement',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}