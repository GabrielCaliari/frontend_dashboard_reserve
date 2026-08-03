"use client";

import { Card, CardBody, Button } from "@heroui/react";
import { Inbox, Clock, PlugZap, AlertCircle } from "lucide-react";

export type EmptyReason =
  | "sem-dados-periodo"
  | "aguardando-fechamento"
  | "via-motor-em-breve"
  | "nao-configurado"
  | "erro";

const CONFIG: Record<
  EmptyReason,
  { icon: React.ElementType; title: string; description: string }
> = {
  "sem-dados-periodo": {
    icon: Inbox,
    title: "Sem dados no período",
    description: "Não há registros para o intervalo selecionado.",
  },
  "aguardando-fechamento": {
    icon: Clock,
    title: "Aguardando fechamento do mês",
    description:
      "Os dados deste mês são inseridos após o fechamento pela equipe RÉSERVE.",
  },
  "via-motor-em-breve": {
    icon: PlugZap,
    title: "Via motor de reservas — em breve",
    description:
      "Esta métrica depende da integração com o motor de reservas, ainda não conectado.",
  },
  "nao-configurado": {
    icon: PlugZap,
    title: "Integração não configurada",
    description: "Conecte a integração para começar a receber estes dados.",
  },
  erro: {
    icon: AlertCircle,
    title: "Erro ao carregar",
    description: "Não foi possível carregar os dados.",
  },
};

/**
 * Estado vazio padronizado (Doc 03 §5.2). Campo sem fonte NUNCA vira zero —
 * vira EmptyState. Nada de número inventado.
 */
export function EmptyState({
  reason,
  description,
  action,
  compact = false,
}: {
  reason: EmptyReason;
  description?: string;
  action?: { label: string; onPress: () => void };
  compact?: boolean;
}) {
  const cfg = CONFIG[reason];
  const Icon = cfg.icon;

  const body = (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-8" : "py-14"
      }`}
    >
      <Icon className="h-9 w-9 text-muted-foreground/50 mb-3" />
      <p className="text-foreground font-medium text-sm">{cfg.title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {description ?? cfg.description}
      </p>
      {action && (
        <Button
          size="sm"
          variant="flat"
          color="primary"
          className="mt-4 rounded-xl"
          onPress={action.onPress}
        >
          {action.label}
        </Button>
      )}
    </div>
  );

  if (compact) return body;

  return (
    <Card className="border-dashed border-border bg-default-50 shadow-none rounded-3xl">
      <CardBody>{body}</CardBody>
    </Card>
  );
}
