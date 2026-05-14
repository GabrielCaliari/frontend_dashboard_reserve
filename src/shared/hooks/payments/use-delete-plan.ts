import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePlanAction } from "@/src/presentation/actions/payments/delete-plan";

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePlanAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans-admin"] });
    },
  });
}
