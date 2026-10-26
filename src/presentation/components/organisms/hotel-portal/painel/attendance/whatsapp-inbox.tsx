"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { notifyBotAction } from "@/src/shared/utils/bot-action-feedback";
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
  flattenConversationPages,
  useHotelConversations,
  usePauseConversation,
  useResumeConversation,
} from "@/src/shared/hooks/hotel-portal";
import { ConversationTranscript, originLabel } from "@/src/presentation/components/organisms/hotel-portal/painel/attendance/conversation-transcript";
import { JourneyRail } from "@/src/presentation/components/organisms/hotel-portal/painel/attendance/journey-rail";
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
  AUDIENCE_LABELS,
  FUNNEL_STAGES,
  formatBRL,
  STAGE_TONES,
  contactInitials,
  stageLabel,
} from "@/src/presentation/components/organisms/hotel-portal/funil/funnel-stages";
import type {
  BotContactAudience,
  ConversationListItem,
  FunnelStage,
} from "@/src/shared/domain/types/@hotel-painel";

/** Atalho ativo: todas, pausadas (aguardando humano) ou ao vivo. A etapa do funil e um filtro a parte. */
type Etiqueta = "todas" | "pausadas" | "aovivo";

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

/** Conversa com mensagem nos ultimos 10 minutos: esta acontecendo agora. */
const AO_VIVO_MS = 10 * 60 * 1000;

function isAoVivo(iso: string | null, now = Date.now()): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && now - t <= AO_VIVO_MS;
}

