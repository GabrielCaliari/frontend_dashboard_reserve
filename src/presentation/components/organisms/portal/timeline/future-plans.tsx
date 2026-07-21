import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import type { FuturePlan } from "@/src/modules/portal/domain/portal-timeline";

export function FuturePlans({ plans }: { plans: FuturePlan[] }) {
  return (
    <div className="space-y-2">
      {[...plans]
        .sort((a, b) => a.order - b.order)
        .map((plan) => (
          <Card key={plan.id} className="p-3">
            <p className="font-medium">{plan.title}</p>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          </Card>
        ))}
    </div>
  );
}
