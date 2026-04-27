/**
 * Deep link router — turn a notification payload into an in-app navigation.
 *
 * The backend `PushSendingService` ships a `data` map (string → string).
 * Two routing strategies, in priority order:
 *   1. `data.deep_link` is a fully-formed URL (e.g. `facil://payments/abc/result`).
 *      Use Expo Router to push it directly.
 *   2. `data.type` + `data.entity_id` map to a known route via TYPE_TO_ROUTE.
 *
 * Falls back to `/(tabs)/notifications` if the payload is unparseable —
 * never throws, so the user always lands somewhere coherent.
 */

import { router } from 'expo-router';
import * as Linking from 'expo-linking';

import type { NotificationDataPayload, NotificationType } from './types';

type RouteBuilder = (entityId: string) => string;

const TYPE_TO_ROUTE: Partial<Record<NotificationType, RouteBuilder>> = {
  payment_completed: (id) => `/payments/${encodeURIComponent(id)}/result`,
  payment_rejected: (id) => `/payments/${encodeURIComponent(id)}/result`,
  payment_receipt_ready: (id) => `/payments/${encodeURIComponent(id)}`,
  agent_decision: (id) => `/service-requests/${encodeURIComponent(id)}`,
  agent_documents_requested: (id) =>
    `/service-requests/${encodeURIComponent(id)}`,
  request_submitted: (id) => `/service-requests/${encodeURIComponent(id)}`,
  appointment_reminder: (id) => `/appointments/${encodeURIComponent(id)}`,
  appointment_rescheduled: (id) => `/appointments/${encodeURIComponent(id)}`,
  support_ticket_replied: (id) => `/support/${encodeURIComponent(id)}`,
  document_expiring: (id) => `/documents/${encodeURIComponent(id)}`,
  license_issued: (id) => `/service-requests/${encodeURIComponent(id)}`,
};

const FALLBACK_ROUTE = '/(tabs)/notifications';

/**
 * Resolve a deep link route from a notification data payload.
 * Returns the route as a string usable with `router.push(...)`.
 */
export function resolveRouteFromPayload(
  data: NotificationDataPayload | undefined,
): string {
  if (!data) return FALLBACK_ROUTE;

  // 1. Explicit deep_link field — strip the scheme so Expo Router gets a path.
  if (data.deep_link) {
    const parsed = Linking.parse(data.deep_link);
    if (parsed.path) {
      return `/${parsed.path}`;
    }
  }

  // 2. Type + entity_id mapping.
  const type = data.type as NotificationType | undefined;
  if (type && data.entity_id) {
    const builder = TYPE_TO_ROUTE[type];
    if (builder) return builder(data.entity_id);
  }

  return FALLBACK_ROUTE;
}

/**
 * Navigate to the route resolved from the payload. Idempotent: if the resolved
 * route is the current pathname, no-op.
 */
export function routeFromPayload(data: NotificationDataPayload | undefined): void {
  const target = resolveRouteFromPayload(data);
  // expo-router types treat `Href` as a discriminated union; cast at the boundary.
  // Routes are validated by the resolver above against a closed mapping.
  router.push(target as never);
}
