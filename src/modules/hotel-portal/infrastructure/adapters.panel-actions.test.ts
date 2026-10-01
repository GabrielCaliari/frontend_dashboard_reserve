import { describe, it, expect, vi, beforeEach } from "vitest";

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }));
vi.mock("@/src/infraestructure/axios/api", () => ({ default: apiMock }));

import { hotelPortalService } from "./adapters";

describe("acoes humanas repassadas ao bot (ok:false em 2xx)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mover estagio propaga ok:false do backend", async () => {
    apiMock.patch.mockResolvedValue({ data: { id: "evt_1", ok: false, state: null } });
    const r = await hotelPortalService.moveFunnelStage("t1", "+5511", { para_estagio: "PERDIDO", motivo: "caro" } as never);
    expect(r).toEqual({ ok: false, state: null });
  });

  it("retomar, pausar e estender normalizam a resposta", async () => {
    apiMock.post.mockResolvedValue({ data: { ok: false, state: null } });
    expect(await hotelPortalService.resumeConversation("t1", "+5511", {})).toEqual({ ok: false, state: null });
    expect(await hotelPortalService.pauseConversation("t1", "+5511", {})).toEqual({ ok: false, state: null });
    expect(await hotelPortalService.extendHold("t1", "+5511", {})).toEqual({ ok: false, state: null });
  });

  it("resposta sem ok (backend antigo) conta como entregue", async () => {
    apiMock.patch.mockResolvedValue({ data: undefined });
    expect(await hotelPortalService.moveFunnelStage("t1", "+5511", {} as never)).toEqual({ ok: true, state: null });
  });

  it("aprovar proposta desembrulha o envelope e carrega ok:false", async () => {
    apiMock.patch.mockResolvedValue({ data: { data: { id: "p1", status: "APROVADA", ok: false, state: null } } });
    const r = await hotelPortalService.approveBotConfigProposal("t1", "p1");
    expect(r).toMatchObject({ id: "p1", status: "APROVADA", ok: false });
  });
});
