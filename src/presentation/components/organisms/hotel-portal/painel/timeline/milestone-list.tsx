import { cn } from "@/src/shared/lib/utils";
import type { Milestone } from "@/src/shared/domain/types/@hotel-painel";

export function MilestoneList({ milestones }: { milestones: Milestone[] }) {
  return (
    <ol className="space-y-3">
      {milestones.map((milestone) => {
        const isMarcoZero = milestone.type === "marco_zero";
        return (
          <li
            key={milestone.id}
            data-testid={`milestone-${milestone.id}`}
            data-marco-zero={isMarcoZero}
            className={cn(
              "rounded-md border-l-4 p-3",
              isMarcoZero ? "border-primary bg-primary/5 font-semibold" : "border-border",
            )}
          >
            <p className="text-xs text-muted-foreground">{new Date(milestone.date).toLocaleDateString("pt-BR")}</p>
            <p>{milestone.title}</p>
          </li>
        );
      })}
    </ol>
  );
}
