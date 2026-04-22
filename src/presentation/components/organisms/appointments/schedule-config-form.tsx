"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Checkbox,
  Card,
  CardBody,
  Divider,
} from "@heroui/react";
import { Save, Clock, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import {
  useScheduleConfig,
  useSaveScheduleConfig,
} from "@/src/shared/hooks/appointments/use-schedule-config";
import type { ScheduleConfig } from "@/src/shared/domain/types/@appointment";

interface DaySchedule {
  enabled: boolean;
  workStartTime: string;
  workEndTime: string;
  lunchStartTime?: string;
  lunchEndTime?: string;
}

interface FlexibleScheduleConfig {
  slotIntervalMinutes: number;
  capacityPerSlot: number;
  days: Record<number, DaySchedule>; // 0=Sunday, 1=Monday, etc.
}

export function ScheduleConfigForm() {
  const t = useTranslations("appointments");
  const { data: configData, isLoading } = useScheduleConfig();
  const saveMutation = useSaveScheduleConfig();

  const [config, setConfig] = useState<FlexibleScheduleConfig>({
    slotIntervalMinutes: 30,
    capacityPerSlot: 2,
    days: {
      0: { enabled: false, workStartTime: "09:00", workEndTime: "17:00" }, // Sunday
      1: { enabled: true, workStartTime: "09:00", workEndTime: "17:00" }, // Monday
      2: { enabled: true, workStartTime: "09:00", workEndTime: "17:00" }, // Tuesday
      3: { enabled: true, workStartTime: "09:00", workEndTime: "17:00" }, // Wednesday
      4: { enabled: true, workStartTime: "09:00", workEndTime: "17:00" }, // Thursday
      5: { enabled: true, workStartTime: "09:00", workEndTime: "17:00" }, // Friday
      6: { enabled: false, workStartTime: "09:00", workEndTime: "17:00" }, // Saturday
    },
  });

  const WEEKDAYS = [
    { value: 0, label: t("sunday"), short: "Dom" },
    { value: 1, label: t("monday"), short: "Seg" },
    { value: 2, label: t("tuesday"), short: "Ter" },
    { value: 3, label: t("wednesday"), short: "Qua" },
    { value: 4, label: t("thursday"), short: "Qui" },
    { value: 5, label: t("friday"), short: "Sex" },
    { value: 6, label: t("saturday"), short: "Sáb" },
  ];

  const INTERVAL_OPTIONS = [
    { value: "15", label: `15 ${t("minutes") || "min"}` },
    { value: "30", label: `30 ${t("minutes") || "min"}` },
    { value: "45", label: `45 ${t("minutes") || "min"}` },
    { value: "60", label: `1 ${t("hour") || "hour"}` },
  ];

  // Convert from backend format to flexible format
  useEffect(() => {
    if (configData?.data) {
      const backendConfig = configData.data;

      // Check if it's the new format (has'days' property)
      if ("days" in backendConfig && backendConfig.days) {
        setConfig({
          slotIntervalMinutes: backendConfig.slotIntervalMinutes,
          capacityPerSlot: backendConfig.capacityPerSlot,
          days: backendConfig.days,
        });
      } else {
        // Legacy format - convert to new format
        const legacyConfig = backendConfig as any;
        const newConfig: FlexibleScheduleConfig = {
          slotIntervalMinutes: legacyConfig.slotIntervalMinutes,
          capacityPerSlot: legacyConfig.capacityPerSlot,
          days: {},
        };

        // Initialize all days
        for (let i = 0; i <= 6; i++) {
          newConfig.days[i] = {
            enabled: legacyConfig.workingDays?.includes(i) || false,
            workStartTime: legacyConfig.workStartTime || "09:00",
            workEndTime: legacyConfig.workEndTime || "17:00",
            lunchStartTime: legacyConfig.lunchStartTime || "",
            lunchEndTime: legacyConfig.lunchEndTime || "",
          };
        }

        setConfig(newConfig);
      }
    }
  }, [configData]);

  const updateDay = (dayIndex: number, updates: Partial<DaySchedule>) => {
    setConfig((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [dayIndex]: { ...prev.days[dayIndex], ...updates },
      },
    }));
  };

  const copyToAllDays = (sourceDay: number) => {
    const source = config.days[sourceDay];
    if (!source) return;

    setConfig((prev) => {
      const newDays = { ...prev.days };
      Object.keys(newDays).forEach((dayStr) => {
        const day = parseInt(dayStr);
        if (newDays[day].enabled) {
          newDays[day] = {
            ...newDays[day],
            workStartTime: source.workStartTime,
            workEndTime: source.workEndTime,
            lunchStartTime: source.lunchStartTime,
            lunchEndTime: source.lunchEndTime,
          };
        }
      });
      return { ...prev, days: newDays };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const enabledDays = Object.entries(config.days).filter(
      ([_, day]) => day.enabled,
    );

    if (enabledDays.length === 0) {
      toast.error(t("selectAtLeastOneDay"));
      return;
    }

    // Send the new format directly
    const payload: ScheduleConfig = {
      slotIntervalMinutes: config.slotIntervalMinutes,
      capacityPerSlot: config.capacityPerSlot,
      days: config.days,
    };

    try {
      await saveMutation.mutateAsync(payload);
      toast.success(t("configSaved"));
    } catch (error: any) {
      console.error("Error saving schedule config:", error);

      if (error.response?.status === 404) {
        toast.error(t("endpointNotFound"));
      } else {
        toast.error(
          error.response?.data?.message || error.message || t("errorSaving"),
        );
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        {t("loading")}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 bg-default-100 rounded-xl border border-divider"
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">{t("scheduleConfig")}</h3>
      </div>

      {/* Global Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label={t("slotInterval")}
          selectedKeys={[String(config.slotIntervalMinutes)]}
          onChange={(e) =>
            setConfig({
              ...config,
              slotIntervalMinutes: Number(e.target.value),
            })
          }
        >
          {INTERVAL_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </Select>

        <Input
          type="number"
          label={t("capacityPerSlot")}
          value={String(config.capacityPerSlot)}
          onChange={(e) =>
            setConfig({ ...config, capacityPerSlot: Number(e.target.value) })
          }
          min={1}
          required
        />
      </div>

      <Divider />

      {/* Per-Day Configuration */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {t("dayByDayConfig")}
        </h4>

        <div className="space-y-3">
          {WEEKDAYS.map((weekday) => {
            const dayConfig = config.days[weekday.value];
            return (
              <Card
                key={weekday.value}
                className={dayConfig.enabled ? "border-primary/20" : ""}
              >
                <CardBody className="p-4">
                  <div className="space-y-3">
                    {/* Day header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          isSelected={dayConfig.enabled}
                          onValueChange={(enabled) =>
                            updateDay(weekday.value, { enabled })
                          }
                        >
                          <span className="font-medium">{weekday.label}</span>
                        </Checkbox>
                      </div>
                      {dayConfig.enabled && (
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => copyToAllDays(weekday.value)}
                        >
                          {t("copyToAll")}
                        </Button>
                      )}
                    </div>

                    {/* Day schedule */}
                    {dayConfig.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pl-6">
                        <Input
                          type="time"
                          label={t("workStartTime")}
                          size="sm"
                          value={dayConfig.workStartTime}
                          onChange={(e) =>
                            updateDay(weekday.value, {
                              workStartTime: e.target.value,
                            })
                          }
                        />
                        <Input
                          type="time"
                          label={t("workEndTime")}
                          size="sm"
                          value={dayConfig.workEndTime}
                          onChange={(e) =>
                            updateDay(weekday.value, {
                              workEndTime: e.target.value,
                            })
                          }
                        />
                        <Input
                          type="time"
                          label={t("lunchStartTime")}
                          size="sm"
                          placeholder="--:--"
                          value={dayConfig.lunchStartTime || ""}
                          onChange={(e) =>
                            updateDay(weekday.value, {
                              lunchStartTime: e.target.value,
                            })
                          }
                        />
                        <Input
                          type="time"
                          label={t("lunchEndTime")}
                          size="sm"
                          placeholder="--:--"
                          value={dayConfig.lunchEndTime || ""}
                          onChange={(e) =>
                            updateDay(weekday.value, {
                              lunchEndTime: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-divider">
        <Button
          type="submit"
          color="primary"
          startContent={<Save className="w-4 h-4" />}
          isLoading={saveMutation.isPending}
          className="w-full md:w-auto"
        >
          {t("saveConfig")}
        </Button>
      </div>
    </form>
  );
}
