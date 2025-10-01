"use client"

import { useState } from "react"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Button } from "@/src/components/ui/button"
import { ColorPicker } from "./color-picker"
import { Trash2, Plus } from "lucide-react"

export interface SocialLink {
  id: string
  name: string
  url: string
  icon: string
}

export interface FooterConfig {
  copyright?: {
    text: string
    color: string
    fontSize: string
  }
  links?: {
    items: { text: string; url: string }[]
    color: string
  }
  socialLinks?: {
    items: SocialLink[]
    size: string
  }
  backgroundColor: string
  alignment: "left" | "center" | "right"
  padding: string
}

interface FooterBuilderProps {
  config: FooterConfig
  onChange: (config: FooterConfig) => void
}

export default function FooterBuilder({ config, onChange }: FooterBuilderProps) {
  const [showCopyright, setShowCopyright] = useState(!!config.copyright)
  const [showLinks, setShowLinks] = useState(!!config.links)
  const [showSocialLinks, setShowSocialLinks] = useState(!!config.socialLinks)

  const updateConfig = (updates: Partial<FooterConfig>) => {
    onChange({ ...config, ...updates })
  }

  const handleCopyrightChange = (updates: Partial<FooterConfig["copyright"]>) => {
    const updatedCopyright = {
      ...(config.copyright || { text: "", color: "#666666", fontSize: "14px" }),
      ...updates,
    }
    updateConfig({ copyright: updatedCopyright })
  }

  const handleLinksChange = (updates: Partial<FooterConfig["links"]>) => {
    const updatedLinks = {
      ...(config.links || { items: [{ text: "Política de Privacidade", url: "#" }], color: "#007bff" }),
      ...updates,
    }
    updateConfig({ links: updatedLinks })
  }

  const handleSocialLinksChange = (updates: Partial<FooterConfig["socialLinks"]>) => {
    const updatedSocialLinks = {
      ...(config.socialLinks || {
        items: [
          { id: "1", name: "Facebook", url: "#", icon: "facebook" },
          { id: "2", name: "Twitter", url: "#", icon: "twitter" },
        ],
        size: "24px",
      }),
      ...updates,
    }
    updateConfig({ socialLinks: updatedSocialLinks })
  }

  const addLink = () => {
    const links = config.links?.items || []
    handleLinksChange({
      items: [...links, { text: "Novo Link", url: "#" }],
    })
  }

  const updateLink = (index: number, field: "text" | "url", value: string) => {
    if (!config.links) return

    const newLinks = [...config.links.items]
    newLinks[index] = { ...newLinks[index], [field]: value }

    handleLinksChange({ items: newLinks })
  }

  const removeLink = (index: number) => {
    if (!config.links) return

    const newLinks = [...config.links.items]
    newLinks.splice(index, 1)

    handleLinksChange({ items: newLinks })
  }

  const addSocialLink = () => {
    const socialLinks = config.socialLinks?.items || []
    handleSocialLinksChange({
      items: [
        ...socialLinks,
        {
          id: Date.now().toString(),
          name: "Instagram",
          url: "#",
          icon: "instagram",
        },
      ],
    })
  }

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    if (!config.socialLinks) return

    const newSocialLinks = [...config.socialLinks.items]
    newSocialLinks[index] = { ...newSocialLinks[index], [field]: value }

    handleSocialLinksChange({ items: newSocialLinks })
  }

  const removeSocialLink = (index: number) => {
    if (!config.socialLinks) return

    const newSocialLinks = [...config.socialLinks.items]
    newSocialLinks.splice(index, 1)

    handleSocialLinksChange({ items: newSocialLinks })
  }

  const toggleCopyright = () => {
    if (showCopyright) {
      // Remove copyright
      const { copyright, ...rest } = config
      onChange(rest)
      setShowCopyright(false)
    } else {
      // Add default copyright
      updateConfig({
        copyright: {
          text: `© ${new Date().getFullYear()} Minha Empresa. Todos os direitos reservados.`,
          color: "#666666",
          fontSize: "14px",
        },
      })
      setShowCopyright(true)
    }
  }

  const toggleLinks = () => {
    if (showLinks) {
      // Remove links
      const { links, ...rest } = config
      onChange(rest)
      setShowLinks(false)
    } else {
      // Add default links
      updateConfig({
        links: {
          items: [
            { text: "Política de Privacidade", url: "#" },
            { text: "Termos de Uso", url: "#" },
          ],
          color: "#007bff",
        },
      })
      setShowLinks(true)
    }
  }

  const toggleSocialLinks = () => {
    if (showSocialLinks) {
      // Remove social links
      const { socialLinks, ...rest } = config
      onChange(rest)
      setShowSocialLinks(false)
    } else {
      // Add default social links
      updateConfig({
        socialLinks: {
          items: [
            { id: "1", name: "Facebook", url: "#", icon: "facebook" },
            { id: "2", name: "Twitter", url: "#", icon: "twitter" },
            { id: "3", name: "Instagram", url: "#", icon: "instagram" },
          ],
          size: "24px",
        },
      })
      setShowSocialLinks(true)
    }
  }

  const fontSizes = [
    { value: "12px", label: "12px" },
    { value: "13px", label: "13px" },
    { value: "14px", label: "14px" },
    { value: "16px", label: "16px" },
    { value: "18px", label: "18px" },
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

  const socialIcons = [
    { value: "facebook", label: "Facebook" },
    { value: "twitter", label: "Twitter" },
    { value: "instagram", label: "Instagram" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "youtube", label: "YouTube" },
    { value: "github", label: "GitHub" },
  ]

  const renderSocialIcon = (icon: string) => {
    switch (icon) {
      case "facebook":
        return "F"
      case "twitter":
        return "T"
      case "instagram":
        return "I"
      case "linkedin":
        return "L"
      case "youtube":
        return "Y"
      case "github":
        return "G"
      default:
        return "S"
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-md mb-4" style={{ backgroundColor: config.backgroundColor || "#f5f5f5" }}>
        <div
          className="flex flex-col items-center space-y-3"
          style={{
            alignItems:
              config.alignment === "left" ? "flex-start" : config.alignment === "right" ? "flex-end" : "center",
            padding: config.padding || "20px",
          }}
        >
          {showCopyright && config.copyright && (
            <p
              style={{
                color: config.copyright.color || "#666666",
                fontSize: config.copyright.fontSize || "14px",
                margin: "0",
              }}
            >
              {config.copyright.text || `© ${new Date().getFullYear()} Minha Empresa. Todos os direitos reservados.`}
            </p>
          )}

          {showLinks && config.links && config.links.items.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {config.links.items.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  style={{
                    color: config.links.color || "#007bff",
                    textDecoration: "none",
                    margin: "0 5px",
                  }}
                >
                  {link.text}
                </a>
              ))}
            </div>
          )}

          {showSocialLinks && config.socialLinks && config.socialLinks.items.length > 0 && (
            <div className="flex gap-3 mt-2">
              {config.socialLinks.items.map((socialLink, index) => (
                <a
                  key={socialLink.id}
                  href={socialLink.url}
                  title={socialLink.name}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: config.socialLinks?.size || "24px",
                    height: config.socialLinks?.size || "24px",
                    borderRadius: "50%",
                    backgroundColor: "#007bff",
                    color: "#ffffff",
                    textDecoration: "none",
                  }}
                >
                  {renderSocialIcon(socialLink.icon)}
                </a>
              ))}
            </div>
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
            <Label>Copyright</Label>
            <Button variant="outline" size="sm" onClick={toggleCopyright} className="flex items-center gap-1">
              {showCopyright ? (
                <>
                  <Trash2 size={14} />
                  <span>Remover</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Adicionar</span>
                </>
              )}
            </Button>
          </div>

          {showCopyright && (
            <div className="space-y-3 pl-4 border-l-2 border-gray-200">
              <div>
                <Label htmlFor="copyright-text">Texto</Label>
                <Input
                  id="copyright-text"
                  value={config.copyright?.text || ""}
                  onChange={(e) => handleCopyrightChange({ text: e.target.value })}
                  placeholder={`© ${new Date().getFullYear()} Minha Empresa. Todos os direitos reservados.`}
                />
              </div>
              <div>
                <Label>Cor do Texto</Label>
                <ColorPicker
                  color={config.copyright?.color || "#666666"}
                  onChange={(color) => handleCopyrightChange({ color })}
                />
              </div>
              <div>
                <Label htmlFor="copyright-font-size">Tamanho da Fonte</Label>
                <Select
                  value={config.copyright?.fontSize || "14px"}
                  onValueChange={(value) => handleCopyrightChange({ fontSize: value })}
                >
                  <SelectTrigger id="copyright-font-size">
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
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <Label>Links</Label>
            <Button variant="outline" size="sm" onClick={toggleLinks} className="flex items-center gap-1">
              {showLinks ? (
                <>
                  <Trash2 size={14} />
                  <span>Remover</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Adicionar</span>
                </>
              )}
            </Button>
          </div>

          {showLinks && (
            <div className="space-y-3 pl-4 border-l-2 border-gray-200">
              <div>
                <Label>Cor dos Links</Label>
                <ColorPicker
                  color={config.links?.color || "#007bff"}
                  onChange={(color) => handleLinksChange({ color })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Links de Rodapé</Label>
                  <Button variant="outline" size="sm" onClick={addLink} className="flex items-center gap-1">
                    <Plus size={14} />
                    <span>Adicionar Link</span>
                  </Button>
                </div>

                {config.links?.items.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 border p-2 rounded-md">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        value={link.text}
                        onChange={(e) => updateLink(index, "text", e.target.value)}
                        placeholder="Texto do Link"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => updateLink(index, "url", e.target.value)}
                        placeholder="URL"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLink(index)}
                      className="h-8 w-8 text-red-500"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <Label>Redes Sociais</Label>
            <Button variant="outline" size="sm" onClick={toggleSocialLinks} className="flex items-center gap-1">
              {showSocialLinks ? (
                <>
                  <Trash2 size={14} />
                  <span>Remover</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Adicionar</span>
                </>
              )}
            </Button>
          </div>

          {showSocialLinks && (
            <div className="space-y-3 pl-4 border-l-2 border-gray-200">
              <div>
                <Label htmlFor="social-size">Tamanho dos Ícones</Label>
                <Select
                  value={config.socialLinks?.size || "24px"}
                  onValueChange={(value) => handleSocialLinksChange({ size: value })}
                >
                  <SelectTrigger id="social-size">
                    <SelectValue placeholder="Selecione um tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20px">Pequeno (20px)</SelectItem>
                    <SelectItem value="24px">Médio (24px)</SelectItem>
                    <SelectItem value="32px">Grande (32px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Ícones de Redes Sociais</Label>
                  <Button variant="outline" size="sm" onClick={addSocialLink} className="flex items-center gap-1">
                    <Plus size={14} />
                    <span>Adicionar Rede</span>
                  </Button>
                </div>

                {config.socialLinks?.items.map((socialLink, index) => (
                  <div key={socialLink.id} className="flex items-center gap-2 border p-2 rounded-md">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Input
                        value={socialLink.name}
                        onChange={(e) => updateSocialLink(index, "name", e.target.value)}
                        placeholder="Nome"
                      />
                      <Input
                        value={socialLink.url}
                        onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                        placeholder="URL"
                      />
                      <Select value={socialLink.icon} onValueChange={(value) => updateSocialLink(index, "icon", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Ícone" />
                        </SelectTrigger>
                        <SelectContent>
                          {socialIcons.map((icon) => (
                            <SelectItem key={icon.value} value={icon.value}>
                              {icon.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSocialLink(index)}
                      className="h-8 w-8 text-red-500"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="style" className="space-y-4 pt-4">
          <div>
            <Label>Cor de Fundo</Label>
            <ColorPicker
              color={config.backgroundColor || "#f5f5f5"}
              onChange={(color) => updateConfig({ backgroundColor: color })}
            />
          </div>
          <div>
            <Label htmlFor="footer-alignment">Alinhamento</Label>
            <Select
              value={config.alignment || "center"}
              onValueChange={(value: "left" | "center" | "right") => updateConfig({ alignment: value })}
            >
              <SelectTrigger id="footer-alignment">
                <SelectValue placeholder="Selecione um alinhamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Esquerda</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="right">Direita</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="footer-padding">Espaçamento (Padding)</Label>
            <Select value={config.padding || "20px"} onValueChange={(value) => updateConfig({ padding: value })}>
              <SelectTrigger id="footer-padding">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
