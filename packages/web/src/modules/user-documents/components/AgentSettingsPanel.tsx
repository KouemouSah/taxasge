/**
 * AgentSettingsPanel - Side panel for managing document agent permissions & memories
 *
 * Three sections:
 * 1. Permissions - Toggle switches for each permission type + level selector
 * 2. Memories - List of learned memories with confidence bar & delete
 * 3. Stats - Usage statistics (conversations, permissions, memories)
 *
 * @module user-documents/components
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  Brain,
  Shield,
  Trash2,
  RotateCcw,
  Settings2,
  Loader2,
  Sparkles,
  MessageSquare,
  CheckCircle,
  ClipboardList,
  CalendarDays,
  Bell,
  FolderOpen,
  Settings,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Lightbulb,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userDocumentsApi } from '../services/api';
import type { AgentPermission, AgentMemory } from '../types';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Permission type definitions in display order */
const PERMISSION_TYPES: ReadonlyArray<{ key: string; icon: LucideIcon; alwaysOn: boolean }> = [
  { key: 'prepare_renewal', icon: RotateCcw, alwaysOn: false },
  { key: 'prepare_request', icon: ClipboardList, alwaysOn: false },
  { key: 'suggest_appointments', icon: CalendarDays, alwaysOn: false },
  { key: 'proactive_alerts', icon: Bell, alwaysOn: false },
  { key: 'auto_classify', icon: FolderOpen, alwaysOn: false },
];

/** Memory type icon map — aligned with backend CHECK constraint */
const MEMORY_TYPE_ICON: Record<string, LucideIcon> = {
  preference: Settings,
  behavioral: BarChart3,
  correction: AlertTriangle,
  capability: CheckCircle2,
  context: FileText,
};

// =============================================================================
// QUERY KEYS
// =============================================================================

const agentKeys = {
  permissions: ['user-documents', 'agent', 'permissions'] as const,
  memories: ['user-documents', 'agent', 'memories'] as const,
};

// =============================================================================
// PROPS
// =============================================================================

interface AgentSettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Single permission row with toggle + level selector */
function PermissionRow({
  permissionKey,
  icon: Icon,
  alwaysOn,
  permission,
  isToggling,
  onToggle,
  onLevelChange,
}: {
  permissionKey: string;
  icon: LucideIcon;
  alwaysOn: boolean;
  permission: AgentPermission | undefined;
  isToggling: boolean;
  onToggle: (type: string, active: boolean) => void;
  onLevelChange: (type: string, level: number) => void;
}) {
  const t = useTranslations('userDocuments.agent');
  const isActive = alwaysOn || permission?.is_active || false;
  const currentLevel = permission?.level ?? 1;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {t(`permissionTypes.${permissionKey}`)}
        </p>
        {isActive && (
          <div className="flex items-center gap-2 mt-1">
            <Select
              value={String(currentLevel)}
              onValueChange={(val) => onLevelChange(permissionKey, Number(val))}
              disabled={alwaysOn}
            >
              <SelectTrigger className="h-6 w-auto text-xs px-2 py-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">
                  <span className="text-xs">{t('levels.1')}</span>
                </SelectItem>
                <SelectItem value="2">
                  <span className="text-xs">{t('levels.2')}</span>
                </SelectItem>
              </SelectContent>
            </Select>
            {permission?.usage_count != null && permission.usage_count > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1">
                {permission.usage_count}x
              </Badge>
            )}
          </div>
        )}
      </div>
      <Switch
        checked={isActive}
        onCheckedChange={(checked) => onToggle(permissionKey, checked)}
        disabled={alwaysOn || isToggling}
        aria-label={t(`permissionTypes.${permissionKey}`)}
      />
    </div>
  );
}

