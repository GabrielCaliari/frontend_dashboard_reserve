"use client";

import { useState } from "react";
import { Button, Chip, Input, Modal, ModalBody, ModalContent, ModalHeader, Select, SelectItem, Textarea } from "@heroui/react";
import toast from "react-hot-toast";
import { useTenantCapabilities } from "@/src/modules/settings/presentation/hooks/tenant-capabilities-provider";
import {
  useCancelReservation,
  useMotorReservation,
  useMotorReservations,
  useRescheduleReservation,
} from "@/src/shared/hooks/motor";
import { PainelPageShell } from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { PortalDataTable } from "@/src/presentation/components/organisms/hotel-portal/painel/data-table";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import type { MotorReservation } from "@/src/shared/domain/types/@motor";

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

const STATUS_OPTIONS = ["CONFIRMADA", "CHECKIN_FEITO", "CONCLUIDA", "CANCELADA", "NOSHOW"];
const ORIGEM_LABELS: Record<string, string> = {
  BOT_WHATSAPP: "Bot WhatsApp",
  OTA_BOOKING: "Booking",
  OTA_AIRBNB: "Airbnb",
  OTA_DECOLAR: "Decolar",
  SITE_HSYSTEM: "Site (HSystem)",
  MANUAL: "Manual",
};

const STATUS_COLORS: Record<string, "success" | "warning" | "danger" | "default" | "primary"> = {
  CONFIRMADA: "success",
  HOLD: "warning",
  CHECKIN_FEITO: "primary",
  CONCLUIDA: "default",
  CANCELADA: "danger",
  NOSHOW: "danger",
};

export default function MotorReservasPage() {
  const { tenantId, hasPermission } = useTenantCapabilities();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data: reservations, isLoading, isError } = useMotorReservations(
    tenantId,
    statusFilter ? { status: statusFilter } : undefined,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detail } = useMotorReservation(tenantId, selectedId);
  const reschedule = useRescheduleReservation(tenantId ?? "");
  const cancel = useCancelReservation(tenantId ?? "");
  const canManage = hasPermission("motor.reservations.manage");

  const [novasDatas, setNovasDatas] = useState({ novo_checkin: "", novo_checkout: "" });
  const [motivo, setMotivo] = useState("");

  async function handleReschedule() {
    if (!selectedId || !novasDatas.novo_checkin || !novasDatas.novo_checkout) return;
    try {
      await reschedule.mutateAsync({ id: selectedId, dto: novasDatas });
      toast.success("Reserva remarcada — o valor pago foi mantido");
      setNovasDatas({ novo_checkin: "", novo_checkout: "" });
    } catch {
      toast.error("Sem unidade livre nas novas datas");
    }
  }

  async function handleCancel() {
    if (!selectedId) return;
    if (!motivo.trim()) return toast.error("Informe o motivo do cancelamento");
    // Acao destrutiva: confirmacao obrigatoria (spec §5).
    if (!window.confirm("Cancelar esta reserva? Estorno, se houver, é feito manualmente no Asaas.")) return;
    try {
      await cancel.mutateAsync({ id: selectedId, motivo });
      toast.success("Reserva cancelada — as datas foram liberadas");
      setSelectedId(null);
      setMotivo("");
    } catch {
      toast.error("Não foi possível cancelar");
    }
  }

  const rows = reservations ?? [];

  return (
    <PainelPageShell
      title="Reservas"
      description="Todas as reservas do motor: do bot, das OTAs e manuais."
      isLoading={isLoading}
      isError={isError}
      errorMessage="Erro ao carregar as reservas."
      actions={
        <Select
          aria-label="Filtrar por status"
          className="w-48"
          placeholder="Todos os status"
          selectedKeys={statusFilter ? [statusFilter] : []}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((status) => (
            <SelectItem key={status}>{status}</SelectItem>
          ))}
        </Select>
      }
    >
      {rows.length > 0 ? (
        <PortalDataTable<MotorReservation>
          columns={[
            { key: "hospede", header: "Hóspede", render: (r) => r.hospede_nome },
            { key: "periodo", header: "Período", render: (r) => `${r.checkin} → ${r.checkout}` },
            { key: "unidade", header: "Unidade", render: (r) => r.unit?.identificador ?? "—" },
            { key: "origem", header: "Origem", render: (r) => ORIGEM_LABELS[r.origem] ?? r.origem },
            {
              key: "status",
              header: "Status",
              render: (r) => (
                <Chip color={STATUS_COLORS[r.status] ?? "default"} size="sm" variant="flat">
                  {r.status}
                </Chip>
              ),
            },
            { key: "total", header: "Total", render: (r) => fmtBRL(r.valor_total) },
            { key: "saldo", header: "Saldo no check-in", render: (r) => fmtBRL(r.saldo_checkin) },
            {
              key: "acoes",
              header: "",
              render: (r) => (
                <Button size="sm" variant="flat" onPress={() => setSelectedId(r.id)}>
                  Detalhes
                </Button>
              ),
            },
          ]}
          getRowKey={(r) => r.id}
          rows={rows}
        />
      ) : (
        <PortalEmptyState
          title="Nenhuma reserva"
          description="Quando o bot ou a equipe criarem reservas, elas aparecem aqui."
        />
      )}

      <Modal isOpen={!!selectedId} size="2xl" onClose={() => setSelectedId(null)}>
        <ModalContent>
          <ModalHeader className="flex-col gap-1">
            {detail?.hospede_nome ?? "Reserva"}
            <span className="text-sm font-normal text-muted-foreground">
              {detail ? `${detail.checkin} → ${detail.checkout} · ${detail.unit?.identificador ?? ""}` : ""}
            </span>
          </ModalHeader>
          <ModalBody className="space-y-5 pb-6">
            {detail ? (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div><p className="text-muted-foreground">Total</p><p>{fmtBRL(detail.valor_total)}</p></div>
                  <div><p className="text-muted-foreground">Pago</p><p>{fmtBRL(detail.valor_pago)}</p></div>
                  <div><p className="text-muted-foreground">Saldo no check-in</p><p>{fmtBRL(detail.saldo_checkin)}</p></div>
                  <div><p className="text-muted-foreground">Pagamento</p><p>{detail.forma_pagamento ?? "—"}</p></div>
                </div>
                {detail.events?.length ? (
                  <div>
                    <p className="mb-1 text-sm font-medium">Histórico</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {detail.events.map((event) => (
                        <li key={event.id}>
                          {new Date(event.created_at).toLocaleString("pt-BR")} — {event.tipo}
                          {event.autor ? ` (${event.autor})` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {canManage && !["CANCELADA", "CONCLUIDA"].includes(detail.status) ? (
                  <>
                    <div className="flex flex-wrap items-end gap-3">
                      <Input label="Novo check-in" type="date" value={novasDatas.novo_checkin} onChange={(e) => setNovasDatas({ ...novasDatas, novo_checkin: e.target.value })} />
                      <Input label="Novo check-out" type="date" value={novasDatas.novo_checkout} onChange={(e) => setNovasDatas({ ...novasDatas, novo_checkout: e.target.value })} />
                      <Button color="primary" isLoading={reschedule.isPending} variant="flat" onPress={handleReschedule}>
                        Remarcar
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                      <Textarea className="flex-1" label="Motivo do cancelamento" minRows={1} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                      <Button color="danger" isLoading={cancel.isPending} variant="flat" onPress={handleCancel}>
                        Cancelar reserva
                      </Button>
                    </div>
                  </>
                ) : null}
              </>
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>
    </PainelPageShell>
  );
}
