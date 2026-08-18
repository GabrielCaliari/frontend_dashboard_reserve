"use client";

import { useState } from "react";
import { Button, Card, CardBody, Chip, Input, Switch } from "@heroui/react";
import { AlertTriangle, Copy, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useTenantCapabilities } from "@/src/modules/settings/presentation/hooks/tenant-capabilities-provider";
import {
  useConnectCanal,
  useMotorCanais,
  useMotorRoomTypes,
  useReconcileNow,
  useSaveRoomMap,
  useSetReconcile2x,
} from "@/src/shared/hooks/motor";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import type { MotorCanalStatus } from "@/src/shared/domain/types/@motor";

const STATUS_COLORS: Record<MotorCanalStatus, "success" | "warning" | "danger" | "default"> = {
  OK: "success",
  DIVERGENTE: "warning",
  ERRO: "danger",
  DESCONECTADO: "default",
};

const STATUS_HINTS: Record<MotorCanalStatus, string> = {
  OK: "Sincronização em dia — o Beds24 espelha o motor.",
  DIVERGENTE: "A reconciliação encontrou diferenças entre o motor e as OTAs. O motor já foi corrigido; confira as reservas recentes.",
  ERRO: "Há pushes falhando repetidamente. Verifique a conexão e a fila de erros abaixo.",
  DESCONECTADO: "Nenhuma conta Beds24 conectada — as OTAs não recebem disponibilidade.",
};

const fmtDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString("pt-BR") : "—";

