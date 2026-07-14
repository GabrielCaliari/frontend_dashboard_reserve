"use client";

import { useState } from "react";
import { useContentCalendar } from "@/src/modules/portal/presentation/hooks/use-content-calendar";
import { useMediaQuery } from "@/src/shared/hooks/portal/use-media-query";
import { CalendarMonthGrid } from "@/src/presentation/components/organisms/portal/content/calendar-month-grid";
import { CalendarWeekList } from "@/src/presentation/components/organisms/portal/content/calendar-week-list";
import { PortalTableSkeleton } from "@/src/presentation/components/organisms/portal/skeletons";

export default function PortalCalendarioPage() {
  const [month] = useState(() => new Date().toISOString().slice(0, 7));
  const { data: posts, isLoading } = useContentCalendar(month);
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Calendário de Conteúdo</h1>
      {isLoading ? (
        <PortalTableSkeleton rows={8} />
      ) : isMobile ? (
        <CalendarWeekList posts={posts ?? []} />
      ) : (
        <CalendarMonthGrid posts={posts ?? []} month={month} />
      )}
    </div>
  );
}
