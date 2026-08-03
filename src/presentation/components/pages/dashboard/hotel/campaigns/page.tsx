"use client";

import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import {
  useActiveHotelClient,
  useHotelPortalCampaigns,
} from "@/src/shared/hooks/hotel-portal";
import { Card, CardBody, Spinner } from "@heroui/react";
import { AlertCircle, Megaphone } from "lucide-react";
import type { ECampaignChannel } from "@/src/shared/domain/types/@hotel-portal";

const CHANNEL_COLORS: Record<string, string> = {
  META_ADS: "#1877f2",
  GOOGLE_ADS: "#ea4335",
  GOOGLE_HOTEL_ADS: "#fbbc04",
  REMARKETING: "#34a853",
};

const CHANNEL_LABELS: Record<ECampaignChannel, string> = {
  META_ADS: "Meta Ads",
  GOOGLE_ADS: "Google Ads",
  GOOGLE_HOTEL_ADS: "Google Hotel Ads",
  REMARKETING: "Remarketing",
};

function fmt(n: number, style: "currency" | "decimal" = "decimal") {
  if (style === "currency")
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  return new Intl.NumberFormat("pt-BR").format(n);
}

export default function HotelCampaignsPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const { data, isLoading, isError } = useHotelPortalCampaigns(client?.id ?? null);

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
              <p className="text-base text-danger">Erro ao carregar dados de campanhas.</p>
            </CardBody>
          </Card>
        </div>
      </LayoutScopeRoot>
    );
  }

  const summary = data.summary ?? [];
  const metrics = data.metrics ?? [];

  return (
    <LayoutScopeRoot>
      <div className="mx-auto space-y-8 px-4 py-8 sm:px-8 lg:px-10 max-w-[1400px] animate-fade-in">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-default-50 border border-border p-8 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
          <div className="relative">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Campanhas</h1>
            <p className="text-muted-foreground mt-2 text-base">
              Performance das suas campanhas no Meta Ads e Google Ads.
            </p>
          </div>
        </div>

        {/* Channel summary cards */}
        {summary.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-6 rounded-full bg-primary" />
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Resumo por Canal</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.map((s) => (
                <Card
                  key={s.channel}
                  className="bg-default-50 border border-border rounded-3xl shadow-none"
                >
                  <CardBody className="p-6 space-y-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ background: CHANNEL_COLORS[s.channel] ?? "#888" }}
                      />
                      <p className="font-semibold text-foreground">
                        {CHANNEL_LABELS[s.channel as ECampaignChannel] ?? s.channel}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Investimento</p>
                        <p className="font-semibold text-foreground mt-0.5">{fmt(s.total_spend, "currency")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cliques</p>
                        <p className="font-semibold text-foreground mt-0.5">{fmt(s.total_clicks)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Conversões</p>
                        <p className="font-semibold text-foreground mt-0.5">{fmt(s.total_conversions)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ROAS</p>
                        <p className="font-semibold text-foreground mt-0.5">
                          {s.avg_roas ? `${s.avg_roas.toFixed(2)}x` : "—"}
                        </p>
                      </div>
                    </div>
                    {s.cost_per_booking != null && (
                      <div className="rounded-xl bg-background border border-border px-4 py-3">
                        <p className="text-xs text-muted-foreground">Custo por reserva</p>
                        <p className="font-bold text-foreground mt-0.5">{fmt(s.cost_per_booking, "currency")}</p>
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Detailed metrics table */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-6 rounded-full bg-primary" />
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Campanhas Detalhadas</h2>
          </div>

          {metrics.length === 0 ? (
            <Card className="border-border bg-default-50 shadow-none border-dashed rounded-3xl">
              <CardBody className="flex flex-col items-center justify-center py-20 text-center">
                <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-foreground font-semibold text-lg">Nenhuma campanha ativa</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  Os dados são sincronizados automaticamente a cada 6 horas das plataformas de anúncio.
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
                        {["Canal", "Campanha", "Investimento", "Impressões", "Cliques", "Conversões", "ROAS"].map((h) => (
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
                      {metrics.map((m, i) => (
                        <tr
                          key={m.id}
                          className={`border-b border-border/50 hover:bg-default-100/40 transition-colors ${
                            i % 2 === 0 ? "" : "bg-default-50/50"
                          }`}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 w-2 rounded-full flex-shrink-0"
                                style={{ background: CHANNEL_COLORS[m.channel] ?? "#888" }}
                              />
                              <span className="text-xs font-medium">
                                {CHANNEL_LABELS[m.channel as ECampaignChannel] ?? m.channel}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 max-w-[200px]">
                            <span className="truncate block text-foreground font-medium">
                              {m.campaign_name}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-foreground">{fmt(m.spend, "currency")}</td>
                          <td className="px-5 py-3.5 text-foreground">{fmt(m.impressions)}</td>
                          <td className="px-5 py-3.5 text-foreground">{fmt(m.clicks)}</td>
                          <td className="px-5 py-3.5 text-foreground">{fmt(m.conversions)}</td>
                          <td className="px-5 py-3.5 text-foreground font-medium">
                            {m.roas ? `${m.roas.toFixed(2)}x` : "—"}
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
      </div>
    </LayoutScopeRoot>
  );
}
