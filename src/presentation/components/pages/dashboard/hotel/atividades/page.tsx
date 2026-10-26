"use client";

import { useState } from "react";
import {
  useActiveHotelClient,
  useHotelActivities,
} from "@/src/shared/hooks/hotel-portal";
import { PainelPageShell } from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { ActivityFeed } from "@/src/presentation/components/organisms/hotel-portal/painel/activity/activity-feed";
import { Pagination } from "@/src/presentation/components/organisms/hotel-portal/painel/pagination";
import { ScreenLinks } from "@/src/presentation/components/organisms/hotel-portal/painel/screen-links";

const PAGE_SIZE = 20;

export default function HotelAtividadesPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, isFetching } = useHotelActivities(client?.id ?? null, {
    page,
    limit: PAGE_SIZE,
  });

  const total = data?.pagination?.total ?? 0;

  return (
    <PainelPageShell
      title="Atividades"
      description="Tudo o que a RÉSERVE fez pela pousada, do mais recente ao mais antigo: posts, campanhas, relatórios, reuniões e ajustes no bot."
      isLoading={clientLoading || isLoading}
      isError={isError}
      errorMessage="Erro ao carregar o feed de atividades."
    >
      <ActivityFeed entries={data?.data ?? []} />

      {total > PAGE_SIZE && (
        <div className="max-w-3xl">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            isLoading={isFetching}
            onChange={setPage}
          />
        </div>
      )}

      <ScreenLinks
        links={[
          { href: "/dashboard/hotel/plano", label: "Plano", hint: "O que está previsto para o semestre" },
          { href: "/dashboard/hotel/evolucao", label: "Evolução", hint: "Os marcos desde a entrada da RÉSERVE" },
        ]}
      />
    </PainelPageShell>
  );
}
