import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";

import { createTestQueryClient } from "@/src/shared/query/test-query-provider";
import { EntityActionsProvider } from "./entity-actions-provider";
import { useEntityActions } from "./use-entity-actions";

// DialogContent reads useTranslations("common") (Reserve customization, see
// entity-actions-provider.test.tsx) -- needs a NextIntlClientProvider ancestor.
const intlMessages = { common: { close: "Fechar" } };

function Harness() {
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
          mutation: async () => undefined,
          invalidate: [["contacts"]],
        })
      }
    >
      Abrir exclusão
    </button>
  );
}

describe("EntityActionHost accessibility", () => {
  it("has no axe violations while the confirmation dialog is open", async () => {
    const client = createTestQueryClient();
    const wrapper = ({ children }: PropsWithChildren) => (
      <NextIntlClientProvider locale="pt" messages={intlMessages}>
        <QueryClientProvider client={client}>
          <EntityActionsProvider>{children}</EntityActionsProvider>
        </QueryClientProvider>
      </NextIntlClientProvider>
    );
    render(<Harness />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: "Abrir exclusão" }));
    const dialog = screen.getByRole("dialog");

    expect(await axe(dialog)).toHaveNoViolations();
  });
});
