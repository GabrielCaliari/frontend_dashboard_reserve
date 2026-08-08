"use client";

import { useState } from "react";
import { Input } from "@/src/presentation/components/atoms/shadcn-ui/input";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";
import {
  BOT_CONFIG_PROPOSAL_CATEGORIES,
  type BotConfigProposalCategory,
  type CreateBotConfigProposalDto,
} from "@/src/shared/domain/types/@hotel-painel";

/**
 * Nao existe rota que liste "campos configuraveis do bot" — o backend so
 * aceita a proposta (`POST .../bot-config-proposals`) com campo livre dentro
 * de uma categoria do conjunto fechado. Por isso o formulario pede a categoria
 * e o campo em vez de renderizar uma lista vinda da API: inventar esse
 * endpoint no front foi exatamente o erro que derrubou a area /portal.
 *
 * O conjunto fechado tambem e a fronteira da Decisao 13: o cliente propoe
 * DADOS (preco, politica, pacote, horario), nunca comportamento do bot.
 */
const CATEGORY_LABELS: Record<BotConfigProposalCategory, string> = {
  pricing: "Preços",
  policies: "Políticas",
  packages: "Pacotes",
  hours: "Horários",
};

export function ProposalForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (dto: CreateBotConfigProposalDto) => void;
  isSubmitting: boolean;
}) {
  const [categoria, setCategoria] =
    useState<BotConfigProposalCategory>("pricing");
  const [campo, setCampo] = useState("");
  const [valorAtual, setValorAtual] = useState("");
  const [valorProposto, setValorProposto] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          campo,
          categoria,
          valor_atual: valorAtual || undefined,
          valor_proposto: valorProposto,
        });
        setCampo("");
        setValorAtual("");
        setValorProposto("");
      }}
    >
      <div className="space-y-1">
        <label className="block text-sm font-medium" htmlFor="proposal-categoria">
          Categoria
        </label>
        <select
          id="proposal-categoria"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={categoria}
          onChange={(e) =>
            setCategoria(e.target.value as BotConfigProposalCategory)
          }
        >
          {BOT_CONFIG_PROPOSAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium" htmlFor="proposal-campo">
          O que muda
        </label>
        <Input
          id="proposal-campo"
          placeholder="Ex.: diária da suíte master"
          value={campo}
          onChange={(e) => setCampo(e.target.value)}
          maxLength={100}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium" htmlFor="proposal-atual">
          Valor atual (opcional)
        </label>
        <Input
          id="proposal-atual"
          value={valorAtual}
          onChange={(e) => setValorAtual(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium" htmlFor="proposal-novo">
          Novo valor
        </label>
        <Input
          id="proposal-novo"
          value={valorProposto}
          onChange={(e) => setValorProposto(e.target.value)}
          required
        />
      </div>

      <p className="text-xs text-muted-foreground">
        A alteração só entra no ar depois que a Reserve validar — é assim que
        garantimos que nada quebra o atendimento.
      </p>
      <Button
        type="submit"
        size="sm"
        disabled={isSubmitting || !campo || !valorProposto}
      >
        {isSubmitting ? "Enviando…" : "Enviar para aprovação"}
      </Button>
    </form>
  );
}
