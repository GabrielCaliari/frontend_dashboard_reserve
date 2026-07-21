"use client";

import { useQuery } from "@tanstack/react-query";
import { portalGoalsService } from "@/src/modules/portal/infrastructure/portal-goals-service";

export function useMetricGoals() {
  return useQuery({ queryKey: ["portal", "goals"], queryFn: () => portalGoalsService.getGoals() });
}
