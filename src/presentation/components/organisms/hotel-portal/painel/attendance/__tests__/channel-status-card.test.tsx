import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BotChannelCards } from "../channel-status-card";
import type { BotChannelsResponse } from "@/src/shared/domain/types/@hotel-painel";

const base: BotChannelsResponse = {
  whatsapp: {
    connected: true, botEnabled: true, heartbeatAgeMinutes: 1, heartbeatStale: false,
    activeConversations: 7, pausedAwaitingHuman: 2, mode: "hospedin", aiEnabled: true,
  },
  instagram: { connected: false, tokenStatus: null },
  metaAds: { connected: true },
};

describe("BotChannelCards", () => {
  it("mostra o modo de operacao e a IA", () => {
    render(<BotChannelCards channels={base} />);
    expect(screen.getByText(/reserva direto no pms/i)).toBeInTheDocument();
    expect(screen.getByText(/ia: ligada/i)).toBeInTheDocument();
    expect(screen.getByText(/7 conversas ativas/i)).toBeInTheDocument();
  });

  it("modo handoff e IA desligada", () => {
    render(
      <BotChannelCards
        channels={{ ...base, whatsapp: { ...base.whatsapp, mode: "handoff", aiEnabled: false } }}
      />,
    );
    expect(screen.getByText(/qualifica e passa para a equipe/i)).toBeInTheDocument();
    expect(screen.getByText(/ia: desligada/i)).toBeInTheDocument();
  });

  it("sem sinal ha mais de 5 minutos avisa que o bot esta fora do ar", () => {
    render(
      <BotChannelCards
        channels={{
          ...base,
          whatsapp: { ...base.whatsapp, connected: false, heartbeatStale: true, heartbeatAgeMinutes: 12 },
        }}
      />,
    );
    expect(screen.getByText(/sem sinal do bot há 12 min/i)).toBeInTheDocument();
  });

  it("backend antigo (sem modo nem IA) nao quebra", () => {
    const { whatsapp } = base;
    render(
      <BotChannelCards
        channels={{ ...base, whatsapp: { ...whatsapp, mode: undefined, aiEnabled: undefined } }}
      />,
    );
    expect(screen.queryByText(/ia:/i)).not.toBeInTheDocument();
  });
});
