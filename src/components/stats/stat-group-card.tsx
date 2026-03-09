"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/src/components/ui/card";
import { StatKpiCard } from "./stat-kpi-card";
import { MetadataTable } from "./metadata-table";
import type { MetricGroupResponse } from "@/src/common/@types/@stats";
import { formatStatValue } from "./format-stat-value";

interface StatGroupCardProps {
  group: MetricGroupResponse;
}

export function StatGroupCard({ group }: StatGroupCardProps) {
  const t = useTranslations("stats");
  const isTopBlogsMetric = (metricKey: string) => metricKey.startsWith("cms.blog.");
  const isTopCollectionsMetric = (metricKey: string) => metricKey.startsWith("leads.collection.");

  const topBlogsMetrics = group.metrics.filter((metric) => isTopBlogsMetric(metric.key));
  const topCollectionsMetrics = group.metrics.filter((metric) => isTopCollectionsMetric(metric.key));
  const metricsWithMetadata = group.metrics.filter((m) => m.metadata);
  const metricsWithoutMetadata = group.metrics.filter(
    (metric) =>
      !metric.metadata && !isTopBlogsMetric(metric.key) && !isTopCollectionsMetric(metric.key),
  );
  const metadataMetrics = metricsWithMetadata.filter(
    (metric) => !isTopBlogsMetric(metric.key) && !isTopCollectionsMetric(metric.key),
  );

  return (
    <Card className="bg-[#111125] border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-lg text-gray-100">
              {group.label}
            </CardTitle>
            {group.description && (
              <CardDescription className="text-gray-400 text-sm mt-0.5">
                {group.description}
              </CardDescription>
            )}
          </div>
        </div>

        {group.error && (
          <div className="flex items-center gap-2 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 mt-2">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400">{group.error}</p>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {metricsWithoutMetadata.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {metricsWithoutMetadata.map((metric) => (
              <StatKpiCard key={metric.key} metric={metric} />
            ))}
          </div>
        )}

        {(topBlogsMetrics.length > 0 || topCollectionsMetrics.length > 0) && (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {topBlogsMetrics.length > 0 && (
              <Card className="bg-[#16162a] border-gray-800">
                <CardContent className="p-4">
                  <p className="mb-3 text-sm font-medium text-gray-200">{t("topBlogs")}</p>
                  <div className="space-y-2">
                    {topBlogsMetrics.map((metric) => (
                      <div
                        key={metric.key}
                        className="flex flex-col gap-2 rounded-md border border-gray-800 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-gray-100 sm:whitespace-normal">
                            {String(metric.metadata?.blog_name ?? metric.label)}
                          </p>
                          <p className="truncate text-xs text-gray-500 sm:whitespace-normal sm:break-all">
                            {String(metric.metadata?.blog_id ?? metric.key)}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-gray-100 sm:text-right">
                          {formatStatValue(metric.value, metric.unit)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {topCollectionsMetrics.length > 0 && (
              <Card className="bg-[#16162a] border-gray-800">
                <CardContent className="p-4">
                  <p className="mb-3 text-sm font-medium text-gray-200">{t("topLeadCollections")}</p>
                  <div className="space-y-2">
                    {topCollectionsMetrics.map((metric) => (
                      <div
                        key={metric.key}
                        className="flex flex-col gap-2 rounded-md border border-gray-800 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-gray-100 sm:whitespace-normal">
                            {String(metric.metadata?.collection_name ?? metric.label)}
                          </p>
                          <p className="truncate text-xs text-gray-500 sm:whitespace-normal sm:break-all">
                            {String(metric.metadata?.collection_id ?? metric.key)}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-gray-100 sm:text-right">
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
          <div className="mt-4 space-y-3">
            {metadataMetrics.map((metric) => (
              <Card
                key={metric.key}
                className="bg-[#16162a] border-gray-800"
              >
                <CardContent className="p-4">
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-gray-200 break-words">
                      {metric.label}
                    </p>
                    <span className="text-lg font-bold text-gray-100 break-words sm:text-right">
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
