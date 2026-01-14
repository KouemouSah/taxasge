'use client';

/**
 * Agent Profile Form Component
 * Form for creating or editing agent profiles
 *
 * @module agents-admin/components
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { AgentType, AgentRole } from '../types';
import type { AgentCompleteCreateRequest, AgentProfileUpdateRequest } from '../types';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const agentUserSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  first_name: z.string().min(2, 'Minimum 2 caractères').max(100),
  last_name: z.string().min(2, 'Minimum 2 caractères').max(100),
  phone_number: z
    .string()
    .regex(/^(222|555|551|333)\d{6}$/, 'Format: 222/555/551/333 + 6 chiffres')
    .optional()
    .or(z.literal('')),
  preferred_language: z.enum(['es', 'fr', 'en']).default('es'),
});

const agentProfileSchema = z.object({
  agent_type: z.nativeEnum(AgentType),
  is_supervisor: z.boolean().default(false),
  entity_id: z.string().uuid().optional().or(z.literal('')),
  ministry_id: z.coerce.number().int().positive().optional(),
  agent_role: z.enum(['validator', 'approver', 'auditor', 'reviewer']).default('validator'),
  can_approve_unlimited: z.boolean().default(false),
  max_approval_amount: z.coerce.number().positive().optional(),
  can_escalate: z.boolean().default(true),
  can_assign_tasks: z.boolean().default(false),
  can_reassign: z.boolean().default(false),
  specializations: z.array(z.string()).default([]),
  working_hours_start: z.string().optional(),
  working_hours_end: z.string().optional(),
  working_days: z.array(z.number()).default([1, 2, 3, 4, 5]),
});

const createAgentSchema = z.object({
  user: agentUserSchema,
}).merge(agentProfileSchema);

const updateAgentSchema = agentProfileSchema.partial();

type CreateAgentFormData = z.infer<typeof createAgentSchema>;
type UpdateAgentFormData = z.infer<typeof updateAgentSchema>;

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface AgentProfileFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<UpdateAgentFormData>;
  onSubmit: (data: AgentCompleteCreateRequest | AgentProfileUpdateRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  ministries?: Array<{ id: number; name: string }>;
  entities?: Array<{ id: string; name: string }>;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AgentProfileForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  ministries = [],
  entities = [],
}: AgentProfileFormProps) {
  const [showMaxAmount, setShowMaxAmount] = useState(
    initialData?.can_approve_unlimited === false && !!initialData?.max_approval_amount
  );

  const form = useForm<CreateAgentFormData>({
    resolver: zodResolver(mode === 'create' ? createAgentSchema : updateAgentSchema),
    defaultValues: {
      user: {
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        preferred_language: 'es',
      },
      agent_type: initialData?.agent_type || AgentType.MINISTRY_AGENT,
      is_supervisor: initialData?.is_supervisor || false,
      ministry_id: initialData?.ministry_id,
      entity_id: initialData?.entity_id || '',
      agent_role: (initialData?.agent_role as 'validator' | 'approver' | 'auditor' | 'reviewer') || 'validator',
      can_approve_unlimited: initialData?.can_approve_unlimited || false,
      max_approval_amount: initialData?.max_approval_amount,
      can_escalate: initialData?.can_escalate ?? true,
      can_assign_tasks: initialData?.can_assign_tasks || false,
      can_reassign: initialData?.can_reassign || false,
      specializations: initialData?.specializations || [],
      working_hours_start: initialData?.working_hours_start || '08:00',
      working_hours_end: initialData?.working_hours_end || '17:00',
      working_days: initialData?.working_days || [1, 2, 3, 4, 5],
    },
  });

  const watchAgentType = form.watch('agent_type');
  const watchCanApproveUnlimited = form.watch('can_approve_unlimited');

  const handleSubmit = async (data: CreateAgentFormData) => {
    if (mode === 'create') {
      await onSubmit(data as AgentCompleteCreateRequest);
    } else {
      // For edit mode, exclude user data
      const { user, ...profileData } = data;
      await onSubmit(profileData as AgentProfileUpdateRequest);
    }
  };

  const weekDays = [
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mer' },
    { value: 4, label: 'Jeu' },
    { value: 5, label: 'Ven' },
    { value: 6, label: 'Sam' },
    { value: 0, label: 'Dim' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* User Information - Only for create mode */}
        {mode === 'create' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations Utilisateur</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="user.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="agent@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="user.password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Minimum 8 caractères" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="user.first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="user.last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input placeholder="García" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="user.phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="222123456" {...field} />
                    </FormControl>
                    <FormDescription>Format: 222/555/551/333 + 6 chiffres</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="user.preferred_language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Langue préférée</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Agent Profile Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuration du Profil Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Type & Organization */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="agent_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type d&apos;agent *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={AgentType.MINISTRY_AGENT}>Agent Ministère</SelectItem>
                        <SelectItem value={AgentType.ENTITY_AGENT}>Agent Entité</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchAgentType === AgentType.MINISTRY_AGENT ? (
                <FormField
                  control={form.control}
                  name="ministry_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ministère *</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(parseInt(v))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le ministère" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ministries.map((m) => (
                            <SelectItem key={m.id} value={m.id.toString()}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="entity_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entité *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner l'entité" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {entities.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Role & Permissions */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="agent_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle fonctionnel</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le rôle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="validator">Validateur</SelectItem>
                        <SelectItem value="approver">Approbateur</SelectItem>
                        <SelectItem value="auditor">Auditeur</SelectItem>
                        <SelectItem value="reviewer">Réviseur</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_supervisor"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-8">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Superviseur</FormLabel>
                      <FormDescription>
                        Peut gérer les agents et reassigner les tâches
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Approval Limits */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Limites d&apos;approbation</h4>

              <FormField
                control={form.control}
                name="can_approve_unlimited"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setShowMaxAmount(!checked);
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Peut approuver des montants illimités</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {!watchCanApproveUnlimited && (
                <FormField
                  control={form.control}
                  name="max_approval_amount"
                  render={({ field }) => (
                    <FormItem className="max-w-xs">
                      <FormLabel>Montant maximum (XAF)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1000000"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Separator />

            {/* Capabilities */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Capacités</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="can_escalate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="font-normal">Peut escalader</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="can_assign_tasks"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="font-normal">Peut assigner des tâches</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="can_reassign"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="font-normal">Peut réassigner</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Working Hours */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Horaires de travail</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="working_hours_start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heure de début</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="working_hours_end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heure de fin</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="working_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jours de travail</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {weekDays.map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={field.value?.includes(day.value) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const current = field.value || [];
                            const updated = current.includes(day.value)
                              ? current.filter((d) => d !== day.value)
                              : [...current, day.value];
                            field.onChange(updated);
                          }}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? "Créer l'Agent" : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default AgentProfileForm;
