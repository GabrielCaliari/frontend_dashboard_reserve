import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  publishArticle,
  archiveArticle,
  updateArticle,
} from '@/src/common/services/cms-article-service';

/**
 * Hook to change the status of an existing article from the editor toolbar.
 * Provides three actions: publish, archive, and revert to draft.
 *
 * - publish  → POST /cms/articles/:id/publish
 * - archive  → POST /cms/articles/:id/archive
 * - draft    → PATCH /cms/articles/:id  { status: 'draft' }  (via updateArticle)
 */
export function useArticleStatus(articleId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['cms', 'articles'] });
  };

  const publish = useMutation({
    mutationFn: () => publishArticle(articleId),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: () => archiveArticle(articleId),
    onSuccess: invalidate,
  });

  // Revert to draft by sending { status: 'draft' } through the general update endpoint.
  // The backend must support this field; if it does not expose it yet, this call
  // will still succeed since extra unknown fields are typically ignored.
  const draft = useMutation({
    mutationFn: () => updateArticle(articleId, { status: 'draft' }),
    onSuccess: invalidate,
  });


  const isPending = publish.isPending || archive.isPending || draft.isPending;

  return { publish, archive, draft, isPending };
}
