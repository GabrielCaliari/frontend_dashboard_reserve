"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Tabs, Tab, Select, SelectItem } from "@heroui/react";
import { RefreshCw, Calendar } from "lucide-react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { useListAppointments } from "@/src/common/hooks/appointments/use-list-appointments";
import { AppointmentsCalendar } from "@/src/components/appointments/appointments-calendar";
import { DayAppointmentsPanel } from "@/src/components/appointments/day-appointments-panel";
import { ScheduleConfigForm } from "@/src/components/appointments/schedule-config-form";
import { BlockedPeriodsList } from "@/src/components/appointments/blocked-periods-list";
import { useListBlockedPeriods } from "@/src/common/hooks/appointments/use-blocked-periods";
import { EAppointmentStatus } from "@/src/common/@types/@appointment";

export default function AppointmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("appointments");

  const activeTab = searchParams.get("tab") || "calendar";
  const statusFilter = searchParams.get("status") || "";

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data, isLoading, refetch } = useListAppointments({
    limit: 500, // busca todos para exibir no calendário
    status: statusFilter ? (statusFilter as EAppointmentStatus) : undefined,
  });

  const { data: blockedData } = useListBlockedPeriods({ limit: 100 });

  const appointments = data?.data?.data || [];
  const totalCount = data?.data?.count || 0;

  // Extrai datas bloqueadas como "YYYY-MM-DD"
  const blockedDates = (blockedData?.data?.data || []).flatMap((period) => {
    const dates: string[] = [];
    const start = new Date(period.startDatetime);
    const end = new Date(period.endDatetime);
    const cur = new Date(start);
    while (cur <= end) {
      dates.push(cur.toISOString().split("T")[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  });

  const STATUS_OPTIONS = [
    { value: "", label: t("allStatuses") },
    { value: EAppointmentStatus.confirmed, label: t("statusConfirmed") },
    { value: EAppointmentStatus.cancelled, label: t("statusCancelled") },
    { value: EAppointmentStatus.completed, label: t("statusCompleted") },
  ];

  const handleTabChange = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.push(`/dashboard/leads/appointments?${params.toString()}`);
  };

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/dashboard/leads/appointments?${params.toString()}`);
  };

  return (
    <LayoutScopeRoot routeActive="appointments">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("subtitle", { count: totalCount })}
            </p>
          </div>
          <Button
            variant="flat"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={() => refetch()}
            isLoading={isLoading}
            size="sm"
          >
            {t("refresh")}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => handleTabChange(key as string)}
          color="primary"
          aria-label="Appointments tabs"
        >
          {/* ── CALENDAR TAB ── */}
          <Tab key="calendar" title={t("tabCalendar")}>
            <div className="mt-4 space-y-4">
              {/* Status filter */}
              <div className="flex items-center gap-3">
                <Select
                  size="sm"
                  variant="bordered"
                  selectedKeys={[statusFilter]}
                  onChange={(e) => updateParam("status", e.target.value)}
                  aria-label={t("allStatuses")}
                  className="w-44"
                  classNames={{ trigger: "border-gray-700 bg-gray-900/50" }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Calendar + Day panel */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
                {/* Calendar */}
                <div className="rounded-xl border border-divider bg-default-50 p-4">
                  <AppointmentsCalendar
                    appointments={appointments}
                    isLoading={isLoading}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    blockedDates={blockedDates}
                  />
                </div>

                {/* Day panel */}
                <div className="rounded-xl border border-divider bg-default-50 p-4 overflow-y-auto max-h-[600px]">
                  <DayAppointmentsPanel
                    date={selectedDate}
                    appointments={appointments}
                    onRefresh={refetch}
                  />
                </div>
              </div>
            </div>
          </Tab>

          {/* ── CONFIG TAB ── */}
          <Tab key="config" title={t("tabConfig")}>
            <div className="mt-4">
              <ScheduleConfigForm />
            </div>
          </Tab>

          {/* ── BLOCKED TAB ── */}
          <Tab key="blocked" title={t("tabBlocked")}>
            <div className="mt-4">
              <BlockedPeriodsList />
            </div>
          </Tab>
        </Tabs>
      </div>
    </LayoutScopeRoot>
  );
}