/** Single memory row with confidence and delete */
function MemoryRow({
  memory,
  onDelete,
  isDeleting,
}: {
  memory: AgentMemory;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const t = useTranslations('userDocuments.agent');
  const MemoryIcon = MEMORY_TYPE_ICON[memory.memory_type] ?? Lightbulb;
  const confidencePercent = Math.round(memory.confidence * 100);

  return (
    <div className="flex items-start gap-3 py-2.5 group">
      <MemoryIcon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm leading-snug line-clamp-2">
          {memory.content}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground shrink-0">
            {t('confidence')}
          </span>
          <Progress
            value={confidencePercent}
            className="h-1.5 flex-1 max-w-[80px]"
          />
          <span className="text-[10px] text-muted-foreground shrink-0">
            {confidencePercent}%
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onDelete(memory.id)}
        disabled={isDeleting}
        aria-label={`Delete memory: ${memory.content.slice(0, 30)}`}
      >
        {isDeleting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        )}
      </Button>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AgentSettingsPanel({ open, onOpenChange }: AgentSettingsPanelProps) {
  const t = useTranslations('userDocuments.agent');
  const queryClient = useQueryClient();
  const [togglingType, setTogglingType] = useState<string | null>(null);
  const [deletingMemoryId, setDeletingMemoryId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const {
    data: permissions = [],
    isLoading: permissionsLoading,
  } = useQuery({
    queryKey: agentKeys.permissions,
    queryFn: userDocumentsApi.listPermissions,
    enabled: open,
    staleTime: 60_000,
  });

  const {
    data: memories = [],
    isLoading: memoriesLoading,
  } = useQuery({
    queryKey: agentKeys.memories,
    queryFn: userDocumentsApi.listMemories,
    enabled: open,
    staleTime: 60_000,
  });

  // Build a permission map for quick lookups
  const permissionMap = useMemo(() => {
    const map: Record<string, AgentPermission> = {};
    for (const p of permissions) {
      map[p.permission_type] = p;
    }
    return map;
  }, [permissions]);

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const grantMutation = useMutation({
    mutationFn: userDocumentsApi.grantPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.permissions });
    },
    onSettled: () => setTogglingType(null),
  });

  const revokeMutation = useMutation({
    mutationFn: userDocumentsApi.revokePermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.permissions });
    },
    onSettled: () => setTogglingType(null),
  });

  const deleteMemoryMutation = useMutation({
    mutationFn: userDocumentsApi.deleteMemory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.memories });
    },
    onSettled: () => setDeletingMemoryId(null),
  });

  const resetMemoriesMutation = useMutation({
    mutationFn: userDocumentsApi.resetMemories,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.memories });
    },
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleToggle = useCallback(
    (type: string, active: boolean) => {
      setTogglingType(type);
      const existing = permissionMap[type];

      if (active) {
        grantMutation.mutate({
          permission_type: type,
          level: existing?.level ?? 1,
        });
      } else if (existing) {
        revokeMutation.mutate(existing.id);
      }
    },
    [permissionMap, grantMutation, revokeMutation]
  );

  const handleLevelChange = useCallback(
    (type: string, level: number) => {
      setTogglingType(type);
      grantMutation.mutate({ permission_type: type, level });
    },
    [grantMutation]
  );

  const handleDeleteMemory = useCallback(
    (memoryId: string) => {
      setDeletingMemoryId(memoryId);
      deleteMemoryMutation.mutate(memoryId);
    },
    [deleteMemoryMutation]
  );

  // ---------------------------------------------------------------------------
  // Computed stats
  // ---------------------------------------------------------------------------

  const stats = useMemo(() => {
    const activePerms = permissions.filter((p) => p.is_active).length;
    const totalUsage = permissions.reduce((acc, p) => acc + (p.usage_count ?? 0), 0);
    return {
      permissionsGranted: activePerms,
      totalConversations: totalUsage,
      memoriesLearned: memories.length,
    };
  }, [permissions, memories]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-md flex flex-col"
        side="right"
      >
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            {t('settings')}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t('settings')}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-6">
            {/* ── Permissions Section ─────────────────────────── */}
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                <Shield className="h-4 w-4" />
                {t('permissions')}
              </h3>

              {permissionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-6 w-6 rounded" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-9 ml-auto rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y">
                  {PERMISSION_TYPES.map((pt) => (
                    <PermissionRow
                      key={pt.key}
                      permissionKey={pt.key}
                      icon={pt.icon}
                      alwaysOn={pt.alwaysOn}
                      permission={permissionMap[pt.key]}
                      isToggling={togglingType === pt.key}
                      onToggle={handleToggle}
                      onLevelChange={handleLevelChange}
                    />
                  ))}
                </div>
              )}
            </section>

            <Separator />

            {/* ── Memories Section ────────────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <Brain className="h-4 w-4" />
                  {t('memories')}
                </h3>

                {memories.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        disabled={resetMemoriesMutation.isPending}
                      >
                        {resetMemoriesMutation.isPending ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3 w-3 mr-1" />
                        )}
                        {t('resetMemories')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('resetMemories')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('resetConfirm')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t('reject')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => resetMemoriesMutation.mutate()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('confirm')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              {memoriesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-5 w-5 rounded mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-1.5 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : memories.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t('noMemories')}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {memories.map((memory) => (
                    <MemoryRow
                      key={memory.id}
                      memory={memory}
                      onDelete={handleDeleteMemory}
                      isDeleting={deletingMemoryId === memory.id}
                    />
                  ))}
                </div>
              )}
            </section>

            <Separator />

            {/* ── Stats Section ───────────────────────────────── */}
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                <Sparkles className="h-4 w-4" />
                Stats
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  icon={MessageSquare}
                  value={stats.totalConversations}
                  label="Conversations"
                  isLoading={permissionsLoading}
                />
                <StatCard
                  icon={CheckCircle}
                  value={stats.permissionsGranted}
                  label={t('permissions')}
                  isLoading={permissionsLoading}
                />
                <StatCard
                  icon={Brain}
                  value={stats.memoriesLearned}
                  label={t('memories')}
                  isLoading={memoriesLoading}
                />
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// =============================================================================
// STAT CARD
// =============================================================================

function StatCard({
  icon: Icon,
  value,
  label,
  isLoading,
}: {
  icon: typeof Brain;
  value: number;
  label: string;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <Icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
      {isLoading ? (
        <Skeleton className="h-6 w-8 mx-auto" />
      ) : (
        <p className="text-xl font-bold">{value}</p>
      )}
      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
        {label}
      </p>
    </div>
  );
}
