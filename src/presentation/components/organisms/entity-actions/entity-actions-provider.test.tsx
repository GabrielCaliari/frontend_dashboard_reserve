import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/src/shared/query/test-query-provider";
import { EntityActionsProvider } from "./entity-actions-provider";
import { useEntityActions } from "./use-entity-actions";

// DialogContent (src/presentation/components/atoms/shadcn-ui/dialog.tsx) reads
// useTranslations("common") for its screen-reader-only close label -- a Reserve
// customization Zarp's original component doesn't have. Any test rendering a
// Dialog needs a NextIntlClientProvider ancestor; a minimal "common.close" is
// enough since that's the only key this atom reads.
const intlMessages = { common: { close: "Fechar" } };

function Harness({ mutation }: { mutation: () => Promise<unknown> }) {
  const actions = useEntityActions();
  return (
    <button
      onClick={() =>
        actions.openDelete({
          entity: { id: "contact-1" },
          title: "Excluir contato",
          description: "Esta ação não pode ser desfeita.",
          confirmLabel: "Excluir",
          successMessage: "Contato excluído",
          tone: "danger",
          mutation,
          invalidate: [["contacts"]],
        })
      }
    >
      Abrir exclusão
    </button>
  );
}

function setup(mutation: () => Promise<unknown>) {
  const client = createTestQueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: PropsWithChildren) => (
    <NextIntlClientProvider locale="pt" messages={intlMessages}>
      <QueryClientProvider client={client}>
        <EntityActionsProvider>{children}</EntityActionsProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
  render(<Harness mutation={mutation} />, { wrapper });
  return { invalidate };
}

describe("EntityActionsProvider", () => {
  it("keeps a failed deletion open and invalidates exact keys on success", async () => {
    const mutation = vi
      .fn()
      .mockRejectedValueOnce(new Error("Indisponível"))
      .mockResolvedValueOnce(undefined);
    const { invalidate } = setup(mutation);
    fireEvent.click(screen.getByRole("button", { name: "Abrir exclusão" }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    await waitFor(() => expect(screen.getByText("Indisponível")).toBeInTheDocument());
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["contacts"] });
  });
});
