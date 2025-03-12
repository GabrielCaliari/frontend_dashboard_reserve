"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { MoreHorizontal, Trash2 } from "lucide-react"

import { Button } from "@nextui-org/react"
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@nextui-org/react"
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalBody,
  ModalFooter,
} from "@nextui-org/react";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Progress,
  useDisclosure,
} from "@nextui-org/react";

import { Textarea } from "@nextui-org/react"
import { CardType } from "./kanban-board-with-autosave"
import { formatDateTimeToBRL } from "@/src/common/utils"

interface KanbanCardProps {
  card: CardType
  onRemove: (id: string) => void
}

export default function KanbanCard({ card, onRemove }: KanbanCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [cardDetails, setCardDetails] = useState(card)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: {
      type: "Card",
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  }

  const handleSaveDetails = () => {
    // Em uma aplicação real, você salvaria isso no backend
    setIsDetailsOpen(false)
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="cursor-grab rounded-md border bg-card p-3 shadow-sm"
        onClick={() => setIsDetailsOpen(true)}
      >
        <div className="flex items-start justify-between">
          <h4 className="font-medium">{card.title}</h4>
          {/* <Dropdown>
            <DropdownTrigger asChild onClick={(e: any) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="-mr-2 h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem
                key={1}
                onClick={(e: any) => {
                  e.stopPropagation()
                  onRemove(card.id)
                }}
                className="text-destructive"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Cartão
                </div>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown> */}
        </div>
        {card.description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {card.description.length > 100 ? `${card.description.substring(0, 100)}...` : card.description}
          </p>
        )}
      </div>

      <Modal isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <ModalContent className="sm:max-w-2xl max-h-[500px] overflow-auto">
          <ModalHeader>
            <h2>Detalhes da conversa</h2>
          </ModalHeader>
          <ModalBody>
            {
              card.details.map((detail, index) => (
                <div key={index} className="mb-4 flex flex-col gap-1 border-solid border-2 border-[#ebebeb] p-3 rounded-md">
                  <p className="font-semibold text-[18px]">{detail.type == 'pergunta' ? 'Sistema' : detail.profile_name}</p>
                  <p className="text-[16px]">{detail.json.conteudo}</p>
                  <div className="flex justify-between">
                    <p className="text-[14px] text-gray-500">{formatDateTimeToBRL(new Date(detail.message_date))}</p>
                    <p className="text-[14px] font-semibold text-gray-500">{detail.json.slug}</p>
                  </div>
                </div>
              ))
            }
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

