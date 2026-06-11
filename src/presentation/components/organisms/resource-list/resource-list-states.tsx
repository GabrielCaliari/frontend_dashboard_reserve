import type { ReactNode } from "react";
import { Spinner } from "@heroui/react";

export function ResourceListLoadingState({
  label = "Carregando",
}: {
  label?: string;
}) {
  return (
    <div
      aria-label={label}
      className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"
      role="status"
    >
      <Spinner size="sm" />
      <span>{label}</span>
    </div>
  );
}

export function ResourceListErrorState({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger"
      role="alert"
    >
      {children}
    </div>
  );
}

export function ResourceListEmptyState({
  children = "Nenhum recurso encontrado",
}: {
  children?: ReactNode;
}) {
  return (
    <div
      className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground"
      role="status"
    >
      {children}
    </div>
  );
}
