"use client";

import {
  useActiveHotelClient,
  useHotelPortalDashboard,
} from "@/src/shared/hooks/hotel-portal";
import { Card, CardBody, Spinner } from "@heroui/react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  DollarSign,
  BarChart3,
  Users,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function fmt(n: number, style: "currency" | "percent" | "decimal" = "decimal") {
  if (style === "currency")
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  if (style === "percent")
    return new Intl.NumberFormat("pt-BR", {
      style: "percent",
      minimumFractionDigits: 1,
    }).format(n);
  return new Intl.NumberFormat("pt-BR").format(n);
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <Card
      className={`rounded-3xl shadow-none border ${
        accent ? "bg-primary/5 border-primary/20" : "bg-default-50 border-border"
      }`}
    >
      <CardBody className="p-6 flex flex-col gap-3">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center ${
            accent ? "bg-primary/10" : "bg-default-100"
          }`}
        >
          <Icon className={`h-5 w-5 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          {sub && <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>}
        </div>
      </CardBody>
    </Card>
  );
}

export function HotelDashboardView() {
  const { data: client, isLoading: clientLoading, isError: clientError } = useActiveHotelClient();
  const { data, isLoading, isError } = useHotelPortalDashboard(client?.id ?? null);

  if (clientLoading || isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (clientError || isError || !client || !data) {
    return (
      <div className="mx-auto px-4 py-8 sm:px-8 lg:px-10 max-w-[1600px]">
        <Card className="border-danger/20 bg-danger/5 shadow-none rounded-3xl">
          <CardBody className="p-10 text-center">
            <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
            <p className="text-base text-danger font-medium">
              Não foi possível carregar os dados do portal. Tente novamente mais tarde.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const { kpi, timeseries, ota_data_missing } = data;

  const chartData = timeseries.map((t) => ({
    month: t.month,
    Direto: t.direct_bookings,
    OTA: t.ota_bookings,
  }));

  return (
    <div className="mx-auto space-y-8 px-4 py-8 sm:px-8 lg:px-10 max-w-[1600px] animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-default-50 border border-border p-8 sm:p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
        <div className="relative flex items-center gap-4">
          {client.logo_url ? (
            <img
              src={client.logo_url}
              alt={client.hotel_name}
              className="h-14 w-14 rounded-2xl object-cover border border-border flex-shrink-0"
            />
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {client.hotel_name}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Visão geral dos seus resultados de marketing — {client.country}
            </p>
          </div>
        </div>
      </div>

      {ota_data_missing && (
        <div className="flex items-center gap-2 rounded-2xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          Os dados de OTA do mês atual ainda estão sendo processados pela equipe RÉSERVE.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Reservas Diretas (mês)"
          value={fmt(kpi.direct_bookings)}
          icon={CheckCircle2}
          accent
        />
        <KpiCard
          label="Comissão Recuperada (mês)"
          value={fmt(kpi.commission_recovered_month, "currency")}
          icon={DollarSign}
          accent
        />
        <KpiCard
          label="Taxa de Ocupação"
          value={fmt(kpi.occupancy_rate, "percent")}
          sub={`Meta: ${fmt(kpi.target_occupancy, "percent")}`}
          icon={BarChart3}
        />
        <KpiCard
          label="Visitantes do Site"
          value={fmt(kpi.site_visitors)}
          sub={`Conversão: ${fmt(kpi.site_conversion_rate, "percent")}`}
          icon={Users}
        />
      </div>

      {/* Comissão recuperada acumulada */}
      <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
        <CardBody className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                Comissão Total Recuperada desde o contrato
              </p>
              <p className="text-4xl font-bold text-primary mt-2">
                {fmt(kpi.commission_recovered_total, "currency")}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Valor que ficou no seu bolso em vez de ir para as OTAs
              </p>
            </div>
            <div className="bg-background rounded-2xl border border-border p-5 text-right min-w-[180px]">
              <p className="text-xs text-muted-foreground">Projeção anual no ritmo atual</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {fmt(kpi.commission_projected_annual, "currency")}
              </p>
            </div>
          </div>

          <div className="h-px bg-border my-6" />

          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-muted-foreground">
                Receita direta: {fmt(kpi.direct_revenue, "currency")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-muted-foreground">
                Receita OTA: {fmt(kpi.ota_revenue, "currency")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">
                Meta direta: {fmt(kpi.target_direct_pct, "percent")}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Gráfico OTA vs Direto */}
      {chartData.length > 0 && (
        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <p className="font-semibold text-foreground">
                Reservas Diretas vs OTA — últimos 6 meses
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
  );
}
