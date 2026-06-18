import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { createTestQueryClient, createTestQueryWrapper } from "@/src/shared/query/test-query-provider";
import { useTenantNotification } from "./use-tenant-notification";

import { apiClient } from "@/src/infraestructure/axios/api";

vi.mock("@/src/infraestructure/axios/api", () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = apiClient.get as Mock;

function setup() {
  return { wrapper: createTestQueryWrapper(createTestQueryClient()) };
}

describe("useTenantNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGet.mockResolvedValue({
      data: {
        id: "receipt-1",
        notificationId: "notification-1",
        viewed: true,
        firstViewedAt: "2026-07-25T16:18:29.931Z",
        Notification: { id: "notification-1", title: "Novo lead recebido" },
      },
    } as never);
  });

  it("fetches a single notification from the tenant endpoint with the tenant header", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useTenantNotification("tenant-1", "notification-1"), { wrapper });

    await waitFor(() => expect(result.current.notification).not.toBeNull());
    expect(mockedGet).toHaveBeenCalledWith(
      "/notifications/tenant/notification-1",
      expect.objectContaining({ headers: { "x-tenant-id": "tenant-1" } }),
    );
    expect(result.current.notification.Notification.title).toBe("Novo lead recebido");
  });

  it("does not fetch when tenant or id is missing", async () => {
    const { wrapper } = setup();
    renderHook(() => useTenantNotification(null, "notification-1"), { wrapper });
    renderHook(() => useTenantNotification("tenant-1", null), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mockedGet).not.toHaveBeenCalled();
  });
});
