import { describe, expect, it } from "vitest";
import {
  entityActionsReducer,
  initialEntityActionState,
} from "./entity-actions-reducer";
import type { ConfirmActionDescriptor } from "./types";

const descriptor: ConfirmActionDescriptor<{ id: string }> = {
  kind: "delete",
  entity: { id: "contact-1" },
  title: "Excluir contato",
  description: "Esta ação não pode ser desfeita.",
  confirmLabel: "Excluir",
  successMessage: "Contato excluído",
  tone: "danger",
  mutation: async () => undefined,
  invalidate: [["contacts"]],
};

describe("entityActionsReducer", () => {
  it("keeps a failed confirmation open with its descriptor and error", () => {
    const open = entityActionsReducer(initialEntityActionState, {
      type: "openConfirm",
      descriptor,
    });
    const pending = entityActionsReducer(open, { type: "start" });
    const failed = entityActionsReducer(pending, {
      type: "fail",
      error: new Error("Falha de rede"),
    });

    expect(failed).toMatchObject({ descriptor, pending: false });
    expect(failed.error).toBeInstanceOf(Error);
  });

  it("does not close a pending action unless forced", () => {
    const open = entityActionsReducer(initialEntityActionState, {
      type: "openConfirm",
      descriptor,
    });
    const pending = entityActionsReducer(open, { type: "start" });

    expect(entityActionsReducer(pending, { type: "close" })).toEqual(pending);
    expect(entityActionsReducer(pending, { type: "close", force: true })).toEqual(
      initialEntityActionState,
    );
  });
});
