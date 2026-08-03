"use client";

import { useState, useMemo } from "react";
import { use } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
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
  useUpdateReport,
  useSubmitReportForReview,
  useUpdateHotelClient,
  useKpi,
  useKpiSummary,
  useInsertKpi,
  useReputation,
  useReputationSummary,
  useInsertReputation,
  useBookingWindow,
  useInsertBookingWindow,
  useRateParity,
  useRateParityViolations,
  useInsertRateParity,
  useBudget,
  useBudgetComparison,
  useInsertBudget,
  useReservations,
  useReservationStats,
  useCreateReservation,
  useGuests,
  useReactivationList,
  useCreateGuest,
  useWhatsAppTemplates,
  useWhatsAppMessages,
  useCreateWhatsAppTemplate,
  useSendWhatsApp,
  useWhatsAppLinks,
  useWhatsAppLinkStats,
  useCreateWhatsAppLink,
  useUpdateWhatsAppLink,
  useDeleteWhatsAppLink,
} from "@/src/shared/hooks/hotel-portal";
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
  Select,
  SelectItem,
} from "@heroui/react";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Building2,
  Globe,
  Megaphone,
  TrendingUp,
  FileText,
  Database,
  Settings,
  CheckCircle2,
  DollarSign,
  Users,
  MousePointer,
  ShoppingCart,
  Star,
  CalendarRange,
  ShieldCheck,
  PiggyBank,
  CalendarCheck,
  MessageCircle,
  Send,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  Link2,
  Copy,
  Trash2,
  Pencil,
  X,
  Smartphone,
  Monitor,
  Tablet,
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
import { EmptyState } from "@/src/presentation/components/organisms/hotel-portal/ui";
import type {
  MonthlyReport,
  PublishReportDto,
  ECampaignChannel,
} from "@/src/shared/domain/types/@hotel-portal";

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

  const kpi = data.kpi ?? {
    direct_bookings: 0,
    ota_bookings: 0,
    direct_revenue: 0,
    ota_revenue: 0,
    commission_recovered_month: 0,
    commission_recovered_total: 0,
    commission_projected_annual: 0,
    occupancy_rate: 0,
    target_occupancy: 0,
    target_direct_pct: 0,
    site_visitors: 0,
    site_conversion_rate: 0,
  };
  const ota_data_missing = data.ota_data_missing ?? false;

  const chartData = (data.timeseries ?? []).map((t) => ({
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

  const summary = data.summary ?? [];
  const metrics = data.metrics ?? [];

  return (
    <div className="space-y-6">
      {summary.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.map((s) => (
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

      {metrics.length === 0 ? (
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
                  {metrics.slice(0, 20).map((m) => (
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

  const totals = data.totals ?? {
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

  const trafficData = [
    { name: "Orgânico", value: totals.organic_visitors },
    { name: "Pago", value: totals.paid_visitors },
    { name: "Direto", value: totals.direct_visitors },
    { name: "Social", value: totals.social_visitors },
  ];

  const PIE_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b"];

  return (
    <div className="space-y-6">
      {/* Apenas o que GA4/pixel realmente mede (Plano §3.4) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Total de Visitantes" value={fmt(totals.total_visitors)} icon={Users} />
        <KpiCard label="Páginas de Pacotes" value={fmt(totals.package_page_views)} icon={Globe} />
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
            <p className="font-semibold text-foreground mb-2">Funil de Reservas</p>
            <p className="text-xs text-muted-foreground mb-4">
              Início de checkout e reservas concluídas vêm do motor de reservas,
              não do tracking do site.
            </p>
            <EmptyState reason="via-motor-em-breve" compact />
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

function MetricsTab({ clientId }: { clientId: string }) {
  const { data: kpiList, isLoading: kpiLoading } = useKpi(clientId);
  const { data: kpiSummary } = useKpiSummary(clientId);
  const { mutateAsync: insertKpi, isPending: kpiPending } = useInsertKpi(clientId);

  const { data: repList, isLoading: repLoading } = useReputation(clientId);
  const { data: repSummary } = useReputationSummary(clientId);
  const { mutateAsync: insertRep, isPending: repPending } = useInsertReputation(clientId);

  const { data: bwList } = useBookingWindow(clientId);
  const { mutateAsync: insertBw, isPending: bwPending } = useInsertBookingWindow(clientId);

  const { data: violations } = useRateParityViolations(clientId);
  const { mutateAsync: insertRp, isPending: rpPending } = useInsertRateParity(clientId);

  const { data: budgetComparison } = useBudgetComparison(clientId);
  const { mutateAsync: insertBudget, isPending: budgetPending } = useInsertBudget(clientId);

  const [kpiForm, setKpiForm] = useState({ reference_month: new Date().toISOString().slice(0, 7), revpar: "", adr: "", occupancy_rate: "" });
  const [repForm, setRepForm] = useState({ reference_month: new Date().toISOString().slice(0, 7), score: "", platform: "google", review_count: "" });
  const [bwForm, setBwForm] = useState({ reference_month: new Date().toISOString().slice(0, 7), avg_days_advance: "" });
  const [rpForm, setRpForm] = useState({ check_date: new Date().toISOString().slice(0, 10), room_type: "", our_rate: "", ota_platform: "booking", ota_rate: "" });
  const [budgetForm, setBudgetForm] = useState({ reference_month: new Date().toISOString().slice(0, 7), channel: "META_ADS", planned_amount: "", actual_amount: "" });

  async function handleKpi(e: React.FormEvent) {
    e.preventDefault();
    try {
      await insertKpi({ reference_month: `${kpiForm.reference_month}-01`, revpar: parseFloat(kpiForm.revpar), adr: parseFloat(kpiForm.adr), occupancy_rate: parseFloat(kpiForm.occupancy_rate) / 100 });
      toast.success("KPI inserido!");
      setKpiForm((p) => ({ ...p, revpar: "", adr: "", occupancy_rate: "" }));
    } catch { toast.error("Erro ao inserir KPI."); }
  }

  async function handleRep(e: React.FormEvent) {
    e.preventDefault();
    try {
      await insertRep({ reference_month: `${repForm.reference_month}-01`, score: parseFloat(repForm.score), platform: repForm.platform, review_count: repForm.review_count ? parseInt(repForm.review_count) : undefined });
      toast.success("Reputação inserida!");
      setRepForm((p) => ({ ...p, score: "", review_count: "" }));
    } catch { toast.error("Erro ao inserir reputação."); }
  }

  async function handleBw(e: React.FormEvent) {
    e.preventDefault();
    try {
      await insertBw({ reference_month: `${bwForm.reference_month}-01`, avg_days_advance: parseFloat(bwForm.avg_days_advance) });
      toast.success("Booking window inserido!");
      setBwForm((p) => ({ ...p, avg_days_advance: "" }));
    } catch { toast.error("Erro ao inserir booking window."); }
  }

  async function handleRp(e: React.FormEvent) {
    e.preventDefault();
    try {
      await insertRp({ check_date: rpForm.check_date, room_type: rpForm.room_type, our_rate: parseFloat(rpForm.our_rate), ota_platform: rpForm.ota_platform, ota_rate: parseFloat(rpForm.ota_rate) });
      toast.success("Rate parity inserido!");
      setRpForm((p) => ({ ...p, room_type: "", our_rate: "", ota_rate: "" }));
    } catch { toast.error("Erro ao inserir rate parity."); }
  }

  async function handleBudget(e: React.FormEvent) {
    e.preventDefault();
    try {
      await insertBudget({ reference_month: `${budgetForm.reference_month}-01`, channel: budgetForm.channel, planned_amount: parseFloat(budgetForm.planned_amount), actual_amount: budgetForm.actual_amount ? parseFloat(budgetForm.actual_amount) : undefined });
      toast.success("Budget inserido!");
      setBudgetForm((p) => ({ ...p, planned_amount: "", actual_amount: "" }));
    } catch { toast.error("Erro ao inserir budget."); }
  }

  return (
    <div className="space-y-8">
      {/* KPI */}
      <div className="space-y-4">
        <SectionHeader title="KPI Hoteleiro (RevPAR / ADR / Ocupação)" />
        {kpiSummary && (
          <div className="grid grid-cols-3 gap-4">
            <KpiCard label="RevPAR Médio" value={fmt(kpiSummary.avg_revpar, "currency")} icon={DollarSign} accent />
            <KpiCard label="ADR Médio" value={fmt(kpiSummary.avg_adr, "currency")} icon={DollarSign} />
            <KpiCard label="Ocupação Média" value={fmt(kpiSummary.avg_occupancy, "percent")} icon={BarChart3} />
          </div>
        )}
        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-6 space-y-4">
            <form onSubmit={handleKpi} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input label="Mês" type="month" value={kpiForm.reference_month} onChange={(e) => setKpiForm((p) => ({ ...p, reference_month: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="RevPAR (R$)" type="number" value={kpiForm.revpar} onChange={(e) => setKpiForm((p) => ({ ...p, revpar: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="ADR (R$)" type="number" value={kpiForm.adr} onChange={(e) => setKpiForm((p) => ({ ...p, adr: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Ocupação (%)" type="number" value={kpiForm.occupancy_rate} onChange={(e) => setKpiForm((p) => ({ ...p, occupancy_rate: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <div className="col-span-full flex justify-end">
                <Button type="submit" color="primary" isLoading={kpiPending} size="sm">Inserir KPI</Button>
              </div>
            </form>
          </CardBody>
        </Card>
        {!kpiLoading && kpiList && kpiList.length > 0 && (
          <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
            <CardBody className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">{["Mês", "RevPAR", "ADR", "Ocupação"].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr></thead>
                  <tbody>{kpiList.map((k) => <tr key={k.id} className="border-b border-border/50 hover:bg-default-100/50"><td className="px-4 py-3 font-medium">{k.reference_month.slice(0, 7)}</td><td className="px-4 py-3">{fmt(k.revpar, "currency")}</td><td className="px-4 py-3">{fmt(k.adr, "currency")}</td><td className="px-4 py-3">{fmt(k.occupancy_rate, "percent")}</td></tr>)}</tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Reputation */}
      <div className="space-y-4">
        <SectionHeader title="Reputação Online" />
        {repSummary && (
          <div className="grid grid-cols-2 gap-4">
            <KpiCard label="Nota Média" value={repSummary.avg_score.toFixed(1)} icon={Star} accent />
            <KpiCard label="Total de Reviews" value={fmt(repSummary.total_reviews)} icon={Users} />
          </div>
        )}
        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-6">
            <form onSubmit={handleRep} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input label="Mês" type="month" value={repForm.reference_month} onChange={(e) => setRepForm((p) => ({ ...p, reference_month: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Nota (0-10)" type="number" step="0.1" value={repForm.score} onChange={(e) => setRepForm((p) => ({ ...p, score: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Plataforma" value={repForm.platform} onChange={(e) => setRepForm((p) => ({ ...p, platform: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Nº de Reviews" type="number" value={repForm.review_count} onChange={(e) => setRepForm((p) => ({ ...p, review_count: e.target.value }))} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <div className="col-span-full flex justify-end">
                <Button type="submit" color="primary" isLoading={repPending} size="sm">Inserir Nota</Button>
              </div>
            </form>
          </CardBody>
        </Card>
        {!repLoading && repList && repList.length > 0 && (
          <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
            <CardBody className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">{["Mês", "Plataforma", "Nota", "Reviews"].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr></thead>
                  <tbody>{repList.map((r) => <tr key={r.id} className="border-b border-border/50 hover:bg-default-100/50"><td className="px-4 py-3 font-medium">{r.reference_month.slice(0, 7)}</td><td className="px-4 py-3 capitalize">{r.platform}</td><td className="px-4 py-3 font-semibold text-primary">{r.score}</td><td className="px-4 py-3">{r.review_count ?? "—"}</td></tr>)}</tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Booking Window */}
      <div className="space-y-4">
        <SectionHeader title="Janela de Reserva" />
        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-6">
            <form onSubmit={handleBw} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Mês" type="month" value={bwForm.reference_month} onChange={(e) => setBwForm((p) => ({ ...p, reference_month: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Antecedência Média (dias)" type="number" value={bwForm.avg_days_advance} onChange={(e) => setBwForm((p) => ({ ...p, avg_days_advance: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <div className="flex items-end">
                <Button type="submit" color="primary" isLoading={bwPending} size="sm">Inserir</Button>
              </div>
            </form>
          </CardBody>
        </Card>
        {bwList && bwList.length > 0 && (
          <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
            <CardBody className="p-6">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={bwList.map((b) => ({ month: b.reference_month.slice(0, 7), dias: b.avg_days_advance }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="dias" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Rate Parity */}
      <div className="space-y-4">
        <SectionHeader title="Rate Parity" />
        {violations && violations.length > 0 && (
          <div className="flex items-center gap-2 rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {violations.length} violação(ões) de paridade detectada(s).
          </div>
        )}
        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-6">
            <form onSubmit={handleRp} className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <Input label="Data" type="date" value={rpForm.check_date} onChange={(e) => setRpForm((p) => ({ ...p, check_date: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Tipo de Quarto" value={rpForm.room_type} onChange={(e) => setRpForm((p) => ({ ...p, room_type: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Nossa Tarifa (R$)" type="number" value={rpForm.our_rate} onChange={(e) => setRpForm((p) => ({ ...p, our_rate: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="OTA" value={rpForm.ota_platform} onChange={(e) => setRpForm((p) => ({ ...p, ota_platform: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Tarifa OTA (R$)" type="number" value={rpForm.ota_rate} onChange={(e) => setRpForm((p) => ({ ...p, ota_rate: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <div className="col-span-full flex justify-end">
                <Button type="submit" color="primary" isLoading={rpPending} size="sm">Registrar Checagem</Button>
              </div>
            </form>
          </CardBody>
        </Card>
        {violations && violations.length > 0 && (
          <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
            <CardBody className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">{["Data", "Quarto", "Nossa Tarifa", "OTA", "Tarifa OTA", "Diferença"].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr></thead>
                  <tbody>{violations.map((v) => <tr key={v.id} className="border-b border-border/50 hover:bg-default-100/50"><td className="px-4 py-3">{v.check_date}</td><td className="px-4 py-3">{v.room_type}</td><td className="px-4 py-3">{fmt(v.our_rate, "currency")}</td><td className="px-4 py-3 capitalize">{v.ota_platform}</td><td className="px-4 py-3 text-danger">{fmt(v.ota_rate, "currency")}</td><td className="px-4 py-3 text-danger font-semibold">{v.difference_pct.toFixed(1)}%</td></tr>)}</tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Budget */}
      <div className="space-y-4">
        <SectionHeader title="Budget de Marketing" />
        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-6">
            <form onSubmit={handleBudget} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input label="Mês" type="month" value={budgetForm.reference_month} onChange={(e) => setBudgetForm((p) => ({ ...p, reference_month: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Canal" value={budgetForm.channel} onChange={(e) => setBudgetForm((p) => ({ ...p, channel: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Previsto (R$)" type="number" value={budgetForm.planned_amount} onChange={(e) => setBudgetForm((p) => ({ ...p, planned_amount: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Realizado (R$)" type="number" value={budgetForm.actual_amount} onChange={(e) => setBudgetForm((p) => ({ ...p, actual_amount: e.target.value }))} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <div className="col-span-full flex justify-end">
                <Button type="submit" color="primary" isLoading={budgetPending} size="sm">Registrar Budget</Button>
              </div>
            </form>
          </CardBody>
        </Card>
        {budgetComparison && budgetComparison.length > 0 && (
          <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
            <CardBody className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">{["Mês", "Total Previsto", "Total Realizado", "Variação"].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr></thead>
                  <tbody>{budgetComparison.map((b, i) => <tr key={i} className="border-b border-border/50 hover:bg-default-100/50"><td className="px-4 py-3 font-medium">{b.reference_month?.slice(0, 7)}</td><td className="px-4 py-3">{fmt(b.total_planned, "currency")}</td><td className="px-4 py-3">{fmt(b.total_actual, "currency")}</td><td className={`px-4 py-3 font-semibold ${b.variance > 0 ? "text-success" : "text-danger"}`}>{b.variance_pct.toFixed(1)}%</td></tr>)}</tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

function ReservationsTab({ clientId }: { clientId: string }) {
  const { data: reservations, isLoading } = useReservations(clientId);
  const { data: stats } = useReservationStats(clientId);
  const { mutateAsync: create, isPending } = useCreateReservation(clientId);
  const [form, setForm] = useState({ guest_name: "", guest_email: "", guest_phone: "", check_in: "", check_out: "", room_type: "", total_amount: "", channel: "direct" });
  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [f]: e.target.value }));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create({ ...form, total_amount: parseFloat(form.total_amount) });
      toast.success("Reserva inserida!");
      setForm({ guest_name: "", guest_email: "", guest_phone: "", check_in: "", check_out: "", room_type: "", total_amount: "", channel: "direct" });
    } catch { toast.error("Erro ao criar reserva."); }
  }

  const STATUS_COLOR: Record<string, "success" | "danger" | "warning" | "default"> = {
    confirmed: "success", cancelled: "danger", checked_in: "warning", checked_out: "default", no_show: "danger",
  };

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total de Reservas" value={fmt(stats.total)} icon={CalendarCheck} />
          <KpiCard label="Confirmadas" value={fmt(stats.confirmed)} icon={CheckCircle2} accent />
          <KpiCard label="Receita Total" value={fmt(stats.total_revenue, "currency")} icon={DollarSign} accent />
          <KpiCard label="Estadia Média (dias)" value={(stats.avg_stay_duration ?? 0).toFixed(1)} icon={CalendarRange} />
        </div>
      )}

      <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
        <CardBody className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarCheck className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Inserir Reserva Manual</h3>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Nome do Hóspede" value={form.guest_name} onChange={set("guest_name")} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Email" type="email" value={form.guest_email} onChange={set("guest_email")} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Telefone" value={form.guest_phone} onChange={set("guest_phone")} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input label="Check-in" type="date" value={form.check_in} onChange={set("check_in")} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Check-out" type="date" value={form.check_out} onChange={set("check_out")} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Tipo de Quarto" value={form.room_type} onChange={set("room_type")} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Valor Total (R$)" type="number" value={form.total_amount} onChange={set("total_amount")} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Canal" value={form.channel} onChange={set("channel")} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <div className="flex items-end justify-end">
                <Button type="submit" color="primary" isLoading={isPending} className="font-medium">Salvar Reserva</Button>
              </div>
            </div>
          </form>
        </CardBody>
      </Card>

      {isLoading ? <TabLoading /> : reservations && reservations.length > 0 ? (
        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">{["Hóspede", "Check-in", "Check-out", "Canal", "Valor", "Status"].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr></thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-default-100/50">
                      <td className="px-4 py-3 font-medium">{r.guest_name}</td>
                      <td className="px-4 py-3">{new Date(r.check_in).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3">{new Date(r.check_out).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3 capitalize">{r.channel}</td>
                      <td className="px-4 py-3">{fmt(r.total_amount, "currency")}</td>
                      <td className="px-4 py-3"><Chip size="sm" variant="flat" color={STATUS_COLOR[r.status] ?? "default"}>{r.status}</Chip></td>
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

function GuestsTab({ clientId }: { clientId: string }) {
  const [search, setSearch] = useState("");
  const { data: guests, isLoading } = useGuests(clientId, search ? { search } : undefined);
  const { data: reactivation } = useReactivationList(clientId, { days: 90 });
  const { mutateAsync: create, isPending } = useCreateGuest(clientId);
  const [form, setForm] = useState({ name: "", email: "", phone: "", nationality: "" });
  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [f]: e.target.value }));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create(form);
      toast.success("Hóspede criado!");
      setForm({ name: "", email: "", phone: "", nationality: "" });
    } catch { toast.error("Erro ao criar hóspede."); }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <KpiCard label="Total de Hóspedes" value={fmt(guests?.length ?? 0)} icon={Users} />
        <KpiCard label="Lista de Reativação (90d)" value={fmt(reactivation?.length ?? 0)} icon={RefreshCw} accent />
      </div>

      <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
        <CardBody className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Cadastrar Hóspede</h3>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input label="Nome" value={form.name} onChange={set("name")} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
            <Input label="Email" type="email" value={form.email} onChange={set("email")} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
            <Input label="Telefone" value={form.phone} onChange={set("phone")} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
            <Input label="Nacionalidade" value={form.nationality} onChange={set("nationality")} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
            <div className="col-span-full flex justify-end">
              <Button type="submit" color="primary" isLoading={isPending} size="sm">Cadastrar</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <div className="flex gap-3 items-center">
        <Input placeholder="Buscar hóspede..." value={search} onChange={(e) => setSearch(e.target.value)} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border max-w-sm" }} />
      </div>

      {isLoading ? <TabLoading /> : guests && guests.length > 0 ? (
        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">{["Nome", "Email", "Telefone", "Estadias", "Total Gasto", "Última Estadia"].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr></thead>
                <tbody>
                  {guests.map((g) => (
                    <tr key={g.id} className="border-b border-border/50 hover:bg-default-100/50">
                      <td className="px-4 py-3 font-medium">{g.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{g.email ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{g.phone ?? "—"}</td>
                      <td className="px-4 py-3">{g.total_stays}</td>
                      <td className="px-4 py-3">{fmt(g.total_spent, "currency")}</td>
                      <td className="px-4 py-3">{g.last_stay_at ? new Date(g.last_stay_at).toLocaleDateString("pt-BR") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card className="border-border bg-default-50 shadow-none border-dashed rounded-3xl">
          <CardBody className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-foreground font-medium">Nenhum hóspede encontrado</p>
          </CardBody>
        </Card>
      )}

      {reactivation && reactivation.length > 0 && (
        <div className="space-y-3">
          <SectionHeader title={`Reativação — sem reservas há 90+ dias (${reactivation.length})`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reactivation.slice(0, 12).map((g) => (
              <Card key={g.id} className="bg-warning/5 border border-warning/20 rounded-2xl shadow-none">
                <CardBody className="p-4 flex flex-row items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-warning" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{g.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Última: {g.last_stay_at ? new Date(g.last_stay_at).toLocaleDateString("pt-BR") : "nunca"}
                    </p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WhatsAppTab({ clientId }: { clientId: string }) {
  const { data: templates, isLoading: templatesLoading } = useWhatsAppTemplates(clientId);
  const { data: messages, isLoading: messagesLoading } = useWhatsAppMessages(clientId);
  const { mutateAsync: createTemplate, isPending: creatingTemplate } = useCreateWhatsAppTemplate(clientId);
  const { mutateAsync: sendMsg, isPending: sending } = useSendWhatsApp(clientId);

  const [templateForm, setTemplateForm] = useState({ name: "", body: "", category: "marketing" });
  const [sendForm, setSendForm] = useState({ to_phone: "", to_name: "", body: "" });

  async function handleCreateTemplate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createTemplate(templateForm);
      toast.success("Template criado!");
      setTemplateForm({ name: "", body: "", category: "marketing" });
    } catch { toast.error("Erro ao criar template."); }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    try {
      await sendMsg(sendForm);
      toast.success("Mensagem enviada!");
      setSendForm({ to_phone: "", to_name: "", body: "" });
    } catch { toast.error("Erro ao enviar mensagem."); }
  }

  const MSG_STATUS_COLOR: Record<string, "success" | "warning" | "danger" | "default"> = {
    read: "success", delivered: "success", sent: "warning", failed: "danger",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Criar Template</h3>
            </div>
            <form onSubmit={handleCreateTemplate} className="space-y-3">
              <Input label="Nome do template" value={templateForm.name} onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Categoria" value={templateForm.category} onChange={(e) => setTemplateForm((p) => ({ ...p, category: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Textarea label="Corpo da mensagem" value={templateForm.body} onChange={(e) => setTemplateForm((p) => ({ ...p, body: e.target.value }))} isRequired variant="bordered" minRows={3} classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <div className="flex justify-end">
                <Button type="submit" color="primary" isLoading={creatingTemplate} size="sm">Criar Template</Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center">
                <Send className="h-4 w-4 text-success" />
              </div>
              <h3 className="font-semibold text-foreground">Enviar Mensagem</h3>
            </div>
            <form onSubmit={handleSend} className="space-y-3">
              <Input label="Telefone (ex: 5511999999999)" value={sendForm.to_phone} onChange={(e) => setSendForm((p) => ({ ...p, to_phone: e.target.value }))} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Nome do destinatário" value={sendForm.to_name} onChange={(e) => setSendForm((p) => ({ ...p, to_name: e.target.value }))} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Textarea label="Mensagem" value={sendForm.body} onChange={(e) => setSendForm((p) => ({ ...p, body: e.target.value }))} isRequired variant="bordered" minRows={3} classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <div className="flex justify-end">
                <Button type="submit" color="success" isLoading={sending} size="sm" className="text-white">Enviar</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>

      {!templatesLoading && templates && templates.length > 0 && (
        <div className="space-y-3">
          <SectionHeader title="Templates" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((t) => (
              <Card key={t.id} className="bg-default-50 border border-border rounded-2xl shadow-none">
                <CardBody className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground text-sm">{t.name}</p>
                    <Chip size="sm" variant="flat" color={t.status === "active" ? "success" : t.status === "rejected" ? "danger" : "warning"}>{t.status}</Chip>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.body}</p>
                  <p className="text-xs text-muted-foreground capitalize">{t.category}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!messagesLoading && messages && messages.length > 0 && (
        <div className="space-y-3">
          <SectionHeader title="Histórico de Mensagens" />
          <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
            <CardBody className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">{["Para", "Mensagem", "Enviado em", "Status"].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr></thead>
                  <tbody>
                    {messages.map((m) => (
                      <tr key={m.id} className="border-b border-border/50 hover:bg-default-100/50">
                        <td className="px-4 py-3 font-medium">{m.to_name ? `${m.to_name} (${m.to_phone})` : m.to_phone}</td>
                        <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground">{m.body}</td>
                        <td className="px-4 py-3">{new Date(m.sent_at).toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3"><Chip size="sm" variant="flat" color={MSG_STATUS_COLOR[m.status] ?? "default"}>{m.status}</Chip></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

const CUSTOM_CODE_RE = /^[a-zA-Z0-9_-]{3,50}$/;

/** Returns an error message if the custom code is invalid, or null if valid/empty. */
function validateCustomCode(code: string): string | null {
  if (!code) return null;
  if (!CUSTOM_CODE_RE.test(code))
    return "Link personalizado inválido: use 3 a 50 caracteres (letras, números, - ou _).";
  return null;
}

function WhatsAppLinksTab({ clientId }: { clientId: string }) {
  const { data: links, isLoading } = useWhatsAppLinks(clientId);
  const { mutateAsync: create, isPending: creating } = useCreateWhatsAppLink(clientId);
  const { mutateAsync: update, isPending: updating } = useUpdateWhatsAppLink(clientId);
  const { mutateAsync: del, isPending: deleting } = useDeleteWhatsAppLink(clientId);

  const [form, setForm] = useState({ name: "", phone_number: "", message: "", custom_code: "", utm_source: "", utm_medium: "", utm_campaign: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", message: "", custom_code: "", utm_source: "", utm_medium: "", utm_campaign: "" });
  const [statsId, setStatsId] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useWhatsAppLinkStats(clientId, statsId);

  const setF = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  const setEF = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditForm((p) => ({ ...p, [f]: e.target.value }));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const codeError = validateCustomCode(form.custom_code.trim());
    if (codeError) {
      toast.error(codeError);
      return;
    }
    try {
      await create({
        name: form.name,
        phone_number: form.phone_number,
        message: form.message || undefined,
        custom_code: form.custom_code.trim() || undefined,
        utm_source: form.utm_source || undefined,
        utm_medium: form.utm_medium || undefined,
        utm_campaign: form.utm_campaign || undefined,
      });
      toast.success("Link criado!");
      setForm({ name: "", phone_number: "", message: "", custom_code: "", utm_source: "", utm_medium: "", utm_campaign: "" });
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error("Esse link já está em uso, escolha outro.");
        return;
      }
      toast.error("Erro ao criar link.");
    }
  }

  function startEdit(link: { id: string; name: string; message?: string; code?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string }) {
    setEditingId(link.id);
    setEditForm({
      name: link.name,
      message: link.message ?? "",
      custom_code: link.code ?? "",
      utm_source: link.utm_source ?? "",
      utm_medium: link.utm_medium ?? "",
      utm_campaign: link.utm_campaign ?? "",
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const codeError = validateCustomCode(editForm.custom_code.trim());
    if (codeError) {
      toast.error(codeError);
      return;
    }
    try {
      await update({
        id: editingId,
        data: {
          name: editForm.name,
          message: editForm.message || undefined,
          custom_code: editForm.custom_code.trim() || undefined,
          utm_source: editForm.utm_source || undefined,
          utm_medium: editForm.utm_medium || undefined,
          utm_campaign: editForm.utm_campaign || undefined,
        },
      });
      toast.success("Link atualizado!");
      setEditingId(null);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error("Esse link já está em uso, escolha outro.");
        return;
      }
      toast.error("Erro ao atualizar.");
    }
  }

  async function handleToggle(id: string, is_active: boolean) {
    try {
      await update({ id, data: { is_active: !is_active } });
    } catch {
      toast.error("Erro ao alterar status.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await del(id);
      toast.success("Link removido.");
      if (statsId === id) setStatsId(null);
    } catch {
      toast.error("Erro ao remover link.");
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => toast.success("URL copiada!"));
  }

  const DEVICE_ICONS: Record<string, React.ElementType> = {
    mobile: Smartphone,
    desktop: Monitor,
    tablet: Tablet,
  };

  const DEVICE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#a855f7"];
  const COUNTRY_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#14b8a6"];

  return (
    <div className="space-y-6">
      {/* Create form */}
      <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
        <CardBody className="p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Link2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Criar Link de WhatsApp Rastreável</h3>
              <p className="text-xs text-muted-foreground">Gera um link curto que redireciona ao WhatsApp e registra cada clique.</p>
            </div>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Nome (ex: Recepção)"
              value={form.name}
              onChange={setF("name")}
              isRequired
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
            />
            <Input
              label="Telefone (ex: 5511999999999)"
              value={form.phone_number}
              onChange={setF("phone_number")}
              isRequired
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
            />
            <Input
              label="Mensagem pré-preenchida (opcional)"
              value={form.message}
              onChange={setF("message")}
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
            />
            <Input
              label="Link personalizado (opcional)"
              value={form.custom_code}
              onChange={setF("custom_code")}
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
              placeholder="atendimento-caliari"
              description="3-50 caracteres: letras, números, - ou _. Vazio = gerado pelo nome."
              startContent={<span className="text-xs text-muted-foreground">/wa/</span>}
            />
            <Input
              label="UTM Source (opcional)"
              value={form.utm_source}
              onChange={setF("utm_source")}
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
              placeholder="instagram"
            />
            <Input
              label="UTM Medium (opcional)"
              value={form.utm_medium}
              onChange={setF("utm_medium")}
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
              placeholder="social"
            />
            <Input
              label="UTM Campaign (opcional)"
              value={form.utm_campaign}
              onChange={setF("utm_campaign")}
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
              placeholder="junho2026"
            />
            <div className="col-span-full flex justify-end">
              <Button type="submit" color="primary" isLoading={creating} className="font-medium">
                Gerar Link
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Edit modal */}
      {editingId && (
        <Card className="bg-warning/5 border border-warning/30 rounded-3xl shadow-none">
          <CardBody className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Editar Link</h3>
              <Button isIconOnly size="sm" variant="flat" onPress={() => setEditingId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleEdit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nome"
                value={editForm.name}
                onChange={setEF("name")}
                isRequired
                variant="bordered"
                classNames={{ inputWrapper: "rounded-2xl border-border" }}
              />
              <Input
                label="Mensagem"
                value={editForm.message}
                onChange={setEF("message")}
                variant="bordered"
                classNames={{ inputWrapper: "rounded-2xl border-border" }}
              />
              <Input
                label="Link personalizado"
                value={editForm.custom_code}
                onChange={setEF("custom_code")}
                variant="bordered"
                classNames={{ inputWrapper: "rounded-2xl border-border" }}
                placeholder="atendimento-caliari"
                description="3-50 caracteres: letras, números, - ou _."
                startContent={<span className="text-xs text-muted-foreground">/wa/</span>}
              />
              <Input
                label="UTM Source"
                value={editForm.utm_source}
                onChange={setEF("utm_source")}
                variant="bordered"
                classNames={{ inputWrapper: "rounded-2xl border-border" }}
              />
              <Input
                label="UTM Medium"
                value={editForm.utm_medium}
                onChange={setEF("utm_medium")}
                variant="bordered"
                classNames={{ inputWrapper: "rounded-2xl border-border" }}
              />
              <Input
                label="UTM Campaign"
                value={editForm.utm_campaign}
                onChange={setEF("utm_campaign")}
                variant="bordered"
                classNames={{ inputWrapper: "rounded-2xl border-border" }}
              />
              <p className="col-span-full text-xs text-muted-foreground -mt-1">
                O número de WhatsApp não pode ser alterado após a criação.
              </p>
              <div className="col-span-full flex gap-3 justify-end">
                <Button variant="flat" onPress={() => setEditingId(null)}>Cancelar</Button>
                <Button type="submit" color="primary" isLoading={updating} className="font-medium">Salvar</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Links list */}
      {isLoading ? (
        <TabLoading />
      ) : links && links.length > 0 ? (
        <div className="space-y-3">
          <SectionHeader title={`Links criados (${links.length})`} />
          {links.map((link) => (
            <Card
              key={link.id}
              className={`border rounded-2xl shadow-none transition-colors ${statsId === link.id ? "border-primary/40 bg-primary/5" : "border-border bg-default-50"}`}
            >
              <CardBody className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setStatsId(statsId === link.id ? null : link.id)}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground text-sm">{link.name}</p>
                    <Chip size="sm" variant="flat" color={link.is_active ? "success" : "default"}>
                      {link.is_active ? "Ativo" : "Inativo"}
                    </Chip>
                    <Chip size="sm" variant="flat" color="primary">
                      {fmt(link.total_clicks)} cliques
                    </Chip>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{link.short_url}</p>
                  {link.message && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5 truncate italic">"{link.message}"</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="flat"
                    isIconOnly
                    onPress={() => copyUrl(link.short_url)}
                    title="Copiar URL"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    isIconOnly
                    onPress={() => startEdit(link)}
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color={link.is_active ? "warning" : "success"}
                    onPress={() => handleToggle(link.id, link.is_active)}
                    isLoading={updating}
                    className="text-xs"
                  >
                    {link.is_active ? "Pausar" : "Ativar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    isIconOnly
                    onPress={() => handleDelete(link.id)}
                    isLoading={deleting}
                    title="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardBody>

              {/* Stats drawer inline */}
              {statsId === link.id && (
                <div className="border-t border-primary/20 p-4 sm:p-6 space-y-6">
                  {statsLoading ? (
                    <div className="flex justify-center py-8">
                      <Spinner size="md" color="primary" />
                    </div>
                  ) : stats ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <KpiCard label="Total de Cliques" value={fmt(stats.total_clicks)} icon={MousePointer} accent />
                        <KpiCard
                          label="Dispositivo mais comum"
                          value={stats.by_device?.[0]?.device ?? "—"}
                          icon={DEVICE_ICONS[stats.by_device?.[0]?.device] ?? Monitor}
                        />
                        <KpiCard
                          label="País principal"
                          value={stats.by_country?.[0]?.country ?? "—"}
                          icon={Globe}
                        />
                      </div>

                      {(stats.clicks_by_day?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-3">Cliques por dia — últimos 30 dias</p>
                          <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={stats.clicks_by_day.map((d) => ({ date: d.date.slice(5), cliques: d.count }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip />
                              <Bar dataKey="cliques" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {(stats.by_device?.length ?? 0) > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-3">Por Dispositivo</p>
                            <ResponsiveContainer width="100%" height={160}>
                              <PieChart>
                                <Pie
                                  data={stats.by_device.map((d) => ({ name: d.device, value: d.count }))}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={60}
                                  dataKey="value"
                                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                  labelLine={false}
                                >
                                  {stats.by_device.map((_, i) => (
                                    <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {(stats.by_country?.length ?? 0) > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-3">Top Países</p>
                            <div className="space-y-2">
                              {stats.by_country.slice(0, 8).map((c, i) => {
                                const pct = stats.total_clicks > 0 ? (c.count / stats.total_clicks) * 100 : 0;
                                return (
                                  <div key={c.country}>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-muted-foreground">{c.country || "Desconhecido"}</span>
                                      <span className="font-medium text-foreground">{c.count}</span>
                                    </div>
                                    <div className="h-1.5 bg-default-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${Math.min(pct, 100)}%`, background: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {(stats.by_region?.length ?? 0) > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-3">Top Regiões</p>
                            <div className="space-y-2">
                              {stats.by_region.slice(0, 8).map((r, i) => {
                                const pct = stats.total_clicks > 0 ? (r.count / stats.total_clicks) * 100 : 0;
                                return (
                                  <div key={r.region}>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-muted-foreground">{r.region || "Desconhecida"}</span>
                                      <span className="font-medium text-foreground">{r.count}</span>
                                    </div>
                                    <div className="h-1.5 bg-default-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${Math.min(pct, 100)}%`, background: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {(stats.by_city?.length ?? 0) > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-3">Top Cidades</p>
                            <div className="space-y-2">
                              {stats.by_city.slice(0, 8).map((c, i) => {
                                const pct = stats.total_clicks > 0 ? (c.count / stats.total_clicks) * 100 : 0;
                                const label = !c.city || c.city.toLowerCase() === "unknown" ? "Desconhecida" : c.city;
                                return (
                                  <div key={c.city}>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-muted-foreground">{label}</span>
                                      <span className="font-medium text-foreground">{c.count}</span>
                                    </div>
                                    <div className="h-1.5 bg-default-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${Math.min(pct, 100)}%`, background: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {(stats.recent_clicks?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-3">Cliques recentes</p>
                          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                            {stats.recent_clicks.slice(0, 20).map((c) => (
                              <div
                                key={c.id}
                                className="flex items-center justify-between gap-3 text-xs bg-default-50 rounded-xl px-3 py-2"
                              >
                                <span className="text-muted-foreground whitespace-nowrap">
                                  {new Date(c.clicked_at).toLocaleString("pt-BR")}
                                </span>
                                <span className="text-foreground truncate text-right">
                                  {[c.city, c.region, c.country]
                                    .filter((v) => v && v.toLowerCase() !== "unknown")
                                    .join(", ") || "Local desconhecido"}
                                  {c.device_type ? ` · ${c.device_type}` : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border bg-default-50 shadow-none border-dashed rounded-3xl">
          <CardBody className="flex flex-col items-center justify-center py-16 text-center">
            <Link2 className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-foreground font-medium">Nenhum link criado ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie links rastreáveis para cada ponto de contato do hotel.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
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
    { key: "metrics", label: "Métricas", icon: Star },
    { key: "reservations", label: "Reservas", icon: CalendarCheck },
    { key: "guests", label: "Hóspedes", icon: Users },
    { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { key: "whatsapp-links", label: "Links WA", icon: Link2 },
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
                {key === "metrics" && <MetricsTab clientId={clientId} />}
                {key === "reservations" && <ReservationsTab clientId={clientId} />}
                {key === "guests" && <GuestsTab clientId={clientId} />}
                {key === "whatsapp" && <WhatsAppTab clientId={clientId} />}
                {key === "whatsapp-links" && <WhatsAppLinksTab clientId={clientId} />}
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
