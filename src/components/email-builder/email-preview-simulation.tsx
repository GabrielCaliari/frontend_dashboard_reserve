"use client"

import { useTranslations } from"next-intl"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from"@/src/components/ui/dialog"
import { Button } from"@/src/components/ui/button"
import type { IEmailComponent, IEmailTemplate } from"@/src/common/@types/@email-builder"
import type { EmailSettings } from"./email-settings-modal"
import type { EmailMetadata } from"./email-save-modal"
import { ArrowLeft, Check } from"lucide-react"

interface EmailPreviewSimulationProps {
 isOpen: boolean
 onClose: () => void
 onBack: () => void
 onComplete: () => void
 components: IEmailComponent[]
 settings: EmailSettings
 metadata: EmailMetadata
 email: string
}

export default function EmailPreviewSimulation({
 isOpen,
 onClose,
 onBack,
 onComplete,
 components,
 settings,
 metadata,
 email,
}: EmailPreviewSimulationProps) {
 const t = useTranslations("emailBuilder")
 const { subject, preheader } = metadata

 // Gerar o HTML do email para a visualização
 const generateEmailHtml = (): string => {
 const template: IEmailTemplate = {
 components,
 createdAt: new Date().toISOString(),
 }

 let html =`
 <!DOCTYPE html>
 <html>
 <head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>Email Template</title>
 </head>
 <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
 <table cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">`

 // Adicionar o cabeçalho se estiver ativado
 if (settings.useHeader) {
 html +=`
 <tr>
 <td>
 ${settings.headerHtml}
 </td>
 </tr>`
 }

 components.forEach((component) => {
 // Usar o padding configurado ou o padding específico do componente
 const componentPadding = component.padding || settings.defaultPadding

 switch (component.type) {
 case"text":
 html +=`
 <tr>
 <td style="
 padding: ${componentPadding}; 
 text-align: ${component.textAlign ||"left"};
 ${component.styles?.join(";") ||""}">
 <div style="
 font-family: ${component.fontFamily ||"Arial, sans-serif"};
 font-size: ${component.fontSize ||"inherit"};
 font-weight: ${component.fontWeight ||"normal"};
 color: ${component.textColor ||"inherit"};">${component.content}</div>
 </td>
 </tr>`
 break
 case"image":
 html +=`
 <tr>
 <td style="
 padding: ${componentPadding}; 
 text-align: center; 
 ${component.styles?.join(";") ||""}">
 <img 
 src="${component.src}" 
 alt="${component.alt ||""}" 
 style="
 max-width: 100%; 
 width: ${component.width ||"auto"};
 height: ${component.height ||"auto"};
 border-radius: ${component.borderRadius ||"0"};
 ${component.imageStyles?.join(";") ||""}"
 >
 </td>
 </tr>`
 break
 case"button":
 html +=`
 <tr>
 <td style="
 padding: ${componentPadding}; 
 text-align: center; 
 ${component.styles?.join(";") ||""}">
 <a 
 href="${component.href ||"#"}" 
 style="
 display: inline-block; 
 padding: ${component.padding ||"10px 20px"}; 
 background-color: ${component.backgroundColor ||"#007bff"}; 
 color: ${component.color ||"#ffffff"}; 
 text-decoration: none; 
 border-radius: ${component.borderRadius ||"4px"};
 font-weight: ${component.fontWeight ||"normal"};
 font-family: ${component.fontFamily ||"Arial, sans-serif"};
 ${component.buttonStyles?.join(";") ||""}"
 >
 ${component.label}
 </a>
 </td>
 </tr>`
 break
 case"link":
 html +=`
 <tr>
 <td style="
 padding: ${componentPadding}; 
 text-align: ${component.textAlign ||"left"};
 ${component.styles?.join(";") ||""}">
 <a 
 href="${component.url ||"#"}" 
 style="
 color: ${component.textColor ||"#0066cc"}; 
 font-family: ${component.fontFamily ||"Arial, sans-serif"};
 font-size: ${component.fontSize ||"inherit"};
 font-weight: ${component.fontWeight ||"normal"};
 text-decoration: ${component.textDecoration ||"underline"};
 display: ${component.display ||"inline-block"};"
 >
 ${component.linkText}
 </a>
 </td>
 </tr>`
 break
 case"divider":
 html +=`
 <tr>
 <td style="
 padding: ${componentPadding}; 
 ${component.styles?.join(";") ||""}">
 <hr style="
 border: none; 
 height: ${component.thickness ||"1px"}; 
 width: ${component.width ||"100%"};
 background-color: ${component.color ||"#e0e0e0"}; 
 ${component.dividerStyles?.join(";") ||""}">
 </td>
 </tr>`
 break
 }
 })

 // Adicionar o rodapé se estiver ativado
 if (settings.useFooter) {
 html +=`
 <tr>
 <td>
 ${settings.footerHtml}
 </td>
 </tr>`
 }

 html +=`
 </table>
 </body>
 </html>`

 return html
 }

 return (
 <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
 <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
 <DialogHeader>
 <DialogTitle>{t("finalPreview")}</DialogTitle>
 </DialogHeader>

 <div className="space-y-6 py-4">
 {/* Simulação de um cliente de email (estilo Gmail) */}
 <div className="border rounded-lg overflow-hidden">
 {/* Cabeçalho do email */}
 <div className="bg-default-100 p-4 border-b">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
 M
 </div>
 <div className="flex-1">
 <div className="font-medium">{subject}</div>
 <div className="text-sm text-muted-foreground truncate">{preheader}</div>
 </div>
 </div>
 </div>

 {/* Corpo do email */}
 <div className="bg-white p-4">
 <iframe
 srcDoc={generateEmailHtml()}
 title="Email Preview"
 className="w-full min-h-[400px] border-0"
 sandbox="allow-same-origin"
 />
 </div>
 </div>

 <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
 <h3 className="text-sm font-medium text-yellow-800 mb-2">{t("emailInfo")}</h3>
 <div className="space-y-2">
 <div>
 <span className="text-sm font-medium">{t("subject")}</span>
 <span className="text-sm ml-2">{subject}</span>
 </div>
 <div>
 <span className="text-sm font-medium">{t("preHeaderLabel")}</span>
 <span className="text-sm ml-2">{preheader || t("noPreHeader")}</span>
 </div>
 </div>
 </div>
 </div>

 <DialogFooter className="flex justify-between">
 <Button variant="outline" onClick={onBack} className="flex items-center gap-1">
 <ArrowLeft size={16} />
 <span>{t("backToEdit")}</span>
 </Button>
 <Button onClick={onComplete} className="flex items-center gap-1">
 <Check size={16} />
 <span>{t("complete")}</span>
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 )
}
