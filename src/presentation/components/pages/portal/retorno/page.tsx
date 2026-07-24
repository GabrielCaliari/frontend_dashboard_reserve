"use client";

import { useState } from "react";
import { useRoiLevel1, useRoiLevel2, useRoiLevel3 } from "@/src/modules/portal/presentation/hooks/use-portal-roi";
import { usePortalChannels } from "@/src/modules/portal/presentation/hooks/use-portal-channels";
import { RoiLevel1Cards } from "@/src/presentation/components/organisms/portal/roi/roi-level1-cards";
import { RoiLevel2Cards } from "@/src/presentation/components/organisms/portal/roi/roi-level2-cards";
import { RoiLevel3Cards } from "@/src/presentation/components/organisms/portal/roi/roi-level3-cards";
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
  const { data: channels } = usePortalChannels();
  const botActive = channels?.find((c) => c.kind === "whatsapp")?.bot_active ?? false;
  const { data: level2, isLoading: level2Loading } = useRoiLevel2(range, botActive);
  const { data: level3 } = useRoiLevel3(range);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Análise de Retorno</h1>
      <AttributionWindowBanner windowDays={30} />
      {level1Loading ? <PortalCardSkeleton /> : level1 && <RoiLevel1Cards data={level1} />}

      {botActive && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Com o atendimento automatizado</h2>
          {level2Loading ? <PortalCardSkeleton /> : level2 && <RoiLevel2Cards data={level2} />}
        </section>
      )}

      {level3 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Com motor de reservas integrado</h2>
          <RoiLevel3Cards data={level3} />
        </section>
      )}
    </div>
  );
}
