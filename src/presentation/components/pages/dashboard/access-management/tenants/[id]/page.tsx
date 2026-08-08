"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Spinner,
  Tabs,
  Tab,
  Input,
  Textarea,
} from "@heroui/react";
import {
  ArrowLeft,
  Building2,
  Globe,
  Hash,
  Calendar,
  CheckCircle,
  XCircle,
  Shield,
  User,
  Mail,
  BarChart3,
  Database,
  FileText,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
} from "lucide-react";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import { TenantModulesCard } from "@/src/modules/settings/presentation/components/tenant-modules-card";
import { useTenantById } from "@/src/shared/hooks/access-management/useTenants";
import { AdminRole } from "@/src/shared/domain/types/@access-management";
import { toast } from "react-hot-toast";
import {
  useHotelClientByUserId,
  useHotelPortalOtaData,
  useHotelPortalReports,
  useInsertOtaData,
  useCreateReport,
  usePublishReport,
  useUpdateReport,
} from "@/src/shared/hooks/hotel-portal";
import type { MonthlyReport, PublishReportDto } from "@/src/shared/domain/types/@hotel-portal";

// ── helpers ────────────────────────────────────────────────────────────────

const ROLE_COLOR: Record<AdminRole, "primary" | "secondary" | "success" | "warning" | "danger"> = {
  [AdminRole.super_admin]: "danger",
  [AdminRole.owner]: "warning",
  [AdminRole.manager]: "primary",
  [AdminRole.editor]: "secondary",
  [AdminRole.viewer]: "success",
};

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

const STATUS_CONFIG: Record<string, { label: string; color: "default" | "warning" | "success" }> = {
  DRAFT: { label: "Rascunho", color: "default" },
  REVIEW: { label: "Em revisão", color: "warning" },
  PUBLISHED: { label: "Publicado", color: "success" },
};

// ── OTA section ─────────────────────────────────────────────────────────────

