"use client";

import { useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { AUDIENCE_LABELS, stageLabel } from "@/src/presentation/components/organisms/hotel-portal/funil/funnel-stages";
import type {
  BotContactAudience,
  FunnelStage,
  FunnelStageChangeDto,
} from "@/src/shared/domain/types/@hotel-painel";

export interface PendingMove {
  numeroContato: string;
  nome: string | null;
  paraEstagio: FunnelStage;
}

interface MoveStageModalProps {
  pending: PendingMove; // so PERDIDO ou PUBLICO_IDENTIFICADO chegam aqui
  onConfirm: (dto: FunnelStageChangeDto) => Promise<void>;
  onClose: () => void;
}

export function MoveStageModal({ pending, onConfirm, onClose }: MoveStageModalProps) {
  const [motivo, setMotivo] = useState("");
  const [motivoInvalido, setMotivoInvalido] = useState(false);
  const [subtipo, setSubtipo] = useState<BotContactAudience | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titulo = `Mover ${pending.nome ?? pending.numeroContato} para ${stageLabel(pending.paraEstagio)}`;

  async function submit(dto: FunnelStageChangeDto) {
    setIsSubmitting(true);
    try {
      await onConfirm(dto);
      onClose();
    } catch {
      // erro fica com quem chama onMove (Task 4) — modal so permanece aberto
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleConfirmarMotivo() {
    const trimmed = motivo.trim();
    if (trimmed.length === 0) {
      setMotivoInvalido(true);
      return;
    }
    setMotivoInvalido(false);
    void submit({ para_estagio: pending.paraEstagio, motivo: trimmed });
  }

  function handleConfirmarSubtipo() {
    const dto: FunnelStageChangeDto = subtipo
      ? { para_estagio: pending.paraEstagio, tipo_publico: subtipo }
      : { para_estagio: pending.paraEstagio };
    void submit(dto);
  }

  function handlePular() {
    void submit({ para_estagio: pending.paraEstagio });
  }

  return (
    <Modal isOpen onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex-col gap-1">{titulo}</ModalHeader>
        <ModalBody className="pb-6">
          {pending.paraEstagio === "PERDIDO" ? (
            <Textarea
              label="Motivo da perda"
              maxLength={255}
              value={motivo}
              isInvalid={motivoInvalido}
              errorMessage={motivoInvalido ? "Informe o motivo da perda" : undefined}
              onChange={(e) => {
                setMotivo(e.target.value);
                if (motivoInvalido) setMotivoInvalido(false);
              }}
            />
          ) : (
            <Select
              label="Subtipo do público"
              selectedKeys={subtipo ? [subtipo] : []}
              onChange={(e) => setSubtipo(e.target.value as BotContactAudience)}
            >
              {(Object.keys(AUDIENCE_LABELS) as BotContactAudience[]).map((key) => (
                <SelectItem key={key}>{AUDIENCE_LABELS[key]}</SelectItem>
              ))}
            </Select>
          )}
        </ModalBody>
        <ModalFooter>
          {pending.paraEstagio === "PUBLICO_IDENTIFICADO" && (
            <Button variant="light" isLoading={isSubmitting} onPress={handlePular}>
              Pular
            </Button>
          )}
          <Button
            color="primary"
            isLoading={isSubmitting}
            onPress={pending.paraEstagio === "PERDIDO" ? handleConfirmarMotivo : handleConfirmarSubtipo}
          >
            Confirmar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
