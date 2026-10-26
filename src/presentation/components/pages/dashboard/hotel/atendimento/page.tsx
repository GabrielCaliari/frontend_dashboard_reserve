"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Link2,
  MessageCircle,
  Star,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";
import {
  useActiveHotelClient,
  useBotIssuesSummary,
  useFeedbacksSummary,
  useHotelBotChannels,
  useHotelConversations,
  useHotelFunnelMetrics,
  useHotelRoi,
} from "@/src/shared/hooks/hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { MetricCard } from "@/src/presentation/components/organisms/hotel-portal/ui";
import { BotChannelCards } from "@/src/presentation/components/organisms/hotel-portal/painel/attendance/channel-status-card";
import { PortalTableSkeleton } from "@/src/presentation/components/organisms/hotel-portal/painel/skeletons";
import { currentMonth, lastDays } from "@/src/presentation/components/organisms/hotel-portal/painel/date-range-filter";
import { CONVERSAS_PATH } from "@/src/presentation/components/organisms/hotel-portal/painel/conversation-link";
import { isWithHuman } from "@/src/presentation/components/organisms/hotel-portal/funil/bot-status";
import { FUNNEL_STAGES, STAGE_ACCENTS } from "@/src/presentation/components/organisms/hotel-portal/funil/funnel-stages";
import { formatMoney, formatNumber, formatPercent } from "@/src/shared/utils/hotel-format";
import type { FunnelStage } from "@/src/shared/domain/types/@hotel-painel";

/** Secao com titulo e atalho "ver tudo" para a tela completa. */
function Bloco({
  title,
  href,
  linkLabel,
  icon: Icon,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-border/80 bg-default-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.01em] text-foreground">
          <Icon aria-hidden className="h-4 w-4 text-primary" />
          {title}
        </h2>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {linkLabel}
          <ArrowRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
      </div>
      {children}
    </section>
  );
}

/**
 * Visao geral do Atendimento: tudo o que o bot esta produzindo neste mes, num
 * cantinho de cada tela (conversas, funil, retorno, erros, feedbacks, links),
 * com o atalho para a tela completa. E a porta de entrada do grupo.
 */
