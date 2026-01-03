'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react'

import {
  ENTITY_CODES,
  CITIES,
  CITY_REGION_MAP,
  ENTITY_INFO,
  CITY_INFO,
  type EntityLocation,
  type EntityLocationCreate,
} from '../types'

const entityLocationSchema = z.object({
  entity_code: z.enum(ENTITY_CODES, {
    required_error: 'Entity code is required',
  }),
  city: z.enum(CITIES, {
    required_error: 'City is required',
  }),
  location_name: z
    .string()
    .min(3, 'Location name must be at least 3 characters')
    .max(255, 'Location name must be at most 255 characters'),
  location_address: z.string().nullable().optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s-]*$/, 'Invalid phone number format')
    .nullable()
    .optional()
    .or(z.literal('')),
  email: z.string().email('Invalid email').nullable().optional().or(z.literal('')),
  is_main_office: z.boolean().default(false),
  is_active: z.boolean().default(true),
  notes: z.string().nullable().optional(),
})

type FormData = z.infer<typeof entityLocationSchema>

interface EntityLocationFormProps {
  location?: EntityLocation
  onSubmit: (data: EntityLocationCreate) => void
  onCancel: () => void
  isLoading?: boolean
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
}

export function EntityLocationForm({
  location,
  onSubmit,
  onCancel,
  isLoading = false,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: EntityLocationFormProps) {
  const t = useTranslations('admin.serviceRequests.appointments.locations.form')
  const tCommon = useTranslations('common')

  const form = useForm<FormData>({
    resolver: zodResolver(entityLocationSchema),
    defaultValues: {
      entity_code: location?.entity_code || undefined,
      city: location?.city || undefined,
      location_name: location?.location_name || '',
      location_address: location?.location_address || '',
      phone: location?.phone || '',
      email: location?.email || '',
      is_main_office: location?.is_main_office || false,
      is_active: location?.is_active ?? true,
      notes: location?.notes || '',
    },
  })

  const watchedCity = form.watch('city')
  const region = watchedCity ? CITY_REGION_MAP[watchedCity] : undefined

  // Reset form when location changes
  useEffect(() => {
    if (location) {
      form.reset({
        entity_code: location.entity_code,
        city: location.city,
        location_name: location.location_name,
        location_address: location.location_address || '',
        phone: location.phone || '',
        email: location.email || '',
        is_main_office: location.is_main_office,
        is_active: location.is_active,
        notes: location.notes || '',
      })
    }
  }, [location, form])

  const handleSubmit = (data: FormData) => {
    const submitData: EntityLocationCreate = {
      entity_code: data.entity_code,
      city: data.city,
      location_name: data.location_name,
      location_address: data.location_address || null,
      phone: data.phone || null,
      email: data.email || null,
      is_main_office: data.is_main_office,
      is_active: data.is_active,
      notes: data.notes || null,
    }
    onSubmit(submitData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            {hasPrevious && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onPrevious}
                disabled={isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('previous')}
              </Button>
            )}
          </div>
          <h2 className="text-lg font-semibold">
            {location ? t('editTitle') : t('createTitle')}
          </h2>
          <div className="flex items-center gap-2">
            {hasNext && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onNext}
                disabled={isLoading}
              >
                {t('next')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Entity and City */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('city')} *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!!location}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectCity')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        <div className="flex items-center gap-2">
                          <span>{city}</span>
                          <Badge variant="outline" className="text-xs">
                            {CITY_INFO[city].region}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {region && (
                    <span className="text-primary">
                      {t('region')}: {region}
                    </span>
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="entity_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('entityCode')} *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!!location}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectEntity')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ENTITY_CODES.map((code) => (
                      <SelectItem key={code} value={code}>
                        <div className="flex flex-col">
                          <span className="font-medium">{code}</span>
                          <span className="text-xs text-muted-foreground">
                            {ENTITY_INFO[code].description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Location Name and Address */}
        <FormField
          control={form.control}
          name="location_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('locationName')} *</FormLabel>
              <FormControl>
                <Input placeholder={t('locationNamePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('address')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('addressPlaceholder')}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('phone')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+240 222 XXX XXX"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('email')}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="contact@example.com"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Checkboxes */}
        <div className="flex flex-wrap gap-6">
          <FormField
            control={form.control}
            name="is_main_office"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{t('mainOffice')}</FormLabel>
                  <FormDescription>{t('mainOfficeDescription')}</FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{t('active')}</FormLabel>
                  <FormDescription>{t('activeDescription')}</FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('notes')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('notesPlaceholder')}
                  className="min-h-[80px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {tCommon('cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {location ? tCommon('save') : tCommon('create')}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default EntityLocationForm
