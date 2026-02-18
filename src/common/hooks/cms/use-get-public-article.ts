import { useQuery } from '@tanstack/react-query';
import { articleService } from '@/src/common/services/article-service';

export function useGetPublicArticle(secretKey: string, slug: string) {
  return useQuery({
    queryKey: ['public-article', secretKey, slug],
    queryFn: () => articleService.getPublicArticleBySlug(secretKey, slug),
    enabled: !!secretKey && !!slug,
  });
}
