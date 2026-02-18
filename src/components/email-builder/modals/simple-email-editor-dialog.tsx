"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Eye, Settings, Save } from "lucide-react";
import { IEmailCampaign } from "@/src/common/@types/@email-campaign";
import { IEmail } from "@/src/common/@types/@email";
import { ICreatePrimaryCopy } from "@/src/common/@types/@email-builder";
import EmailSettingsModal, { EmailSettings } from "../email-settings-modal";
import createPrimaryCopyService from "@/src/common/services/email-campaign/create-primary-copy-service";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

interface SimpleEmailEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  campaign: IEmailCampaign;
  primaryCopy: IEmail | null;
}

export function SimpleEmailEditorDialog({
  isOpen,
  onClose,
  email,
  campaign,
  primaryCopy,
}: SimpleEmailEditorDialogProps) {
  const t = useTranslations();
  const [htmlContent, setHtmlContent] = useState("");
  const [emailMetadata, setEmailMetadata] = useState({
    name: "",
    subject: "",
    preHeader: "",
    fromName: "",
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    defaultPadding: "10px",
    useHeader: false,
    blockSpacing: "0px",
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
  });

  // Carregar dados do primaryCopy ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      if (primaryCopy && primaryCopy.html_content) {
        // Se tem primaryCopy com conteúdo, carregar dados existentes
        setHtmlContent(primaryCopy.html_content || "");
        setEmailMetadata({
          name: primaryCopy.name || "",
          subject: primaryCopy.subject || "",
          preHeader: primaryCopy.pre_header || "",
          fromName: primaryCopy.from_name || "",
        });
      } else {
        // Se não há primary copy ou não tem conteúdo, usar valores padrão
        setHtmlContent("");
        setEmailMetadata({
          name: "",
          subject: "",
          preHeader: "",
          fromName: email || "",
        });
      }
    }
  }, [isOpen, primaryCopy, email]);

  // Limpar dados ao fechar o modal
  useEffect(() => {
    if (!isOpen) {
      setHtmlContent("");
      setEmailMetadata({
        name: "",
        subject: "",
        preHeader: "",
        fromName: "",
      });
      setIsSaving(false);
    }
  }, [isOpen]);

  const generateFinalHtml = (): string => {
    let finalHtml = htmlContent;

    // Adicionar header se habilitado
    if (emailSettings.useHeader && emailSettings.headerHtml) {
      finalHtml = emailSettings.headerHtml + finalHtml;
    }

    // Adicionar footer se habilitado
    if (emailSettings.useFooter && emailSettings.footerHtml) {
      finalHtml = finalHtml + emailSettings.footerHtml;
    }

    // Envolver em estrutura básica de email se necessário
    if (!finalHtml.includes("<!DOCTYPE html>")) {
      finalHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${emailMetadata.subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
          <table cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">
            <tr>
              <td>
                ${finalHtml}
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
    }

    return finalHtml;
  };

  const handleSave = async () => {
    if (!htmlContent.trim()) {
      toast.error(t("emailEditor.emptyHtmlError"));
      return;
    }

    if (!emailMetadata.subject.trim()) {
      toast.error(t("emailEditor.subjectRequiredError"));
      return;
    }

    if (!emailMetadata.fromName.trim()) {
      toast.error(t("emailEditor.senderNameRequired"));
      return;
    }

    setIsSaving(true);

    try {
      const data: ICreatePrimaryCopy = {
        html: generateFinalHtml(),
        md: "", // Pode ser gerado a partir do HTML se necessário
        subject: emailMetadata.subject,
        pre_header: emailMetadata.preHeader,
        from_name: emailMetadata.fromName,
        use_header: emailSettings.useHeader,
        use_footer: emailSettings.useFooter,
      };

      const response = await createPrimaryCopyService(
        String(campaign?.id),
        data,
      );

      if (response.error) {
        toast.error(response.message || t("emailEditor.saveError"));
      } else {
        toast.success(t("emailEditor.saveSuccess"));
        onClose();
        // Recarregar a página para atualizar o status da campanha
        window.location.reload();
      }
    } catch (error) {
      toast.error(t("emailEditor.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    setPreviewOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[90%] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {primaryCopy && primaryCopy.html_content
                ? t("emailEditor.editMainCopy")
                : t("emailEditor.createMainCopy")}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
            {/* Coluna Principal - Editor */}
            <div className="lg:col-span-2 flex flex-col">
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email-name">
                      {t("emailEditor.emailName")}
                    </Label>
                    <Input
                      id="email-name"
                      value={emailMetadata.name}
                      onChange={(e) =>
                        setEmailMetadata({
                          ...emailMetadata,
                          name: e.target.value,
                        })
                      }
                      placeholder={t("emailEditor.emailNamePlaceholder")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="from-name">
                      {t("emailEditor.senderName")}
                    </Label>
                    <Input
                      id="from-name"
                      value={emailMetadata.fromName}
                      onChange={(e) =>
                        setEmailMetadata({
                          ...emailMetadata,
                          fromName: e.target.value,
                        })
                      }
                      placeholder={t("emailEditor.senderNamePlaceholder")}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">
                    {t("emailEditor.subjectRequired")}
                  </Label>
                  <Input
                    id="subject"
                    value={emailMetadata.subject}
                    onChange={(e) =>
                      setEmailMetadata({
                        ...emailMetadata,
                        subject: e.target.value,
                      })
                    }
                    placeholder={t("emailEditor.subjectPlaceholder")}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="preheader">
                    {t("emailEditor.preHeaderLabel")}
                  </Label>
                  <Input
                    id="preheader"
                    value={emailMetadata.preHeader}
                    onChange={(e) =>
                      setEmailMetadata({
                        ...emailMetadata,
                        preHeader: e.target.value,
                      })
                    }
                    placeholder={t("emailEditor.preHeaderPlaceholder")}
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="html-content">
                    {t("emailEditor.htmlContentRequired")}
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSettingsOpen(true)}
                      className="flex items-center gap-1"
                    >
                      <Settings size={16} />
                      {t("common.settings")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreview}
                      className="flex items-center gap-1"
                    >
                      <Eye size={16} />
                      {t("common.preview")}
                    </Button>
                  </div>
                </div>

                <Textarea
                  id="html-content"
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder={t("emailEditor.pasteHtml")}
                  className="flex-1 min-h-[400px] font-mono text-sm"
                  style={{ resize: "none" }}
                />
              </div>
            </div>

            {/* Coluna Lateral - Preview */}
            <div className="hidden lg:flex flex-col">
              <Label className="mb-2">{t("common.preview")}</Label>
              <div className="flex-1 border rounded-md overflow-hidden bg-white">
                <iframe
                  srcDoc={generateFinalHtml()}
                  title="Email Preview"
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1"
            >
              <Save size={16} />
              {isSaving ? t("common.saving") : t("emailEditor.saveEmail")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Preview para telas menores */}
      <Dialog
        open={previewOpen}
        onOpenChange={(open) => !open && setPreviewOpen(false)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{t("emailEditor.emailPreview")}</DialogTitle>
          </DialogHeader>
          <div
            className="mt-4 border rounded-md overflow-hidden bg-white"
            style={{ minHeight: "500px" }}
          >
            <iframe
              srcDoc={generateFinalHtml()}
              title="Email Preview"
              className="w-full h-full border-0"
              style={{ minHeight: "500px" }}
              sandbox="allow-same-origin"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Configurações */}
      <EmailSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={emailSettings}
        onSaveSettings={setEmailSettings}
      />
    </>
  );
}
