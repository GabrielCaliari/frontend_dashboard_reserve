"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Button } from "@/src/components/ui/button"
import { ColorPicker } from "./color-picker"
import { Trash2, Plus } from "lucide-react"

export interface HeaderConfig {
  logo?: {
    src: string
    alt: string
    height: string
  }
  title?: {
    text: string
    color: string
    fontSize: string
    fontFamily: string
  }
  backgroundColor: string
  alignment: "left" | "center" | "right"
  padding: string
}

interface HeaderBuilderProps {
  config: HeaderConfig
  onChange: (config: HeaderConfig) => void
}

export default function HeaderBuilder({ config, onChange }: HeaderBuilderProps) {
  const t = useTranslations("emailBuilder")
  const [showLogo, setShowLogo] = useState(!!config.logo)
  const [showTitle, setShowTitle] = useState(!!config.title)

  const updateConfig = (updates: Partial<HeaderConfig>) => {
    onChange({ ...config, ...updates })
  }

  const handleLogoChange = (updates: Partial<HeaderConfig["logo"]>) => {
    const updatedLogo = { ...(config.logo || { src: "", alt: "", height: "60px" }), ...updates }
    updateConfig({ logo: updatedLogo })
  }

  const handleTitleChange = (updates: Partial<HeaderConfig["title"]>) => {
    const updatedTitle = {
      ...(config.title || { text: "", color: "#333333", fontSize: "24px", fontFamily: "Arial, sans-serif" }),
      ...updates,
    }
    updateConfig({ title: updatedTitle })
  }

  const toggleLogo = () => {
    if (showLogo) {
      // Remove logo
      const { logo, ...rest } = config
      onChange(rest)
      setShowLogo(false)
    } else {
      // Add default logo
      updateConfig({
        logo: {
          src: "/abstract-logo.png",
          alt: "Logo",
          height: "60px",
        },
      })
      setShowLogo(true)
    }
  }

  const toggleTitle = () => {
    if (showTitle) {
      // Remove title
      const { title, ...rest } = config
      onChange(rest)
      setShowTitle(false)
    } else {
      // Add default title
      updateConfig({
        title: {
          text: t("defaultCompany"),
          color: "#333333",
          fontSize: "24px",
          fontFamily: "Arial, sans-serif",
        },
      })
      setShowTitle(true)
    }
  }

  const fontFamilies = [
    { value: "Arial, sans-serif", label: "Arial" },
    { value: "Helvetica, sans-serif", label: "Helvetica" },
    { value: "Georgia, serif", label: "Georgia" },
    { value: "Times New Roman, serif", label: "Times New Roman" },
    { value: "Verdana, sans-serif", label: "Verdana" },
    { value: "Tahoma, sans-serif", label: "Tahoma" },
  ]

  const fontSizes = [
    { value: "18px", label: "18px" },
    { value: "20px", label: "20px" },
    { value: "22px", label: "22px" },
    { value: "24px", label: "24px" },
    { value: "28px", label: "28px" },
    { value: "32px", label: "32px" },
    { value: "36px", label: "36px" },
  ]

  const paddings = [
    { value: "10px", label: "10px" },
    { value: "15px", label: "15px" },
    { value: "20px", label: "20px" },
    { value: "25px", label: "25px" },
    { value: "30px", label: "30px" },
    { value: "10px 20px", label: "10px 20px" },
    { value: "15px 30px", label: "15px 30px" },
    { value: "20px 40px", label: "20px 40px" },
  ]

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-md mb-4" style={{ backgroundColor: config.backgroundColor || "#f5f5f5" }}>
        <div
          className="flex items-center"
          style={{
            justifyContent:
              config.alignment === "left" ? "flex-start" : config.alignment === "right" ? "flex-end" : "center",
            padding: config.padding || "20px",
          }}
        >
          {showLogo && config.logo && (
            <img
              src={config.logo.src || "/abstract-logo.png"}
              alt={config.logo.alt || "Logo"}
              style={{ height: config.logo.height || "60px", marginRight: showTitle ? "15px" : "0" }}
            />
          )}
          {showTitle && config.title && (
            <h1
              style={{
                color: config.title.color || "#333333",
                fontSize: config.title.fontSize || "24px",
                fontFamily: config.title.fontFamily || "Arial, sans-serif",
                margin: "0",
              }}
            >
              {config.title.text || t("defaultCompany")}
            </h1>
          )}
        </div>
      </div>

      <Tabs defaultValue="elements">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="elements">Elementos</TabsTrigger>
          <TabsTrigger value="style">Estilo</TabsTrigger>
        </TabsList>

        <TabsContent value="elements" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <Label>Logo</Label>
            <Button variant="outline" size="sm" onClick={toggleLogo} className="flex items-center gap-1">
              {showLogo ? (
                <>
                  <Trash2 size={14} />
                  <span>Remover</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>{t("add")}</span>
                </>
              )}
            </Button>
          </div>

          {showLogo && (
            <div className="space-y-3 pl-4 border-l-2 border-gray-200">
              <div>
                <Label htmlFor="logo-src">{t("imageUrl")}</Label>
                <Input
                  id="logo-src"
                  value={config.logo?.src || ""}
                  onChange={(e) => handleLogoChange({ src: e.target.value })}
                  placeholder="/logo.png"
                />
              </div>
              <div>
                <Label htmlFor="logo-alt">{t("altText")}</Label>
                <Input
                  id="logo-alt"
                  value={config.logo?.alt || ""}
                  onChange={(e) => handleLogoChange({ alt: e.target.value })}
                  placeholder={t("companyLogo")}
                />
              </div>
              <div>
                <Label htmlFor="logo-height">{t("height")}</Label>
                <Input
                  id="logo-height"
                  value={config.logo?.height || ""}
                  onChange={(e) => handleLogoChange({ height: e.target.value })}
                  placeholder="60px"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <Label>Título</Label>
            <Button variant="outline" size="sm" onClick={toggleTitle} className="flex items-center gap-1">
              {showTitle ? (
                <>
                  <Trash2 size={14} />
                  <span>Remover</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>{t("add")}</span>
                </>
              )}
            </Button>
          </div>

          {showTitle && (
            <div className="space-y-3 pl-4 border-l-2 border-gray-200">
              <div>
                <Label htmlFor="title-text">Texto</Label>
                <Input
                  id="title-text"
                  value={config.title?.text || ""}
                  onChange={(e) => handleTitleChange({ text: e.target.value })}
                  placeholder={t("defaultCompany")}
                />
              </div>
              <div>
                <Label>{t("textColor")}</Label>
                <ColorPicker
                  color={config.title?.color || "#333333"}
                  onChange={(color) => handleTitleChange({ color })}
                />
              </div>
              <div>
                <Label htmlFor="title-font-size">{t("fontSize")}</Label>
                <Select
                  value={config.title?.fontSize || "24px"}
                  onValueChange={(value) => handleTitleChange({ fontSize: value })}
                >
                  <SelectTrigger id="title-font-size">
                    <SelectValue placeholder={t("selectSize")} />
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
              <div>
                <Label htmlFor="title-font-family">{t("fontFamily")}</Label>
                <Select
                  value={config.title?.fontFamily || "Arial, sans-serif"}
                  onValueChange={(value) => handleTitleChange({ fontFamily: value })}
                >
                  <SelectTrigger id="title-font-family">
                    <SelectValue placeholder={t("selectFont")} />
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
            </div>
          )}
        </TabsContent>

        <TabsContent value="style" className="space-y-4 pt-4">
          <div>
            <Label>{t("backgroundColor")}</Label>
            <ColorPicker
              color={config.backgroundColor || "#f5f5f5"}
              onChange={(color) => updateConfig({ backgroundColor: color })}
            />
          </div>
          <div>
            <Label htmlFor="header-alignment">{t("alignment")}</Label>
            <Select
              value={config.alignment || "center"}
              onValueChange={(value: "left" | "center" | "right") => updateConfig({ alignment: value })}
            >
              <SelectTrigger id="header-alignment">
                <SelectValue placeholder={t("selectAlignment")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">{t("left")}</SelectItem>
                <SelectItem value="center">{t("center")}</SelectItem>
                <SelectItem value="right">{t("right")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="header-padding">{t("padding")}</Label>
            <Select value={config.padding || "20px"} onValueChange={(value) => updateConfig({ padding: value })}>
              <SelectTrigger id="header-padding">
                <SelectValue placeholder={t("selectPadding")} />
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
