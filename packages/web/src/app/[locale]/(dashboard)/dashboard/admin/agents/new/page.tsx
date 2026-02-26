'use client';

/**
 * Create Agent/Admin Page (Refactored)
 * Context-adaptive form — sections appear/hide based on entity, supervisor, role.
 *
 * Query params:
 * - ?type=agent - Create agent with profile
 * - ?type=admin - Create admin user only
 *
 * @module dashboard/admin/agents/new
 */

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Form } from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Loader2, UserCog, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInviteAgent, useInviteAdmin, useValidateAgent } from '@/modules/agents-admin/hooks';
import { AgentType } from '@/modules/agents-admin/types';
import type { AgentValidationIssue } from '@/modules/agents-admin/types';
import { hierarchyApi } from '@/modules/fiscal-services/services/api';
import { useEntities } from '@/modules/cities/hooks';
import { rolesApi } from '@/modules/roles-admin/services/api';
import { useLocationsByEntity } from '@/modules/entity-locations/hooks';
import {
  AgentAccountFields,
  AgentOrganizationFields,
  AgentRoleFields,
  AgentCapabilitiesFields,
  AgentApprovalFields,
  AgentScheduleFields,
  AgentReviewSummary,
} from '@/modules/agents-admin/components/form-sections';

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
  // User info
  email: z.string().email('Email invalide'),
  first_name: z.string().min(2, 'Minimum 2 caractères').max(100),
  last_name: z.string().min(2, 'Minimum 2 caractères').max(100),
  phone_number: z
    .string()
    .regex(/^(222|555|551|333)\d{6}$/, 'Format: 222/555/551/333 + 6 chiffres')
    .optional()
    .or(z.literal('')),
  preferred_language: z.enum(['es', 'fr', 'en']).default('es'),
  // Organization
  agent_type: z.nativeEnum(AgentType),
  ministry_id: z.coerce.number().int().positive().optional(),
  entity_id: z.string().uuid().optional().or(z.literal('')),
  entity_location_id: z.string().uuid().optional().nullable().or(z.literal('ALL_SITES')).or(z.literal('')),
  // Role
  is_supervisor: z.boolean().default(false),
  rbac_role_id: z.string().uuid('Sélectionnez un rôle RBAC'),
  // Capabilities (supervisor-only, but always in schema with defaults)
  can_escalate: z.boolean().default(true),
  can_assign_tasks: z.boolean().default(false),
  can_reassign: z.boolean().default(false),
  // Approval limits (payment-entity-only)
  can_approve_unlimited: z.boolean().default(false),
  max_approval_amount: z.coerce.number().positive().optional(),
  // Schedule
  working_hours_start: z.string().optional(),
  working_hours_end: z.string().optional(),
  working_days: z.array(z.number()).default([1, 2, 3, 4, 5]),
});

type AdminFormData = z.infer<typeof adminSchema>;
type AgentFormData = z.infer<typeof agentSchema>;

// =============================================================================
// COMPONENT
// =============================================================================

