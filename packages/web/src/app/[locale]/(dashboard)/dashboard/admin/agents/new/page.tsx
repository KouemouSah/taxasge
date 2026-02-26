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
import { ArrowLeft, Loader2, UserCog, Shield, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInviteAgent, useInviteAdmin, useAvailableWorkflows } from '@/modules/agents-admin/hooks';
import { AgentType } from '@/modules/agents-admin/types';
import type { WorkflowOption } from '@/modules/agents-admin/types';
import { hierarchyApi } from '@/modules/fiscal-services/services/api';
import { useEntitiesSimple } from '@/modules/cities/hooks';
import { rolesApi } from '@/modules/roles-admin/services/api';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocationsByEntity } from '@/modules/entity-locations/hooks';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const adminSchema = z.object({
  email: z.string().email('Email invalide'),
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
  // User info (password will be set by agent after email verification)
  email: z.string().email('Email invalide'),
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
  entity_location_id: z.string().uuid().optional().nullable().or(z.literal('ALL_SITES')).or(z.literal('')),
  agent_role: z.enum(['validator', 'approver', 'auditor', 'reviewer']).default('validator'),
  // RBAC role for permissions
  rbac_role_id: z.string().uuid('Sélectionnez un rôle RBAC'),
  can_approve_unlimited: z.boolean().default(false),
  max_approval_amount: z.coerce.number().positive().optional(),
  can_escalate: z.boolean().default(true),
  can_assign_tasks: z.boolean().default(false),
  can_reassign: z.boolean().default(false),
  working_hours_start: z.string().optional(),
  working_hours_end: z.string().optional(),
  working_days: z.array(z.number()).default([1, 2, 3, 4, 5]),
  // Specializations - workflow codes the agent can handle
  specializations: z.array(z.string()).default([]),
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

  // Fetch RBAC roles for agents
  const { data: rbacRolesData, isLoading: isLoadingRbacRoles } = useQuery({
    queryKey: ['roles', 'agent-rbac'],
    queryFn: () => rolesApi.getAgentRbacRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch available workflows for specializations
  const { data: workflowsData, isLoading: isLoadingWorkflows } = useAvailableWorkflows();

  // Transform data for select components
  // Ministry uses name_es for Spanish (default language)
  const ministries = ministriesData?.map(m => ({ id: m.id, name: m.name_es || m.nameEs || '' })) || [];
  const entities = entitiesData?.map(e => ({ id: e.id, code: e.code, name: e.name, entity_type: e.entity_type })) || [];
  const rbacRoles = rbacRolesData || [];
  const workflows = workflowsData || [];
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const type = searchParams.get('type') || 'agent';
  const isAdmin = type === 'admin';

  const inviteAgentMutation = useInviteAgent();
  const inviteAdminMutation = useInviteAdmin();

  const adminForm = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      email: '',
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
      first_name: '',
      last_name: '',
      phone_number: '',
      preferred_language: 'es',
      agent_type: AgentType.MINISTRY_AGENT,
      is_supervisor: false,
      agent_role: 'validator',
      rbac_role_id: '',
      can_approve_unlimited: false,
      can_escalate: true,
      can_assign_tasks: false,
      can_reassign: false,
      working_hours_start: '08:00',
      working_hours_end: '17:00',
      working_days: [1, 2, 3, 4, 5],
      specializations: [],
    },
  });

  const watchAgentType = agentForm.watch('agent_type');
  const watchCanApproveUnlimited = agentForm.watch('can_approve_unlimited');
  const watchEntityId = agentForm.watch('entity_id');
  const watchIsSupervisor = agentForm.watch('is_supervisor');
  const watchRbacRoleId = agentForm.watch('rbac_role_id');

  // Derive entity info from selected entity_id
  const selectedEntity = entities.find(e => e.id === watchEntityId);
  const selectedEntityCode = selectedEntity?.code;
  const isDepartmentEntity = selectedEntity?.entity_type === 'department';

  // Fetch locations for the selected entity
  const { data: entityLocations, isLoading: isLoadingLocations } = useLocationsByEntity(
    selectedEntityCode || '',
    !!selectedEntityCode && watchAgentType === AgentType.ENTITY_AGENT
  );

  const handleAdminSubmit = async (data: AdminFormData) => {
    try {
      const response = await inviteAdminMutation.mutateAsync({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number || undefined,
        preferred_language: data.preferred_language,
      });

      toast({
        title: 'Invitation envoyée',
        description: response.message || `Un email d'activation a été envoyé à ${data.email}. L'administrateur devra définir son mot de passe.`,
      });

      router.push('/dashboard/admin/agents?tab=admins');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error?.message || "Impossible d'envoyer l'invitation",
      });
    }
  };

  const handleAgentSubmit = async (data: AgentFormData) => {
    try {
      // Validate: department entities MUST have a location
      if (data.agent_type === AgentType.ENTITY_AGENT && data.entity_id) {
        const entity = entities.find(e => e.id === data.entity_id);
        if (entity?.entity_type === 'department' && !data.entity_location_id) {
          toast({
            variant: 'destructive',
            title: 'Site obligatoire',
            description: 'Les agents de département doivent être assignés à un site spécifique.',
          });
          return;
        }
      }

      const response = await inviteAgentMutation.mutateAsync({
        user: {
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          phone_number: data.phone_number || undefined,
          preferred_language: data.preferred_language,
        },
        agent_type: data.agent_type,
        is_supervisor: data.is_supervisor,
        ministry_id: data.agent_type === AgentType.MINISTRY_AGENT ? data.ministry_id : undefined,
        entity_id: data.agent_type === AgentType.ENTITY_AGENT ? data.entity_id : undefined,
        entity_location_id: data.agent_type === AgentType.ENTITY_AGENT && data.entity_location_id && data.entity_location_id !== 'ALL_SITES' ? data.entity_location_id : null,
        agent_role: data.agent_role,
        rbac_role_id: data.rbac_role_id, // RBAC role for permissions
        can_approve_unlimited: data.can_approve_unlimited,
        max_approval_amount: data.can_approve_unlimited ? undefined : data.max_approval_amount,
        can_escalate: data.can_escalate,
        can_assign_tasks: data.can_assign_tasks,
        can_reassign: data.can_reassign,
        working_hours_start: data.working_hours_start,
        working_hours_end: data.working_hours_end,
        working_days: data.working_days,
        specializations: data.specializations,
      });

      toast({
        title: 'Invitation envoyée',
        description: response.message || `Un email d'activation a été envoyé à ${data.email}. L'agent devra définir son mot de passe.`,
      });

      router.push('/dashboard/admin/agents');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error?.message || "Impossible d'envoyer l'invitation",
      });
    }
  };

  const isLoading = inviteAgentMutation.isPending || inviteAdminMutation.isPending;

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
                      <FormDescription>
                        Un email d&apos;activation sera envoyé à cette adresse
                      </FormDescription>
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
                Envoyer l&apos;Invitation
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
                      <FormDescription>
                        Un email d&apos;activation sera envoyé à cette adresse
                      </FormDescription>
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
                                <SelectItem value="_loading" disabled>Chargement...</SelectItem>
                              ) : ministries.length === 0 ? (
                                <SelectItem value="_empty" disabled>Aucun ministère disponible</SelectItem>
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
                                <SelectItem value="_loading" disabled>Chargement...</SelectItem>
                              ) : entities.length === 0 ? (
                                <SelectItem value="_empty" disabled>Aucune entité disponible</SelectItem>
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

                {/* Location (site-based routing) - only for entity agents */}
                {watchAgentType === AgentType.ENTITY_AGENT && watchEntityId && (
                  <FormField
                    control={agentForm.control}
                    name="entity_location_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Site / Ubicación
                          {isDepartmentEntity && <span className="text-destructive ml-1">*</span>}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isDepartmentEntity ? 'Seleccionar sitio (obligatorio)' : 'Todos los sitios'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!isDepartmentEntity && (
                              <SelectItem value="ALL_SITES">Todos los sitios (ve todas las solicitudes)</SelectItem>
                            )}
                            {isLoadingLocations ? (
                              <SelectItem value="_loading" disabled>Chargement...</SelectItem>
                            ) : !entityLocations || entityLocations.length === 0 ? (
                              <SelectItem value="_empty" disabled>Aucun site configuré</SelectItem>
                            ) : (
                              entityLocations.map((loc) => (
                                <SelectItem key={loc.id} value={loc.id}>
                                  {loc.location_name} — {loc.city}
                                  {loc.is_main_office ? ' (principal)' : ''}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {isDepartmentEntity
                            ? 'Obligatoire : les agents de département sont liés à un site spécifique.'
                            : 'Optionnel : sans site = voit toutes les demandes de tous les sites.'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Functional Role & Supervisor */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={agentForm.control}
                    name="agent_role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Rôle fonctionnel
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                Classification métier de l&apos;agent (pour statistiques et filtres).
                                N&apos;affecte pas les permissions.
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
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

                {/* RBAC Role - Defines permissions */}
                <FormField
                  control={agentForm.control}
                  name="rbac_role_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Rôle RBAC (Permissions) *
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              Définit les permissions d&apos;accès de l&apos;agent dans le système.
                              Chaque rôle contient un ensemble de permissions prédéfinies.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un rôle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingRbacRoles ? (
                            <SelectItem value="_loading" disabled>Chargement...</SelectItem>
                          ) : rbacRoles.length === 0 ? (
                            <SelectItem value="_empty" disabled>Aucun rôle disponible</SelectItem>
                          ) : (
                            rbacRoles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                                {role.description && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    - {role.description}
                                  </span>
                                )}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Détermine les fonctionnalités accessibles par l&apos;agent
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Warning: supervisor checkbox + supervisor RBAC role = wrong path */}
                {watchIsSupervisor && watchRbacRoleId && (() => {
                  const selectedRole = rbacRoles.find(r => r.id === watchRbacRoleId);
                  if (selectedRole?.code?.startsWith('supervisor')) {
                    return (
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-orange-800">
                              Rôle superviseur RBAC non recommandé
                            </p>
                            <p className="text-orange-700 mt-1">
                              Le rôle &quot;{selectedRole.name}&quot; possède un menu statique.
                              Un superviseur d&apos;entité devrait utiliser un rôle agent standard
                              (ex: agent_cnedoge_pasaporte) pour bénéficier du menu dynamique
                              de l&apos;entité enrichi des outils de supervision.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

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

                  <FormField
                    control={agentForm.control}
                    name="working_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jours de travail</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: 1, label: 'Lun' },
                            { value: 2, label: 'Mar' },
                            { value: 3, label: 'Mer' },
                            { value: 4, label: 'Jeu' },
                            { value: 5, label: 'Ven' },
                            { value: 6, label: 'Sam' },
                            { value: 0, label: 'Dim' },
                          ].map((day) => (
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

            {/* Specializations Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Spécialisations
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Les spécialisations définissent les types de demandes que l&apos;agent peut traiter.
                        Si aucune spécialisation n&apos;est sélectionnée, l&apos;agent héritera des workflows de son entité.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription>
                  Sélectionnez les workflows que cet agent peut traiter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={agentForm.control}
                  name="specializations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workflows assignés</FormLabel>
                      <div className="space-y-4">
                        {isLoadingWorkflows ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Chargement des workflows...
                          </div>
                        ) : workflows.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Aucun workflow disponible. Les workflows seront hérités de l&apos;entité sélectionnée.
                          </p>
                        ) : (
                          <>
                            {/* Group workflows by entity_code */}
                            {Object.entries(
                              workflows.reduce((acc, wf) => {
                                const key = wf.entity_code || 'Général';
                                if (!acc[key]) acc[key] = [];
                                acc[key].push(wf);
                                return acc;
                              }, {} as Record<string, WorkflowOption[]>)
                            ).map(([entityCode, entityWorkflows]) => (
                              <div key={entityCode} className="space-y-2">
                                <h5 className="text-sm font-medium text-muted-foreground">{entityCode}</h5>
                                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                  {entityWorkflows.map((wf) => (
                                    <div
                                      key={wf.code}
                                      className={`flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                                        field.value?.includes(wf.code)
                                          ? 'border-primary bg-primary/5'
                                          : 'border-muted hover:border-primary/50'
                                      }`}
                                      onClick={() => {
                                        const current = field.value || [];
                                        const updated = current.includes(wf.code)
                                          ? current.filter((c) => c !== wf.code)
                                          : [...current, wf.code];
                                        field.onChange(updated);
                                      }}
                                    >
                                      <Checkbox
                                        checked={field.value?.includes(wf.code)}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          const updated = checked
                                            ? [...current, wf.code]
                                            : current.filter((c) => c !== wf.code);
                                          field.onChange(updated);
                                        }}
                                      />
                                      <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{wf.name_es}</p>
                                        {wf.description_es && (
                                          <p className="text-xs text-muted-foreground line-clamp-2">
                                            {wf.description_es}
                                          </p>
                                        )}
                                        <div className="flex gap-1">
                                          {wf.requires_agent_validation && (
                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                              Validation
                                            </span>
                                          )}
                                          {wf.sla_hours && (
                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                              SLA: {wf.sla_hours}h
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        {field.value && field.value.length > 0 && (
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-sm text-muted-foreground">
                              {field.value.length} workflow(s) sélectionné(s)
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => field.onChange([])}
                            >
                              Tout désélectionner
                            </Button>
                          </div>
                        )}
                      </div>
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
                Envoyer l&apos;Invitation
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
