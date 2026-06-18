import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { createTestQueryClient, createTestQueryWrapper } from "@/src/shared/query/test-query-provider";
import { notificationKeys } from "./notification-query-keys";
import { useNotificationInbox } from "./use-notification-inbox";
import { useUnreadCount } from "./use-unread-count";

import { apiClient } from "@/src/infraestructure/axios/api";

vi.mock("@/src/infraestructure/axios/api", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const mockedGet = apiClient.get as Mock;
const mockedPost = apiClient.post as Mock;

function setup() {
  const client = createTestQueryClient();
  return { client, wrapper: createTestQueryWrapper(client) };
}

describe("notification read-state synchronization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGet.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("unread-count")) {
        return Promise.resolve({ data: { count: 1 } } as never);
      }
      return Promise.resolve({
        data: {
          data: [
            {
              id: "receipt-1",
              notificationId: "notification-1",
              viewed: false,
              firstViewedAt: null,
              Notification: { id: "notification-1" },
            },
          ],
          total: 1,
        },
      } as never);
    });
    mockedPost.mockResolvedValue({ data: { ok: true } } as never);
  });

  it("marks an item as viewed with an empty object body, never a null body", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useNotificationInbox("tenant-1"), { wrapper });

    await waitFor(() => expect(result.current.data).toHaveLength(1));

    await act(async () => {
      result.current.markAsViewed("notification-1");
    });

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith(
        "/notifications/tenant/notification-1/view",
        {},
        expect.objectContaining({ headers: { "x-tenant-id": "tenant-1" } }),
      ),
    );
    const [, bodyArg] = mockedPost.mock.calls[0];
    expect(bodyArg).not.toBeNull();
  });

  it("invalidates the unread-count query after marking one item as viewed", async () => {
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useNotificationInbox("tenant-1"), { wrapper });

    await waitFor(() => expect(result.current.data).toHaveLength(1));

    await act(async () => {
      result.current.markAsViewed("notification-1");
    });

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: notificationKeys.unreadCount("tenant-1") }),
    );
  });

  it("rolls back the optimistic update when marking all items partially fails", async () => {
    mockedPost.mockRejectedValueOnce(new Error("request failed"));
    const { wrapper } = setup();
    const { result } = renderHook(() => useNotificationInbox("tenant-1"), { wrapper });

    await waitFor(() => expect(result.current.data).toHaveLength(1));

    await act(async () => {
      result.current.markAllAsViewed();
    });

    await waitFor(() => expect(result.current.data.every((item) => !item.viewed)).toBe(true));
  });

  it("fetches the unread count for the current tenant", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useUnreadCount("tenant-1"), { wrapper });

    await waitFor(() => expect(result.current).toBe(1));
    expect(mockedGet).toHaveBeenCalledWith(
      "/notifications/tenant/me/unread-count",
      expect.objectContaining({ headers: { "x-tenant-id": "tenant-1" } }),
    );
  });
});
