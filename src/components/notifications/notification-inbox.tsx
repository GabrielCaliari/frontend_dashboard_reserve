'use client';
import { useState } from 'react';
import { Card, CardBody, Chip, Button, Pagination, Skeleton } from '@heroui/react';
import { Bell, BellOff, CheckCheck } from 'lucide-react';
import { useNotificationInbox } from '@/src/common/hooks/notifications/use-notification-inbox';
import { useNotificationSettings } from '@/src/common/hooks/notifications/use-notification-settings';
import { useTenantStore } from '@/src/common/stores/tenant-store';
import { formatInTenantTimezone } from '@/src/common/utils/format-timezone';
import { CmsPageLayout } from '../cms/shared/cms-page-layout';
import { CmsPageHeader } from '../cms/shared/cms-page-header';

export function NotificationInbox() {
  const selectedTenant = useTenantStore((s) => s.selectedTenant);
  const tenantId = selectedTenant?.id ?? null;
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, total, loading, markAsViewed } = useNotificationInbox(tenantId, page, limit);
  const { settings } = useNotificationSettings(tenantId);
  const timezone: string = settings?.timezone ?? 'America/Sao_Paulo';

  const totalPages = Math.ceil(total / limit);
  const unreadCount = data.filter((item: any) => !item.viewed).length;

  return (
    <CmsPageLayout routeActive="notifications">
      <CmsPageHeader
        title="Notificações"
        description="Acompanhe as notificações da sua conta."
        icon={<Bell className="w-6 h-6" />}
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-full h-20 rounded-xl" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <BellOff className="w-12 h-12 opacity-30" />
          <p className="text-sm">Nenhuma notificação no momento.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {unreadCount > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{unreadCount} não lida{unreadCount > 1 ? 's' : ''}</span>
            </div>
          )}

          {data.map((item: any) => {
            const isUnread = !item.viewed;
            const notif = item.Notification ?? item;
            const publishedAt = notif?.published_at;
            const firstViewedAt = item.first_viewed_at;

            return (
              <Card
                key={item.id}
                isPressable={isUnread}
                onPress={() =>
                  isUnread && markAsViewed(item.notification_id ?? notif?.id)
                }
                className={`transition-colors border ${
                  isUnread
                    ? 'border-primary/40 bg-primary/5 shadow-sm'
                    : 'border-border bg-content1'
                }`}
              >
                <CardBody className="flex flex-row items-start gap-4 p-4">
                  <div
                    className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                      isUnread ? 'bg-primary/15 text-primary' : 'bg-default-100 text-muted-foreground'
                    }`}
                  >
                    {isUnread ? <Bell className="h-4 w-4" /> : <CheckCheck className="h-4 w-4" />}
                  </div>

                  <div className="flex flex-1 flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {notif?.title}
                      </p>
                      {isUnread && (
                        <Chip size="sm" color="primary" variant="flat" className="h-4 text-[10px] px-1">
                          Nova
                        </Chip>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notif?.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70">
                      {firstViewedAt
                        ? `Visto em: ${formatInTenantTimezone(firstViewedAt, timezone)}`
                        : publishedAt
                        ? `Recebida em: ${formatInTenantTimezone(publishedAt, timezone)}`
                        : null}
                    </p>
                  </div>
                </CardBody>
              </Card>
            );
          })}

          {totalPages > 1 && (
            <div className="flex justify-center pt-2">
              <Pagination
                total={totalPages}
                page={page}
                onChange={setPage}
                color="primary"
                variant="light"
              />
            </div>
          )}
        </div>
      )}
    </CmsPageLayout>
  );
}
