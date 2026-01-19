/**
 * Menu Configuration Editor Component
 * Visual editor for menu and dashboard JSON configuration
 *
 * @module admin/components
 * @date 2026-01-19
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle,
  Eye,
  Code,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/core/utils';
import type { MenuConfig, DashboardConfig } from '@/types/auth';
import { DynamicMenu } from '@/modules/agent-dashboard/components/DynamicMenu';

// =============================================================================
// TYPES
// =============================================================================

interface MenuConfigEditorProps {
  /** Initial menu configuration */
  initialMenuConfig?: MenuConfig | null;
  /** Initial dashboard configuration */
  initialDashboardConfig?: DashboardConfig | null;
  /** Called when configuration changes */
  onChange?: (config: {
    menuConfig: MenuConfig | null;
    dashboardConfig: DashboardConfig | null;
  }) => void;
  /** Read-only mode */
  readOnly?: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// =============================================================================
// VALIDATION
// =============================================================================

function validateMenuConfig(json: string): ValidationResult {
  const errors: string[] = [];

  try {
    const config = JSON.parse(json);

    if (!config.version) {
      errors.push('Missing required field: version');
    }

    if (!config.source) {
      errors.push('Missing required field: source');
    } else if (!['workflow', 'role', 'custom'].includes(config.source)) {
      errors.push('Invalid source: must be "workflow", "role", or "custom"');
    }

    if (!config.menus) {
      errors.push('Missing required field: menus');
    } else if (!Array.isArray(config.menus)) {
      errors.push('Field "menus" must be an array');
    } else {
      config.menus.forEach((menu: Record<string, unknown>, index: number) => {
        if (!menu.id) errors.push(`Menu ${index}: missing "id"`);
        if (!menu.titleKey) errors.push(`Menu ${index}: missing "titleKey"`);
        if (!menu.icon) errors.push(`Menu ${index}: missing "icon"`);
        if (!menu.href && !menu.items) {
          errors.push(`Menu ${index}: must have either "href" or "items"`);
        }
      });
    }
  } catch (e) {
    errors.push(`Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`);
  }

  return { valid: errors.length === 0, errors };
}

function validateDashboardConfig(json: string): ValidationResult {
  const errors: string[] = [];

  try {
    const config = JSON.parse(json);

    if (!config.version) {
      errors.push('Missing required field: version');
    }

    if (!config.layout) {
      errors.push('Missing required field: layout');
    } else if (!['grid', 'list', 'custom'].includes(config.layout)) {
      errors.push('Invalid layout: must be "grid", "list", or "custom"');
    }

    if (!config.widgets) {
      errors.push('Missing required field: widgets');
    } else if (!Array.isArray(config.widgets)) {
      errors.push('Field "widgets" must be an array');
    } else {
      config.widgets.forEach((widget: Record<string, unknown>, index: number) => {
        if (!widget.id) errors.push(`Widget ${index}: missing "id"`);
        if (typeof widget.visible !== 'boolean') {
          errors.push(`Widget ${index}: "visible" must be a boolean`);
        }
        if (typeof widget.position !== 'number') {
          errors.push(`Widget ${index}: "position" must be a number`);
        }
      });
    }
  } catch (e) {
    errors.push(`Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`);
  }

  return { valid: errors.length === 0, errors };
}

// =============================================================================
// COMPONENT
// =============================================================================

