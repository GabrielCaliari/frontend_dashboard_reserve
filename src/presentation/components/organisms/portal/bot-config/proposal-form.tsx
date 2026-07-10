"use client";

import { useState } from "react";
import { Input } from "@/src/presentation/components/atoms/shadcn-ui/input";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";
import type { BotConfigField } from "@/src/modules/portal/domain/portal-bot-config";

/**
 * Copy makes the approval step explicit and reassuring, not bureaucratic
 * (master doc §5.5: "'toda alteração passa por validação da Reserve antes
 * de ir ao ar' é valor percebido, não burocracia").
 */
export function ProposalForm({
  field,
  onSubmit,
  isSubmitting,
}: {
  field: BotConfigField;
  onSubmit: (valorProposto: string) => void;
  isSubmitting: boolean;
}) {
  const [value, setValue] = useState("");

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
    >
      <p className="text-sm">
        <span className="text-muted-foreground">Valor atual: </span>
        <span className="font-medium">{field.current_value}</span>
      </p>
      <label className="block text-sm font-medium" htmlFor={`proposal-${field.id}`}>
        Novo valor
      </label>
      <Input id={`proposal-${field.id}`} value={value} onChange={(e) => setValue(e.target.value)} required />
      <p className="text-xs text-muted-foreground">
        A alteração só entra no ar depois que a Reserve validar — é assim que garantimos que nada quebra o
        atendimento.
      </p>
      <Button type="submit" size="sm" disabled={isSubmitting || !value}>
        {isSubmitting ? "Enviando…" : "Enviar para aprovação"}
      </Button>
    </form>
  );
}
