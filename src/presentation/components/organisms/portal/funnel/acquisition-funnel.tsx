import type { FunnelStage } from "@/src/modules/portal/domain/portal-leads";

/**
 * Desktop renders stages as a horizontal row of decreasing-width bars; mobile
 * stacks them vertically (§4.3 principle 1). The fronteira line (master doc
 * §3.3: "a linha da fronteira é desenhada explicitamente") renders as a
 * labeled divider right after the stage flagged `isFronteira`.
 */
export function AcquisitionFunnel({ stages }: { stages: FunnelStage[] }) {
  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-3">
      {stages.map((stage) => {
        const widthPct = Math.max((stage.value / maxValue) * 100, 12);
        return (
          <div key={stage.key} className="flex flex-col gap-1">
            <div
              className="flex h-10 items-center rounded-md bg-primary/10 px-3 md:h-24 md:items-end md:justify-center md:pb-2"
              style={{ width: `${widthPct}%`, minWidth: "6rem" }}
            >
              <span className="font-semibold">{stage.value.toLocaleString("pt-BR")}</span>
            </div>
            <span className="text-xs text-muted-foreground">{stage.label}</span>
            {stage.isFronteira && (
              <div
                data-testid="fronteira-line"
                className="my-1 flex items-center gap-2 text-xs font-medium text-amber-600"
              >
                <span className="h-px flex-1 bg-amber-500" />
                fronteira Reserve / hotel
                <span className="h-px flex-1 bg-amber-500" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
