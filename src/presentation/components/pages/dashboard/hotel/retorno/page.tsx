"use client";

import { useState } from "react";
import {
  useActiveHotelClient,
  useHotelRoi,
} from "@/src/shared/hooks/hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { RoiLevel1Cards } from "@/src/presentation/components/organisms/hotel-portal/painel/roi/roi-level1-cards";
import { RoiLevel2Cards } from "@/src/presentation/components/organisms/hotel-portal/painel/roi/roi-level2-cards";
import { RoiLevel3Cards } from "@/src/presentation/components/organisms/hotel-portal/painel/roi/roi-level3-cards";
import { AttributionWindowBanner } from "@/src/presentation/components/organisms/hotel-portal/painel/attribution-window-banner";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import {
  DateRangeFilter,
  MONTH_PRESETS,
  currentMonth,
  type DateRange,
} from "@/src/presentation/components/organisms/hotel-portal/painel/date-range-filter";
import { ScreenLinks } from "@/src/presentation/components/organisms/hotel-portal/painel/screen-links";

/**
 * Analise de ROI (§3.9), em tres niveis progressivos. O backend so devolve a
 * chave de cada nivel quando ele existe de verdade:
 *  - nivel 2 exige BotIntegrationConfig ativo
 *  - nivel 3 exige motor de reservas != MANUAL
 *
 * Por isso o gate aqui e a presenca da chave, e nao uma flag inventada no
 * front. Regra inegociavel: nenhuma receita estimada sem integracao real.
 */
export default function HotelRetornoPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const [period, setPeriod] = useState<DateRange>(currentMonth);

  const { data, isLoading, isError } = useHotelRoi(client?.id ?? null, period);

  return (
    <PainelPageShell
      title="Retorno (ROI)"
      description="Do real investido em anúncio até a reserva confirmada, em três degraus: o que cada conversa custou, o que cada lead qualificado custou e quanto voltou em receita."
      isLoading={clientLoading || isLoading}
      isError={isError}
      errorMessage="Erro ao carregar a análise de retorno."
      actions={<DateRangeFilter value={period} onChange={setPeriod} presets={MONTH_PRESETS} />}
    >
      {data?.attributionWindow?.visible && (
        <AttributionWindowBanner windowDays={data.attributionWindow.days} />
      )}

      {data?.nivel1 && (
        <PainelSection
          title="Investimento e conversas"
          description="O primeiro degrau: quanto foi gasto e quantas conversas isso abriu no WhatsApp."
        >
          <RoiLevel1Cards data={data.nivel1} />
        </PainelSection>
      )}

      <PainelSection
        title="Qualificação do lead"
        description="O segundo degrau: das conversas abertas, quantas o bot qualificou e quanto cada uma custou."
      >
        {data?.nivel2 ? (
          <RoiLevel2Cards data={data.nivel2} />
        ) : (
          <PortalEmptyState
            title="Disponível quando o bot estiver ativo"
            description="Custo por lead qualificado e por lead pronto para fechar dependem do funil do bot de WhatsApp."
          />
        )}
      </PainelSection>

      <PainelSection
        title="Receita atribuída"
        description="O terceiro degrau: as reservas confirmadas que vieram dessas conversas e o retorno sobre o investimento."
      >
        {data?.nivel3 ? (
          <RoiLevel3Cards data={data.nivel3} />
        ) : (
          <PortalEmptyState
            title="Disponível com o motor de reservas integrado"
            description="Receita, ROAS e ticket médio só aparecem com dado real de reserva — a RÉSERVE nunca estima receita."
          />
        )}
      </PainelSection>

      <ScreenLinks
        links={[
          { href: "/dashboard/hotel/campaigns", label: "Campanhas", hint: "Qual anúncio trouxe cada conversa" },
          { href: "/dashboard/hotel/funil", label: "Funil do bot", hint: "As conversas qualificadas, uma a uma" },
          { href: "/dashboard/hotel/reports", label: "Relatório mensal", hint: "A leitura da RÉSERVE sobre esses números" },
        ]}
      />
    </PainelPageShell>
  );
}
