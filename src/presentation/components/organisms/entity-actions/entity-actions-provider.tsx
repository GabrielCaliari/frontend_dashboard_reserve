"use client";

import type { ReactNode } from "react";
import { useMemo, useReducer } from "react";
import { EntityActionHost } from "./entity-action-host";
import {
  EntityActionsContext,
  type EntityActionsApi,
} from "./entity-actions-context";
import { entityActionsReducer, initialEntityActionState } from "./entity-actions-reducer";
import type { ConfirmActionDescriptor, EditActionDescriptor } from "./types";

export function EntityActionsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(entityActionsReducer, initialEntityActionState);
  const api = useMemo<EntityActionsApi>(
    () => ({
      openEdit: <TEntity,>(descriptor: EditActionDescriptor<TEntity>) =>
        dispatch({
          type: "openEdit",
          descriptor: descriptor as EditActionDescriptor<unknown>,
        }),
      openDelete: <TEntity,>(
        descriptor: Omit<ConfirmActionDescriptor<TEntity>, "kind">,
      ) =>
        dispatch({
          type: "openConfirm",
          descriptor: {
            ...descriptor,
            kind: "delete",
          } as ConfirmActionDescriptor<unknown>,
        }),
      openConfirm: <TEntity,>(descriptor: ConfirmActionDescriptor<TEntity>) =>
        dispatch({
          type: "openConfirm",
          descriptor: descriptor as ConfirmActionDescriptor<unknown>,
        }),
      close: () => dispatch({ type: "close" }),
    }),
    [],
  );
  return (
    <EntityActionsContext.Provider value={api}>
      {children}
      <EntityActionHost
        state={state}
        onStart={() => dispatch({ type: "start" })}
        onFail={(error) => dispatch({ type: "fail", error })}
        onComplete={() => dispatch({ type: "complete" })}
        onClose={() => dispatch({ type: "close" })}
      />
    </EntityActionsContext.Provider>
  );
}
