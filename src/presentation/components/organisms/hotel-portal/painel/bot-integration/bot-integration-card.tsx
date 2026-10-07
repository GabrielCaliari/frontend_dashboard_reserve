"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/presentation/components/atoms/shadcn-ui/card";
import { Input } from "@/src/presentation/components/atoms/shadcn-ui/input";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";
import {
  useBotIntegrationConfig,
  useRegenerateBotPanelSecret,
  useRegenerateBotTenantKey,
  useRegenerateClientWebhookSecret,
  useSaveBotIntegration,
  useSetBotIntegrationActive,
} from "@/src/shared/hooks/hotel-portal/use-bot-integration";
import { OneTimeSecret } from "./one-time-secret";

interface Props {
  tenantId: string;
  clientId: string;
  webhookSecretSet?: boolean;
}

export function BotIntegrationCard({ tenantId, clientId, webhookSecretSet = false }: Props) {
  const { data: config } = useBotIntegrationConfig(tenantId);
  const save = useSaveBotIntegration(tenantId);
  const regenKey = useRegenerateBotTenantKey(tenantId);
  const regenPanel = useRegenerateBotPanelSecret(tenantId);
  const setActive = useSetBotIntegrationActive(tenantId);
  const regenClient = useRegenerateClientWebhookSecret(clientId, tenantId);

  const [botRef, setBotRef] = useState("");
  const [url, setUrl] = useState("");
  const [revealed, setRevealed] = useState<{ label: string; value: string } | null>(null);

  useEffect(() => {
    setBotRef(config?.bot_tenant_ref ?? "");
    setUrl(config?.n8n_panel_webhook_url ?? "");
  }, [config?.bot_tenant_ref, config?.n8n_panel_webhook_url]);

  // O segredo nunca fica alem desta tela: sai do estado ao desmontar.
  useEffect(() => () => setRevealed(null), []);

  const exists = !!config;
  const busy =
    save.isPending || regenKey.isPending || regenPanel.isPending || setActive.isPending || regenClient.isPending;

  async function run<T>(action: () => Promise<T>, onOk: (r: T) => void, errorMsg: string) {
    try {
      onOk(await action());
    } catch {
      toast.error(errorMsg);
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    void run(
      () =>
        save.mutateAsync({
          exists,
          data: {
            bot_tenant_ref: botRef.trim() || undefined,
            n8n_panel_webhook_url: url.trim() || undefined,
          },
        }),
      (r) => {
        const tenantKey = (r as { tenant_key?: string }).tenant_key;
        if (tenantKey) setRevealed({ label: "Chave do tenant (Canal A)", value: tenantKey });
        toast.success(exists ? "Integração salva." : "Integração criada.");
      },
      "Erro ao salvar a integração.",
    );
  }

  function handleRegenKey() {
    if (exists && !window.confirm("A chave atual para de funcionar até o bot ser atualizado. Continuar?")) {
      return;
    }
    void run(
      () => regenKey.mutateAsync(),
      (r) => setRevealed({ label: "Chave do tenant (Canal A)", value: r.tenant_key }),
      "Erro ao gerar a chave do tenant.",
    );
  }

  function handleRegenPanel() {
    void run(
      () => regenPanel.mutateAsync(),
      (r) => setRevealed({ label: "Segredo do Canal B", value: r.panel_webhook_secret }),
      "Erro ao gerar o segredo do Canal B.",
    );
  }

  function handleRegenClient() {
    void run(
      () => regenClient.mutateAsync(),
      (r) => setRevealed({ label: "Segredo do Canal C", value: r.webhook_secret }),
      "Erro ao gerar o segredo do Canal C.",
    );
  }

  function handleToggle() {
    if (!config) return;
    void run(
      () => setActive.mutateAsync(!config.active),
      () => toast.success(config.active ? "Integração desativada." : "Integração ativada."),
      "Erro ao alterar o status da integração.",
    );
  }

  return (
    <Card className="rounded-3xl shadow-none">
      <CardHeader>
        <CardTitle>Assistente de WhatsApp</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-3" onSubmit={handleSave}>
          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="bot-integration-ref">
              Identificador do bot
            </label>
            <Input
              id="bot-integration-ref"
              value={botRef}
              maxLength={60}
              placeholder="cli_dona_tereza"
              onChange={(e) => setBotRef(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="bot-integration-url">
              URL do WF6
            </label>
            <Input
              id="bot-integration-url"
              value={url}
              placeholder="https://bot.reservemkt.com.br/webhook/painel"
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy}>
            {exists ? "Salvar" : "Criar integração"}
          </Button>
        </form>

        {config && (
          <div className="space-y-2 text-sm">
            <p>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  config.active ? "bg-success/20 text-success" : "bg-default-200 text-muted-foreground"
                }`}
              >
                {config.active ? "Ativo" : "Desativado"}
              </span>
            </p>
            <p>
              Último sinal de vida:{" "}
              {config.last_heartbeat_at ? new Date(config.last_heartbeat_at).toLocaleString("pt-BR") : "Nunca"}
            </p>
            <p>Segredo do Canal B: {config.panel_webhook_secret_set ? "configurado" : "não configurado"}</p>
            {config.stuck_events > 0 && (
              <p role="alert" className="rounded-xl bg-warning/10 p-3 text-warning">
                {`${config.stuck_events} eventos do bot presos — o reprocesso automático tenta 5 vezes.`}
              </p>
            )}
          </div>
        )}
        <p className="text-sm">Segredo do Canal C: {webhookSecretSet ? "configurado" : "não configurado"}</p>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={busy || !exists} onClick={handleRegenKey}>
            Gerar chave do tenant
          </Button>
          <Button type="button" variant="outline" disabled={busy || !exists} onClick={handleRegenPanel}>
            Gerar segredo do Canal B
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={handleRegenClient}>
            Gerar segredo do Canal C
          </Button>
          {config && (
            <Button type="button" variant="outline" disabled={busy} onClick={handleToggle}>
              {config.active ? "Desativar" : "Ativar"}
            </Button>
          )}
        </div>

        {revealed && (
          <OneTimeSecret label={revealed.label} value={revealed.value} onDismiss={() => setRevealed(null)} />
        )}
      </CardContent>
    </Card>
  );
}
