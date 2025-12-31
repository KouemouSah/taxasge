'use client'

/**
 * AppointmentSelection Component
 * Citizen-first appointment flow where users select location and slot BEFORE payment
 *
 * Flow:
 * 1. Select location (Malabo or Bata)
 * 2. View available slots (6 displayed)
 * 3. Hold a slot (15 min countdown)
 * 4. Proceed to payment
 *
 * Fallback: Submit without appointment if no slots available
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Timer,
  Building2,
  RefreshCw,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

import type {
  EntityLocation,
  AvailableSlot,
  HoldSlotResponse,
  AppointmentHoldStatus,
} from '../types'

// ============================================================================
// TYPES
// ============================================================================

interface AppointmentSelectionProps {
  requestId: string
  onComplete: (data: {
    hasAppointment: boolean
    locationName?: string
    appointmentDate?: string
    appointmentTime?: string
    isFallback: boolean
  }) => void
  onBack: () => void
  locale?: 'es' | 'fr' | 'en'
  // API methods (injected from hook)
  getLocations: (requestId: string) => Promise<{
    entityCode: string
    locations: EntityLocation[]
    count: number
  }>
  getSlots: (requestId: string, locationName: string, fromDate?: string, limit?: number) => Promise<{
    entityCode: string
    locationName: string
    fromDate: string
    slots: AvailableSlot[]
    count: number
    hasAvailability: boolean
  }>
  holdSlot: (requestId: string, data: {
    locationName: string
    locationAddress?: string
    appointmentDate: string
    appointmentTime: string
  }) => Promise<HoldSlotResponse>
  getHoldStatus: (requestId: string) => Promise<AppointmentHoldStatus>
  releaseHold: (requestId: string) => Promise<{ success: boolean; message: string }>
  submitWithoutAppointment: (requestId: string, preferredLocation: string) => Promise<{
    success: boolean
    locationName?: string
    message: string
    error?: string
  }>
}

type Step = 'location' | 'slots' | 'held' | 'fallback'

// ============================================================================
// TRANSLATIONS
// ============================================================================

const TEXTS = {
  es: {
    title: 'Seleccionar Cita',
    subtitle: 'Selecciona ubicacion y horario para tu cita',
    step1Title: 'Selecciona Ubicacion',
    step1Desc: 'Elige la oficina donde deseas realizar el tramite',
    step2Title: 'Selecciona Horario',
    step2Desc: 'Elige una de las fechas disponibles',
    step3Title: 'Cita Reservada',
    step3Desc: 'Tu cita esta reservada temporalmente',
    mainOffice: 'Oficina Principal',
    regionalOffice: 'Oficina Regional',
    noSlotsTitle: 'No hay citas disponibles',
    noSlotsDesc: 'No hay horarios disponibles en esta ubicacion. Puedes enviar tu solicitud y un agente te asignara una cita.',
    holdSuccess: 'Cita reservada exitosamente',
    holdExpiry: 'Tienes {minutes} minutos para completar el pago',
    slotsRemaining: '{count} espacio(s) disponible(s)',
    selectSlot: 'Seleccionar',
    continueToPayment: 'Continuar al Pago',
    submitWithoutAppt: 'Enviar sin Cita',
    changeLocation: 'Cambiar Ubicacion',
    changeSlot: 'Cambiar Horario',
    back: 'Volver',
    loading: 'Cargando...',
    error: 'Error',
    retry: 'Reintentar',
    holdExpired: 'La reserva ha expirado',
    holdExpiredDesc: 'Tu reserva temporal ha expirado. Por favor selecciona un nuevo horario.',
    selectNewSlot: 'Seleccionar Nuevo Horario',
  },
  fr: {
    title: 'Selectionner un Rendez-vous',
    subtitle: 'Selectionnez le lieu et l\'horaire de votre rendez-vous',
    step1Title: 'Selectionnez le Lieu',
    step1Desc: 'Choisissez le bureau ou vous souhaitez effectuer la demarche',
    step2Title: 'Selectionnez l\'Horaire',
    step2Desc: 'Choisissez une des dates disponibles',
    step3Title: 'Rendez-vous Reserve',
    step3Desc: 'Votre rendez-vous est temporairement reserve',
    mainOffice: 'Bureau Principal',
    regionalOffice: 'Bureau Regional',
    noSlotsTitle: 'Pas de rendez-vous disponibles',
    noSlotsDesc: 'Aucun horaire disponible a cet emplacement. Vous pouvez soumettre votre demande et un agent vous attribuera un rendez-vous.',
    holdSuccess: 'Rendez-vous reserve avec succes',
    holdExpiry: 'Vous avez {minutes} minutes pour completer le paiement',
    slotsRemaining: '{count} place(s) disponible(s)',
    selectSlot: 'Selectionner',
    continueToPayment: 'Continuer vers le Paiement',
    submitWithoutAppt: 'Soumettre sans Rendez-vous',
    changeLocation: 'Changer de Lieu',
    changeSlot: 'Changer d\'Horaire',
    back: 'Retour',
    loading: 'Chargement...',
    error: 'Erreur',
    retry: 'Reessayer',
    holdExpired: 'La reservation a expire',
    holdExpiredDesc: 'Votre reservation temporaire a expire. Veuillez selectionner un nouvel horaire.',
    selectNewSlot: 'Selectionner un Nouvel Horaire',
  },
  en: {
    title: 'Select Appointment',
    subtitle: 'Select location and time for your appointment',
    step1Title: 'Select Location',
    step1Desc: 'Choose the office where you want to complete the process',
    step2Title: 'Select Time Slot',
    step2Desc: 'Choose one of the available dates',
    step3Title: 'Appointment Reserved',
    step3Desc: 'Your appointment is temporarily reserved',
    mainOffice: 'Main Office',
    regionalOffice: 'Regional Office',
    noSlotsTitle: 'No appointments available',
    noSlotsDesc: 'No time slots available at this location. You can submit your request and an agent will assign you an appointment.',
    holdSuccess: 'Appointment reserved successfully',
    holdExpiry: 'You have {minutes} minutes to complete payment',
    slotsRemaining: '{count} slot(s) available',
    selectSlot: 'Select',
    continueToPayment: 'Continue to Payment',
    submitWithoutAppt: 'Submit without Appointment',
    changeLocation: 'Change Location',
    changeSlot: 'Change Time Slot',
    back: 'Back',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    holdExpired: 'Reservation has expired',
    holdExpiredDesc: 'Your temporary reservation has expired. Please select a new time slot.',
    selectNewSlot: 'Select New Time Slot',
  },
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr)
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
  return date.toLocaleDateString(locale === 'es' ? 'es-ES' : locale === 'fr' ? 'fr-FR' : 'en-US', options)
}

function formatTime(timeStr: string): string {
  // Convert HH:MM:SS to HH:MM or HHhMM for FR
  const parts = timeStr.split(':')
  return `${parts[0]}:${parts[1]}`
}

function formatTimeRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AppointmentSelection({
  requestId,
  onComplete,
  onBack,
  locale = 'es',
  getLocations,
  getSlots,
  holdSlot,
  getHoldStatus,
  releaseHold,
  submitWithoutAppointment,
}: AppointmentSelectionProps) {
  const t = TEXTS[locale]

  // State
  const [currentStep, setCurrentStep] = useState<Step>('location')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Location state
  const [locations, setLocations] = useState<EntityLocation[]>([])
  const [selectedLocation, setSelectedLocation] = useState<EntityLocation | null>(null)

  // Slots state
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [hasAvailability, setHasAvailability] = useState(true)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

  // Hold state
  const [holdStatus, setHoldStatus] = useState<AppointmentHoldStatus | null>(null)
  const [holdCountdown, setHoldCountdown] = useState(0)
  const [isHolding, setIsHolding] = useState(false)

  // ============================================================================
  // LOAD INITIAL DATA
  // ============================================================================

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true)
      setError(null)

      try {
        // Check for existing hold first
        const existingHold = await getHoldStatus(requestId)

        if (existingHold.hasHold && !existingHold.isExpired) {
          // User has an active hold
          setHoldStatus(existingHold)
          if (existingHold.expiresAt) {
            const expiresAt = new Date(existingHold.expiresAt)
            const now = new Date()
            const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
            setHoldCountdown(remaining)
          }
          setCurrentStep('held')
        } else {
          // Load locations
          const locationsResponse = await getLocations(requestId)
          setLocations(locationsResponse.locations)
          setCurrentStep('location')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [requestId, getLocations, getHoldStatus])

  // ============================================================================
  // COUNTDOWN TIMER
  // ============================================================================

  useEffect(() => {
    if (currentStep !== 'held' || holdCountdown <= 0) return

    const timer = setInterval(() => {
      setHoldCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setCurrentStep('location')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentStep, holdCountdown])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelectLocation = useCallback(async (location: EntityLocation) => {
    setSelectedLocation(location)
    setIsLoadingSlots(true)
    setError(null)

    try {
      const slotsResponse = await getSlots(requestId, location.locationName)
      setSlots(slotsResponse.slots)
      setHasAvailability(slotsResponse.hasAvailability)

      if (slotsResponse.hasAvailability) {
        setCurrentStep('slots')
      } else {
        setCurrentStep('fallback')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load slots')
    } finally {
      setIsLoadingSlots(false)
    }
  }, [requestId, getSlots])

  const handleSelectSlot = useCallback(async (slot: AvailableSlot) => {
    if (!selectedLocation) return

    setIsHolding(true)
    setError(null)

    try {
      const holdResponse = await holdSlot(requestId, {
        locationName: slot.locationName,
        locationAddress: slot.locationAddress,
        appointmentDate: slot.slotDate,
        appointmentTime: slot.slotTime,
      })

      if (holdResponse.success) {
        setHoldStatus({
          hasHold: true,
          status: 'held',
          locationName: slot.locationName,
          appointmentDate: slot.slotDate,
          appointmentTime: slot.slotTime,
          expiresAt: holdResponse.expiresAt,
          isExpired: false,
        })
        setHoldCountdown(holdResponse.expiresInSeconds)
        setCurrentStep('held')
      } else {
        setError(holdResponse.error || 'Failed to hold slot')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to hold slot')
    } finally {
      setIsHolding(false)
    }
  }, [requestId, selectedLocation, holdSlot])

  const handleContinueToPayment = useCallback(() => {
    if (!holdStatus) return

    onComplete({
      hasAppointment: true,
      locationName: holdStatus.locationName,
      appointmentDate: holdStatus.appointmentDate,
      appointmentTime: holdStatus.appointmentTime,
      isFallback: false,
    })
  }, [holdStatus, onComplete])

  const handleChangeSlot = useCallback(async () => {
    try {
      await releaseHold(requestId)
      setHoldStatus(null)
      setHoldCountdown(0)

      if (selectedLocation) {
        await handleSelectLocation(selectedLocation)
      } else {
        setCurrentStep('location')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to release hold')
    }
  }, [requestId, releaseHold, selectedLocation, handleSelectLocation])

  const handleSubmitWithoutAppointment = useCallback(async () => {
    if (!selectedLocation) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await submitWithoutAppointment(requestId, selectedLocation.locationName)

      if (response.success) {
        onComplete({
          hasAppointment: false,
          locationName: response.locationName,
          isFallback: true,
        })
      } else {
        setError(response.error || 'Failed to submit')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setIsLoading(false)
    }
  }, [requestId, selectedLocation, submitWithoutAppointment, onComplete])

  const handleChangeLocation = useCallback(() => {
    setSelectedLocation(null)
    setSlots([])
    setCurrentStep('location')
  }, [])

  // ============================================================================
  // RENDER: LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  // ============================================================================
  // RENDER: ERROR STATE
  // ============================================================================

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t.error}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.back}
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t.retry}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ============================================================================
  // RENDER: STEP 1 - LOCATION SELECTION
  // ============================================================================

  if (currentStep === 'location') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t.step1Title}
          </CardTitle>
          <CardDescription>{t.step1Desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedLocation?.id}
            onValueChange={(value) => {
              const location = locations.find((l) => l.id === value)
              if (location) handleSelectLocation(location)
            }}
            className="space-y-3"
          >
            {locations.map((location) => (
              <div
                key={location.id}
                className={`flex items-start space-x-4 rounded-lg border p-4 cursor-pointer transition-colors ${
                  isLoadingSlots && selectedLocation?.id === location.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => !isLoadingSlots && handleSelectLocation(location)}
              >
                <RadioGroupItem value={location.id} id={location.id} disabled={isLoadingSlots} />
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor={location.id}
                    className="text-base font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    {location.locationName}
                    {location.isMainOffice && (
                      <Badge variant="secondary" className="ml-2">
                        {t.mainOffice}
                      </Badge>
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {location.city}
                    {location.province && `, ${location.province}`}
                    {location.region && ` - ${location.region}`}
                  </p>
                  {location.address && (
                    <p className="text-sm text-muted-foreground">{location.address}</p>
                  )}
                </div>
                {isLoadingSlots && selectedLocation?.id === location.id ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            ))}
          </RadioGroup>

          <div className="flex justify-start mt-6">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.back}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ============================================================================
  // RENDER: STEP 2 - SLOT SELECTION
  // ============================================================================

  if (currentStep === 'slots') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t.step2Title}
          </CardTitle>
          <CardDescription>
            {t.step2Desc}
            {selectedLocation && (
              <span className="block mt-1 font-medium">{selectedLocation.locationName}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {slots.map((slot, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <p className="font-medium">{formatDate(slot.slotDate, locale)}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatTime(slot.slotTime)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {t.slotsRemaining.replace('{count}', String(slot.slotsRemaining))}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSelectSlot(slot)}
                  disabled={isHolding}
                >
                  {isHolding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t.selectSlot
                  )}
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="outline" onClick={handleChangeLocation}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.changeLocation}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ============================================================================
  // RENDER: STEP 3 - HOLD CONFIRMED
  // ============================================================================

  if (currentStep === 'held' && holdStatus) {
    const progressPercent = (holdCountdown / 900) * 100 // 900 seconds = 15 minutes

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            {t.step3Title}
          </CardTitle>
          <CardDescription>{t.step3Desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success Alert */}
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">{t.holdSuccess}</AlertTitle>
            <AlertDescription className="text-green-700">
              {t.holdExpiry.replace('{minutes}', String(Math.ceil(holdCountdown / 60)))}
            </AlertDescription>
          </Alert>

          {/* Countdown Timer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Timer className="h-4 w-4" />
                {locale === 'es' ? 'Tiempo restante' : locale === 'fr' ? 'Temps restant' : 'Time remaining'}
              </span>
              <span className="font-mono text-lg font-bold text-primary">
                {formatTimeRemaining(holdCountdown)}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Appointment Details */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{holdStatus.locationName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <p>{holdStatus.appointmentDate && formatDate(holdStatus.appointmentDate, locale)}</p>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <p>{holdStatus.appointmentTime && formatTime(holdStatus.appointmentTime)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1" onClick={handleContinueToPayment}>
              {t.continueToPayment}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" onClick={handleChangeSlot}>
              {t.changeSlot}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ============================================================================
  // RENDER: FALLBACK - NO SLOTS AVAILABLE
  // ============================================================================

  if (currentStep === 'fallback') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            {t.noSlotsTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              {t.noSlotsDesc}
            </AlertDescription>
          </Alert>

          {selectedLocation && (
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground mb-1">
                {locale === 'es' ? 'Ubicacion preferida' : locale === 'fr' ? 'Lieu prefere' : 'Preferred location'}
              </p>
              <p className="font-medium">{selectedLocation.locationName}</p>
              <p className="text-sm text-muted-foreground">{selectedLocation.city}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1" onClick={handleSubmitWithoutAppointment}>
              {t.submitWithoutAppt}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" onClick={handleChangeLocation}>
              {t.changeLocation}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
