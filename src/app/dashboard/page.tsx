"use client";

import { useMemo, useState } from"react";
import { LayoutScopeRoot } from"@/src/layout/root-layout";
import { AlertCircle, BarChart3, Plug } from"lucide-react";
import { Card, CardBody, Spinner, Button } from"@heroui/react";
import { useTranslations } from"next-intl";
import Link from"next/link";
import { useHasSelectedTenant } from"@/src/common/stores/tenant-store";
import {
 useStatsDashboard,
 useStatsTimeseriesModules,
} from"@/src/common/hooks/stats";
import {
 StatGroupCard,
 DateRangePicker,
 StatsTimeseriesCard,
 CmsOverviewCards,
} from"@/src/components/stats";

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
 from: from ?`${from}T00:00:00.000Z` : undefined,
 to: to ?`${to}T23:59:59.999Z` : undefined,
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
        <div className="mx-auto flex flex-col items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
          <Card className="max-w-md border-warning/20 bg-warning/5 animate-fade-in">
            <CardBody className="p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-warning" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
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
      <div className="mx-auto space-y-8 px-4 py-8 sm:px-8 lg:px-10 max-w-[1600px] animate-fade-in">
        {/* Premium Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-default-50 border border-border p-8 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                {t("title")}
              </h1>
              <p className="text-muted-foreground mt-3 text-base">
                {data?.generatedAt ? (
                  t("updatedAt", {
                    date: new Date(data.generatedAt).toLocaleString(),
                  })
                ) : (
                  "Visão geral das métricas e dados de performance do sistema."
                )}
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-background rounded-xl p-1 border border-border flex items-center">
                <DateRangePicker
                  from={from}
                  to={to}
                  onChange={(f, tVal) => { setFrom(f); setTo(tVal); }}
                />
              </div>
              <Button
                as={Link}
                href="/dashboard/stats/integrations"
                color="primary"
                variant="flat"
                startContent={<Plug className="h-4 w-4" />}
                className="font-medium"
              >
                {t("integrationsLabel")}
              </Button>
            </div>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="flex flex-col gap-8">
          
          {/* CMS Overview Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 rounded-full bg-primary" />
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Visão do CMS
              </h2>
            </div>
            <CmsOverviewCards />
          </section>

          {/* Analytics Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 rounded-full bg-primary" />
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {t("title")}
              </h2>
            </div>

            {isLoading && (
              <div className="flex justify-center items-center py-20 bg-default-50 rounded-3xl border border-border border-dashed">
                <Spinner size="lg" color="primary" />
              </div>
            )}

            {isError && (
              <Card className="border-danger/20 bg-danger/5 shadow-none">
                <CardBody className="p-8 text-center">
                  <AlertCircle className="w-10 h-10 text-danger mx-auto mb-4" />
                  <p className="text-base text-danger">{t("errorLoading")}</p>
                </CardBody>
              </Card>
            )}

            {!isLoading && !isError && data && data.groups.length === 0 && (
              <Card className="border-border bg-default-50 shadow-none border-dashed">
                <CardBody className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 rounded-full bg-default-100 flex items-center justify-center mb-6">
                    <BarChart3 className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{t("emptyState")}</h3>
                  <p className="text-muted-foreground mb-8 max-w-md">
                    Conecte um provedor de analytics para visualizar as métricas avançadas neste dashboard.
                  </p>
                  <Button
                    as={Link}
                    href="/dashboard/stats/integrations"
                    color="primary"
                    size="lg"
                    startContent={<Plug className="h-5 w-5" />}
                  >
                    {t("addIntegration")}
                  </Button>
                </CardBody>
              </Card>
            )}

            {data && data.groups.length > 0 && (
              <div className="flex flex-col gap-6">
                {/* Timeseries (Charts) taking full width blocks */}
                {visibleTimeseriesModules.length > 0 && (
                  <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
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

                {/* KPI Stat Groups */}
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  {data.groups.map((group) => (
                    <StatGroupCard key={group.moduleKey} group={group} />
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </LayoutScopeRoot>
  );
}
