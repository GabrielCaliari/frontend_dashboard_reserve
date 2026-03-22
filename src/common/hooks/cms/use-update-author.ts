import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAuthor, UpdateAuthorDto } from '@/src/common/services/cms-author-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';
import { AUTHOR_QUERY_KEYS } from './use-get-authors';
import type { Author } from '@/src/common/@types/@cms-author';

export function useUpdateAuthor() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: ({ authorId, data }: { authorId: string; data: UpdateAuthorDto }) =>
      updateAuthor(authorId, data),
    onSuccess: (updatedAuthor) => {
      // Update the specific item in the list cache directly — preserves avatar
      // URL from the mutation response without triggering a lossy refetch.
      queryClient.setQueryData(
        AUTHOR_QUERY_KEYS.all(tenantId),
        (old: Author[] | undefined) =>
          old?.map((a) => (a.id === updatedAuthor.id ? updatedAuthor : a)) ?? [updatedAuthor],
      );
    },
  });
}
