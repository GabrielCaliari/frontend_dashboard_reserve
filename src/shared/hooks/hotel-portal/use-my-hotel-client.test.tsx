import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTestQueryClient, createTestQueryWrapper } from "@/src/shared/query/test-query-provider";
import { useHotelClientForTenant } from "./use-my-hotel-client";

const getClientForCurrentTenant = vi.fn();

vi.mock("@/src/modules/hotel-portal/infrastructure/adapters", () => ({
  hotelPortalService: {
    getClientForCurrentTenant: () => getClientForCurrentTenant(),
    getMyClients: vi.fn(),
  },
}));

function setup() {
  return { wrapper: createTestQueryWrapper(createTestQueryClient()) };
}

describe("useHotelClientForTenant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("nao consulta sem tenant", () => {
    const { wrapper } = setup();
    renderHook(() => useHotelClientForTenant(null), { wrapper });
    expect(getClientForCurrentTenant).not.toHaveBeenCalled();
  });

  it("devolve o cliente do tenant atual", async () => {
    getClientForCurrentTenant.mockResolvedValue({ id: "c1", tenant_id: "t1" });
    const { wrapper } = setup();
    const { result } = renderHook(() => useHotelClientForTenant("t1"), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual({ id: "c1", tenant_id: "t1" }));
  });

  it("descarta cliente que pertence a outro tenant", async () => {
    getClientForCurrentTenant.mockResolvedValue({ id: "c2", tenant_id: "outro" });
    const { wrapper } = setup();
    const { result } = renderHook(() => useHotelClientForTenant("t1"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
