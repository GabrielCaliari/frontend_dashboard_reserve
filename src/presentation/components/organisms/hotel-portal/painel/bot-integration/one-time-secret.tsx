"use client";

import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";

/** Mostra um segredo recem-gerado uma unica vez; nada dele fica guardado aqui. */
export function OneTimeSecret({
  label,
  value,
  onDismiss,
}: {
  label: string;
  value: string;
  onDismiss: () => void;
}) {
  return (
    <div role="alert" className="space-y-2 rounded-2xl border border-warning bg-warning/10 p-4">
      <p className="text-sm font-medium">{label}</p>
      <code className="block break-all rounded bg-background p-2 text-xs">{value}</code>
      <p className="text-xs">
        Guarde agora no gerenciador de senhas: este valor não será mostrado de novo.
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void navigator.clipboard?.writeText(value);
          }}
        >
          Copiar
        </Button>
        <Button type="button" size="sm" onClick={onDismiss}>
          Já guardei
        </Button>
      </div>
    </div>
  );
}
