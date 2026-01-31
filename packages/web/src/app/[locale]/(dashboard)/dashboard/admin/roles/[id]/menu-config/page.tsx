/**
 * Role Menu Config Page
 * Admin page for managing role-specific menu, dashboard, and UI configurations
 *
 * @page /dashboard/admin/roles/[id]/menu-config
 * @date 2026-01-25
 * @updated 2026-01-31 - Added visual MenuBuilder for menu configuration
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  ArrowLeft,
  Loader2,
  Save,
  RotateCcw,
  Menu,
  LayoutDashboard,
  Palette,
  Code,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { useRoleWithPermissions } from '@/modules/roles-admin';
import {
  useRoleMenuConfig,
  useUpdateRoleMenuConfig,
  type RoleMenuConfigUpdateRequest,
} from '@/modules/admin/hooks/useRoleMenuConfig';
import { MenuBuilder, type MenuItem, menuConfigToJson } from '@/modules/admin/components/menu-builder';

// =============================================================================
// TYPES
// =============================================================================

interface JsonEditorState {
  value: string;
  error: string | null;
  isDirty: boolean;
}

interface MenuBuilderState {
  menus: MenuItem[];
  isAutoMode: boolean;
  isDirty: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function RoleMenuConfigPage() {
  const _router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('menuConfig');
  const tCommon = useTranslations('common');

  const roleId = params.id as string;

  // Fetch role basic info
  const {
    data: role,
    isLoading: roleLoading,
    error: roleError,
  } = useRoleWithPermissions(roleId);

  // Fetch role menu config
  const {
    data: config,
    isLoading: configLoading,
    error: configError,
  } = useRoleMenuConfig(roleId);

  // Update mutation
  const updateMutation = useUpdateRoleMenuConfig();

  // Menu builder state (visual editor)
  const [menuBuilderState, setMenuBuilderState] = useState<MenuBuilderState>({
    menus: [],
    isAutoMode: true,
    isDirty: false,
  });

  // JSON editor states (for dashboard and UI configs)
  const [dashboardConfig, setDashboardConfig] = useState<JsonEditorState>({
    value: '{}',
    error: null,
    isDirty: false,
  });
  const [uiConfig, setUiConfig] = useState<JsonEditorState>({
    value: '{}',
    error: null,
    isDirty: false,
  });

  // Reset confirmation dialog
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<'menu' | 'dashboard' | 'ui' | 'all'>('all');

  // Initialize states from fetched data
  useEffect(() => {
    if (config) {
      // Menu config is handled by MenuBuilder - it parses internally
      // We just track if it's auto mode (null = auto)
      setMenuBuilderState({
        menus: [],
        isAutoMode: config.menu_config === null,
        isDirty: false,
      });
      setDashboardConfig({
        value: config.dashboard_config ? JSON.stringify(config.dashboard_config, null, 2) : '{}',
        error: null,
        isDirty: false,
      });
      setUiConfig({
        value: config.ui_config ? JSON.stringify(config.ui_config, null, 2) : '{}',
        error: null,
        isDirty: false,
      });
    }
  }, [config]);

  // MenuBuilder onChange callback
  const handleMenuBuilderChange = useCallback((menus: MenuItem[], isAutoMode: boolean) => {
    setMenuBuilderState((prev) => ({
      menus,
      isAutoMode,
      // Mark dirty if we have menus and it changed, or if mode changed
      isDirty: prev.isDirty || menus.length > 0 || prev.isAutoMode !== isAutoMode,
    }));
  }, []);

  // Handle JSON change with validation
  const handleJsonChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<JsonEditorState>>
  ) => {
    try {
      JSON.parse(value);
      setter({ value, error: null, isDirty: true });
    } catch {
      setter({ value, error: 'Invalid JSON syntax', isDirty: true });
    }
  };

  // Save all configurations
  const handleSaveAll = async () => {
    // Check for JSON errors
    if (dashboardConfig.error || uiConfig.error) {
      toast.error('Fix JSON errors before saving');
      return;
    }

    try {
      const data: RoleMenuConfigUpdateRequest = {};

      if (menuBuilderState.isDirty) {
        // Auto mode = null, Manual mode = JSON config
        if (menuBuilderState.isAutoMode) {
          data.menu_config = null;
        } else {
          // Build menu config from MenuBuilder state
          const menuConfigJson = menuConfigToJson(menuBuilderState.menus);
          data.menu_config = JSON.parse(menuConfigJson);
        }
      }
      if (dashboardConfig.isDirty) {
        data.dashboard_config = JSON.parse(dashboardConfig.value);
      }
      if (uiConfig.isDirty) {
        data.ui_config = JSON.parse(uiConfig.value);
      }

      // Only save if there are changes
      if (Object.keys(data).length === 0) {
        toast.info('No changes to save');
        return;
      }

      await updateMutation.mutateAsync({ roleId, data });

      // Reset dirty flags
      setMenuBuilderState((prev) => ({ ...prev, isDirty: false }));
      setDashboardConfig((prev) => ({ ...prev, isDirty: false }));
      setUiConfig((prev) => ({ ...prev, isDirty: false }));
    } catch {
      // Error handled by mutation
    }
  };

  // Save individual configuration
  const handleSaveConfig = async (type: 'menu' | 'dashboard' | 'ui') => {
    // Menu config uses MenuBuilder, others use JSON editor
    if (type === 'menu') {
      if (!menuBuilderState.isDirty) {
        toast.info('No changes to save');
        return;
      }

      try {
        const data: RoleMenuConfigUpdateRequest = {
          menu_config: menuBuilderState.isAutoMode
            ? null
            : JSON.parse(menuConfigToJson(menuBuilderState.menus)),
        };

        await updateMutation.mutateAsync({ roleId, data });
        setMenuBuilderState((prev) => ({ ...prev, isDirty: false }));
      } catch {
        // Error handled by mutation
      }
      return;
    }

    // Dashboard and UI configs use JSON editor
    const configMap = {
      dashboard: { state: dashboardConfig, key: 'dashboard_config' as const },
      ui: { state: uiConfig, key: 'ui_config' as const },
    };

    const { state, key } = configMap[type];

    if (state.error) {
      toast.error('Fix JSON errors before saving');
      return;
    }

    if (!state.isDirty) {
      toast.info('No changes to save');
      return;
    }

    try {
      const data: RoleMenuConfigUpdateRequest = {
        [key]: JSON.parse(state.value),
      };

      await updateMutation.mutateAsync({ roleId, data });

      // Reset dirty flag for this config
      if (type === 'dashboard') {
        setDashboardConfig((prev) => ({ ...prev, isDirty: false }));
      } else {
        setUiConfig((prev) => ({ ...prev, isDirty: false }));
      }
    } catch {
      // Error handled by mutation
    }
  };

  // Reset configurations
  const handleReset = () => {
    if (!config) return;

    if (resetTarget === 'all' || resetTarget === 'menu') {
      setMenuBuilderState({
        menus: [],
        isAutoMode: config.menu_config === null,
        isDirty: false,
      });
    }
    if (resetTarget === 'all' || resetTarget === 'dashboard') {
      setDashboardConfig({
        value: config.dashboard_config ? JSON.stringify(config.dashboard_config, null, 2) : '{}',
        error: null,
        isDirty: false,
      });
    }
    if (resetTarget === 'all' || resetTarget === 'ui') {
      setUiConfig({
        value: config.ui_config ? JSON.stringify(config.ui_config, null, 2) : '{}',
        error: null,
        isDirty: false,
      });
    }

    setIsResetDialogOpen(false);
    toast.success('Configuration reset');
  };

  // Check if any config has unsaved changes
  const hasUnsavedChanges = menuBuilderState.isDirty || dashboardConfig.isDirty || uiConfig.isDirty;
  const hasErrors = dashboardConfig.error || uiConfig.error;

  // Loading state
  if (roleLoading || configLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (roleError || configError || !role) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/dashboard/admin/roles/${roleId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Configuration not found</h1>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>
                {roleError instanceof Error
                  ? roleError.message
                  : configError instanceof Error
                  ? configError.message
                  : 'Unable to load configuration'}
              </span>
            </div>
            <Link href={`/${locale}/dashboard/admin/roles/${roleId}`}>
              <Button variant="outline" className="mt-4">
                Return to role
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/dashboard/admin/roles/${roleId}`}>
            <Button variant="ghost" size="icon" title="Back to role">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <Menu className="h-6 w-6" />
              {t('roleConfig.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('roleConfig.description', { roleName: role.name })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Unsaved changes indicator */}
          {hasUnsavedChanges && (
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
              <AlertCircle className="h-3 w-3" />
              Unsaved changes
            </Badge>
          )}

          {/* Reset All button */}
          <Button
            variant="outline"
            onClick={() => {
              setResetTarget('all');
              setIsResetDialogOpen(true);
            }}
            disabled={!hasUnsavedChanges}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>

          {/* Save All button */}
          <Button
            onClick={handleSaveAll}
            disabled={!hasUnsavedChanges || !!hasErrors || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save All
          </Button>
        </div>
      </div>

      {/* Role Info Summary */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium">{role.name}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-sm text-muted-foreground">Code</p>
              <code className="text-sm bg-muted px-2 py-0.5 rounded">{role.code}</code>
            </div>
            {role.entity_type && (
              <>
                <div className="h-8 w-px bg-border" />
                <div>
                  <p className="text-sm text-muted-foreground">Entity Type</p>
                  <Badge variant="secondary">{role.entity_type}</Badge>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Tabs */}
      <Tabs defaultValue="menu" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="menu" className="gap-2">
            <Menu className="h-4 w-4" />
            Menu Config
            {menuBuilderState.isDirty && <Badge variant="secondary" className="h-5 px-1.5">*</Badge>}
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard Config
            {dashboardConfig.isDirty && <Badge variant="secondary" className="h-5 px-1.5">*</Badge>}
          </TabsTrigger>
          <TabsTrigger value="ui" className="gap-2">
            <Palette className="h-4 w-4" />
            UI Config
            {uiConfig.isDirty && <Badge variant="secondary" className="h-5 px-1.5">*</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Menu Config Tab - Visual MenuBuilder */}
        <TabsContent value="menu">
          <div className="space-y-4">
            {/* Header with save button */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Menu className="h-5 w-5" />
                      {t('roleConfig.menuConfig.title')}
                    </CardTitle>
                    <CardDescription>
                      {t('roleConfig.menuConfig.description')}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveConfig('menu')}
                    disabled={!menuBuilderState.isDirty || updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Menu Config
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Visual Menu Builder */}
            <MenuBuilder
              initialConfig={config?.menu_config ?? null}
              onChange={handleMenuBuilderChange}
              isSaving={updateMutation.isPending}
              roleCode={role?.code}
              entityCode={role?.entity_type || undefined}
              disabled={false}
            />
          </div>
        </TabsContent>

        {/* Dashboard Config Tab */}
        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5" />
                    {t('roleConfig.dashboardConfig.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('roleConfig.dashboardConfig.description')}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSaveConfig('dashboard')}
                  disabled={!dashboardConfig.isDirty || !!dashboardConfig.error || updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Code className="h-4 w-4" />
                  <span>JSON Editor</span>
                  {dashboardConfig.error ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Error
                    </Badge>
                  ) : dashboardConfig.isDirty ? (
                    <Badge variant="secondary">Modified</Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
                      <CheckCircle className="h-3 w-3" />
                      Valid
                    </Badge>
                  )}
                </div>
                <Textarea
                  value={dashboardConfig.value}
                  onChange={(e) => handleJsonChange(e.target.value, setDashboardConfig)}
                  className="font-mono text-sm min-h-[300px]"
                  placeholder='{"widgets": []}'
                />
                {dashboardConfig.error && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {dashboardConfig.error}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* UI Config Tab */}
        <TabsContent value="ui">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    {t('roleConfig.uiConfig.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('roleConfig.uiConfig.description')}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSaveConfig('ui')}
                  disabled={!uiConfig.isDirty || !!uiConfig.error || updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Code className="h-4 w-4" />
                  <span>JSON Editor</span>
                  {uiConfig.error ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Error
                    </Badge>
                  ) : uiConfig.isDirty ? (
                    <Badge variant="secondary">Modified</Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
                      <CheckCircle className="h-3 w-3" />
                      Valid
                    </Badge>
                  )}
                </div>
                <Textarea
                  value={uiConfig.value}
                  onChange={(e) => handleJsonChange(e.target.value, setUiConfig)}
                  className="font-mono text-sm min-h-[300px]"
                  placeholder='{"theme": "default"}'
                />
                {uiConfig.error && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {uiConfig.error}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              This will discard all unsaved changes and restore the original configuration.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
