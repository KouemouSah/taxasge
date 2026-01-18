'use client';

/**
 * Agent/Admin Detail Page
 * View and edit agent profile or admin user details
 *
 * For agents: Shows profile, workload, and performance
 * For admins: Shows user details only
 *
 * @module dashboard/admin/agents/[id]
 * @date 2025-01-14
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useAgentProfile,
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
import { useEntitiesSimple } from '@/modules/cities/hooks';

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const profileSchema = z.object({
  agent_type: z.nativeEnum(AgentType),
  is_supervisor: z.boolean(),
  ministry_id: z.coerce.number().int().positive().optional().nullable(),
  entity_id: z.string().uuid().optional().nullable().or(z.literal('')),
  agent_role: z.enum(['validator', 'approver', 'auditor', 'reviewer']),
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
  // Specializations - workflow codes the agent can handle
  specializations: z.array(z.string()).default([]),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// =============================================================================
// COMPONENT
// =============================================================================

export default function AgentDetailPage() {
  // Fetch ministries and entities dynamically from API
  const { data: ministriesData, isLoading: isLoadingMinistries } = useQuery({
    queryKey: ['ministries', 'list'],
    queryFn: () => hierarchyApi.ministries.list('es'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: entitiesData, isLoading: isLoadingEntities } = useEntitiesSimple(true);

  // Fetch available workflows for specializations
  const { data: workflowsData, isLoading: isLoadingWorkflows } = useAvailableWorkflows();

  // Transform data for select components
  const ministries = ministriesData?.map(m => ({ id: m.id, name: m.name_es || m.nameEs || '' })) || [];
  const entities = entitiesData?.map(e => ({ id: e.id, name: e.name })) || [];
  const workflows = workflowsData || [];
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');

  const profileId = params.id as string;

  // Queries
  const { data: profile, isLoading: profileLoading, error: profileError } = useAgentProfile(profileId);
  const { data: workload, isLoading: workloadLoading } = useAgentWorkload(profileId, !!profile);
  const { data: performance, isLoading: performanceLoading } = useAgentPerformance(profileId, !!profile);

  // Mutations
  const updateMutation = useUpdateAgentProfile();
  const deactivateMutation = useDeactivateAgent();
  const reactivateMutation = useReactivateAgent();

  // Form
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      agent_type: AgentType.MINISTRY_AGENT,
      is_supervisor: false,
      agent_role: 'validator',
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
        agent_role: (profile.agent_role as 'validator' | 'approver' | 'auditor' | 'reviewer') || 'validator',
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

  const watchAgentType = form.watch('agent_type');
  const watchCanApproveUnlimited = form.watch('can_approve_unlimited');

  // Handlers
  const handleSubmit = async (data: ProfileFormData) => {
    try {
      const updateData: AgentProfileUpdateRequest = {
        agent_type: data.agent_type,
        is_supervisor: data.is_supervisor,
        ministry_id: data.agent_type === AgentType.MINISTRY_AGENT ? data.ministry_id ?? undefined : undefined,
        entity_id: data.agent_type === AgentType.ENTITY_AGENT && data.entity_id ? data.entity_id : undefined,
        agent_role: data.agent_role,
        can_approve_unlimited: data.can_approve_unlimited,
        max_approval_amount: data.can_approve_unlimited ? undefined : data.max_approval_amount ?? undefined,
        can_escalate: data.can_escalate,
        can_assign_tasks: data.can_assign_tasks,
        can_reassign: data.can_reassign,
        working_hours_start: data.working_hours_start,
        working_hours_end: data.working_hours_end,
        working_days: data.working_days,
        is_active: data.is_active,
        is_backup_agent: data.is_backup_agent,
        specializations: data.specializations,
      };

      await updateMutation.mutateAsync({
        profileId,
        data: updateData,
      });

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

      toast({
        title: 'Agent désactivé',
        description: "Le profil agent a été désactivé.",
      });

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

      toast({
        title: 'Agent réactivé',
        description: 'Le profil agent a été réactivé.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error?.message || "Impossible de réactiver l'agent",
      });
    }
  };

  // Loading state
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

  // Error state
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

        {/* Profile Tab */}
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
                <Button onClick={() => setIsEditing(true)}>
                  Modifier
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Annuler
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!isEditing ? (
                // Read-only view
                <div className="space-y-6">
                  {/* Type & Organization */}
                  <div className="grid gap-4 md:grid-cols-2">
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
                  </div>

                  <Separator />

                  {/* Role & Supervisor */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Rôle fonctionnel</p>
                      <p className="font-medium capitalize">{profile.agent_role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Superviseur</p>
                      <p className="font-medium">{profile.is_supervisor ? 'Oui' : 'Non'}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Approval Limits */}
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

                  <Separator />

                  {/* Capabilities */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Capacités</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.can_escalate && (
                        <Badge variant="outline">Peut escalader</Badge>
                      )}
                      {profile.can_assign_tasks && (
                        <Badge variant="outline">Peut assigner</Badge>
                      )}
                      {profile.can_reassign && (
                        <Badge variant="outline">Peut réassigner</Badge>
                      )}
                      {profile.is_backup_agent && (
                        <Badge variant="outline">Agent de backup</Badge>
                      )}
                    </div>
                  </div>

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
                // Edit form
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {/* Type & Organization */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="agent_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type d&apos;agent</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
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
                          control={form.control}
                          name="ministry_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ministère</FormLabel>
                              <Select
                                onValueChange={(v) => field.onChange(parseInt(v))}
                                value={field.value?.toString() || ''}
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
                                    <SelectItem value="" disabled>Aucun ministère</SelectItem>
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
                          control={form.control}
                          name="entity_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Entité</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {isLoadingEntities ? (
                                    <SelectItem value="" disabled>Chargement...</SelectItem>
                                  ) : entities.length === 0 ? (
                                    <SelectItem value="" disabled>Aucune entité</SelectItem>
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
                        control={form.control}
                        name="agent_role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rôle fonctionnel</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
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
                                  value={field.value ?? ''}
                                  onChange={(e) => field.onChange(e.target.valueAsNumber || null)}
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
                      <div className="grid gap-4 md:grid-cols-2">
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
                              <FormLabel className="font-normal">Peut assigner</FormLabel>
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

                        <FormField
                          control={form.control}
                          name="is_backup_agent"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="font-normal">Agent de backup</FormLabel>
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

        {/* Specializations Tab */}
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
                    render={({ field }) => (
                      <FormItem>
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
                    )}
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

        {/* Workload Tab */}
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

        {/* Performance Tab */}
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
