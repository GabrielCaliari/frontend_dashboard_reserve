import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteLeadAction } from "@/src/common/actions/leads/delete-lead";
import { toast } from "react-hot-toast";

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => deleteLeadAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", "list"] });
      toast.success("Lead deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete lead");
    },
  });
}
