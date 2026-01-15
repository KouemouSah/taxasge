'use client';

/**
 * Create Agent/Admin Page
 * Creates either an agent (user + profile) or admin (user only)
 *
 * Query params:
 * - ?type=agent - Create agent with profile
 * - ?type=admin - Create admin user only
 *
 * @module dashboard/admin/agents/new
 * @date 2025-01-14
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
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
import { ArrowLeft, Loader2, UserCog, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCreateAgent, useCreateAdmin } from '@/modules/agents-admin/hooks';
import { AgentType } from '@/modules/agents-admin/types';
import { hierarchyApi } from '@/modules/fiscal-services/services/api';
import { useEntitiesSimple } from '@/modules/cities/hooks';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const adminSchema = z.object({
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

const agentSchema = z.object({
  // User info
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
  // Profile info
  agent_type: z.nativeEnum(AgentType),
  is_supervisor: z.boolean().default(false),
  ministry_id: z.coerce.number().int().positive().optional(),
  entity_id: z.string().uuid().optional().or(z.literal('')),
  agent_role: z.enum(['validator', 'approver', 'auditor', 'reviewer']).default('validator'),
  can_approve_unlimited: z.boolean().default(false),
  max_approval_amount: z.coerce.number().positive().optional(),
  can_escalate: z.boolean().default(true),
  can_assign_tasks: z.boolean().default(false),
  can_reassign: z.boolean().default(false),
  working_hours_start: z.string().optional(),
  working_hours_end: z.string().optional(),
});

type AdminFormData = z.infer<typeof adminSchema>;
type AgentFormData = z.infer<typeof agentSchema>;

// =============================================================================
// COMPONENT
// =============================================================================

export default function CreateAgentPage() {
  // Fetch ministries and entities dynamically from API
  const { data: ministriesData, isLoading: isLoadingMinistries } = useQuery({
    queryKey: ['ministries', 'list'],
    queryFn: () => hierarchyApi.ministries.list('es'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: entitiesData, isLoading: isLoadingEntities } = useEntitiesSimple(true);

  // Transform data for select components
  // Ministry uses name_es for Spanish (default language)
  const ministries = ministriesData?.map(m => ({ id: m.id, name: m.name_es || m.nameEs || '' })) || [];
  const entities = entitiesData?.map(e => ({ id: e.id, name: e.name })) || [];
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const type = searchParams.get('type') || 'agent';
  const isAdmin = type === 'admin';

  const createAgentMutation = useCreateAgent();
  const createAdminMutation = useCreateAdmin();

  const adminForm = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      preferred_language: 'es',
    },
  });

  const agentForm = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      preferred_language: 'es',
      agent_type: AgentType.MINISTRY_AGENT,
      is_supervisor: false,
      agent_role: 'validator',
      can_approve_unlimited: false,
      can_escalate: true,
      can_assign_tasks: false,
      can_reassign: false,
      working_hours_start: '08:00',
      working_hours_end: '17:00',
    },
  });

  const watchAgentType = agentForm.watch('agent_type');
  const watchCanApproveUnlimited = agentForm.watch('can_approve_unlimited');

  const handleAdminSubmit = async (data: AdminFormData) => {
    try {
      await createAdminMutation.mutateAsync({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number || undefined,
        preferred_language: data.preferred_language,
      });

      toast({
        title: 'Administrateur créé',
        description: 'Un email de vérification a été envoyé.',
      });

      router.push('/dashboard/admin/agents?tab=admins');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error?.message || "Impossible de créer l'administrateur",
      });
    }
  };

  const handleAgentSubmit = async (data: AgentFormData) => {
    try {
      await createAgentMutation.mutateAsync({
        user: {
          email: data.email,
          password: data.password,
          first_name: data.first_name,
          last_name: data.last_name,
          phone_number: data.phone_number || undefined,
          preferred_language: data.preferred_language,
        },
        agent_type: data.agent_type,
        is_supervisor: data.is_supervisor,
        ministry_id: data.agent_type === AgentType.MINISTRY_AGENT ? data.ministry_id : undefined,
        entity_id: data.agent_type === AgentType.ENTITY_AGENT ? data.entity_id : undefined,
        agent_role: data.agent_role,
        can_approve_unlimited: data.can_approve_unlimited,
        max_approval_amount: data.can_approve_unlimited ? undefined : data.max_approval_amount,
        can_escalate: data.can_escalate,
        can_assign_tasks: data.can_assign_tasks,
        can_reassign: data.can_reassign,
        working_hours_start: data.working_hours_start,
        working_hours_end: data.working_hours_end,
      });

      toast({
        title: 'Agent créé',
        description: 'Un email de vérification a été envoyé.',
      });

      router.push('/dashboard/admin/agents');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error?.message || "Impossible de créer l'agent",
      });
    }
  };

  const isLoading = createAgentMutation.isPending || createAdminMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {isAdmin ? (
              <>
                <Shield className="h-8 w-8" />
                Créer un Administrateur
              </>
            ) : (
              <>
                <UserCog className="h-8 w-8" />
                Créer un Agent
              </>
            )}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isAdmin
              ? "L'administrateur aura accès complet au système"
              : "L'agent sera associé à un ministère ou une entité"}
          </p>
        </div>
      </div>

      {/* Admin Form */}
      {isAdmin && (
        <Form {...adminForm}>
          <form onSubmit={adminForm.handleSubmit(handleAdminSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations du compte</CardTitle>
                <CardDescription>
                  L&apos;administrateur recevra un email pour vérifier son compte
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={adminForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="admin@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={adminForm.control}
                  name="password"
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
                  control={adminForm.control}
                  name="first_name"
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
                  control={adminForm.control}
                  name="last_name"
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
                  control={adminForm.control}
                  name="phone_number"
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
                  control={adminForm.control}
                  name="preferred_language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Langue préférée</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer l&apos;Administrateur
              </Button>
            </div>
          </form>
        </Form>
      )}

      {/* Agent Form */}
      {!isAdmin && (
        <Form {...agentForm}>
          <form onSubmit={agentForm.handleSubmit(handleAgentSubmit)} className="space-y-6">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informations du compte</CardTitle>
                <CardDescription>
                  L&apos;agent recevra un email pour vérifier son compte
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={agentForm.control}
                  name="email"
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
                  control={agentForm.control}
                  name="password"
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
                  control={agentForm.control}
                  name="first_name"
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
                  control={agentForm.control}
                  name="last_name"
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
                  control={agentForm.control}
                  name="phone_number"
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
                  control={agentForm.control}
                  name="preferred_language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Langue préférée</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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

            {/* Profile Config Card */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration du Profil Agent</CardTitle>
                <CardDescription>
                  Définir le type, l&apos;organisation et les permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Type & Organization */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={agentForm.control}
                    name="agent_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type d&apos;agent *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
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
                      control={agentForm.control}
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
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingMinistries ? (
                                <SelectItem value="" disabled>Chargement...</SelectItem>
                              ) : ministries.length === 0 ? (
                                <SelectItem value="" disabled>Aucun ministère disponible</SelectItem>
                              ) : (
                                ministries.map((m) => (
                                  <SelectItem key={m.id} value={m.id.toString()}>
                                    {m.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={agentForm.control}
                      name="entity_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entité *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingEntities ? (
                                <SelectItem value="" disabled>Chargement...</SelectItem>
                              ) : entities.length === 0 ? (
                                <SelectItem value="" disabled>Aucune entité disponible</SelectItem>
                              ) : (
                                entities.map((e) => (
                                  <SelectItem key={e.id} value={e.id}>
                                    {e.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Role & Supervisor */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={agentForm.control}
                    name="agent_role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rôle fonctionnel</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
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
                    control={agentForm.control}
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
                    control={agentForm.control}
                    name="can_approve_unlimited"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Peut approuver des montants illimités
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  {!watchCanApproveUnlimited && (
                    <FormField
                      control={agentForm.control}
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
                      control={agentForm.control}
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
                      control={agentForm.control}
                      name="can_assign_tasks"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="font-normal">Peut assigner</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={agentForm.control}
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
                      control={agentForm.control}
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
                      control={agentForm.control}
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
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer l&apos;Agent
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
