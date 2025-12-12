'use client'

/**
 * WebhookForm Component
 * Form for creating and editing webhook configurations
 */

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, HelpCircle } from 'lucide-react'
import {
  WebhookType,
  HttpMethod,
  AuthType,
  type WebhookResponse,
} from '../types'
import { useCreateWebhook, useUpdateWebhook } from '../hooks/useWebhooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const webhookSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  webhookType: z.nativeEnum(WebhookType),
  endpointUrl: z.string().url('Must be a valid URL'),
  httpMethod: z.nativeEnum(HttpMethod),
  headers: z.array(
    z.object({
      key: z.string().min(1, 'Header name is required'),
      value: z.string().min(1, 'Header value is required'),
    })
  ),
  authType: z.nativeEnum(AuthType),
  authConfig: z.object({
    apiKey: z.string().optional(),
    apiKeyHeader: z.string().optional(),
    bearerToken: z.string().optional(),
    basicUsername: z.string().optional(),
    basicPassword: z.string().optional(),
  }),
  payloadTemplateJson: z.string().optional(),
  retryConfig: z.object({
    maxRetries: z.coerce.number().min(0).max(10),
    retryDelaySeconds: z.coerce.number().min(1).max(3600),
  }),
  timeoutSeconds: z.coerce.number().min(1).max(300),
  events: z.array(z.string()),
  isActive: z.boolean(),
})

type WebhookFormData = z.infer<typeof webhookSchema>

// =============================================================================
// COMPONENT
// =============================================================================

interface WebhookFormProps {
  webhook?: WebhookResponse
  locale: string
}

