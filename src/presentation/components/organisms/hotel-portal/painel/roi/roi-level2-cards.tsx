import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import {
  PortalDataTable,
  type PortalDataTableColumn,
} from "@/src/presentation/components/organisms/hotel-portal/painel/data-table";
import { formatMoney, formatPercent } from "@/src/shared/utils/hotel-format";
import type {
  RoiByCampaignRow,
  RoiNivel2,
} from "@/src/shared/domain/types/@hotel-painel";

const columns: PortalDataTableColumn<RoiByCampaignRow>[] = [
  // O backend agrupa por `campaign_id` cru e nao devolve nome — exibir o id e
  // honesto; inventar um join no front nao seria.
  { key: "campaignId", header: "Campanha", render: (r) => r.campaignId },
  { key: "conversas", header: "Conversas", render: (r) => r.conversas },
  { key: "qualificados", header: "Qualificados", render: (r) => r.qualificados },
];

export function RoiLevel2Cards({ data }: { data: RoiNivel2 }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">
            Custo por lead qualificado
          </p>
          <p className="text-xl font-semibold">
            {formatMoney(data.costPerQualifiedLead)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">
            Custo por lead pronto para fechar
          </p>
          <p className="text-xl font-semibold">
            {formatMoney(data.costPerReadyToClose)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Taxa de qualificação</p>
          <p className="text-xl font-semibold">
            {formatPercent(data.qualificationRate)}
          </p>
        </Card>
      </div>
      <div>
        <h3 className="mb-2 text-xs text-muted-foreground">
          Retorno por campanha
        </h3>
        <PortalDataTable
          columns={columns}
          rows={data.roiByCampaign}
          getRowKey={(r) => r.campaignId}
        />
      </div>
    </div>
  );
}
