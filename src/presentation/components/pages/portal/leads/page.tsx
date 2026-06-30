"use client";

import { useState } from "react";
import { usePortalLeadsCamada1 } from "@/src/modules/portal/presentation/hooks/use-portal-leads";
import { AcquisitionFunnel } from "@/src/presentation/components/organisms/portal/funnel/acquisition-funnel";
import {
  DeviceBreakdownTable,
  CityBreakdownTable,
} from "@/src/presentation/components/organisms/portal/leads/breakdown-table";
import { buildCamada1FunnelStages } from "@/src/modules/portal/domain/portal-leads";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default function PortalLeadsPage() {
  const [range] = useState(defaultRange);
  const { data, isLoading } = usePortalLeadsCamada1(range);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Leads e Funil</h1>
      <p className="text-sm text-muted-foreground">
        Camada 1 — o dado que a Reserve garante hoje: cliques nos links rastreáveis até leads gerados. O funil
        completo do atendimento (qualificados, prontos para fechar) aparece aqui quando o bot estiver ativo.
      </p>

      {!isLoading && data && <AcquisitionFunnel stages={buildCamada1FunnelStages(data)} />}

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Por dispositivo</h2>
          <DeviceBreakdownTable rows={data?.by_device ?? []} />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Por cidade</h2>
          <CityBreakdownTable rows={data?.by_city ?? []} />
        </div>
      </section>
    </div>
  );
}
