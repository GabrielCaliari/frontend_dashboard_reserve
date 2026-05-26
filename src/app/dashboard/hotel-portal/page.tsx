"use client";

import { useMemo } from "react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { useHotelClients } from "@/src/common/hooks/hotel-portal";
import type { HotelClient } from "@/src/common/@types/@hotel-portal";
import { useRouter } from "nextjs-toploader/app";
import {
  Card,
  CardBody,
  Button,
  Spinner,
  Chip,
} from "@heroui/react";
import {
  AlertCircle,
  Building2,
  Plus,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";

const PLATFORM_LABELS: Record<string, string> = {
  GA4: "GA4",
  META_ADS: "Meta Ads",
  GOOGLE_ADS: "Google Ads",
};

const STATUS_DOT: Record<string, string> = {
  ACTIVE: "bg-success",
  PENDING: "bg-warning",
  ERROR: "bg-danger",
  DISCONNECTED: "bg-default-400",
};

function IntegrationChip({ platform, status }: { platform: string; status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status] ?? "bg-default-400"}`} />
      {PLATFORM_LABELS[platform] ?? platform}
    </span>
  );
}

function ClientCard({ client }: { client: HotelClient }) {
  const { push } = useRouter();
  const hasError = client.credentials?.some((c) => c.sync_status === "ERROR");

  return (
    <Card className="bg-default-50 border border-border rounded-3xl shadow-none hover:border-primary/30 transition-colors">
      <CardBody className="p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {client.logo_url ? (
              <img
                src={client.logo_url}
                alt={client.hotel_name}
                className="h-10 w-10 rounded-xl object-cover border border-border flex-shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate leading-tight">
                {client.hotel_name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{client.country}</p>
            </div>
          </div>
          <Chip
            size="sm"
            variant="flat"
            color={client.is_active ? "success" : "danger"}
            className="flex-shrink-0"
          >
            {client.is_active ? "Ativo" : "Inativo"}
          </Chip>
        </div>

        {client.credentials && client.credentials.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {client.credentials.map((cred) => (
              <IntegrationChip
                key={cred.platform}
                platform={cred.platform}
                status={cred.sync_status}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <WifiOff className="h-3.5 w-3.5" />
            Sem integrações configuradas
          </div>
        )}

        {hasError && (
          <div className="flex items-center gap-1.5 rounded-xl bg-danger/5 border border-danger/20 px-3 py-2 text-xs text-danger">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            Integração com falha — ação necessária
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            color="primary"
            className="flex-1 font-medium"
            onPress={() => push(`/dashboard/hotel-portal/${client.id}`)}
          >
            Ver Portal
          </Button>
          <Button
            size="sm"
            variant="bordered"
            className="flex-1 font-medium"
            onPress={() => push(`/dashboard/hotel-portal/${client.id}?tab=config`)}
          >
            Editar
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export default function HotelPortalPage() {
  const { push } = useRouter();
  const { data: clients, isLoading, isError } = useHotelClients();

  const stats = useMemo(() => {
    if (!clients) return { total: 0, active: 0, errors: 0 };
    return {
      total: clients.length,
      active: clients.filter((c) => c.is_active).length,
      errors: clients.reduce(
        (acc, c) =>
          acc + (c.credentials?.filter((cr) => cr.sync_status === "ERROR").length ?? 0),
        0,
      ),
    };
  }, [clients]);

  return (
    <LayoutScopeRoot routeActive="hotel-portal">
      <div className="mx-auto space-y-8 px-4 py-8 sm:px-8 lg:px-10 max-w-[1600px] animate-fade-in">
        <div className="relative overflow-hidden rounded-3xl bg-default-50 border border-border p-8 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                Portal de Clientes
              </h1>
              <p className="text-muted-foreground mt-3 text-base">
                Gerencie os hotéis e acompanhe o status de cada integração.
              </p>
            </div>
            <Button
              color="primary"
              startContent={<Plus className="h-4 w-4" />}
              className="font-medium"
              onPress={() => push("/dashboard/hotel-portal/new")}
            >
              Novo Cliente
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total de Clientes", value: stats.total, icon: Users, color: "text-primary" },
            { label: "Clientes Ativos", value: stats.active, icon: Wifi, color: "text-success" },
            { label: "Integrações com Erro", value: stats.errors, icon: AlertCircle, color: "text-danger" },
            { label: "OTA Pendente", value: "--", icon: TrendingUp, color: "text-warning" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-default-50 border border-border rounded-3xl shadow-none">
              <CardBody className="p-6 flex flex-row items-center gap-4">
                <div className={`h-10 w-10 rounded-xl bg-default-100 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{isLoading ? "—" : value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 rounded-full bg-primary" />
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Todos os Clientes
            </h2>
          </div>

          {isLoading && (
            <div className="flex justify-center items-center py-20 bg-default-50 rounded-3xl border border-border border-dashed">
              <Spinner size="lg" color="primary" />
            </div>
          )}

          {isError && (
            <Card className="border-danger/20 bg-danger/5 shadow-none rounded-3xl">
              <CardBody className="p-8 text-center">
                <AlertCircle className="w-10 h-10 text-danger mx-auto mb-4" />
                <p className="text-base text-danger">Erro ao carregar clientes. Tente novamente.</p>
              </CardBody>
            </Card>
          )}

          {!isLoading && !isError && clients && clients.length === 0 && (
            <Card className="border-border bg-default-50 shadow-none border-dashed rounded-3xl">
              <CardBody className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-default-100 flex items-center justify-center mb-6">
                  <Building2 className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Nenhum cliente cadastrado
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md">
                  Adicione o primeiro hotel para começar a acompanhar os resultados.
                </p>
                <Button
                  color="primary"
                  size="lg"
                  startContent={<Plus className="h-5 w-5" />}
                  onPress={() => push("/dashboard/hotel-portal/new")}
                >
                  Adicionar Primeiro Cliente
                </Button>
              </CardBody>
            </Card>
          )}

          {clients && clients.length > 0 && (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {clients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          )}
        </section>
      </div>
    </LayoutScopeRoot>
  );
}
