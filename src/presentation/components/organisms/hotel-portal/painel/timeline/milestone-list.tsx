import { Bot, Flag, Megaphone, Star, Trophy, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/src/shared/lib/utils";
import type { Milestone, MilestoneType } from "@/src/shared/domain/types/@hotel-painel";

const TYPE: Record<MilestoneType, { icon: LucideIcon; label: string; tone: string }> = {
  marco_zero: { icon: Flag, label: "Marco zero", tone: "bg-primary text-primary-foreground" },
  seguidor: { icon: Users, label: "Seguidores", tone: "bg-warning/15 text-warning-600" },
  campanha: { icon: Megaphone, label: "Campanha", tone: "bg-primary/15 text-primary" },
  bot: { icon: Bot, label: "Atendimento", tone: "bg-success/15 text-success-600" },
  recorde: { icon: Trophy, label: "Recorde", tone: "bg-warning/15 text-warning-600" },
  custom: { icon: Star, label: "Conquista", tone: "bg-default-100 text-foreground/70" },
};

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

/**
 * Linha do tempo: o mais recente em cima, o marco zero (a entrada da RÉSERVE)
 * fechando embaixo. O backend ja manda em ordem; aqui so se desenha.
 */
export function MilestoneList({ milestones }: { milestones: Milestone[] }) {
  return (
    <ol className="relative ml-4 border-l border-border/80 pl-8">
      {milestones.map((milestone) => {
        const isMarcoZero = milestone.type === "marco_zero";
        const cfg = TYPE[milestone.type] ?? TYPE.custom;
        const Icon = cfg.icon;
        return (
          <li
            key={milestone.id}
            data-testid={`milestone-${milestone.id}`}
            data-marco-zero={isMarcoZero}
            className="relative pb-8 last:pb-0"
          >
            <span
              aria-hidden
              className={cn(
                "absolute -left-[2.45rem] top-0 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-background",
                cfg.tone,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <p className="text-xs text-muted-foreground">
              {longDate(milestone.date)} · {cfg.label}
            </p>
            <p
              className={cn(
                "mt-0.5 text-foreground",
                isMarcoZero ? "font-display text-lg font-semibold tracking-[-0.01em]" : "text-[15px] font-medium",
              )}
            >
              {milestone.title}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
