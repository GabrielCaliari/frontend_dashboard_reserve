"use client";

import { FUNNEL_STAGES, stageLabel } from "@/src/presentation/components/organisms/hotel-portal/funil/funnel-stages";
import type { FunnelStage } from "@/src/shared/domain/types/@hotel-painel";

/** Etapas da jornada na ordem do funil; "Perdido" nao e etapa, e desfecho. */
const JORNADA: FunnelStage[] = FUNNEL_STAGES.map((s) => s.stage).filter((s) => s !== "PERDIDO");

/**
 * Regua da jornada do hospede: onde esta conversa esta no caminho do primeiro
 * "oi" ate a reserva confirmada. As etapas sao uma sequencia real do funil do
 * bot, por isso a regua numera ("etapa 5 de 8"). Conversa perdida mostra ate
 * onde chegou, apagada, com o desfecho no fim.
 */
export function JourneyRail({ stage, reachedStage }: { stage: FunnelStage; reachedStage?: FunnelStage | null }) {
  const perdido = stage === "PERDIDO";
  // Perdido: a regua mostra a ultima etapa alcancada, se o backend souber.
  const ref = perdido ? reachedStage ?? null : stage;
  const atual = ref ? JORNADA.indexOf(ref) : -1;
  const confirmada = stage === "RESERVA_CONFIRMADA";

  return (
    <div className="flex items-center gap-3" data-testid="jornada">
      <ol
        aria-label="Jornada do hóspede"
        className="flex flex-1 items-center gap-1"
      >
        {JORNADA.map((etapa, i) => {
          const feita = i < atual || (i === atual && confirmada);
          const corrente = i === atual && !confirmada;
          return (
            <li
              key={etapa}
              aria-current={corrente ? "step" : undefined}
              className="flex flex-1 items-center"
              title={stageLabel(etapa)}
            >
              <span className="sr-only">
                {stageLabel(etapa)}
                {corrente ? " (etapa atual)" : feita ? " (concluída)" : ""}
              </span>
              <span
                aria-hidden
                className={`h-1.5 w-full rounded-full transition-colors ${
                  perdido
                    ? i <= atual
                      ? "bg-foreground/25"
                      : "bg-foreground/10"
                    : feita
                      ? "bg-primary"
                      : corrente
                        ? "bg-primary/60 ring-2 ring-primary/25"
                        : "bg-foreground/10"
                }`}
              />
            </li>
          );
        })}
      </ol>
      <p className="shrink-0 text-xs text-foreground/60">
        {perdido ? (
          <span className="font-medium text-danger">Perdido</span>
        ) : confirmada ? (
          <span className="font-medium text-success-600">Reserva confirmada</span>
        ) : atual >= 0 ? (
          <>
            <span className="font-medium text-foreground">{stageLabel(stage)}</span>
            <span className="ml-1.5 tabular-nums">
              etapa {atual + 1} de {JORNADA.length}
            </span>
          </>
        ) : null}
      </p>
    </div>
  );
}
