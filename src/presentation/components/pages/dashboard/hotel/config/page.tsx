"use client";

import { useEffect, useState } from "react";
import { Button, Input } from "@heroui/react";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Instagram,
  Megaphone,
  Plus,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useActiveHotelClient,
  useUpdateHotelClient,
  useCreateHotelClient,
} from "@/src/shared/hooks/hotel-portal";
import usePermissions from "@/src/shared/hooks/use-permissions";
import { useTenantStore } from "@/src/shared/stores/tenant-store";
import type {
  ApiCredentialStatus,
  EIntegrationStatus,
  HotelClient,
} from "@/src/shared/domain/types/@hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { ScreenLinks } from "@/src/presentation/components/organisms/hotel-portal/painel/screen-links";

const PLATFORM_LABELS: Record<string, string> = {
  GA4: "Google Analytics 4",
  META_ADS: "Meta Ads",
  GOOGLE_ADS: "Google Ads",
};

const SYNC_STATUS: Record<
  EIntegrationStatus,
  { label: string; tone: string; dot: string; icon: LucideIcon }
> = {
  ACTIVE: { label: "Sincronizando", tone: "bg-success/15 text-success-600", dot: "bg-success", icon: CheckCircle2 },
  ERROR: { label: "Erro na sincronização", tone: "bg-danger/15 text-danger", dot: "bg-danger", icon: XCircle },
  PENDING: { label: "Aguardando", tone: "bg-warning/15 text-warning-600", dot: "bg-warning", icon: Clock },
  DISCONNECTED: { label: "Desconectado", tone: "bg-default-100 text-foreground/70", dot: "bg-default-300", icon: AlertTriangle },
};

