import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  archiveArticle,
  createArticle,
  deleteArticle,
  fetchArticleById,
  fetchArticles,
  publishArticle,
  updateArticle,
} from './cms-article-service';
import { cmsApiClient } from '@/src/common/config/api';
import type { CreateArticleDto, UpdateArticleDto } from '@/src/common/@types/@cms-article';

vi.mock('@/src/common/config/api', () => ({
  cmsApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('cms-article-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normaliza listagem paginada sem display_order', async () => {
    vi.mocked(cmsApiClient.get).mockResolvedValue({
      data: {
        data: [
          {
            id: 'art-1',
            blog_id: 'blog-1',
            title: 'Primeiro artigo',
            display_title: 'Primeiro artigo',
            slug: 'primeiro-artigo',
            content: '<p>conteudo</p>',
            meta_title: 'Meta title',
            meta_description: 'Meta description',
            focus_keyword: 'keyword',
            author_id: 'author-1',
            cover_image_id: 'asset-1',
            cover_image: {
              id: 'asset-1',
              url: 'https://cdn.test/cover.jpg',
              alt_text: 'Capa',
            },
            language: 'pt_br',
            status: 'published',
            published_at: '2026-03-01T10:00:00.000Z',
            created_at: '2026-03-01T09:00:00.000Z',
            updated_at: '2026-03-01T09:30:00.000Z',
            images: [],
          },
        ],
      },
    });

    const result = await fetchArticles('blog-1', 'published', 1, 20);

    expect(cmsApiClient.get).toHaveBeenCalledWith('cms/articles', {
      params: { blogId: 'blog-1', status: 'published', page: 1, limit: 20 },
    });
    expect(result[0]).toMatchObject({
      id: 'art-1',
      blog_id: 'blog-1',
      displayTitle: 'Primeiro artigo',
      metaTitle: 'Meta title',
      metaDescription: 'Meta description',
      focusKeyword: 'keyword',
      coverImageId: 'asset-1',
      language: 'pt_br',
    });
    expect(result[0]).not.toHaveProperty('display_order');
  });

  it('normaliza detalhe com fallback de language e cover_image', async () => {
    vi.mocked(cmsApiClient.get).mockResolvedValue({
      data: {
        id: 'art-2',
        blog_id: 'blog-1',
        title: 'Second article',
        slug: 'second-article',
        content: '<p>body</p>',
        status: 'draft',
        published_at: null,
        created_at: '2026-03-01T09:00:00.000Z',
        updated_at: '2026-03-01T09:30:00.000Z',
        images: [],
      },
    });

    const result = await fetchArticleById('art-2');

    expect(cmsApiClient.get).toHaveBeenCalledWith('cms/articles/art-2');
    expect(result.language).toBe('en_us');
    expect(result.coverImage).toBeNull();
  });

  it('envia payload de criacao no contrato novo', async () => {
    const payload: CreateArticleDto = {
      displayTitle: 'Novo artigo',
      metaTitle: 'Titulo SEO',
      metaDescription: 'Descricao SEO',
      focusKeyword: 'zarp',
      slug: 'novo-artigo',
      authorId: 'author-1',
      blogId: 'blog-1',
      content: '<p>conteudo</p>',
      coverImageId: 'asset-1',
      language: 'pt_br',
    };

    vi.mocked(cmsApiClient.post).mockResolvedValue({
      data: {
        id: 'art-3',
        blog_id: 'blog-1',
        title: 'Novo artigo',
        display_title: 'Novo artigo',
        slug: 'novo-artigo',
        content: '<p>conteudo</p>',
        status: 'draft',
        language: 'pt_br',
        published_at: null,
        created_at: '2026-03-01T09:00:00.000Z',
        updated_at: '2026-03-01T09:30:00.000Z',
        images: [],
      },
    });

    const result = await createArticle(payload);

    expect(cmsApiClient.post).toHaveBeenCalledWith('cms/articles', {
      display_title: 'Novo artigo',
      meta_title: 'Titulo SEO',
      meta_description: 'Descricao SEO',
      focus_keyword: 'zarp',
      slug: 'novo-artigo',
      author_id: 'author-1',
      blog_id: 'blog-1',
      content: '<p>conteudo</p>',
      cover_image_id: 'asset-1',
      language: 'pt_br',
    });
    expect(result.language).toBe('pt_br');
  });

  it('envia payload parcial de update sem reorder', async () => {
    const payload: UpdateArticleDto = {
      metaTitle: 'SEO atualizado',
      focusKeyword: 'nova keyword',
      language: 'en_us',
    };

    vi.mocked(cmsApiClient.put).mockResolvedValue({
      data: {
        id: 'art-4',
        blog_id: 'blog-1',
        title: 'Artigo',
        display_title: 'Artigo',
        slug: 'artigo',
        content: '<p>conteudo</p>',
        meta_title: 'SEO atualizado',
        focus_keyword: 'nova keyword',
        language: 'en_us',
        status: 'draft',
        published_at: null,
        created_at: '2026-03-01T09:00:00.000Z',
        updated_at: '2026-03-01T09:30:00.000Z',
        images: [],
      },
    });

    const result = await updateArticle('art-4', payload);

    expect(cmsApiClient.put).toHaveBeenCalledWith('cms/articles/art-4', {
      meta_title: 'SEO atualizado',
      focus_keyword: 'nova keyword',
      language: 'en_us',
    });
    expect(result.metaTitle).toBe('SEO atualizado');
    expect(result.focusKeyword).toBe('nova keyword');
  });

  it('encaminha publish, archive e delete para as rotas autenticadas atuais', async () => {
    vi.mocked(cmsApiClient.post)
      .mockResolvedValueOnce({
        data: {
          id: 'art-5',
          blog_id: 'blog-1',
          title: 'Publicado',
          slug: 'publicado',
          content: '<p>body</p>',
          status: 'published',
          language: 'en_us',
          published_at: '2026-03-01T12:00:00.000Z',
          created_at: '2026-03-01T09:00:00.000Z',
          updated_at: '2026-03-01T12:00:00.000Z',
          images: [],
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: '5',
          blog_id: 'blog-1',
          title: 'Arquivado',
          slug: 'arquivado',
          content: '<p>body</p>',
          status: 'archived',
          language: 'en_us',
          published_at: '2026-03-01T12:00:00.000Z',
          created_at: '2026-03-01T09:00:00.000Z',
          updated_at: '2026-03-01T13:00:00.000Z',
          images: [],
        },
      });
    vi.mocked(cmsApiClient.delete).mockResolvedValue({ data: undefined });

    const published = await publishArticle('art-5');
    const archived = await archiveArticle(5);
    await deleteArticle('art-5');

    expect(cmsApiClient.post).toHaveBeenNthCalledWith(1, 'cms/articles/art-5/publish');
    expect(cmsApiClient.post).toHaveBeenNthCalledWith(2, 'cms/articles/5/archive');
    expect(cmsApiClient.delete).toHaveBeenCalledWith('cms/articles/art-5');
    expect(published.status).toBe('published');
    expect(archived.status).toBe('archived');
  });
});