/** Cor do anel do avatar pelo momento do funil: neutro, negociando, ganho, perdido. */
function stageRing(stage: FunnelStage): string {
  if (stage === "RESERVA_CONFIRMADA" || stage === "COMPROVANTE_RECEBIDO") return "ring-success/60";
  if (stage === "PERDIDO") return "ring-danger/50";
  if (stage === "CONTATO_INICIADO" || stage === "PUBLICO_IDENTIFICADO") return "ring-foreground/15";
  return "ring-primary/55";
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
  const comHumano = isWithHuman(conv.statusBot);
  const aoVivo = isAoVivo(conv.lastMessageAt);
  return (
    <button
      aria-current={selected ? "true" : undefined}
      className={`group relative flex w-full items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
        selected ? "bg-primary/[0.09]" : "hover:bg-default-100/70"
      }`}
      type="button"
      onClick={onSelect}
    >
      {/* Faixa a esquerda: selecionada em salvia; esperando humano em ambar. */}
      <span
        aria-hidden
        className={`absolute inset-y-2 left-0 w-[3px] rounded-r-full ${
          selected ? "bg-primary" : comHumano ? "bg-warning" : "bg-transparent"
        }`}
      />
      <span className="relative shrink-0">
        <span
          aria-hidden
          className={`flex h-11 w-11 items-center justify-center rounded-full bg-default-100 font-display text-[15px] font-semibold text-foreground/80 ring-2 ring-offset-2 ring-offset-default-50 ${stageRing(conv.currentStage)}`}
        >
          {contactInitials(conv.nome, conv.numeroContato)}
        </span>
        {aoVivo ? (
          // Ponto fixo, sem pulso: com varias conversas ao vivo, dez pontos
          // pulsando competem com a leitura.
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-default-50 bg-success"
            title="Conversa acontecendo agora"
          />
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[14px] font-semibold text-foreground">
            {conv.nome ?? formatPhoneBR(conv.numeroContato)}
          </span>
          <span
            className={`shrink-0 text-[11px] tabular-nums ${aoVivo ? "font-semibold text-success-600" : "text-foreground/45"}`}
          >
            {aoVivo ? "agora" : formatWhen(conv.lastMessageAt)}
          </span>
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-[11.5px] text-foreground/60">
          <span className={`rounded-md px-1.5 py-px text-[10.5px] font-medium ${STAGE_TONES[conv.currentStage]}`}>
            {stageLabel(conv.currentStage)}
          </span>
          {originLabel(conv.origem) ? <span className="truncate">{originLabel(conv.origem)}</span> : null}
          <span className="ml-auto shrink-0">
            {comHumano ? (
              <UserRound aria-label="Com humano" className="h-3.5 w-3.5 text-warning-600" />
            ) : (
              <Bot aria-label="Com o bot" className="h-3.5 w-3.5 text-primary/70" />
            )}
          </span>
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
export function WhatsappInbox({
  clientId,
  initialContato = null,
}: {
  clientId: string;
  /** Contato a abrir ao entrar (link vindo do funil, dos erros ou dos feedbacks). */
  initialContato?: string | null;
}) {
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [etiqueta, setEtiqueta] = useState<Etiqueta>("todas");
  const [publico, setPublico] = useState<BotContactAudience | "">("");
  const [estagio, setEstagio] = useState<FunnelStage | "">("");
  const [selecionado, setSelecionado] = useState<string | null>(initialContato);
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

  const { data: conversations, isLoading } = useHotelConversations(clientId, {
    search: buscaAplicada || undefined,
    stage: estagio || undefined,
    audience: publico || undefined,
  });
  const {
    data: detailPages,
    isLoading: detailLoading,
    fetchNextPage,
    isFetchingNextPage,
  } = useHotelConversationDetail(
    clientId,
    selecionado,
  );

  const visiveis = useMemo(() => {
    const lista = conversations ?? [];
    if (etiqueta === "pausadas") return lista.filter((c) => isWithHuman(c.statusBot));
    if (etiqueta === "aovivo") return lista.filter((c) => isAoVivo(c.lastMessageAt));
    return lista;
  }, [conversations, etiqueta]);

  const pausadas = (conversations ?? []).filter((c) => isWithHuman(c.statusBot)).length;
  const aoVivo = (conversations ?? []).filter((c) => isAoVivo(c.lastMessageAt)).length;
  const detail = flattenConversationPages(detailPages);
  const contato = detail.contact;

  const etiquetas: { key: Etiqueta; label: string; count?: number; tone: string }[] = [
    { key: "todas", label: "Todas", tone: "bg-foreground text-background" },
    { key: "pausadas", label: "Aguardando humano", count: pausadas, tone: "bg-warning text-warning-foreground" },
    { key: "aovivo", label: "Ao vivo", count: aoVivo, tone: "bg-success text-success-foreground" },
  ];

  const selectClass =
    "min-w-0 flex-1 appearance-none rounded-lg border border-border/70 bg-background bg-[length:12px] bg-[right_0.6rem_center] bg-no-repeat px-2.5 py-1.5 pr-7 text-[12.5px] text-foreground/80 outline-none transition-colors hover:border-border focus-visible:ring-2 focus-visible:ring-primary";
  const chevron = {
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23889' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
  };

  return (
    <div className="flex h-[calc(100dvh-220px)] min-h-[580px] overflow-hidden rounded-2xl border border-border bg-background">
      {/* Lista (esconde no mobile quando ha conversa aberta) */}
      <aside
        className={`w-full flex-col border-r border-border bg-default-50 md:flex md:w-[360px] md:shrink-0 ${
          selecionado ? "hidden" : "flex"
        }`}
      >
        <div className="space-y-2.5 border-b border-border px-4 pb-3 pt-4">
          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-primary">
            <Search aria-hidden className="h-4 w-4 shrink-0 text-foreground/40" />
            <input
              aria-label="Buscar por nome ou número"
              className="w-full bg-transparent text-sm outline-none placeholder:text-foreground/40"
              placeholder="Buscar por nome ou número"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              aria-label="Filtrar por público"
              className={selectClass}
              style={chevron}
              value={publico}
              onChange={(e) => setPublico(e.target.value as BotContactAudience | "")}
            >
              <option value="">Todos os públicos</option>
              {(Object.entries(AUDIENCE_LABELS) as [BotContactAudience, string][]).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar por etapa"
              className={selectClass}
              style={chevron}
              value={estagio}
              onChange={(e) => setEstagio(e.target.value as FunnelStage | "")}
            >
              <option value="">Todas as etapas</option>
              {FUNNEL_STAGES.map((s) => (
                <option key={s.stage} value={s.stage}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Atalhos">
            {etiquetas.map((e) => {
              const ativo = etiqueta === e.key;
              return (
                <button
                  key={e.key}
                  aria-pressed={ativo}
                  className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    ativo ? e.tone : "bg-default-100 text-foreground/70 hover:bg-default-200"
                  }`}
                  type="button"
                  onClick={() => setEtiqueta(e.key)}
                >
                  {e.label}
                  {e.count ? <span className="tabular-nums opacity-80">· {e.count}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
        <p className="border-b border-border/60 px-4 py-1.5 text-[11px] text-foreground/45 tabular-nums">
          {visiveis.length} {visiveis.length === 1 ? "conversa" : "conversas"}
        </p>
        <div className="flex-1 divide-y divide-border/50 overflow-y-auto">
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
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <MessageSquareText aria-hidden className="h-7 w-7 text-primary" />
            </span>
            <p className="font-display text-lg font-semibold text-foreground">Selecione uma conversa para ler o histórico.</p>
            <p className="max-w-sm text-sm text-foreground/55">
              As conversas com ponto verde estão acontecendo agora. As marcadas em âmbar esperam alguém da equipe.
            </p>
          </div>
        ) : detailLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner color="primary" size="lg" />
          </div>
        ) : contato ? (
          <>
            <header data-testid="conversa-cabecalho" className="space-y-3 border-b border-border bg-default-50 px-5 pb-3.5 pt-4">
              <div className="flex flex-wrap items-center gap-3">
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
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-default-100 font-display text-[15px] font-semibold text-foreground/80 ring-2 ring-offset-2 ring-offset-default-50 ${stageRing(contato.currentStage)}`}
                >
                  {contactInitials(contato.nome, contato.numeroContato)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-semibold leading-tight text-foreground">
                    {contato.nome ?? formatPhoneBR(contato.numeroContato)}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-foreground/60">
                    <span className="tabular-nums">{formatPhoneBR(contato.numeroContato)}</span>
                    <span className={`rounded-md px-1.5 py-px text-[10.5px] font-medium ${botStatusTone(contato.statusBot)}`}>
                      {botStatusLabel(contato.statusBot)}
                    </span>
                    {originLabel(contato.origem) ? (
                      <span data-testid="conversa-origem" className="text-foreground/70">
                        {originLabel(contato.origem)}
                        {contato.origem === "anuncio" && contato.sourceId ? (
                          <span className="ml-1 tabular-nums text-foreground/40">{contato.sourceId}</span>
                        ) : null}
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#25D366]/15 px-3 py-1.5 text-xs font-semibold text-[#0f7a3a] transition-colors hover:bg-[#25D366]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-[#5fe397]"
                    href={contato.whatsappWebLink}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Abrir no WhatsApp Web <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              <JourneyRail stage={contato.currentStage} />

              {contato.ocasiao || contato.hold ? (
                <dl className="flex flex-wrap gap-x-6 gap-y-1.5 rounded-xl border border-border/60 bg-background/60 px-3.5 py-2.5 text-xs">
                  {contato.ocasiao ? (
                    <div>
                      <dt className="text-foreground/45">Ocasião</dt>
                      <dd className="font-medium text-foreground">{OCCASION_LABELS[contato.ocasiao] ?? contato.ocasiao}</dd>
                    </div>
                  ) : null}
                  {contato.hold?.acomodacao ? (
                    <div>
                      <dt className="text-foreground/45">Acomodação</dt>
                      <dd className="font-medium text-foreground">{contato.hold.acomodacao}</dd>
                    </div>
                  ) : null}
                  {contato.hold?.checkIn && contato.hold.checkOut ? (
                    <div>
                      <dt className="text-foreground/45">Estadia</dt>
                      <dd className="font-medium tabular-nums text-foreground">
                        {diaMes(contato.hold.checkIn)} – {diaMes(contato.hold.checkOut)}
                      </dd>
                    </div>
                  ) : null}
                  {contato.hold?.valor != null ? (
                    <div>
                      <dt className="text-foreground/45">Valor</dt>
                      <dd className="font-display text-sm font-semibold tabular-nums text-foreground">
                        {formatBRL(contato.hold.valor)}
                      </dd>
                    </div>
                  ) : null}
                  {contato.hold?.status ? (
                    <div>
                      <dt className="text-foreground/45">Pré-reserva</dt>
                      <dd className="font-medium text-foreground">
                        {HOLD_STATUS_LABELS[contato.hold.status] ?? contato.hold.status}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
            </header>
            <div
              className="flex-1 overflow-y-auto bg-default-100/40 px-4 py-5 sm:px-8"
              // Trama de pontos discreta, como o fundo de conversa do WhatsApp:
              // separa a area de leitura do resto da tela sem competir com as bolhas.
              style={{
                backgroundImage: "radial-gradient(hsl(var(--foreground) / 0.06) 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            >
              <ConversationTranscript
                key={selecionado}
                messages={detail.messages}
                hasMore={detail.hasMore}
                isLoadingMore={isFetchingNextPage}
                onLoadMore={() => fetchNextPage()}
              />
            </div>
            <footer className="flex items-center justify-center gap-2 border-t border-border bg-default-50 px-4 py-2.5 text-xs text-foreground/50">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-foreground/30" />
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
                    notifyBotAction(result, "Conversa assumida — o bot parou de responder este contato.");
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
                    const result = await retomada.mutateAsync({
                      numeroContato: contato.numeroContato,
                      estagio: estagioRetomada ?? undefined,
                    });
                    notifyBotAction(result, "Conversa retomada — o bot volta a responder este contato.");
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