const inputClassNames = { inputWrapper: "rounded-xl border-border/80 bg-background" };

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
const shortDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Valor somente leitura, no lugar do input, para quem nao pode editar. */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-background px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function IntegrationRow({ cred }: { cred: ApiCredentialStatus }) {
  const st = SYNC_STATUS[cred.sync_status] ?? SYNC_STATUS.DISCONNECTED;
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span aria-hidden className={`mt-2 size-2 shrink-0 rounded-full ${st.dot}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">
            {PLATFORM_LABELS[cred.platform] ?? cred.platform}
          </p>
          <span className={`rounded-md px-1.5 py-px text-[11px] font-medium ${st.tone}`}>{st.label}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {cred.last_sync_at ? `Última sincronização ${shortDateTime(cred.last_sync_at)}` : "Nunca sincronizou"}
          {cred.token_expires_at && ` · acesso válido até ${new Date(cred.token_expires_at).toLocaleDateString("pt-BR")}`}
        </p>
        {cred.error_message && <p className="mt-1 text-xs text-danger">{cred.error_message}</p>}
      </div>
    </li>
  );
}

/**
 * Hoje nao existe botao "Conectar": as credenciais sao cadastradas pela
 * equipe da RÉSERVE depois que a pousada da o acesso. Este bloco diz, em
 * palavras simples, o que a pousada precisa liberar em cada plataforma.
 */
const CONNECT_GUIDE: { icon: LucideIcon; title: string; feeds: string; steps: string[] }[] = [
  {
    icon: Megaphone,
    title: "Meta Ads (Facebook e Instagram)",
    feeds: "Alimenta Tráfego pago, Campanhas e o Retorno por anúncio.",
    steps: [
      "No Gerenciador de Negócios da pousada, em Configurações → Parceiros, adicione a RÉSERVE como parceira.",
      "Dê acesso à conta de anúncios, à página do Facebook e ao pixel.",
      "Avise a equipe: a sincronização começa em até 6 horas.",
    ],
  },
  {
    icon: Instagram,
    title: "Instagram",
    feeds: "Alimenta a tela Instagram e, no futuro, o Direct dentro do atendimento.",
    steps: [
      "A conta do Instagram precisa ser profissional e estar vinculada à página do Facebook da pousada.",
      "O mesmo acesso de parceiro do Meta Ads cobre a conta do Instagram.",
    ],
  },
  {
    icon: BarChart3,
    title: "Google Analytics 4",
    feeds: "Alimenta a tela Site: visitantes, origem e páginas de pacote.",
    steps: [
      "No GA4, em Administrador → Gerenciamento de acesso da propriedade, adicione o e-mail da RÉSERVE como Leitor.",
      "Se o site ainda não tem o GA4 instalado, a equipe envia o código para o desenvolvedor do site.",
    ],
  },
];

function ConnectGuide() {
  return (
    <ol className="grid gap-3 lg:grid-cols-3">
      {CONNECT_GUIDE.map((g) => (
        <li key={g.title} className="rounded-2xl border border-border/80 bg-default-50 p-5">
          <p className="flex items-center gap-2 font-medium text-foreground">
            <g.icon aria-hidden className="h-4 w-4 text-primary" />
            {g.title}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{g.feeds}</p>
          <ol className="mt-3 space-y-2">
            {g.steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/85">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}

// ── Formulario de criacao (super admin, tenant sem hotel client) ────────────

function CreateHotelForm({
  tenantId,
  onCreated,
}: {
  tenantId: string;
  onCreated: (created: HotelClient) => Promise<void>;
}) {
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
      toast.success("Portal criado.");
      await onCreated(created);
    } catch {
      toast.error("Não foi possível criar o portal.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <PainelSection
        title="Acesso do gerente"
        description="O e-mail que o gerente da pousada usa para entrar no painel."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="E-mail do gerente" type="email" value={form.email} onChange={set("email")} isRequired variant="bordered" classNames={inputClassNames} placeholder="gerente@pousada.com" />
          <Input label="Senha (opcional)" type="password" value={form.password} onChange={set("password")} variant="bordered" classNames={inputClassNames} description="Em branco, mantém a senha existente" />
        </div>
      </PainelSection>

      <PainelSection title="Dados da pousada">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nome" value={form.hotel_name} onChange={set("hotel_name")} isRequired variant="bordered" classNames={inputClassNames} />
          <Input label="País" value={form.country} onChange={set("country")} isRequired variant="bordered" classNames={inputClassNames} />
          <Input label="Motor de reservas" value={form.booking_engine} onChange={set("booking_engine")} variant="bordered" classNames={inputClassNames} placeholder="Ex.: Omnibees, Hospedin, Opera" />
          <Input label="Endereço do logo" value={form.logo_url} onChange={set("logo_url")} variant="bordered" classNames={inputClassNames} placeholder="https://" />
          <Input label="Início do contrato" type="date" value={form.contract_start} onChange={set("contract_start")} isRequired variant="bordered" classNames={inputClassNames} />
        </div>
      </PainelSection>

      <PainelSection title="Metas" description="Percentuais que o painel usa como referência nas telas de resultado.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Ocupação (%)" type="number" min="0" max="100" value={form.target_occupancy} onChange={set("target_occupancy")} isRequired variant="bordered" classNames={inputClassNames} />
          <Input label="Reserva direta (%)" type="number" min="0" max="100" value={form.target_direct_pct} onChange={set("target_direct_pct")} isRequired variant="bordered" classNames={inputClassNames} description="Reservas diretas em relação às OTAs" />
        </div>
      </PainelSection>

      <div className="flex justify-end">
        <Button type="submit" color="primary" isLoading={isPending} startContent={!isPending && <Plus className="h-4 w-4" />} className="rounded-xl font-medium px-6">
          Criar portal
        </Button>
      </div>
    </form>
  );
}

// ── Tela ───────────────────────────────────────────────────────────────────

export default function HotelConfigPage() {
  const { isSuperAdmin } = usePermissions();
  const selectedTenant = useTenantStore((s) => s.selectedTenant);
  const qc = useQueryClient();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
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
      toast.success("Alterações salvas.");
    } catch {
      toast.error("Não foi possível salvar.");
    }
  }

  async function handleToggleActive() {
    try {
      await update({ is_active: !client?.is_active });
      toast.success(client?.is_active ? "Portal desativado." : "Portal ativado.");
    } catch {
      toast.error("Não foi possível alterar o status.");
    }
  }

  if (isSuperAdmin && mounted && !clientLoading && !selectedTenant) {
    return (
      <PainelPageShell title="Configurações">
        <PortalEmptyState
          icon={AlertCircle}
          title="Selecione um tenant"
          description="Escolha um tenant no seletor acima para configurar o portal da pousada."
        />
      </PainelPageShell>
    );
  }

  if (mounted && !clientLoading && !client) {
    return (
      <PainelPageShell
        title="Configurações"
        description="Este tenant ainda não tem um portal de pousada. Preencha os dados para criar."
      >
        <CreateHotelForm
          tenantId={selectedTenant!.id}
          onCreated={async (created) => {
            // Seed o cache diretamente — não depende do GET funcionar imediatamente
            qc.setQueryData(["hotel-portal", "current-tenant", selectedTenant?.id], created);
            qc.invalidateQueries({ queryKey: ["hotel-portal", "clients"] });
          }}
        />
      </PainelPageShell>
    );
  }

  const readOnly = !isSuperAdmin;
  const credentials = client?.credentials ?? [];

  return (
    <PainelPageShell
      title="Configurações"
      description={
        client
          ? `${client.hotel_name} · cliente desde ${longDate(client.contract_start)}`
          : undefined
      }
      isLoading={!mounted || clientLoading}
      actions={
        client && (
          <div className="flex items-center gap-3">
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                client.is_active ? "bg-success/15 text-success-600" : "bg-danger/15 text-danger"
              }`}
            >
              {client.is_active ? "Portal ativo" : "Portal inativo"}
            </span>
            {isSuperAdmin && (
              <Button
                size="sm"
                variant="flat"
                color={client.is_active ? "danger" : "success"}
                className="rounded-xl"
                onPress={handleToggleActive}
                isLoading={isPending}
              >
                {client.is_active ? "Desativar" : "Ativar"}
              </Button>
            )}
          </div>
        )
      }
    >
      {client && (
        <>
          <form onSubmit={handleSave} className="space-y-8">
            <PainelSection
              title="Dados da pousada"
              description={readOnly ? "Para alterar, fale com a equipe da RÉSERVE." : undefined}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {readOnly ? (
                  <>
                    <Fact label="Nome" value={client.hotel_name} />
                    <Fact label="País" value={client.country} />
                    <Fact label="Motor de reservas" value={client.booking_engine ?? "—"} />
                    <Fact label="Endereço do logo" value={client.logo_url ?? "—"} />
                  </>
                ) : (
                  <>
                    <Input label="Nome" value={form.hotel_name} onChange={set("hotel_name")} isRequired variant="bordered" classNames={inputClassNames} />
                    <Input label="País" value={form.country} onChange={set("country")} isRequired variant="bordered" classNames={inputClassNames} />
                    <Input label="Motor de reservas" value={form.booking_engine} onChange={set("booking_engine")} variant="bordered" classNames={inputClassNames} placeholder="Ex.: Omnibees, Hospedin, Opera" />
                    <Input label="Endereço do logo" value={form.logo_url} onChange={set("logo_url")} variant="bordered" classNames={inputClassNames} placeholder="https://" />
                  </>
                )}
              </div>
            </PainelSection>

            <PainelSection
              title="Metas"
              description="Percentuais que o painel usa como referência nas telas de resultado."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {readOnly ? (
                  <>
                    <Fact label="Ocupação" value={`${Math.round(client.target_occupancy * 100)}%`} />
                    <Fact label="Reserva direta" value={`${Math.round(client.target_direct_pct * 100)}%`} />
                  </>
                ) : (
                  <>
                    <Input label="Ocupação (%)" type="number" min="0" max="100" value={form.target_occupancy} onChange={set("target_occupancy")} isRequired variant="bordered" classNames={inputClassNames} />
                    <Input label="Reserva direta (%)" type="number" min="0" max="100" value={form.target_direct_pct} onChange={set("target_direct_pct")} isRequired variant="bordered" classNames={inputClassNames} description="Reservas diretas em relação às OTAs" />
                  </>
                )}
              </div>
            </PainelSection>

            {!readOnly && (
              <div className="flex justify-end">
                <Button type="submit" color="primary" isLoading={isPending} className="rounded-xl px-6 font-medium">
                  Salvar alterações
                </Button>
              </div>
            )}
          </form>

          <PainelSection
            title="Contas conectadas"
            description="As plataformas de onde o painel puxa números. A sincronização roda a cada 6 horas."
          >
            {credentials.length === 0 ? (
              <PortalEmptyState
                title="Nenhuma conta conectada ainda"
                description="Assim que a pousada liberar o acesso (veja abaixo como), a equipe da RÉSERVE ativa a sincronização."
              />
            ) : (
              <ul className="divide-y divide-border/60 rounded-2xl border border-border/80 bg-default-50">
                {credentials.map((cred) => (
                  <IntegrationRow key={cred.platform} cred={cred} />
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              Erro ou acesso vencido? Fale com a equipe da RÉSERVE para reconectar.
            </p>
          </PainelSection>

          <PainelSection
            title="Como conectar cada conta"
            description="O painel não pede senha de nada: a pousada libera o acesso dentro de cada plataforma e a RÉSERVE faz o resto."
          >
            <ConnectGuide />
          </PainelSection>

          <ScreenLinks
            links={[
              { href: "/dashboard/hotel/atendimento/bot", label: "Bot do WhatsApp", hint: "Como o atendimento automático está configurado" },
              { href: "/dashboard/hotel/whatsapp-links", label: "Links rastreáveis", hint: "Os links de WhatsApp com origem marcada" },
            ]}
          />
        </>
      )}
    </PainelPageShell>
  );
}
