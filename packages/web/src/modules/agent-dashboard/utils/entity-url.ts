/**
 * Entity URL utilities
 *
 * Deterministic bidirectional conversion between URL slugs and entity codes.
 * Convention: DB = UPPER_SNAKE_CASE, URL = lower-kebab-case.
 *
 * Examples:
 *   slugToEntityCode('cnedoge-pasaporte') → 'CNEDOGE_PASAPORTE'
 *   entityCodeToSlug('CNEDOGE_PASAPORTE') → 'cnedoge-pasaporte'
 *
 * @module agent-dashboard/utils
 */

import type { EntityCode } from '../types';

/** Convert URL slug to database entity code */
export function slugToEntityCode(slug: string): EntityCode {
  return slug.toUpperCase().replace(/-/g, '_') as EntityCode;
}

/** Convert database entity code to URL slug */
export function entityCodeToSlug(code: string): string {
  return code.toLowerCase().replace(/_/g, '-');
}
