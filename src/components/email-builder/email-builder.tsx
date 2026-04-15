"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ComponentSidebar from "./component-sidebar";
import EmailCanvas from "./email-canvas";
import PropertiesPanel from "./properties-panel";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";
import { Settings, Download, Save } from "lucide-react";
import EmailPreviewModal from "./email-preview-modal";
import EmailSettingsModal, {
  EmailMetadata,
  type EmailSettings,
} from "./email-settings-modal";
import {
  convertHtmlToMarkdown,
  convertHeaderToMarkdown,
  convertFooterToMarkdown,
} from "@/src/shared/lib/html-to-markdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/presentation/components/atoms/shadcn-ui/dropdown-menu";
import {
  IEmailComponent,
  IEmailTemplate,
} from "@/src/shared/domain/types/@email-builder";
import toast from "react-hot-toast";
import EmailSaveModal from "./email-save-modal";
import EmailPreviewSimulation from "./email-preview-simulation";
import createPrimaryCopyService from "@/src/common/services/email-campaign/create-primary-copy-service";
import { IEmailCampaign } from "@/src/shared/domain/types/@email-campaign";
import { IEmail } from "@/src/shared/domain/types/@email";
import listDeliveriesByCampaignBatchIdService from "@/src/common/services/campaign-batch/list-deliveries-by-campaign-batch-id-service";
import updateCopyEmailByCampaignBatchIdService from "@/src/common/services/campaign-batch/update-copy-email-by-campaign-batch-id-service";

