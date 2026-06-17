import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/modules/cms/infrastructure/article-adapters", () => ({
  fetchArticles: vi.fn(),
}));

import { fetchArticles } from "@/src/modules/cms/infrastructure/article-adapters";
import { queryArticleEntityList } from "./cms-article-entity-list-adapter";

// The plan's reference test has no isolation between cases, so the second
// test's toHaveBeenCalledTimes(1) assertion counts calls left over from the
// first test too. Reset the mock's call history before each test.
beforeEach(() => {
  vi.mocked(fetchArticles).mockClear();
});

const article = (overrides: Record<string, unknown> = {}) => ({
  id: "1",
  blog_id: "1",
  title: "Guia de check-in",
  displayTitle: "Guia de check-in",
  slug: "guia-check-in",
  content: "",
  status: "draft",
  published_at: null,
  scheduled_at: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  images: [],
  ...overrides,
});

describe("queryArticleEntityList", () => {
  it("fetches the full blog once and applies local search filtering", async () => {
    vi.mocked(fetchArticles).mockResolvedValue([
      article({ id: "1", title: "Guia de check-in", slug: "guia-check-in" }),
      article({ id: "2", title: "Política de cancelamento", slug: "politica-cancelamento" }),
    ] as never);

    const query = queryArticleEntityList("blog-1");
    const page = await query({
      page: 1,
      pageSize: 30,
      search: "check-in",
      filters: { status: "" },
    });

    expect(fetchArticles).toHaveBeenCalledWith("blog-1", undefined, 1, 500);
    expect(page.items).toHaveLength(1);
    expect((page.items[0] as { id: string }).id).toBe("1");
  });

  it("filters by status locally without a second network request", async () => {
    vi.mocked(fetchArticles).mockResolvedValue([
      article({ id: "1", status: "draft" }),
      article({ id: "2", status: "published" }),
    ] as never);

    const query = queryArticleEntityList();
    const page = await query({
      page: 1,
      pageSize: 30,
      search: "",
      filters: { status: "published" },
    });

    expect(fetchArticles).toHaveBeenCalledTimes(1);
    expect(page.items.map((item) => (item as { id: string }).id)).toEqual(["2"]);
  });
});
