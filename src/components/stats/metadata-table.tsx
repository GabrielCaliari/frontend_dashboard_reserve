"use client";

import type { MetricValueResponse } from "@/src/common/@types/@stats";
import { useTranslations } from "next-intl";

interface MetadataTableProps {
  metadata: Record<string, unknown>;
  metricKey: string;
}

export function MetadataTable({ metadata, metricKey }: MetadataTableProps) {
  const t = useTranslations("stats");

  // Handle arrays inside metadata (e.g. pages, queries)
  const entries = Object.entries(metadata);

  return (
    <div className="mt-2 max-h-48 overflow-y-auto custom-scrollbar">
      {entries.map(([key, value]) => {
        if (Array.isArray(value)) {
          return (
            <div key={key} className="mb-2">
              <p className="text-xs font-medium text-gray-400 mb-1 capitalize">
                {key}
              </p>
              <table className="w-full text-xs">
                <tbody>
                  {(value as Record<string, unknown>[]).map(
                    (item, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-800 last:border-0"
                      >
                        {Object.entries(item).map(([col, val]) => (
                          <td key={col} className="py-1 pr-3 text-gray-300">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          );
        }
        return (
          <p key={key} className="text-xs text-gray-400">
            <span className="capitalize">{key}:</span>{" "}
            <span className="text-gray-300">{String(value)}</span>
          </p>
        );
      })}
    </div>
  );
}