function OtaSection({ clientId }: { clientId: string }) {
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
              <p className="text-xs text-muted-foreground">Booking, GetYourGuide e Viator — dados mensais.</p>
            </div>
          </div>
          <form onSubmit={handleInsert} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Mês de referência" type="month" value={form.reference_month} onChange={set("reference_month")} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Total de Reservas OTA" type="number" value={form.ota_bookings} onChange={set("ota_bookings")} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
              <Input label="Receita Total OTA (R$)" type="number" value={form.ota_revenue} onChange={set("ota_revenue")} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input label="Comissão OTA (%)" type="number" value={form.commission_rate} onChange={set("commission_rate")} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
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
        <div className="flex justify-center py-10"><Spinner size="lg" color="primary" /></div>
      ) : otaList && otaList.length > 0 ? (
        <Card className="bg-default-50 border border-border rounded-3xl shadow-none overflow-hidden">
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-default-100/50">
                    {["Mês", "Reservas OTA", "Receita OTA", "Comissão Paga", "Taxa"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {otaList.map((o) => (
                    <tr key={o.id} className="border-b border-border/50 hover:bg-default-100/40 transition-colors">
                      <td className="px-5 py-3 font-semibold text-foreground">{o.reference_month.slice(0, 7)}</td>
                      <td className="px-5 py-3 text-foreground">{o.ota_bookings}</td>
                      <td className="px-5 py-3 text-foreground">{fmtCurrency(o.ota_revenue)}</td>
                      <td className="px-5 py-3 text-danger font-medium">{fmtCurrency(o.commission_paid)}</td>
                      <td className="px-5 py-3 text-muted-foreground">{(o.commission_rate * 100).toFixed(0)}%</td>
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

// ── Reports section ──────────────────────────────────────────────────────────

function ReportsSection({ clientId }: { clientId: string }) {
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

  if (isLoading) return <div className="flex justify-center py-10"><Spinner size="lg" color="primary" /></div>;

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
            classNames={{ inputWrapper: "rounded-2xl border-border", base: "max-w-[220px]" }}
          />
          <Button color="primary" onPress={handleCreate} isLoading={creating} className="font-medium">
            Criar Relatório
          </Button>
        </CardBody>
      </Card>

      {selected && (
        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold text-foreground">
                Relatório — {selected.reference_month.slice(0, 7)}
              </h3>
              <Button size="sm" variant="flat" onPress={() => setSelected(null)}>Fechar</Button>
            </div>
            <Textarea label="Resumo executivo" value={draft.executive_summary ?? ""} onChange={(e) => setDraft((p) => ({ ...p, executive_summary: e.target.value }))} variant="bordered" minRows={3} classNames={{ inputWrapper: "rounded-2xl border-border" }} />
            <Textarea label="Destaques (um por linha)" value={(draft.highlights ?? []).join("\n")} onChange={(e) => setDraft((p) => ({ ...p, highlights: e.target.value.split("\n").filter(Boolean) }))} variant="bordered" minRows={3} classNames={{ inputWrapper: "rounded-2xl border-border" }} />
            <Textarea label="Próximos passos (um por linha)" value={(draft.next_steps ?? []).join("\n")} onChange={(e) => setDraft((p) => ({ ...p, next_steps: e.target.value.split("\n").filter(Boolean) }))} variant="bordered" minRows={3} classNames={{ inputWrapper: "rounded-2xl border-border" }} />
            <Textarea label="Comentário estratégico RÉSERVE" value={draft.admin_comment ?? ""} onChange={(e) => setDraft((p) => ({ ...p, admin_comment: e.target.value }))} variant="bordered" minRows={4} classNames={{ inputWrapper: "rounded-2xl border-border" }} />
            <div className="flex gap-3 justify-end flex-wrap">
              <Button variant="flat" onPress={handleSave} isLoading={updating} className="font-medium">Salvar Rascunho</Button>
              <Button color="primary" onPress={handlePublish} isLoading={publishing} className="font-medium">Publicar e Notificar Cliente</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {reports && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((r) => {
            const cfg = STATUS_CONFIG[r.status] ?? { label: r.status, color: "default" as const };
            return (
              <Card key={r.id} className="bg-default-50 border border-border rounded-2xl shadow-none hover:border-primary/30 transition-colors cursor-pointer" isPressable onPress={() => selectReport(r)}>
                <CardBody className="p-4 flex flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-default-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{r.reference_month.slice(0, 7)}</p>
                      {r.published_at && (
                        <p className="text-xs text-muted-foreground">Publicado em {new Date(r.published_at).toLocaleDateString("pt-BR")}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.notification_sent && <CheckCircle2 className="h-4 w-4 text-success" />}
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

// ── Hotel section (wrapper) ───────────────────────────────────────────────────

function HotelSection({ managerAdminId }: { managerAdminId: string }) {
  const { data: hotelClient, isLoading } = useHotelClientByUserId(managerAdminId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!hotelClient) {
    return (
      <Card className="border-border bg-default-50 shadow-none border-dashed rounded-3xl">
        <CardBody className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
          <p className="font-semibold text-foreground">Nenhum hotel associado</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Não há um HotelClient associado a este tenant. Configure um no backend ou verifique os dados.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hotel info */}
      <Card className="bg-primary/5 border border-primary/20 rounded-3xl shadow-none">
        <CardBody className="p-5 flex items-center gap-4">
          {hotelClient.logo_url ? (
            <img src={hotelClient.logo_url} alt={hotelClient.hotel_name} className="h-12 w-12 rounded-xl object-cover border border-border flex-shrink-0" />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
          )}
          <div>
            <p className="font-bold text-foreground">{hotelClient.hotel_name}</p>
            <p className="text-sm text-muted-foreground">{hotelClient.country}{hotelClient.booking_engine ? ` · ${hotelClient.booking_engine}` : ""}</p>
          </div>
          <Chip size="sm" variant="flat" color={hotelClient.is_active ? "success" : "danger"} className="ml-auto">
            {hotelClient.is_active ? "Ativo" : "Inativo"}
          </Chip>
        </CardBody>
      </Card>

      <Tabs variant="underlined" classNames={{ tabList: "border-b border-border w-full", cursor: "bg-primary", tab: "font-medium text-sm" }}>
        <Tab title={<div className="flex items-center gap-2"><Database className="h-4 w-4" /><span>Dados OTA</span></div>}>
          <div className="pt-6"><OtaSection clientId={hotelClient.id} /></div>
        </Tab>
        <Tab title={<div className="flex items-center gap-2"><FileText className="h-4 w-4" /><span>Relatórios</span></div>}>
          <div className="pt-6"><ReportsSection clientId={hotelClient.id} /></div>
        </Tab>
      </Tabs>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const { data: tenant, isLoading, error } = useTenantById({ id: tenantId });

  // find the manager admin to link to hotel client
  const managerAdmin = tenant?.admins?.find((r) => r.role === AdminRole.manager);

  if (isLoading) {
    return (
      <LayoutScopeRoot>
        <div className="flex justify-center items-center py-32">
          <Spinner size="lg" color="primary" />
        </div>
      </LayoutScopeRoot>
    );
  }

  if (error || !tenant) {
    return (
      <LayoutScopeRoot>
        <div className="mx-auto px-4 py-8 sm:px-8 max-w-[900px]">
          <Button variant="light" startContent={<ArrowLeft className="w-4 h-4" />} onPress={() => router.push("/dashboard/access-management/tenants")} className="mb-6">
            Voltar
          </Button>
          <Card className="border-danger/20 bg-danger/5 rounded-3xl shadow-none">
            <CardBody className="p-10 text-center">
              <p className="text-danger font-medium">{error ? "Erro ao carregar tenant." : "Tenant não encontrado."}</p>
            </CardBody>
          </Card>
        </div>
      </LayoutScopeRoot>
    );
  }

  return (
    <LayoutScopeRoot>
      <div className="mx-auto space-y-6 px-4 py-8 sm:px-8 lg:px-10 max-w-[1000px] animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="flat" isIconOnly onPress={() => router.push("/dashboard/access-management/tenants")} className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{tenant.name}</h1>
            <p className="text-sm text-muted-foreground">{tenant.domain}</p>
          </div>
          <Chip
            size="sm"
            variant="flat"
            color={tenant.is_active ? "success" : "danger"}
            startContent={tenant.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            className="ml-auto"
          >
            {tenant.is_active ? "Ativo" : "Inativo"}
          </Chip>
        </div>

        <Tabs
          variant="underlined"
          classNames={{ tabList: "border-b border-border w-full", cursor: "bg-primary", tab: "font-medium text-sm" }}
        >
          {/* Informações */}
          <Tab title={<div className="flex items-center gap-2"><Building2 className="h-4 w-4" /><span>Informações</span></div>}>
            <div className="pt-6 space-y-4">
              <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
                <CardBody className="p-6 sm:p-8 space-y-4">
                  {[
                    { icon: Hash, label: "ID", value: tenant.id },
                    { icon: Building2, label: "Nome", value: tenant.name },
                    { icon: Hash, label: "Slug", value: tenant.slug },
                    { icon: Globe, label: "Domínio", value: tenant.domain },
                    { icon: Calendar, label: "Criado em", value: fmt(tenant.created_at) },
                    { icon: Calendar, label: "Atualizado em", value: fmt(tenant.updated_at) },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="flex items-center gap-2 w-36 text-muted-foreground text-sm flex-shrink-0">
                        <Icon className="w-4 h-4" />
                        {label}
                      </div>
                      <div className="text-foreground text-sm font-medium flex-1">{value}</div>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </div>
          </Tab>

          {/* Admins */}
          <Tab title={<div className="flex items-center gap-2"><Shield className="h-4 w-4" /><span>Admins ({tenant.admins?.length ?? 0})</span></div>}>
            <div className="pt-6">
              {tenant.admins && tenant.admins.length > 0 ? (
                <div className="space-y-3">
                  {tenant.admins.map((rel) => (
                    <Card key={rel.admin_id} className="bg-default-50 border border-border rounded-2xl shadow-none">
                      <CardBody className="p-4 flex flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-default-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{rel.admin?.name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {rel.admin?.email ?? "—"}
                            </p>
                          </div>
                        </div>
                        <Chip size="sm" variant="flat" color={ROLE_COLOR[rel.role]} startContent={<Shield className="w-3 h-3" />}>
                          {rel.role.replace("_", " ").toUpperCase()}
                        </Chip>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-border bg-default-50 shadow-none border-dashed rounded-3xl">
                  <CardBody className="flex flex-col items-center justify-center py-16 text-center">
                    <Shield className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
                    <p className="text-foreground font-semibold">Nenhum admin associado</p>
                  </CardBody>
                </Card>
              )}
            </div>
          </Tab>

          {/* Portal RÉSERVE — OTA + Relatórios */}
          <Tab title={<div className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /><span>Portal RÉSERVE</span></div>}>
            <div className="pt-6">
              {managerAdmin ? (
                <HotelSection managerAdminId={managerAdmin.admin_id} />
              ) : (
                <Card className="border-border bg-default-50 shadow-none border-dashed rounded-3xl">
                  <CardBody className="flex flex-col items-center justify-center py-16 text-center">
                    <Building2 className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
                    <p className="font-semibold text-foreground">Sem cliente hotel associado</p>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                      Para gerenciar OTA e relatórios, associe um admin com role <strong>manager</strong> a este tenant.
                    </p>
                  </CardBody>
                </Card>
              )}
            </div>
          </Tab>

          {/* Modulos contratados — o que este tenant enxerga no painel */}
          <Tab title={<div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /><span>Módulos</span></div>}>
            <div className="pt-6">
              <TenantModulesCard tenantId={String(tenant.id)} />
            </div>
          </Tab>
        </Tabs>
      </div>
    </LayoutScopeRoot>
  );
}
