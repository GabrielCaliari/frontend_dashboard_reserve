import { Info } from "lucide-react";

/**
 * Master doc §3.9 inegociável: the attribution window must always be visible
 * wherever attribution-derived numbers appear (campaign conversions, ROI).
 */
export function AttributionWindowBanner({ windowDays }: { windowDays: number }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-border/70 bg-default-50 px-4 py-3 text-sm text-foreground/75">
      <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
      <span>
        Os números desta tela contam conversas e reservas que começaram em até{" "}
        <strong className="font-medium text-foreground">{windowDays} dias</strong> depois do clique no
        anúncio ou no link — a mesma janela de atribuição usada em todo o painel.
      </span>
    </p>
  );
}
