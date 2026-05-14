"use client";

interface MetadataTableProps {
  metadata: Record<string, unknown>;
  metricKey: string;
}

export function MetadataTable({ metadata, metricKey }: MetadataTableProps) {
  const entries = Object.entries(metadata);

  return (
    <div className="mt-2 max-h-48 overflow-auto custom-scrollbar">
      {entries.map(([key, value]) => {
        if (Array.isArray(value)) {
          return (
            <div key={key} className="mb-2 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 capitalize">
                {key.replaceAll("_", "")}
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <tbody>
                    {(value as Record<string, unknown>[]).map((item, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-border last:border-0"
                      >
                        {Object.entries(item).map(([col, val]) => (
                          <td
                            key={col}
                            className="py-1 pr-3 text-foreground whitespace-nowrap"
                          >
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }
        return (
          <p key={key} className="break-words text-xs text-muted-foreground">
            <span className="capitalize">{key.replaceAll("_", "")}:</span>
            {""}
            <span className="break-all text-foreground">{String(value)}</span>
          </p>
        );
      })}
    </div>
  );
}
