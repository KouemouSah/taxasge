'use client';

/**
 * Agent/Admin Detail Page (Refactored)
 * View and edit agent profile with context-adaptive form sections.
 *
 * Tabs: Profile | Specializations | Workload | Performance
 *
 * @module dashboard/admin/agents/[id]
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Form,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Loader2,
  UserCog,
  Briefcase,
  XCircle,
  BarChart3,
  Settings,
  Power,
  PowerOff,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useAgentProfile,
  useAgentProfiles,
  useAgentWorkload,
  useAgentPerformance,
  useUpdateAgentProfile,
  useDeactivateAgent,
  useReactivateAgent,
  useAvailableWorkflows,
} from '@/modules/agents-admin/hooks';
import { WorkloadStats, PerformanceStats } from '@/modules/agents-admin/components';
import { AgentType } from '@/modules/agents-admin/types';
import type { AgentProfileUpdateRequest, WorkflowOption } from '@/modules/agents-admin/types';
import { hierarchyApi } from '@/modules/fiscal-services/services/api';
import { useEntities } from '@/modules/cities/hooks';
import { useRoles } from '@/modules/roles-admin/hooks/useRoles';
import { useLocationsByEntity } from '@/modules/entity-locations/hooks';
import {
  AgentOrganizationFields,
  AgentRoleFields,
  AgentCapabilitiesFields,
  AgentApprovalFields,
  AgentScheduleFields,
} from '@/modules/agents-admin/components/form-sections';

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const profileSchema = z.object({
  agent_type: z.nativeEnum(AgentType),
  is_supervisor: z.boolean(),
  ministry_id: z.coerce.number().int().positive().optional().nullable(),
  entity_id: z.string().uuid().optional().nullable().or(z.literal('')),
  entity_location_id: z.string().uuid().optional().nullable().or(z.literal('ALL_SITES')).or(z.literal('')),
  rbac_role_id: z.string().uuid().optional().nullable().or(z.literal('')),
  can_approve_unlimited: z.boolean(),
  max_approval_amount: z.coerce.number().positive().optional().nullable(),
  can_escalate: z.boolean(),
  can_assign_tasks: z.boolean(),
  can_reassign: z.boolean(),
  working_hours_start: z.string().optional(),
  working_hours_end: z.string().optional(),
  working_days: z.array(z.number()).default([1, 2, 3, 4, 5]),
  is_active: z.boolean(),
  is_backup_agent: z.boolean(),
  specializations: z.array(z.string()).default([]),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// =============================================================================
// COMPONENT
// =============================================================================

export default function AgentDetailPage() {
  // --- Data fetching ---
  const { data: ministriesData, isLoading: isLoadingMinistries } = useQuery({
    queryKey: ['ministries', 'list'],
    queryFn: () => hierarchyApi.ministries.list('es'),
    staleTime: 5 * 60 * 1000,
  });

  // Use full Entity (not EntitySimple) to get workflow_codes for context-adaptive UX
  const { data: entitiesData, isLoading: isLoadingEntities } = useEntities({ is_active: true });

  const { data: workflowsData, isLoading: isLoadingWorkflows } = useAvailableWorkflows();
  const { data: rolesData, isLoading: isLoadingRoles } = useRoles({ entity_type: null });

  // --- Transform data ---
  const ministries = ministriesData?.map(m => ({ id: m.id, name: m.name_es || m.nameEs || '' })) || [];
  const entities = entitiesData?.items?.map(e => ({
    id: e.id,
    code: e.code,
    name: e.name,
    entity_type: e.entity_type,
    workflow_codes: e.workflow_codes || [],
  })) || [];
  const workflows = workflowsData || [];
  const rbacRoles = rolesData?.roles || [];

  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(searchParams.get('mode') === 'edit');
  const [deactivateReason, setDeactivateReason] = useState('');
  const [workflowFilter, setWorkflowFilter] = useState('');

  const profileId = params.id as string;

  // --- Queries ---
  const { data: profile, isLoading: profileLoading, error: profileError } = useAgentProfile(profileId);
  const { data: workload, isLoading: workloadLoading } = useAgentWorkload(profileId, !!profile);
  const { data: performance, isLoading: performanceLoading } = useAgentPerformance(profileId, !!profile);

  // Agent navigation
  const { data: allAgentsData, isLoading: agentsListLoading, error: agentsListError } = useAgentProfiles({ page_size: 500 });
  const allAgents = allAgentsData?.items || [];
  const currentIndex = allAgents.findIndex(a => a.id === profileId);
  const prevAgentId = currentIndex > 0 ? allAgents[currentIndex - 1]?.id : null;
  const nextAgentId = currentIndex < allAgents.length - 1 ? allAgents[currentIndex + 1]?.id : null;

  // --- Mutations ---
  const updateMutation = useUpdateAgentProfile();
  const deactivateMutation = useDeactivateAgent();
  const reactivateMutation = useReactivateAgent();

  // --- Form ---
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      agent_type: AgentType.MINISTRY_AGENT,
      is_supervisor: false,
      rbac_role_id: '',
      can_approve_unlimited: false,
      can_escalate: true,
      can_assign_tasks: false,
      can_reassign: false,
      is_active: true,
      is_backup_agent: false,
      specializations: [],
    },
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      form.reset({
        agent_type: profile.agent_type,
        is_supervisor: profile.is_supervisor,
        ministry_id: profile.ministry_id ?? null,
        entity_id: profile.entity_id ?? '',
        entity_location_id: profile.entity_location_id ?? '',
        rbac_role_id: '',
        can_approve_unlimited: profile.can_approve_unlimited,
        max_approval_amount: profile.max_approval_amount ?? null,
        can_escalate: profile.can_escalate,
        can_assign_tasks: profile.can_assign_tasks,
        can_reassign: profile.can_reassign,
        working_hours_start: profile.working_hours_start ?? '08:00',
        working_hours_end: profile.working_hours_end ?? '17:00',
        working_days: profile.working_days ?? [1, 2, 3, 4, 5],
        is_active: profile.is_active,
        is_backup_agent: profile.is_backup_agent,
        specializations: profile.specializations ?? [],
      });
    }
  }, [profile, form]);

  // --- Watchers for context-adaptive visibility ---
  const watchAgentType = form.watch('agent_type');
  const watchEntityId = form.watch('entity_id');
  const watchIsSupervisor = form.watch('is_supervisor');

  // Derive entity info
  const selectedEntity = entities.find(e => e.id === watchEntityId);
  const selectedEntityCode = selectedEntity?.code;

  // Context-adaptive flags
  const isPaymentEntity = selectedEntity && (!selectedEntity.workflow_codes || selectedEntity.workflow_codes.length === 0);

  // Fetch locations for selected entity
  const { data: entityLocations, isLoading: isLoadingLocations } = useLocationsByEntity(
    selectedEntityCode || '',
    !!selectedEntityCode && watchAgentType === AgentType.ENTITY_AGENT
  );

  // Reset entity_location_id when entity changes (only after profile loaded)
  useEffect(() => {
    if (profile && watchEntityId !== profile.entity_id) {
      form.setValue('entity_location_id', '');
    }
  }, [watchEntityId, profile, form]);

  // --- Submit handlers ---
  const handleSubmit = async (data: ProfileFormData) => {
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

      // Non-supervisors get defaults for capabilities
      const capabilities = data.is_supervisor
        ? { can_escalate: data.can_escalate, can_assign_tasks: data.can_assign_tasks, can_reassign: data.can_reassign }
        : { can_escalate: true, can_assign_tasks: false, can_reassign: false };

      const updateData: AgentProfileUpdateRequest = {
        agent_type: data.agent_type,
        is_supervisor: data.is_supervisor,
        ministry_id: data.agent_type === AgentType.MINISTRY_AGENT ? data.ministry_id ?? undefined : undefined,
        entity_id: data.agent_type === AgentType.ENTITY_AGENT && data.entity_id ? data.entity_id : undefined,
        entity_location_id:
          data.agent_type === AgentType.ENTITY_AGENT &&
          data.entity_location_id &&
          data.entity_location_id !== 'ALL_SITES'
            ? data.entity_location_id
            : null,
        rbac_role_id: data.rbac_role_id || undefined,
        ...capabilities,
        can_approve_unlimited: data.can_approve_unlimited,
        max_approval_amount: data.can_approve_unlimited ? undefined : data.max_approval_amount ?? undefined,
        working_hours_start: data.working_hours_start,
        working_hours_end: data.working_hours_end,
        working_days: data.working_days,
        is_active: data.is_active,
        is_backup_agent: data.is_backup_agent,
        specializations: data.specializations,
      };

      await updateMutation.mutateAsync({ profileId, data: updateData });

      toast({
        title: 'Profil mis à jour',
        description: 'Les modifications ont été enregistrées.',
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error?.message || 'Impossible de mettre à jour le profil',
      });
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivateMutation.mutateAsync({
        profileId,
        reason: deactivateReason || undefined,
      });
      toast({ title: 'Agent désactivé', description: 'Le profil agent a été désactivé.' });
      setDeactivateReason('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error?.message || "Impossible de désactiver l'agent",
      });
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateMutation.mutateAsync(profileId);
      toast({ title: 'Agent réactivé', description: 'Le profil agent a été réactivé.' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error?.message || "Impossible de réactiver l'agent",
      });
    }
  };

  // --- Loading state ---
  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // --- Error state ---
  if (profileError || !profile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Agent non trouvé</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Le profil agent demandé n&apos;existe pas ou vous n&apos;avez pas les permissions nécessaires.
            </p>
            <Button className="mt-4" onClick={() => router.push('/dashboard/admin/agents')}>
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const agentTypeLabel = profile.agent_type === AgentType.MINISTRY_AGENT ? 'Agent Ministère' : 'Agent Entité';
  const organizationName = profile.ministry_name || profile.entity_name || '-';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <UserCog className="h-8 w-8" />
              {profile.user_full_name || 'Agent'}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                {profile.is_active ? 'Actif' : 'Inactif'}
              </Badge>
              <Badge variant="outline">{agentTypeLabel}</Badge>
              {profile.is_supervisor && (
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  Superviseur
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Agent Navigation */}
          <div className="flex items-center gap-1 mr-2 border-r pr-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => prevAgentId && router.push(`/${locale}/dashboard/admin/agents/${prevAgentId}`)}
              disabled={!prevAgentId || agentsListLoading}
              title={prevAgentId ? 'Agent précédent' : "Pas d'agent précédent"}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2 min-w-[50px] text-center">
              {agentsListLoading ? (
                <Loader2 className="h-3 w-3 animate-spin inline" />
              ) : agentsListError ? (
                <span className="text-destructive" title="Échec du chargement">!</span>
              ) : currentIndex >= 0 ? (
                `${currentIndex + 1}/${allAgents.length}`
              ) : (
                '- / -'
              )}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => nextAgentId && router.push(`/${locale}/dashboard/admin/agents/${nextAgentId}`)}
              disabled={!nextAgentId || agentsListLoading}
              title={nextAgentId ? 'Agent suivant' : "Pas d'agent suivant"}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {profile.is_active ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-600">
                  <PowerOff className="h-4 w-4 mr-2" />
                  Désactiver
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Désactiver l&apos;agent ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    L&apos;agent ne pourra plus traiter de dossiers. Cette action est réversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="Raison de la désactivation (optionnel)"
                    value={deactivateReason}
                    onChange={(e) => setDeactivateReason(e.target.value)}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeactivate}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deactivateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Désactiver'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              variant="outline"
              className="text-green-600"
              onClick={handleReactivate}
              disabled={reactivateMutation.isPending}
            >
              {reactivateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Power className="h-4 w-4 mr-2" />
              )}
              Réactiver
            </Button>
          )}
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations utilisateur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{profile.user_email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Téléphone</p>
              <p className="font-medium">{profile.user_phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Organisation</p>
              <p className="font-medium">{organizationName}</p>
            </div>
            {profile.agent_type === AgentType.ENTITY_AGENT && (
              <div>
                <p className="text-sm text-muted-foreground">Site</p>
                <p className="font-medium">
                  {profile.location_name || 'Toutes ubicaciones'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="specializations" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Spécialisations
          </TabsTrigger>
          <TabsTrigger value="workload" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Charge
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* ========== Profile Tab ========== */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Configuration du profil</CardTitle>
                <CardDescription>
                  Type, permissions et paramètres de l&apos;agent
                </CardDescription>
              </div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>Modifier</Button>
              ) : (
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Annuler</Button>
              )}
            </CardHeader>
            <CardContent>
              {!isEditing ? (
                /* ---- Read-only view ---- */
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Type d&apos;agent</p>
                      <p className="font-medium">{agentTypeLabel}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {profile.agent_type === AgentType.MINISTRY_AGENT ? 'Ministère' : 'Entité'}
                      </p>
                      <p className="font-medium">{organizationName}</p>
                    </div>
                    {profile.agent_type === AgentType.ENTITY_AGENT && (
                      <div>
                        <p className="text-sm text-muted-foreground">Site / Ubicación</p>
                        <p className="font-medium">
                          {profile.location_name
                            ? `${profile.location_name} — ${profile.location_city || ''}`
                            : 'Todas las ubicaciones'}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Superviseur</p>
                      <p className="font-medium">{profile.is_supervisor ? 'Oui' : 'Non'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type d&apos;agent</p>
                      <p className="font-medium capitalize">{profile.agent_type?.replace('_', ' ')}</p>
                    </div>
                  </div>

                  {/* Capabilities — show if supervisor */}
                  {profile.is_supervisor && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Capacités superviseur</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.can_escalate && <Badge variant="outline">Peut escalader</Badge>}
                          {profile.can_assign_tasks && <Badge variant="outline">Peut assigner</Badge>}
                          {profile.can_reassign && <Badge variant="outline">Peut réassigner</Badge>}
                          {profile.is_backup_agent && <Badge variant="outline">Agent de backup</Badge>}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Approval — show if relevant */}
                  {(profile.can_approve_unlimited || profile.max_approval_amount) && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Limites d&apos;approbation</p>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Approbation illimitée</p>
                            <p className="font-medium">{profile.can_approve_unlimited ? 'Oui' : 'Non'}</p>
                          </div>
                          {!profile.can_approve_unlimited && (
                            <div>
                              <p className="text-sm text-muted-foreground">Montant maximum</p>
                              <p className="font-medium">
                                {profile.max_approval_amount
                                  ? `${profile.max_approval_amount.toLocaleString()} XAF`
                                  : '-'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Working Hours */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Horaires de travail</p>
                      <p className="font-medium">
                        {profile.working_hours_start || '08:00'} - {profile.working_hours_end || '17:00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Jours de travail</p>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { value: 1, label: 'Lun' },
                          { value: 2, label: 'Mar' },
                          { value: 3, label: 'Mer' },
                          { value: 4, label: 'Jeu' },
                          { value: 5, label: 'Ven' },
                          { value: 6, label: 'Sam' },
                          { value: 0, label: 'Dim' },
                        ].map((day) => (
                          <Badge
                            key={day.value}
                            variant={(profile.working_days || [1, 2, 3, 4, 5]).includes(day.value) ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {day.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Créé le</p>
                    <p className="font-medium">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                /* ---- Edit form (using extracted components) ---- */
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {/* Organization */}
                    <AgentOrganizationFields
                      form={form}
                      ministries={ministries}
                      entities={entities}
                      entityLocations={entityLocations}
                      isLoadingMinistries={isLoadingMinistries}
                      isLoadingEntities={isLoadingEntities}
                      isLoadingLocations={isLoadingLocations}
                      isEditMode
                    />

                    <Separator />

                    {/* Role & Supervisor */}
                    <AgentRoleFields
                      form={form}
                      rbacRoles={rbacRoles}
                      isLoadingRoles={isLoadingRoles}
                    />

                    {/* Capabilities — supervisor only */}
                    {watchIsSupervisor && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium mb-3">Capacités superviseur</h4>
                          <AgentCapabilitiesFields form={form} />
                          {/* Backup agent — edit-only field */}
                          <div className="mt-4">
                            <FormField
                              control={form.control}
                              name="is_backup_agent"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <div className="space-y-1 leading-none">
                                    <label className="text-sm font-medium leading-none">Agent de backup</label>
                                    <p className="text-xs text-muted-foreground">
                                      Reçoit les tâches quand les agents principaux sont indisponibles.
                                    </p>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Approval Limits — payment entities only */}
                    {isPaymentEntity && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium mb-3">Limites d&apos;approbation</h4>
                          <AgentApprovalFields form={form} />
                        </div>
                      </>
                    )}

                    <Separator />

                    {/* Schedule */}
                    <div>
                      <h4 className="text-sm font-medium mb-3">Horaires de travail</h4>
                      <AgentScheduleFields form={form} />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" disabled={updateMutation.isPending}>
                        {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          {/* Deactivation Info */}
          {!profile.is_active && profile.deactivated_at && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Profil désactivé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Désactivé le</p>
                    <p className="font-medium">{new Date(profile.deactivated_at).toLocaleString()}</p>
                  </div>
                  {profile.deactivation_reason && (
                    <div>
                      <p className="text-muted-foreground">Raison</p>
                      <p className="font-medium">{profile.deactivation_reason}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ========== Specializations Tab ========== */}
        <TabsContent value="specializations" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Spécialisations
                    <Badge variant="outline">
                      {form.watch('specializations')?.length || 0} workflow(s)
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Les spécialisations définissent les types de demandes que l&apos;agent peut traiter.
                    Si aucune n&apos;est sélectionnée, l&apos;agent héritera des workflows de son entité.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)}>
                  <FormField
                    control={form.control}
                    name="specializations"
                    render={({ field }) => {
                      const filteredWorkflows = workflowFilter
                        ? workflows.filter(wf =>
                            wf.name_es?.toLowerCase().includes(workflowFilter.toLowerCase()) ||
                            wf.code.toLowerCase().includes(workflowFilter.toLowerCase()) ||
                            wf.entity_code?.toLowerCase().includes(workflowFilter.toLowerCase())
                          )
                        : workflows;

                      const groupedWorkflows = filteredWorkflows.reduce((acc, wf) => {
                        const key = wf.entity_code || 'Général';
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(wf);
                        return acc;
                      }, {} as Record<string, WorkflowOption[]>);

                      const getSelectedCount = (entityWorkflows: WorkflowOption[]) =>
                        entityWorkflows.filter(wf => field.value?.includes(wf.code)).length;

                      const toggleGroup = (entityWorkflows: WorkflowOption[], select: boolean) => {
                        const codes = entityWorkflows.map(wf => wf.code);
                        const current = field.value || [];
                        if (select) {
                          const newCodes = codes.filter(c => !current.includes(c));
                          field.onChange([...current, ...newCodes]);
                        } else {
                          field.onChange(current.filter(c => !codes.includes(c)));
                        }
                      };

                      return (
                        <FormItem>
                          <div className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Filtrer les workflows par nom, code ou entité..."
                                value={workflowFilter}
                                onChange={(e) => setWorkflowFilter(e.target.value)}
                                className="pl-9"
                              />
                            </div>

                            {isLoadingWorkflows ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Chargement des workflows...
                              </div>
                            ) : workflows.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Aucun workflow disponible.
                              </p>
                            ) : filteredWorkflows.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-8">
                                Aucun workflow ne correspond à &quot;{workflowFilter}&quot;
                              </p>
                            ) : (
                              <Accordion type="multiple" defaultValue={Object.keys(groupedWorkflows)} className="w-full">
                                {Object.entries(groupedWorkflows).map(([entityCode, entityWorkflows]) => {
                                  const selectedCount = getSelectedCount(entityWorkflows);
                                  const allSelected = selectedCount === entityWorkflows.length;

                                  return (
                                    <AccordionItem key={entityCode} value={entityCode}>
                                      <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center justify-between w-full pr-4">
                                          <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="font-mono">
                                              {entityCode}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                              {entityWorkflows.length} workflow(s)
                                            </span>
                                          </div>
                                          {selectedCount > 0 && (
                                            <Badge variant="default" className="ml-auto mr-2">
                                              {selectedCount} sélectionné(s)
                                            </Badge>
                                          )}
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <div className="flex items-center justify-end gap-2 mb-3 pb-2 border-b">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleGroup(entityWorkflows, true)}
                                            disabled={allSelected}
                                          >
                                            Tout sélectionner
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleGroup(entityWorkflows, false)}
                                            disabled={selectedCount === 0}
                                          >
                                            Tout désélectionner
                                          </Button>
                                        </div>
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
                                      </AccordionContent>
                                    </AccordionItem>
                                  );
                                })}
                              </Accordion>
                            )}

                            {field.value && field.value.length > 0 && (
                              <div className="flex items-center justify-between pt-4 border-t">
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
                      );
                    }}
                  />
                  <div className="flex justify-end gap-3 pt-6">
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enregistrer les spécialisations
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== Workload Tab ========== */}
        <TabsContent value="workload" className="mt-6">
          {workloadLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : workload ? (
            <WorkloadStats workload={workload} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Aucune donnée de charge de travail disponible.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ========== Performance Tab ========== */}
        <TabsContent value="performance" className="mt-6">
          {performanceLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : performance ? (
            <PerformanceStats performance={performance} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Aucune donnée de performance disponible.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
