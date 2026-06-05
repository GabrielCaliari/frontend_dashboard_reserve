import type {
  ConfirmActionDescriptor,
  EditActionDescriptor,
  EntityActionState,
} from "./types";

export const initialEntityActionState: EntityActionState = {
  descriptor: null,
  pending: false,
  error: null,
};

export type EntityActionsEvent =
  | { type: "openEdit"; descriptor: EditActionDescriptor<unknown> }
  | { type: "openConfirm"; descriptor: ConfirmActionDescriptor<unknown> }
  | { type: "start" }
  | { type: "fail"; error: Error }
  | { type: "complete" }
  | { type: "close"; force?: boolean };

export function entityActionsReducer(
  state: EntityActionState,
  event: EntityActionsEvent,
): EntityActionState {
  switch (event.type) {
    case "openEdit":
    case "openConfirm":
      return { descriptor: event.descriptor, pending: false, error: null };
    case "start":
      return state.descriptor ? { ...state, pending: true, error: null } : state;
    case "fail":
      return state.descriptor ? { ...state, pending: false, error: event.error } : state;
    case "complete":
      return initialEntityActionState;
    case "close":
      return state.pending && !event.force ? state : initialEntityActionState;
  }
}
