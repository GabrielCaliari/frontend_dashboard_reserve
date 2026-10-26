import {
  Bot,
  CalendarDays,
  FileText,
  Image as ImageIcon,
  Megaphone,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import type { ActivityLogEntry } from "@/src/shared/domain/types/@hotel-painel";

const CATEGORY: Record<string, { label: string; icon: LucideIcon; tone: string }> = {
  post: { label: "Conteúdo", icon: ImageIcon, tone: "bg-warning/15 text-warning-600" },
  campaign: { label: "Campanha", icon: Megaphone, tone: "bg-primary/15 text-primary" },
  report: { label: "Relatório", icon: FileText, tone: "bg-success/15 text-success-600" },
  bot: { label: "Atendimento", icon: Bot, tone: "bg-success/15 text-success-600" },
  meeting: { label: "Reunião", icon: CalendarDays, tone: "bg-default-100 text-foreground/70" },
  other: { label: "Outro", icon: MoreHorizontal, tone: "bg-default-100 text-foreground/70" },
};

function dayLabel(iso: string) {
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  const mesmoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (mesmoDia(d, hoje)) return "Hoje";
  if (mesmoDia(d, ontem)) return "Ontem";
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/**
 * O backend ja devolve mais recente primeiro (`orderBy created_at desc`) —
 * §3.5 "timeline reversa de tudo que a Reserve fez". Este componente confia
 * no contrato e nao reordena; so agrupa por dia para a leitura.
 */
export function ActivityFeed({ entries }: { entries: ActivityLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <PortalEmptyState
        title="Nenhuma atividade registrada ainda"
        description="Assim que a RÉSERVE publicar um post, ajustar uma campanha ou registrar uma reunião, aparece aqui."
      />
    );
  }

  const dias: { label: string; items: ActivityLogEntry[] }[] = [];
  for (const entry of entries) {
    const label = dayLabel(entry.created_at);
    const last = dias[dias.length - 1];
    if (last && last.label === label) last.items.push(entry);
    else dias.push({ label, items: [entry] });
  }

  return (
    <div className="max-w-3xl space-y-6">
      {dias.map((dia) => (
        <section key={dia.label}>
          <h3 className="sticky top-0 z-10 bg-background/95 py-1 text-xs font-medium capitalize text-muted-foreground backdrop-blur">
            {dia.label}
          </h3>
          <ul className="mt-2 divide-y divide-border/60 rounded-2xl border border-border/80 bg-default-50">
            {dia.items.map((entry) => {
              const cfg = CATEGORY[entry.category] ?? CATEGORY.other;
              const Icon = cfg.icon;
              return (
                <li key={entry.id} className="flex gap-3 px-4 py-3">
                  <span
                    aria-hidden
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${cfg.tone}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{entry.title}</p>
                    {entry.description && (
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{entry.description}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {cfg.label} · {hora(entry.created_at)}
                      {entry.type === "auto" && " · registrado automaticamente"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
