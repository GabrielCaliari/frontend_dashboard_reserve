"use client";

import { useState, useMemo } from "react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { AlertCircle, BarChart3, Plug } from "lucide-react";
import { Card, CardBody, Spinner, Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useHasSelectedTenant } from "@/src/common/stores/tenant-store";
import { useStatsDashboard } from "@/src/common/hooks/stats";
import { StatGroupCard, DateRangePicker } from "@/src/components/stats";

function getDefaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export default function DashboardPage() {
  const t = useTranslations("stats");
  const hasSelectedTenant = useHasSelectedTenant();

  const defaultRange = useMemo(getDefaultRange, []);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);

  const { data, isLoading, isError } = useStatsDashboard(from, to);

  if (!hasSelectedTenant) {
    return (
      <LayoutScopeRoot routeActive="dashboard">
        <div className="flex flex-col items-center justify-center py-16">
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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">{t("title")}</h1>
            {data?.generatedAt && (
              <p className="text-xs text-gray-400 mt-1">
                {t("updatedAt", {
                  date: new Date(data.generatedAt).toLocaleString(),
                })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <DateRangePicker
              from={from}
              to={to}
              onChange={(f, tVal) => {
                setFrom(f);
                setTo(tVal);
              }}
            />
            <Button
              as={Link}
              href="/dashboard/stats/integrations"
              variant="bordered"
              size="sm"
              startContent={<Plug className="h-4 w-4" />}
              className="border-gray-700 text-gray-300"
            >
              {t("integrationsLabel")}
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {isError && (
          <Card className="border-red-500/20 bg-red-500/5">
            <CardBody className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-400">{t("errorLoading")}</p>
            </CardBody>
          </Card>
        )}

        {data && data.groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-12 w-12 text-gray-600 mb-3" />
            <p className="text-gray-400">{t("emptyState")}</p>
            <Button
              as={Link}
              href="/dashboard/stats/integrations"
              color="primary"
              variant="flat"
              size="sm"
              className="mt-4"
            >
              {t("addIntegration")}
            </Button>
          </div>
        )}

        {data && data.groups.length > 0 && (
          <div className="space-y-6">
            {data.groups.map((group) => (
              <StatGroupCard key={group.moduleKey} group={group} />
            ))}
          </div>
        )}
      </div>
    </LayoutScopeRoot>
  );
}
