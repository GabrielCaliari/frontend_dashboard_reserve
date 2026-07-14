"use client";

import { useActivityFeed } from "@/src/modules/portal/presentation/hooks/use-activity-feed";
import { ActivityFeed } from "@/src/presentation/components/organisms/portal/activity/activity-feed";
import { PortalTableSkeleton } from "@/src/presentation/components/organisms/portal/skeletons";

export default function PortalAtividadesPage() {
  const { data, isLoading } = useActivityFeed();

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Atividades</h1>
      {isLoading ? <PortalTableSkeleton rows={8} /> : <ActivityFeed entries={data ?? []} />}
    </div>
  );
}
