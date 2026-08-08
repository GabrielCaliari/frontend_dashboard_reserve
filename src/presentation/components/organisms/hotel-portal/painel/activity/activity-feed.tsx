import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import type { ActivityLogEntry } from "@/src/shared/domain/types/@hotel-painel";

const CATEGORY_LABEL: Record<string, string> = {
  post: "Conteúdo",
  campaign: "Campanha",
  report: "Relatório",
  bot: "Automação",
  meeting: "Reunião",
  other: "Outro",
};

/**
 * O backend ja devolve mais recente primeiro (`orderBy created_at desc`) —
 * §3.5 "timeline reversa de tudo que a Reserve fez". Este componente confia
 * no contrato e nao reordena.
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
            {entry.description && (
              <p className="text-sm text-muted-foreground">
                {entry.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {CATEGORY_LABEL[entry.category] ?? entry.category} ·{" "}
              {new Date(entry.created_at).toLocaleDateString("pt-BR", {
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
