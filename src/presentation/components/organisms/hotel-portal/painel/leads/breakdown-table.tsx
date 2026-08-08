import {
  PortalDataTable,
  type PortalDataTableColumn,
} from "@/src/presentation/components/organisms/hotel-portal/painel/data-table";
import type { LeadsOverviewResponse } from "@/src/shared/domain/types/@hotel-painel";

type DeviceRow = LeadsOverviewResponse["byDevice"][number];
type CityRow = LeadsOverviewResponse["byCity"][number];

/**
 * `device` vem cru do banco (coluna `device_type` do clique), sem enum que
 * garanta o conjunto — por isso o rotulo e um lookup com fallback, nunca um
 * `Record` exaustivo que quebraria com um valor novo.
 */
const deviceLabels: Record<string, string> = {
  mobile: "Celular",
  desktop: "Computador",
  tablet: "Tablet",
  unknown: "Não identificado",
};

const deviceColumns: PortalDataTableColumn<DeviceRow>[] = [
  {
    key: "device",
    header: "Dispositivo",
    render: (r) => deviceLabels[r.device] ?? r.device ?? "Não identificado",
  },
  {
    key: "count",
    header: "Cliques",
    render: (r) => r.count.toLocaleString("pt-BR"),
  },
];

const cityColumns: PortalDataTableColumn<CityRow>[] = [
  { key: "city", header: "Cidade", render: (r) => r.city ?? "—" },
  {
    key: "count",
    header: "Cliques",
    render: (r) => r.count.toLocaleString("pt-BR"),
  },
];

export function DeviceBreakdownTable({ rows }: { rows: DeviceRow[] }) {
  return (
    <PortalDataTable
      columns={deviceColumns}
      rows={rows}
      getRowKey={(r) => r.device ?? "unknown"}
    />
  );
}

export function CityBreakdownTable({ rows }: { rows: CityRow[] }) {
  return (
    <PortalDataTable
      columns={cityColumns}
      rows={rows}
      getRowKey={(r) => r.city ?? "unknown"}
    />
  );
}
