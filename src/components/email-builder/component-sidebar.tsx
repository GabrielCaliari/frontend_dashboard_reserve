"use client"

import { useDrag } from "react-dnd"
import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/src/components/ui/card"
import type { IEmailComponent } from "@/src/common/@types/@email-builder"
import { Type, ImageIcon, BoxIcon as ButtonIcon, SeparatorHorizontal, LinkIcon } from "lucide-react"

interface ComponentItemProps {
  component: IEmailComponent
  onAddComponent: (component: IEmailComponent) => void
}

function ComponentItem({ component, onAddComponent }: ComponentItemProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "EMAIL_COMPONENT",
    item: () => {
      // Cria uma cópia do componente para garantir que é um novo objeto
      return { ...component, isNew: true }
    },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult()
      if (item && dropResult) {
        // Passa uma cópia do componente para garantir que é um novo objeto
        onAddComponent({ ...item })
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  return (
    <div
      ref={drag}
      className={`cursor-grab p-3 mb-2 border rounded-md flex items-center gap-2 hover:bg-gray-50 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {component.type === "text" && <Type size={18} />}
      {component.type === "image" && <ImageIcon size={18} />}
      {component.type === "button" && <ButtonIcon size={18} />}
      {component.type === "divider" && <SeparatorHorizontal size={18} />}
      {component.type === "link" && <LinkIcon size={18} />}
      <span>{component.name}</span>
    </div>
  )
}

interface ComponentSidebarProps {
  onAddComponent: (component: IEmailComponent) => void
}

export default function ComponentSidebar({ onAddComponent }: ComponentSidebarProps) {
  const t = useTranslations("emailBuilder")

  // Atualize o array componentTemplates para incluir mais detalhes
  const componentTemplates: IEmailComponent[] = [
    {
      id: "text-template",
      type: "text",
      name: t("text"),
      content: t("defaultTextContent"),
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      textColor: "#333333",
      textAlign: "left",
      padding: "10px",
    },
    {
      id: "heading-template",
      type: "text",
      name: t("title"),
      content: t("defaultTitleContent"),
      fontFamily: "Helvetica, sans-serif",
      fontSize: "24px",
      fontWeight: "bold",
      textColor: "#222222",
      textAlign: "center",
      padding: "15px 10px",
    },
    {
      id: "image-template",
      type: "image",
      name: t("image"),
      src: "/placeholder.svg?key=52e23",
      alt: t("defaultImageAlt"),
      width: "100%",
      height: "auto",
      padding: "10px",
    },
    {
      id: "button-template",
      type: "button",
      name: t("button"),
      label: t("defaultButtonText"),
      href: "#",
      backgroundColor: "#007bff",
      color: "#ffffff",
      borderRadius: "4px",
      padding: "10px 20px",
      fontFamily: "Arial, sans-serif",
      fontWeight: "bold",
    },
    {
      id: "link-template",
      type: "link",
      name: t("link"),
      linkText: t("defaultLinkText"),
      url: "https://exemplo.com",
      textColor: "#0066cc",
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      textDecoration: "underline",
      padding: "10px",
    },
    {
      id: "divider-template",
      type: "divider",
      name: t("divider"),
      color: "#e0e0e0",
      thickness: "1px",
      width: "100%",
      padding: "15px 0",
    },
  ]

  return (
    <Card>
      <CardContent className="p-3">
        <div className="space-y-2">
          {componentTemplates.map((component) => (
            <ComponentItem key={component.id} component={component} onAddComponent={onAddComponent} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
