"use client";

import { Card, CardBody, CardHeader, Chip, Button, Spinner } from "@heroui/react";
import { ArrowLeft, Bell, CheckCheck, ExternalLink, Zap } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { CmsPageLayout } from "../cms/shared/cms-page-layout";
import { resolveEventLabel } from "@/src/modules/notifications/domain/notification-event-labels";
import { useTenantNotification } from "@/src/shared/hooks/notifications/use-tenant-notification";
import { useNotificationSettings } from "@/src/shared/hooks/notifications/use-notification-settings";
import { useTenantStore } from "@/src/shared/stores/tenant-store";
import { formatInTenantTimezone } from "@/src/shared/utils/format-timezone";

interface Props {
  id: string;
}

const META_FIELDS: { key: string; labelKey: string }[] = [
  { key: "name", labelKey: "metaName" },
  { key: "email", labelKey: "metaEmail" },
  { key: "phone", labelKey: "metaPhone" },
  { key: "source", labelKey: "metaSource" },
  { key: "message", labelKey: "metaMessage" },
];

function extractMeta(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return [];
  const record = metadata as Record<string, unknown>;

  return META_FIELDS.map(({ key, labelKey }) => {
    const value = record[key];
    return value ? { labelKey, value: String(value) } : null;
  }).filter((entry): entry is { labelKey: string; value: string } => Boolean(entry));
}

export function NotificationView({ id }: Props) {
  const t = useTranslations("notifications");
  const selectedTenant = useTenantStore((s) => s.selectedTenant);
  const tenantId = selectedTenant?.id ?? null;

  const { notification, loading } = useTenantNotification(tenantId, id);
  const { settings } = useNotificationSettings(tenantId);
  const timezone: string = settings?.timezone ?? "America/Sao_Paulo";

  if (loading) {
    return (
      <CmsPageLayout routeActive="notifications">
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </CmsPageLayout>
    );
  }

  if (!notification) {
    return (
      <CmsPageLayout routeActive="notifications">
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-base font-semibold text-foreground">{t("viewNotFound")}</p>
          <Button as={Link} href="/dashboard/notifications" startContent={<ArrowLeft className="h-4 w-4" />} variant="flat">
            {t("back")}
          </Button>
        </div>
      </CmsPageLayout>
    );
  }

  const notif = (notification.Notification ?? notification) as Record<string, unknown>;
  const isRead = Boolean(notification.viewed);
  const firstViewedAt = notification.firstViewedAt as string | undefined;
  const publishedAt = (notif.publishedAt ?? notif.published_at) as string | undefined;
  const eventLabel = resolveEventLabel((notif.eventKey ?? notif.event_key) as string | undefined, t);
  const actionUrl = (notif.action_url ?? notif.url ?? notif.link) as string | undefined;
  const meta = extractMeta(notif.metadata);

  return (
    <CmsPageLayout routeActive="notifications">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Button
          as={Link}
          className="w-fit font-semibold"
          href="/dashboard/notifications"
          size="sm"
          startContent={<ArrowLeft className="h-4 w-4" />}
          variant="light"
        >
          {t("back")}
        </Button>

        <Card className="border border-border/70 shadow-xs">
          <CardHeader className="flex flex-col items-start gap-3 px-6 pt-6">
            <div className="flex items-center gap-3">
              <div
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                  isRead ? "bg-default-100 text-muted-foreground" : "bg-primary/15 text-primary"
                }`}
              >
                {isRead ? <CheckCheck className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="text-xl font-bold leading-tight text-foreground">{String(notif.title ?? "")}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <Chip className="text-[11px] font-semibold" color={isRead ? "default" : "primary"} size="sm" variant="flat">
                    {isRead ? t("viewStatusRead") : t("viewStatusUnread")}
                  </Chip>
                  {eventLabel && (
                    <Chip className="text-[11px] font-semibold" color="warning" size="sm" startContent={<Zap className="h-3 w-3" />} variant="flat">
                      {eventLabel}
                    </Chip>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardBody className="flex flex-col gap-6 px-6 pb-6">
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{String(notif.body ?? "")}</p>

            <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/60 bg-default-50/50 p-4 sm:grid-cols-2">
              {selectedTenant?.name && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground/70">{t("audienceLabel")}</span>
                  <span className="text-sm font-medium text-foreground">{selectedTenant.name}</span>
                </div>
              )}
              {publishedAt && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground/70">{t("viewReceivedLabel")}</span>
                  <span className="text-sm font-medium text-foreground">{formatInTenantTimezone(publishedAt, timezone)}</span>
                </div>
              )}
              {isRead && firstViewedAt && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground/70">{t("viewStatusLabel")}</span>
                  <span className="text-sm font-medium text-foreground">
                    {t("inboxViewedAt", { date: formatInTenantTimezone(firstViewedAt, timezone) })}
                  </span>
                </div>
              )}
            </div>

            {meta.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground/70">{t("viewDetailsSection")}</span>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {meta.map(({ labelKey, value }) => (
                    <div key={labelKey} className="flex flex-col gap-0.5">
                      <dt className="text-xs font-semibold text-muted-foreground">{t(labelKey)}</dt>
                      <dd className="whitespace-pre-line break-words text-sm text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {actionUrl && (
              <Button as={Link} className="w-fit font-semibold" color="primary" endContent={<ExternalLink className="h-4 w-4" />} href={actionUrl} variant="flat">
                {t("viewOpenLink")}
              </Button>
            )}
          </CardBody>
        </Card>
      </div>
    </CmsPageLayout>
  );
}
