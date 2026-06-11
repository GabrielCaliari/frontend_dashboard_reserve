import { Children, type ReactNode } from "react";
import {
  ResourceListEmptyState,
  ResourceListErrorState,
  ResourceListLoadingState,
} from "./resource-list-states";

interface ResourceListProps {
  "aria-label": string;
  children?: ReactNode;
  isLoading?: boolean;
  loadingLabel?: string;
  error?: ReactNode;
  emptyContent?: ReactNode;
  unwrapped?: boolean;
}

export function ResourceList({
  children,
  isLoading = false,
  loadingLabel = "Carregando",
  error,
  emptyContent = "Nenhum recurso encontrado",
  unwrapped = false,
  ...listProps
}: ResourceListProps) {
  if (isLoading) return <ResourceListLoadingState label={loadingLabel} />;
  if (error) return <ResourceListErrorState>{error}</ResourceListErrorState>;
  if (Children.count(children) === 0)
    return <ResourceListEmptyState>{emptyContent}</ResourceListEmptyState>;

  return (
    <ul
      {...listProps}
      className={
        unwrapped
          ? "m-0 flex list-none flex-col p-0 divide-y divide-border"
          : "m-0 flex list-none flex-col overflow-hidden rounded-xl border border-border bg-content1 p-0 divide-y divide-border"
      }
    >
      {children}
    </ul>
  );
}
