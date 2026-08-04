"use client";

/**
 * ImageCard Component
 *
 * Individual image card with editing capabilities.
 *
 * Features:
 * - Image thumbnail with Next.js Image optimization
 * - Alt text display and inline editing
 * - Display order indicator
 * - Delete button with confirmation
 * - Drag handle for reordering (when used with @dnd-kit)
 * - Hover effects and transitions
 * - Responsive design
 *
 * This component can be used standalone or as part of ImageGallery.
 * When used with ImageGallery, the drag-and-drop functionality is handled by the parent.
 *
 * **Validates: Requirements 12.3, 12.4, 18.5**
 */

import { useState } from"react";
import Image from"next/image";
import { Button, Input, Card, CardBody, CardFooter } from"@heroui/react";
import { Trash2, GripVertical, Edit2, Check, X } from"lucide-react";
import type { ArticleImage } from"@/src/shared/domain/types/@cms-image";

interface ImageCardProps {
 image: ArticleImage;
 index: number;
 onDelete?: (imageId: string) => void;
 onUpdateAltText?: (imageId: string, altText: string) => void;
 showDragHandle?: boolean;
 dragHandleProps?: any;
 isDragging?: boolean;
 className?: string;
}

export default function ImageCard({
 image,
 index,
 onDelete,
 onUpdateAltText,
 showDragHandle = false,
 dragHandleProps,
 isDragging = false,
 className ="",
}: ImageCardProps) {
 const [editingAltText, setEditingAltText] = useState(false);
 const [altTextValue, setAltTextValue] = useState(image.alt_text ||"");
 const [isHovered, setIsHovered] = useState(false);

 const handleAltTextSave = () => {
 if (altTextValue !== image.alt_text && onUpdateAltText) {
 onUpdateAltText(image.id, altTextValue);
 }
 setEditingAltText(false);
 };

 const handleAltTextCancel = () => {
 setAltTextValue(image.alt_text ||"");
 setEditingAltText(false);
 };

 const handleDelete = () => {
 if (onDelete) {
 if (confirm("Are you sure you want to delete this image?")) {
 onDelete(image.id);
 }
 }
 };

 return (
 <Card
 className={`bg-default-100/50 hover:bg-default-100 transition-all ${
 isDragging ?"opacity-50 scale-95" :""
 } ${className}`}
 onMouseEnter={() => setIsHovered(true)}
 onMouseLeave={() => setIsHovered(false)}
 >
 <CardBody className="p-0">
 {/* Image Container */}
 <div className="relative aspect-video bg-background overflow-hidden group">
 <Image
 src={image.url}
 alt={image.alt_text ||`Image ${index + 1}`}
 fill
 className="object-cover transition-transform group-hover:scale-105"
 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
 />

 {/* Overlay on hover */}
 <div
 className={`absolute inset-0 bg-black/40 transition-opacity ${
 isHovered ?"opacity-100" :"opacity-0"
 }`}
 />

 {/* Drag handle */}
 {showDragHandle && (
 <div
 {...dragHandleProps}
 className="absolute top-2 left-2 bg-black/70 hover:bg-black/90 rounded p-1.5 cursor-grab active:cursor-grabbing transition-all z-10"
 >
 <GripVertical size={18} className="text-white" />
 </div>
 )}

 {/* Delete button */}
 {onDelete && (
 <Button
 size="sm"
 isIconOnly
 color="danger"
 variant="flat"
 className={`absolute top-2 right-2 transition-all z-10 ${
 isHovered ?"opacity-100 scale-100" :"opacity-0 scale-90"
 }`}
 onPress={handleDelete}
 >
 <Trash2 size={16} />
 </Button>
 )}

 {/* Display order badge */}
 <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium z-10">
 #{index + 1}
 </div>

 {/* Image info overlay */}
 <div
 className={`absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10 transition-all ${
 isHovered ?"opacity-100" :"opacity-0"
 }`}
 >
 {(image.url.split(".").pop() ||"img").toUpperCase()}
 </div>
 </div>
 </CardBody>

 {/* Alt text section */}
 <CardFooter className="p-3 flex-col items-start gap-2">
 {editingAltText ? (
 <div className="w-full space-y-2">
 <Input
 size="sm"
 placeholder="Alt text for accessibility"
 value={altTextValue}
 onChange={(e) => setAltTextValue(e.target.value)}
 onKeyDown={(e) => {
 if (e.key ==="Enter") {
 handleAltTextSave();
 } else if (e.key ==="Escape") {
 handleAltTextCancel();
 }
 }}
 autoFocus
 classNames={{
 input:"text-sm",
 inputWrapper:"bg-background/50",
 }}
 endContent={
 <div className="flex gap-1">
 <Button
 size="sm"
 isIconOnly
 color="success"
 variant="light"
 onPress={handleAltTextSave}
 >
 <Check size={14} />
 </Button>
 <Button
 size="sm"
 isIconOnly
 variant="light"
 onPress={handleAltTextCancel}
 >
 <X size={14} />
 </Button>
 </div>
 }
 />
 </div>
 ) : (
 <div className="w-full flex items-start justify-between gap-2">
 <button
 onClick={() => onUpdateAltText && setEditingAltText(true)}
 className="text-sm text-muted-foreground hover:text-foreground text-left flex-1 transition-colors"
 disabled={!onUpdateAltText}
 >
 {image.alt_text || (
 <span className="italic">Click to add alt text</span>
 )}
 </button>
 {onUpdateAltText && (
 <Button
 size="sm"
 isIconOnly
 variant="light"
 onPress={() => setEditingAltText(true)}
 className="flex-shrink-0"
 >
 <Edit2 size={14} />
 </Button>
 )}
 </div>
 )}

 {/* Image metadata */}
 <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
 <span>ID: {image.id}</span>
 <span>Order: {image.display_order}</span>
 </div>
 </CardFooter>
 </Card>
 );
}
