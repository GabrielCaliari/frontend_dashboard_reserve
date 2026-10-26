"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Heart, Instagram, Users } from "lucide-react";
import {
  useActiveHotelClient,
  useHotelInstagram,
} from "@/src/shared/hooks/hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { TopPosts } from "@/src/presentation/components/organisms/hotel-portal/painel/instagram/top-posts";
import {
  DateRangeFilter,
  MONTH_PRESETS,
  currentMonth,
  type DateRange,
} from "@/src/presentation/components/organisms/hotel-portal/painel/date-range-filter";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { ScreenLinks } from "@/src/presentation/components/organisms/hotel-portal/painel/screen-links";
import { MetricCard } from "@/src/presentation/components/organisms/hotel-portal/ui";
import { formatNumber, formatPercent } from "@/src/shared/utils/hotel-format";

export default function HotelInstagramPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const [period, setPeriod] = useState<DateRange>(currentMonth);

  const { data, isLoading, isError } = useHotelInstagram(
    client?.id ?? null,
    period,
  );

  return (
    <PainelPageShell
      title="Instagram"
      description="Seguidores, alcance e os posts que mais funcionaram no período."
      isLoading={clientLoading || isLoading}
      actions={<DateRangeFilter value={period} onChange={setPeriod} presets={MONTH_PRESETS} />}
    >
      {isError || !data ? (
        <PortalEmptyState
          icon={Instagram}
          title="Instagram ainda não conectado"
          description="Os números aparecem quando a conta profissional do Instagram da pousada estiver vinculada à RÉSERVE."
        />
      ) : (
        <>
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
              hint="Variação entre o início e o fim do período"
            />
            <MetricCard
              label="Alcance"
              value={formatNumber(data.reach.value)}
              delta={data.reach.delta}
              deltaKind="abs"
              source={data.reach.source}
              icon={Eye}
              hint="Contas diferentes que viram algum post"
            />
            <MetricCard
              label="Interações"
              value={formatNumber(data.engagement.totalInteractions.value)}
              delta={data.engagement.totalInteractions.delta}
              deltaKind="abs"
              source={data.engagement.totalInteractions.source}
              icon={Heart}
              hint="Curtidas, comentários, salvamentos e compartilhamentos"
            />
            <MetricCard
              label="Taxa de engajamento"
              value={formatPercent(data.engagement.rate.value)}
              source={data.engagement.rate.source}
              hint="Interações ÷ alcance"
            />
          </div>

          <PainelSection title="Os 3 posts com mais engajamento">
            <TopPosts posts={data.topPosts ?? []} />
          </PainelSection>
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Para conectar o Instagram Direct ao atendimento do bot, veja{" "}
        <Link className="font-medium text-primary hover:underline" href="/dashboard/hotel/config">
          Configurações
        </Link>
        .
      </p>

      <ScreenLinks
        links={[
          { href: "/dashboard/hotel/whatsapp-links", label: "Links rastreáveis", hint: "O link da bio que marca de onde a conversa veio" },
          { href: "/dashboard/hotel/campaigns", label: "Campanhas", hint: "Os anúncios que rodam no Instagram e no Facebook" },
        ]}
      />
    </PainelPageShell>
  );
}
