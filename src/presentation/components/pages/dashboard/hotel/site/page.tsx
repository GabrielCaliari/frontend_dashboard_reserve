"use client";

import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import {
  useActiveHotelClient,
  useHotelPortalSite,
} from "@/src/shared/hooks/hotel-portal";
import type {
  SiteMetricItem,
  SiteMetricsTotals,
} from "@/src/shared/domain/types/@hotel-portal";
import { Card, CardBody, Spinner } from "@heroui/react";
import { AlertCircle, Globe, Users, Clock } from "lucide-react";
import { ManageDataButton } from "@/src/presentation/components/organisms/hotel-portal/manage-data-button";
import { EmptyState } from "@/src/presentation/components/organisms/hotel-portal/ui";
import { SourceBadge } from "@/src/presentation/components/organisms/hotel-portal/ui/source-badge";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

function fmt(n: number, style: "percent" | "decimal" = "decimal") {
  if (style === "percent")
    return new Intl.NumberFormat("pt-BR", {
      style: "percent",
      minimumFractionDigits: 1,
    }).format(n);
  return new Intl.NumberFormat("pt-BR").format(n);
}

function fmtTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
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

const PIE_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b"];

export default function HotelSitePage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const { data, isLoading, isError } = useHotelPortalSite(client?.id ?? null);

  if (clientLoading || isLoading) {
    return (
      <LayoutScopeRoot>
        <div className="flex justify-center items-center py-32">
          <Spinner size="lg" color="primary" />
        </div>
      </LayoutScopeRoot>
    );
  }

  if (isError || !data) {
    return (
      <LayoutScopeRoot>
        <div className="mx-auto px-4 py-8 sm:px-8 lg:px-10 max-w-[1400px]">
          <Card className="border-danger/20 bg-danger/5 shadow-none rounded-3xl">
            <CardBody className="p-10 text-center">
              <AlertCircle className="w-10 h-10 text-danger mx-auto mb-4" />
              <p className="text-base text-danger">Erro ao carregar dados do site.</p>
            </CardBody>
          </Card>
        </div>
      </LayoutScopeRoot>
    );
  }

  const totals: SiteMetricsTotals = data.totals ?? {
    organic_visitors: 0,
    paid_visitors: 0,
    direct_visitors: 0,
    social_visitors: 0,
    total_visitors: 0,
    package_page_views: 0,
    checkout_starts: 0,
    checkout_completes: 0,
    conversion_rate: 0,
    avg_bounce_rate: 0,
  };
  const metrics: SiteMetricItem[] = data.metrics ?? [];

  const trafficData = [
    { name: "Orgânico", value: totals.organic_visitors },
    { name: "Pago", value: totals.paid_visitors },
    { name: "Direto", value: totals.direct_visitors },
    { name: "Social", value: totals.social_visitors },
  ].filter((d) => d.value > 0);

  const timelineData = metrics.slice(-30).map((m) => ({
    date: m.metric_date.slice(5, 10),
    Visitantes: m.organic_visitors + m.paid_visitors + m.direct_visitors + m.social_visitors,
  }));

  return (
    <LayoutScopeRoot>
      <div className="mx-auto space-y-8 px-4 py-8 sm:px-8 lg:px-10 max-w-[1400px] animate-fade-in">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-default-50 border border-border p-8 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Site</h1>
                <SourceBadge source="auto" />
              </div>
              <p className="text-muted-foreground mt-2 text-base">
                Tráfego e comportamento dos visitantes, medidos via GA4.
              </p>
            </div>
            <ManageDataButton clientId={client?.id} tab="site" />
          </div>
        </div>

        {/* KPIs — apenas o que GA4/pixel realmente mede */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard
            label="Total de Visitantes"
            value={fmt(totals.total_visitors)}
            icon={Users}
          />
          <KpiCard
            label="Views de Pacotes"
            value={fmt(totals.package_page_views)}
            icon={Globe}
          />
          <KpiCard
            label="Taxa de Abandono"
            value={fmt(totals.avg_bounce_rate, "percent")}
            icon={Clock}
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Traffic origin pie */}
          <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
            <CardBody className="p-6 sm:p-8">
              <p className="font-semibold text-foreground mb-6">Origem do Tráfego</p>
              {trafficData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={trafficData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {trafficData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 mt-4">
                    {trafficData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        {d.name}: {fmt(d.value)}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Globe className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">Sem dados disponíveis</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Funil de reservas — depende do motor de reservas (Plano §3.4 / §6) */}
          <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
            <CardBody className="p-6 sm:p-8">
              <p className="font-semibold text-foreground mb-2">Funil de Reservas</p>
              <p className="text-xs text-muted-foreground mb-4">
                Início de checkout e reservas concluídas vêm do motor de reservas,
                não do tracking do site.
              </p>
              <EmptyState reason="via-motor-em-breve" compact />
            </CardBody>
          </Card>
        </div>

        {/* Timeline chart */}
        {timelineData.length > 0 && (
          <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
            <CardBody className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <p className="font-semibold text-foreground">Visitantes — últimos 30 dias</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-primary rounded-full inline-block" />
                    Visitantes
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={timelineData}>
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
                  />
                  <Line
                    type="monotone"
                    dataKey="Visitantes"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}
      </div>
    </LayoutScopeRoot>
  );
}
