"use client";

import { useState } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { BedDouble, CalendarRange, MoreVertical } from "lucide-react";
import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import {
  AUDIENCE_LABELS,
  AUDIENCE_TONES,
  FUNNEL_STAGES,
  STAGE_ACCENTS,
  contactInitials,
  stageLabel,
} from "@/src/presentation/components/organisms/hotel-portal/funil/funnel-stages";
import {
  MoveStageModal,
  type PendingMove,
} from "@/src/presentation/components/organisms/hotel-portal/funil/move-stage-modal";
import type {
  FunnelBoardColumn,
  FunnelBoardLead,
  FunnelStage,
  FunnelStageChangeDto,
} from "@/src/shared/domain/types/@hotel-painel";

/**
 * Estagios que exigem contexto extra antes de confirmar o movimento: PERDIDO
 * pede motivo, PUBLICO_IDENTIFICADO oferece subtipo (opcional, com "Pular").
 * Os demais movem direto sem modal.
 */
const ESTAGIOS_COM_MODAL: FunnelStage[] = ["PERDIDO", "PUBLICO_IDENTIFICADO"];

/**
 * A fronteira Reserve/hotel cai depois de QUALIFICADO: dali pra frente quem
 * converte e o atendimento do hotel (§1.4).
 */
const FRONTEIRA_AFTER: FunnelStage = "QUALIFICADO";

function dragId(stage: FunnelStage, numeroContato: string) {
  return `${stage}|${numeroContato}`;
}

export function resolveDrop(
  event: DragEndEvent,
): { numeroContato: string; deEstagio: FunnelStage; paraEstagio: FunnelStage } | null {
  const activeId = event.active?.id;
  const overId = event.over?.id;
  if (typeof activeId !== "string" || typeof overId !== "string") return null;
  const sep = activeId.indexOf("|");
  if (sep < 0) return null;
  const deEstagio = activeId.slice(0, sep) as FunnelStage;
  const numeroContato = activeId.slice(sep + 1);
  const paraEstagio = overId as FunnelStage;
  if (deEstagio === paraEstagio) return null;
  return { numeroContato, deEstagio, paraEstagio };
}

interface FunnelBoardProps {
  columns: FunnelBoardColumn[];
  canManage: boolean;
  onMove: (numeroContato: string, dto: FunnelStageChangeDto) => Promise<void>;
}

export function FunnelBoard({ columns, canManage, onMove }: FunnelBoardProps) {
  const [pending, setPending] = useState<PendingMove | null>(null);

  function requestMove(lead: FunnelBoardLead, _deEstagio: FunnelStage, paraEstagio: FunnelStage) {
    if (ESTAGIOS_COM_MODAL.includes(paraEstagio)) {
      setPending({ numeroContato: lead.numeroContato, nome: lead.nome, paraEstagio });
      return;
    }
    void onMove(lead.numeroContato, { para_estagio: paraEstagio });
  }

  function handleDragEnd(event: DragEndEvent) {
    const drop = resolveDrop(event);
    if (!drop) return;
    const column = columns.find((c) => c.stage === drop.deEstagio);
    const lead = column?.leads.find((l) => l.numeroContato === drop.numeroContato);
    if (!lead) return;
    requestMove(lead, drop.deEstagio, drop.paraEstagio);
  }

  const board = (
    // Desktop: colunas de largura fixa com scroll horizontal — 9 estagios
    // espremidos em flex-1 viravam tiras ilegiveis.
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:overflow-x-auto md:pb-3">
      {columns.map((column) => (
        <FunnelColumnView
          key={column.stage}
          column={column}
          canManage={canManage}
          onRequestMove={requestMove}
        />
      ))}
    </div>
  );

  return (
    <>
      {canManage ? (
        <DndContext onDragEnd={handleDragEnd}>{board}</DndContext>
      ) : (
        board
      )}
      {pending && (
        <MoveStageModal
          pending={pending}
          onConfirm={(dto) => onMove(pending.numeroContato, dto)}
          onClose={() => setPending(null)}
        />
      )}
    </>
  );
}

