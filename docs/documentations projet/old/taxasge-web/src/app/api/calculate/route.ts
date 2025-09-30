import { NextRequest, NextResponse } from 'next/server'
import { taxService } from '@/lib/api/taxService'

// POST /api/calculate - Calculer montant service fiscal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      serviceId,
      paymentType = 'expedition',
      calculationBase,
      parameters = {},
      isUrgent = false,
      userContext = {}
    } = body

    // Validation des paramètres requis
    if (!serviceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Paramètres manquants',
          message: 'serviceId est requis'
        },
        { status: 400 }
      )
    }

    if (!['expedition', 'renewal'].includes(paymentType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Type de paiement invalide',
          message: 'paymentType doit être "expedition" ou "renewal"'
        },
        { status: 400 }
      )
    }

    // Effectuer le calcul
    const calculationParams = {
      serviceId,
      paymentType,
      calculationBase,
      parameters,
      isUrgent,
      userContext,
    }

    const result = await taxService.calculateAmount(calculationParams)
    
    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        serviceId,
        paymentType,
        calculatedAt: new Date().toISOString(),
        parameters: calculationParams,
      }
    })

  } catch (error) {
    console.error('API /calculate error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du calcul',
        message: error instanceof Error ? error.message : 'Erreur de calcul inconnue'
      },
      { status: 500 }
    )
  }
}

// GET /api/calculate - Informations sur la calculatrice
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      message: 'TaxasGE Tax Calculator API',
      version: '1.0.0',
      description: 'API pour calculer les montants des services fiscaux',
      supportedPaymentTypes: ['expedition', 'renewal'],
      supportedCurrencies: ['XAF', 'EUR', 'USD'],
      features: [
        'Calculs en temps réel',
        'Support montants fixes et pourcentages',
        'Frais d\'urgence configurables',
        'Historique des calculs',
        'Export PDF des résultats'
      ]
    }
  })
}