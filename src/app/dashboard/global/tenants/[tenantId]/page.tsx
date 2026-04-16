"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Bell } from "lucide-react";
import { Button, Card, CardBody, CardHeader, Spinner } from "@heroui/react";
import { isAxiosError } from "axios";
import { useTranslations } from "next-intl";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import { useStatsTenantDashboard } from "@/src/common/hooks/stats";
import { useTenantById } from "@/src/common/hooks/access-management/useTenants";
import { StatGroupCard, DateRangePicker } from "@/src/presentation/components/organisms/stats";
import { TenantNotificationSettingsForm } from "@/src/presentation/components/organisms/notifications/tenant-notification-settings-form";

function getDefaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);

  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

function buildIsoRange(from: string, to: string) {
  return {
    from: from ? `${from}T00:00:00.000Z` : undefined,
    to: to ? `${to}T23:59:59.999Z` : undefined,
  };
}

export default function TenantDashboardDrilldownPage() {
  const params = useParams<{ tenantId: string }>();
  const t = useTranslations("stats");
  const tenantId = params.tenantId;

  const defaultRange = useMemo(getDefaultRange, []);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const range = useMemo(() => buildIsoRange(from, to), [from, to]);

  const { data, isLoading, error } = useStatsTenantDashboard(tenantId, range);
  const { data: tenant } = useTenantById({ id: tenantId, enabled: !!tenantId });

  const statusCode = isAxiosError(error) ? error.response?.status : undefined;

  return (
    <LayoutScopeRoot routeActive="dashboard-global">
      <div className="mx-auto space-y-6 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button
              as={Link}
              href="/dashboard/global"
              variant="light"
              startContent={<ArrowLeft className="h-4 w-4" />}
              className="mb-3 px-0 text-muted-foreground"
            >
              {t("backToGlobal")}
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              {tenant?.name ?? tenantId}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("tenantDrilldownDescription")}
            </p>
            {data?.generatedAt ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("updatedAt", {
                  date: new Date(data.generatedAt).toLocaleString(),
                })}
              </p>
            ) : null}
          </div>

          <DateRangePicker
            from={from}
            to={to}
            onChange={(nextFrom, nextTo) => {
              setFrom(nextFrom);
              setTo(nextTo);
            }}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : null}

        {!isLoading && statusCode === 403 ? (
          <Card className="border-red-500/20 bg-red-500/5">
            <CardBody className="p-8 text-center">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-400" />
              <p className="text-sm text-red-300">{t("tenantForbidden")}</p>
            </CardBody>
          </Card>
        ) : null}

        {!isLoading && statusCode === 404 ? (
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardBody className="p-8 text-center">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-amber-300" />
              <p className="text-sm text-amber-200">{t("tenantNotFound")}</p>
            </CardBody>
          </Card>
        ) : null}

        {!isLoading && !statusCode && error ? (
          <Card className="border-red-500/20 bg-red-500/5">
            <CardBody className="p-8 text-center">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-400" />
              <p className="text-sm text-red-300">{t("errorLoading")}</p>
            </CardBody>
          </Card>
        ) : null}

        {data?.groups.length ? (
          <div className="space-y-6">
            {data.groups.map((group) => (
              <StatGroupCard key={group.moduleKey} group={group} />
            ))}
          </div>
        ) : null}

        {/* Seção: Configurações de notificações do tenant */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Configurações de notificações
            </h2>
          </div>
          <TenantNotificationSettingsForm tenantId={tenantId} isSuperAdmin />
        </div>
      </div>
    </LayoutScopeRoot>
  );
}
