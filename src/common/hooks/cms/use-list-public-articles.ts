import { useQuery } from '@tanstack/react-query';
import { articleService } from '@/src/common/services/article-service';
import type { PublicArticleListParams } from '@/src/common/@types/@article';

export function useListPublicArticles(secretKey: string, params?: PublicArticleListParams) {
  return useQuery({
    queryKey: ['public-articles', secretKey, params?.page, params?.limit],
    queryFn: () => articleService.listPublicArticles(secretKey, params),
    enabled: !!secretKey,
  });
}
