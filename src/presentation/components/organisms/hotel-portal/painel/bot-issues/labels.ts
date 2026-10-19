import type {
  BotIssueCategory,
  BotIssueSeverity,
  BotIssueStatus,
} from "@/src/shared/domain/types/@hotel-painel";

export const CATEGORY_LABELS: Record<BotIssueCategory, string> = {
  tecnico: "Técnico",
  conversa: "Conversa",
  socorro: "Socorro",
};

export const STATUS_LABELS: Record<BotIssueStatus, string> = {
  ABERTO: "Aberto",
  VISTO: "Visto",
  CORRIGIDO: "Corrigido",
};

export const SEVERITY_LABELS: Record<BotIssueSeverity, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export const SEVERITY_CLASSES: Record<BotIssueSeverity, string> = {
  alta: "bg-danger/15 text-danger",
  media: "bg-warning/20 text-warning-700",
  baixa: "bg-default-200 text-default-700",
};

export function categoryLabel(value: string): string {
  return CATEGORY_LABELS[value as BotIssueCategory] ?? value;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
