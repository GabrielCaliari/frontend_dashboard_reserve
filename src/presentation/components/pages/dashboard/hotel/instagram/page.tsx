"use client";

import { useMemo, useState } from "react";
import { Users, Eye, Heart } from "lucide-react";
import {
  useActiveHotelClient,
  useHotelInstagram,
} from "@/src/shared/hooks/hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { TopPosts } from "@/src/presentation/components/organisms/hotel-portal/painel/instagram/top-posts";
import { MetricCard, PeriodPicker } from "@/src/presentation/components/organisms/hotel-portal/ui";
import {
  resolvePreset,
  type PeriodPreset,
} from "@/src/presentation/components/organisms/hotel-portal/ui/period-picker";
import { formatNumber, formatPercent } from "@/src/shared/utils/hotel-format";

export default function HotelInstagramPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const [preset, setPreset] = useState<PeriodPreset>("current-month");
  const period = useMemo(() => resolvePreset(preset), [preset]);

  const { data, isLoading, isError } = useHotelInstagram(
    client?.id ?? null,
    period,
  );

  return (
    <PainelPageShell
      title="Instagram"
      description="Alcance, engajamento e os posts que mais funcionaram no período."
      isLoading={clientLoading || isLoading}
      isError={isError}
      errorMessage="Erro ao carregar os dados do Instagram. Verifique se a conta está conectada."
      actions={<PeriodPicker preset={preset} onChange={(p) => setPreset(p)} />}
    >
      {data && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* Seguidores e um total corrente, nao um fluxo do periodo: o backend
              compara o snapshot do inicio vs. o do fim, nao "vs. periodo
              anterior" como as demais metricas. */}
          <MetricCard
            label="Seguidores"
            value={formatNumber(data.followers.value)}
            delta={data.followers.delta}
            deltaKind="abs"
            source={data.followers.source}
            icon={Users}
            accent
          />
          <MetricCard
            label="Alcance"
            value={formatNumber(data.reach.value)}
            delta={data.reach.delta}
            deltaKind="abs"
            source={data.reach.source}
            icon={Eye}
          />
          <MetricCard
            label="Interações"
            value={formatNumber(data.engagement.totalInteractions.value)}
            delta={data.engagement.totalInteractions.delta}
            deltaKind="abs"
            source={data.engagement.totalInteractions.source}
            icon={Heart}
          />
          <MetricCard
            label="Taxa de engajamento"
            value={formatPercent(data.engagement.rate.value)}
            source={data.engagement.rate.source}
          />
        </div>
      )}

      <PainelSection title="Posts com mais engajamento">
        <TopPosts posts={data?.topPosts ?? []} />
      </PainelSection>
    </PainelPageShell>
  );
}
