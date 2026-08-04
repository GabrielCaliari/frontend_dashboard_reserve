"use client"

import { useRef } from"react"
import { useDrag, useDrop } from"react-dnd"
import type { IEmailComponent } from"@/src/shared/domain/types/@email-builder"
import { Card, CardContent } from"@/src/presentation/components/atoms/shadcn-ui/card"
import { Button } from"@/src/presentation/components/atoms/shadcn-ui/button"
import { Trash2, Move, Edit } from"lucide-react"
import { Checkbox } from"@/src/presentation/components/atoms/shadcn-ui/checkbox"

interface EmailComponentItemProps {
 component: IEmailComponent
 index: number
 onSelect: (component: IEmailComponent) => void
 onRemove: (id: string) => void
 onMove: (dragIndex: number, hoverIndex: number) => void
 isSelected: boolean
 onToggleSelection: (id: string) => void
 selectedBlocks: string[]
 allComponents: IEmailComponent[]
 onMoveMultipleComponents: (dragIndices: number[], targetIndex: number) => void
}

interface DragItem {
 index: number
 id: string
 type: string
}

export default function EmailComponentItem({
 component,
 index,
 onSelect,
 onRemove,
 onMove,
 isSelected,
 onToggleSelection,
 selectedBlocks,
 allComponents,
 onMoveMultipleComponents,
}: EmailComponentItemProps) {
 const ref = useRef<HTMLDivElement>(null)

 // Get indices of selected blocks
 const selectedIndices = selectedBlocks
 .map((id) => allComponents.findIndex((comp) => comp.id === id))
 .filter((idx) => idx !== -1)

 // Determine if this is a multi-block drag
 const isMultiDrag = isSelected && selectedBlocks.length > 1

 // Single block drag
 const [{ isDragging: isSingleDragging }, drag] = useDrag({
 type:"COMPONENT_ITEM",
 item: () => {
 return { id: component.id, index }
 },
 canDrag: !isMultiDrag, // Disable single drag if part of multi-drag
 collect: (monitor) => ({
 isDragging: monitor.isDragging(),
 }),
 })

 // Multi-block drag
 const [{ isDragging: isMultiDragging }, multiDrag] = useDrag({
 type:"MULTI_COMPONENTS",
 item: () => {
 return {
 indices: selectedIndices,
 ids: selectedBlocks,
 }
 },
 canDrag: isMultiDrag,
 collect: (monitor) => ({
 isDragging: monitor.isDragging(),
 }),
 })

 const isDragging = isSingleDragging || isMultiDragging

 const [{ handlerId }, drop] = useDrop({
 accept: ["COMPONENT_ITEM","MULTI_COMPONENTS"],
 collect(monitor) {
 return {
 handlerId: monitor.getHandlerId(),
 }
 },
 hover(item: any, monitor) {
 if (!ref.current) {
 return
 }

 // Handle single component drag
 if (monitor.getItemType() ==="COMPONENT_ITEM") {
 const dragIndex = item.index
 const hoverIndex = index

 if (dragIndex === hoverIndex) {
 return
 }

 const hoverBoundingRect = ref.current?.getBoundingClientRect()
 const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
 const clientOffset = monitor.getClientOffset()
 const hoverClientY = clientOffset!.y - hoverBoundingRect.top

 if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
 return
 }
 if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
 return
 }

 onMove(dragIndex, hoverIndex)
 item.index = hoverIndex
 }
 // Handle multi-component drag
 else if (monitor.getItemType() ==="MULTI_COMPONENTS") {
 const { indices } = item
 const hoverIndex = index

 // Don't replace if hovering over one of the dragged items
 if (indices.includes(hoverIndex)) {
 return
 }

 const hoverBoundingRect = ref.current?.getBoundingClientRect()
 const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
 const clientOffset = monitor.getClientOffset()
 const hoverClientY = clientOffset!.y - hoverBoundingRect.top

 // Determine if we're hovering above or below the middle
 const isAboveMiddle = hoverClientY < hoverMiddleY

 // Get the minimum and maximum indices of the dragged items
 const minDragIndex = Math.min(...indices)
 const maxDragIndex = Math.max(...indices)

 // Only move if we're hovering outside the dragged range
 if ((hoverIndex < minDragIndex && isAboveMiddle) || (hoverIndex > maxDragIndex && !isAboveMiddle)) {
 onMoveMultipleComponents(indices, hoverIndex)
 // Update indices in the item
 item.indices = selectedIndices.map((idx) =>
 idx < hoverIndex ? hoverIndex - selectedIndices.length + idx : idx,
 )
 }
 }
 },
 drop(item: any, monitor) {
 if (monitor.getItemType() ==="MULTI_COMPONENTS") {
 const { indices } = item
 const hoverIndex = index

 // Don't replace if hovering over one of the dragged items
 if (indices.includes(hoverIndex)) {
 return
 }

 onMoveMultipleComponents(indices, hoverIndex)
 }
 },
 })

 // Apply both drag and drop refs
 const dragDropRef = (node: HTMLDivElement | null) => {
 drag(node)
 multiDrag(node)
 drop(node)
 ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
 }

 // Atualize a função renderComponentPreview para incluir os estilos
 const renderComponentPreview = () => {
 switch (component.type) {
 case"text":
 return (
 <div
 dangerouslySetInnerHTML={{ __html: component.content ?? '' }}
 style={{
 fontFamily: component.fontFamily,
 fontSize: component.fontSize,
 fontWeight: component.fontWeight,
 color: component.textColor,
 textAlign: component.textAlign as React.CSSProperties['textAlign'],
 padding: component.padding,
 }}
 />
 )
 case"image":
 return (
 <div className="flex justify-center">
 <img
 src={component.src ||"/placeholder.svg"}
 alt={component.alt ||""}
 style={{
 maxWidth:"100%",
 width: component.width,
 height: component.height,
 borderRadius: component.borderRadius,
 }}
 />
 </div>
 )
 case"button":
 return (
 <div className="flex justify-center">
 <button
 className="px-4 py-2 rounded"
 style={{
 backgroundColor: component.backgroundColor ||"#007bff",
 color: component.color ||"#ffffff",
 borderRadius: component.borderRadius,
 fontFamily: component.fontFamily,
 fontWeight: component.fontWeight,
 padding: component.padding,
 }}
 >
 {component.label}
 </button>
 </div>
 )
 case"link":
 return (
 <div className="flex">
 <a
 href={component.url}
 target="_blank"
 rel="noopener noreferrer"
 style={{
 color: component.textColor ||"#0066cc",
 fontFamily: component.fontFamily,
 fontSize: component.fontSize,
 fontWeight: component.fontWeight,
 textDecoration: component.textDecoration ||"underline",
 padding: component.padding,
 display: component.display ||"inline-block",
 }}
 >
 {component.linkText}
 </a>
 </div>
 )
 case"divider":
 return (
 <hr
 style={{
 borderColor: component.color ||"#e0e0e0",
 borderWidth: component.thickness ||"1px",
 width: component.width ||"100%",
 borderStyle:"solid",
 }}
 />
 )
 default:
 return null
 }
 }

 return (
 <div ref={dragDropRef} className={`relative ${isDragging ?"opacity-50" :""}`} data-handler-id={handlerId}>
 <Card className={`border-2 ${isSelected ?"border-blue-500" :"hover:border-blue-300"}`}>
 <CardContent className="p-4">
 <div className="absolute top-2 left-2 z-10">
 <Checkbox
 checked={isSelected}
 onChange={() => onToggleSelection(component.id)}
 className="h-4 w-4"
 />
 </div>
 <div className="absolute top-2 right-2 flex space-x-1">
 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onSelect(component)}>
 <Edit size={16} />
 </Button>
 <Button variant="ghost" size="icon" className="h-8 w-8 cursor-move">
 <Move size={16} />
 </Button>
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8 text-red-500 hover:text-red-700"
 onClick={() => onRemove(component.id)}
 >
 <Trash2 size={16} />
 </Button>
 </div>
 <div className="pt-6">{renderComponentPreview()}</div>
 </CardContent>
 </Card>
 </div>
 )
}
