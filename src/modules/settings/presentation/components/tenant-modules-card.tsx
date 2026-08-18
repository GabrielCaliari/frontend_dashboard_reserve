"use client";

import { Card, CardBody, Skeleton, Switch, Button } from "@heroui/react";
import { AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

import {
  GATEABLE_MODULES,
  type GateableModule,
} from "../../domain/tenant-modules";
import {
  useTenantModules,
  useUpdateTenantModules,
} from "../hooks/use-tenant-modules";

/**
 * "metrics" nao tem item de navegacao proprio (so alimenta o
 * dashboard-visibility), por isso aparece por ultimo e com a descricao dizendo
 * o que ele de fato controla.
 */
const MODULE_LABELS: Record<GateableModule, { title: string; hint: string }> = {
  hotel: {
    title: "Hotel Marketing e Portal",
    hint: "Visão geral, campanhas, site, OTA, relatório mensal e links de WhatsApp",
  },
  motor: {
    title: "Motor de Reservas",
    hint: "Calendário de ocupação, tarifas, reservas e acomodações",
  },
  leads: {
    title: "Leads e Funil",
    hint: "Leads, coleções, agendamentos e carrinhos abandonados",
  },
  cms: {
    title: "CMS e Blog",
    hint: "Blogs, artigos, autores, coleções e mídia",
  },
  mailer: {
    title: "Campanhas de E-mail",
    hint: "Disparos e campanhas de e-mail marketing",
  },
  payments: {
    title: "Pagamentos",
    hint: "Produtos, assinaturas e configuração de cobrança",
  },
  coupons: { title: "Cupons", hint: "Criação e gestão de cupons de desconto" },
  reports: { title: "Relatórios", hint: "Relatórios consolidados da conta" },
  notifications: {
    title: "Notificações",
    hint: "Central de notificações do tenant",
  },
  metrics: {
    title: "Métricas do Dashboard",
    hint: "Blocos de métricas exibidos na visão geral",
  },
};

const MODULE_ORDER: readonly GateableModule[] = [
  "hotel",
  "motor",
  "leads",
  "cms",
  "mailer",
  "payments",
  "coupons",
  "reports",
  "notifications",
  "metrics",
];

function errorMessage(error: unknown, fallback: string): string {
  const response = (
    error as { response?: { data?: { message?: string | string[] } } }
  )?.response;
  const message = response?.data?.message;
  if (Array.isArray(message)) return message.join(", ");
  return message ?? fallback;
}

export function TenantModulesCard({
  tenantId,
  isReadOnly = false,
}: {
  tenantId: string;
  isReadOnly?: boolean;
}) {
  const { data, isLoading, error, refetch } = useTenantModules(tenantId);
  const { mutateAsync, isPending } = useUpdateTenantModules(tenantId);

  async function toggle(module: GateableModule, enabled: boolean) {
    try {
      await mutateAsync({ [module]: enabled });
      toast.success(
        `${MODULE_LABELS[module].title} ${enabled ? "ativado" : "desativado"}`,
      );
    } catch (mutationError) {
      toast.error(
        errorMessage(mutationError, "Não foi possível atualizar o módulo."),
      );
    }
  }

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;

  if (error) {
    return (
      <Card className="border border-border shadow-none rounded-2xl">
        <CardBody className="flex flex-col items-start gap-3 p-6">
          <p className="flex items-center gap-2 text-danger" role="alert">
            <AlertCircle className="h-4 w-4" />
            {errorMessage(error, "Não foi possível carregar os módulos.")}
          </p>
          <Button size="sm" variant="flat" onPress={() => refetch()}>
            Tentar novamente
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Escolha o que este cliente enxerga no painel. Desativar um módulo o
        remove do menu e bloqueia o acesso às suas telas.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {MODULE_ORDER.filter((module) =>
          GATEABLE_MODULES.includes(module),
        ).map((module) => (
          <Card
            key={module}
            className="border border-border shadow-none rounded-2xl"
          >
            <CardBody className="flex-row items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  {MODULE_LABELS[module].title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {MODULE_LABELS[module].hint}
                </p>
              </div>
              <Switch
                aria-label={MODULE_LABELS[module].title}
                isDisabled={isReadOnly || isPending}
                isSelected={data?.[module] !== false}
                onValueChange={(enabled) => void toggle(module, enabled)}
              />
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
