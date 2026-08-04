"use client";

import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import {
  useActiveHotelClient,
  useHotelPortalOtaData,
  useHotelPortalDashboard,
} from "@/src/shared/hooks/hotel-portal";
import { Card, CardBody, Spinner } from "@heroui/react";
import { AlertCircle, TrendingUp, DollarSign, Building2 } from "lucide-react";
import { ManageDataButton } from "@/src/presentation/components/organisms/hotel-portal/manage-data-button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
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

export default function HotelOtaPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const { data: otaList, isLoading: otaLoading } = useHotelPortalOtaData(client?.id ?? null);
  const { data: dashboard, isLoading: dashLoading } = useHotelPortalDashboard(client?.id ?? null);

  const isLoading = clientLoading || otaLoading || dashLoading;

  if (isLoading) {
    return (
      <LayoutScopeRoot>
        <div className="flex justify-center items-center py-32">
          <Spinner size="lg" color="primary" />
        </div>
      </LayoutScopeRoot>
    );
  }

  const kpi = dashboard?.kpi;

  const chartData = (otaList ?? []).slice(-6).map((o) => ({
    month: o.reference_month.slice(0, 7),
    "Comissão Paga": o.commission_paid,
    "Receita OTA": o.ota_revenue,
    "Reservas OTA": o.ota_bookings,
  }));

  return (
    <LayoutScopeRoot>
      <div className="mx-auto space-y-8 px-4 py-8 sm:px-8 lg:px-10 max-w-[1400px] animate-fade-in">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-default-50 border border-border p-8 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">OTA vs Direto</h1>
              <p className="text-muted-foreground mt-2 text-base">
                Comissão recuperada das OTAs e evolução das reservas diretas.
              </p>
            </div>
            <ManageDataButton clientId={client?.id} tab="ota" />
          </div>
        </div>

        {/* Comissão recuperada — destaque principal */}
        {kpi && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2 bg-primary/5 border-primary/20 rounded-3xl shadow-none border">
              <CardBody className="p-7 sm:p-9">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary/80 uppercase tracking-wide">
                      Total recuperado desde o início do contrato
                    </p>
                    <p className="text-4xl sm:text-5xl font-bold text-primary mt-2">
                      {fmt(kpi.commission_recovered_total, "currency")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-3">
                      Esse valor deixou de ir para Booking.com, Airbnb e outras OTAs.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <div className="flex flex-col gap-4">
              <Card className="bg-default-50 border border-border rounded-3xl shadow-none flex-1">
                <CardBody className="p-6">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Comissão recuperada (mês atual)
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-2">
                    {fmt(kpi.commission_recovered_month, "currency")}
                  </p>
                </CardBody>
              </Card>
              <Card className="bg-default-50 border border-border rounded-3xl shadow-none flex-1">
                <CardBody className="p-6">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Projeção anual no ritmo atual
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-2">
                    {fmt(kpi.commission_projected_annual, "currency")}
                  </p>
                </CardBody>
              </Card>
            </div>
          </div>
        )}

        {/* Gráfico de barras */}
        {chartData.length > 0 && (
          <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
            <CardBody className="p-6 sm:p-8">
              <p className="font-semibold text-foreground mb-6">
                Comissão Paga vs Receita OTA — últimos meses
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} barGap={4}>
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
                    formatter={(v: number) => fmt(v, "currency")}
                  />
                  <Legend />
                  <Bar dataKey="Receita OTA" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Comissão Paga" fill="hsl(var(--danger))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}

        {/* Histórico mensal tabela */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-6 rounded-full bg-primary" />
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Histórico Mensal de OTA
            </h2>
          </div>

          {!otaList || otaList.length === 0 ? (
            <Card className="border-border bg-default-50 shadow-none border-dashed rounded-3xl">
              <CardBody className="flex flex-col items-center justify-center py-16 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
                <p className="text-foreground font-semibold">Dados OTA ainda não disponíveis</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  A equipe RÉSERVE insere os dados mensalmente após o fechamento de cada mês.
                </p>
              </CardBody>
            </Card>
          ) : (
            <Card className="bg-default-50 border border-border rounded-3xl shadow-none overflow-hidden">
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-default-100/50">
                        {["Mês", "Reservas OTA", "Receita OTA", "Comissão Paga", "Taxa"].map((h) => (
                          <th
                            key={h}
                            className="text-left px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {otaList.map((o, i) => (
                        <tr
                          key={o.id}
                          className={`border-b border-border/50 hover:bg-default-100/40 transition-colors ${
                            i % 2 === 0 ? "" : "bg-default-50/50"
                          }`}
                        >
                          <td className="px-5 py-3.5 font-semibold text-foreground">
                            {o.reference_month.slice(0, 7)}
                          </td>
                          <td className="px-5 py-3.5 text-foreground">{fmt(o.ota_bookings)}</td>
                          <td className="px-5 py-3.5 text-foreground">{fmt(o.ota_revenue, "currency")}</td>
                          <td className="px-5 py-3.5 text-danger font-medium">
                            {fmt(o.commission_paid, "currency")}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">
                            {fmt(o.commission_rate, "percent")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Breakdown por plataforma (se disponível) */}
        {otaList && otaList.some((o) => o.platform_breakdown) && (
          <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
            <CardBody className="p-6 sm:p-8 space-y-4">
              <p className="font-semibold text-foreground">Distribuição por Plataforma (último mês)</p>
              {(() => {
                const last = [...otaList].reverse().find((o) => o.platform_breakdown);
                if (!last?.platform_breakdown) return null;
                const platforms = [
                  { key: "booking", label: "Booking.com" },
                  { key: "getyourguide", label: "GetYourGuide" },
                  { key: "viator", label: "Viator" },
                ] as const;
                const total = Object.values(last.platform_breakdown).reduce(
                  (a, b) => a + (b ?? 0),
                  0,
                );
                return (
                  <div className="space-y-3">
                    {platforms
                      .filter((p) => (last.platform_breakdown as Record<string, number | undefined>)[p.key])
                      .map((p) => {
                        const val = (last.platform_breakdown as Record<string, number | undefined>)[p.key] ?? 0;
                        const pct = total > 0 ? (val / total) * 100 : 0;
                        return (
                          <div key={p.key}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">{p.label}</span>
                              <span className="font-medium text-foreground">
                                {fmt(val, "currency")}
                              </span>
                            </div>
                            <div className="h-2 bg-default-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary/60 transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                );
              })()}
            </CardBody>
          </Card>
        )}
      </div>
    </LayoutScopeRoot>
  );
}
