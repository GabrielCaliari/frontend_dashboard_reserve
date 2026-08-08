"use client";

import { useState } from "react";
import {
  useActiveHotelClient,
  useHotelActivities,
} from "@/src/shared/hooks/hotel-portal";
import { PainelPageShell } from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { ActivityFeed } from "@/src/presentation/components/organisms/hotel-portal/painel/activity/activity-feed";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";

const PAGE_SIZE = 20;

export default function HotelAtividadesPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useHotelActivities(client?.id ?? null, {
    page,
    limit: PAGE_SIZE,
  });

  const totalPages = data?.pagination?.totalPages ?? 1;

  return (
    <PainelPageShell
      title="Atividades"
      description="Tudo o que a Reserve fez pelo seu negócio, do mais recente ao mais antigo."
      isLoading={clientLoading || isLoading}
      isError={isError}
      errorMessage="Erro ao carregar o feed de atividades."
    >
      <ActivityFeed entries={data?.data ?? []} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} de {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </PainelPageShell>
  );
}
