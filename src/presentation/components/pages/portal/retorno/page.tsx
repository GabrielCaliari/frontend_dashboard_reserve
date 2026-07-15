"use client";

import { useState } from "react";
import { useRoiLevel1 } from "@/src/modules/portal/presentation/hooks/use-portal-roi";
import { RoiLevel1Cards } from "@/src/presentation/components/organisms/portal/roi/roi-level1-cards";
import { AttributionWindowBanner } from "@/src/presentation/components/organisms/portal/attribution-window-banner";
import { PortalCardSkeleton } from "@/src/presentation/components/organisms/portal/skeletons";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default function PortalRetornoPage() {
  const [range] = useState(defaultRange);
  const { data: level1, isLoading: level1Loading } = useRoiLevel1(range);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Análise de Retorno</h1>
      <AttributionWindowBanner windowDays={30} />
      {level1Loading ? <PortalCardSkeleton /> : level1 && <RoiLevel1Cards data={level1} />}
      {/* Nível 2 (Task 28) and Nível 3 (Task 35) sections are appended below in later tasks */}
    </div>
  );
}
