"use client";

import { useState, useMemo, useEffect } from "react";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import {
  useActiveHotelClient,
  useUpdateHotelClient,
  useCreateHotelClient,
} from "@/src/shared/hooks/hotel-portal";
import usePermissions from "@/src/shared/hooks/use-permissions";
import { useTenantStore } from "@/src/shared/stores/tenant-store";
import {
  Card,
  CardBody,
  Spinner,
  Chip,
  Button,
  Input,
} from "@heroui/react";
import {
  AlertCircle,
  Settings,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Target,
  Plug,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { EIntegrationStatus } from "@/src/shared/domain/types/@hotel-portal";

const PLATFORM_LABELS: Record<string, string> = {
  GA4: "Google Analytics 4",
  META_ADS: "Meta Ads",
  GOOGLE_ADS: "Google Ads",
};

const SYNC_STATUS_CONFIG: Record<
  EIntegrationStatus,
  { label: string; color: "success" | "danger" | "warning" | "default"; icon: React.ElementType }
> = {
  ACTIVE:       { label: "Sincronizado",  color: "success", icon: CheckCircle2 },
  ERROR:        { label: "Erro na sync",  color: "danger",  icon: XCircle },
  PENDING:      { label: "Pendente",      color: "warning", icon: Clock },
  DISCONNECTED: { label: "Desconectado",  color: "default", icon: AlertTriangle },
};

function SectionHeader({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h2 className="font-semibold text-foreground">{title}</h2>
    </div>
  );
}

// ── Create form (when no hotel client exists yet) ─────────────────────────────

function CreateHotelForm({ tenantId, onCreated }: { tenantId: string; onCreated: (created: import("@/src/shared/domain/types/@hotel-portal").HotelClient) => Promise<void> }) {
  const { mutateAsync: create, isPending } = useCreateHotelClient();
  const [form, setForm] = useState({
    hotel_name: "",
    email: "",
    password: "",
    country: "",
    booking_engine: "",
    logo_url: "",
    contract_start: new Date().toISOString().slice(0, 10),
    target_occupancy: "70",
    target_direct_pct: "50",
  });

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const created = await create({
        tenant_id: tenantId,
        hotel_name: form.hotel_name,
        email: form.email,
        password: form.password || undefined,
        country: form.country,
        booking_engine: form.booking_engine || undefined,
        logo_url: form.logo_url || undefined,
        contract_start: form.contract_start,
        target_occupancy: parseFloat(form.target_occupancy) / 100,
        target_direct_pct: parseFloat(form.target_direct_pct) / 100,
      });
      toast.success("Portal de hotel criado com sucesso!");
      await onCreated(created);
    } catch {
      toast.error("Erro ao criar portal de hotel.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Acesso */}
      <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
        <CardBody className="p-6 sm:p-8 space-y-5">
          <SectionHeader title="Acesso do Hotel" icon={Building2} />
          <p className="text-sm text-muted-foreground -mt-2">
            Crie ou vincule o usuário que o gerente do hotel usará para acessar o portal.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="E-mail do gerente"
              type="email"
              value={form.email}
              onChange={set("email")}
              isRequired
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
              placeholder="gerente@hotel.com"
            />
            <Input
              label="Senha (opcional)"
              type="password"
              value={form.password}
              onChange={set("password")}
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
              description="Deixe em branco para manter a senha existente"
            />
          </div>
        </CardBody>
      </Card>

      {/* Dados do hotel */}
      <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
        <CardBody className="p-6 sm:p-8 space-y-5">
          <SectionHeader title="Dados do Hotel" icon={Building2} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome do Hotel"
              value={form.hotel_name}
              onChange={set("hotel_name")}
              isRequired
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
            />
            <Input
              label="País"
              value={form.country}
              onChange={set("country")}
              isRequired
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
            />
            <Input
              label="Motor de Reservas"
              value={form.booking_engine}
              onChange={set("booking_engine")}
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
              placeholder="Ex: Omnibees, SkyBook, Opera..."
            />
            <Input
              label="URL do Logo"
              value={form.logo_url}
              onChange={set("logo_url")}
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
              placeholder="https://..."
            />
            <Input
              label="Início do Contrato"
              type="date"
              value={form.contract_start}
              onChange={set("contract_start")}
              isRequired
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
            />
          </div>
        </CardBody>
      </Card>

      {/* Metas */}
      <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
        <CardBody className="p-6 sm:p-8 space-y-5">
          <SectionHeader title="Metas de Performance" icon={Target} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Meta de Ocupação (%)"
              type="number"
              min="0"
              max="100"
              value={form.target_occupancy}
              onChange={set("target_occupancy")}
              isRequired
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
              description="Percentual de ocupação alvo mensal"
            />
            <Input
              label="Meta de Reserva Direta (%)"
              type="number"
              min="0"
              max="100"
              value={form.target_direct_pct}
              onChange={set("target_direct_pct")}
              isRequired
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-border" }}
              description="Percentual de reservas diretas (vs OTA) alvo"
            />
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          color="primary"
          isLoading={isPending}
          startContent={!isPending && <Plus className="h-4 w-4" />}
          className="font-medium px-8"
        >
          Criar Portal de Hotel
        </Button>
      </div>
    </form>
  );
}

// ── Edit form (when hotel client already exists) ──────────────────────────────

export default function HotelConfigPage() {
  const { isSuperAdmin } = usePermissions();
  const selectedTenant = useTenantStore((s) => s.selectedTenant);
  const qc = useQueryClient();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const { mutateAsync: update, isPending } = useUpdateHotelClient(client?.id ?? "");

  const [form, setForm] = useState({
    hotel_name: "",
    country: "",
    booking_engine: "",
    logo_url: "",
    target_occupancy: "70",
    target_direct_pct: "50",
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
      toast.success(client?.is_active ? "Hotel desativado." : "Hotel ativado.");
    } catch {
      toast.error("Erro ao alterar status.");
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (!mounted || clientLoading) {
    return (
      <LayoutScopeRoot>
        <div className="flex justify-center items-center py-32">
          <Spinner size="lg" color="primary" />
        </div>
      </LayoutScopeRoot>
    );
  }

  // ── Admin sem tenant selecionado ─────────────────────────────────────────

  if (isSuperAdmin && !selectedTenant) {
    return (
      <LayoutScopeRoot>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
          <p className="text-foreground font-semibold">Selecione um tenant</p>
          <p className="text-sm text-muted-foreground mt-1">
            Escolha um tenant no seletor acima para configurar o portal de hotel.
          </p>
        </div>
      </LayoutScopeRoot>
    );
  }

  // ── Sem hotel client → mostrar formulário de criação ────────────────────

  if (!client) {
    return (
      <LayoutScopeRoot>
        <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-8 space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Configurações</h1>
              <p className="text-sm text-muted-foreground">
                Nenhum portal configurado para este tenant — crie agora.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Este tenant ainda não possui um portal de hotel. Preencha os dados abaixo para criar.
          </div>

          <CreateHotelForm
            tenantId={selectedTenant!.id}
            onCreated={async (created) => {
              // Seed o cache diretamente — não depende do GET funcionar imediatamente
              qc.setQueryData(
                ["hotel-portal", "current-tenant", selectedTenant?.id],
                created,
              );
              // Invalida o resto para sincronizar em background
              qc.invalidateQueries({ queryKey: ["hotel-portal", "clients"] });
            }}
          />
        </div>
      </LayoutScopeRoot>
    );
  }

  // ── Hotel client existe ──────────────────────────────────────────────────

  const isReadOnly = !isSuperAdmin;

  return (
    <LayoutScopeRoot>
      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-8 space-y-8 animate-fade-in">

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Configurações</h1>
              <p className="text-sm text-muted-foreground">{client.hotel_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Chip size="sm" variant="flat" color={client.is_active ? "success" : "danger"}>
              {client.is_active ? "Ativo" : "Inativo"}
            </Chip>
            {isSuperAdmin && (
              <Button
                size="sm"
                variant="flat"
                color={client.is_active ? "danger" : "success"}
                onPress={handleToggleActive}
                isLoading={isPending}
              >
                {client.is_active ? "Desativar Hotel" : "Ativar Hotel"}
              </Button>
            )}
          </div>
        </div>

        {/* Dados do Hotel */}
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
            <CardBody className="p-6 sm:p-8 space-y-5">
              <SectionHeader title="Dados do Hotel" icon={Building2} />
              {isReadOnly ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Nome do Hotel", value: client.hotel_name },
                    { label: "País", value: client.country },
                    { label: "Motor de Reservas", value: client.booking_engine ?? "—" },
                    { label: "URL do Logo", value: client.logo_url ?? "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-2xl border border-border bg-background px-4 py-3">
                      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                      <p className="text-sm font-medium text-foreground truncate">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Nome do Hotel" value={form.hotel_name} onChange={set("hotel_name")} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
                  <Input label="País" value={form.country} onChange={set("country")} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} />
                  <Input label="Motor de Reservas" value={form.booking_engine} onChange={set("booking_engine")} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} placeholder="Ex: Omnibees, SkyBook, Opera..." />
                  <Input label="URL do Logo" value={form.logo_url} onChange={set("logo_url")} variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} placeholder="https://..." />
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
            <CardBody className="p-6 sm:p-8 space-y-5">
              <SectionHeader title="Metas de Performance" icon={Target} />
              {isReadOnly ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Meta de Ocupação", value: `${Math.round(client.target_occupancy * 100)}%` },
                    { label: "Meta de Reserva Direta", value: `${Math.round(client.target_direct_pct * 100)}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-2xl border border-border bg-background px-4 py-3">
                      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                      <p className="text-sm font-medium text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Meta de Ocupação (%)" type="number" min="0" max="100" value={form.target_occupancy} onChange={set("target_occupancy")} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} description="Percentual de ocupação alvo mensal" />
                  <Input label="Meta de Reserva Direta (%)" type="number" min="0" max="100" value={form.target_direct_pct} onChange={set("target_direct_pct")} isRequired variant="bordered" classNames={{ inputWrapper: "rounded-2xl border-border" }} description="Percentual de reservas diretas (vs OTA) alvo" />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Início do contrato:{" "}
                <span className="font-medium text-foreground">
                  {new Date(client.contract_start).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
              </p>
            </CardBody>
          </Card>

          {!isReadOnly && (
            <div className="flex justify-end">
              <Button type="submit" color="primary" isLoading={isPending} className="font-medium px-8">
                Salvar Configurações
              </Button>
            </div>
          )}
        </form>

        {/* Integrações */}
        <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
          <CardBody className="p-6 sm:p-8 space-y-5">
            <SectionHeader title="Integrações e Sincronização" icon={Plug} />

            {!client.credentials || client.credentials.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <RefreshCw className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium text-foreground">Nenhuma integração configurada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  As integrações com Meta Ads, Google Ads e GA4 são adicionadas pela equipe da RÉSERVE
                  após receber as credenciais de acesso do hotel.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {client.credentials.map((cred) => {
                  const cfg = SYNC_STATUS_CONFIG[cred.sync_status] ?? SYNC_STATUS_CONFIG.DISCONNECTED;
                  const StatusIcon = cfg.icon;
                  return (
                    <div
                      key={cred.platform}
                      className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-default-100 flex items-center justify-center flex-shrink-0">
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-sm">
                            {PLATFORM_LABELS[cred.platform] ?? cred.platform}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                            {cred.last_sync_at && (
                              <p className="text-xs text-muted-foreground">
                                Última sync:{" "}
                                {new Date(cred.last_sync_at).toLocaleString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                            {cred.token_expires_at && (
                              <p className="text-xs text-muted-foreground">
                                Token expira:{" "}
                                {new Date(cred.token_expires_at).toLocaleDateString("pt-BR")}
                              </p>
                            )}
                          </div>
                          {cred.error_message && (
                            <p className="text-xs text-danger mt-1">{cred.error_message}</p>
                          )}
                        </div>
                      </div>
                      <Chip size="sm" variant="flat" color={cfg.color} className="flex-shrink-0">
                        {cfg.label}
                      </Chip>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                As sincronizações ocorrem automaticamente a cada 6 horas. Em caso de erro ou token
                expirado, entre em contato com a equipe da RÉSERVE para reconectar a integração.
              </p>
            </div>
          </CardBody>
        </Card>

      </div>
    </LayoutScopeRoot>
  );
}
