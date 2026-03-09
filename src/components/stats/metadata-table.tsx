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
              <p className="text-xs font-medium text-gray-400 mb-1 capitalize">
                {key.replaceAll("_", " ")}
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <tbody>
                    {(value as Record<string, unknown>[]).map(
                      (item, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-800 last:border-0"
                        >
                          {Object.entries(item).map(([col, val]) => (
                            <td key={col} className="py-1 pr-3 text-gray-300 whitespace-nowrap">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }
        return (
          <p key={key} className="break-words text-xs text-gray-400">
            <span className="capitalize">{key.replaceAll("_", " ")}:</span>{" "}
            <span className="break-all text-gray-300">{String(value)}</span>
          </p>
        );
      })}
    </div>
  );
}
