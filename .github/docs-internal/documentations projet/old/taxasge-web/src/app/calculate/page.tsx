import { Metadata } from 'next'
import { Suspense } from 'react'
import { Calculator } from 'lucide-react'
import { TaxCalculator } from '@/components/calculator/TaxCalculator'
import { CalculatorHistory } from '@/components/calculator/CalculatorHistory'
import { CalculatorSkeleton } from '@/components/calculator/CalculatorSkeleton'

export const metadata: Metadata = {
  title: 'Calculatrice Fiscale - TaxasGE',
  description: 'Calculez précisément vos montants fiscaux pour tous les services de Guinée Équatoriale. Calculs officiels, export PDF et historique.',
  openGraph: {
    title: 'Calculatrice Fiscale TaxasGE',
    description: 'Calculs fiscaux officiels et précis',
    images: ['/og-calculator.png'],
  },
}

interface CalculatePageProps {
  searchParams: {
    service?: string
    type?: 'expedition' | 'renewal'
    amount?: string
  }
}

export default function CalculatePage({ searchParams }: CalculatePageProps) {
  const preselectedService = searchParams.service
  const preselectedType = searchParams.type || 'expedition'
  const preselectedAmount = searchParams.amount ? parseFloat(searchParams.amount) : undefined

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
            Calculatrice Fiscale
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Calculez précisément vos montants fiscaux pour tous les services officiels 
            de Guinée Équatoriale. Résultats instantanés et export PDF.
          </p>
        </div>

        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calculatrice principale */}
          <div className="lg:col-span-2">
            <Suspense fallback={<CalculatorSkeleton />}>
              <TaxCalculator
                preselectedService={preselectedService}
                preselectedType={preselectedType}
                preselectedAmount={preselectedAmount}
              />
            </Suspense>
          </div>

          {/* Historique et actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <Suspense fallback={<div className="skeleton h-64" />}>
                <CalculatorHistory />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}