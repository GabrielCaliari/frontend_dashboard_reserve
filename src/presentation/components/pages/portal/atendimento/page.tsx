"use client";

import { useState } from "react";
import { usePortalChannels } from "@/src/modules/portal/presentation/hooks/use-portal-channels";
import { usePortalConversations } from "@/src/modules/portal/presentation/hooks/use-portal-conversations";
import { useAttendanceFunnel } from "@/src/modules/portal/presentation/hooks/use-attendance-funnel";
import { ChannelStatusCard } from "@/src/presentation/components/organisms/portal/attendance/channel-status-card";
import { ConversationList } from "@/src/presentation/components/organisms/portal/attendance/conversation-list";
import { ConversationSearch } from "@/src/presentation/components/organisms/portal/attendance/conversation-search";
import { FunnelColumns } from "@/src/presentation/components/organisms/portal/attendance/funnel-columns";
import { PortalCardSkeleton, PortalTableSkeleton } from "@/src/presentation/components/organisms/portal/skeletons";
import type { ConversationFilters } from "@/src/modules/portal/domain/portal-attendance";

export default function PortalAtendimentoPage() {
  const { data: channels, isLoading } = usePortalChannels();
  const [filters, setFilters] = useState<ConversationFilters>({});
  const { data: conversations, isLoading: conversationsLoading } = usePortalConversations(filters);
  const { data: funnelStages, isLoading: funnelLoading } = useAttendanceFunnel();

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

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Conversas</h2>
        <ConversationSearch filters={filters} onChange={setFilters} />
        <div className="mt-3">
          {conversationsLoading ? (
            <PortalTableSkeleton />
          ) : (
            <ConversationList conversations={conversations ?? []} />
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Funil de atendimento</h2>
        {funnelLoading ? <PortalCardSkeleton /> : <FunnelColumns stages={funnelStages ?? []} />}
      </section>
      {/* Métricas (Task 23) section is appended below in a later task */}
    </div>
  );
}
