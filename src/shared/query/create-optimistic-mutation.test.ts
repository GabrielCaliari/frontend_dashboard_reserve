import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import { createOptimisticMutationHandlers } from "./create-optimistic-mutation";

describe("createOptimisticMutationHandlers", () => {
  it("updates every matching cache and restores all snapshots on failure", async () => {
    const client = new QueryClient();
    const root = ["marketing", "tenant", "tenant-1", "prospecting"] as const;
    const detailKey = [...root, "detail", "job-1"] as const;
    const listKey = [...root, "list", { page: 1 }] as const;
    client.setQueryData(detailKey, { id: "job-1", status: "running" });
    client.setQueryData(listKey, { items: [{ id: "job-1", status: "running" }] });

    const handlers = createOptimisticMutationHandlers({
      client,
      queryKey: root,
      update: (current: unknown) => {
        if (
          current &&
          typeof current === "object" &&
          "items" in current &&
          Array.isArray((current as { items: unknown }).items)
        ) {
          return {
            ...current,
            items: (current as { items: { id: string; status: string }[] }).items.map(
              (item) => (item.id === "job-1" ? { ...item, status: "paused" } : item),
            ),
          };
        }
        return { ...(current as object), status: "paused" };
      },
    });

    const context = await handlers.onMutate();
    expect(client.getQueryData(detailKey)).toMatchObject({ status: "paused" });
    expect(client.getQueryData(listKey)).toMatchObject({ items: [{ status: "paused" }] });

    handlers.onError(new Error("conflict"), undefined, context);
    expect(client.getQueryData(detailKey)).toMatchObject({ status: "running" });
    expect(client.getQueryData(listKey)).toMatchObject({ items: [{ status: "running" }] });
  });
});
