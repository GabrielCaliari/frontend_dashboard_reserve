import { describe, expect, it, vi, beforeEach } from "vitest";
import { portalAuthService } from "../portal-auth-service";
import api from "@/src/infraestructure/axios/api";
import { ClientRole } from "@/src/modules/portal/domain/portal-auth";

vi.mock("@/src/infraestructure/axios/api", () => ({
  default: { post: vi.fn() },
}));

describe("portalAuthService.login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("posts credentials to /portal/auth/login and returns the auth payload", async () => {
    const mockResponse = {
      session_id: "sess-1",
      session_token: "tok-1",
      details: {
        name: "Dona Tereza",
        email: "dona@tereza.com",
        role: ClientRole.owner,
        tenant: { id: "t1", name: "Pousada Dona Tereza", slug: "dona-tereza", entry_date: "2026-01-10" },
      },
    };
    vi.mocked(api.post).mockResolvedValue({ data: mockResponse });

    const result = await portalAuthService.login({ email: "dona@tereza.com", password: "x" });

    expect(api.post).toHaveBeenCalledWith("/portal/auth/login", {
      email: "dona@tereza.com",
      password: "x",
    });
    expect(result).toEqual(mockResponse);
  });
});
