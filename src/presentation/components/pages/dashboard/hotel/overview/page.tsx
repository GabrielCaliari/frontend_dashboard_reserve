"use client";

import { useState, useMemo } from "react";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import {
  useActiveHotelClient,
  useHotelPortalOverview,
} from "@/src/shared/hooks/hotel-portal";
import { Card, CardBody } from "@heroui/react";
import {
  DollarSign,
  TrendingUp,
  MessageCircle,
  ArrowLeftRight,
  Target,
  Megaphone,
  BedDouble,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  MetricCard,
  EmptyState,
  SkeletonCardGrid,
  ModeGate,
  HotelModeProvider,
  ChannelTable,
  PeriodPicker,
  type ChannelColumn,
} from "@/src/presentation/components/organisms/hotel-portal/ui";
import { resolvePreset, type PeriodPreset } from "@/src/presentation/components/organisms/hotel-portal/ui/period-picker";
import { ManageDataButton } from "@/src/presentation/components/organisms/hotel-portal/manage-data-button";
import { deriveRenderMode } from "@/src/presentation/components/organisms/hotel-portal/ui/mode-gate";
import {
  formatMoney,
  formatNumber,
  formatPercent,
  formatDayMonth,
} from "@/src/shared/utils/hotel-format";
import type {
  HotelOverviewResponse,
  OverviewChannelMedia,
} from "@/src/shared/domain/types/@hotel-portal-v1";

export default function HotelOverviewPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();

  const [preset, setPreset] = useState<PeriodPreset>("current-month");
  const period = useMemo(() => resolvePreset(preset), [preset]);

  const { data, isLoading, isError } = useHotelPortalOverview(
    client?.id ?? null,
    period,
  );

  // Modo ATIVIDADE por padrão (Doc 03 §9.3). Vira CONVERSÃO quando o backend
  // expuser integrations no detalhe do cliente (GET /clients/:id).
  const mode = deriveRenderMode(
    client && "bookingEngine" in client
      ? (client as never)
      : null,
  );

  return (
    <LayoutScopeRoot>
      <HotelModeProvider mode={mode}>
        <div className="mx-auto space-y-8 px-4 py-8 sm:px-8 lg:px-10 max-w-[1400px] animate-fade-in">
          {/* Header */}
          <div className="relative overflow-hidden rounded-3xl bg-default-50 border border-border p-8 sm:p-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
            <div className="relative flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  Visão Geral
                </h1>
                <p className="text-muted-foreground mt-2 text-base">
                  {client?.hotel_name
                    ? `Resultados de ${client.hotel_name} no período.`
                    : "Resultados consolidados no período."}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <PeriodPicker
                  preset={preset}
                  onChange={(p) => setPreset(p)}
                />
                <ManageDataButton clientId={client?.id} tab="ota" />
              </div>
            </div>
          </div>

          {clientLoading || isLoading ? (
            <SkeletonCardGrid count={4} />
          ) : isError || !data ? (
            <EmptyState
              reason="erro"
              description="A visão consolidada depende do endpoint /overview, em implementação no backend. Assim que estiver disponível, os KPIs aparecem aqui."
            />
          ) : (
            <OverviewContent data={data} />
          )}
        </div>
      </HotelModeProvider>
    </LayoutScopeRoot>
  );
}

