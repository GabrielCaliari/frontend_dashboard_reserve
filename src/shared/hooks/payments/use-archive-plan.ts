import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archivePlanAction } from "@/src/presentation/actions/payments/archive-plan";

export function useArchivePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archivePlanAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans-admin"] });
    },
  });
}
