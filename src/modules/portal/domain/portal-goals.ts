/**
 * Per plan Assumption 9, only the **display** is built here — configuring
 * `show_goal`/`target_value` is an admin-side feature, out of scope.
 *
 * BLOCKED (backend): `GET /portal/goals` reads `metric_goals` (master doc §4.2).
 */
export interface MetricGoal {
  metric_key: string;
  period: "biweekly" | "monthly";
  target_value: number;
  show_goal: boolean;
}
