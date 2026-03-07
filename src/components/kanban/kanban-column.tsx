"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, MoreHorizontal, PlusCircle, Trash2 } from "lucide-react"

import { Button } from "@heroui/react"
import { Card, CardHeader } from "@heroui/react"

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Progress,
  useDisclosure,
} from "@heroui/react";

import type { ColumnType } from "./kanban-board"
import KanbanCard from "./kanban-card"
import { CardType } from "./kanban-board-with-autosave"
import { useTranslations } from "next-intl"

interface KanbanColumnProps {
  column: ColumnType
  cards: CardType[]
  onAddCard: () => void
  onRemoveCard: (id: string) => void
  onRemoveColumn: (id: string) => void
}

export default function KanbanColumn({ column, cards, onAddCard, onRemoveCard, onRemoveColumn }: KanbanColumnProps) {
  const t = useTranslations("kanban")
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: {
      type: "Column",
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card ref={setNodeRef} style={style} className="flex h-[calc(100vh-200px)] min-w-[340px] flex-col">
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners}>
            <GripVertical className="h-5 w-5 cursor-grab text-muted-foreground" />
          </div>
          <h3 className="font-medium">{column.title}</h3>
          <div className="ml-2 rounded-full bg-muted px-2 py-1 text-xs">{cards.length}</div>
        </div>
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu>
            <DropdownItem key={1} onClick={() => onRemoveColumn(column.id)} className="text-destructive">
              <div className="flex items-center gap-2 font-semibold">
                <Trash2 className="mr-2 h-4 w-4" />
                {t("deleteColumn")}
              </div>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </CardHeader>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex flex-col gap-2">
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} onRemove={onRemoveCard} />
          ))}
        </div>
      </div>
      {/* <Button variant="ghost" className="m-2 flex items-center justify-start gap-1" onClick={onAddCard}>
        <PlusCircle className="h-4 w-4" />
        <span>Adicionar Cartão</span>
      </Button> */}
    </Card>
  )
}

