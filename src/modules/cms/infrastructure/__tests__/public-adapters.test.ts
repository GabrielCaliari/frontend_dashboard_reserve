import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchPublicArticleBySlug,
  fetchPublicArticles,
} from "../public-adapters";
import { createPublicCmsClient } from "@/src/infraestructure/axios/cms-public-api-client";

vi.mock("@/src/infraestructure/axios/cms-public-api-client", () => ({
  createPublicCmsClient: vi.fn(),
}));

describe("cms-public-service", () => {
  const secretKey = "secret-key";
  const mockClient = {
    get: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createPublicCmsClient).mockReturnValue(mockClient as never);
  });

  it("ordena artigos publicos por published_at desc e preserva cover_image", async () => {
    mockClient.get.mockResolvedValue({
      data: {
        data: [
          {
            id: "older",
            blog_id: "blog-1",
            title: "Older",
            display_title: "Older",
            slug: "older",
            content: "<p>older</p>",
            status: "published",
            language: "en_us",
            cover_image: {
              id: "asset-2",
              url: "https://cdn.test/older.jpg",
              alt_text: "Older cover",
            },
            published_at: "2026-03-01T10:00:00.000Z",
            created_at: "2026-03-01T09:00:00.000Z",
            updated_at: "2026-03-01T09:30:00.000Z",
            images: [],
          },
          {
            id: "newer",
            blog_id: "blog-1",
            title: "Newer",
            display_title: "Newer",
            slug: "newer",
            content: "<p>newer</p>",
            status: "published",
            language: "pt_br",
            cover_image: {
              id: "asset-1",
              url: "https://cdn.test/newer.jpg",
              alt_text: "Newer cover",
            },
            published_at: "2026-03-03T10:00:00.000Z",
            created_at: "2026-03-03T09:00:00.000Z",
            updated_at: "2026-03-03T09:30:00.000Z",
            images: [],
          },
        ],
        meta: {
          current_page: 1,
          total_pages: 1,
          total_records: 2,
        },
      },
    });

    const result = await fetchPublicArticles(secretKey, { page: 1, limit: 10 });

    expect(createPublicCmsClient).toHaveBeenCalledWith(secretKey);
    expect(result.data[0].id).toBe("newer");
    expect(result.data[0].coverImage?.url).toBe("https://cdn.test/newer.jpg");
    expect(result.data[0]).not.toHaveProperty("display_order");
  });

  it("busca um artigo publico por slug no contrato novo", async () => {
    mockClient.get.mockResolvedValue({
      data: {
        id: "newer",
        blog_id: "blog-1",
        title: "Newer",
        display_title: "Newer",
        slug: "newer",
        content: "<p>newer</p>",
        status: "published",
        language: "pt_br",
        cover_image: {
          id: "asset-1",
          url: "https://cdn.test/newer.jpg",
          alt_text: "Newer cover",
        },
        published_at: "2026-03-03T10:00:00.000Z",
        created_at: "2026-03-03T09:00:00.000Z",
        updated_at: "2026-03-03T09:30:00.000Z",
        images: [],
      },
    });

    const result = await fetchPublicArticleBySlug(secretKey, "newer");

    expect(mockClient.get).toHaveBeenCalledWith("/articles/newer");
    expect(result.language).toBe("pt_br");
    expect(result.coverImage?.alt_text).toBe("Newer cover");
  });
});