export default function HotelAtendimentoPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const clientId = client?.id ?? null;

  const month = useMemo(currentMonth, []);
  const week = useMemo(() => lastDays(7), []);

  const { data: channels } = useHotelBotChannels(clientId);
  const { data: metrics } = useHotelFunnelMetrics(clientId, month);
  const { data: roi } = useHotelRoi(clientId, month);
  const { data: issues } = useBotIssuesSummary(clientId, week);
  const { data: feedbacks } = useFeedbacksSummary(clientId, week);
  const { data: conversas } = useHotelConversations(clientId, {});

  const aguardandoHumano = (conversas ?? []).filter((c) => isWithHuman(c.statusBot));
  const totalFunil = (metrics?.distribuicaoFunil ?? []).reduce((s, d) => s + d.count, 0);
  const countOf = (stage: FunnelStage) =>
    metrics?.distribuicaoFunil.find((d) => d.stage === stage)?.count ?? 0;
  const reservas = countOf("RESERVA_CONFIRMADA");

  return (
    <PainelPageShell
      title="Atendimento"
      description="O que o bot está fazendo pela pousada neste mês, em um lugar só. Cada bloco leva à tela completa."
      isLoading={clientLoading}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Conversas iniciadas no mês"
          value={metrics ? formatNumber(metrics.conversasIniciadas.value) : "—"}
          source={metrics?.conversasIniciadas.source}
        />
        <MetricCard
          label="Taxa de qualificação"
          value={metrics ? formatPercent(metrics.taxaQualificacao * 100) : "—"}
        />
        <MetricCard
          label="Reservas confirmadas pelo bot"
          value={metrics ? formatNumber(reservas) : "—"}
          hint={totalFunil ? `${formatPercent((reservas / totalFunil) * 100)} das conversas` : undefined}
        />
        <MetricCard
          label="Receita atribuída ao bot"
          value={roi?.nivel3 ? formatMoney(roi.nivel3.revenueAttributed.value) : "—"}
          hint={roi?.nivel3 ? `ROAS ${roi.nivel3.roas.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}` : "Aparece com o bot ativo"}
          accent
        />
      </div>

      <PainelSection title="Canais e origem">
        {channels ? (
          <BotChannelCards channels={channels} volumePorOrigem={metrics?.volumePorOrigem} />
        ) : (
          <PortalTableSkeleton rows={1} />
        )}
      </PainelSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <Bloco title="Aguardando a equipe" href={CONVERSAS_PATH} linkLabel="Abrir conversas" icon={UserRound}>
          {aguardandoHumano.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma conversa esperando alguém da equipe. O bot está dando conta.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {aguardandoHumano.slice(0, 5).map((c) => (
                <li key={c.numeroContato} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link
                    href={`${CONVERSAS_PATH}?contato=${encodeURIComponent(c.numeroContato)}`}
                    className="truncate font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {c.nome ?? c.numeroContato}
                  </Link>
                  <span className="shrink-0 rounded-md bg-warning/15 px-1.5 py-px text-[11px] font-medium text-warning-600">
                    aguardando humano
                  </span>
                </li>
              ))}
              {aguardandoHumano.length > 5 && (
                <li className="pt-2 text-xs text-muted-foreground">
                  e mais {aguardandoHumano.length - 5}
                </li>
              )}
            </ul>
          )}
        </Bloco>

        <Bloco title="Funil do bot" href="/dashboard/hotel/funil" linkLabel="Abrir o funil" icon={Target}>
          {!metrics ? (
            <PortalTableSkeleton rows={3} />
          ) : totalFunil === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conversa no funil ainda.</p>
          ) : (
            <ol className="space-y-1.5">
              {FUNNEL_STAGES.map((s) => {
                const n = countOf(s.stage);
                return (
                  <li key={s.stage} className="flex items-center gap-2 text-xs">
                    <span className="w-40 shrink-0 truncate text-foreground/70">{s.label}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-default-100">
                      <span
                        className={`block h-full rounded-full ${STAGE_ACCENTS[s.stage]}`}
                        style={{ width: `${(n / totalFunil) * 100}%` }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right font-medium tabular-nums text-foreground">{n}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </Bloco>

        <Bloco title="Erros do bot" href="/dashboard/hotel/atendimento/erros" linkLabel="Ver ocorrências" icon={AlertTriangle}>
          {!issues ? (
            <PortalTableSkeleton rows={2} />
          ) : issues.total === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum erro nos últimos 7 dias.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-display text-2xl font-semibold tabular-nums text-foreground">{issues.total}</span>
                <span className="ml-1.5 text-muted-foreground">nos últimos 7 dias</span>
              </p>
              <ul className="space-y-1 text-sm">
                {issues.porCodigo.slice(0, 3).map((c) => (
                  <li key={c.codigo} className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-xs text-foreground/80">{c.codigo}</span>
                    <span className="tabular-nums text-muted-foreground">{c.quantidade}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Bloco>

        <Bloco title="Feedbacks dos hóspedes" href="/dashboard/hotel/atendimento/feedbacks" linkLabel="Ver feedbacks" icon={Star}>
          {!feedbacks ? (
            <PortalTableSkeleton rows={2} />
          ) : feedbacks.total === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum feedback nos últimos 7 dias.</p>
          ) : (
            <div className="space-y-2">
              <p className="flex items-baseline gap-3 text-sm">
                <span>
                  <span className="font-display text-2xl font-semibold tabular-nums text-foreground">
                    {feedbacks.notaMedia === null
                      ? "—"
                      : feedbacks.notaMedia.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                  </span>
                  <span className="ml-1.5 text-muted-foreground">nota média</span>
                </span>
                <span className="text-muted-foreground">
                  <span className="font-medium text-success-600">{feedbacks.porSentimento.positivo} positivos</span>
                  {" · "}
                  <span className="font-medium text-danger">{feedbacks.porSentimento.negativo} negativos</span>
                </span>
              </p>
              {feedbacks.melhores[0] && (
                <p className="text-sm text-foreground/80">
                  “{feedbacks.melhores[0].texto ?? feedbacks.melhores[0].resumo}”
                </p>
              )}
            </div>
          )}
        </Bloco>

        <Bloco title="Retorno do bot" href="/dashboard/hotel/retorno" linkLabel="Ver retorno" icon={TrendingUp}>
          {!roi ? (
            <PortalTableSkeleton rows={2} />
          ) : (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Investimento em anúncios</dt>
                <dd className="font-medium tabular-nums">{formatMoney(roi.nivel1.spend.value)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Custo por conversa</dt>
                <dd className="font-medium tabular-nums">{formatMoney(roi.nivel1.costPerConversation.value)}</dd>
              </div>
              {roi.nivel2 && (
                <div>
                  <dt className="text-xs text-muted-foreground">Custo por lead qualificado</dt>
                  <dd className="font-medium tabular-nums">{formatMoney(roi.nivel2.costPerQualifiedLead)}</dd>
                </div>
              )}
              {roi.nivel3 && (
                <div>
                  <dt className="text-xs text-muted-foreground">Ticket médio</dt>
                  <dd className="font-medium tabular-nums">{formatMoney(roi.nivel3.avgTicket.value)}</dd>
                </div>
              )}
            </dl>
          )}
        </Bloco>

        <Bloco title="Links rastreáveis" href="/dashboard/hotel/whatsapp-links" linkLabel="Gerenciar links" icon={Link2}>
          <p className="text-sm text-muted-foreground">
            Links de WhatsApp com origem marcada (bio do Instagram, site, Google). Cada clique vira
            uma conversa com a origem certa no funil.
          </p>
        </Bloco>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <MessageCircle aria-hidden className="h-3.5 w-3.5" />
        Para responder um hóspede, abra a conversa e use o botão do WhatsApp Web.
      </p>
    </PainelPageShell>
  );
}
