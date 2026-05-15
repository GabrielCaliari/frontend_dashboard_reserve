import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { act, render, waitFor } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Tenant } from "@/src/shared/domain/types/@auth";
import { useTenantStore } from "@/src/shared/stores/tenant-store";

import {
  getTenantCacheScope,
  TenantQueryProvider,
} from "./tenant-query-provider";

const tenantA: Tenant = {
  id: "tenant-a",
  name: "Tenant A",
  slug: "tenant-a",
  domain: "tenant-a.test",
};

const tenantB: Tenant = {
  id: "tenant-b",
  name: "Tenant B",
  slug: "tenant-b",
  domain: "tenant-b.test",
};

function ClientProbe({ onClient }: { onClient(client: QueryClient): void }) {
  const client = useQueryClient();

  useEffect(() => {
    onClient(client);
  }, [client, onClient]);

  return null;
}

function renderProvider(
  onClient: (client: QueryClient) => void,
  children?: ReactNode,
) {
  return render(
    <TenantQueryProvider>
      <ClientProbe onClient={onClient} />
      {children}
    </TenantQueryProvider>,
  );
}

afterEach(() => {
  act(() => {
    useTenantStore.setState({ selectedTenant: null });
  });
});

describe("getTenantCacheScope", () => {
  it("uses a stable key per tenant id", () => {
    expect(getTenantCacheScope("tenant-a")).toBe("tenant:tenant-a");
    expect(getTenantCacheScope(null)).toBe("tenant:none");
  });
});

describe("TenantQueryProvider", () => {
  it("rotates and retires the entire cache when the tenant changes", async () => {
    useTenantStore.setState({ selectedTenant: tenantA });
    const clients: QueryClient[] = [];
    const onClient = vi.fn((client: QueryClient) => {
      clients.push(client);
    });

    renderProvider(onClient);
    await waitFor(() => expect(clients).toHaveLength(1));

    const clientA = clients[0];
    const cancelQueries = vi.spyOn(clientA, "cancelQueries");
    const clear = vi.spyOn(clientA, "clear");
    clientA.setQueryData(["legacy-unscoped"], "tenant-a-data");

    act(() => {
      useTenantStore.setState({ selectedTenant: tenantB });
    });

    await waitFor(() => expect(clients).toHaveLength(2));
    const clientB = clients[1];

    expect(clientB).not.toBe(clientA);
    expect(clientB.getQueryData(["legacy-unscoped"])).toBeUndefined();
    expect(cancelQueries).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(clientA.getQueryCache().getAll()).toHaveLength(0);
  });

  it("keeps the client when the selected tenant id does not change", async () => {
    useTenantStore.setState({ selectedTenant: tenantB });
    const clients: QueryClient[] = [];
    const onClient = vi.fn((client: QueryClient) => {
      clients.push(client);
    });

    renderProvider(onClient);
    await waitFor(() => expect(clients).toHaveLength(1));

    act(() => {
      useTenantStore.setState({
        selectedTenant: { ...tenantB, name: "Tenant B atualizado" },
      });
    });

    expect(clients).toHaveLength(1);
  });

  it("rotates the cache when the tenant is cleared", async () => {
    useTenantStore.setState({ selectedTenant: tenantA });
    const clients: QueryClient[] = [];

    renderProvider((client) => clients.push(client));
    await waitFor(() => expect(clients).toHaveLength(1));

    act(() => {
      useTenantStore.setState({ selectedTenant: null });
    });

    await waitFor(() => expect(clients).toHaveLength(2));
    expect(clients[1]).not.toBe(clients[0]);
  });
});
