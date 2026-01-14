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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useAgentProfile,
  useAgentWorkload,
  useAgentPerformance,
  useUpdateAgentProfile,
  useDeactivateAgent,
  useReactivateAgent,
} from '@/modules/agents-admin/hooks';
import { WorkloadStats, PerformanceStats } from '@/modules/agents-admin/components';
import { AgentType } from '@/modules/agents-admin/types';
import type { AgentProfileUpdateRequest } from '@/modules/agents-admin/types';

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
  is_active: z.boolean(),
  is_backup_agent: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// =============================================================================
// MOCK DATA (replace with API calls)
// =============================================================================

const MOCK_MINISTRIES = [
  { id: 1, name: 'Ministerio de Hacienda y Presupuestos' },
  { id: 2, name: 'Ministerio del Interior' },
  { id: 3, name: 'Ministerio de Justicia' },
];

const MOCK_ENTITIES = [
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'DGI - Dirección General de Impuestos' },
  { id: '550e8400-e29b-41d4-a716-446655440002', name: 'DGIP - Dirección General de Inmigración' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function AgentDetailPage() {
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
        is_active: profile.is_active,
        is_backup_agent: profile.is_backup_agent,
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
        is_active: data.is_active,
        is_backup_agent: data.is_backup_agent,
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="workload" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Charge de travail
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
                      <p className="text-sm text-muted-foreground">Créé le</p>
                      <p className="font-medium">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
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
                                  {MOCK_MINISTRIES.map((m) => (
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
                              <FormLabel>Entité</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {MOCK_ENTITIES.map((e) => (
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