export default function CreateAgentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const type = searchParams.get('type') || 'agent';
  const isAdmin = type === 'admin';

  // --- Data fetching ---
  const { data: ministriesData, isLoading: isLoadingMinistries } = useQuery({
    queryKey: ['ministries', 'list'],
    queryFn: () => hierarchyApi.ministries.list('es'),
    staleTime: 5 * 60 * 1000,
  });

  // Use full Entity (not EntitySimple) to get workflow_codes for context-adaptive UX
  const { data: entitiesData, isLoading: isLoadingEntities } = useEntities({ is_active: true });

  const { data: rbacRolesData, isLoading: isLoadingRbacRoles } = useQuery({
    queryKey: ['roles', 'agent-rbac'],
    queryFn: () => rolesApi.getAgentRbacRoles(),
    staleTime: 5 * 60 * 1000,
  });

  // --- Transform data ---
  const ministries = ministriesData?.map(m => ({ id: m.id, name: m.name_es || m.nameEs || '' })) || [];
  const entities = entitiesData?.items?.map(e => ({
    id: e.id,
    code: e.code,
    name: e.name,
    entity_type: e.entity_type,
    workflow_codes: e.workflow_codes || [],
  })) || [];
  const rbacRoles = rbacRolesData || [];

  // --- Mutations ---
  const inviteAgentMutation = useInviteAgent();
  const inviteAdminMutation = useInviteAdmin();
  const validateMutation = useValidateAgent();

  // --- Validation state ---
  const [validationErrors, setValidationErrors] = useState<AgentValidationIssue[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<AgentValidationIssue[]>([]);
  const [showWarningsDialog, setShowWarningsDialog] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<AgentFormData | null>(null);

  // --- Forms ---
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
      rbac_role_id: '',
      can_approve_unlimited: false,
      can_escalate: true,
      can_assign_tasks: false,
      can_reassign: false,
      working_hours_start: '08:00',
      working_hours_end: '17:00',
      working_days: [1, 2, 3, 4, 5],
    },
  });

  // --- Watchers for context-adaptive visibility ---
  const watchAgentType = agentForm.watch('agent_type');
  const watchEntityId = agentForm.watch('entity_id');
  const watchIsSupervisor = agentForm.watch('is_supervisor');

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

  // --- Lookup names for review summary ---
  const watchRbacRoleId = agentForm.watch('rbac_role_id');
  const selectedRole = rbacRoles.find(r => r.id === watchRbacRoleId);

  // --- Submit handlers ---
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
        description: response.message || `Un email d'activation a été envoyé à ${data.email}.`,
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

  // Actual invite call (after validation passes or warnings confirmed)
  const doInviteAgent = useCallback(async (data: AgentFormData) => {
    try {
      const capabilities = data.is_supervisor
        ? { can_escalate: data.can_escalate, can_assign_tasks: data.can_assign_tasks, can_reassign: data.can_reassign }
        : { can_escalate: true, can_assign_tasks: false, can_reassign: false };

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
        entity_location_id:
          data.agent_type === AgentType.ENTITY_AGENT &&
          data.entity_location_id &&
          data.entity_location_id !== 'ALL_SITES'
            ? data.entity_location_id
            : null,
        rbac_role_id: data.rbac_role_id,
        ...capabilities,
        can_approve_unlimited: data.can_approve_unlimited,
        max_approval_amount: data.can_approve_unlimited ? undefined : data.max_approval_amount,
        working_hours_start: data.working_hours_start,
        working_hours_end: data.working_hours_end,
        working_days: data.working_days,
      });

      toast({
        title: 'Invitation envoyée',
        description: response.message || `Un email d'activation a été envoyé à ${data.email}.`,
      });
      router.push('/dashboard/admin/agents');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error?.message || "Impossible d'envoyer l'invitation",
      });
    }
  }, [inviteAgentMutation, entities, toast, router]);

  // Pre-submit: validate first, then either submit or show warnings dialog
  const handleAgentSubmit = async (data: AgentFormData) => {
    setValidationErrors([]);
    setValidationWarnings([]);

    try {
      const result = await validateMutation.mutateAsync({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        agent_type: data.agent_type,
        entity_id: data.entity_id || undefined,
        entity_location_id: data.entity_location_id || undefined,
        ministry_id: data.agent_type === AgentType.MINISTRY_AGENT ? data.ministry_id : undefined,
        is_supervisor: data.is_supervisor,
        rbac_role_id: data.rbac_role_id,
      });

      setValidationErrors(result.errors);
      setValidationWarnings(result.warnings);

      if (result.errors.length > 0) {
        // Errors block submit — show in review summary + toast
        toast({
          variant: 'destructive',
          title: `${result.errors.length} erreur(s) de validation`,
          description: result.errors[0].message,
        });
        return;
      }

      if (result.warnings.length > 0) {
        // Warnings: show confirmation dialog
        setPendingSubmitData(data);
        setShowWarningsDialog(true);
        return;
      }

      // Clean: submit directly
      await doInviteAgent(data);
    } catch {
      // Validation endpoint unreachable — submit anyway (graceful degradation)
      await doInviteAgent(data);
    }
  };

  // Confirm submission despite warnings
  const handleConfirmWithWarnings = async () => {
    setShowWarningsDialog(false);
    if (pendingSubmitData) {
      await doInviteAgent(pendingSubmitData);
      setPendingSubmitData(null);
    }
  };

  const isLoading = inviteAgentMutation.isPending || inviteAdminMutation.isPending || validateMutation.isPending;

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
              <CardContent>
                <AgentAccountFields form={adminForm} />
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
            {/* 1. Account Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations du compte</CardTitle>
                <CardDescription>
                  L&apos;agent recevra un email pour vérifier son compte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AgentAccountFields form={agentForm} />
              </CardContent>
            </Card>

            {/* 2. Organization */}
            <Card>
              <CardHeader>
                <CardTitle>Organisation</CardTitle>
                <CardDescription>
                  Définir le type d&apos;agent et son affectation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AgentOrganizationFields
                  form={agentForm}
                  ministries={ministries}
                  entities={entities}
                  entityLocations={entityLocations}
                  isLoadingMinistries={isLoadingMinistries}
                  isLoadingEntities={isLoadingEntities}
                  isLoadingLocations={isLoadingLocations}
                />
              </CardContent>
            </Card>

            {/* 3. Role & Supervisor */}
            <Card>
              <CardHeader>
                <CardTitle>Rôle et Permissions</CardTitle>
                <CardDescription>
                  Superviseur, rôle RBAC et capacités
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <AgentRoleFields
                  form={agentForm}
                  rbacRoles={rbacRoles}
                  isLoadingRoles={isLoadingRbacRoles}
                />

                {/* 4. Capabilities — supervisor only */}
                {watchIsSupervisor && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-3">Capacités superviseur</h4>
                      <AgentCapabilitiesFields form={agentForm} />
                    </div>
                  </>
                )}

                {/* 5. Approval Limits — payment entities only */}
                {isPaymentEntity && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-3">Limites d&apos;approbation</h4>
                      <AgentApprovalFields form={agentForm} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 6. Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Horaires de travail</CardTitle>
              </CardHeader>
              <CardContent>
                <AgentScheduleFields form={agentForm} />
              </CardContent>
            </Card>

            {/* 7. Review Summary */}
            <AgentReviewSummary
              form={agentForm}
              entityName={selectedEntity?.name}
              roleName={selectedRole ? `${selectedRole.name} (${selectedRole.code})` : undefined}
              validationErrors={validationErrors}
              validationWarnings={validationWarnings}
              forceOpen={validationErrors.length > 0 || validationWarnings.length > 0}
            />

            {/* Submit */}
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

      {/* Warnings Confirmation Dialog */}
      <AlertDialog open={showWarningsDialog} onOpenChange={setShowWarningsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Avertissements de validation
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>La validation a détecté {validationWarnings.length} avertissement(s) :</p>
                <ul className="space-y-1.5">
                  {validationWarnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-orange-700">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span><strong>{w.field}</strong>: {w.message}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm">Voulez-vous continuer malgré ces avertissements ?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Corriger</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmWithWarnings}>
              Continuer quand même
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