export function MenuConfigEditor({
  initialMenuConfig,
  initialDashboardConfig,
  onChange,
  readOnly = false,
}: MenuConfigEditorProps) {
  const t = useTranslations('menuConfig');

  // JSON text state
  const [menuJson, setMenuJson] = useState<string>(
    initialMenuConfig ? JSON.stringify(initialMenuConfig, null, 2) : ''
  );
  const [dashboardJson, setDashboardJson] = useState<string>(
    initialDashboardConfig ? JSON.stringify(initialDashboardConfig, null, 2) : ''
  );

  // Validation state
  const menuValidation = useMemo(() => validateMenuConfig(menuJson), [menuJson]);
  const dashboardValidation = useMemo(
    () => validateDashboardConfig(dashboardJson),
    [dashboardJson]
  );

  // Parsed configs for preview
  const parsedMenuConfig = useMemo<MenuConfig | null>(() => {
    if (!menuValidation.valid) return null;
    try {
      return JSON.parse(menuJson);
    } catch {
      return null;
    }
  }, [menuJson, menuValidation.valid]);

  // Handle menu JSON change
  const handleMenuJsonChange = useCallback(
    (value: string) => {
      setMenuJson(value);
      const validation = validateMenuConfig(value);
      if (validation.valid && onChange) {
        try {
          onChange({
            menuConfig: JSON.parse(value),
            dashboardConfig: dashboardValidation.valid
              ? JSON.parse(dashboardJson)
              : null,
          });
        } catch {
          // Ignore parse errors, validation already handles this
        }
      }
    },
    [dashboardJson, dashboardValidation.valid, onChange]
  );

  // Handle dashboard JSON change
  const handleDashboardJsonChange = useCallback(
    (value: string) => {
      setDashboardJson(value);
      const validation = validateDashboardConfig(value);
      if (validation.valid && onChange) {
        try {
          onChange({
            menuConfig: menuValidation.valid ? JSON.parse(menuJson) : null,
            dashboardConfig: JSON.parse(value),
          });
        } catch {
          // Ignore parse errors
        }
      }
    },
    [menuJson, menuValidation.valid, onChange]
  );

  // Format JSON
  const formatJson = useCallback((type: 'menu' | 'dashboard') => {
    try {
      if (type === 'menu') {
        const parsed = JSON.parse(menuJson);
        setMenuJson(JSON.stringify(parsed, null, 2));
        toast.success(t('editor.formatted'));
      } else {
        const parsed = JSON.parse(dashboardJson);
        setDashboardJson(JSON.stringify(parsed, null, 2));
        toast.success(t('editor.formatted'));
      }
    } catch (e) {
      toast.error(t('editor.formatError'));
    }
  }, [menuJson, dashboardJson, t]);

  // Copy to clipboard
  const copyToClipboard = useCallback(
    (type: 'menu' | 'dashboard') => {
      const text = type === 'menu' ? menuJson : dashboardJson;
      navigator.clipboard.writeText(text);
      toast.success(t('editor.copied'));
    },
    [menuJson, dashboardJson, t]
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="menu" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="menu" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            {t('editor.menuConfig')}
            {menuValidation.valid ? (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Valid
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                {menuValidation.errors.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            {t('editor.dashboardConfig')}
            {dashboardValidation.valid ? (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Valid
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                {dashboardValidation.errors.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Menu Config Tab */}
        <TabsContent value="menu" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Editor */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {t('editor.jsonEditor')}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => formatJson('menu')}
                      disabled={readOnly}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard('menu')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={menuJson}
                  onChange={(e) => handleMenuJsonChange(e.target.value)}
                  className={cn(
                    'font-mono text-sm min-h-[400px] resize-y',
                    !menuValidation.valid && 'border-red-300'
                  )}
                  placeholder={t('editor.menuPlaceholder')}
                  readOnly={readOnly}
                />
                {!menuValidation.valid && (
                  <Alert variant="destructive" className="mt-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside text-sm">
                        {menuValidation.errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <CardTitle className="text-sm font-medium">
                    {t('editor.preview')}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-muted/30 min-h-[400px]">
                  {parsedMenuConfig ? (
                    <DynamicMenu
                      items={parsedMenuConfig.menus}
                      collapsed={false}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      {t('editor.invalidConfig')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Dashboard Config Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {t('editor.jsonEditor')}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => formatJson('dashboard')}
                    disabled={readOnly}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('dashboard')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={dashboardJson}
                onChange={(e) => handleDashboardJsonChange(e.target.value)}
                className={cn(
                  'font-mono text-sm min-h-[300px] resize-y',
                  !dashboardValidation.valid && 'border-red-300'
                )}
                placeholder={t('editor.dashboardPlaceholder')}
                readOnly={readOnly}
              />
              {!dashboardValidation.valid && (
                <Alert variant="destructive" className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside text-sm">
                      {dashboardValidation.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MenuConfigEditor;
