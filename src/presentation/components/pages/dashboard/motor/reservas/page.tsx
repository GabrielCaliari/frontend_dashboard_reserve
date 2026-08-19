"use client";

import { useState } from "react";
import { Button, Chip, Input, Modal, ModalBody, ModalContent, ModalHeader, Select, SelectItem, Textarea } from "@heroui/react";
import { CalendarX } from "lucide-react";
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
import { ConfirmModal } from "@/src/presentation/components/organisms/modals/confirm-modal";
import type { MotorReservation } from "@/src/shared/domain/types/@motor";

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

// Um unico vocabulario de status: o mesmo rotulo no filtro, no Chip da tabela
// e no detalhe. O codigo cru do backend nunca aparece pro usuario.
const STATUS_LABELS: Record<string, string> = {
  HOLD: "Pré-reserva",
  CONFIRMADA: "Confirmada",
  CHECKIN_FEITO: "Check-in feito",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
  NOSHOW: "No-show",
};

const STATUS_OPTIONS = [
  { key: "CONFIRMADA", label: STATUS_LABELS.CONFIRMADA },
  { key: "CHECKIN_FEITO", label: STATUS_LABELS.CHECKIN_FEITO },
  { key: "CONCLUIDA", label: STATUS_LABELS.CONCLUIDA },
  { key: "CANCELADA", label: STATUS_LABELS.CANCELADA },
  { key: "NOSHOW", label: STATUS_LABELS.NOSHOW },
];
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
  const [isCancelOpen, setIsCancelOpen] = useState(false);

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

  // Acao destrutiva: confirmacao obrigatoria (spec §5), no mesmo modal
  // padronizado das demais telas do motor.
  function askCancel() {
    if (!motivo.trim()) return toast.error("Informe o motivo do cancelamento");
    setIsCancelOpen(true);
  }

  async function handleCancel() {
    if (!selectedId) return;
    try {
      await cancel.mutateAsync({ id: selectedId, motivo });
      toast.success("Reserva cancelada — as datas foram liberadas");
      setIsCancelOpen(false);
      setSelectedId(null);
      setMotivo("");
    } catch {
      toast.error("Não foi possível cancelar");
      setIsCancelOpen(false);
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
            <SelectItem key={status.key}>{status.label}</SelectItem>
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
                  {STATUS_LABELS[r.status] ?? r.status}
                </Chip>
              ),
            },
            { key: "total", header: "Total", render: (r) => fmtBRL(r.valor_total) },
            { key: "saldo", header: "Saldo no check-in", render: (r) => fmtBRL(r.saldo_checkin) },
            {
              key: "acoes",
              header: "Ações",
              render: (r) => (
                <Button size="sm" variant="flat" onPress={() => setSelectedId(r.id)}>
                  Ver detalhes
                </Button>
              ),
            },
          ]}
          getRowKey={(r) => r.id}
          rows={rows}
        />
      ) : statusFilter ? (
        <PortalEmptyState
          actionLabel="Mostrar todos os status"
          description={`Nenhuma reserva com o status "${STATUS_LABELS[statusFilter] ?? statusFilter}" no momento.`}
          icon={CalendarX}
          title="Nenhuma reserva neste filtro"
          onAction={() => setStatusFilter("")}
        />
      ) : (
        <PortalEmptyState
          description="Quando o bot ou a equipe criarem reservas, elas aparecem aqui."
          icon={CalendarX}
          title="Nenhuma reserva"
        />
      )}

      <Modal isOpen={!!selectedId} size="2xl" onClose={() => setSelectedId(null)}>
        <ModalContent>
          <ModalHeader className="flex-col items-start gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <span>{detail?.hospede_nome ?? "Reserva"}</span>
              {detail ? (
                <Chip color={STATUS_COLORS[detail.status] ?? "default"} size="sm" variant="flat">
                  {STATUS_LABELS[detail.status] ?? detail.status}
                </Chip>
              ) : null}
            </div>
            <span className="text-sm font-normal text-foreground/60">
              {detail ? `${detail.checkin} → ${detail.checkout} · ${detail.unit?.identificador ?? ""}` : ""}
            </span>
          </ModalHeader>
          <ModalBody className="space-y-6 pb-6">
            {detail ? (
              <>
                <div className="grid grid-cols-2 gap-4 rounded-2xl bg-default-100 p-4 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-foreground/60">Total</p>
                    <p className="font-medium">{fmtBRL(detail.valor_total)}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60">Pago</p>
                    <p className="font-medium">{fmtBRL(detail.valor_pago)}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60">Saldo no check-in</p>
                    <p className="font-medium">{fmtBRL(detail.saldo_checkin)}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60">Pagamento</p>
                    <p className="font-medium">{detail.forma_pagamento ?? "—"}</p>
                  </div>
                </div>
                {detail.events?.length ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Histórico</p>
                    <ul className="space-y-1 text-sm text-foreground/60">
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
                  <div className="space-y-5 border-t border-border pt-5">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Remarcar</p>
                      <div className="flex flex-wrap items-end gap-3">
                        <Input label="Novo check-in" type="date" value={novasDatas.novo_checkin} onChange={(e) => setNovasDatas({ ...novasDatas, novo_checkin: e.target.value })} />
                        <Input label="Novo check-out" type="date" value={novasDatas.novo_checkout} onChange={(e) => setNovasDatas({ ...novasDatas, novo_checkout: e.target.value })} />
                        <Button color="primary" isLoading={reschedule.isPending} variant="flat" onPress={handleReschedule}>
                          Remarcar
                        </Button>
                      </div>
                      <p className="text-sm text-foreground/60">O valor já pago é mantido nas novas datas.</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Cancelar</p>
                      <div className="flex flex-wrap items-end gap-3">
                        <Textarea className="flex-1" label="Motivo do cancelamento" minRows={1} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                        <Button color="danger" isLoading={cancel.isPending} variant="flat" onPress={askCancel}>
                          Cancelar reserva
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>

      <ConfirmModal
        confirmColor="danger"
        confirmText="Cancelar reserva"
        cancelText="Voltar"
        isLoading={cancel.isPending}
        isOpen={isCancelOpen}
        message={
          detail
            ? `Cancelar a reserva de ${detail.hospede_nome} (${detail.checkin} → ${detail.checkout})? As datas voltam a ficar livres e o estorno, se houver, é feito à mão no Asaas.`
            : "Cancelar esta reserva? As datas voltam a ficar livres."
        }
        title="Confirmar cancelamento"
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancel}
      />
    </PainelPageShell>
  );
}
