"use client";

import { useMemo, useState } from "react";
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
import { PeriodPicker } from "@/src/presentation/components/organisms/hotel-portal/ui";
import {
  resolvePreset,
  type PeriodPreset,
} from "@/src/presentation/components/organisms/hotel-portal/ui/period-picker";

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
  const [preset, setPreset] = useState<PeriodPreset>("current-month");
  const period = useMemo(() => resolvePreset(preset), [preset]);

  const { data, isLoading, isError } = useHotelRoi(client?.id ?? null, period);

  return (
    <PainelPageShell
      title="Retorno (ROI)"
      description="Quanto entrou de resultado para cada real investido."
      isLoading={clientLoading || isLoading}
      isError={isError}
      errorMessage="Erro ao carregar a análise de retorno."
      actions={<PeriodPicker preset={preset} onChange={(p) => setPreset(p)} />}
    >
      {data?.attributionWindow?.visible && (
        <AttributionWindowBanner windowDays={data.attributionWindow.days} />
      )}

      {data?.nivel1 && (
        <PainelSection title="Investimento e conversas">
          <RoiLevel1Cards data={data.nivel1} />
        </PainelSection>
      )}

      {data?.nivel2 ? (
        <PainelSection title="Qualificação do lead">
          <RoiLevel2Cards data={data.nivel2} />
        </PainelSection>
      ) : (
        <PainelSection title="Qualificação do lead">
          <PortalEmptyState
            title="Disponível quando o bot estiver ativo"
            description="Custo por lead qualificado e por lead pronto para fechar dependem do funil do bot de WhatsApp."
          />
        </PainelSection>
      )}

      {data?.nivel3 ? (
        <PainelSection title="Receita atribuída">
          <RoiLevel3Cards data={data.nivel3} />
        </PainelSection>
      ) : (
        <PainelSection title="Receita atribuída">
          <PortalEmptyState
            title="Disponível com o motor de reservas integrado"
            description="Receita, ROAS e ticket médio só aparecem com dado real de reserva — a Reserve nunca estima receita."
          />
        </PainelSection>
      )}
    </PainelPageShell>
  );
}
