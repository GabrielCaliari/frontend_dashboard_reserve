"use client";

import {
  useActiveHotelClient,
  useCreateBotConfigProposal,
  useHotelBotConfigProposals,
} from "@/src/shared/hooks/hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { ProposalForm } from "@/src/presentation/components/organisms/hotel-portal/painel/bot-config/proposal-form";
import { ProposalStatusBadge } from "@/src/presentation/components/organisms/hotel-portal/painel/bot-config/proposal-status-badge";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";

function renderValor(valor: unknown): string {
  if (valor == null) return "—";
  if (typeof valor === "string") return valor;
  return JSON.stringify(valor);
}

/**
 * Bloco de configuracao do bot (§5.5). Decisao 13: o cliente propoe DADOS
 * (preco, politica, pacote, horario), nunca comportamento — e toda proposta
 * passa por PENDENTE -> APROVADA/REJEITADA. Nao existe caminho de salvar
 * direto, nem aqui nem no backend (o DTO so aceita as quatro categorias).
 */
export default function HotelBotConfigPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const clientId = client?.id ?? null;

  const { data: proposals, isLoading, isError } =
    useHotelBotConfigProposals(clientId);
  const createProposal = useCreateBotConfigProposal(clientId);

  return (
    <PainelPageShell
      title="Bot / Automação"
      description="Proponha ajustes nos dados que o bot usa para responder. A Reserve valida antes de publicar."
      isLoading={clientLoading || isLoading}
      isError={isError}
      errorMessage="Erro ao carregar as propostas de configuração."
    >
      <PainelSection title="Propor uma alteração">
        <Card className="max-w-xl p-5">
          <ProposalForm
            isSubmitting={createProposal.isPending}
            onSubmit={(dto) => createProposal.mutate(dto)}
          />
        </Card>
      </PainelSection>

      <PainelSection title="Propostas enviadas">
        {proposals && proposals.length > 0 ? (
          <div className="space-y-2">
            {proposals.map((proposal) => (
              <Card key={proposal.id} className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{proposal.campo}</p>
                  <ProposalStatusBadge status={proposal.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {renderValor(proposal.valor_atual)} →{" "}
                  <span className="font-medium text-foreground">
                    {renderValor(proposal.valor_proposto)}
                  </span>
                </p>
                {proposal.justificativa && (
                  <p className="text-sm text-muted-foreground">
                    Retorno da Reserve: {proposal.justificativa}
                  </p>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <PortalEmptyState
            title="Nenhuma proposta enviada"
            description="Quando você propuser um ajuste de preço, política, pacote ou horário, o andamento aparece aqui."
          />
        )}
      </PainelSection>
    </PainelPageShell>
  );
}
