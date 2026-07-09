/**
 * §5.5 — client proposes data changes to the bot's operational fields
 * (prices, policies, packages); approval ("Reserve revisa no admin") is
 * out of scope per plan Assumption 9.
 *
 * BLOCKED (backend): `bot_config_propostas` table and its endpoints don't
 * exist yet.
 */
export type BotConfigFieldGroup = "precos" | "politicas" | "pacotes" | "operacional";
export type ProposalStatus = "PENDENTE" | "APROVADA" | "REJEITADA";

export interface BotConfigField {
  id: string;
  group: BotConfigFieldGroup;
  label: string;
  current_value: string;
}

export interface BotConfigProposal {
  id: string;
  field_id: string;
  field_label: string;
  valor_atual: string;
  valor_proposto: string;
  status: ProposalStatus;
  justificativa_rejeicao: string | null;
  created_at: string;
}
