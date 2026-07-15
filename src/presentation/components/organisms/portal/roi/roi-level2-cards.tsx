import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import {
  PortalDataTable,
  type PortalDataTableColumn,
} from "@/src/presentation/components/organisms/portal/data-table";
import type { RoiLevel2 } from "@/src/modules/portal/domain/portal-roi";

const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const columns: PortalDataTableColumn<RoiLevel2["roi_por_campanha"][number]>[] = [
  { key: "campaign_name", header: "Campanha", render: (r) => r.campaign_name },
  {
    key: "custo_por_lead_qualificado",
    header: "Custo por lead qualificado",
    render: (r) => currency(r.custo_por_lead_qualificado),
  },
];

export function RoiLevel2Cards({ data }: { data: RoiLevel2 }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Custo por lead qualificado</p>
          <p className="text-xl font-semibold">{currency(data.custo_por_lead_qualificado)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Custo por lead pronto para fechar</p>
          <p className="text-xl font-semibold">{currency(data.custo_por_lead_pronto_fechar)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Taxa de qualificação</p>
          <p className="text-xl font-semibold">{data.taxa_qualificacao_pct}%</p>
        </Card>
      </div>
      <div>
        <h3 className="mb-2 text-xs text-muted-foreground">Retorno por campanha</h3>
        <PortalDataTable columns={columns} rows={data.roi_por_campanha} getRowKey={(r) => r.campaign_id} />
      </div>
    </div>
  );
}
