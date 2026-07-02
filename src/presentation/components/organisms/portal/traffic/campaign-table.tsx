import {
  PortalDataTable,
  type PortalDataTableColumn,
} from "@/src/presentation/components/organisms/portal/data-table";
import { PortalEmptyState } from "@/src/presentation/components/organisms/portal/empty-state";
import type { CampaignPerformance } from "@/src/modules/portal/domain/portal-traffic";

const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const columns: PortalDataTableColumn<CampaignPerformance>[] = [
  { key: "name", header: "Campanha", render: (c) => c.name },
  { key: "spend", header: "Investimento", render: (c) => currency(c.spend) },
  { key: "clicks", header: "Conversas iniciadas", render: (c) => c.clicks.toLocaleString("pt-BR") },
  { key: "cpl", header: "Custo por conversa", render: (c) => currency(c.cpl) },
];

export function CampaignTable({ campaigns, forceMobile }: { campaigns: CampaignPerformance[]; forceMobile?: boolean }) {
  if (campaigns.length === 0) {
    return (
      <PortalEmptyState
        title="Nenhuma campanha no período"
        description="Assim que houver investimento em anúncios nessas datas, o desempenho por campanha aparece aqui."
      />
    );
  }

  return <PortalDataTable columns={columns} rows={campaigns} getRowKey={(c) => c.id} forceMobile={forceMobile} />;
}
