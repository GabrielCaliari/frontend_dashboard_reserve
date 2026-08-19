"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardBody } from "@heroui/react";
import { AlertCircle, ArrowRight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  useActiveHotelClient,
  useHotelHome,
  useHotelPortalDashboard,
} from "@/src/shared/hooks/hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { MetricCard } from "@/src/presentation/components/organisms/hotel-portal/ui";
import {
  PeriodPicker,
  resolvePreset,
  type PeriodPreset,
} from "@/src/presentation/components/organisms/hotel-portal/ui/period-picker";
import { formatNumber, formatPercent } from "@/src/shared/utils/hotel-format";
import type { FunnelStage } from "@/src/shared/domain/types/@hotel-painel";

/** Dinheiro do motor de reservas e do dashboard.kpi vem em REAIS, nao em
 * centavos — nunca usar hotel-format.formatMoney aqui (essa divide por 100). */
function fmtBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function fmt(n: number, style: "currency" | "percent" | "decimal" = "decimal") {
  if (style === "currency") return fmtBRL(n);
  if (style === "percent")
    return new Intl.NumberFormat("pt-BR", {
      style: "percent",
      minimumFractionDigits: 1,
    }).format(n);
  return new Intl.NumberFormat("pt-BR").format(n);
}

const RESERVA_CONFIRMADA_STAGE = "RESERVA_CONFIRMADA" as FunnelStage;

/**
 * Home unica do Painel (manager): funil do bot + motor de reservas + canais
 * + ocupacao na mesma tela, em vez de espalhados em paginas separadas.
 */
export function ManagerHome() {
  const {
    data: client,
    isLoading: clientLoading,
    isError: clientError,
  } = useActiveHotelClient();

  const [preset, setPreset] = useState<PeriodPreset>("current-month");
  const period = useMemo(() => resolvePreset(preset), [preset]);

  const {
    data: home,
    isLoading: homeLoading,
    isError: homeError,
  } = useHotelHome(client?.id ?? null, period);

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isError: dashboardError,
  } = useHotelPortalDashboard(client?.id ?? null);

  const isLoading = clientLoading || homeLoading || dashboardLoading;
  const isError = Boolean(clientError || homeError || dashboardError);

  const fechamentos = useMemo(() => {
    if (!home) return 0;
    return (
      home.funil.distribuicaoFunil.find(
        (item) => item.stage === RESERVA_CONFIRMADA_STAGE,
      )?.count ?? 0
    );
  }, [home]);

  const taxaConversao =
    home && home.funil.conversasIniciadas.value > 0
      ? fechamentos / home.funil.conversasIniciadas.value
      : 0;

  const chartData = (dashboard?.timeseries ?? []).map((t) => ({
    month: t.month,
    Direto: t.direct_bookings,
    OTA: t.ota_bookings,
  }));

  return (
    <PainelPageShell
      title={client?.hotel_name ?? "Visão geral"}
      description="Desempenho do bot, do motor de reservas e dos canais."
      isLoading={isLoading}
      isError={isError}
      errorMessage="Erro ao carregar a visão geral."
      actions={
        <PeriodPicker preset={preset} onChange={(p) => setPreset(p)} />
      }
    >
      {!client ? (
        <PortalEmptyState
          title="Nenhum hotel configurado"
          description="Nenhum hotel configurado para este workspace."
        />
      ) : !home || !dashboard ? null : (
        <div className="space-y-8">
          <PainelSection title="Funil do bot">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard
                  label="Conversas iniciadas"
                  value={formatNumber(home.funil.conversasIniciadas.value)}
                  source={home.funil.conversasIniciadas.source}
                />
                <MetricCard
                  label="Fechamentos"
                  value={formatNumber(fechamentos)}
                />
                <MetricCard
                  label="Taxa de conversão"
                  value={formatPercent(taxaConversao * 100)}
                />
                <MetricCard
                  label="Gerado pelo bot"
                  value={fmtBRL(home.motor.receita_bot)}
                  accent
                />
              </div>
              <Link
                href="/dashboard/hotel/funil"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Ver funil completo
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </PainelSection>

          <PainelSection title="Motor de reservas">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <MetricCard
                label="Receita"
                value={fmtBRL(home.motor.receita)}
                accent
              />
              <MetricCard
                label="Ticket médio"
                value={fmtBRL(home.motor.ticket_medio)}
              />
              <MetricCard
                label="Room nights"
                value={formatNumber(home.motor.room_nights)}
              />
              <MetricCard
                label="Canceladas"
                value={`${formatNumber(home.motor.canceladas.quantidade)} · ${fmtBRL(home.motor.canceladas.valor)}`}
              />
              <MetricCard
                label="A recuperar"
                value={`${formatNumber(home.motor.a_recuperar.quantidade)} holds expirados · ${fmtBRL(home.motor.a_recuperar.valor)}`}
                hint="hóspedes que não concluíram o pagamento — o bot faz o follow-up"
              />
            </div>
          </PainelSection>

          <PainelSection title="Canais">
            <div className="space-y-6">
              {dashboard.ota_data_missing && (
                <div className="flex items-center gap-2 rounded-2xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  Os dados de OTA do mês atual ainda estão sendo processados
                  pela equipe RÉSERVE.
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <MetricCard
                  label="Comissão recuperada no mês"
                  value={fmt(dashboard.kpi.commission_recovered_month, "currency")}
                  accent
                />
                <MetricCard
                  label="Comissão recuperada total"
                  value={fmt(dashboard.kpi.commission_recovered_total, "currency")}
                />
                <MetricCard
                  label="Projeção anual"
                  value={fmt(dashboard.kpi.commission_projected_annual, "currency")}
                />
              </div>

              {chartData.length > 0 && (
                <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
                  <CardBody className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <p className="font-semibold text-foreground">
                        Diretas vs OTA — últimos 6 meses
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-0.5 bg-primary rounded-full inline-block" />
                          Direto
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-0.5 bg-warning rounded-full inline-block" />
                          OTA
                        </span>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                            fontSize: 12,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Direto"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: "hsl(var(--primary))" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="OTA"
                          stroke="hsl(var(--warning))"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: "hsl(var(--warning))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>
              )}
            </div>
          </PainelSection>

          <PainelSection title="Ocupação">
            <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
              <CardBody className="p-6 sm:p-8 space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                      Média do período
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {fmt(dashboard.kpi.occupancy_rate, "percent")}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Meta: {fmt(dashboard.kpi.target_occupancy, "percent")}
                  </p>
                </div>
                <div className="h-2.5 rounded-full bg-default-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(100, Math.max(0, dashboard.kpi.occupancy_rate))}%`,
                    }}
                  />
                </div>
              </CardBody>
            </Card>
          </PainelSection>
        </div>
      )}
    </PainelPageShell>
  );
}
