"use client"

import { useDrop } from "react-dnd"
import type { IEmailComponent } from "@/src/common/@types/@email-builder"
import EmailComponentItem from "./email-component-item"

interface EmailCanvasProps {
  components: IEmailComponent[]
  onSelectComponent: (component: IEmailComponent) => void
  onRemoveComponent: (id: string) => void
  onMoveComponent: (dragIndex: number, hoverIndex: number) => void
  onMoveMultipleComponents: (dragIndices: number[], targetIndex: number) => void
  selectedBlocks: string[]
  onToggleBlockSelection: (id: string) => void
  spacing?: string // Nova propriedade para controlar o espaçamento
}

export default function EmailCanvas({
  components,
  onSelectComponent,
  onRemoveComponent,
  onMoveComponent,
  onMoveMultipleComponents,
  selectedBlocks,
  onToggleBlockSelection,
  spacing = "p-2", // Valor padrão para manter a compatibilidade
}: EmailCanvasProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ["EMAIL_COMPONENT", "COMPONENT_ITEM", "MULTI_COMPONENTS"],
    drop: (item: any, monitor) => {
      // Apenas processa o drop se for um componente da barra lateral
      // Os componentes internos são tratados pelo EmailComponentItem
      if (monitor.getItemType() === "EMAIL_COMPONENT" && item.isNew) {
        return { name: "EmailCanvas", isDropped: true }
      }

      if (monitor.getItemType() === "MULTI_COMPONENTS") {
        // Handle dropping multiple components
        const { indices } = item
        onMoveMultipleComponents(indices, components.length)
      }
      return { name: "EmailCanvas" }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }))

  return (
    <div
      ref={drop}
      className={`min-h-[500px] border-2 border-dashed rounded-lg ${spacing} ${
        isOver ? "border-blue-400 bg-blue-50" : "border-gray-200"
      }`}
    >
      {components.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
          <p>Arraste e solte componentes aqui</p>
          <p className="text-sm mt-2">ou clique em um componente na barra lateral</p>
        </div>
      ) : (
        <div className="space-y-4">
          {components.map((component, index) => (
            <EmailComponentItem
              key={`${component.id}-${index}`}
              index={index}
              component={component}
              onSelect={onSelectComponent}
              onRemove={onRemoveComponent}
              onMove={onMoveComponent}
              isSelected={selectedBlocks.includes(component.id)}
              onToggleSelection={onToggleBlockSelection}
              selectedBlocks={selectedBlocks}
              allComponents={components}
              onMoveMultipleComponents={onMoveMultipleComponents}
            />
          ))}
        </div>
      )}
    </div>
  )
}
