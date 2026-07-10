import { PortalBarChart } from "@/src/presentation/components/organisms/portal/charts/bar-chart";
import type { AttendanceMetrics } from "@/src/modules/portal/domain/portal-attendance";

export function FollowupEffectivenessChart({ data }: { data: AttendanceMetrics["followup_effectiveness"] }) {
  return (
    <PortalBarChart
      data={data}
      xKey="toque"
      series={[{ key: "respondeu_pct", label: "Responderam (%)", color: "#0ea5e9" }]}
    />
  );
}