interface FunnelColumnViewProps {
  column: FunnelBoardColumn;
  canManage: boolean;
  onRequestMove: (lead: FunnelBoardLead, deEstagio: FunnelStage, paraEstagio: FunnelStage) => void;
}

function FunnelColumnView({ column, canManage, onRequestMove }: FunnelColumnViewProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.stage });

  return (
    <div
      ref={canManage ? setNodeRef : undefined}
      className={`flex flex-col gap-2 rounded-3xl md:w-72 md:flex-none ${
        canManage && isOver ? "ring-1 ring-primary/40" : ""
      }`}
    >
      <div
        data-testid="coluna-header"
        className="flex items-center gap-2 rounded-2xl border border-border bg-default-50 px-3 py-2.5"
      >
        <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${STAGE_ACCENTS[column.stage]}`} />
        {/* Rotulo e contagem num unico no de texto: se o rotulo ficar sozinho
            num no de texto (mesmo com um <span> vizinho) ele bate igual ao
            item "mover para X" do menu do card e o teste acha 2 matches. */}
        <p className="truncate text-sm font-semibold text-foreground">{`${stageLabel(column.stage)} · ${column.count}`}</p>
      </div>

      <div className="min-h-12 space-y-1.5 rounded-2xl bg-default-100/40 p-1.5">
        {column.leads.map((lead) => (
          <FunnelLeadCard
            key={lead.numeroContato}
            lead={lead}
            column={column}
            canManage={canManage}
            onRequestMove={onRequestMove}
          />
        ))}
        {column.leads.length === 0 && (
          <p className="px-2 py-3 text-center text-xs text-foreground/40">Sem conversas aqui</p>
        )}
        {column.count > column.leads.length && (
          <p className="px-1 text-xs text-muted-foreground">
            +{column.count - column.leads.length} não exibido
            {column.count - column.leads.length === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {column.stage === FRONTEIRA_AFTER && (
        <p
          data-testid="fronteira-line"
          className="mt-1 border-t-2 border-dashed border-amber-500 pt-1 text-xs font-medium text-amber-600 md:border-t-0"
        >
          fronteira Reserve / hotel
        </p>
      )}
    </div>
  );
}

interface FunnelLeadCardProps {
  lead: FunnelBoardLead;
  column: FunnelBoardColumn;
  canManage: boolean;
  onRequestMove: (lead: FunnelBoardLead, deEstagio: FunnelStage, paraEstagio: FunnelStage) => void;
}

function FunnelLeadCard({ lead, column, canManage, onRequestMove }: FunnelLeadCardProps) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: dragId(column.stage, lead.numeroContato),
  });

  const destinos = FUNNEL_STAGES.filter((s) => s.stage !== column.stage);

  return (
    <Card
      ref={canManage ? setNodeRef : undefined}
      {...(canManage ? attributes : {})}
      {...(canManage ? listeners : {})}
      className={`flex items-start justify-between gap-2 rounded-2xl bg-background p-3 text-sm transition-colors hover:border-primary/40 ${
        canManage ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
        >
          {contactInitials(lead.nome, lead.numeroContato)}
        </span>
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-semibold">{lead.nome ?? lead.numeroContato}</p>
          {lead.acomodacaoInteresse && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <BedDouble aria-hidden className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.acomodacaoInteresse}</span>
            </p>
          )}
          {/* datas_interesse e Json do bot: cache antigo pode trazer objeto em vez de string */}
          {typeof lead.datasInteresse === "string" && lead.datasInteresse && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarRange aria-hidden className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.datasInteresse}</span>
            </p>
          )}
          {lead.tipoPublico != null && (
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                AUDIENCE_TONES[lead.tipoPublico] ?? "bg-default-100 text-foreground/70"
              }`}
            >
              {AUDIENCE_LABELS[lead.tipoPublico]}
            </span>
          )}
        </div>
      </div>

      {canManage && (
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              aria-label={`Mover ${lead.nome ?? lead.numeroContato}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label={`Mover ${lead.nome ?? lead.numeroContato}`}>
            {destinos.map((destino) => (
              <DropdownItem
                key={destino.stage}
                onPress={() => onRequestMove(lead, column.stage, destino.stage)}
              >
                {destino.label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      )}
    </Card>
  );
}
