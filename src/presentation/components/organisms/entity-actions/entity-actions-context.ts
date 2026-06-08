import { createContext } from "react";
import type { ConfirmActionDescriptor, EditActionDescriptor } from "./types";

export interface EntityActionsApi {
  openEdit<TEntity>(descriptor: EditActionDescriptor<TEntity>): void;
  openDelete<TEntity>(
    descriptor: Omit<ConfirmActionDescriptor<TEntity>, "kind">,
  ): void;
  openConfirm<TEntity>(descriptor: ConfirmActionDescriptor<TEntity>): void;
  close(): void;
}

export const EntityActionsContext = createContext<EntityActionsApi | null>(null);
