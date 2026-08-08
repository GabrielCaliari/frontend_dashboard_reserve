import { Info } from "lucide-react";

/**
 * Master doc §3.9 inegociável: the attribution window must always be visible
 * wherever attribution-derived numbers appear (campaign conversions, ROI).
 */
export function AttributionWindowBanner({ windowDays }: { windowDays: number }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" />
      <span>
        Os números desta seção contam conversas e reservas originadas em até {windowDays} dias após o clique no
        anúncio ou link — essa é a janela de atribuição usada em todo o painel.
      </span>
    </div>
  );
}
