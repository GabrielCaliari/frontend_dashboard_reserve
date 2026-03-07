"use client";

import { AlertCircle } from "lucide-react";
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

interface StatGroupCardProps {
  group: MetricGroupResponse;
}

export function StatGroupCard({ group }: StatGroupCardProps) {
  const metricsWithMetadata = group.metrics.filter((m) => m.metadata);
  const metricsWithoutMetadata = group.metrics.filter((m) => !m.metadata);

  return (
    <Card className="bg-[#111125] border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
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

        {metricsWithMetadata.length > 0 && (
          <div className="mt-4 space-y-3">
            {metricsWithMetadata.map((metric) => (
              <Card
                key={metric.key}
                className="bg-[#16162a] border-gray-800"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-200">
                      {metric.label}
                    </p>
                    <span className="text-lg font-bold text-gray-100">
                      {metric.value}
                      {metric.unit && (
                        <span className="ml-1 text-xs font-normal text-gray-400">
                          {metric.unit}
                        </span>
                      )}
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
