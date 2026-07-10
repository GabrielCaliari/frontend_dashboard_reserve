import {
  PortalDataTable,
  type PortalDataTableColumn,
} from "@/src/presentation/components/organisms/portal/data-table";
import type { LinkConversionRow } from "@/src/modules/portal/domain/portal-leads";

const columns: PortalDataTableColumn<LinkConversionRow>[] = [
  { key: "label", header: "Link", render: (r) => r.label },
  { key: "clicks", header: "Cliques", render: (r) => r.clicks.toLocaleString("pt-BR") },
  { key: "conversations", header: "Conversas", render: (r) => r.conversations.toLocaleString("pt-BR") },
  { key: "conversion_rate_pct", header: "Taxa de conversão", render: (r) => `${r.conversion_rate_pct}%` },
];

export function LinkConversionTable({ rows }: { rows: LinkConversionRow[] }) {
  return <PortalDataTable columns={columns} rows={rows} getRowKey={(r) => r.link_code} />;
}
