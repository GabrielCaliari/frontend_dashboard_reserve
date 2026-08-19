"use client";

import { useState } from "react";
import { Button, Checkbox, Input, Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import toast from "react-hot-toast";
import { useUpsertDailyInventory } from "@/src/shared/hooks/motor";
import type { MotorGradeDia, MotorGradeRoomType } from "@/src/shared/domain/types/@motor";

interface GradeCellModalProps {
  tenantId: string;
  roomType: MotorGradeRoomType;
  dia: MotorGradeDia;
  canManage: boolean;
  onClose: () => void;
}

// O backend distingue as causas (sem tarifa configurada, tipo esgotado,
// reserva sobreposta) — mostrar a mensagem real evita o palpite generico.
function apiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;

  return typeof message === "string" && message.length > 0 ? message : fallback;
}

export function GradeCellModal({ tenantId, roomType, dia, canManage, onClose }: GradeCellModalProps) {
  const upsertDay = useUpsertDailyInventory(tenantId);
  const [preco, setPreco] = useState(dia.preco !== null ? String(dia.preco) : "");
  const [minStay, setMinStay] = useState(dia.min_stay !== null ? String(dia.min_stay) : "1");
  const [stopSell, setStopSell] = useState(dia.stop_sell);

  async function handleSubmit() {
    try {
      await upsertDay.mutateAsync({
        room_type_id: roomType.room_type_id,
        data: dia.data,
        preco: Number(preco),
        min_stay: Number(minStay),
        stop_sell: stopSell,
      });
      toast.success("Tarifa atualizada");
      onClose();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Não foi possível atualizar a tarifa deste dia"));
    }
  }

  return (
    <Modal isOpen onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex-col gap-1">
          {roomType.nome} · {dia.data}
        </ModalHeader>
        <ModalBody className="pb-6">
          {canManage ? (
            <div className="space-y-3">
              <Input
                label="Preço/noite"
                type="number"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
              />
              <Input
                label="Mín. noites"
                type="number"
                value={minStay}
                onChange={(e) => setMinStay(e.target.value)}
              />
              <Checkbox isSelected={stopSell} onValueChange={setStopSell}>
                Fechar venda
              </Checkbox>
              <Button color="primary" isLoading={upsertDay.isPending} onPress={handleSubmit}>
                Salvar
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Você tem acesso somente de leitura.</p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Edição pontual grava um override que a materialização de tarifas não sobrescreve.
          </p>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
