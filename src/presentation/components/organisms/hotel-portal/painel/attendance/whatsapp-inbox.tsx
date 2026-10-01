"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ArrowLeft, Bot, ExternalLink, Hand, MessageSquareText, Play, Search, UserRound } from "lucide-react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import { useTenantCapabilities } from "@/src/modules/settings/presentation/hooks/tenant-capabilities-provider";
import {
  useHotelConversationDetail,
  useHotelConversations,
  usePauseConversation,
  useResumeConversation,
} from "@/src/shared/hooks/hotel-portal";
import { ConversationTranscript } from "@/src/presentation/components/organisms/hotel-portal/painel/attendance/conversation-transcript";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import {
  HOLD_STATUS_LABELS,
  OCCASION_LABELS,
  botStatusLabel,
  botStatusTone,
  canTakeOver,
  isWithHuman,
} from "@/src/presentation/components/organisms/hotel-portal/funil/bot-status";
import {
  FUNNEL_STAGES,
  formatBRL,
  STAGE_TONES,
  contactInitials,
  stageLabel,
} from "@/src/presentation/components/organisms/hotel-portal/funil/funnel-stages";
import type {
  ConversationListItem,
  FunnelStage,
} from "@/src/shared/domain/types/@hotel-painel";

/** Etiqueta ativa: todas, pausadas (aguardando humano) ou um estagio do funil. */
type Etiqueta = "todas" | "pausadas" | FunnelStage;

/** +5535999110001 -> +55 (35) 99911-0001; formatos fora do padrao BR ficam como vieram. */
export function formatPhoneBR(numero: string): string {
  const digitos = numero.replace(/\D/g, "");
  const semPais = digitos.startsWith("55") ? digitos.slice(2) : null;
  if (!semPais || semPais.length < 10 || semPais.length > 11) return numero;
  const ddd = semPais.slice(0, 2);
  const corpo = semPais.slice(2);
  const quebra = corpo.length - 4;
  return `+55 (${ddd}) ${corpo.slice(0, quebra)}-${corpo.slice(quebra)}`;
}

