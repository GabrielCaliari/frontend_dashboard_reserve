"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, MessageSquareText, PauseCircle, Search, ShieldAlert } from "lucide-react";
import { Button, Spinner } from "@heroui/react";
import {
  useHotelConversationDetail,
  useHotelConversations,
} from "@/src/shared/hooks/hotel-portal";
import { ConversationTranscript } from "@/src/presentation/components/organisms/hotel-portal/painel/attendance/conversation-transcript";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import {
  FUNNEL_STAGES,
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
          {conv.statusBot === "PAUSADO" ? (
            <PauseCircle aria-label="Pausado — aguardando humano" className="h-3.5 w-3.5 text-warning-600" />
          ) : null}
        </span>
      </span>
    </button>
  );
}

/**
 * Inbox estilo WhatsApp Web, SOMENTE LEITURA (Decisao 11 do plano mestre):
 * lista com etiquetas de estagio a esquerda, transcricao a direita; responder
 * acontece no Chatwoot via deep link. Mobile alterna lista <-> conversa.
 */
export function WhatsappInbox({ clientId }: { clientId: string }) {
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [etiqueta, setEtiqueta] = useState<Etiqueta>("todas");
  const [selecionado, setSelecionado] = useState<string | null>(null);

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
    return etiqueta === "pausadas" ? lista.filter((c) => c.statusBot === "PAUSADO") : lista;
  }, [conversations, etiqueta]);

  const pausadas = (conversations ?? []).filter((c) => c.statusBot === "PAUSADO").length;
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
            <header className="flex items-center gap-3 border-b border-border bg-default-50 px-4 py-3">
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
                  {contato.statusBot === "PAUSADO" ? (
                    <span className="rounded-full bg-warning/20 px-1.5 py-px text-[10px] font-medium text-warning-600">
                      Pausado — aguardando humano
                    </span>
                  ) : null}
                  {!contato.consentimentoLgpd ? (
                    <span className="flex items-center gap-1 text-foreground/50">
                      <ShieldAlert aria-hidden className="h-3 w-3" /> LGPD não confirmado
                    </span>
                  ) : null}
                </p>
              </div>
              {contato.chatwootDeepLink ? (
                <Button
                  as={Link}
                  href={contato.chatwootDeepLink}
                  rel="noreferrer"
                  size="sm"
                  target="_blank"
                  variant="flat"
                >
                  Responder no Chatwoot <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </Button>
              ) : null}
            </header>
            <div className="flex-1 overflow-y-auto bg-default-100/30 p-4">
              <ConversationTranscript messages={detail?.messages ?? []} />
            </div>
            <footer className="border-t border-border bg-default-50 px-4 py-2.5 text-center text-xs text-foreground/50">
              Somente leitura — a resposta acontece no Chatwoot, a fonte única do atendimento.
            </footer>
          </>
        ) : (
          <div className="p-6">
            <PortalEmptyState title="Conversa não encontrada" description="Tente selecionar outra conversa da lista." />
          </div>
        )}
      </section>
    </div>
  );
}
