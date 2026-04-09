import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blogService } from "@/src/common/services/blog-service";
import type { BlogCreateInput } from "@/src/common/@types/@blog";
import { useSelectedTenantId } from "@/src/common/stores/tenant-store";

export function useCreateBlog() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: async (data: BlogCreateInput) => {
      console.log("Creating blog with data:", data);
      console.log("Tenant ID:", tenantId);
      try {
        const result = await blogService.createBlog(data);
        console.log("Blog created successfully:", result);
        return result;
      } catch (error) {
        console.error("Error creating blog:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs", tenantId] });
    },
    onError: (error) => {
      console.error("Mutation error:", error);
    },
  });
}
