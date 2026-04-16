"use client";
import { useUnreadCount } from "@/src/common/hooks/notifications/use-unread-count";
import { useTenantStore } from "@/src/shared/stores/tenant-store";

export function NotificationBadge() {
  const selectedTenant = useTenantStore((s) => s.selectedTenant);
  const count = useUnreadCount(selectedTenant?.id ?? null);
  if (!count) return null;
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
