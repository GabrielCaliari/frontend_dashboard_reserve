import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PortalEmptyState } from "../empty-state";

describe("PortalEmptyState", () => {
  it("renders a title and an explanation, never a blank block", () => {
    render(
      <PortalEmptyState
        title="Ainda sem dados de tráfego"
        description="A conexão com o Meta Ads está sendo configurada pela Reserve."
      />,
    );
    expect(screen.getByText("Ainda sem dados de tráfego")).toBeInTheDocument();
    expect(screen.getByText(/conexão com o meta ads/i)).toBeInTheDocument();
  });

  it("renders an optional action button and fires its callback", () => {
    const onAction = vi.fn();
    render(
      <PortalEmptyState
        title="Nenhum relatório publicado ainda"
        description="O primeiro resumo quinzenal aparece aqui assim que for publicado."
        actionLabel="Ver calendário"
        onAction={onAction}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ver calendário" }));
    expect(onAction).toHaveBeenCalledOnce();
  });
});
