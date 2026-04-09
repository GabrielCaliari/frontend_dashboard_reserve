import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBlog } from "../cms-blog-service";
import { createArticle, publishArticle } from "../cms-article-service";
import { fetchPublicArticles } from "../cms-public-service";
import { cmsApiClient } from "@/src/common/config/api";
import { createPublicCmsClient } from "@/src/common/config/cms-public-api-client";

vi.mock("@/src/common/config/api", () => ({
  cmsApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock("@/src/common/config/cms-public-api-client", () => ({
  createPublicCmsClient: vi.fn(),
}));

describe("cms integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantem o fluxo blog -> artigo -> publish -> listagem publica com language e cover_image", async () => {
    vi.mocked(cmsApiClient.post)
      .mockResolvedValueOnce({
        data: {
          id: 10,
          name: "Tech Blog",
          slug: "tech-blog",
          secret_key: "secret-key",
          created_at: "2026-03-01T09:00:00.000Z",
          updated_at: "2026-03-01T09:00:00.000Z",
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: "art-1",
          blog_id: 10,
          title: "TypeScript guide",
          display_title: "TypeScript guide",
          slug: "typescript-guide",
          content: "<p>guide</p>",
          language: "pt_br",
          status: "draft",
          published_at: null,
          created_at: "2026-03-01T09:10:00.000Z",
          updated_at: "2026-03-01T09:10:00.000Z",
          images: [],
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: "art-1",
          blog_id: 10,
          title: "TypeScript guide",
          display_title: "TypeScript guide",
          slug: "typescript-guide",
          content: "<p>guide</p>",
          language: "pt_br",
          cover_image: {
            id: "asset-1",
            url: "https://cdn.test/cover.jpg",
            alt_text: "Cover",
          },
          status: "published",
          published_at: "2026-03-01T11:00:00.000Z",
          created_at: "2026-03-01T09:10:00.000Z",
          updated_at: "2026-03-01T11:00:00.000Z",
          images: [],
        },
      });

    const publicClient = { get: vi.fn() };
    publicClient.get.mockResolvedValue({
      data: {
        data: [
          {
            id: "art-1",
            blog_id: 10,
            title: "TypeScript guide",
            display_title: "TypeScript guide",
            slug: "typescript-guide",
            content: "<p>guide</p>",
            language: "pt_br",
            cover_image: {
              id: "asset-1",
              url: "https://cdn.test/cover.jpg",
              alt_text: "Cover",
            },
            status: "published",
            published_at: "2026-03-01T11:00:00.000Z",
            created_at: "2026-03-01T09:10:00.000Z",
            updated_at: "2026-03-01T11:00:00.000Z",
            images: [],
          },
        ],
        meta: {
          current_page: 1,
          total_pages: 1,
          total_records: 1,
        },
      },
    });
    vi.mocked(createPublicCmsClient).mockReturnValue(publicClient as never);

    const blog = await createBlog({
      name: "Tech Blog",
      description: "A blog about tech",
      mediaCollectionId: "collection-1",
    });
    const article = await createArticle({
      displayTitle: "TypeScript guide",
      slug: "typescript-guide",
      authorId: "author-1",
      blogId: String(blog.id),
      content: "<p>guide</p>",
      language: "pt_br",
    });
    const published = await publishArticle(String(article.id));
    const publicList = await fetchPublicArticles("secret-key", {
      page: 1,
      limit: 10,
    });

    expect(article.language).toBe("pt_br");
    expect(published.coverImage?.url).toBe("https://cdn.test/cover.jpg");
    expect(publicList.data[0].coverImage?.alt_text).toBe("Cover");
    expect(publicList.data[0]).not.toHaveProperty("display_order");
  });
});
