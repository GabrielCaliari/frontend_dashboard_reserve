import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import type { FunnelStageCount } from "@/src/modules/portal/domain/portal-attendance";

const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Desktop: side-by-side columns. Mobile: the same cards stack vertically via
 * flex-col (master doc §5.4 "No mobile, lista agrupada por estágio") — the
 * shape (grouped by stage, not row-per-record) doesn't fit
 * `PortalDataTableColumn`, so this is hand-rolled rather than reusing Task 8.
 *
 * `useMoveFunnelStage` (event-based, never a direct field write, §5.4) ships
 * fully working and tested, but its trigger UI is intentionally NOT wired
 * in here: `FunnelStageCount` is an aggregate count per stage with no
 * per-lead granularity, so a "mover" action needs either a per-lead
 * drill-down on this component or to live on `<ConversationList>` /
 * `<ConversationTranscript>` next to the stage badge already rendered
 * there. Needs a product decision on where "move a lead" belongs in the UI
 * — not guessed here.
 */
export function FunnelColumns({ stages }: { stages: FunnelStageCount[] }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row">
      {stages.map((stage) => (
        <div key={stage.stage} className="flex-1">
          <Card className="space-y-1 p-4">
            <p className="text-sm text-muted-foreground">{stage.label}</p>
            <p className="text-2xl font-semibold">{stage.count}</p>
            {stage.potential_value !== null && (
              <p className="text-xs text-muted-foreground">{currency(stage.potential_value)} em potencial</p>
            )}
          </Card>
          {stage.isFronteira && (
            <div
              data-testid="fronteira-line"
              className="my-2 flex items-center gap-2 text-xs font-medium text-amber-600 md:my-0 md:h-full md:w-px md:flex-col md:bg-amber-500"
            >
              <span className="md:hidden">fronteira Reserve / hotel</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
