/**
 * Menu Builder Types
 * Local types for the visual menu configuration builder
 *
 * @module admin/components/menu-builder
 * @date 2026-01-31
 */

// =============================================================================
// MENU ITEM TYPES (aligned with backend)
// =============================================================================

export interface MenuSubItem {
  id: string;
  titleKey: string;
  href: string;
  icon: string;
  permission?: string;
}

export interface MenuItem {
  id: string;
  titleKey: string;
  icon: string;
  href?: string;
  permission?: string;
  items?: MenuSubItem[];
}

export interface MenuConfig {
  version: string;
  source: 'role' | 'workflow' | 'custom';
  menus: MenuItem[];
}

// =============================================================================
// EDITOR STATE TYPES
// =============================================================================

export interface MenuBuilderState {
  menus: MenuItem[];
  selectedItemId: string | null;
  isDirty: boolean;
  isAutoMode: boolean; // true = menu_config NULL (auto-generation)
}

export interface MenuItemFormData {
  id: string;
  titleKey: string;
  icon: string;
  href: string;
  permission: string;
  isGroup: boolean;
}

// =============================================================================
// VALIDATION
// =============================================================================

export interface ValidationError {
  field: string;
  message: string; // Translation key (e.g., 'validation.idRequired')
  params?: Record<string, string>; // Interpolation params for translation
}

// Validation message keys (for i18n)
export const ValidationKeys = {
  idRequired: 'validation.idRequired',
  titleKeyRequired: 'validation.titleKeyRequired',
  iconRequired: 'validation.iconRequired',
  groupNoHref: 'validation.groupNoHref',
  linkRequiresHref: 'validation.linkRequiresHref',
  duplicateId: 'validation.duplicateId',
  subItemHrefRequired: 'validation.subItemHrefRequired',
} as const;

export function validateMenuItem(item: MenuItem): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!item.id.trim()) {
    errors.push({ field: 'id', message: ValidationKeys.idRequired });
  }

  if (!item.titleKey.trim()) {
    errors.push({ field: 'titleKey', message: ValidationKeys.titleKeyRequired });
  }

  if (!item.icon.trim()) {
    errors.push({ field: 'icon', message: ValidationKeys.iconRequired });
  }

  // Group items must not have href
  if (item.items && item.items.length > 0 && item.href) {
    errors.push({ field: 'href', message: ValidationKeys.groupNoHref });
  }

  // Link items must have href
  if (!item.items && !item.href) {
    errors.push({ field: 'href', message: ValidationKeys.linkRequiresHref });
  }

  return errors;
}

export function validateMenuConfig(menus: MenuItem[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const ids = new Set<string>();

  menus.forEach((menu, index) => {
    // Check for duplicate IDs
    if (ids.has(menu.id)) {
      errors.push({
        field: `menus[${index}].id`,
        message: ValidationKeys.duplicateId,
        // Store the duplicate ID for interpolation
        params: { id: menu.id },
      } as ValidationError);
    }
    ids.add(menu.id);

    // Validate each menu item
    const itemErrors = validateMenuItem(menu);
    itemErrors.forEach((err) => {
      errors.push({
        field: `menus[${index}].${err.field}`,
        message: err.message,
      });
    });

    // Validate sub-items
    menu.items?.forEach((subItem, subIndex) => {
      if (ids.has(subItem.id)) {
        errors.push({
          field: `menus[${index}].items[${subIndex}].id`,
          message: ValidationKeys.duplicateId,
          params: { id: subItem.id },
        } as ValidationError);
      }
      ids.add(subItem.id);

      if (!subItem.href.trim()) {
        errors.push({
          field: `menus[${index}].items[${subIndex}].href`,
          message: ValidationKeys.subItemHrefRequired,
        });
      }
    });
  });

  return errors;
}

// =============================================================================
// HELPERS
// =============================================================================

export function createEmptyMenuItem(isGroup: boolean = false): MenuItem {
  const id = `menu_${Date.now()}`;
  return {
    id,
    titleKey: '',
    icon: 'FileText',
    href: isGroup ? undefined : '',
    items: isGroup ? [] : undefined,
  };
}

export function createEmptySubItem(): MenuSubItem {
  return {
    id: `sub_${Date.now()}`,
    titleKey: '',
    href: '',
    icon: 'FileText',
  };
}

export function menuConfigToJson(menus: MenuItem[]): string {
  const config: MenuConfig = {
    version: '1.0',
    source: 'role',
    menus,
  };
  return JSON.stringify(config, null, 2);
}

export function parseMenuConfig(json: string | object | null): MenuItem[] {
  if (!json) return [];

  try {
    const config = typeof json === 'string' ? JSON.parse(json) : json;
    return config.menus || [];
  } catch {
    return [];
  }
}
