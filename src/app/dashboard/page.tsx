"use client";

import { useMemo, useState } from "react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { AlertCircle, BarChart3, Plug } from "lucide-react";
import { Card, CardBody, Spinner, Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useHasSelectedTenant } from "@/src/common/stores/tenant-store";
import {
  useStatsDashboard,
  useStatsTimeseriesModules,
} from "@/src/common/hooks/stats";
import {
  StatGroupCard,
  DateRangePicker,
  StatsTimeseriesCard,
  CmsOverviewCards,
} from "@/src/components/stats";

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

export default function DashboardPage() {
  const t = useTranslations("stats");
  const hasSelectedTenant = useHasSelectedTenant();

  const defaultRange = useMemo(getDefaultRange, []);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const range = useMemo(() => buildIsoRange(from, to), [from, to]);

  const { data, isLoading, isError } = useStatsDashboard(range);
  const modules = useMemo(
    () => data?.groups.map((group) => group.moduleKey) ?? [],
    [data?.groups],
  );
  const timeseriesModules = useStatsTimeseriesModules(modules, {
    ...range,
    granularity: "day",
  });
  const visibleTimeseriesModules = useMemo(
    () =>
      timeseriesModules.filter(
        (module) => module.isLoading || module.seriesItem || (!module.isError && module.data?.series.length),
      ),
    [timeseriesModules],
  );
  const groupByModuleKey = useMemo(
    () => new Map((data?.groups ?? []).map((group) => [group.moduleKey, group])),
    [data?.groups],
  );

  if (!hasSelectedTenant) {
    return (
      <LayoutScopeRoot routeActive="dashboard">
        <div className="mx-auto flex flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <Card className="max-w-md border-warning/20 bg-warning/5">
            <CardBody className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-warning" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {t("noTenant")}
              </h3>
              <p className="text-muted-foreground">{t("selectTenant")}</p>
            </CardBody>
          </Card>
        </div>
      </LayoutScopeRoot>
    );
  }

  return (
    <LayoutScopeRoot routeActive="dashboard">
      <div className="mx-auto space-y-8 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-100">{t("title")}</h1>
            {data?.generatedAt && (
              <p className="text-xs text-gray-500 mt-1">
                {t("updatedAt", {
                  date: new Date(data.generatedAt).toLocaleString(),
                })}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker
              from={from}
              to={to}
              onChange={(f, tVal) => { setFrom(f); setTo(tVal); }}
            />
            <Button
              as={Link}
              href="/dashboard/stats/integrations"
              variant="bordered"
              size="sm"
              startContent={<Plug className="h-4 w-4" />}
              className="border-gray-700 text-gray-300 whitespace-nowrap"
            >
              {t("integrationsLabel")}
            </Button>
          </div>
        </div>

        {/* CMS Overview — always visible */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            CMS Overview
          </h2>
          <CmsOverviewCards />
        </section>

        {/* Stats Integrations */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Analytics
          </h2>

          {isLoading && (
            <div className="flex justify-center py-10">
              <Spinner size="lg" />
            </div>
          )}

          {isError && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardBody className="p-6 text-center">
                <AlertCircle className="w-7 h-7 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-400">{t("errorLoading")}</p>
              </CardBody>
            </Card>
          )}

          {!isLoading && !isError && data && data.groups.length === 0 && (
            <Card className="border-gray-800 bg-[#111125]">
              <CardBody className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-10 w-10 text-gray-600 mb-3" />
                <p className="text-gray-400 mb-1">{t("emptyState")}</p>
                <p className="text-sm text-gray-600 mb-4">
                  Connect an analytics provider to see metrics here.
                </p>
                <Button
                  as={Link}
                  href="/dashboard/stats/integrations"
                  color="primary"
                  variant="flat"
                  size="sm"
                  startContent={<Plug className="h-4 w-4" />}
                >
                  {t("addIntegration")}
                </Button>
              </CardBody>
            </Card>
          )}

          {data && data.groups.length > 0 && (
            <div className="space-y-6">
              {visibleTimeseriesModules.length > 0 && (
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {visibleTimeseriesModules.map((module) => {
                    const group = groupByModuleKey.get(module.moduleKey);
                    return (
                      <StatsTimeseriesCard
                        key={module.moduleKey}
                        title={group?.label ?? module.seriesItem?.label ?? module.moduleKey}
                        description={group?.description}
                        seriesItem={module.seriesItem}
                        isLoading={module.isLoading}
                        error={module.isError ? t("timeseriesError") : undefined}
                      />
                    );
                  })}
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                {data.groups.map((group) => (
                  <StatGroupCard key={group.moduleKey} group={group} />
                ))}
              </div>
            </div>
          )}
        </section>

      </div>
    </LayoutScopeRoot>
  );
}