function formatWhen(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const agora = new Date();
  const mesmoDia =
    d.getFullYear() === agora.getFullYear() &&
    d.getMonth() === agora.getMonth() &&
    d.getDate() === agora.getDate();
  if (mesmoDia) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function ContactRow({
  conv,
  selected,
  onSelect,
}: {
  conv: ConversationListItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 border-b border-border/60 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        selected ? "bg-default-100" : "hover:bg-default-100/60"
      }`}
      type="button"
      onClick={onSelect}
    >
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
      >
        {contactInitials(conv.nome, conv.numeroContato)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold">{conv.nome ?? formatPhoneBR(conv.numeroContato)}</span>
          <span className="shrink-0 text-[11px] text-foreground/50">{formatWhen(conv.lastMessageAt)}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5">
          <span className={`rounded-full px-1.5 py-px text-[10px] font-medium ${STAGE_TONES[conv.currentStage]}`}>
            {stageLabel(conv.currentStage)}
          </span>
          {isWithHuman(conv.statusBot) ? (
            <UserRound aria-label="Com humano" className="h-3.5 w-3.5 text-warning-600" />
          ) : (
            <Bot aria-label="Com o bot" className="h-3.5 w-3.5 text-primary/60" />
          )}
        </span>
      </span>
    </button>
  );
}

/** 2026-11-20 -> 20/11 */
function diaMes(iso: string | null): string {
  const m = /^\d{4}-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${m[2]}/${m[1]}` : "";
}

/**
 * Inbox estilo WhatsApp Web, SOMENTE LEITURA (contrato v2 §4.2): lista com
 * etiquetas de estagio a esquerda, transcricao a direita. A equipe responde
 * pelo WhatsApp Business da pousada; daqui so se abre a conversa no WhatsApp
 * Web. Mobile alterna lista <-> conversa.
 */
export function WhatsappInbox({ clientId }: { clientId: string }) {
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [etiqueta, setEtiqueta] = useState<Etiqueta>("todas");
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [retomadaAberta, setRetomadaAberta] = useState(false);
  const [estagioRetomada, setEstagioRetomada] = useState<FunnelStage | null>(null);

  const { tenantId, hasPermission } = useTenantCapabilities();
  const podeRetomar = hasPermission("hotel-portal.whatsapp-funnel.manage");
  const retomada = useResumeConversation(tenantId, clientId);
  const [assumirAberto, setAssumirAberto] = useState(false);
  const [motivoAssumir, setMotivoAssumir] = useState("");
  const pausa = usePauseConversation(tenantId, clientId);

  // debounce simples pra nao consultar a cada tecla
  useEffect(() => {
    const t = setTimeout(() => setBuscaAplicada(busca), 300);
    return () => clearTimeout(t);
  }, [busca]);

  const stageFilter = etiqueta !== "todas" && etiqueta !== "pausadas" ? etiqueta : undefined;
  const { data: conversations, isLoading } = useHotelConversations(clientId, {
    search: buscaAplicada || undefined,
    stage: stageFilter,
  });
  const { data: detail, isLoading: detailLoading } = useHotelConversationDetail(
    clientId,
    selecionado,
  );

  const visiveis = useMemo(() => {
    const lista = conversations ?? [];
    return etiqueta === "pausadas" ? lista.filter((c) => isWithHuman(c.statusBot)) : lista;
  }, [conversations, etiqueta]);

  const pausadas = (conversations ?? []).filter((c) => isWithHuman(c.statusBot)).length;
  const contato = detail?.contact;

  const etiquetas: { key: Etiqueta; label: string; tone?: string }[] = [
    { key: "todas", label: "Todas" },
    { key: "pausadas", label: `Aguardando humano${pausadas ? ` · ${pausadas}` : ""}`, tone: "bg-warning/20 text-warning-600" },
    ...FUNNEL_STAGES.map((s) => ({ key: s.stage as Etiqueta, label: s.label, tone: STAGE_TONES[s.stage] })),
  ];

  return (
    <div className="flex h-[680px] overflow-hidden rounded-3xl border border-border bg-background">
      {/* Lista (esconde no mobile quando ha conversa aberta) */}
      <aside
        className={`w-full flex-col border-r border-border bg-default-50 md:flex md:w-96 md:shrink-0 ${
          selecionado ? "hidden" : "flex"
        }`}
      >
        <div className="space-y-2 border-b border-border p-3">
          <div className="flex items-center gap-2 rounded-xl bg-default-100 px-3 py-2">
            <Search aria-hidden className="h-4 w-4 shrink-0 text-foreground/40" />
            <input
              aria-label="Buscar por nome ou número"
              className="w-full bg-transparent text-sm outline-none placeholder:text-foreground/40"
              placeholder="Buscar por nome ou número"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {etiquetas.map((e) => (
              <button
                key={e.key}
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  etiqueta === e.key
                    ? "bg-primary text-primary-foreground"
                    : (e.tone ?? "bg-default-100 text-foreground/70")
                }`}
                type="button"
                onClick={() => setEtiqueta(e.key)}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner color="primary" size="sm" />
            </div>
          ) : visiveis.length ? (
            visiveis.map((conv) => (
              <ContactRow
                key={conv.numeroContato}
                conv={conv}
                selected={conv.numeroContato === selecionado}
                onSelect={() => setSelecionado(conv.numeroContato)}
              />
            ))
          ) : (
            <div className="p-4">
              <PortalEmptyState
                title="Nenhuma conversa aqui"
                description={
                  etiqueta === "todas"
                    ? "Assim que o bot receber mensagens no WhatsApp, elas aparecem aqui."
                    : "Nenhum contato com esta etiqueta no momento."
                }
              />
            </div>
          )}
        </div>
      </aside>

      {/* Conversa (esconde no mobile quando nenhuma esta aberta) */}
      <section className={`min-w-0 flex-1 flex-col md:flex ${selecionado ? "flex" : "hidden"}`}>
        {!selecionado ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-foreground/50">
            <MessageSquareText aria-hidden className="h-10 w-10" />
            <p className="text-sm">Selecione uma conversa para ler o histórico.</p>
          </div>
        ) : detailLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner color="primary" size="lg" />
          </div>
        ) : contato ? (
          <>
            <header data-testid="conversa-cabecalho" className="flex flex-wrap items-center gap-3 border-b border-border bg-default-50 px-4 py-3">
              <Button
                isIconOnly
                aria-label="Voltar para a lista"
                className="md:hidden"
                size="sm"
                variant="light"
                onPress={() => setSelecionado(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
              >
                {contactInitials(contato.nome, contato.numeroContato)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{contato.nome ?? formatPhoneBR(contato.numeroContato)}</p>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-foreground/60">
                  <span>{formatPhoneBR(contato.numeroContato)}</span>
                  <span className={`rounded-full px-1.5 py-px text-[10px] font-medium ${STAGE_TONES[contato.currentStage]}`}>
                    {stageLabel(contato.currentStage)}
                  </span>
                  <span className={`rounded-full px-1.5 py-px text-[10px] font-medium ${botStatusTone(contato.statusBot)}`}>
                    {botStatusLabel(contato.statusBot)}
                  </span>
                </p>
                {contato.ocasiao || contato.hold ? (
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-foreground/70">
                    {contato.ocasiao ? (
                      <span className="rounded-full bg-secondary/20 px-1.5 py-px text-[10px] font-medium text-secondary-600">
                        {OCCASION_LABELS[contato.ocasiao] ?? contato.ocasiao}
                      </span>
                    ) : null}
                    {contato.hold ? (
                      <>
                        {contato.hold.acomodacao ? <span className="font-medium">{contato.hold.acomodacao}</span> : null}
                        {contato.hold.checkIn && contato.hold.checkOut ? (
                          <span>{diaMes(contato.hold.checkIn)} – {diaMes(contato.hold.checkOut)}</span>
                        ) : null}
                        {contato.hold.valor != null ? (
                          <span className="font-semibold text-foreground">{formatBRL(contato.hold.valor)}</span>
                        ) : null}
                        {contato.hold.status ? (
                          <span className="text-foreground/50">
                            {HOLD_STATUS_LABELS[contato.hold.status] ?? contato.hold.status}
                          </span>
                        ) : null}
                      </>
                    ) : null}
                  </p>
                ) : null}
              </div>
              {isWithHuman(contato.statusBot) && podeRetomar ? (
                <Button
                  color="primary"
                  size="sm"
                  onPress={() => {
                    setEstagioRetomada(contato.currentStage);
                    setRetomadaAberta(true);
                  }}
                >
                  <Play className="mr-1 h-3.5 w-3.5" /> Retomar conversa
                </Button>
              ) : null}
              {canTakeOver(contato.statusBot) && podeRetomar ? (
                <Button size="sm" variant="flat" onPress={() => { setMotivoAssumir(""); setAssumirAberto(true); }}>
                  <Hand className="mr-1 h-3.5 w-3.5" /> Assumir conversa
                </Button>
              ) : null}
              <a
                className="inline-flex shrink-0 items-center rounded-xl bg-default-100 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-default-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                href={contato.whatsappWebLink}
                rel="noreferrer"
                target="_blank"
              >
                Abrir no WhatsApp Web <ExternalLink aria-hidden className="ml-1 h-3.5 w-3.5" />
              </a>
            </header>
            <div className="flex-1 overflow-y-auto bg-default-100/30 p-4">
              <ConversationTranscript messages={detail?.messages ?? []} />
            </div>
            <footer className="border-t border-border bg-default-50 px-4 py-2.5 text-center text-xs text-foreground/50">
              Somente leitura — a equipe responde pelo WhatsApp Business da pousada.
            </footer>
          </>
        ) : (
          <div className="p-6">
            <PortalEmptyState title="Conversa não encontrada" description="Tente selecionar outra conversa da lista." />
          </div>
        )}
      </section>

      {assumirAberto && contato ? (
        <Modal isOpen onClose={() => setAssumirAberto(false)}>
          <ModalContent>
            <ModalHeader>Assumir conversa</ModalHeader>
            <ModalBody className="space-y-3">
              <p className="text-sm text-foreground/70">
                O bot para de responder {contato.nome ?? formatPhoneBR(contato.numeroContato)} e os
                lembretes automáticos são encerrados. A conversa continua pelo WhatsApp Business da
                pousada; depois, use "Retomar conversa" para devolver ao bot.
              </p>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Motivo (opcional)</span>
                <input
                  className="w-full rounded-xl border border-border bg-default-50 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  maxLength={255}
                  value={motivoAssumir}
                  onChange={(e) => setMotivoAssumir(e.target.value)}
                />
              </label>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={() => setAssumirAberto(false)}>
                Cancelar
              </Button>
              <Button
                color="primary"
                isLoading={pausa.isPending}
                onPress={async () => {
                  try {
                    const result = await pausa.mutateAsync({
                      numeroContato: contato.numeroContato,
                      motivo: motivoAssumir.trim() || undefined,
                    });
                    if (result.ok) toast.success("Conversa assumida — o bot parou de responder este contato.");
                    else toast("Pausa registrada. O bot não confirmou agora; o painel vai reenviar.", { icon: "⏳" });
                    setAssumirAberto(false);
                  } catch {
                    toast.error("Não foi possível assumir a conversa.");
                  }
                }}
              >
                Assumir
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      ) : null}

      {retomadaAberta && contato ? (
        <Modal isOpen onClose={() => setRetomadaAberta(false)}>
          <ModalContent>
            <ModalHeader>Retomar conversa</ModalHeader>
            <ModalBody className="space-y-3">
              <p className="text-sm text-foreground/70">
                O bot volta a responder {contato.nome ?? formatPhoneBR(contato.numeroContato)} no
                estágio escolhido. Fica registrado que você assumiu esta conversa.
              </p>
              <Select
                aria-label="Estágio de retomada"
                label="Retomar no estágio"
                selectedKeys={estagioRetomada ? [estagioRetomada] : []}
                onSelectionChange={(keys) => {
                  const [key] = [...keys];
                  if (key) setEstagioRetomada(key as FunnelStage);
                }}
              >
                {FUNNEL_STAGES.filter((s) => s.stage !== "PERDIDO").map((s) => (
                  <SelectItem key={s.stage}>{s.label}</SelectItem>
                ))}
              </Select>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={() => setRetomadaAberta(false)}>
                Cancelar
              </Button>
              <Button
                color="primary"
                isLoading={retomada.isPending}
                onPress={async () => {
                  try {
                    await retomada.mutateAsync({
                      numeroContato: contato.numeroContato,
                      estagio: estagioRetomada ?? undefined,
                    });
                    toast.success("Conversa retomada — o bot volta a responder este contato.");
                    setRetomadaAberta(false);
                  } catch {
                    toast.error("Não foi possível retomar a conversa.");
                  }
                }}
              >
                Retomar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      ) : null}
    </div>
  );
}
