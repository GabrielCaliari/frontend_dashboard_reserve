import { beforeEach, describe, expect, it, vi } from "vitest";
import * as fc from "fast-check";
import { createBlogSchema } from "@/src/common/schemas/cms-blog-schema";
import { articleLanguagePattern } from "@/src/common/schemas/cms-article-schema";
import { archiveArticle, publishArticle } from "../cms-article-service";
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

describe("cms property tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita nomes de blog maiores que 150 caracteres", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 151, maxLength: 400 }), (value) => {
        expect(createBlogSchema.safeParse({ name: value }).success).toBe(false);
      }),
    );
  });

  it("aceita language somente no padrao xx_yy em minusculas", () => {
    fc.assert(
      fc.property(fc.constantFrom("pt_br", "en_us", "es_mx"), (value) => {
        expect(articleLanguagePattern.test(value)).toBe(true);
      }),
    );
    fc.assert(
      fc.property(
        fc.constantFrom("PT_BR", "en-US", "ptbr", "pt-BR"),
        (value) => {
          expect(articleLanguagePattern.test(value)).toBe(false);
        },
      ),
    );
  });

  it("mantem transicoes invalidas bloqueadas em publish e archive", async () => {
    vi.mocked(cmsApiClient.post).mockRejectedValue({
      response: {
        status: 409,
        data: { message: "Invalid status transition" },
      },
    });

    await expect(publishArticle("art-1")).rejects.toBeDefined();
    await expect(archiveArticle(1)).rejects.toBeDefined();
  });

  it("ordena a listagem publica por published_at desc", async () => {
    const publicClient = { get: vi.fn() };
    publicClient.get.mockResolvedValue({
      data: {
        data: [
          {
            id: "older",
            blog_id: "blog-1",
            title: "Older",
            slug: "older",
            content: "<p>older</p>",
            status: "published",
            language: "en_us",
            published_at: "2026-03-01T10:00:00.000Z",
            created_at: "2026-03-01T09:00:00.000Z",
            updated_at: "2026-03-01T09:30:00.000Z",
            images: [],
          },
          {
            id: "newer",
            blog_id: "blog-1",
            title: "Newer",
            slug: "newer",
            content: "<p>newer</p>",
            status: "published",
            language: "en_us",
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
    vi.mocked(createPublicCmsClient).mockReturnValue(publicClient as never);

    const result = await fetchPublicArticles("secret-key", {
      page: 1,
      limit: 10,
    });

    expect(result.data[0].id).toBe("newer");
    expect(result.data[1].id).toBe("older");
  });
});
