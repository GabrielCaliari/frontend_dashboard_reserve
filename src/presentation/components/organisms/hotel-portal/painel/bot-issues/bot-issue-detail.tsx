"use client";

import Link from "next/link";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import type { BotIssueDetail, BotIssueStatus } from "@/src/shared/domain/types/@hotel-painel";
import { SEVERITY_LABELS, STATUS_LABELS, categoryLabel, formatDateTime } from "./labels";

interface Props {
  open: boolean;
  issue: BotIssueDetail | undefined;
  isLoading?: boolean;
  canManage: boolean;
  isSuperAdmin: boolean;
  isUpdating: boolean;
  onClose: () => void;
  onChangeStatus: (id: string, status: BotIssueStatus) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function BotIssueDetailModal({
  open,
  issue,
  isLoading,
  canManage,
  isSuperAdmin,
  isUpdating,
  onClose,
  onChangeStatus,
}: Props) {
  return (
    <Modal isOpen={open} onOpenChange={(o) => !o && onClose()} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {issue ? issue.codigo : "Erro do bot"}
          {issue && (
            <span className="text-xs font-normal text-muted-foreground">
              {categoryLabel(issue.categoria)} · {SEVERITY_LABELS[issue.gravidade]} ·{" "}
              {STATUS_LABELS[issue.status]} · {formatDateTime(issue.ocorridoEm)}
            </span>
          )}
        </ModalHeader>
        <ModalBody className="space-y-4">
          {!issue ? (
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Carregando…" : "Não foi possível carregar o erro."}
            </p>
          ) : (
            <>
              <Field label="Mensagem do hóspede">{issue.mensagemHospede ?? "—"}</Field>
              <Field label="Resposta do bot">{issue.respostaBot ?? "—"}</Field>
              {issue.ultimasMensagens.length > 0 && (
                <Field label="Trecho da conversa">
                  <ul className="space-y-1 rounded-lg bg-default-50 p-3">
                    {issue.ultimasMensagens.map((msg, idx) => (
                      <li key={`${msg.em}-${idx}`} className="flex gap-2">
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {msg.quem === "bot" ? "Bot" : msg.quem === "hospede" ? "Hóspede" : msg.quem}
                        </span>
                        <span>{msg.m}</span>
                      </li>
                    ))}
                  </ul>
                </Field>
              )}
              <Field label="Workflow / nó">
                {issue.workflow ?? "—"} {issue.no ? `/ ${issue.no}` : ""}
              </Field>
              <div className="flex flex-wrap gap-4 text-sm">
                {issue.numeroContato && (
                  <Link
                    className="text-primary underline"
                    href={`/dashboard/hotel/atendimento/${issue.numeroContato}`}
                  >
                    Abrir conversa
                  </Link>
                )}
                {isSuperAdmin && issue.url && (
                  <a
                    className="text-primary underline"
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir execução no n8n
                  </a>
                )}
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          {issue && canManage && (
            <>
              <Button
                variant="flat"
                isDisabled={isUpdating || issue.status === "VISTO"}
                onPress={() => onChangeStatus(issue.id, "VISTO")}
              >
                Marcar como visto
              </Button>
              <Button
                color="primary"
                isDisabled={isUpdating || issue.status === "CORRIGIDO"}
                onPress={() => onChangeStatus(issue.id, "CORRIGIDO")}
              >
                Marcar como corrigido
              </Button>
            </>
          )}
          <Button variant="light" onPress={onClose}>
            Fechar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
