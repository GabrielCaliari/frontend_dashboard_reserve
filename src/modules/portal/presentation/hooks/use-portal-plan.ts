"use client";

import { useQuery } from "@tanstack/react-query";
import { portalPlanService } from "@/src/modules/portal/infrastructure/portal-plan-service";

export function usePortalPlan() {
  return useQuery({ queryKey: ["portal", "plan", "current"], queryFn: () => portalPlanService.getCurrent() });
}
