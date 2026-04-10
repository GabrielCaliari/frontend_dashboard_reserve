import { useQuery } from "@tanstack/react-query";
import { listPlansAction } from "@/src/common/actions/payments/list-plans";
import type { StripePlan } from "@/src/shared/domain/types/@payments";

export function usePlans() {
  return useQuery<StripePlan[]>({
    queryKey: ["plans-admin"],
    queryFn: () => listPlansAction(),
    staleTime: 30000,
  });
}
