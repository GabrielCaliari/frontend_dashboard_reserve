import type { MetricGoal } from "@/src/modules/portal/domain/portal-goals";

/**
 * Default per master doc §2 Decisão 3: goal is shown only for WhatsApp leads
 * unless `show_goal` says otherwise — this component doesn't special-case
 * the metric key, it just respects whatever `show_goal` the caller passes,
 * keeping the default-metric decision in the data, not hardcoded here.
 */
export function GoalProgress({ goal, currentValue }: { goal: MetricGoal; currentValue: number }) {
  if (!goal.show_goal) return null;

  const pct = Math.min((currentValue / goal.target_value) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        {currentValue.toLocaleString("pt-BR")} de {goal.target_value.toLocaleString("pt-BR")} na meta
      </p>
    </div>
  );
}