export function WebhookForm({ webhook, locale }: WebhookFormProps) {
  const router = useRouter()
  const isEditing = !!webhook
  const [eventInput, setEventInput] = useState('')

  const createMutation = useCreateWebhook()
  const updateMutation = useUpdateWebhook()

  const form = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      name: webhook?.name || '',
      webhookType: webhook?.webhookType || WebhookType.CUSTOM,
      endpointUrl: webhook?.endpointUrl || '',
      httpMethod: webhook?.httpMethod || HttpMethod.POST,
      headers: webhook?.headers
        ? Object.entries(webhook.headers).map(([key, value]) => ({ key, value }))
        : [{ key: 'Content-Type', value: 'application/json' }],
      authType: webhook?.authType || AuthType.NONE,
      authConfig: webhook?.authConfig || {},
      payloadTemplateJson: webhook?.payloadTemplate
        ? JSON.stringify(webhook.payloadTemplate, null, 2)
        : '',
      retryConfig: webhook?.retryConfig || {
        maxRetries: 3,
        retryDelaySeconds: 60,
      },
      timeoutSeconds: webhook?.timeoutSeconds || 30,
      events: webhook?.events || [],
      isActive: webhook?.isActive ?? true,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'headers',
  })

  const watchAuthType = form.watch('authType')
  const watchEvents = form.watch('events')

  const onSubmit = async (data: WebhookFormData) => {
    try {
      // Convert headers array to object
      const headers: Record<string, string> = {}
      data.headers.forEach((h) => {
        headers[h.key] = h.value
      })

      // Parse payload template JSON if provided
      let payloadTemplate: Record<string, unknown> | undefined
      if (data.payloadTemplateJson) {
        try {
          payloadTemplate = JSON.parse(data.payloadTemplateJson)
        } catch (e) {
          form.setError('payloadTemplateJson', {
            message: 'Invalid JSON format',
          })
          return
        }
      }

      const payload = {
        ...data,
        headers,
        payloadTemplate,
        payloadTemplateJson: undefined,
      }

      if (isEditing && webhook) {
        await updateMutation.mutateAsync({
          id: webhook.id,
          data: payload,
        })
      } else {
        await createMutation.mutateAsync(payload)
      }

      router.push(`/${locale}/dashboard/admin/communications/webhooks`)
    } catch (error) {
      // Error handling is done in mutation hooks
    }
  }

  const addEvent = () => {
    if (eventInput && !watchEvents.includes(eventInput)) {
      form.setValue('events', [...watchEvents, eventInput])
      setEventInput('')
    }
  }

  const removeEvent = (event: string) => {
    form.setValue(
      'events',
      watchEvents.filter((e) => e !== event)
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addEvent()
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Configure the basic webhook details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="WhatsApp Notifications" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this webhook
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="webhookType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select webhook type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={WebhookType.WHATSAPP}>
                          WhatsApp
                        </SelectItem>
                        <SelectItem value={WebhookType.CUSTOM}>
                          Custom
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="httpMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HTTP Method *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(HttpMethod).map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="endpointUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endpoint URL *</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://api.example.com/webhook"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The URL where webhook requests will be sent
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="timeoutSeconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeout (seconds) *</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={300} {...field} />
                    </FormControl>
                    <FormDescription>
                      Request timeout (1-300 seconds)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Enable or disable this webhook
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Configure authentication for the webhook
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="authType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authentication Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select auth type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={AuthType.NONE}>None</SelectItem>
                      <SelectItem value={AuthType.API_KEY}>API Key</SelectItem>
                      <SelectItem value={AuthType.BEARER}>Bearer Token</SelectItem>
                      <SelectItem value={AuthType.BASIC}>Basic Auth</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchAuthType === AuthType.API_KEY && (
              <>
                <FormField
                  control={form.control}
                  name="authConfig.apiKeyHeader"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key Header Name</FormLabel>
                      <FormControl>
                        <Input placeholder="X-API-Key" {...field} />
                      </FormControl>
                      <FormDescription>
                        Header name for the API key (default: X-API-Key)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="authConfig.apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Your API key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {watchAuthType === AuthType.BEARER && (
              <FormField
                control={form.control}
                name="authConfig.bearerToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bearer Token *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Your bearer token" {...field} />
                    </FormControl>
                    <FormDescription>
                      Token will be sent in Authorization header
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchAuthType === AuthType.BASIC && (
              <>
                <FormField
                  control={form.control}
                  name="authConfig.basicUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username *</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="authConfig.basicPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Custom Headers</CardTitle>
                <CardDescription>
                  Add custom HTTP headers to the webhook request
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ key: '', value: '' })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Header
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`headers.${index}.key`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      {index === 0 && <FormLabel>Header Name</FormLabel>}
                      <FormControl>
                        <Input placeholder="Content-Type" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`headers.${index}.value`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      {index === 0 && <FormLabel>Header Value</FormLabel>}
                      <FormControl>
                        <Input placeholder="application/json" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className={index === 0 ? 'mt-8' : ''}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Payload Template</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Use {'{{'} variable_name {'}'} for dynamic values.
                      Variables will be replaced with event data.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>
              Define the JSON payload structure (optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="payloadTemplateJson"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder={'{\n  "message": "{{message}}",\n  "user": "{{user_id}}"\n}'}
                      className="font-mono text-sm"
                      rows={10}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Valid JSON with optional variable substitution
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
            <CardDescription>
              Specify which events trigger this webhook
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter event name (e.g., payment_received)"
                value={eventInput}
                onChange={(e) => setEventInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button type="button" onClick={addEvent} variant="outline">
                Add
              </Button>
            </div>

            {watchEvents.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {watchEvents.map((event) => (
                  <div
                    key={event}
                    className="flex items-center gap-1 rounded-md border bg-secondary px-3 py-1 text-sm"
                  >
                    <span>{event}</span>
                    <button
                      type="button"
                      onClick={() => removeEvent(event)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retry Configuration</CardTitle>
            <CardDescription>
              Configure retry behavior for failed requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="retryConfig.maxRetries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Retries</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={10} {...field} />
                    </FormControl>
                    <FormDescription>
                      Number of retry attempts (0-10)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="retryConfig.retryDelaySeconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retry Delay (seconds)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={3600} {...field} />
                    </FormControl>
                    <FormDescription>
                      Delay between retries (1-3600 seconds)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : isEditing
              ? 'Update Webhook'
              : 'Create Webhook'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
