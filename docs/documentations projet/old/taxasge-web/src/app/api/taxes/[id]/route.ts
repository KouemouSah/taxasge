import { NextRequest, NextResponse } from 'next/server'
import { taxService } from '@/lib/api/taxService'

// GET /api/taxes/[id] - Détails d'un service fiscal
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'es'
    
    const tax = await taxService.getTaxById(params.id, language)
    
    if (!tax) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service fiscal non trouvé',
          message: `Aucun service avec l'ID ${params.id}`
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tax,
      meta: {
        id: params.id,
        language,
        lastUpdated: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error(`API /taxes/${params.id} error:`, error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération du service fiscal',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}