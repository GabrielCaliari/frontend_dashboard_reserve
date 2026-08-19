import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import type { FunnelBoardColumn } from "@/src/shared/domain/types/@hotel-painel";
import { stageLabel } from "@/src/presentation/components/organisms/hotel-portal/funil/funnel-stages";

/**
 * Kanban de conversas do bot. Desktop: colunas lado a lado. Mobile: as mesmas
 * colunas empilhadas (§5.4 "No mobile, lista agrupada por estagio").
 *
 * A fronteira Reserve/hotel cai depois de QUALIFICADO: dali pra frente quem
 * converte e o atendimento do hotel (§1.4). E a razao de este quadro existir —
 * mostrar com dado onde a Reserve termina.
 *
 * Somente leitura: mover card dispara evento de funil no backend (§5.4,
 * Decisao 12) e a UI de disparo ainda nao foi decidida em produto. Nao
 * inventar aqui.
 */
const FRONTEIRA_AFTER = "QUALIFICADO";

export function FunnelColumns({ columns }: { columns: FunnelBoardColumn[] }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
      {columns.map((column) => (
        <div key={column.stage} className="flex flex-1 flex-col gap-2">
          <Card className="space-y-1 p-4">
            <p className="text-sm text-muted-foreground">
              {stageLabel(column.stage)}
            </p>
            <p className="text-2xl font-semibold">{column.count}</p>
          </Card>

          <div className="space-y-1.5">
            {column.leads.map((lead) => (
              <Card key={lead.numeroContato} className="p-3 text-sm">
                <p className="font-medium">
                  {lead.nome ?? lead.numeroContato}
                </p>
                {lead.acomodacaoInteresse && (
                  <p className="text-xs text-muted-foreground">
                    {lead.acomodacaoInteresse}
                  </p>
                )}
                {lead.datasInteresse && (
                  <p className="text-xs text-muted-foreground">
                    {lead.datasInteresse}
                  </p>
                )}
              </Card>
            ))}
            {column.count > column.leads.length && (
              <p className="px-1 text-xs text-muted-foreground">
                +{column.count - column.leads.length} não exibido
                {column.count - column.leads.length === 1 ? "" : "s"}
              </p>
            )}
          </div>

          {column.stage === FRONTEIRA_AFTER && (
            <p
              data-testid="fronteira-line"
              className="mt-1 border-t-2 border-dashed border-amber-500 pt-1 text-xs font-medium text-amber-600 md:border-t-0"
            >
              fronteira Reserve / hotel
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
