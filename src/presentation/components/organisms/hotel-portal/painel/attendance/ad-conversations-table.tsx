import { PortalDataTable } from "@/src/presentation/components/organisms/hotel-portal/painel/data-table";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";

type Row = { sourceId: string; count: number };

/**
 * Conversas do WhatsApp que comecaram em um anuncio (contrato v2 §7). A chave
 * e o id do anuncio na Meta: o painel ainda nao guarda o nome do anuncio, por
 * isso a tabela mostra o id.
 */
export function AdConversationsTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <PortalEmptyState
        title="Nenhuma conversa veio de anúncio no período"
        description="Quando alguém clicar em um anúncio de clique para WhatsApp e falar com o bot, a conversa aparece aqui."
      />
    );
  }
  return (
    <PortalDataTable
      columns={[
        { key: "anuncio", header: "Anúncio (ID da Meta)", render: (row: Row) => row.sourceId },
        { key: "conversas", header: "Conversas iniciadas", render: (row: Row) => row.count },
      ]}
      getRowKey={(row: Row) => row.sourceId}
      rows={rows}
    />
  );
}
