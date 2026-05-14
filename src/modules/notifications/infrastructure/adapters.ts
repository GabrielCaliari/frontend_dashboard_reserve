/**
 * Notifications — Infrastructure Adapters
 *
 * Consolidates the inline `apiClient` calls that used to live directly inside
 * `common/hooks/notifications/{use-notification-inbox,use-notifications,
 * use-notification-settings,use-unread-count}.ts` — this domain never had a
 * dedicated `common/services/notifications-service.ts` file, unlike every other
 * migrated domain. Every function below matches the original inline call
 * (same path, same headers, same params) exactly; only the location moved.
 *
 * Backend module: `reserve-notifications`.
 *
 * ---
 *
 * ## Known codegen bug: colliding Swagger tags drop the tenant-admin operations
 *
 * The backend exposes two separate Swagger tags for the notifications resource:
 * `Notifications (super_admin)` and `Notifications (tenant admin)`. The
 * nextjs-openapi-codegen slugifier strips the parenthesized suffix before
 * kebab-casing the tag name, so both tags collapse to the same slug
 * (`notifications`) and the generator overwrites the first file with the
 * second — it does not merge or error. This was already identified in Task 11
 * Step 4 and is reconfirmed here.
 *
 * Inspecting `src/infraestructure/server/services/notifications/index.ts`
 * confirms the **super_admin** controller "won" the collision: it only exposes
 * `create`, `list`, `publish`, `findById`, `update`, `delete` (all under
 * `/api/notifications`). There is no generated file at all for the
 * tenant-admin operations (`GET /notifications/tenant`,
 * `POST /notifications/tenant/:id/view`,
 * `GET /notifications/tenant/me/unread-count`) — they were silently dropped,
 * not merged elsewhere and not present under any other service directory
 * (verified: no `notifications-tenant`-shaped slug exists either). The 3
 * tenant-admin functions below (`listTenantNotifications`,
 * `markNotificationViewed`, `getUnreadCount`) therefore call `apiClient`
 * directly, each tagged with the TODO required by the task brief.
 *
 * `notification-settings` is a *separate* backend tag (`Notification
 * Settings`) and did not collide — its generated service at
 * `src/infraestructure/server/services/notification-settings/index.ts` is
 * complete and is delegated to below wherever its signature covers the
 * original behavior.
 */

import { apiClient } from "@/src/infraestructure/axios/api";
import notificationsService from "@/src/infraestructure/server/services/notifications";
import notificationSettingsService from "@/src/infraestructure/server/services/notification-settings";
import type { ListParams } from "@/src/infraestructure/server/services/notifications/types";

// ============================================================================
// Notifications (super_admin) — generated client covers this tag fully
// ============================================================================

export interface NotificationsFilter {
  type?: string;
  scope?: string;
  published?: boolean;
  page?: number;
  limit?: number;
}

/** List all notifications (super_admin). Delegates to the generated client. */
export const listNotifications = async (
  filters: NotificationsFilter = {},
): Promise<any> => {
  return notificationsService.list(filters as ListParams);
};

// ============================================================================
// Notifications (tenant admin) — dropped by the codegen tag collision (see
// module doc above). Manual apiClient calls until the backend renames one of
// the two colliding tags.
// ============================================================================

// TODO(arquitetura): backend expõe duas tags "Notifications (...)" que colidem no
// slug gerado ("notifications") — método coberto manualmente até o backend
// renomear uma das tags para não colidir.
/** List notifications for the current tenant (tenant admin inbox). */
export const listTenantNotifications = async (
  tenantId: string,
  page = 1,
  limit = 20,
): Promise<{ data: any[]; total: number }> => {
  const res = await apiClient.get(`/notifications/tenant`, {
    params: { page, limit },
    headers: { "x-tenant-id": tenantId },
  });
  return { data: res.data?.data ?? [], total: res.data?.total ?? 0 };
};

// TODO(arquitetura): backend expõe duas tags "Notifications (...)" que colidem no
// slug gerado ("notifications") — método coberto manualmente até o backend
// renomear uma das tags para não colidir.
/** Mark a tenant notification as viewed. */
export const markNotificationViewed = async (
  tenantId: string,
  notificationId: string,
): Promise<void> => {
  await apiClient.post(`/notifications/tenant/${notificationId}/view`, null, {
    headers: { "x-tenant-id": tenantId },
  });
};

// TODO(arquitetura): backend expõe duas tags "Notifications (...)" que colidem no
// slug gerado ("notifications") — método coberto manualmente até o backend
// renomear uma das tags para não colidir.
/** Get the unread notification count for a tenant. */
export const getUnreadCount = async (tenantId: string): Promise<number> => {
  const res = await apiClient.get(`/notifications/tenant/me/unread-count`, {
    headers: { "x-tenant-id": tenantId },
  });
  return res.data?.count ?? 0;
};

// ============================================================================
// Notification Settings — generated client is complete, but `getOwn`/
// `updateOwn` take no per-call config, while the original hook needs to force
// an explicit `x-tenant-id` header (rather than relying on the interceptor's
// cookie-derived tenant) whenever the caller is not a super admin. Those two
// paths stay manual `apiClient` calls to preserve that behavior exactly; the
// super-admin path has no such requirement and delegates cleanly.
// ============================================================================

/** Get notification settings — own tenant, or any tenant for super admins. */
export const getNotificationSettings = async (
  tenantId: string,
  isSuperAdmin = false,
): Promise<any> => {
  if (isSuperAdmin) {
    return notificationSettingsService.getForTenant(tenantId);
  }
  const { data } = await apiClient.get(`/notifications/settings`, {
    headers: { "x-tenant-id": tenantId },
  });
  return data;
};

/** Update notification settings — own tenant, or any tenant for super admins. */
export const updateNotificationSettings = async (
  tenantId: string,
  data: any,
  isSuperAdmin = false,
): Promise<any> => {
  if (isSuperAdmin) {
    return notificationSettingsService.updateForTenant(tenantId, data);
  }
  const { data: responseData } = await apiClient.patch(
    `/notifications/settings`,
    data,
    { headers: { "x-tenant-id": tenantId } },
  );
  return responseData;
};