export default function EmailBuilder({
  email,
  campaignBatchId,
  campaign,
  primaryCopy,
  isPrimaryCopy = true,
}: {
  email: string;
  campaignBatchId?: string;
  campaign?: IEmailCampaign;
  primaryCopy: IEmail;
  isPrimaryCopy?: boolean;
}) {
  const t = useTranslations();
  const [emailComponents, setEmailComponents] = useState<IEmailComponent[]>([]);
  const [selectedComponent, setSelectedComponent] =
    useState<IEmailComponent | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [previewSimulationOpen, setPreviewSimulationOpen] = useState(false);
  const [emailMetadata, setEmailMetadata] = useState<EmailMetadata>({
    subject: "",
    preheader: "",
    fromName: "",
  });

  // Add state for multi-selection
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  // Add state for email settings
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    defaultPadding: "10px",
    blockSpacing: "16px",
    useHeader: false,
    headerHtml: "",
    headerConfig: {
      backgroundColor: "#f5f5f5",
      alignment: "center",
      padding: "20px",
      logo: {
        src: "/abstract-logo.png",
        alt: "Logo",
        height: "60px",
      },
      title: {
        text: t("emailBuilder.defaultCompany"),
        color: "#333333",
        fontSize: "24px",
        fontFamily: "Arial, sans-serif",
      },
    },
    useFooter: false,
    footerHtml: "",
    footerConfig: {
      backgroundColor: "#f5f5f5",
      alignment: "center",
      padding: "20px",
      copyright: {
        text: t("emailBuilder.defaultCopyright", {
          year: new Date().getFullYear(),
        }),
        color: "#666666",
        fontSize: "14px",
      },
      links: {
        items: [
          { text: "Política de Privacidade", url: "#" },
          { text: "Termos de Uso", url: "#" },
        ],
        color: "#007bff",
      },
      socialLinks: {
        items: [
          { id: "1", name: "Facebook", url: "#", icon: "facebook" },
          { id: "2", name: "Twitter", url: "#", icon: "twitter" },
          { id: "3", name: "Instagram", url: "#", icon: "instagram" },
        ],
        size: "24px",
      },
    },
  });

  const handleSaveClick = () => {
    setSaveModalOpen(true);
  };

  const handleSaveMetadata = (metadata: EmailMetadata) => {
    setEmailMetadata(metadata);
    setSaveModalOpen(false);
    setPreviewSimulationOpen(true);
  };

  const handleCompleteSave = async () => {
    setPreviewSimulationOpen(false);

    const template: IEmailTemplate = {
      components: emailComponents,
      createdAt: new Date().toISOString(),
    };

    const emailHtml = generateEmailHtml(template, true);
    const emailMarkdown = exportEmailToAIFriendlyMarkdown();

    const data = {
      html: emailHtml,
      md: emailMarkdown,
      subject: emailMetadata.subject,
      pre_header: emailMetadata.preheader,
      from_name: emailMetadata.fromName,
      use_header: emailSettings.useHeader,
      use_footer: emailSettings.useFooter,
    };

    if (isPrimaryCopy) {
      const response = await createPrimaryCopyService(
        String(campaign?.id),
        data,
      );

      if (response.error) {
        toast.error(response.message);
      } else {
        toast.success("Email salvo com sucesso!");
      }
    } else {
      const response = await updateCopyEmailByCampaignBatchIdService(
        String(campaignBatchId),
        data,
      );

      if (response.error) {
        toast.error(response.message);
      } else {
        toast.success("Email salvo com sucesso!");
      }
    }
  };

  const addComponent = (component: IEmailComponent) => {
    // Remova a propriedade isNew se existir (usada apenas para controle de drag-and-drop)
    const { isNew, ...cleanComponent } = component as IEmailComponent & {
      isNew?: boolean;
    };

    // Cria uma cópia do componente com um novo ID único
    const newComponent = {
      ...cleanComponent,
      id: `${component.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    // Adiciona o novo componente ao final da lista
    setEmailComponents((prevComponents) => [...prevComponents, newComponent]);

    // Opcional: selecionar o componente recém-adicionado
    setSelectedComponent(newComponent);
  };

  const updateComponent = (updatedComponent: IEmailComponent) => {
    setEmailComponents(
      emailComponents.map((comp) =>
        comp.id === updatedComponent.id ? updatedComponent : comp,
      ),
    );
    setSelectedComponent(updatedComponent);
  };

  const removeComponent = (id: string) => {
    setEmailComponents(emailComponents.filter((comp) => comp.id !== id));
    if (selectedComponent?.id === id) {
      setSelectedComponent(null);
    }
    // Remove from selected blocks if it's selected
    if (selectedBlocks.includes(id)) {
      setSelectedBlocks(selectedBlocks.filter((blockId) => blockId !== id));
    }
  };

  const moveComponent = (dragIndex: number, hoverIndex: number) => {
    const draggedComponent = emailComponents[dragIndex];
    const newComponents = [...emailComponents];
    newComponents.splice(dragIndex, 1);
    newComponents.splice(hoverIndex, 0, draggedComponent);
    setEmailComponents(newComponents);
  };

  // New function to move multiple components
  const moveMultipleComponents = (
    dragIndices: number[],
    targetIndex: number,
  ) => {
    // Sort indices in descending order to avoid index shifting when removing
    const sortedIndices = [...dragIndices].sort((a, b) => b - a);

    // Create a copy of the components
    const newComponents = [...emailComponents];

    // Extract the components to move
    const componentsToMove: IEmailComponent[] = [];
    sortedIndices.forEach((index) => {
      componentsToMove.unshift(newComponents[index]);
    });

    // Remove the components from their original positions
    sortedIndices.forEach((index) => {
      newComponents.splice(index, 1);
    });

    // Calculate the new target index after removals
    let adjustedTargetIndex = targetIndex;
    dragIndices.forEach((dragIndex) => {
      if (dragIndex < targetIndex) {
        adjustedTargetIndex--;
      }
    });

    // Insert the components at the target position
    newComponents.splice(adjustedTargetIndex, 0, ...componentsToMove);

    // Update the state
    setEmailComponents(newComponents);

    // Clear selection after move
    setSelectedBlocks([]);
  };

  // Toggle block selection
  const toggleBlockSelection = (id: string) => {
    setSelectedBlocks((prev) =>
      prev.includes(id)
        ? prev.filter((blockId) => blockId !== id)
        : [...prev, id],
    );
  };

  // Select or deselect all blocks
  const toggleSelectAll = () => {
    if (selectedBlocks.length === emailComponents.length) {
      setSelectedBlocks([]);
    } else {
      setSelectedBlocks(emailComponents.map((comp) => comp.id));
    }
  };

  // Função para exportar markdown amigável para IA
  const exportEmailToAIFriendlyMarkdown = () => {
    let markdown = "";

    // Cabeçalho
    if (emailSettings.useHeader && emailSettings.headerHtml) {
      markdown += `<!-- HEADER INÍCIO -->\n${convertHeaderToMarkdown(emailSettings.headerHtml)}\n<!-- HEADER FIM -->\n\n`;
    }

    emailComponents.forEach((component, idx) => {
      switch (component.type) {
        case "text":
          markdown += `<!-- BLOCO TEXTO ${idx + 1} INÍCIO -->\n${component.content}\n<!-- BLOCO TEXTO ${idx + 1} FIM -->\n\n`;
          break;
        case "image":
          markdown += `![${component.alt || ""}](${component.src})\n\n`;
          break;
        case "button":
          markdown += `[Botão: ${component.label}](${component.href || "#"})\n\n`;
          break;
        case "link":
          markdown += `[${component.linkText}](${component.url || "#"})\n\n`;
          break;
        case "divider":
          markdown += `---\n\n`;
          break;
        default:
          break;
      }
    });

    // Rodapé
    if (emailSettings.useFooter && emailSettings.footerHtml) {
      markdown += `\n<!-- FOOTER INÍCIO -->\n${convertFooterToMarkdown(emailSettings.footerHtml)}\n<!-- FOOTER FIM -->\n`;
    }

    return markdown.trim();
  };

  const exportEmail = (format: "html" | "markdown") => {
    const template: IEmailTemplate = {
      components: emailComponents,
      createdAt: new Date().toISOString(),
    };

    // Gerar HTML
    const emailHtml = generateEmailHtml(template);

    let content: string;
    let mimeType: string;
    let fileExtension: string;

    if (format === "html") {
      content = emailHtml;
      mimeType = "text/html";
      fileExtension = "html";
    } else {
      // Usar markdown amigável para IA
      content = exportEmailToAIFriendlyMarkdown();
      mimeType = "text/markdown";
      fileExtension = "md";
    }

    // Criar um blob e fazer download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-template-${new Date().getTime()}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateEmailHtml = (
    template: IEmailTemplate,
    str: boolean = false,
  ): string => {
    // Conteúdo interno do body
    let content = `
 <div style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
 <table cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">`;

    // Adicionar o cabeçalho se estiver ativado
    if (emailSettings.useHeader) {
      content += `
 <!-- HEADER -->`;
    }

    template.components.forEach((component: IEmailComponent, idx: number) => {
      const componentPadding =
        component.padding || emailSettings.defaultPadding;
      switch (component.type) {
        case "text":
          content += `
 <tr>
 <td style="
 padding: ${componentPadding}; 
 text-align: ${component.textAlign || "left"};
 ${component.styles?.join(";") || ""}">
 <div style="
 font-family: ${component.fontFamily || "Arial, sans-serif"};
 font-size: ${component.fontSize || "inherit"};
 font-weight: ${component.fontWeight || "normal"};
 color: ${component.textColor || "inherit"};"
 data-text
 >${component.content}</div>
 </td>
 </tr>`;
          break;
        case "image":
          content += `
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
 data-image
 >
 </td>
 </tr>`;
          break;
        case "button":
          content += `
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
 data-button
 >
 ${component.label}
 </a>
 </td>
 </tr>`;
          break;
        case "link":
          content += `
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
 data-link
 >
 ${component.linkText}
 </a>
 </td>
 </tr>`;
          break;
        case "divider":
          content += `
 <tr>
 <td style="
 padding: ${componentPadding}; 
 ${component.styles?.join(";") || ""}">
 <hr 
 data-divider
 style="
 border: none; 
 height: ${component.thickness || "1px"}; 
 width: ${component.width || "100%"};
 background-color: ${component.color || "#e0e0e0"}; 
 ${component.dividerStyles?.join(";") || ""}">
 </td>
 </tr>`;
          break;
      }
      if (idx < template.components.length - 1) {
        content += `
 <tr>
 <td style="height: ${emailSettings.blockSpacing}; line-height: 1; font-size: 1px;">&nbsp;</td>
 </tr>`;
      }
    });

    // Adicionar o rodapé se estiver ativado
    if (emailSettings.useFooter) {
      content += `
 <!-- FOOTER -->`;
    }

    content += `</table></div>`;

    // Montar o HTML completo
    const html = `
 <!DOCTYPE html>
 <html>
 <head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>Email Template</title>
 </head>
 <body>
 ${emailSettings.useHeader ? `<tr><td>${emailSettings.headerHtml}</td></tr>` : ""}
 ${content
   .replace("<!-- HEADER AQUI -->", "")
   .replace(
     "<!-- FOOTER AQUI -->",
     emailSettings.useFooter
       ? `<tr><td>${emailSettings.footerHtml}</td></tr>`
       : "",
   )}
 </body>
 </html>`;

    return str ? content : html;
  };

  // Função para converter HTML puro em blocos do construtor
  function parseHtmlToBlocks(html: string): IEmailComponent[] {
    const parser =
      typeof window !== "undefined" ? new window.DOMParser() : null;
    if (!parser) return [];
    const doc = parser.parseFromString(html, "text/html");
    const table = doc.querySelector("table");
    if (!table) return [];
    const blocks: IEmailComponent[] = [];
    const rows = Array.from(table.querySelectorAll("tr"));
    rows.forEach((tr, idx) => {
      const td = tr.querySelector("td");
      if (!td) return;
      // TEXT
      const div = td.querySelector("div[data-text]");
      if (div && div.textContent && div.textContent.trim() !== "") {
        blocks.push({
          id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: "text",
          content: div.innerHTML,
          fontFamily: div.style.fontFamily || undefined,
          fontSize: div.style.fontSize || undefined,
          fontWeight: div.style.fontWeight || undefined,
          textColor: div.style.color || undefined,
          textAlign: td.style.textAlign || undefined,
          padding: td.style.padding || undefined,
        });
        return;
      }
      // IMAGE
      const img = td.querySelector("img[data-image]");
      if (img) {
        blocks.push({
          id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: "image",
          src: img.getAttribute("src") || "",
          alt: img.getAttribute("alt") || "",
          width: img.style.width || img.getAttribute("width") || undefined,
          height: img.style.height || img.getAttribute("height") || undefined,
          borderRadius: img.style.borderRadius || undefined,
          padding: td.style.padding || undefined,
        });
        return;
      }
      // BUTTON
      const aButton = td.querySelector("a[data-button]");
      if (
        aButton &&
        aButton.textContent &&
        aButton.style.display?.includes("inline-block")
      ) {
        blocks.push({
          id: `button-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: "button",
          label: aButton.textContent,
          href: aButton.getAttribute("href") || "",
          backgroundColor: aButton.style.backgroundColor || undefined,
          color: aButton.style.color || undefined,
          borderRadius: aButton.style.borderRadius || undefined,
          fontFamily: aButton.style.fontFamily || undefined,
          fontWeight: aButton.style.fontWeight || undefined,
          padding: aButton.style.padding || undefined,
        });
        return;
      }
      // LINK
      const aLink = td.querySelector("a[data-link]");
      if (
        aLink &&
        (!aLink.style.display ||
          aLink.style.display === "inline-block" ||
          aLink.style.display === "")
      ) {
        blocks.push({
          id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: "link",
          linkText: aLink.textContent || "",
          url: aLink.getAttribute("href") || "",
          textColor: aLink.style.color || undefined,
          fontFamily: aLink.style.fontFamily || undefined,
          fontSize: aLink.style.fontSize || undefined,
          fontWeight: aLink.style.fontWeight || undefined,
          textDecoration: aLink.style.textDecoration || undefined,
          display: aLink.style.display || undefined,
          padding: td.style.padding || undefined,
        });
        return;
      }
      // DIVIDER
      const hr = td.querySelector("hr[data-divider]");
      if (hr) {
        blocks.push({
          id: `divider-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: "divider",
          color: hr.style.backgroundColor || undefined,
          thickness: hr.style.height || undefined,
          width: hr.style.width || undefined,
          padding: td.style.padding || undefined,
        });
        return;
      }
    });
    return blocks;
  }

  // Carregar HTML do primaryCopy ao montar
  useEffect(() => {
    if (
      primaryCopy &&
      primaryCopy.html_content &&
      emailComponents.length === 0
    ) {
      const blocks = parseHtmlToBlocks(primaryCopy.html_content);
      if (blocks.length > 0) {
        setEmailComponents(blocks);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryCopy]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 bg-white rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">
            {t("emailBuilder.components")}
          </h2>
          <ComponentSidebar onAddComponent={addComponent} />
        </div>

        <div className="flex-1 bg-white rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">
              {t("emailBuilder.buildArea")}
            </h2>
            <div className="flex gap-2">
              {/* {emailComponents.length > 0 && (
 <Button variant="outline" onClick={toggleSelectAll} className="text-xs">
 {selectedBlocks.length === emailComponents.length ?"Desmarcar Todos" :"Selecionar Todos"}
 </Button>
 )} */}
              <Button
                variant="outline"
                onClick={() => setSettingsOpen(true)}
                className="flex items-center gap-1"
              >
                <Settings size={16} />
                <span>{t("common.settings")}</span>
              </Button>
              <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                {t("common.preview")}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-1">
                    <Download size={16} />
                    <span>{t("emailBuilder.export")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportEmail("html")}>
                    {t("emailBuilder.exportHtml")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportEmail("markdown")}>
                    {t("emailBuilder.exportMarkdown")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={handleSaveClick}
                disabled={emailComponents.length === 0}
                className="flex items-center gap-1"
              >
                <Save size={16} />
                <span>{t("common.save")}</span>
              </Button>
            </div>
          </div>
          <EmailCanvas
            components={emailComponents}
            onSelectComponent={setSelectedComponent}
            onRemoveComponent={removeComponent}
            onMoveComponent={moveComponent}
            onMoveMultipleComponents={moveMultipleComponents}
            selectedBlocks={selectedBlocks}
            onToggleBlockSelection={toggleBlockSelection}
          />
        </div>

        {selectedComponent && (
          <div className="w-full lg:w-72 bg-white rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4">
              {t("emailBuilder.properties")}
            </h2>
            <PropertiesPanel
              component={selectedComponent}
              onUpdateComponent={updateComponent}
            />
          </div>
        )}
      </div>
      <EmailPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        components={emailComponents}
        settings={emailSettings}
      />
      <EmailSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={emailSettings}
        onSaveSettings={setEmailSettings}
      />

      <EmailSaveModal
        primaryCopy={primaryCopy}
        email={email}
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSaveMetadata}
      />

      <EmailPreviewSimulation
        isOpen={previewSimulationOpen}
        onClose={() => setPreviewSimulationOpen(false)}
        onBack={() => {
          setPreviewSimulationOpen(false);
          setSaveModalOpen(true);
        }}
        onComplete={handleCompleteSave}
        email={email}
        components={emailComponents}
        settings={emailSettings}
        metadata={emailMetadata}
      />
    </DndProvider>
  );
}
