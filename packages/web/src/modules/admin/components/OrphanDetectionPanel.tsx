'use client';

/**
 * OrphanDetectionPanel
 * Detects inconsistencies between entities.workflow_codes,
 * workflow_menu_mapping patterns, and workflow_display_config codes.
 *
 * @module admin/components
 * @date 2026-02-17
 */

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { AlertTriangle, CheckCircle2, ChevronDown, Plus } from 'lucide-react';
import { useEntitiesWithDetails } from '@/modules/cities/hooks';
import type { WorkflowMenuMapping } from '@/modules/agent-dashboard/types/menu-config';
import type { DisplayConfig } from '@/modules/admin/services/menuConfigService';

// =============================================================================
// TYPES
// =============================================================================

interface OrphanDetectionPanelProps {
  mappings: WorkflowMenuMapping[];
  displayConfigs: DisplayConfig[];
}

interface OrphanItem {
  workflowCode: string;
  entityName?: string;
  entityCode?: string;
}

// =============================================================================
// SQL LIKE → REGEX (same as EntitiesTabContent.tsx)
// =============================================================================

function sqlLikeToRegex(pattern: string): RegExp {
  let regexStr = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  regexStr = regexStr.replace(/%/g, '.*');
  regexStr = regexStr.replace(/_/g, '.');
  return new RegExp(`^${regexStr}$`, 'i');
}

// =============================================================================
// COMPONENT
// =============================================================================

export function OrphanDetectionPanel({
  mappings,
  displayConfigs,
}: OrphanDetectionPanelProps) {
  const t = useTranslations('admin.menuConfig.orphanDetection');
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const { data: entitiesData } = useEntitiesWithDetails({ is_active: true });

  // Compute orphans
  const analysis = useMemo(() => {
    const entities = entitiesData?.items ?? entitiesData ?? [];
    if (!Array.isArray(entities) || entities.length === 0) {
      return { workflowsNoMapping: [], workflowsNoDisplay: [], mappingsNoWorkflow: [] };
    }

    // Collect all unique workflow codes from all entities
    const allWorkflowCodes: Record<string, { entityName: string; entityCode: string }> = {};
    for (const entity of entities) {
      const codes = ('resolved_workflow_codes' in entity ? entity.resolved_workflow_codes : []) || [];
      for (const wc of codes) {
        if (!allWorkflowCodes[wc]) {
          allWorkflowCodes[wc] = { entityName: entity.name, entityCode: entity.code };
        }
      }
    }

    const allCodes = Object.keys(allWorkflowCodes);

    // Active mapping patterns
    const activeMappings = mappings.filter(m => m.is_active);

    // 1. Workflows without any matching mapping
    const workflowsNoMapping: OrphanItem[] = [];
    for (const wc of allCodes) {
      const hasMatch = activeMappings.some(m => sqlLikeToRegex(m.workflow_pattern).test(wc));
      if (!hasMatch) {
        workflowsNoMapping.push({ workflowCode: wc, ...allWorkflowCodes[wc] });
      }
    }

    // 2. Workflows without display config
    const displayCodes = new Set(displayConfigs.filter(d => d.is_active).map(d => d.workflow_code));
    const workflowsNoDisplay: OrphanItem[] = [];
    for (const wc of allCodes) {
      if (!displayCodes.has(wc)) {
        workflowsNoDisplay.push({ workflowCode: wc, ...allWorkflowCodes[wc] });
      }
    }

    // 3. Mappings that don't match any workflow
    const mappingsNoWorkflow: { pattern: string; mappingId: number }[] = [];
    for (const mapping of activeMappings) {
      const regex = sqlLikeToRegex(mapping.workflow_pattern);
      const hasMatch = allCodes.some(wc => regex.test(wc));
      if (!hasMatch) {
        mappingsNoWorkflow.push({ pattern: mapping.workflow_pattern, mappingId: mapping.id });
      }
    }

    return { workflowsNoMapping, workflowsNoDisplay, mappingsNoWorkflow };
  }, [entitiesData, mappings, displayConfigs]);

  const totalIssues =
    analysis.workflowsNoMapping.length +
    analysis.workflowsNoDisplay.length +
    analysis.mappingsNoWorkflow.length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                {totalIssues > 0 ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {t('title', { defaultValue: 'Détection d\'incohérences' })}
                <Badge variant={totalIssues > 0 ? 'destructive' : 'secondary'} className="text-xs">
                  {totalIssues}
                </Badge>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {totalIssues === 0 ? (
              <p className="text-sm text-green-600">
                {t('noIssues', { defaultValue: 'Aucune incohérence détectée. Tous les workflows ont un mapping et une display config.' })}
              </p>
            ) : (
              <>
                {/* Workflows without mapping */}
                {analysis.workflowsNoMapping.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      {t('workflowsWithoutMapping', { defaultValue: 'Workflows sans mapping' })}
                      <Badge variant="outline" className="text-xs">
                        {analysis.workflowsNoMapping.length}
                      </Badge>
                    </h4>
                    <div className="space-y-1">
                      {analysis.workflowsNoMapping.map((item) => (
                        <div
                          key={item.workflowCode}
                          className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/30 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {item.workflowCode}
                            </code>
                            {item.entityName && (
                              <span className="text-xs text-muted-foreground">
                                ({item.entityName})
                              </span>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                            <Link href={`/${locale}/dashboard/admin/workflow-mappings/new`}>
                              <Plus className="h-3 w-3 mr-1" />
                              {t('createMapping', { defaultValue: 'Créer mapping' })}
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Workflows without display config */}
                {analysis.workflowsNoDisplay.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      {t('workflowsWithoutDisplayConfig', { defaultValue: 'Workflows sans display config' })}
                      <Badge variant="outline" className="text-xs">
                        {analysis.workflowsNoDisplay.length}
                      </Badge>
                    </h4>
                    <div className="space-y-1">
                      {analysis.workflowsNoDisplay.map((item) => (
                        <div
                          key={item.workflowCode}
                          className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/30 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {item.workflowCode}
                            </code>
                            {item.entityName && (
                              <span className="text-xs text-muted-foreground">
                                ({item.entityName})
                              </span>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                            <Link href={`/${locale}/dashboard/admin/menu-config/display/new`}>
                              <Plus className="h-3 w-3 mr-1" />
                              {t('createDisplayConfig', { defaultValue: 'Créer display config' })}
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mappings without matching workflows */}
                {analysis.mappingsNoWorkflow.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      {t('mappingsWithoutWorkflows', { defaultValue: 'Mappings sans workflows' })}
                      <Badge variant="outline" className="text-xs">
                        {analysis.mappingsNoWorkflow.length}
                      </Badge>
                    </h4>
                    <div className="space-y-1">
                      {analysis.mappingsNoWorkflow.map((item) => (
                        <div
                          key={item.pattern}
                          className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/30 text-sm"
                        >
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {item.pattern}
                          </code>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                            <Link href={`/${locale}/dashboard/admin/workflow-mappings/${item.mappingId}`}>
                              {t('edit', { defaultValue: 'Éditer' })}
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default OrphanDetectionPanel;
