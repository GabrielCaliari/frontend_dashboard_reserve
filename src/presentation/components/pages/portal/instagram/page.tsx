"use client";

import { useState } from "react";
import { usePortalInstagram } from "@/src/modules/portal/presentation/hooks/use-portal-instagram";
import { PortalLineChart } from "@/src/presentation/components/organisms/portal/charts/line-chart";
import { TopPosts } from "@/src/presentation/components/organisms/portal/instagram/top-posts";
import { MetricLabel } from "@/src/presentation/components/organisms/portal/glossary/metric-label";
import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import { PortalCardSkeleton } from "@/src/presentation/components/organisms/portal/skeletons";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default function PortalInstagramPage() {
  const [range] = useState(defaultRange);
  const { data, isLoading } = usePortalInstagram(range);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Instagram Orgânico</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <PortalCardSkeleton key={i} />)
        ) : (
          <>
            <Card className="space-y-1 p-4">
              <div className="text-sm text-muted-foreground"><MetricLabel metricKey="seguidores" /></div>
              <p className="text-xl font-semibold">{data!.followers_count.toLocaleString("pt-BR")}</p>
            </Card>
            <Card className="space-y-1 p-4">
              <div className="text-sm text-muted-foreground"><MetricLabel metricKey="alcance_organico" /></div>
              <p className="text-xl font-semibold">{data!.reach.toLocaleString("pt-BR")}</p>
            </Card>
            <Card className="space-y-1 p-4">
              <div className="text-sm text-muted-foreground"><MetricLabel metricKey="engajamento" /></div>
              <p className="text-xl font-semibold">{data!.engagement.toLocaleString("pt-BR")}</p>
            </Card>
            <Card className="space-y-1 p-4">
              <div className="text-sm text-muted-foreground"><MetricLabel metricKey="taxa_engajamento" /></div>
              <p className="text-xl font-semibold">{data!.engagement_rate_pct}%</p>
            </Card>
          </>
        )}
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Alcance orgânico por dia</h2>
        <PortalLineChart
          data={data?.daily_reach ?? []}
          xKey="date"
          isLoading={isLoading}
          series={[{ key: "alcance_organico", label: "Alcance orgânico", color: "#ec4899" }]}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Top 3 posts</h2>
        <TopPosts posts={data?.top_posts ?? []} />
      </section>
    </div>
  );
}
