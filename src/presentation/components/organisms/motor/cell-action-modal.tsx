"use client";

import { useState } from "react";
import { Button, Input, Modal, ModalBody, ModalContent, ModalHeader, Select, SelectItem, Tab, Tabs } from "@heroui/react";
import toast from "react-hot-toast";
import { useCreateBlock } from "@/src/shared/hooks/motor/use-motor-calendar";
import { useCreateManualReservation } from "@/src/shared/hooks/motor/use-motor-reservations";
import type { MotorBlock, MotorCalendarDia, MotorCalendarUnidade } from "@/src/shared/domain/types/@motor";
import { ESTADO_STYLES } from "./occupancy-grid";

const BLOCK_MOTIVOS = [
  { key: "MANUTENCAO", label: "Manutenção" },
  { key: "USO_PROPRIO", label: "Uso próprio" },
  { key: "MENSALISTA", label: "Mensalista (permanente)" },
  { key: "OUTRO", label: "Outro" },
];

interface CellActionModalProps {
  tenantId: string;
  unidade: MotorCalendarUnidade;
  dia: MotorCalendarDia;
  canManage: boolean;
  onClose: () => void;
}

export function CellActionModal({ tenantId, unidade, dia, canManage, onClose }: CellActionModalProps) {
  const createBlock = useCreateBlock(tenantId);
  const createReservation = useCreateManualReservation(tenantId);
  const [block, setBlock] = useState<{ data_fim: string; motivo: MotorBlock["motivo"]; nota: string }>({
    data_fim: "",
    motivo: "MANUTENCAO",
    nota: "",
  });
  const [reserva, setReserva] = useState({ checkout: "", hospede_nome: "", hospede_telefone: "", adultos: 2 });

  const livre = dia.estado === "LIVRE";

  // O backend distingue as causas (sem tarifa configurada, tipo esgotado,
  // reserva sobreposta) — mostrar a mensagem real evita o palpite generico.
  function apiErrorMessage(error: unknown, fallback: string): string {
    const message = (error as { response?: { data?: { message?: string } } })
      ?.response?.data?.message;

    return typeof message === "string" && message.length > 0 ? message : fallback;
  }

  async function handleBlock() {
    try {
      await createBlock.mutateAsync({
        unit_id: unidade.unit_id,
        data_inicio: dia.data,
        // Mensalista e bloqueio permanente: sem data_fim (regra v5).
        data_fim: block.motivo === "MENSALISTA" ? undefined : block.data_fim || undefined,
        motivo: block.motivo,
        nota: block.nota || undefined,
      });
      toast.success("Bloqueio criado");
      onClose();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Não foi possível bloquear — há reserva no período?"));
    }
  }

  async function handleReserva() {
    if (!reserva.hospede_nome.trim() || !reserva.checkout) {
      return toast.error("Informe hóspede e data de saída");
    }
    try {
      await createReservation.mutateAsync({
        room_type_id: unidade.room_type_id,
        unit_id: unidade.unit_id,
        checkin: dia.data,
        checkout: reserva.checkout,
        hospede_nome: reserva.hospede_nome,
        hospede_telefone: reserva.hospede_telefone || undefined,
        adultos: reserva.adultos,
        origem: "MANUAL",
      });
      toast.success("Reserva criada");
      onClose();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Não foi possível reservar — datas indisponíveis"));
    }
  }

  return (
    <Modal isOpen onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex-col gap-1">
          {unidade.identificador} · {dia.data}
          <span className="text-sm font-normal text-muted-foreground">
            {ESTADO_STYLES[dia.estado].label}
            {dia.hospede_nome ? ` — ${dia.hospede_nome}` : ""}
          </span>
        </ModalHeader>
        <ModalBody className="pb-6">
          {!livre || !canManage ? (
            <p className="text-sm text-muted-foreground">
              {livre
                ? "Você tem acesso somente de leitura."
                : "Para alterar esta ocupação, use a tela Reservas (remarcar/cancelar) ou remova o bloqueio."}
            </p>
          ) : (
            <Tabs aria-label="Ação na célula">
              <Tab key="block" title="Bloquear">
                <div className="space-y-3 pt-2">
                  <Select
                    label="Motivo"
                    selectedKeys={[block.motivo]}
                    onChange={(e) => setBlock({ ...block, motivo: e.target.value as MotorBlock["motivo"] })}
                  >
                    {BLOCK_MOTIVOS.map((m) => (
                      <SelectItem key={m.key}>{m.label}</SelectItem>
                    ))}
                  </Select>
                  {block.motivo !== "MENSALISTA" ? (
                    <Input label="Até (exclusivo)" type="date" value={block.data_fim} onChange={(e) => setBlock({ ...block, data_fim: e.target.value })} />
                  ) : null}
                  <Input label="Nota" value={block.nota} onChange={(e) => setBlock({ ...block, nota: e.target.value })} />
                  <Button color="primary" isLoading={createBlock.isPending} onPress={handleBlock}>
                    Confirmar bloqueio
                  </Button>
                </div>
              </Tab>
              <Tab key="reserva" title="Reserva manual">
                <div className="space-y-3 pt-2">
                  <Input label="Hóspede" value={reserva.hospede_nome} onChange={(e) => setReserva({ ...reserva, hospede_nome: e.target.value })} />
                  <Input label="Telefone" value={reserva.hospede_telefone} onChange={(e) => setReserva({ ...reserva, hospede_telefone: e.target.value })} />
                  <div className="flex gap-3">
                    <Input isReadOnly label="Check-in" type="date" value={dia.data} />
                    <Input label="Check-out" type="date" value={reserva.checkout} onChange={(e) => setReserva({ ...reserva, checkout: e.target.value })} />
                    <Input className="w-24" label="Adultos" type="number" value={String(reserva.adultos)} onChange={(e) => setReserva({ ...reserva, adultos: Number(e.target.value) || 1 })} />
                  </div>
                  <Button color="primary" isLoading={createReservation.isPending} onPress={handleReserva}>
                    Criar reserva
                  </Button>
                </div>
              </Tab>
            </Tabs>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
