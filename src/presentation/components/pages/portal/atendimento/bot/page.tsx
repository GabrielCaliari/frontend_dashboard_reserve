"use client";

import {
  useBotConfigFields,
  useBotConfigProposals,
  useCreateBotConfigProposal,
} from "@/src/modules/portal/presentation/hooks/use-bot-config";
import { usePortalPermissions } from "@/src/modules/portal/presentation/hooks/use-portal-permissions";
import { ProposalForm } from "@/src/presentation/components/organisms/portal/bot-config/proposal-form";
import { ProposalStatusBadge } from "@/src/presentation/components/organisms/portal/bot-config/proposal-status-badge";
import { PortalTableSkeleton } from "@/src/presentation/components/organisms/portal/skeletons";
import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";

/**
 * Gated by `canProposeBotConfigChange` — a `funcionary` sees the data
 * read-only, per master doc §2 Decisão 13 ("cliente edita dados, não
 * comportamento") narrowed further by role.
 */
export default function PortalBotConfigPage() {
  const { canProposeBotConfigChange } = usePortalPermissions();
  const { data: fields, isLoading: fieldsLoading } = useBotConfigFields();
  const { data: proposals } = useBotConfigProposals();
  const { mutate: createProposal, isPending } = useCreateBotConfigProposal();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Configuração do bot</h1>
      <p className="text-sm text-muted-foreground">
        Preços, políticas, pacotes e horários. Comportamento e regras de atendimento não são editáveis por aqui.
      </p>

      {fieldsLoading ? (
        <PortalTableSkeleton />
      ) : (
        <div className="space-y-4">
          {fields?.map((field) => {
            const pendingProposal = proposals?.find((p) => p.field_id === field.id && p.status === "PENDENTE");
            return (
              <Card key={field.id} className="space-y-2 p-4">
                <p className="font-medium">{field.label}</p>
                {pendingProposal ? (
                  <ProposalStatusBadge status={pendingProposal.status} />
                ) : canProposeBotConfigChange ? (
                  <ProposalForm
                    field={field}
                    isSubmitting={isPending}
                    onSubmit={(valorProposto) => createProposal({ fieldId: field.id, valorProposto })}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">Valor atual: {field.current_value}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
