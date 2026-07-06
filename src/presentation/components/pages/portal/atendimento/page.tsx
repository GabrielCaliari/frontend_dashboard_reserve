"use client";

import { usePortalChannels } from "@/src/modules/portal/presentation/hooks/use-portal-channels";
import { ChannelStatusCard } from "@/src/presentation/components/organisms/portal/attendance/channel-status-card";
import { PortalCardSkeleton } from "@/src/presentation/components/organisms/portal/skeletons";

export default function PortalAtendimentoPage() {
  const { data: channels, isLoading } = usePortalChannels();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Automação de Atendimento</h1>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Canais</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <PortalCardSkeleton key={i} />)
            : channels?.map((channel) => <ChannelStatusCard key={channel.kind} channel={channel} />)}
        </div>
      </section>
      {/* Conversas (Task 18), Funil (Task 20), Métricas (Task 23) sections are appended below in later tasks */}
    </div>
  );
}
