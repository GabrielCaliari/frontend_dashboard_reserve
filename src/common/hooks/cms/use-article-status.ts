import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  publishArticle,
  archiveArticle,
  updateArticle,
  scheduleArticle,
  updatePublishedAt,
} from "@/src/common/services/cms-article-service";

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
    queryClient.invalidateQueries({ queryKey: ["cms", "articles"] });
  };

  const publish = useMutation({
    mutationFn: () => publishArticle(articleId),
    onSuccess: invalidate,
  });

  const schedule = useMutation({
    mutationFn: (scheduledAt: string) =>
      scheduleArticle(articleId, scheduledAt),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: () => archiveArticle(articleId),
    onSuccess: invalidate,
  });

  const draft = useMutation({
    mutationFn: () => updateArticle(articleId, { status: "draft" }),
    onSuccess: invalidate,
  });

  const editPublishedAt = useMutation({
    mutationFn: (publishedAt: string) =>
      updatePublishedAt(articleId, publishedAt),
    onSuccess: invalidate,
  });

  const isPending =
    publish.isPending ||
    schedule.isPending ||
    archive.isPending ||
    draft.isPending ||
    editPublishedAt.isPending;

  return { publish, schedule, archive, draft, editPublishedAt, isPending };
}
