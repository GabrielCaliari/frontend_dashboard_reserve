"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Edit } from "lucide-react"
import HeaderBuilderModal from "./header-builder-modal"
import FooterBuilderModal from "./footer-builder-modal"
import type { HeaderConfig } from "./header-builder"
import type { FooterConfig } from "./footer-builder"
import { Switch } from "@/src/components/ui/switch"

export interface EmailSettings {
  defaultPadding: string
  useHeader: boolean
  blockSpacing: string
  headerHtml?: string
  headerConfig: HeaderConfig
  useFooter: boolean
  footerHtml?: string
  footerConfig: FooterConfig
}

export interface EmailMetadata {
  subject: string
  preheader: string
  fromName: string
}

interface EmailSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  settings: EmailSettings
  onSaveSettings: (settings: EmailSettings) => void
}

export default function EmailSettingsModal({ isOpen, onClose, settings, onSaveSettings }: EmailSettingsModalProps) {
  const t = useTranslations()
  const [localSettings, setLocalSettings] = useState<EmailSettings>(settings)
  const [headerBuilderOpen, setHeaderBuilderOpen] = useState(false)
  const [footerBuilderOpen, setFooterBuilderOpen] = useState(false)

  const handleSave = () => {
    // Gerar HTML para header e footer antes de salvar
    const updatedSettings = {
      ...localSettings,
      headerHtml: generateHeaderHtml(localSettings.headerConfig),
      footerHtml: generateFooterHtml(localSettings.footerConfig),
    }
    onSaveSettings(updatedSettings)
    onClose()
  }

  const generateHeaderHtml = (config: HeaderConfig): string => {
    let html = `<div style="text-align: ${config.alignment || "center"}; padding: ${config.padding || "20px"}; background-color: ${config.backgroundColor || "#f5f5f5"};">`

    if (config.logo) {
      html += `<img src="${config.logo.src}" alt="${config.logo.alt}" style="height: ${config.logo.height};" />`
    }

    if (config.title) {
      html += `<h1 style="margin: ${config.logo ? "10px 0 0 0" : "0"}; color: ${config.title.color}; font-size: ${config.title.fontSize}; font-family: ${config.title.fontFamily};">${config.title.text}</h1>`
    }

    html += `</div>`
    return html
  }

  const generateFooterHtml = (config: FooterConfig): string => {
    let html = `<div style="text-align: ${config.alignment || "center"}; padding: ${config.padding || "20px"}; background-color: ${config.backgroundColor || "#f5f5f5"};">`

    if (config.copyright) {
      html += `<p style="margin: 0; color: ${config.copyright.color}; font-size: ${config.copyright.fontSize};">${config.copyright.text}</p>`
    }

    if (config.links && config.links.items.length > 0) {
      html += `<div style="margin-top: 10px;">`
      config.links.items.forEach((link, index) => {
        html += `<a href="${link.url}" style="color: ${config.links.color}; text-decoration: none; margin: 0 5px;">${link.text}</a>`
        if (index < config.links.items.length - 1) {
          html += ` | `
        }
      })
      html += `</div>`
    }

    if (config.socialLinks && config.socialLinks.items.length > 0) {
      html += `<div style="margin-top: 10px;">`
      config.socialLinks.items.forEach((socialLink) => {
        html += `<a href="${socialLink.url}" title="${socialLink.name}" style="display: inline-block; width: ${config.socialLinks.size}; height: ${config.socialLinks.size}; line-height: ${config.socialLinks.size}; text-align: center; border-radius: 50%; background-color: #007bff; color: #ffffff; text-decoration: none; margin: 0 5px;">${socialLink.name.charAt(0)}</a>`
      })
      html += `</div>`
    }

    html += `</div>`
    return html
  }

  const updateHeaderConfig = (headerConfig: HeaderConfig) => {
    setLocalSettings({
      ...localSettings,
      headerConfig,
    })
  }

  const updateFooterConfig = (footerConfig: FooterConfig) => {
    setLocalSettings({
      ...localSettings,
      footerConfig,
    })
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("emailBuilder.emailSettings")}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">{t("emailBuilder.general")}</TabsTrigger>
              <TabsTrigger value="header">{t("emailBuilder.headerTab")}</TabsTrigger>
              <TabsTrigger value="footer">{t("emailBuilder.footerTab")}</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="default-padding" className="text-right">
                  {t("emailBuilder.defaultPadding")}
                </Label>
                <Input
                  id="default-padding"
                  value={localSettings.defaultPadding}
                  onChange={(e) => setLocalSettings({ ...localSettings, defaultPadding: e.target.value })}
                  className="col-span-3"
                  placeholder={t("emailBuilder.paddingPlaceholder")}
                />
              </div>
            </TabsContent>

            <TabsContent value="header" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="use-header" className="cursor-pointer">
                  {t("emailBuilder.useDefaultHeader")}
                </Label>
                <Switch
                  id="use-header"
                  checked={localSettings.useHeader}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, useHeader: checked })}
                />
              </div>

              {localSettings.useHeader && (
                <div className="border rounded-md p-4 mt-4 relative">
                  <div className="absolute top-2 right-2">
                    <Button variant="ghost" size="icon" onClick={() => setHeaderBuilderOpen(true)} className="h-8 w-8">
                      <Edit size={16} />
                    </Button>
                  </div>
                  <div
                    className="p-4 border rounded-md"
                    style={{ backgroundColor: localSettings.headerConfig.backgroundColor || "#f5f5f5" }}
                  >
                    <div
                      className="flex items-center"
                      style={{
                        justifyContent:
                          localSettings.headerConfig.alignment === "left"
                            ? "flex-start"
                            : localSettings.headerConfig.alignment === "right"
                              ? "flex-end"
                              : "center",
                        padding: localSettings.headerConfig.padding || "20px",
                      }}
                    >
                      {localSettings.headerConfig.logo && (
                        <img
                          src={localSettings.headerConfig.logo.src || "/abstract-logo.png"}
                          alt={localSettings.headerConfig.logo.alt || "Logo"}
                          style={{
                            height: localSettings.headerConfig.logo.height || "60px",
                            marginRight: localSettings.headerConfig.title ? "15px" : "0",
                          }}
                        />
                      )}
                      {localSettings.headerConfig.title && (
                        <h1
                          style={{
                            color: localSettings.headerConfig.title.color || "#333333",
                            fontSize: localSettings.headerConfig.title.fontSize || "24px",
                            fontFamily: localSettings.headerConfig.title.fontFamily || "Arial, sans-serif",
                            margin: "0",
                          }}
                        >
                          {localSettings.headerConfig.title.text || t("emailBuilder.defaultCompany")}
                        </h1>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {t("emailBuilder.editHeaderInfo")}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="footer" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="use-footer" className="cursor-pointer">
                  {t("emailBuilder.useDefaultFooter")}
                </Label>
                <Switch
                  id="use-footer"
                  checked={localSettings.useFooter}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, useFooter: checked })}
                />
              </div>

              {localSettings.useFooter && (
                <div className="border rounded-md p-4 mt-4 relative">
                  <div className="absolute top-2 right-2">
                    <Button variant="ghost" size="icon" onClick={() => setFooterBuilderOpen(true)} className="h-8 w-8">
                      <Edit size={16} />
                    </Button>
                  </div>
                  <div
                    className="p-4 border rounded-md"
                    style={{ backgroundColor: localSettings.footerConfig.backgroundColor || "#f5f5f5" }}
                  >
                    <div
                      className="flex flex-col items-center space-y-3"
                      style={{
                        alignItems:
                          localSettings.footerConfig.alignment === "left"
                            ? "flex-start"
                            : localSettings.footerConfig.alignment === "right"
                              ? "flex-end"
                              : "center",
                        padding: localSettings.footerConfig.padding || "20px",
                      }}
                    >
                      {localSettings.footerConfig.copyright && (
                        <p
                          style={{
                            color: localSettings.footerConfig.copyright.color || "#666666",
                            fontSize: localSettings.footerConfig.copyright.fontSize || "14px",
                            margin: "0",
                          }}
                        >
                          {localSettings.footerConfig.copyright.text ||
                            t("emailBuilder.defaultCopyright", { year: new Date().getFullYear() })}
                        </p>
                      )}

                      {localSettings.footerConfig.links && localSettings.footerConfig.links.items.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                          {localSettings.footerConfig.links.items.map((link, index) => (
                            <span
                              key={index}
                              style={{
                                color: localSettings.footerConfig.links?.color || "#007bff",
                                margin: "0 5px",
                              }}
                            >
                              {link.text}
                              {index < (localSettings.footerConfig.links?.items.length || 0) - 1 && " | "}
                            </span>
                          ))}
                        </div>
                      )}

                      {localSettings.footerConfig.socialLinks &&
                        localSettings.footerConfig.socialLinks.items.length > 0 && (
                          <div className="flex gap-3 mt-2">
                            {localSettings.footerConfig.socialLinks.items.map((socialLink) => (
                              <span
                                key={socialLink.id}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: localSettings.footerConfig.socialLinks?.size || "24px",
                                  height: localSettings.footerConfig.socialLinks?.size || "24px",
                                  borderRadius: "50%",
                                  backgroundColor: "#007bff",
                                  color: "#ffffff",
                                  textDecoration: "none",
                                }}
                              >
                                {socialLink.name.charAt(0)}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {t("emailBuilder.editFooterInfo")}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HeaderBuilderModal
        isOpen={headerBuilderOpen}
        onClose={() => setHeaderBuilderOpen(false)}
        config={localSettings.headerConfig}
        onSave={updateHeaderConfig}
      />

      <FooterBuilderModal
        isOpen={footerBuilderOpen}
        onClose={() => setFooterBuilderOpen(false)}
        config={localSettings.footerConfig}
        onSave={updateFooterConfig}
      />
    </>
  )
}
