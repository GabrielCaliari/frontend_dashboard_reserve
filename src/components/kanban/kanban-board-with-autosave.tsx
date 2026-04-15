"use client";

import type React from "react";

import { useEffect, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { Download, PlusCircle, Save, Upload } from "lucide-react";

import { Button } from "@heroui/react";
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@heroui/react";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/src/presentation/components/atoms/reserve/modal";

import KanbanCard from "./kanban-card";
import KanbanColumn from "./kanban-column";
import { listLeadQualification } from "@/src/presentation/actions/list-lead-qualification";
import { ILeadQualificationMessage } from "@/src/shared/interfaces/lead-qualification.interface";
import useUpdateLeadQualification from "@/src/common/hooks/use-update-lead-qualification";
import { useTranslations } from "next-intl";

// Tipos para nossos dados
export type CardType = {
  id: string;
  title: string;
  description: string;
  columnId: string;
  details: ILeadQualificationMessage[];
};

export type ColumnType = {
  id: string;
  title: string;
};

export default function KanbanBoardWithAutosave() {
  const t = useTranslations("kanban");
  const { execUpdateLeadQualification } = useUpdateLeadQualification();

  const [columns, setColumns] = useState<ColumnType[]>([
    { id: "sem-contato", title: t("columns.noContact") },
    { id: "primeiro-contato", title: t("columns.firstContact") },
    { id: "reuniao-marcada", title: t("columns.meetingScheduled") },
    { id: "venda-realizada", title: t("columns.saleMade") },
    { id: "remarketing", title: t("columns.remarketing") },
    { id: "venda-perdida", title: t("columns.lostSale") },
  ]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null);

  useEffect(() => {
    let active = true;

    listLeadQualification()
      .then((data) => {
        if (!active) return;
        setCards(
          data.map((raw) => ({
            id: `${raw.message_id}-${Date.now()}`,
            title: raw.lead_name,
            description: raw.phone_number,
            columnId: raw.card,
            details: raw.messages,
          })),
        );
      })
      .catch(() => {
        // silencia erros de carregamento — o board inicia vazio
      });

    return () => {
      active = false;
    };
  }, []);

  // Estados para o modal de adicionar coluna
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  // Estados para o modal de adicionar cartão
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardDescription, setNewCardDescription] = useState("");
  const [newCardColumnId, setNewCardColumnId] = useState("");

  // Estados para controle de salvamento
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Detectar mudanças e resetar flag após debounce
  useEffect(() => {
    if (!hasChanges) return;
    const timer = setTimeout(() => setHasChanges(false), 2000);
    return () => clearTimeout(timer);
  }, [hasChanges]);

  // Marcar que houve mudanças quando columns ou cards mudam
  useEffect(() => {
    setHasChanges(true);
  }, [columns, cards]);

  // Configuração dos sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Manipuladores para drag and drop
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeType = active.data.current?.type;

    if (activeType === "Card") {
      const draggedCard = cards.find((card) => card.id === active.id);
      if (draggedCard) setActiveCard(draggedCard);
    } else if (activeType === "Column") {
      const draggedColumn = columns.find((column) => column.id === active.id);
      if (draggedColumn) setActiveColumn(draggedColumn);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Se não estivermos arrastando um cartão, não faça nada
    if (activeType !== "Card") return;

    // Se estivermos arrastando sobre outro cartão
    if (overType === "Card") {
      const activeCard = cards.find((card) => card.id === activeId);
      const overCard = cards.find((card) => card.id === overId);

      if (!activeCard || !overCard || activeCard.columnId === overCard.columnId)
        return;

      // Mover o cartão para a nova coluna
      setCards(
        cards.map((card) =>
          card.id === activeId
            ? { ...card, columnId: overCard.columnId }
            : card,
        ),
      );
    }

    // Se estivermos arrastando sobre uma coluna
    if (overType === "Column") {
      const activeCard = cards.find((card) => card.id === activeId);

      if (!activeCard || activeCard.columnId === overId) return;

      // Mover o cartão para a nova coluna
      setCards(
        cards.map((card) =>
          card.id === activeId ? { ...card, columnId: overId as string } : card,
        ),
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    setActiveColumn(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    const id = (active.id as string).split("-")[0];

    const draggedCard = cards.find((card) => card.id === active.id);
    const columnId = draggedCard?.columnId;

    execUpdateLeadQualification({
      card: columnId as string,
      lead_id: id,
    });

    if (
      activeType === "Column" &&
      overType === "Column" &&
      activeId !== overId
    ) {
      setColumns((columns) => {
        const activeIndex = columns.findIndex((col) => col.id === activeId);
        const overIndex = columns.findIndex((col) => col.id === overId);

        return arrayMove(columns, activeIndex, overIndex);
      });
    }
  };

  // Adicionar uma nova coluna
  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return;

    const newColumn: ColumnType = {
      id: `column-${Date.now()}`,
      title: newColumnTitle,
    };

    setColumns([...columns, newColumn]);
    setNewColumnTitle("");
    setIsAddColumnOpen(false);
  };

  // Adicionar um novo cartão
  const handleAddCard = () => {
    if (!newCardTitle.trim() || !newCardColumnId) return;

    const newCard: CardType = {
      id: `card-${Date.now()}`,
      title: newCardTitle,
      description: newCardDescription,
      columnId: newCardColumnId,
      details: [],
    };

    setCards([...cards, newCard]);
    setNewCardTitle("");
    setNewCardDescription("");
    setIsAddCardOpen(false);
  };

  // Remover um cartão
  const handleRemoveCard = (cardId: string) => {
    setCards(cards.filter((card) => card.id !== cardId));
  };

  // Remover uma coluna
  const handleRemoveColumn = (columnId: string) => {
    setColumns(columns.filter((column) => column.id !== columnId));
    // Remover também todos os cartões dessa coluna
    setCards(cards.filter((card) => card.columnId !== columnId));
  };

  // Abrir modal para adicionar cartão em uma coluna específica
  const handleOpenAddCard = (columnId: string) => {
    setNewCardColumnId(columnId);
    setIsAddCardOpen(true);
  };

  return (
    <div className="flex py-5 flex-col gap-4">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          <SortableContext items={columns.map((col) => col.id)}>
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                cards={cards.filter((card) => card.columnId === column.id)}
                onAddCard={() => handleOpenAddCard(column.id)}
                onRemoveCard={handleRemoveCard}
                onRemoveColumn={handleRemoveColumn}
              />
            ))}
          </SortableContext>

          <Button
            variant="solid"
            className="flex h-[60px] min-w-[340px] items-center justify-center gap-2 border-dashed"
            onClick={() => setIsAddColumnOpen(true)}
          >
            <PlusCircle className="h-5 w-5" />
            <span>{t("addColumn")}</span>
          </Button>
        </div>

        <DragOverlay>
          {activeCard && <KanbanCard card={activeCard} onRemove={() => {}} />}
        </DragOverlay>
      </DndContext>

      {/* Modal para adicionar coluna */}
      <Modal isOpen={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
        <ModalContent>
          <ModalHeader>
            <h2>{t("addNewColumn")}</h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-2">
              <label htmlFor="column-title">{t("columnTitle")}</label>
              <Input
                id="column-title"
                placeholder={t("columnPlaceholder")}
                value={newColumnTitle}
                onChange={(e: any) => setNewColumnTitle(e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onClick={handleAddColumn}
              className="w-full"
            >
              {t("addColumn")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal para adicionar cartão */}
      {/* <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Adicionar Novo Cartão</DialogTitle>
 <DialogDescription>Crie um novo cartão para adicionar à sua coluna.</DialogDescription>
 </DialogHeader>
 <div className="space-y-4 py-4">
 <div className="space-y-2">
 <label htmlFor="card-title">Título do Cartão</label>
 <Input
 id="card-title"
 placeholder="Ex: Implementar feature X"
 value={newCardTitle}
 onChange={(e: any) => setNewCardTitle(e.target.value)}
 />
 </div>
 <div className="space-y-2">
 <label htmlFor="card-description">Descrição</label>
 <Input
 id="card-description"
 placeholder="Descreva a tarefa..."
 value={newCardDescription}
 onChange={(e: any) => setNewCardDescription(e.target.value)}
 />
 </div>
 <Button onClick={handleAddCard} className="w-full">
 Adicionar Cartão
 </Button>
 </div>
 </DialogContent>
 </Dialog> */}
    </div>
  );
}
