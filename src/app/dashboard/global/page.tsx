"use client";

import { useMemo, useState } from "react";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { Card, CardBody, Spinner } from "@heroui/react";
import { useTranslations } from "next-intl";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { useStatsGlobalDashboard } from "@/src/common/hooks/stats";
import usePermissions from "@/src/common/hooks/use-permissions";
import { StatGroupCard, DateRangePicker } from "@/src/components/stats";
import { formatDate } from "@/src/common/lib/utils";

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

export default function GlobalDashboardPage() {
  const t = useTranslations("stats");
  const { isSuperAdmin } = usePermissions();

  const defaultRange = useMemo(getDefaultRange, []);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const range = useMemo(() => buildIsoRange(from, to), [from, to]);

  const { data, isLoading, isError } = useStatsGlobalDashboard(range);

  if (!isSuperAdmin) {
    return (
      <LayoutScopeRoot routeActive="dashboard-global">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <Card className="border-red-500/20 bg-red-500/5">
            <CardBody className="p-8 text-center">
              <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-red-300" />
              <h1 className="text-xl font-semibold text-foreground">
                {t("globalForbiddenTitle")}
              </h1>
              <p className="mt-2 text-sm text-foreground">
                {t("globalForbiddenDescription")}
              </p>
            </CardBody>
          </Card>
        </div>
      </LayoutScopeRoot>
    );
  }

  return (
    <LayoutScopeRoot routeActive="dashboard-global">
      <div className="mx-auto space-y-6 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("globalTitle")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("globalDescription")}
            </p>
            {data?.generatedAt ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("updatedAt", { date: formatDate(data.generatedAt) })}
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

        {!isLoading && isError ? (
          <Card className="border-red-500/20 bg-red-500/5">
            <CardBody className="p-8 text-center">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-400" />
              <p className="text-sm text-red-300">{t("errorLoading")}</p>
            </CardBody>
          </Card>
        ) : null}

        {!isLoading && data?.groups.length === 0 ? (
          <Card className="border-border bg-card">
            <CardBody className="p-8 text-center text-sm text-muted-foreground">
              {t("globalEmptyState")}
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
      </div>
    </LayoutScopeRoot>
  );
}
