const tenant = (tenantId: string | null) => ["notifications", "tenant", tenantId] as const;

export const notificationKeys = {
  tenant,
  all: (tenantId: string | null) => [...tenant(tenantId)] as const,
  inbox: (tenantId: string | null, page: number, limit: number) =>
    [...tenant(tenantId), "inbox", { page, limit }] as const,
  detail: (tenantId: string | null, id: string) => [...tenant(tenantId), "detail", id] as const,
  unreadCount: (tenantId: string | null) => [...tenant(tenantId), "unread-count"] as const,
};