export default function MotorCanaisPage() {
  const { tenantId, hasPermission } = useTenantCapabilities();
  const { data, isLoading, isError } = useMotorCanais(tenantId);
  const { data: roomTypes } = useMotorRoomTypes(tenantId);
  const connect = useConnectCanal(tenantId ?? "");
  const saveMap = useSaveRoomMap(tenantId ?? "");
  const setReconcile2x = useSetReconcile2x(tenantId ?? "");
  const reconcileNow = useReconcileNow(tenantId ?? "");
  const canManage = hasPermission("motor.settings.manage");
  const canReconcile = hasPermission("motor.reservations.manage");

  const [connectForm, setConnectForm] = useState({ invite_code: "", beds24_property_id: "" });
  // O segredo do webhook e devolvido UMA unica vez pelo backend; fica em
  // memoria so ate o usuario sair da tela.
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const [mapDraft, setMapDraft] = useState<Record<string, string>>({});

  const status: MotorCanalStatus = data?.status ?? "DESCONECTADO";

  const mapValue = (roomTypeId: string) =>
    mapDraft[roomTypeId] ?? String(data?.beds24_room_id_map?.[roomTypeId] ?? "");

  async function handleConnect() {
    if (!connectForm.invite_code.trim() || !connectForm.beds24_property_id.trim()) {
      return toast.error("Informe o invite code e o ID da propriedade");
    }
    try {
      const result = await connect.mutateAsync({
        invite_code: connectForm.invite_code.trim(),
        beds24_property_id: connectForm.beds24_property_id.trim(),
      });
      setWebhookSecret(result.webhook_secret);
      setConnectForm({ invite_code: "", beds24_property_id: "" });
      toast.success("Canal conectado — copie o segredo do webhook agora");
    } catch {
      toast.error("Não foi possível conectar — confira o invite code");
    }
  }

  async function handleSaveMap() {
    const map: Record<string, number> = {};
    for (const rt of roomTypes ?? []) {
      const raw = mapValue(rt.id).trim();
      if (!raw) continue;
      const roomId = Number(raw);
      if (!Number.isFinite(roomId) || roomId <= 0) {
        return toast.error(`roomId inválido para ${rt.nome} — use o número do quarto no Beds24`);
      }
      map[rt.id] = roomId;
    }
    try {
      await saveMap.mutateAsync(map);
      setMapDraft({});
      toast.success("Mapeamento salvo");
    } catch {
      toast.error("Não foi possível salvar o mapeamento");
    }
  }

  async function handleReconcileNow() {
    try {
      const { corrigidas } = await reconcileNow.mutateAsync();
      toast.success(
        corrigidas > 0
          ? `Reconciliação concluída — ${corrigidas} reserva(s) corrigida(s)`
          : "Reconciliação concluída — nenhuma divergência",
      );
    } catch {
      toast.error("Não foi possível reconciliar agora");
    }
  }

  const roomTypeName = (id: string) => roomTypes?.find((rt) => rt.id === id)?.nome ?? id;

  return (
    <PainelPageShell
      title="Canais (OTAs)"
      description="Conexão com o Beds24: Booking, Airbnb e Decolar espelham a disponibilidade e o preço do motor."
      isLoading={isLoading}
      isError={isError}
      errorMessage="Erro ao carregar o estado dos canais."
    >
      <div className="space-y-10">
        <PainelSection title="Estado da sincronização">
          <Card className="rounded-3xl border border-border bg-default-50 shadow-none">
            <CardBody className="space-y-4 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <Chip color={STATUS_COLORS[status]} variant="flat">
                  {status}
                </Chip>
                <p className="text-sm text-muted-foreground">{STATUS_HINTS[status]}</p>
              </div>
              {status === "DIVERGENTE" || status === "ERRO" ? (
                <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <span>
                    Atenção: risco de overbooking enquanto o canal não voltar a <strong>OK</strong>.
                    Rode uma reconciliação e confira as reservas das OTAs.
                  </span>
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">Último push</p>
                  <p>{fmtDateTime(data?.last_push_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Último webhook</p>
                  <p>{fmtDateTime(data?.last_webhook_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Última reconciliação</p>
                  <p>{fmtDateTime(data?.last_reconcile_at)}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <Switch
                  isDisabled={!canManage}
                  isSelected={data?.reconcile_2x ?? false}
                  size="sm"
                  onValueChange={async (enabled) => {
                    try {
                      await setReconcile2x.mutateAsync(enabled);
                      toast.success(enabled ? "Reconciliação reforçada ligada (2×/dia)" : "Reconciliação reforçada desligada");
                    } catch {
                      toast.error("Não foi possível alterar a reconciliação");
                    }
                  }}
                >
                  Reconciliação 2×/dia (modo cutover)
                </Switch>
                {canReconcile ? (
                  <Button
                    isDisabled={!data?.conectado}
                    isLoading={reconcileNow.isPending}
                    size="sm"
                    startContent={<RefreshCw className="h-4 w-4" />}
                    variant="flat"
                    onPress={handleReconcileNow}
                  >
                    Reconciliar agora
                  </Button>
                ) : null}
              </div>
            </CardBody>
          </Card>
        </PainelSection>

        <PainelSection title="Conexão com o Beds24">
          <Card className="rounded-3xl border border-border bg-default-50 shadow-none">
            <CardBody className="space-y-4 p-6">
              {data?.conectado ? (
                <p className="text-sm text-foreground">
                  Conectado à propriedade <strong>{data.beds24_property_id ?? "—"}</strong>. Para trocar de
                  conta, gere um novo invite code no Beds24 e conecte de novo.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Gere um invite code no Beds24 (Settings → Account → Access) e informe o ID da propriedade.
                </p>
              )}
              {webhookSecret ? (
                <div className="space-y-2 rounded-xl border border-warning/40 bg-warning/10 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Copie o segredo do webhook AGORA — ele não será mostrado de novo
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cole este valor no header <code>x-webhook-secret</code> do Booking webhook no painel do
                    Beds24 (Settings → Properties → Access).
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="break-all rounded-lg bg-default-100 px-3 py-2 text-xs">{webhookSecret}</code>
                    <Button
                      isIconOnly
                      aria-label="Copiar segredo do webhook"
                      size="sm"
                      variant="flat"
                      onPress={async () => {
                        await navigator.clipboard.writeText(webhookSecret);
                        toast.success("Segredo copiado");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
              {canManage ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    label="Invite code"
                    value={connectForm.invite_code}
                    onChange={(e) => setConnectForm({ ...connectForm, invite_code: e.target.value })}
                  />
                  <Input
                    label="ID da propriedade (Beds24)"
                    value={connectForm.beds24_property_id}
                    onChange={(e) => setConnectForm({ ...connectForm, beds24_property_id: e.target.value })}
                  />
                  <Button
                    className="self-end"
                    color="primary"
                    isLoading={connect.isPending}
                    onPress={handleConnect}
                  >
                    {data?.conectado ? "Reconectar" : "Conectar"}
                  </Button>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </PainelSection>

        <PainelSection title="Mapeamento de quartos">
          <Card className="rounded-3xl border border-border bg-default-50 shadow-none">
            <CardBody className="space-y-4 p-6">
              <p className="text-sm text-muted-foreground">
                Informe o roomId do Beds24 correspondente a cada acomodação do motor. Sem o mapeamento, o
                push de disponibilidade não sabe para qual quarto enviar.
              </p>
              {(roomTypes ?? []).length ? (
                <div className="space-y-3">
                  {(roomTypes ?? []).map((rt) => (
                    <div key={rt.id} className="flex flex-wrap items-center gap-3">
                      <span className="w-56 text-sm text-foreground">{rt.nome}</span>
                      <Input
                        aria-label={`roomId Beds24 de ${rt.nome}`}
                        className="w-48"
                        isDisabled={!canManage}
                        placeholder="roomId no Beds24"
                        type="number"
                        value={mapValue(rt.id)}
                        onChange={(e) => setMapDraft({ ...mapDraft, [rt.id]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma acomodação cadastrada — crie as acomodações antes de mapear.
                </p>
              )}
              {canManage && (roomTypes ?? []).length ? (
                <Button color="primary" isLoading={saveMap.isPending} onPress={handleSaveMap}>
                  Salvar mapeamento
                </Button>
              ) : null}
            </CardBody>
          </Card>
        </PainelSection>

        {data?.fila_erros.length ? (
          <PainelSection title="Fila de erros">
            <Card className="rounded-3xl border border-danger/20 bg-danger/5 shadow-none">
              <CardBody className="space-y-2 p-6">
                <p className="text-sm text-foreground">
                  Pushes que esgotaram as tentativas. Eles voltam a ser enviados quando a conexão for
                  restabelecida ou o mapeamento corrigido.
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {data.fila_erros.map((item) => (
                    <li key={item.id}>
                      <strong className="text-foreground">{roomTypeName(item.room_type_id)}</strong> ·{" "}
                      {item.range_inicio} → {item.range_fim} · {item.attempts} tentativa(s)
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </PainelSection>
        ) : null}
      </div>
    </PainelPageShell>
  );
}
