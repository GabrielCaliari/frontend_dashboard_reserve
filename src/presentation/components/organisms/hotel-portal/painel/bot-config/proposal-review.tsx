"use client";

import { useState } from "react";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";
import { Input } from "@/src/presentation/components/atoms/shadcn-ui/input";

/**
 * Aprovar/rejeitar uma proposta pendente (so para quem tem a permissao da
 * agencia). Aprovar publica a chave no bot; rejeitar exige o retorno, que o
 * cliente le na lista.
 */
export function ProposalReview({
  onApprove,
  onReject,
  isBusy,
}: {
  onApprove: () => void;
  onReject: (justificativa: string) => void;
  isBusy: boolean;
}) {
  const [rejeitando, setRejeitando] = useState(false);
  const [retorno, setRetorno] = useState("");

  if (!rejeitando) {
    return (
      <div className="flex flex-wrap gap-2 pt-1">
        <Button disabled={isBusy} size="sm" onClick={onApprove}>
          Aprovar e publicar
        </Button>
        <Button disabled={isBusy} size="sm" variant="outline" onClick={() => setRejeitando(true)}>
          Rejeitar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-1">
      <label className="block text-sm font-medium" htmlFor="proposal-retorno">
        Retorno para o cliente
      </label>
      <Input id="proposal-retorno" maxLength={500} value={retorno} onChange={(e) => setRetorno(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={isBusy}
          size="sm"
          variant="destructive"
          onClick={() => {
            const texto = retorno.trim();
            if (texto) onReject(texto);
          }}
        >
          Confirmar rejeição
        </Button>
        <Button disabled={isBusy} size="sm" variant="ghost" onClick={() => setRejeitando(false)}>
          Voltar
        </Button>
      </div>
    </div>
  );
}
