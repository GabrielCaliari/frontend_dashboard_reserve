"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/src/presentation/components/atoms/shadcn-ui/card";
import { StatKpiCard } from "./stat-kpi-card";
import { MetadataTable } from "./metadata-table";
import type { MetricGroupResponse } from "@/src/shared/domain/types/@stats";
import { formatStatValue } from "./format-stat-value";

interface StatGroupCardProps {
  group: MetricGroupResponse;
}

export function StatGroupCard({ group }: StatGroupCardProps) {
  const t = useTranslations("stats");
  const isTopBlogsMetric = (metricKey: string) =>
    metricKey.startsWith("cms.blog.");
  const isTopCollectionsMetric = (metricKey: string) =>
    metricKey.startsWith("leads.collection.");

  const topBlogsMetrics = group.metrics.filter((metric) =>
    isTopBlogsMetric(metric.key),
  );
  const topCollectionsMetrics = group.metrics.filter((metric) =>
    isTopCollectionsMetric(metric.key),
  );
  const metricsWithMetadata = group.metrics.filter((m) => m.metadata);
  const metricsWithoutMetadata = group.metrics.filter(
    (metric) =>
      !metric.metadata &&
      !isTopBlogsMetric(metric.key) &&
      !isTopCollectionsMetric(metric.key),
  );
  const metadataMetrics = metricsWithMetadata.filter(
    (metric) =>
      !isTopBlogsMetric(metric.key) && !isTopCollectionsMetric(metric.key),
  );

  return (
    <Card className="bg-default-50 border-border shadow-none h-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              {group.label}
            </CardTitle>
            {group.description && (
              <CardDescription className="text-muted-foreground text-sm mt-1">
                {group.description}
              </CardDescription>
            )}
          </div>
        </div>

        {group.error && (
          <div className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 mt-4">
            <AlertCircle className="h-5 w-5 text-danger flex-shrink-0" />
            <p className="text-sm font-medium text-danger">{group.error}</p>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {metricsWithoutMetadata.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {metricsWithoutMetadata.map((metric) => (
              <StatKpiCard key={metric.key} metric={metric} />
            ))}
          </div>
        )}

        {(topBlogsMetrics.length > 0 || topCollectionsMetrics.length > 0) && (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {topBlogsMetrics.length > 0 && (
              <Card className="bg-background border-border shadow-none hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <p className="mb-4 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    {t("topBlogs")}
                  </p>
                  <div className="space-y-3">
                    {topBlogsMetrics.map((metric) => (
                      <div
                        key={metric.key}
                        className="flex flex-col gap-2 rounded-xl border border-border/50 bg-default-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground sm:whitespace-normal">
                            {String(metric.metadata?.blog_name ?? metric.label)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground sm:whitespace-normal sm:break-all">
                            {String(metric.metadata?.blog_id ?? metric.key)}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-foreground sm:text-right bg-background px-3 py-1 rounded-lg border border-border">
                          {formatStatValue(metric.value, metric.unit)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {topCollectionsMetrics.length > 0 && (
              <Card className="bg-background border-border shadow-none hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <p className="mb-4 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    {t("topLeadCollections")}
                  </p>
                  <div className="space-y-3">
                    {topCollectionsMetrics.map((metric) => (
                      <div
                        key={metric.key}
                        className="flex flex-col gap-2 rounded-xl border border-border/50 bg-default-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground sm:whitespace-normal">
                            {String(
                              metric.metadata?.collection_name ?? metric.label,
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground sm:whitespace-normal sm:break-all">
                            {String(
                              metric.metadata?.collection_id ?? metric.key,
                            )}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-foreground sm:text-right bg-background px-3 py-1 rounded-lg border border-border">
                          {formatStatValue(metric.value, metric.unit)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {metadataMetrics.length > 0 && (
          <div className="mt-6 space-y-4">
            {metadataMetrics.map((metric) => (
              <Card
                key={metric.key}
                className="bg-background border-border shadow-none hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-5">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-foreground break-words">
                      {metric.label}
                    </p>
                    <span className="text-lg font-bold text-foreground break-words sm:text-right">
                      {formatStatValue(metric.value, metric.unit)}
                    </span>
                  </div>
                  {metric.metadata && (
                    <MetadataTable
                      metadata={metric.metadata}
                      metricKey={metric.key}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
