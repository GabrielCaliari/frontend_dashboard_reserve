import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import {
  applyOptimisticEntityUpdate,
  entityListQueryScope,
  removeOptimisticEntity,
  restoreEntityListSnapshot,
  snapshotEntityListPages,
} from "./optimistic";
import type { EntityPage } from "./types";

interface Article {
  id: string;
  title: string;
  status: string;
}

const page = (
  items: Article[],
  total = items.length,
): EntityPage<Article> => ({
  items,
  total,
  page: 1,
  pageSize: 30,
});

function seed() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  client.setQueryData(
    ["entity-list", "cms-articles", "tenant-1", { page: 1, search: "" }],
    page([
      { id: "a", title: "Alpha", status: "draft" },
      { id: "b", title: "Beta", status: "draft" },
    ]),
  );
  client.setQueryData(
    ["entity-list", "cms-articles", "tenant-1", { page: 1, search: "alp" }],
    page([{ id: "a", title: "Alpha", status: "draft" }]),
  );
  client.setQueryData(
    ["entity-list", "leads", "tenant-1", { page: 1, search: "" }],
    page([{ id: "a", title: "Alpha lead", status: "new" }]),
  );

  return client;
}

const getItems = (client: QueryClient, key: unknown[]) =>
  client.getQueryData<EntityPage<Article>>(key as never)?.items;

describe("applyOptimisticEntityUpdate", () => {
  it("patches the matching entity across every cached page of the list", () => {
    const client = seed();

    applyOptimisticEntityUpdate<Article>(client, {
      scope: entityListQueryScope("cms-articles"),
      getKey: (article) => article.id,
      key: "a",
      update: (article) => ({ ...article, status: "published" }),
    });

    expect(
      getItems(client, ["entity-list", "cms-articles", "tenant-1", { page: 1, search: "" }]),
    ).toEqual([
      { id: "a", title: "Alpha", status: "published" },
      { id: "b", title: "Beta", status: "draft" },
    ]);
    expect(
      getItems(client, ["entity-list", "cms-articles", "tenant-1", { page: 1, search: "alp" }]),
    ).toEqual([{ id: "a", title: "Alpha", status: "published" }]);
  });

  it("leaves other entity lists alone", () => {
    const client = seed();

    applyOptimisticEntityUpdate<Article>(client, {
      scope: entityListQueryScope("cms-articles"),
      getKey: (article) => article.id,
      key: "a",
      update: (article) => ({ ...article, status: "published" }),
    });

    expect(
      getItems(client, ["entity-list", "leads", "tenant-1", { page: 1, search: "" }]),
    ).toEqual([{ id: "a", title: "Alpha lead", status: "new" }]);
  });

  it("is a no-op when the key is not cached", () => {
    const client = seed();

    applyOptimisticEntityUpdate<Article>(client, {
      scope: entityListQueryScope("cms-articles"),
      getKey: (article) => article.id,
      key: "missing",
      update: (article) => ({ ...article, status: "published" }),
    });

    expect(
      getItems(client, ["entity-list", "cms-articles", "tenant-1", { page: 1, search: "" }]),
    ).toEqual([
      { id: "a", title: "Alpha", status: "draft" },
      { id: "b", title: "Beta", status: "draft" },
    ]);
  });
});

describe("removeOptimisticEntity", () => {
  it("drops the entity and decrements the total on every cached page", () => {
    const client = seed();

    removeOptimisticEntity<Article>(client, {
      scope: entityListQueryScope("cms-articles"),
      getKey: (article) => article.id,
      key: "a",
    });

    const first = client.getQueryData<EntityPage<Article>>([
      "entity-list",
      "cms-articles",
      "tenant-1",
      { page: 1, search: "" },
    ] as never);

    expect(first?.items).toEqual([{ id: "b", title: "Beta", status: "draft" }]);
    expect(first?.total).toBe(1);
  });

  it("never drives the total below zero", () => {
    const client = new QueryClient();
    client.setQueryData(
      ["entity-list", "cms-articles", "tenant-1", { page: 1 }],
      {
        items: [{ id: "a", title: "Alpha", status: "draft" }],
        total: 0,
        page: 1,
        pageSize: 30,
      },
    );

    removeOptimisticEntity<Article>(client, {
      scope: entityListQueryScope("cms-articles"),
      getKey: (article) => article.id,
      key: "a",
    });

    expect(
      client.getQueryData<EntityPage<Article>>([
        "entity-list",
        "cms-articles",
        "tenant-1",
        { page: 1 },
      ] as never)?.total,
    ).toBe(0);
  });
});

describe("snapshotEntityListPages / restoreEntityListSnapshot", () => {
  it("round-trips the cache so a failed mutation can roll back", () => {
    const client = seed();
    const snapshot = snapshotEntityListPages<Article>(
      client,
      entityListQueryScope("cms-articles"),
    );

    removeOptimisticEntity<Article>(client, {
      scope: entityListQueryScope("cms-articles"),
      getKey: (article) => article.id,
      key: "a",
    });
    expect(
      getItems(client, ["entity-list", "cms-articles", "tenant-1", { page: 1, search: "" }]),
    ).toHaveLength(1);

    restoreEntityListSnapshot(client, snapshot);

    expect(
      getItems(client, ["entity-list", "cms-articles", "tenant-1", { page: 1, search: "" }]),
    ).toEqual([
      { id: "a", title: "Alpha", status: "draft" },
      { id: "b", title: "Beta", status: "draft" },
    ]);
  });
});
