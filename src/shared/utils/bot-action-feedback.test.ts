import { describe, it, expect, vi, beforeEach } from "vitest";

const toastMock = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }));
vi.mock("react-hot-toast", () => ({ default: toastMock }));

import { notifyBotAction, isBotUnreachableError, BOT_NOT_NOTIFIED_MESSAGE } from "./bot-action-feedback";

describe("notifyBotAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sucesso quando o bot confirmou", () => {
    expect(notifyBotAction({ ok: true }, "feito")).toBe(true);
    expect(toastMock.success).toHaveBeenCalledWith("feito");
    expect(toastMock).not.toHaveBeenCalled();
  });

  it("aviso (nao erro) quando ok:false", () => {
    expect(notifyBotAction({ ok: false }, "feito")).toBe(false);
    expect(toastMock).toHaveBeenCalledWith(BOT_NOT_NOTIFIED_MESSAGE, expect.any(Object));
    expect(toastMock.success).not.toHaveBeenCalled();
  });

  it("resposta sem ok (backend antigo) conta como sucesso", () => {
    expect(notifyBotAction(undefined, "feito")).toBe(true);
  });
});

describe("isBotUnreachableError", () => {
  it("reconhece 502", () => {
    expect(isBotUnreachableError({ response: { status: 502 } })).toBe(true);
    expect(isBotUnreachableError({ response: { status: 500 } })).toBe(false);
    expect(isBotUnreachableError(null)).toBe(false);
  });
});
