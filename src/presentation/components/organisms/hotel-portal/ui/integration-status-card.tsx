"use client";

import { Chip, Button } from "@heroui/react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Pencil,
  PlugZap,
  RefreshCw,
} from "lucide-react";
import type {
  IntegrationProvider,
  IntegrationStatus,
} from "@/src/shared/domain/types/@hotel-portal-v1";

const PROVIDER_LABELS: Record<IntegrationProvider, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  ga4: "Google Analytics 4",
  booking_engine: "Motor de Reservas",
};

const STATUS_CONFIG: Record<
  IntegrationStatus,
  {
    label: string;
    color: "success" | "danger" | "warning" | "default" | "primary";
    icon: React.ElementType;
  }
> = {
  connected: { label: "Conectado", color: "success", icon: CheckCircle2 },
  webhook: { label: "Webhook ativo", color: "success", icon: CheckCircle2 },
  manual: { label: "Manual", color: "warning", icon: Pencil },
  needs_reauth: { label: "Reautenticar", color: "warning", icon: Clock },
  error: { label: "Erro", color: "danger", icon: XCircle },
  not_configured: {
    label: "Não configurado",
    color: "default",
    icon: PlugZap,
  },
};

/**
 * Card de status de integração HONESTO (Doc 03 §4.5/§5).
 * Nunca mente "conectado". Para super admin, expõe ações de conectar/sync.
 */
export function IntegrationStatusCard({
  provider,
  status,
  lastSyncAt,
  canManage = false,
  onConnect,
  onSync,
  isBusy = false,
}: {
  provider: IntegrationProvider;
  status: IntegrationStatus;
  lastSyncAt?: string | null;
  canManage?: boolean;
  onConnect?: () => void;
  onSync?: () => void;
  isBusy?: boolean;
}) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_configured;
  const StatusIcon = cfg.icon;
  const canConnect =
    canManage &&
    provider !== "booking_engine" &&
    (status === "not_configured" || status === "needs_reauth" || status === "error");
  const canSync = canManage && (status === "connected" || status === "webhook");

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-background rounded-2xl border border-border">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-xl bg-default-100 flex items-center justify-center flex-shrink-0">
          <StatusIcon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-foreground text-sm">
            {PROVIDER_LABELS[provider] ?? provider}
          </p>
          {lastSyncAt ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              Última sync:{" "}
              {new Date(lastSyncAt).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              {status === "manual"
                ? "Dados inseridos manualmente"
                : "Nunca sincronizado"}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {canSync && (
          <Button
            size="sm"
            variant="flat"
            isIconOnly
            className="rounded-xl"
            onPress={onSync}
            isLoading={isBusy}
            aria-label="Sincronizar agora"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        )}
        {canConnect && (
          <Button
            size="sm"
            variant="flat"
            color="primary"
            className="rounded-xl"
            onPress={onConnect}
            isLoading={isBusy}
          >
            Conectar
          </Button>
        )}
        <Chip size="sm" variant="flat" color={cfg.color}>
          {cfg.label}
        </Chip>
      </div>
    </div>
  );
}
