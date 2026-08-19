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
import { MoreVertical } from "lucide-react";
import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import {
  AUDIENCE_LABELS,
  FUNNEL_STAGES,
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
    <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
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
      className={`flex flex-1 flex-col gap-2 rounded-3xl ${
        canManage && isOver ? "ring-1 ring-primary/40" : ""
      }`}
    >
      <Card data-testid="coluna-header" className="space-y-1 p-4">
        {/* Rotulo e contagem num unico no de texto: se o rotulo ficar sozinho
            num no de texto (mesmo com um <span> vizinho) ele bate igual ao
            item "mover para X" do menu do card e o teste acha 2 matches. */}
        <p className="text-sm text-muted-foreground">{`${stageLabel(column.stage)} · ${column.count}`}</p>
      </Card>

      <div className="space-y-1.5">
        {column.leads.map((lead) => (
          <FunnelLeadCard
            key={lead.numeroContato}
            lead={lead}
            column={column}
            canManage={canManage}
            onRequestMove={onRequestMove}
          />
        ))}
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
      className="flex items-start justify-between gap-2 p-3 text-sm"
    >
      <div>
        <p className="font-medium">{lead.nome ?? lead.numeroContato}</p>
        {lead.acomodacaoInteresse && (
          <p className="text-xs text-muted-foreground">{lead.acomodacaoInteresse}</p>
        )}
        {/* datas_interesse e Json do bot: cache antigo pode trazer objeto em vez de string */}
        {typeof lead.datasInteresse === "string" && lead.datasInteresse && (
          <p className="text-xs text-muted-foreground">{lead.datasInteresse}</p>
        )}
        {lead.tipoPublico != null && (
          <span className="mt-1 inline-block rounded-full bg-default-100 px-2 py-0.5 text-xs">
            {AUDIENCE_LABELS[lead.tipoPublico]}
          </span>
        )}
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
