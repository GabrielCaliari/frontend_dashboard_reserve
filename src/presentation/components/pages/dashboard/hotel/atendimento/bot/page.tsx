"use client";

import toast from "react-hot-toast";
import { useTenantCapabilities } from "@/src/modules/settings/presentation/hooks/tenant-capabilities-provider";
import {
  useActiveHotelClient,
  useApproveBotConfigProposal,
  useCreateBotConfigProposal,
  useHotelBotConfigProposals,
  useRejectBotConfigProposal,
} from "@/src/shared/hooks/hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { ProposalForm } from "@/src/presentation/components/organisms/hotel-portal/painel/bot-config/proposal-form";
import { ProposalReview } from "@/src/presentation/components/organisms/hotel-portal/painel/bot-config/proposal-review";
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
  const { tenantId, hasPermission } = useTenantCapabilities();
  const podeRevisar = hasPermission("hotel-portal.bot-config-proposals.manage");
  const approve = useApproveBotConfigProposal(tenantId, clientId);
  const reject = useRejectBotConfigProposal(tenantId, clientId);

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
            onSubmit={(dto) =>
              createProposal.mutate(dto, {
                onSuccess: () => toast.success("Proposta enviada para a Reserve validar."),
                onError: () => toast.error("Não foi possível enviar a proposta."),
              })
            }
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
                {proposal.justificativa_cliente && (
                  <p className="text-sm text-muted-foreground">
                    Motivo do pedido: {proposal.justificativa_cliente}
                  </p>
                )}
                {proposal.justificativa && (
                  <p className="text-sm text-muted-foreground">
                    Retorno da Reserve: {proposal.justificativa}
                  </p>
                )}
                {podeRevisar && proposal.status === "PENDENTE" && (
                  <ProposalReview
                    isBusy={approve.isPending || reject.isPending}
                    onApprove={() =>
                      approve.mutate(proposal.id, {
                        onSuccess: () => toast.success("Proposta aprovada e enviada ao bot."),
                        onError: () => toast.error("Não foi possível aprovar a proposta."),
                      })
                    }
                    onReject={(justificativa) =>
                      reject.mutate(
                        { id: proposal.id, justificativa },
                        {
                          onSuccess: () => toast.success("Proposta rejeitada."),
                          onError: () => toast.error("Não foi possível rejeitar a proposta."),
                        },
                      )
                    }
                  />
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
