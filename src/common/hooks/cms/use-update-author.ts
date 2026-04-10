import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateAuthor,
  fetchAuthorById,
  UpdateAuthorDto,
} from "@/src/common/services/cms-author-service";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";
import { AUTHOR_QUERY_KEYS } from "./use-get-authors";
import type { Author } from "@/src/shared/domain/types/@cms-author";

export function useUpdateAuthor() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: ({
      authorId,
      data,
    }: {
      authorId: string;
      data: UpdateAuthorDto;
    }) => updateAuthor(authorId, data),
    onSuccess: async (updatedAuthor) => {
      // If the mutation response didn't include the expanded avatar object,
      // fetch the individual author to get the full data with avatar URL.
      let author = updatedAuthor;
      if (updatedAuthor.avatarId && !updatedAuthor.avatar?.url) {
        try {
          author = await fetchAuthorById(updatedAuthor.id);
        } catch {
          // fallback to the partial response
        }
      }

      queryClient.setQueryData(
        AUTHOR_QUERY_KEYS.all(tenantId),
        (old: Author[] | undefined) =>
          old?.map((a) => (a.id === author.id ? author : a)) ?? [author],
      );
    },
  });
}
