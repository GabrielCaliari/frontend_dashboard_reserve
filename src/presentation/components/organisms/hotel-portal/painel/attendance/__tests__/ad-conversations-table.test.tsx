import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdConversationsTable } from "../ad-conversations-table";

describe("AdConversationsTable", () => {
  it("lista os anuncios com mais conversas", () => {
    render(<AdConversationsTable rows={[{ sourceId: "ad_123", count: 5 }, { sourceId: "ad_456", count: 2 }]} />);
    expect(screen.getByText("ad_123")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("vazio explica o que vai aparecer", () => {
    render(<AdConversationsTable rows={[]} />);
    expect(screen.getByText(/nenhuma conversa veio de anúncio/i)).toBeInTheDocument();
  });
});
