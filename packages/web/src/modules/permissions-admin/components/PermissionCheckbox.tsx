/**
 * PermissionCheckbox Component
 * Checkbox for granting/revoking permissions with rich display
 *
 * @module permissions-admin/components
 * @author Claude Code
 * @date 2025-11-17
 */

"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info } from "lucide-react";
import type { Permission } from "../types";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface PermissionCheckboxProps {
  /**
   * Permission to display
   */
  permission: Permission;
  /**
   * Whether permission is checked
   */
  checked: boolean;
  /**
   * Callback when checked state changes
   */
  onCheckedChange: (checked: boolean) => void;
  /**
   * Display mode
   * - "compact": Single line with name only
   * - "normal": Name + description
   * - "detailed": Name + description + module badge
   */
  mode?: "compact" | "normal" | "detailed";
  /**
   * Show critical warning dialog before allowing critical permissions
   */
  confirmCritical?: boolean;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Checkbox component for selecting permissions
 *
 * - Shows permission name and description
 * - Visual indicator for critical permissions
 * - Optional confirmation for critical permissions
 * - Multiple display modes
 *
 * @example
 * ```tsx
 * <PermissionCheckbox
 *   permission={permission}
 *   checked={selectedPermissions.has(permission.id)}
 *   onCheckedChange={(checked) => togglePermission(permission.id, checked)}
 *   mode="detailed"
 *   confirmCritical
 * />
 * ```
 */
export function PermissionCheckbox({
  permission,
  checked,
  onCheckedChange,
  mode = "normal",
  confirmCritical = true,
  disabled = false,
  className,
}: PermissionCheckboxProps) {
  const handleCheckedChange = (newChecked: boolean) => {
    // If checking a critical permission and confirmCritical is enabled
    if (newChecked && permission.is_critical && confirmCritical) {
      const confirmed = window.confirm(
        `⚠️ Permission Critique\n\n` +
        `"${permission.description}"\n\n` +
        `Cette permission est marquée comme critique et peut avoir des impacts importants. ` +
        `Êtes-vous sûr de vouloir l'accorder ?`
      );

      if (!confirmed) return;
    }

    onCheckedChange(newChecked);
  };

  // Compact mode: single line
  if (mode === "compact") {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Checkbox
          id={`permission-${permission.id}`}
          checked={checked}
          onCheckedChange={handleCheckedChange}
          disabled={disabled}
        />
        <Label
          htmlFor={`permission-${permission.id}`}
          className={cn(
            "flex items-center gap-2 text-sm font-medium leading-none cursor-pointer",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {permission.is_critical && (
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
          )}
          <span className="font-mono">{permission.name}</span>
        </Label>
      </div>
    );
  }

  // Normal mode: name + description
  if (mode === "normal") {
    return (
      <div className={cn("flex items-start space-x-3 py-2", className)}>
        <Checkbox
          id={`permission-${permission.id}`}
          checked={checked}
          onCheckedChange={handleCheckedChange}
          disabled={disabled}
          className="mt-1"
        />
        <div className="flex-1 space-y-1">
          <Label
            htmlFor={`permission-${permission.id}`}
            className={cn(
              "flex items-center gap-2 text-sm font-medium cursor-pointer",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {permission.is_critical && (
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            )}
            <span className="font-mono">{permission.name}</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            {permission.description}
          </p>
        </div>
      </div>
    );
  }

  // Detailed mode: name + description + module badge
  return (
    <div
      className={cn(
        "flex items-start space-x-3 rounded-lg border p-3",
        permission.is_critical && "border-red-200 bg-red-50/30",
        className
      )}
    >
      <Checkbox
        id={`permission-${permission.id}`}
        checked={checked}
        onCheckedChange={handleCheckedChange}
        disabled={disabled}
        className="mt-1"
      />
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Label
            htmlFor={`permission-${permission.id}`}
            className={cn(
              "flex items-center gap-2 text-sm font-medium cursor-pointer",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {permission.is_critical && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            <span className="font-mono">{permission.name}</span>
          </Label>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {permission.module_name}
            </Badge>
            {permission.is_critical && (
              <Badge variant="destructive" className="text-xs">
                Critique
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {permission.description}
        </p>
        {permission.is_critical && (
          <div className="flex items-start gap-2 text-xs text-amber-700">
            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>
              Cette permission nécessite une confirmation avant d'être accordée
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// GROUP COMPONENT
// =============================================================================

interface PermissionCheckboxGroupProps {
  /**
   * Permissions to display
   */
  permissions: Permission[];
  /**
   * Set of selected permission IDs
   */
  selectedPermissions: Set<string>;
  /**
   * Callback when selection changes
   */
  onSelectionChange: (permissionId: string, checked: boolean) => void;
  /**
   * Display mode
   */
  mode?: "compact" | "normal" | "detailed";
  /**
   * Group by resource
   */
  groupByResource?: boolean;
  /**
   * Confirm critical permissions
   */
  confirmCritical?: boolean;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Group of permission checkboxes with optional resource grouping
 *
 * @example
 * ```tsx
 * <PermissionCheckboxGroup
 *   permissions={permissions}
 *   selectedPermissions={selected}
 *   onSelectionChange={handleToggle}
 *   groupByResource
 * />
 * ```
 */
export function PermissionCheckboxGroup({
  permissions,
  selectedPermissions,
  onSelectionChange,
  mode = "normal",
  groupByResource = false,
  confirmCritical = true,
  disabled = false,
  className,
}: PermissionCheckboxGroupProps) {
  // Group permissions by resource if requested
  const groupedPermissions = React.useMemo(() => {
    if (!groupByResource) {
      return { all: permissions };
    }

    const groups: Record<string, Permission[]> = {};
    permissions.forEach((perm) => {
      if (!groups[perm.resource]) {
        groups[perm.resource] = [];
      }
      groups[perm.resource].push(perm);
    });

    return groups;
  }, [permissions, groupByResource]);

  return (
    <div className={cn("space-y-4", className)}>
      {Object.entries(groupedPermissions).map(([resource, perms]) => (
        <div key={resource} className="space-y-2">
          {groupByResource && (
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {resource}
            </h4>
          )}
          <div className="space-y-2">
            {perms.map((perm) => (
              <PermissionCheckbox
                key={perm.id}
                permission={perm}
                checked={selectedPermissions.has(perm.id)}
                onCheckedChange={(checked) => onSelectionChange(perm.id, checked)}
                mode={mode}
                confirmCritical={confirmCritical}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default PermissionCheckbox;
