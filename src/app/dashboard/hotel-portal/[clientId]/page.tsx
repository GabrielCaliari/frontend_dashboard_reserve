"use client";

import { useState, useMemo } from "react";
import { use } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { useRouter } from "nextjs-toploader/app";
import {
  useHotelClient,
  useHotelPortalDashboard,
  useHotelPortalCampaigns,
  useHotelPortalSite,
  useHotelPortalReports,
  useHotelPortalOtaData,
  useInsertOtaData,
  usePublishReport,
  useCreateReport,
  useUpdateHotelClient,
} from "@/src/common/hooks/hotel-portal";
import {
  Card,
  CardBody,
  Button,
  Spinner,
  Tabs,
  Tab,
  Input,
  Textarea,
  Chip,
} from "@heroui/react";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Building2,
  Globe,
  LineChart,
  Megaphone,
  TrendingUp,
  FileText,
  Database,
  Settings,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  MousePointer,
  ShoppingCart,
} from "lucide-react";
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import toast from "react-hot-toast";
import type {
  MonthlyReport,
  PublishReportDto,
  ECampaignChannel,
} from "@/src/common/@types/@hotel-portal";

function fmt(n: number, style: "currency" | "percent" | "decimal" = "decimal") {
  if (style === "currency")
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  if (style === "percent")
    return new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1 }).format(n);
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
      className={`rounded-3xl shadow-none border ${accent ? "bg-primary/5 border-primary/20" : "bg-default-50 border-border"}`}
    >
      <CardBody className="p-6 flex flex-col gap-3">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center ${accent ? "bg-primary/10" : "bg-default-100"}`}
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

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-6 rounded-full bg-primary" />
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
    </div>
  );
}

function TabLoading() {
  return (
    <div className="flex justify-center items-center py-20 bg-default-50 rounded-3xl border border-border border-dashed">
      <Spinner size="lg" color="primary" />
    </div>
  );
}

function TabError({ message }: { message: string }) {
  return (
    <Card className="border-danger/20 bg-danger/5 shadow-none rounded-3xl">
      <CardBody className="p-8 text-center">
        <AlertCircle className="w-10 h-10 text-danger mx-auto mb-4" />
        <p className="text-base text-danger">{message}</p>
      </CardBody>
    </Card>
  );
}

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

function DashboardTab({ clientId }: { clientId: string }) {
  const { data, isLoading, isError } = useHotelPortalDashboard(clientId);

  if (isLoading) return <TabLoading />;
  if (isError) return <TabError message="Erro ao carregar dashboard." />;
  if (!data) return null;

  const { kpi, timeseries, ota_data_missing } = data;

  const chartData = timeseries.map((t) => ({
    month: t.month,
    Direto: t.direct_bookings,
    OTA: t.ota_bookings,
  }));

  return (
    <div className="space-y-6">
      {ota_data_missing && (
        <div className="flex items-center gap-2 rounded-2xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          Dados de OTA do mês atual ainda não foram inseridos.
        </div>
      )}

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

      <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-semibold text-foreground">Comissão Total Recuperada</p>
              <p className="text-3xl font-bold text-primary mt-1">
                {fmt(kpi.commission_recovered_total, "currency")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Projeção anual</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {fmt(kpi.commission_projected_annual, "currency")}
              </p>
            </div>
          </div>
          <div className="h-px bg-border mb-6" />
          <div className="flex flex-col sm:flex-row gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">
                Meta direta: {fmt(kpi.target_direct_pct, "percent")}
              </span>
            </div>
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
          </div>
        </CardBody>
      </Card>

      {chartData.length > 0 && (
        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-6">
            <p className="font-semibold text-foreground mb-6">
              Reservas Diretas vs OTA — últimos 6 meses
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <ReLineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="Direto" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="OTA" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
              </ReLineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function CampaignsTab({ clientId }: { clientId: string }) {
  const { data, isLoading, isError } = useHotelPortalCampaigns(clientId);

  if (isLoading) return <TabLoading />;
  if (isError) return <TabError message="Erro ao carregar campanhas." />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {data.summary.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.summary.map((s) => (
            <Card key={s.channel} className="bg-default-50 border border-border rounded-3xl shadow-none">
              <CardBody className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ background: CHANNEL_COLORS[s.channel] ?? "#888" }}
                  />
                  <p className="font-semibold text-foreground">
                    {CHANNEL_LABELS[s.channel] ?? s.channel}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Investimento</p>
                    <p className="font-semibold text-foreground">{fmt(s.total_spend, "currency")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cliques</p>
                    <p className="font-semibold text-foreground">{fmt(s.total_clicks)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conversões</p>
                    <p className="font-semibold text-foreground">{fmt(s.total_conversions)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ROAS</p>
                    <p className="font-semibold text-foreground">
                      {s.avg_roas ? `${s.avg_roas.toFixed(2)}x` : "—"}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {data.metrics.length === 0 ? (
        <Card className="border-border bg-default-50 shadow-none border-dashed rounded-3xl">
          <CardBody className="flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-foreground font-medium">Nenhuma campanha encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Dados serão sincronizados automaticamente a cada 6h.
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Canal", "Campanha", "Investimento", "Cliques", "Conversões", "ROAS"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.metrics.slice(0, 20).map((m) => (
                    <tr key={m.id} className="border-b border-border/50 hover:bg-default-100/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ background: CHANNEL_COLORS[m.channel] ?? "#888" }}
                          />
                          <span className="text-xs">{CHANNEL_LABELS[m.channel] ?? m.channel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[180px] truncate text-foreground">{m.campaign_name}</td>
                      <td className="px-4 py-3 text-foreground">{fmt(m.spend, "currency")}</td>
                      <td className="px-4 py-3 text-foreground">{fmt(m.clicks)}</td>
                      <td className="px-4 py-3 text-foreground">{fmt(m.conversions)}</td>
                      <td className="px-4 py-3 text-foreground">{m.roas ? `${m.roas.toFixed(2)}x` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function SiteTab({ clientId }: { clientId: string }) {
  const { data, isLoading, isError } = useHotelPortalSite(clientId);

  if (isLoading) return <TabLoading />;
  if (isError) return <TabError message="Erro ao carregar dados do site." />;
  if (!data) return null;

  const { totals } = data;

  const trafficData = [
    { name: "Orgânico", value: totals.organic_visitors },
    { name: "Pago", value: totals.paid_visitors },
    { name: "Direto", value: totals.direct_visitors },
    { name: "Social", value: totals.social_visitors },
  ];

  const PIE_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total de Visitantes" value={fmt(totals.total_visitors)} icon={Users} />
        <KpiCard label="Páginas de Pacotes" value={fmt(totals.package_page_views)} icon={Globe} />
        <KpiCard label="Taxa de Conversão" value={fmt(totals.conversion_rate, "percent")} icon={MousePointer} accent />
        <KpiCard label="Taxa de Abandono" value={fmt(totals.avg_bounce_rate, "percent")} icon={ShoppingCart} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-6">
            <p className="font-semibold text-foreground mb-6">Origem do Tráfego</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={trafficData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {trafficData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-6">
            <p className="font-semibold text-foreground mb-6">Funil de Conversão</p>
            <div className="space-y-3">
              {[
                { label: "Visitantes", value: totals.total_visitors, color: "bg-primary" },
                { label: "Views de Pacotes", value: totals.package_page_views, color: "bg-primary/70" },
                { label: "Início do Checkout", value: totals.checkout_starts, color: "bg-primary/50" },
                { label: "Reservas Completas", value: totals.checkout_completes, color: "bg-primary/30" },
              ].map(({ label, value, color }) => {
                const pct = totals.total_visitors > 0 ? (value / totals.total_visitors) * 100 : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground">{fmt(value)}</span>
                    </div>
                    <div className="h-2 bg-default-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color} transition-all`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function OtaTab({ clientId }: { clientId: string }) {
  const { data: otaList, isLoading } = useHotelPortalOtaData(clientId);
  const { mutateAsync: insert, isPending } = useInsertOtaData(clientId);
  const [form, setForm] = useState({
    reference_month: new Date().toISOString().slice(0, 7),
    ota_bookings: "",
    ota_revenue: "",
    commission_rate: "22",
    booking: "",
    getyourguide: "",
    viator: "",
  });

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  async function handleInsert(e: React.FormEvent) {
    e.preventDefault();
    try {
      await insert({
        reference_month: `${form.reference_month}-01`,
        ota_bookings: parseInt(form.ota_bookings),
        ota_revenue: parseFloat(form.ota_revenue),
        commission_rate: parseFloat(form.commission_rate) / 100,
        platform_breakdown: {
          booking: form.booking ? parseFloat(form.booking) : undefined,
          getyourguide: form.getyourguide ? parseFloat(form.getyourguide) : undefined,
          viator: form.viator ? parseFloat(form.viator) : undefined,
        },
      });
      toast.success("Dados OTA inseridos com sucesso!");
      setForm((p) => ({ ...p, ota_bookings: "", ota_revenue: "", booking: "", getyourguide: "", viator: "" }));
    } catch {
      toast.error("Erro ao inserir dados OTA.");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
        <CardBody className="p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Database className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Inserir Dados OTA</h3>
              <p className="text-xs text-muted-foreground">Dados mensais de Booking, GetYourGuide e Viator.</p>
            </div>
          </div>
          <form onSubmit={handleInsert} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Mês de referência"
                type="month"
                value={form.reference_month}
                onChange={set("reference_month")}
                isRequired
                variant="bordered"
                classNames={{ inputWrapper: "rounded-2xl border-border" }}
              />
              <Input
                label="Total de Reservas OTA"
                type="number"
                value={form.ota_bookings}
                onChange={set("ota_bookings")}
                isRequired
                variant="bordered"
                classNames={{ inputWrapper: "rounded-2xl border-border" }}
              />
              <Input
                label="Receita Total OTA (R$)"
                type="number"
                value={form.ota_revenue}
                onChange={set("ota_revenue")}
                isRequired
                variant="bordered"
                classNames={{ inputWrapper: "rounded-2xl border-border" }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input
                label="Comissão OTA (%)"
                type="number"
                value={form.commission_rate}
                onChange={set("commission_rate")}
                isRequired
                variant="bordered"
                classNames={{ inputWrapper: "rounded-2xl border-border" }}
              />
              <Input label="Booking.com (R$)" type="number" value={form.booking} onChange={set("booking")} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="GetYourGuide (R$)" type="number" value={form.getyourguide} onChange={set("getyourguide")} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Viator (R$)" type="number" value={form.viator} onChange={set("viator")} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" color="primary" isLoading={isPending} className="font-medium">
                Salvar Dados OTA
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {isLoading ? (
        <TabLoading />
      ) : otaList && otaList.length > 0 ? (
        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Mês", "Reservas OTA", "Receita OTA", "Comissão Paga", "Recuperado"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {otaList.map((o) => (
                    <tr key={o.id} className="border-b border-border/50 hover:bg-default-100/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{o.reference_month.slice(0, 7)}</td>
                      <td className="px-4 py-3 text-foreground">{fmt(o.ota_bookings)}</td>
                      <td className="px-4 py-3 text-foreground">{fmt(o.ota_revenue, "currency")}</td>
                      <td className="px-4 py-3 text-danger">{fmt(o.commission_paid, "currency")}</td>
                      <td className="px-4 py-3 text-success font-semibold">{fmt(o.commission_paid, "currency")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}

function ReportsTab({ clientId }: { clientId: string }) {
  const { data: reports, isLoading } = useHotelPortalReports(clientId);
  const { mutateAsync: createReport, isPending: creating } = useCreateReport(clientId);
  const { mutateAsync: publishReport, isPending: publishing } = usePublishReport(clientId);
  const { mutateAsync: updateReport, isPending: updating } = useUpdateReport(clientId);

  const [selected, setSelected] = useState<MonthlyReport | null>(null);
  const [draft, setDraft] = useState<Partial<PublishReportDto>>({});
  const [newMonth, setNewMonth] = useState(new Date().toISOString().slice(0, 7));

  function selectReport(r: MonthlyReport) {
    setSelected(r);
    setDraft({
      executive_summary: r.executive_summary ?? "",
      highlights: r.highlights ?? [],
      next_steps: r.next_steps ?? [],
      admin_comment: r.admin_comment ?? "",
    });
  }

  async function handleCreate() {
    try {
      const r = await createReport({ reference_month: `${newMonth}-01` });
      toast.success("Relatório criado!");
      selectReport(r);
    } catch {
      toast.error("Erro ao criar relatório.");
    }
  }

  async function handleSave() {
    if (!selected) return;
    try {
      await updateReport({ reportId: selected.id, data: draft });
      toast.success("Rascunho salvo!");
    } catch {
      toast.error("Erro ao salvar.");
    }
  }

  async function handlePublish() {
    if (!selected) return;
    try {
      await publishReport({
        reportId: selected.id,
        data: {
          executive_summary: draft.executive_summary ?? "",
          highlights: draft.highlights ?? [],
          next_steps: draft.next_steps ?? [],
          admin_comment: draft.admin_comment ?? "",
        },
      });
      toast.success("Relatório publicado! Cliente notificado por email.");
      setSelected(null);
    } catch {
      toast.error("Erro ao publicar relatório.");
    }
  }

  const STATUS_CONFIG = {
    DRAFT: { label: "Rascunho", color: "default" as const },
    REVIEW: { label: "Em revisão", color: "warning" as const },
    PUBLISHED: { label: "Publicado", color: "success" as const },
  };

  if (isLoading) return <TabLoading />;

  return (
    <div className="space-y-6">
      <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
        <CardBody className="p-6 flex flex-wrap items-end gap-4">
          <Input
            label="Mês do relatório"
            type="month"
            value={newMonth}
            onChange={(e) => setNewMonth(e.target.value)}
            variant="bordered"
            classNames={{ inputWrapper: "rounded-2xl border-border", base: "max-w-[200px]" }}
          />
          <Button color="primary" onPress={handleCreate} isLoading={creating} className="font-medium">
            Criar Relatório
          </Button>
        </CardBody>
      </Card>

      {selected ? (
        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold text-foreground">
                Relatório — {selected.reference_month.slice(0, 7)}
              </h3>
              <Button size="sm" variant="flat" onPress={() => setSelected(null)}>Fechar</Button>
            </div>
            <Textarea
              label="Resumo executivo"
              value={draft.executive_summary ?? ""}
              onChange={(e) => setDraft((p) => ({ ...p, executive_summary: e.target.value }))}
              variant="bordered"
              minRows={3}
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
            />
            <Textarea
              label="Destaques (um por linha)"
              value={(draft.highlights ?? []).join("\n")}
              onChange={(e) =>
                setDraft((p) => ({ ...p, highlights: e.target.value.split("\n").filter(Boolean) }))
              }
              variant="bordered"
              minRows={3}
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
            />
            <Textarea
              label="Próximos passos (um por linha)"
              value={(draft.next_steps ?? []).join("\n")}
              onChange={(e) =>
                setDraft((p) => ({ ...p, next_steps: e.target.value.split("\n").filter(Boolean) }))
              }
              variant="bordered"
              minRows={3}
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
            />
            <Textarea
              label="Comentário estratégico da RÉSERVE"
              value={draft.admin_comment ?? ""}
              onChange={(e) => setDraft((p) => ({ ...p, admin_comment: e.target.value }))}
              variant="bordered"
              minRows={4}
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
            />
            <div className="flex gap-3 justify-end flex-wrap">
              <Button variant="flat" onPress={handleSave} isLoading={updating} className="font-medium">
                Salvar Rascunho
              </Button>
              <Button color="primary" onPress={handlePublish} isLoading={publishing} className="font-medium">
                Publicar e Notificar Cliente
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {reports && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((r) => {
            const cfg = STATUS_CONFIG[r.status];
            return (
              <Card
                key={r.id}
                className="bg-default-50 border border-border rounded-2xl shadow-none hover:border-primary/30 transition-colors cursor-pointer"
                isPressable
                onPress={() => selectReport(r)}
              >
                <CardBody className="p-4 flex flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-default-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{r.reference_month.slice(0, 7)}</p>
                      {r.published_at && (
                        <p className="text-xs text-muted-foreground">
                          Publicado em {new Date(r.published_at).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.notification_sent && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                    <Chip size="sm" variant="flat" color={cfg.color}>{cfg.label}</Chip>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ConfigTab({ clientId }: { clientId: string }) {
  const { data: client } = useHotelClient(clientId);
  const { mutateAsync: update, isPending } = useUpdateHotelClient(clientId);
  const [form, setForm] = useState({
    hotel_name: client?.hotel_name ?? "",
    country: client?.country ?? "",
    booking_engine: client?.booking_engine ?? "",
    logo_url: client?.logo_url ?? "",
    target_occupancy: client ? String(Math.round(client.target_occupancy * 100)) : "70",
    target_direct_pct: client ? String(Math.round(client.target_direct_pct * 100)) : "50",
  });

  useMemo(() => {
    if (client) {
      setForm({
        hotel_name: client.hotel_name,
        country: client.country,
        booking_engine: client.booking_engine ?? "",
        logo_url: client.logo_url ?? "",
        target_occupancy: String(Math.round(client.target_occupancy * 100)),
        target_direct_pct: String(Math.round(client.target_direct_pct * 100)),
      });
    }
  }, [client]);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await update({
        hotel_name: form.hotel_name,
        country: form.country,
        booking_engine: form.booking_engine || undefined,
        logo_url: form.logo_url || undefined,
        target_occupancy: parseFloat(form.target_occupancy) / 100,
        target_direct_pct: parseFloat(form.target_direct_pct) / 100,
      });
      toast.success("Configurações salvas!");
    } catch {
      toast.error("Erro ao salvar configurações.");
    }
  }

  async function handleToggleActive() {
    try {
      await update({ is_active: !client?.is_active });
      toast.success(client?.is_active ? "Cliente desativado." : "Cliente ativado.");
    } catch {
      toast.error("Erro ao alterar status.");
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
        <CardBody className="p-6 sm:p-8 space-y-5">
          <h3 className="font-semibold text-foreground">Dados do Hotel</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nome do Hotel" value={form.hotel_name} onChange={set("hotel_name")} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} isRequired />
            <Input label="País" value={form.country} onChange={set("country")} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} isRequired />
            <Input label="Motor de Reservas" value={form.booking_engine} onChange={set("booking_engine")} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
            <Input label="URL do Logo" value={form.logo_url} onChange={set("logo_url")} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
            <Input label="Meta de Ocupação (%)" type="number" value={form.target_occupancy} onChange={set("target_occupancy")} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
            <Input label="Meta de Reserva Direta (%)" type="number" value={form.target_direct_pct} onChange={set("target_direct_pct")} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
          </div>
          <div className="flex gap-3 justify-between flex-wrap pt-2">
            <Button
              type="button"
              variant="flat"
              color={client?.is_active ? "danger" : "success"}
              onPress={handleToggleActive}
              isLoading={isPending}
            >
              {client?.is_active ? "Desativar Cliente" : "Ativar Cliente"}
            </Button>
            <Button type="submit" color="primary" isLoading={isPending} className="font-medium">
              Salvar Configurações
            </Button>
          </div>
        </CardBody>
      </Card>

      {client?.credentials && client.credentials.length > 0 && (
        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-6 sm:p-8 space-y-4">
            <h3 className="font-semibold text-foreground">Status das Integrações</h3>
            <div className="space-y-3">
              {client.credentials.map((cred) => (
                <div key={cred.platform} className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border">
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {CHANNEL_LABELS[cred.platform as ECampaignChannel] ?? cred.platform}
                    </p>
                    {cred.last_sync_at && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Última sync: {new Date(cred.last_sync_at).toLocaleString("pt-BR")}
                      </p>
                    )}
                    {cred.error_message && (
                      <p className="text-xs text-danger mt-0.5">{cred.error_message}</p>
                    )}
                  </div>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={
                      cred.sync_status === "ACTIVE" ? "success" :
                      cred.sync_status === "ERROR" ? "danger" :
                      cred.sync_status === "PENDING" ? "warning" : "default"
                    }
                  >
                    {cred.sync_status}
                  </Chip>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </form>
  );
}

export default function HotelClientPortalPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const searchParams = useSearchParams();
  const { push } = useRouter();
  const { data: client, isLoading } = useHotelClient(clientId);

  const defaultTab = searchParams.get("tab") ?? "dashboard";

  const TABS = [
    { key: "dashboard", label: "Dashboard", icon: BarChart3 },
    { key: "campaigns", label: "Campanhas", icon: Megaphone },
    { key: "site", label: "Site", icon: Globe },
    { key: "ota", label: "OTA vs Direto", icon: TrendingUp },
    { key: "reports", label: "Relatório", icon: FileText },
    { key: "config", label: "Configurações", icon: Settings },
  ];

  return (
    <LayoutScopeRoot routeActive="hotel-portal">
      <div className="mx-auto space-y-6 px-4 py-8 sm:px-8 lg:px-10 max-w-[1400px] animate-fade-in">
        <div className="flex items-center gap-4">
          <Button
            variant="flat"
            isIconOnly
            onPress={() => push("/dashboard/hotel-portal")}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {isLoading ? (
            <div className="h-8 w-40 rounded-xl bg-default-100 animate-pulse" />
          ) : (
            <div className="flex items-center gap-3">
              {client?.logo_url ? (
                <img src={client.logo_url} alt={client.hotel_name} className="h-9 w-9 rounded-xl object-cover border border-border" />
              ) : (
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-foreground">{client?.hotel_name}</h1>
                <p className="text-sm text-muted-foreground">{client?.country}</p>
              </div>
              {client && (
                <Chip size="sm" variant="flat" color={client.is_active ? "success" : "danger"} className="ml-2">
                  {client.is_active ? "Ativo" : "Inativo"}
                </Chip>
              )}
            </div>
          )}
        </div>

        <Tabs
          defaultSelectedKey={defaultTab}
          variant="underlined"
          classNames={{
            tabList: "border-b border-border w-full overflow-x-auto",
            cursor: "bg-primary",
            tab: "font-medium text-sm",
          }}
        >
          {TABS.map(({ key, label, icon: Icon }) => (
            <Tab
              key={key}
              title={
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </div>
              }
            >
              <div className="pt-6">
                {key === "dashboard" && <DashboardTab clientId={clientId} />}
                {key === "campaigns" && <CampaignsTab clientId={clientId} />}
                {key === "site" && <SiteTab clientId={clientId} />}
                {key === "ota" && <OtaTab clientId={clientId} />}
                {key === "reports" && <ReportsTab clientId={clientId} />}
                {key === "config" && <ConfigTab clientId={clientId} />}
              </div>
            </Tab>
          ))}
        </Tabs>
      </div>
    </LayoutScopeRoot>
  );
}
