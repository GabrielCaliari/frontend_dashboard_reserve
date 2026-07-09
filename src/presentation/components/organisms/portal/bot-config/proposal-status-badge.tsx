import { cn } from "@/src/shared/lib/utils";
import type { ProposalStatus } from "@/src/modules/portal/domain/portal-bot-config";

const styles: Record<ProposalStatus, string> = {
  PENDENTE: "bg-amber-100 text-amber-800",
  APROVADA: "bg-emerald-100 text-emerald-800",
  REJEITADA: "bg-red-100 text-red-800",
};

const labels: Record<ProposalStatus, string> = {
  PENDENTE: "Aguardando validação da Reserve",
  APROVADA: "Aprovada e publicada",
  REJEITADA: "Não aprovada",
};

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", styles[status])}>{labels[status]}</span>;
}
