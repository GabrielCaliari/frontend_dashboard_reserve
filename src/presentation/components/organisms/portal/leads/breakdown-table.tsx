import {
  PortalDataTable,
  type PortalDataTableColumn,
} from "@/src/presentation/components/organisms/portal/data-table";
import type { LeadsByDevice, LeadsByCity } from "@/src/modules/portal/domain/portal-leads";

const deviceLabels: Record<LeadsByDevice["device"], string> = {
  mobile: "Celular",
  desktop: "Computador",
  tablet: "Tablet",
  unknown: "Não identificado",
};

const deviceColumns: PortalDataTableColumn<LeadsByDevice>[] = [
  { key: "device", header: "Dispositivo", render: (r) => deviceLabels[r.device] },
  { key: "count", header: "Conversas", render: (r) => r.count.toLocaleString("pt-BR") },
];

const cityColumns: PortalDataTableColumn<LeadsByCity>[] = [
  { key: "city", header: "Cidade", render: (r) => r.city },
  { key: "count", header: "Conversas", render: (r) => r.count.toLocaleString("pt-BR") },
];

export function DeviceBreakdownTable({ rows }: { rows: LeadsByDevice[] }) {
  return <PortalDataTable columns={deviceColumns} rows={rows} getRowKey={(r) => r.device} />;
}

export function CityBreakdownTable({ rows }: { rows: LeadsByCity[] }) {
  return <PortalDataTable columns={cityColumns} rows={rows} getRowKey={(r) => r.city} />;
}
