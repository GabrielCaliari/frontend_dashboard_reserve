"use client";

import { usePortalPlan } from "@/src/modules/portal/presentation/hooks/use-portal-plan";
import { useMediaQuery } from "@/src/shared/hooks/portal/use-media-query";
import { PlanTimelineDesktop } from "@/src/presentation/components/organisms/portal/plan/plan-timeline-desktop";
import { PlanListMobile } from "@/src/presentation/components/organisms/portal/plan/plan-list-mobile";
import { PortalTableSkeleton } from "@/src/presentation/components/organisms/portal/skeletons";

export default function PortalPlanoPage() {
  const { data: plan, isLoading } = usePortalPlan();
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">{plan?.titulo ?? "Plano Semestral"}</h1>
      {isLoading ? (
        <PortalTableSkeleton rows={6} />
      ) : plan && isMobile ? (
        <PlanListMobile plan={plan} />
      ) : plan ? (
        <PlanTimelineDesktop plan={plan} />
      ) : null}
    </div>
  );
}
