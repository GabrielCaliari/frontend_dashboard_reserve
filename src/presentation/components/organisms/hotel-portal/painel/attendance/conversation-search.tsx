"use client";

import { Input } from "@/src/presentation/components/atoms/shadcn-ui/input";
import type {
  ConversationFilters,
  FunnelStage,
} from "@/src/shared/domain/types/@hotel-painel";
import { STAGE_LABEL } from "./conversation-list";

const STAGES: FunnelStage[] = [
  "NOVO",
  "QUALIFICADO",
  "PAGAMENTO",
  "FECHADO",
  "PERDIDO",
];

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
        placeholder="Buscar por nome ou número"
        value={filters.search ?? ""}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
      />
      <select
        aria-label="Filtrar por estágio"
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={filters.stage ?? ""}
        onChange={(e) =>
          onChange({
            ...filters,
            stage: (e.target.value || undefined) as FunnelStage | undefined,
          })
        }
      >
        <option value="">Todos os estágios</option>
        {STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {STAGE_LABEL[stage]}
          </option>
        ))}
      </select>
    </div>
  );
}
