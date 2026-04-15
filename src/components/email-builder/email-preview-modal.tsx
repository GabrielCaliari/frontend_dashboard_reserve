"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/presentation/components/atoms/shadcn-ui/dialog";
import type {
  IEmailComponent,
  IEmailTemplate,
} from "@/src/shared/domain/types/@email-builder";
import type { EmailSettings } from "./email-settings-modal";

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  components: IEmailComponent[];
  settings?: EmailSettings;
}

export default function EmailPreviewModal({
  isOpen,
  onClose,
  components,
  settings = {
    defaultPadding: "10px",
    useHeader: false,
    headerHtml: "",
    headerConfig: {
      backgroundColor: "#f5f5f5",
      alignment: "center",
      padding: "20px",
    },
    useFooter: false,
    footerHtml: "",
    footerConfig: {
      backgroundColor: "#f5f5f5",
      alignment: "center",
      padding: "20px",
    },
  },
}: EmailPreviewModalProps) {
  const t = useTranslations("emailBuilder");
  const [htmlContent, setHtmlContent] = useState("");

  useEffect(() => {
    if (isOpen) {
      const template: IEmailTemplate = {
        components,
        createdAt: new Date().toISOString(),
      };
      setHtmlContent(generateEmailHtml(template));
    }
  }, [isOpen, components, settings]);

  const generateEmailHtml = (template: IEmailTemplate): string => {
    let html = `
 <!DOCTYPE html>
 <html>
 <head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>Email Template</title>
 </head>
 <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
 <table cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">`;

    // Adicionar o cabeçalho se estiver ativado
    if (settings.useHeader) {
      html += `
 <tr>
 <td style="background-color: ${settings.headerConfig.backgroundColor}; text-align: ${settings.headerConfig.alignment}; padding: ${settings.headerConfig.padding};">
 ${settings.headerHtml}
 </td>
 </tr>`;
    }

    template.components.forEach((component) => {
      // Usar o padding configurado ou o padding específico do componente
      const componentPadding = component.padding || settings.defaultPadding;

      switch (component.type) {
        case "text":
          html += `
 <tr>
 <td style="
 padding: ${componentPadding}; 
 text-align: ${component.textAlign || "left"};
 ${component.styles?.join(";") || ""}">
 <div style="
 font-family: ${component.fontFamily || "Arial, sans-serif"};
 font-size: ${component.fontSize || "inherit"};
 font-weight: ${component.fontWeight || "normal"};
 color: ${component.textColor || "inherit"};">${component.content}</div>
 </td>
 </tr>`;
          break;
        case "image":
          html += `
 <tr>
 <td style="
 padding: ${componentPadding}; 
 text-align: center; 
 ${component.styles?.join(";") || ""}">
 <img 
 src="${component.src}" 
 alt="${component.alt || ""}" 
 style="
 max-width: 100%; 
 width: ${component.width || "auto"};
 height: ${component.height || "auto"};
 border-radius: ${component.borderRadius || "0"};
 ${component.imageStyles?.join(";") || ""}"
 >
 </td>
 </tr>`;
          break;
        case "button":
          html += `
 <tr>
 <td style="
 padding: ${componentPadding}; 
 text-align: center; 
 ${component.styles?.join(";") || ""}">
 <a 
 href="${component.href || "#"}" 
 style="
 display: inline-block; 
 padding: ${component.padding || "10px 20px"}; 
 background-color: ${component.backgroundColor || "#007bff"}; 
 color: ${component.color || "#ffffff"}; 
 text-decoration: none; 
 border-radius: ${component.borderRadius || "4px"};
 font-weight: ${component.fontWeight || "normal"};
 font-family: ${component.fontFamily || "Arial, sans-serif"};
 ${component.buttonStyles?.join(";") || ""}"
 >
 ${component.label}
 </a>
 </td>
 </tr>`;
          break;
        case "link":
          html += `
 <tr>
 <td style="
 padding: ${componentPadding}; 
 text-align: ${component.textAlign || "left"};
 ${component.styles?.join(";") || ""}">
 <a 
 href="${component.url || "#"}" 
 style="
 color: ${component.textColor || "#0066cc"}; 
 font-family: ${component.fontFamily || "Arial, sans-serif"};
 font-size: ${component.fontSize || "inherit"};
 font-weight: ${component.fontWeight || "normal"};
 text-decoration: ${component.textDecoration || "underline"};
 display: ${component.display || "inline-block"};"
 >
 ${component.linkText}
 </a>
 </td>
 </tr>`;
          break;
        case "divider":
          html += `
 <tr>
 <td style="
 padding: ${componentPadding}; 
 ${component.styles?.join(";") || ""}">
 <hr style="
 border: none; 
 height: ${component.thickness || "1px"}; 
 width: ${component.width || "100%"};
 background-color: ${component.color || "#e0e0e0"}; 
 ${component.dividerStyles?.join(";") || ""}">
 </td>
 </tr>`;
          break;
      }
    });

    // Adicionar o rodapé se estiver ativado
    if (settings.useFooter) {
      html += `
 <tr>
 <td style="background-color: ${settings.footerConfig.backgroundColor}; text-align: ${settings.footerConfig.alignment}; padding: ${settings.footerConfig.padding};">
 ${settings.footerHtml}
 </td>
 </tr>`;
    }

    html += `
 </table>
 </body>
 </html>`;

    return html;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{t("emailPreviewTitle")}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 border rounded-md p-4 bg-white">
          <iframe
            srcDoc={htmlContent}
            title="Email Preview"
            className="w-full min-h-[500px] border-0"
            sandbox="allow-same-origin"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
