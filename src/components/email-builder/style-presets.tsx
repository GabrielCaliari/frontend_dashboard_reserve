"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";
import { ScrollArea } from "@/src/presentation/components/atoms/shadcn-ui/scroll-area";
import type {
  IEmailComponent,
  IStylePreset,
} from "@/src/shared/domain/types/@email-builder";

interface StylePresetsProps {
  componentType: string;
  onApplyPreset: (preset: Partial<IEmailComponent>) => void;
}

export default function StylePresets({
  componentType,
  onApplyPreset,
}: StylePresetsProps) {
  const t = useTranslations("emailBuilder");

  // Estilos predefinidos para texto
  const textPresets: IStylePreset[] = [
    {
      id: "text-heading",
      name: t("presetMainTitle"),
      properties: {
        fontFamily: "'Helvetica', sans-serif",
        fontSize: "24px",
        fontWeight: "bold",
        textColor: "#333333",
        textAlign: "center",
        padding: "15px 10px",
      },
    },
    {
      id: "text-subheading",
      name: t("presetSubtitle"),
      properties: {
        fontFamily: "'Helvetica', sans-serif",
        fontSize: "18px",
        fontWeight: "600",
        textColor: "#555555",
        textAlign: "center",
        padding: "10px",
      },
    },
    {
      id: "text-paragraph",
      name: t("presetParagraph"),
      properties: {
        fontFamily: "'Arial', sans-serif",
        fontSize: "16px",
        fontWeight: "normal",
        textColor: "#666666",
        textAlign: "left",
        padding: "10px 15px",
      },
    },
    {
      id: "text-quote",
      name: t("presetQuote"),
      properties: {
        fontFamily: "'Georgia', serif",
        fontSize: "16px",
        fontWeight: "normal",
        textColor: "#777777",
        textAlign: "center",
        padding: "15px 20px",
        styles: ["font-style: italic", "border-left: 3px solid #dddddd"],
      },
    },
  ];

  // Estilos predefinidos para botões
  const buttonPresets: IStylePreset[] = [
    {
      id: "button-primary",
      name: t("presetPrimary"),
      properties: {
        backgroundColor: "#007bff",
        color: "#ffffff",
        padding: "12px 24px",
        borderRadius: "4px",
        fontWeight: "bold",
        fontFamily: "'Helvetica', sans-serif",
      },
    },
    {
      id: "button-success",
      name: t("presetSuccess"),
      properties: {
        backgroundColor: "#28a745",
        color: "#ffffff",
        padding: "12px 24px",
        borderRadius: "4px",
        fontWeight: "bold",
        fontFamily: "'Helvetica', sans-serif",
      },
    },
    {
      id: "button-danger",
      name: t("presetDanger"),
      properties: {
        backgroundColor: "#dc3545",
        color: "#ffffff",
        padding: "12px 24px",
        borderRadius: "4px",
        fontWeight: "bold",
        fontFamily: "'Helvetica', sans-serif",
      },
    },
    {
      id: "button-outline",
      name: t("presetOutline"),
      properties: {
        backgroundColor: "transparent",
        color: "#007bff",
        padding: "10px 20px",
        borderRadius: "4px",
        fontWeight: "normal",
        fontFamily: "'Helvetica', sans-serif",
        buttonStyles: ["border: 2px solid #007bff"],
      },
    },
    {
      id: "button-rounded",
      name: t("presetRounded"),
      properties: {
        backgroundColor: "#6c757d",
        color: "#ffffff",
        padding: "12px 24px",
        borderRadius: "50px",
        fontWeight: "bold",
        fontFamily: "'Helvetica', sans-serif",
      },
    },
  ];

  // Estilos predefinidos para imagens
  const imagePresets: IStylePreset[] = [
    {
      id: "image-full",
      name: t("presetFullWidth"),
      properties: {
        width: "100%",
        height: "auto",
        borderRadius: "0",
        padding: "0",
      },
    },
    {
      id: "image-rounded",
      name: t("presetRoundedCorners"),
      properties: {
        width: "auto",
        height: "auto",
        borderRadius: "8px",
        padding: "10px",
      },
    },
    {
      id: "image-circle",
      name: t("presetCircular"),
      properties: {
        width: "150px",
        height: "150px",
        borderRadius: "50%",
        padding: "10px",
        imageStyles: ["object-fit: cover"],
      },
    },
    {
      id: "image-",
      name: t("presetWithShadow"),
      properties: {
        width: "auto",
        height: "auto",
        borderRadius: "4px",
        padding: "10px",
        imageStyles: ["box-: 0 4px 8px rgba(0, 0, 0, 0.1)"],
      },
    },
  ];

  // Estilos predefinidos para links
  const linkPresets: IStylePreset[] = [
    {
      id: "link-standard",
      name: t("presetDefault"),
      properties: {
        textColor: "#0066cc",
        fontFamily: "'Arial', sans-serif",
        fontSize: "16px",
        textDecoration: "underline",
        padding: "5px 0",
      },
    },
    {
      id: "link-bold",
      name: t("presetBold"),
      properties: {
        textColor: "#0066cc",
        fontFamily: "'Arial', sans-serif",
        fontSize: "16px",
        fontWeight: "bold",
        textDecoration: "none",
        padding: "5px 0",
      },
    },
    {
      id: "link-subtle",
      name: t("presetDiscreet"),
      properties: {
        textColor: "#666666",
        fontFamily: "'Arial', sans-serif",
        fontSize: "16px",
        textDecoration: "underline",
        padding: "5px 0",
      },
    },
    {
      id: "link-highlight",
      name: t("presetHighlighted"),
      properties: {
        textColor: "#ff6600",
        fontFamily: "'Arial', sans-serif",
        fontSize: "16px",
        fontWeight: "bold",
        textDecoration: "underline",
        padding: "5px 0",
      },
    },
  ];

  // Estilos predefinidos para divisores
  const dividerPresets: IStylePreset[] = [
    {
      id: "divider-thin",
      name: t("presetThin"),
      properties: {
        color: "#e0e0e0",
        thickness: "1px",
        width: "100%",
        padding: "15px 0",
      },
    },
    {
      id: "divider-thick",
      name: t("presetThick"),
      properties: {
        color: "#cccccc",
        thickness: "3px",
        width: "100%",
        padding: "15px 0",
      },
    },
    {
      id: "divider-dashed",
      name: t("presetDashed"),
      properties: {
        color: "#dddddd",
        thickness: "1px",
        width: "90%",
        padding: "15px 0",
        dividerStyles: [
          "border-top: 1px dashed #dddddd",
          "border-bottom: none",
        ],
      },
    },
    {
      id: "divider-gradient",
      name: t("presetGradient"),
      properties: {
        thickness: "2px",
        width: "80%",
        padding: "15px 0",
        dividerStyles: [
          "background-image: linear-gradient(to right, transparent, #007bff, transparent)",
          "border: none",
        ],
      },
    },
  ];

  let presets: IStylePreset[] = [];

  switch (componentType) {
    case "text":
      presets = textPresets;
      break;
    case "button":
      presets = buttonPresets;
      break;
    case "image":
      presets = imagePresets;
      break;
    case "link":
      presets = linkPresets;
      break;
    case "divider":
      presets = dividerPresets;
      break;
    default:
      presets = [];
  }

  if (presets.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium mb-2">{t("presets")}</h3>
      <ScrollArea className="h-[120px]">
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              className="justify-start text-xs h-auto py-2"
              onClick={() => onApplyPreset(preset.properties)}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
