'use client';

import { UseFormReturn } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SafeSelect } from '@/components/ui/safe-select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RoleOption {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

interface AgentRoleFieldsProps {
  form: UseFormReturn<any>;
  rbacRoles: RoleOption[];
  isLoadingRoles: boolean;
}

export function AgentRoleFields({
  form,
  rbacRoles,
  isLoadingRoles,
}: AgentRoleFieldsProps) {
  const watchIsSupervisor = form.watch('is_supervisor');
  const watchRbacRoleId = form.watch('rbac_role_id');

  // Check supervisor + role compatibility
  const selectedRole = rbacRoles.find(r => r.id === watchRbacRoleId);
  const hasSupervisorMismatch = watchIsSupervisor && selectedRole && !selectedRole.code.includes('supervisor');

  const roleItems = rbacRoles.map(r => ({
    value: r.id,
    label: `${r.name} (${r.code})`,
    description: r.description ?? undefined,
  }));

  return (
    <div className="space-y-4">
      {/* Supervisor Toggle */}
      <FormField
        control={form.control}
        name="is_supervisor"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Superviseur</FormLabel>
              <FormDescription>
                Les superviseurs peuvent gérer les équipes, réassigner les tâches et accéder aux tableaux de bord de supervision.
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      {/* RBAC Role */}
      <FormField
        control={form.control}
        name="rbac_role_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              Rôle RBAC <span className="text-destructive">*</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Le rôle RBAC détermine les permissions de l&apos;agent (menus, actions, accès aux données).</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </FormLabel>
            <FormControl>
              <SafeSelect
                value={field.value || ''}
                onValueChange={field.onChange}
                items={roleItems}
                isLoading={isLoadingRoles}
                emptyMessage="Aucun rôle disponible"
                placeholder="Sélectionner un rôle RBAC"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Supervisor + Role mismatch warning */}
      {hasSupervisorMismatch && (
        <Alert variant="default" className="border-orange-300 bg-orange-50">
          <Info className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Attention : Vous avez coché &quot;Superviseur&quot; mais le rôle RBAC sélectionné ({selectedRole?.code}) n&apos;est pas un rôle superviseur.
            Vérifiez que c&apos;est intentionnel ou sélectionnez un rôle contenant &quot;supervisor&quot;.
          </AlertDescription>
        </Alert>
      )}

    </div>
  );
}
