"use client";

import Link from "next/link";
import { ExternalLink, MessageSquareText } from "lucide-react";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import type { BotIssueDetail, BotIssueStatus } from "@/src/shared/domain/types/@hotel-painel";
import { conversationHref } from "@/src/presentation/components/organisms/hotel-portal/painel/conversation-link";
import { SEVERITY_CLASSES, SEVERITY_LABELS, STATUS_LABELS, categoryLabel, formatDateTime } from "./labels";

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
      <p className="text-xs font-medium text-foreground/50">{label}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

function quemLabel(quem: string): string {
  if (quem === "bot") return "Bot";
  if (quem === "hospede") return "Hóspede";
  return quem;
}

/**
 * Detalhe do erro: o trecho da conversa em bolhas, com a mensagem onde o bot
 * errou em destaque, e o atalho para a conversa inteira. E aqui que a equipe
 * ve ONDE e COMO o bot errou, nao so o codigo.
 */
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
        <ModalHeader className="flex flex-col gap-1.5">
          <span className="font-display text-xl font-semibold tracking-[-0.01em]">
            {issue ? issue.codigo : "Erro do bot"}
          </span>
          {issue && (
            <span className="flex flex-wrap items-center gap-2 text-xs font-normal text-foreground/60">
              <span className={`rounded-md px-1.5 py-px font-medium ${SEVERITY_CLASSES[issue.gravidade]}`}>
                {SEVERITY_LABELS[issue.gravidade]}
              </span>
              <span>{categoryLabel(issue.categoria)}</span>
              <span>{STATUS_LABELS[issue.status]}</span>
              <span className="tabular-nums">{formatDateTime(issue.ocorridoEm)}</span>
              {issue.nomeContato || issue.numeroContato ? (
                <span>· {issue.nomeContato ?? issue.numeroContato}</span>
              ) : null}
            </span>
          )}
        </ModalHeader>
        <ModalBody className="space-y-5">
          {!issue ? (
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Carregando…" : "Não foi possível carregar o erro."}
            </p>
          ) : (
            <>
              {issue.mensagem && (
                <p className="rounded-xl border border-danger/25 bg-danger/5 px-3.5 py-2.5 text-sm text-foreground">
                  {issue.mensagem}
                </p>
              )}

              <Field label="Onde o bot errou">
                {issue.ultimasMensagens.length > 0 || issue.mensagemHospede || issue.respostaBot ? (
                  <ol className="space-y-1.5 rounded-2xl bg-default-100/60 p-3">
                    {issue.ultimasMensagens.map((msg, idx) => {
                      const doBot = msg.quem === "bot";
                      return (
                        <li key={`${msg.em}-${idx}`} className={`flex flex-col ${doBot ? "items-end" : "items-start"}`}>
                          <span
                            className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-[13px] leading-relaxed ${
                              doBot
                                ? "rounded-tr-md border border-primary/20 bg-primary/[0.16]"
                                : "rounded-tl-md border border-border/70 bg-content1"
                            }`}
                          >
                            <span className="mb-0.5 block text-[10.5px] font-semibold text-foreground/50">
                              {quemLabel(msg.quem)} · {msg.em}
                            </span>
                            {msg.m}
                          </span>
                        </li>
                      );
                    })}
                    {issue.mensagemHospede && (
                      <li className="flex flex-col items-start">
                        <span className="max-w-[85%] rounded-2xl rounded-tl-md border border-border/70 bg-content1 px-3 py-1.5 text-[13px] leading-relaxed">
                          <span className="mb-0.5 block text-[10.5px] font-semibold text-foreground/50">Hóspede</span>
                          {issue.mensagemHospede}
                        </span>
                      </li>
                    )}
                    {/* A resposta que saiu errada: borda em vermelho e rotulo claro. */}
                    <li className="flex flex-col items-end">
                      <span className="max-w-[85%] rounded-2xl rounded-tr-md border-2 border-danger/60 bg-danger/[0.08] px-3 py-1.5 text-[13px] leading-relaxed">
                        <span className="mb-0.5 block text-[10.5px] font-semibold text-danger">
                          Bot · resposta com erro
                        </span>
                        {issue.respostaBot ?? "O bot não respondeu."}
                      </span>
                    </li>
                  </ol>
                ) : (
                  <p className="text-foreground/60">O bot não registrou o trecho da conversa neste erro.</p>
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Etapa">{issue.etapa ?? "—"}</Field>
                <Field label="Workflow / nó">
                  {issue.workflow ?? "—"} {issue.no ? `/ ${issue.no}` : ""}
                </Field>
              </div>

              <div className="flex flex-wrap gap-2">
                {issue.numeroContato && (
                  <Link
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    href={conversationHref(issue.numeroContato)}
                  >
                    <MessageSquareText aria-hidden className="h-3.5 w-3.5" />
                    Abrir conversa inteira
                  </Link>
                )}
                {isSuperAdmin && issue.url && (
                  <a
                    className="inline-flex items-center gap-1.5 rounded-lg bg-default-100 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-default-200"
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir execução no n8n <ExternalLink aria-hidden className="h-3.5 w-3.5" />
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
