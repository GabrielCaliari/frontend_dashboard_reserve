"use client";

import { useContext } from "react";
import { EntityActionsContext } from "./entity-actions-context";

export function useEntityActions() {
  const actions = useContext(EntityActionsContext);
  if (!actions)
    throw new Error("useEntityActions deve ser usado dentro de EntityActionsProvider");
  return actions;
}
