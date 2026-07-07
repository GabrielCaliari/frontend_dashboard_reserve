"use client";

import { Input } from "@/src/presentation/components/atoms/shadcn-ui/input";
import type { ConversationFilters, FunnelStageStatus } from "@/src/modules/portal/domain/portal-attendance";

const STAGES: FunnelStageStatus[] = ["NOVO", "QUALIFICADO", "PAGAMENTO", "FECHADO", "FRIO"];

export function ConversationSearch({
  filters,
  onChange,
}: {
  filters: ConversationFilters;
  onChange: (next: ConversationFilters) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        placeholder="Buscar por número"
        value={filters.search ?? ""}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
      />
      <select
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={filters.stage ?? ""}
        onChange={(e) =>
          onChange({ ...filters, stage: (e.target.value || undefined) as FunnelStageStatus | undefined })
        }
      >
        <option value="">Todos os estágios</option>
        {STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {stage}
          </option>
        ))}
      </select>
    </div>
  );
}