function OverviewContent({ data }: { data: HotelOverviewResponse }) {
  // Zero-safe: o endpoint é novo e pode vir parcial. Nenhum acesso aninhado
  // sem default (Plano §3.4 — agregações zero-safe).
  const zeroMoney = { value: 0, currency: "BRL" as const };
  const zeroMetric = { value: 0, previous: null, delta: null, source: "manual" as const };

  const directVsOta = {
    directRevenue: data.directVsOta?.directRevenue ?? zeroMoney,
    otaRevenue: data.directVsOta?.otaRevenue ?? zeroMoney,
    directPct: data.directVsOta?.directPct ?? zeroMetric,
    commissionRecovered:
      data.directVsOta?.commissionRecovered ?? { ...zeroMoney, source: "manual" as const },
  };
  const media = {
    spend: data.media?.spend ?? zeroMoney,
    roas: data.media?.roas ?? { ...zeroMetric, source: "server" as const },
    costPerBooking:
      data.media?.costPerBooking ?? { ...zeroMoney, source: "server" as const },
    byChannel: data.media?.byChannel ?? [],
  };
  const whatsapp = {
    clicks: data.whatsapp?.clicks ?? { ...zeroMetric, source: "auto" as const },
  };
  const hotelKpis = data.hotelKpis ?? null;
  const timeseries = data.timeseries ?? [];

  const attributedTotal = media.byChannel.reduce(
    (sum, c) => sum + (c.attributedRevenue ?? 0),
    0,
  );

  const chartData = timeseries.map((p) => ({
    date: formatDayMonth(p.date),
    "Receita direta": (p.directRevenue ?? 0) / 100,
    "Receita OTA": (p.otaRevenue ?? 0) / 100,
    Investimento: (p.spend ?? 0) / 100,
  }));

  const channelColumns: ChannelColumn<OverviewChannelMedia>[] = [
    {
      key: "channel",
      header: "Canal",
      cell: (r) => <span className="font-medium capitalize">{r.channel.replace("_", " ")}</span>,
    },
    {
      key: "spend",
      header: "Investimento",
      align: "right",
      cell: (r) => formatMoney(r.spend),
    },
    {
      key: "revenue",
      header: "Receita atribuída",
      align: "right",
      cell: (r) => formatMoney(r.attributedRevenue),
    },
    {
      key: "roas",
      header: "ROAS",
      align: "right",
      cell: (r) => (
        <span className="font-semibold text-foreground">
          {r.roas.toFixed(2)}x
        </span>
      ),
    },
  ];

  return (
    <>
      {/* KPIs principais — sempre visíveis */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Comissão recuperada"
          value={formatMoney(directVsOta.commissionRecovered.value)}
          source={directVsOta.commissionRecovered.source}
          icon={DollarSign}
          accent
          hint="Deixou de ir para as OTAs"
        />
        <MetricCard
          label="Receita direta"
          value={formatMoney(directVsOta.directRevenue.value)}
          source={directVsOta.directPct.source}
          icon={ArrowLeftRight}
        />
        <MetricCard
          label="% Reserva direta"
          value={formatPercent(directVsOta.directPct.value)}
          delta={directVsOta.directPct.delta}
          deltaKind="pp"
          source={directVsOta.directPct.source}
          icon={Target}
        />
        <MetricCard
          label="Conversas no WhatsApp"
          value={formatNumber(whatsapp.clicks.value)}
          delta={whatsapp.clicks.delta}
          deltaKind="abs"
          source={whatsapp.clicks.source}
          icon={MessageCircle}
        />
      </div>

      {/* Cards de conversão — só em modo CONVERSÃO (motor conectado) */}
      <ModeGate mode="conversion">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            label="ROAS consolidado"
            value={`${media.roas.value.toFixed(2)}x`}
            delta={media.roas.delta}
            deltaKind="pct"
            source={media.roas.source}
            icon={TrendingUp}
            accent
          />
          <MetricCard
            label="Receita atribuída"
            value={formatMoney(attributedTotal)}
            source="server"
            icon={DollarSign}
          />
          <MetricCard
            label="Custo por reserva"
            value={formatMoney(media.costPerBooking.value)}
            source={media.costPerBooking.source}
            icon={Megaphone}
            invertDelta
          />
        </div>
      </ModeGate>

      {/* Investimento em mídia + WhatsApp (modo ATIVIDADE também mostra) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Investimento em mídia"
          value={formatMoney(media.spend.value)}
          source="auto"
          icon={Megaphone}
        />
        <MetricCard
          label="Receita OTA"
          value={formatMoney(directVsOta.otaRevenue.value)}
          source={directVsOta.commissionRecovered.source}
          icon={ArrowLeftRight}
        />
        {hotelKpis?.revpar && (
          <MetricCard
            label="RevPAR"
            value={formatMoney(hotelKpis.revpar.value)}
            source={hotelKpis.revpar.source}
            icon={BedDouble}
          />
        )}
        {hotelKpis?.occupancy && (
          <MetricCard
            label="Ocupação"
            value={formatPercent(hotelKpis.occupancy.value)}
            delta={hotelKpis.occupancy.delta}
            deltaKind="pp"
            source={hotelKpis.occupancy.source}
            icon={BedDouble}
          />
        )}
      </div>

      {/* Evolução */}
      {chartData.length > 0 && (
        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-6 sm:p-8">
            <p className="font-semibold text-foreground mb-6">
              Evolução — receita direta vs OTA vs investimento
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: 12,
                  }}
                  formatter={(v: number) =>
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(v)
                  }
                />
                <Legend />
                <Line type="monotone" dataKey="Receita direta" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Receita OTA" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Investimento" stroke="#94a3b8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* Mídia por canal — só faz sentido com atribuição (modo CONVERSÃO) */}
      <ModeGate mode="conversion">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 rounded-full bg-primary" />
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Mídia por canal
            </h2>
          </div>
          {media.byChannel.length > 0 ? (
            <ChannelTable
              columns={channelColumns}
              rows={media.byChannel}
              getRowKey={(r) => r.channel}
            />
          ) : (
            <EmptyState reason="sem-dados-periodo" compact />
          )}
        </div>
      </ModeGate>
    </>
  );
}
