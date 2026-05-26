'use client';
import { useState } from 'react';
import { useNotificationInbox } from '@/src/common/hooks/notifications/use-notification-inbox';
import { useTenantStore } from '@/src/common/stores/tenant-store';

export function NotificationInbox() {
  const selectedTenant = useTenantStore((s) => s.selectedTenant);
  const tenantId = selectedTenant?.id ?? null;
  const [page, setPage] = useState(1);
  const { data, total, loading, markAsViewed } = useNotificationInbox(tenantId, page, 20);

  if (loading) return <div className="p-6 text-sm text-gray-500">Carregando...</div>;

  return (
    <div className="flex flex-col gap-2 p-4">
      {data.length === 0 && <p className="text-sm text-gray-500">Nenhuma notificação.</p>}
      {data.map((item: any) => (
        <div
          key={item.id}
          onClick={() => !item.viewed && markAsViewed(item.notification_id ?? item.Notification?.id)}
          className={`cursor-pointer rounded-lg border p-4 transition-colors ${item.viewed ? 'border-gray-200 bg-white' : 'border-blue-200 bg-blue-50'}`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium">{item.Notification?.title ?? item.title}</p>
            {!item.viewed && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">{item.Notification?.body ?? item.body}</p>
          {item.first_viewed_at && (
            <p className="mt-1 text-xs text-gray-400">
              Visto em: {new Date(item.first_viewed_at).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
