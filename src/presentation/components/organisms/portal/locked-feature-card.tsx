import { Lock } from "lucide-react";
import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";

/**
 * Master doc §3.9: "o Nível 3 só existe com motor integrado — o bloco
 * aparece bloqueado com explicação, virando argumento natural de upsell."
 * Copy is explanatory, not an error state.
 */
export function LockedFeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="flex items-start gap-3 border-dashed p-4">
      <Lock className="mt-0.5 size-5 text-muted-foreground" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}
