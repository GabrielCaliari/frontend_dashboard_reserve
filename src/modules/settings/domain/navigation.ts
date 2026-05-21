import {
  GATEABLE_MODULES,
  type GateableModule,
  type ModuleFlags,
} from "./tenant-modules";

export interface ModuleNavItem {
  id: string;
  subItems?: ModuleNavItem[];
}

export const MODULE_NAV_IDS: Record<GateableModule, readonly string[]> = {
  leads: [
    "leads",
    "leads-menu",
    "lead-collections",
    "appointments",
    "abandoned-carts",
  ],
  cms: ["cms", "blogs", "articles", "authors", "collections", "media"],
  mailer: ["email"],
  payments: [
    "payments-menu",
    "payments-products",
    "payments-subscriptions",
    "payments-config",
  ],
  coupons: ["coupons"],
  reports: ["reports"],
  notifications: ["notifications", "notifications-global"],
  hotel: [
    "hotel-menu",
    "hotel-overview",
    "hotel-config",
    "hotel-campaigns",
    "hotel-ota",
    "hotel-reports",
    "hotel-site",
    "hotel-whatsapp-links",
  ],
  metrics: [],
};

const requiredModuleById = new Map(
  GATEABLE_MODULES.flatMap((module) =>
    MODULE_NAV_IDS[module].map((id) => [id, module] as const),
  ),
);

export function filterNavigationByModuleFlags<T extends ModuleNavItem>(
  items: readonly T[],
  flags?: ModuleFlags,
): T[] {
  return items.flatMap((item) => {
    // Group containers are gated by their surviving children, not by their own
    // id: a container's own id can map to one module (e.g. "payments-menu" ->
    // "payments") while a child maps to a different one (e.g. "coupons" ->
    // "coupons") -- gating the container up front would drop that child even
    // when its own module is enabled.
    if (item.subItems) {
      const subItems = filterNavigationByModuleFlags(item.subItems, flags);
      if (!subItems.length) return [];
      return [{ ...item, subItems } as T];
    }

    const requiredModule = requiredModuleById.get(item.id);
    if (requiredModule && flags?.[requiredModule] !== true) return [];
    return [item];
  });
}

const NAV_READ_PERMISSIONS: Record<string, readonly string[]> = {
  dashboard: ["metrics.dashboard.read"],
  leads: ["leads.read"],
  "lead-collections": ["leads.collection.read"],
  appointments: ["appointments.read"],
  "abandoned-carts": ["leads.abandoned-cart.read"],
  blogs: ["cms.blog.read"],
  articles: ["cms.article.read"],
  authors: ["cms.author.read"],
  collections: ["cms.media-collection.read"],
  media: ["cms.media-asset.read"],
  email: ["mailer.campaign.manage"],
  "payments-products": ["payments.read"],
  "payments-subscriptions": ["payments.read"],
  "payments-config": ["payments.read"],
  coupons: ["coupons.read"],
  reports: ["reports.read"],
  notifications: ["notifications.read"],
  admins: ["admins.read"],
  users: ["users.read"],
  tenants: ["tenants.read"],
  "hotel-overview": ["hotel.read"],
  "hotel-config": ["hotel.read"],
  "hotel-campaigns": ["hotel.read"],
  "hotel-ota": ["hotel.read"],
  "hotel-reports": ["hotel.read"],
  "hotel-site": ["hotel.read"],
  "hotel-whatsapp-links": ["hotel.read"],
};

export function filterNavigationByPermissions<T extends ModuleNavItem>(
  items: readonly T[],
  permissions?: ReadonlySet<string>,
): T[] {
  return items.flatMap((item) => {
    const required = NAV_READ_PERMISSIONS[item.id];
    if (
      required &&
      !permissions?.has("*") &&
      !required.some((permission) => permissions?.has(permission))
    ) {
      return [];
    }
    const subItems = item.subItems
      ? filterNavigationByPermissions(item.subItems, permissions)
      : undefined;
    if (item.subItems && !subItems?.length) return [];
    return [{ ...item, ...(subItems ? { subItems } : {}) } as T];
  });
}

export const getUsableModuleFlags = (
  flags: ModuleFlags | undefined,
  isLoading: boolean,
  isError: boolean,
) => (isLoading || isError ? undefined : flags);

export const isTenantSettingsAvailable = (
  tenantId: string | null | undefined,
) => Boolean(tenantId);
