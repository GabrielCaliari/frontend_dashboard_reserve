"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import type { IEmailComponent } from "@/src/common/@types/@email-builder"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Button } from "@/src/components/ui/button"
import { ColorPicker } from "./color-picker"
import StylePresets from "./style-presets"
import LinkEditorModal from "./link-editor-modal"
import { LinkIcon } from "lucide-react"
import { Textarea } from "../ui/textarea"

interface PropertiesPanelProps {
  component: IEmailComponent
  onUpdateComponent: (component: IEmailComponent) => void
}

export default function PropertiesPanel({ component, onUpdateComponent }: PropertiesPanelProps) {
  const [localComponent, setLocalComponent] = useState<IEmailComponent>(component)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setLocalComponent(component)
  }, [component])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const updatedComponent = {
      ...localComponent,
      [name]: value,
    }
    setLocalComponent(updatedComponent)
    onUpdateComponent(updatedComponent)
  }

  const handleSelectChange = (name: string, value: string) => {
    const updatedComponent = {
      ...localComponent,
      [name]: value,
    }
    setLocalComponent(updatedComponent)
    onUpdateComponent(updatedComponent)
  }

  const handleColorChange = (name: string, color: string) => {
    const updatedComponent = {
      ...localComponent,
      [name]: color,
    }
    setLocalComponent(updatedComponent)
    onUpdateComponent(updatedComponent)
  }

  const handleApplyPreset = (presetProperties: Partial<IEmailComponent>) => {
    const updatedComponent = {
      ...localComponent,
      ...presetProperties,
    }
    setLocalComponent(updatedComponent)
    onUpdateComponent(updatedComponent)
  }

  const handleTextSelection = () => {
    if (component.type === "text" && textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd

      if (start !== end) {
        const selectedText = textareaRef.current.value.substring(start, end)
        setSelectedText(selectedText)
        setIsLinkModalOpen(true)
      }
    }
  }

  const handleApplyLink = (url: string, text: string) => {
    if (component.type === "text" && textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const currentContent = localComponent.content || ""

      // Criar o link HTML
      const linkHtml = `<a href="${url}" style="color: #0066cc; text-decoration: underline;">${text}</a>`

      // Substituir o texto selecionado pelo link
      const newContent = currentContent.substring(0, start) + linkHtml + currentContent.substring(end)

      const updatedComponent = {
        ...localComponent,
        content: newContent,
      }

      setLocalComponent(updatedComponent)
      onUpdateComponent(updatedComponent)
    }
  }

  const fontFamilies = [
    { value: "Arial, sans-serif", label: "Arial" },
    { value: "Helvetica, sans-serif", label: "Helvetica" },
    { value: "Georgia, serif", label: "Georgia" },
    { value: "Times New Roman, serif", label: "Times New Roman" },
    { value: "Courier New, monospace", label: "Courier New" },
    { value: "Verdana, sans-serif", label: "Verdana" },
    { value: "Tahoma, sans-serif", label: "Tahoma" },
  ]

  const fontSizes = [
    { value: "12px", label: "12px" },
    { value: "14px", label: "14px" },
    { value: "16px", label: "16px" },
    { value: "18px", label: "18px" },
    { value: "20px", label: "20px" },
    { value: "24px", label: "24px" },
    { value: "28px", label: "28px" },
    { value: "32px", label: "32px" },
    { value: "36px", label: "36px" },
    { value: "48px", label: "48px" },
  ]

  const fontWeights = [
    { value: "normal", label: "Normal" },
    { value: "bold", label: "Negrito" },
    { value: "100", label: "100" },
    { value: "200", label: "200" },
    { value: "300", label: "300" },
    { value: "400", label: "400" },
    { value: "500", label: "500" },
    { value: "600", label: "600" },
    { value: "700", label: "700" },
    { value: "800", label: "800" },
    { value: "900", label: "900" },
  ]

  const textAligns = [
    { value: "left", label: "Esquerda" },
    { value: "center", label: "Centro" },
    { value: "right", label: "Direita" },
    { value: "justify", label: "Justificado" },
  ]

  const paddings = [
    { value: "0", label: "0" },
    { value: "5px", label: "5px" },
    { value: "10px", label: "10px" },
    { value: "15px", label: "15px" },
    { value: "20px", label: "20px" },
    { value: "10px 15px", label: "10px 15px" },
    { value: "15px 20px", label: "15px 20px" },
    { value: "20px 30px", label: "20px 30px" },
  ]

  const textDecorations = [
    { value: "none", label: "Nenhum" },
    { value: "underline", label: "Sublinhado" },
    { value: "overline", label: "Linha superior" },
    { value: "line-through", label: "Tachado" },
  ]

  const renderContentProperties = () => {
    switch (component.type) {
      case "text":
        return (
          <>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Button variant="outline" size="sm" onClick={handleTextSelection} className="flex items-center gap-1">
                  <LinkIcon size={14} />
                  <span>Link</span>
                </Button>
              </div>
              <Textarea
                id="content"
                name="content"
                value={localComponent.content}
                onChange={handleChange}
                className="h-32"
                ref={textareaRef}
                onSelect={(e) => {
                  // Armazenar a seleção atual para uso posterior
                  const target = e.target as HTMLTextAreaElement
                  if (target.selectionStart !== target.selectionEnd) {
                    setSelectedText(target.value.substring(target.selectionStart, target.selectionEnd))
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Você pode usar tags HTML básicas como &lt;p&gt;, &lt;h1&gt;, &lt;strong&gt;, etc.
              </p>
            </div>
          </>
        )
      case "image":
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="src">URL da Imagem</Label>
              <Input id="src" name="src" value={localComponent.src} onChange={handleChange} />
            </div>
            <div className="mb-4">
              <Label htmlFor="alt">Texto Alternativo</Label>
              <Input id="alt" name="alt" value={localComponent.alt} onChange={handleChange} />
            </div>
            <div className="mb-4">
              <Label htmlFor="width">Largura</Label>
              <Input
                id="width"
                name="width"
                value={localComponent.width || ""}
                onChange={handleChange}
                placeholder="auto, 100%, 300px..."
              />
            </div>
            <div className="mb-4">
              <Label htmlFor="height">Altura</Label>
              <Input
                id="height"
                name="height"
                value={localComponent.height || ""}
                onChange={handleChange}
                placeholder="auto, 200px..."
              />
            </div>
          </>
        )
      case "button":
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="label">Texto do Botão</Label>
              <Input id="label" name="label" value={localComponent.label} onChange={handleChange} />
            </div>
            <div className="mb-4">
              <Label htmlFor="href">Link (URL)</Label>
              <Input id="href" name="href" value={localComponent.href} onChange={handleChange} />
            </div>
          </>
        )
      case "link":
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="linkText">Texto do Link</Label>
              <Input id="linkText" name="linkText" value={localComponent.linkText} onChange={handleChange} />
            </div>
            <div className="mb-4">
              <Label htmlFor="url">URL</Label>
              <Input id="url" name="url" value={localComponent.url} onChange={handleChange} />
            </div>
            <div className="mb-4">
              <Label htmlFor="textDecoration">Decoração do Texto</Label>
              <Select
                value={localComponent.textDecoration || "underline"}
                onValueChange={(value) => handleSelectChange("textDecoration", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma decoração" />
                </SelectTrigger>
                <SelectContent>
                  {textDecorations.map((decoration) => (
                    <SelectItem key={decoration.value} value={decoration.value}>
                      {decoration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )
      case "divider":
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="thickness">Espessura</Label>
              <Input
                id="thickness"
                name="thickness"
                value={localComponent.thickness || "1px"}
                onChange={handleChange}
              />
            </div>
            <div className="mb-4">
              <Label htmlFor="width">Largura</Label>
              <Input id="width" name="width" value={localComponent.width || "100%"} onChange={handleChange} />
            </div>
          </>
        )
      default:
        return null
    }
  }

  const renderStyleProperties = () => {
    return (
      <>
        <StylePresets componentType={component.type} onApplyPreset={handleApplyPreset} />

        {(component.type === "text" || component.type === "button" || component.type === "link") && (
          <>
            <div className="mb-4">
              <Label htmlFor="fontFamily">Família da Fonte</Label>
              <Select
                value={localComponent.fontFamily || "Arial, sans-serif"}
                onValueChange={(value) => handleSelectChange("fontFamily", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma fonte" />
                </SelectTrigger>
                <SelectContent>
                  {fontFamilies.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mb-4">
              <Label htmlFor="fontSize">Tamanho da Fonte</Label>
              <Select
                value={localComponent.fontSize || "16px"}
                onValueChange={(value) => handleSelectChange("fontSize", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tamanho" />
                </SelectTrigger>
                <SelectContent>
                  {fontSizes.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mb-4">
              <Label htmlFor="fontWeight">Peso da Fonte</Label>
              <Select
                value={localComponent.fontWeight || "normal"}
                onValueChange={(value) => handleSelectChange("fontWeight", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um peso" />
                </SelectTrigger>
                <SelectContent>
                  {fontWeights.map((weight) => (
                    <SelectItem key={weight.value} value={weight.value}>
                      {weight.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {(component.type === "text" || component.type === "link") && (
          <>
            <div className="mb-4">
              <Label htmlFor="textAlign">Alinhamento</Label>
              <Select
                value={localComponent.textAlign || "left"}
                onValueChange={(value) => handleSelectChange("textAlign", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um alinhamento" />
                </SelectTrigger>
                <SelectContent>
                  {textAligns.map((align) => (
                    <SelectItem key={align.value} value={align.value}>
                      {align.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mb-4">
              <Label>Cor do Texto</Label>
              <ColorPicker
                color={localComponent.textColor || "#000000"}
                onChange={(color) => handleColorChange("textColor", color)}
              />
            </div>
          </>
        )}

        {component.type === "button" && (
          <>
            <div className="mb-4">
              <Label>Cor de Fundo</Label>
              <ColorPicker
                color={localComponent.backgroundColor || "#007bff"}
                onChange={(color) => handleColorChange("backgroundColor", color)}
              />
            </div>
            <div className="mb-4">
              <Label>Cor do Texto</Label>
              <ColorPicker
                color={localComponent.color || "#ffffff"}
                onChange={(color) => handleColorChange("color", color)}
              />
            </div>
            <div className="mb-4">
              <Label htmlFor="borderRadius">Raio da Borda</Label>
              <Input
                id="borderRadius"
                name="borderRadius"
                value={localComponent.borderRadius || "4px"}
                onChange={handleChange}
                placeholder="4px, 8px, 50%..."
              />
            </div>
          </>
        )}

        {component.type === "image" && (
          <div className="mb-4">
            <Label htmlFor="borderRadius">Raio da Borda</Label>
            <Input
              id="borderRadius"
              name="borderRadius"
              value={localComponent.borderRadius || "0"}
              onChange={handleChange}
              placeholder="0, 4px, 8px, 50%..."
            />
          </div>
        )}

        {component.type === "divider" && (
          <div className="mb-4">
            <Label>Cor</Label>
            <ColorPicker
              color={localComponent.color || "#e0e0e0"}
              onChange={(color) => handleColorChange("color", color)}
            />
          </div>
        )}

        <div className="mb-4">
          <Label htmlFor="padding">Espaçamento (Padding)</Label>
          <Select
            value={localComponent.padding || "10px"}
            onValueChange={(value) => handleSelectChange("padding", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um espaçamento" />
            </SelectTrigger>
            <SelectContent>
              {paddings.map((padding) => (
                <SelectItem key={padding.value} value={padding.value}>
                  {padding.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="content">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="style">Estilo</TabsTrigger>
        </TabsList>
        <TabsContent value="content" className="pt-4">
          {renderContentProperties()}
        </TabsContent>
        <TabsContent value="style" className="pt-4">
          {renderStyleProperties()}
        </TabsContent>
      </Tabs>

      <LinkEditorModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onApply={handleApplyLink}
        initialText={selectedText}
      />
    </div>
  )
}
