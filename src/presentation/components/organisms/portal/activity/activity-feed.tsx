import { PortalEmptyState } from "@/src/presentation/components/organisms/portal/empty-state";
import type { ActivityLogEntry } from "@/src/modules/portal/domain/portal-content";

/**
 * Entries are rendered in the order given (server is expected to return
 * newest-first per master doc §3.5 "Timeline reversa de tudo que a Reserve
 * fez") — this component does not re-sort, trusting the API contract.
 */
export function ActivityFeed({ entries }: { entries: ActivityLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <PortalEmptyState
        title="Nenhuma atividade registrada ainda"
        description="Assim que a Reserve publicar um post, ajustar uma campanha ou registrar uma reunião, aparece aqui."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3 border-l-2 border-border pl-3">
          <div>
            <p className="text-sm font-medium">{entry.title}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(entry.occurred_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
