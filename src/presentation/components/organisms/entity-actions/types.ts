import type { ReactNode } from "react";

export type EntityActionKind =
  | "edit"
  | "delete"
  | "archive"
  | "deactivate"
  | "restore"
  | "custom";

export interface EditActionDescriptor<TEntity> {
  kind: "edit";
  entity: TEntity;
  title: string;
  render(context: { close(): void; complete(): Promise<void> }): ReactNode;
}

export interface ConfirmActionDescriptor<TEntity> {
  kind: Exclude<EntityActionKind, "edit">;
  entity: TEntity;
  title: string;
  description: string;
  confirmLabel: string;
  entityLabel?: string;
  successMessage: string;
  tone: "default" | "warning" | "danger";
  mutation(entity: TEntity): Promise<unknown>;
  invalidate: readonly (readonly unknown[])[];
}

export interface EntityActionState {
  descriptor: EditActionDescriptor<unknown> | ConfirmActionDescriptor<unknown> | null;
  pending: boolean;
  error: Error | null;
}
