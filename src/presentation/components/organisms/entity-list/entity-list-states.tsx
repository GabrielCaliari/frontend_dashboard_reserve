"use client";

import { AlertCircle, LoaderCircle } from "lucide-react";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";

interface EntityListStatesProps {
  state: "loading" | "empty" | "error";
  onRetry?: () => void;
}

export function EntityListStates({ state, onRetry }: EntityListStatesProps) {
  if (state === "loading") {
    return (
      <div
        className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground"
        role="status"
      >
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Carregando
      </div>
    );
  }
  if (state === "empty") {
    return (
      <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
        Nenhum item encontrado
      </div>
    );
  }
  return (
    <div
      className="flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-muted-foreground"
      role="alert"
    >
      <AlertCircle className="h-5 w-5" />
      Não foi possível carregar os itens
      {onRetry ? (
        <Button size="sm" type="button" variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}
