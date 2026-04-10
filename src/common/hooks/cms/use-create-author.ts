import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createAuthor,
  fetchAuthorById,
  CreateAuthorDto,
} from "@/src/common/services/cms-author-service";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";
import { AUTHOR_QUERY_KEYS } from "./use-get-authors";
import type { Author } from "@/src/shared/domain/types/@cms-author";

export function useCreateAuthor() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (data: CreateAuthorDto) => createAuthor(data),
    onSuccess: async (newAuthor) => {
      // If the creation response didn't include the expanded avatar,
      // fetch the full author detail to get the avatar URL.
      let author = newAuthor;
      if (newAuthor.avatarId && !newAuthor.avatar?.url) {
        try {
          author = await fetchAuthorById(newAuthor.id);
        } catch {
          // fallback to the partial response
        }
      }

      queryClient.setQueryData(
        AUTHOR_QUERY_KEYS.all(tenantId),
        (old: Author[] | undefined) => (old ? [...old, author] : [author]),
      );
    },
  });
}
