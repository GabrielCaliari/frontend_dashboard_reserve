import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import { cn } from "@/src/shared/lib/utils";
import type { ChannelStatus } from "@/src/modules/portal/domain/portal-attendance";

const healthColor: Record<ChannelStatus["health"], string> = {
  ok: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
};

export function ChannelStatusCard({ channel }: { channel: ChannelStatus }) {
  return (
    <Card className="space-y-2 p-4">
      <div className="flex items-center gap-2">
        <span className={cn("size-2 rounded-full", healthColor[channel.health])} />
        <p className="font-medium">{channel.label}</p>
      </div>
      <p className="text-sm text-muted-foreground">{channel.health_message}</p>
      {channel.kind === "whatsapp" && (
        <div className="space-y-1 text-sm">
          <p>Atendimento automático: {channel.bot_active ? "ligado" : "pausado"}</p>
          {Boolean(channel.paused_contacts_count) && (
            <p className="font-medium text-amber-600">
              {channel.paused_contacts_count} contato{channel.paused_contacts_count === 1 ? "" : "s"} aguardando um
              humano
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
