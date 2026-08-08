"use client";

import { useState } from "react";
import {
  useActiveHotelClient,
  useHotelContentPosts,
} from "@/src/shared/hooks/hotel-portal";
import { PainelPageShell } from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { CalendarMonthGrid } from "@/src/presentation/components/organisms/hotel-portal/painel/content/calendar-month-grid";
import { CalendarWeekList } from "@/src/presentation/components/organisms/hotel-portal/painel/content/calendar-week-list";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { Input } from "@/src/presentation/components/atoms/shadcn-ui/input";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function HotelCalendarioPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const [month, setMonth] = useState(currentMonth);

  const { data: posts, isLoading, isError } = useHotelContentPosts(
    client?.id ?? null,
    month,
  );

  return (
    <PainelPageShell
      title="Calendário"
      description="O que a Reserve publicou e o que está agendado para o seu Instagram."
      isLoading={clientLoading || isLoading}
      isError={isError}
      errorMessage="Erro ao carregar o calendário de conteúdo."
      actions={
        <Input
          type="month"
          aria-label="Mês do calendário"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-44"
        />
      }
    >
      {posts && posts.length > 0 ? (
        <>
          {/* Grid mensal no desktop, lista por semana no mobile (§3.5). */}
          <div className="hidden md:block">
            <CalendarMonthGrid posts={posts} month={month} />
          </div>
          <div className="md:hidden">
            <CalendarWeekList posts={posts} />
          </div>
        </>
      ) : (
        <PortalEmptyState
          title="Nada programado neste mês"
          description="Assim que a Reserve agendar ou publicar conteúdo, ele aparece aqui."
        />
      )}
    </PainelPageShell>
  );
}
