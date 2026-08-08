import { cn } from "@/src/shared/lib/utils";
import type { BotConfigProposalStatus } from "@/src/shared/domain/types/@hotel-painel";

const styles: Record<BotConfigProposalStatus, string> = {
  PENDENTE: "bg-amber-100 text-amber-800",
  APROVADA: "bg-emerald-100 text-emerald-800",
  REJEITADA: "bg-red-100 text-red-800",
};

const labels: Record<BotConfigProposalStatus, string> = {
  PENDENTE: "Aguardando validação da Reserve",
  APROVADA: "Aprovada e publicada",
  REJEITADA: "Não aprovada",
};

export function ProposalStatusBadge({
  status,
}: {
  status: BotConfigProposalStatus;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        styles[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}
