"use client";

import { useState, useEffect } from"react";
import {
 DndContext,
 type DragEndEvent,
 type DragOverEvent,
 DragOverlay,
 type DragStartEvent,
 PointerSensor,
 useSensor,
 useSensors,
} from"@dnd-kit/core";
import { SortableContext, arrayMove } from"@dnd-kit/sortable";
import { PlusCircle, Save } from"lucide-react";

import { Button } from"@heroui/react";
import {
 Modal,
 ModalContent,
 ModalHeader,
 ModalBody,
 ModalFooter,
} from"@/src/components/ui/modal";

import { Input } from"@heroui/react";
import { useToast } from"@/src/common/hooks/use-toast";
import { useTranslations } from"next-intl";

import KanbanCard from"./kanban-card";
import KanbanColumn from"./kanban-column";
import toast from"react-hot-toast";
import { ILeadQualificationMessage } from"@/src/common/interfaces/lead-qualification.interface";
import { CardType } from"./kanban-board-with-autosave";

// Tipos para nossos dados

export type ColumnType = {
 id: string;
 title: string;
};

// Dados iniciais para demonstração
const initialColumns: ColumnType[] = [
 { id:"column-1", title:"A Fazer" },
 { id:"column-2", title:"Em Progresso" },
 { id:"column-3", title:"Concluído" },
];

export default function KanbanBoard() {
 const t = useTranslations("kanban");
 const [columns, setColumns] = useState<ColumnType[]>(initialColumns);
 const [cards, setCards] = useState<CardType[]>([]);
 const [activeCard, setActiveCard] = useState<CardType | null>(null);
 const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null);

 // Estados para o modal de adicionar coluna
 const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
 const [newColumnTitle, setNewColumnTitle] = useState("");

 // Estados para o modal de adicionar cartão
 const [isAddCardOpen, setIsAddCardOpen] = useState(false);
 const [newCardTitle, setNewCardTitle] = useState("");
 const [newCardDescription, setNewCardDescription] = useState("");
 const [newCardColumnId, setNewCardColumnId] = useState("");

 // Carregar dados salvos do localStorage quando o componente é montado
 useEffect(() => {
 const savedColumns = localStorage.getItem("kanban-columns");
 const savedCards = localStorage.getItem("kanban-cards");

 if (savedColumns) {
 try {
 setColumns(JSON.parse(savedColumns));
 } catch (error) {
 console.error("Erro ao carregar colunas:", error);
 }
 }

 if (savedCards) {
 try {
 setCards(JSON.parse(savedCards));
 } catch (error) {
 console.error("Erro ao carregar cartões:", error);
 }
 }
 }, []);

 // Função para salvar o estado atual no localStorage
 const saveBoard = () => {
 try {
 localStorage.setItem("kanban-columns", JSON.stringify(columns));
 localStorage.setItem("kanban-cards", JSON.stringify(cards));

 toast.success(t("boardSaved"));
 } catch (error) {
 console.error("Erro ao salvar quadro:", error);

 toast.error(t("boardSaveError"));
 }
 };

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

 if (activeType ==="Card") {
 const draggedCard = cards.find((card) => card.id === active.id);
 if (draggedCard) setActiveCard(draggedCard);
 } else if (activeType ==="Column") {
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
 if (activeType !=="Card") return;

 // Se estivermos arrastando sobre outro cartão
 if (overType ==="Card") {
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
 if (overType ==="Column") {
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

 // Reordenar colunas
 if (
 activeType ==="Column" &&
 overType ==="Column" &&
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
 id:`column-${Date.now()}`,
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
 id:`card-${Date.now()}`,
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
 <div className="flex flex-col gap-4">
 <div className="flex justify-end mb-4">
 <Button onClick={saveBoard} className="flex items-center gap-2">
 <Save className="h-4 w-4" />
 {t("saveBoard")}
 </Button>
 </div>

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
 className="flex h-[60px] min-w-[350px] items-center justify-center gap-2 border-dashed"
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
 <p>{t("columnDescription")}</p>
 </ModalHeader>
 <div className="space-y-4 py-4">
 <div className="space-y-2">
 <label htmlFor="column-title">{t("columnTitle")}</label>
 <Input
 id="column-title"
 placeholder={t("columnPlaceholder")}
 value={newColumnTitle}
 onChange={(e) => setNewColumnTitle(e.target.value)}
 />
 </div>
 <Button onClick={handleAddColumn} className="w-full">
 {t("addColumn")}
 </Button>
 </div>
 </ModalContent>
 </Modal>

 {/* Modal para adicionar cartão */}
 <Modal isOpen={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
 <ModalContent>
 <ModalHeader>
 <h2>{t("addNewCard")}</h2>
 <p>{t("cardDescription")}</p>
 </ModalHeader>
 <div className="space-y-4 py-4">
 <div className="space-y-2">
 <label htmlFor="card-title">{t("cardTitle")}</label>
 <Input
 id="card-title"
 placeholder={t("cardPlaceholder")}
 value={newCardTitle}
 onChange={(e) => setNewCardTitle(e.target.value)}
 />
 </div>
 <div className="space-y-2">
 <label htmlFor="card-description">{t("description")}</label>
 <Input
 id="card-description"
 placeholder={t("descriptionPlaceholder")}
 value={newCardDescription}
 onChange={(e) => setNewCardDescription(e.target.value)}
 />
 </div>
 <Button onClick={handleAddCard} className="w-full">
 {t("addCard")}
 </Button>
 </div>
 </ModalContent>
 </Modal>
 </div>
 );
}
