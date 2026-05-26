"use client";

import { useState, useMemo } from"react";
import { Button, Chip, Skeleton } from"@heroui/react";
import { ChevronLeft, ChevronRight, Calendar } from"lucide-react";
import { useTranslations, useLocale } from"next-intl";
import type { Appointment, EAppointmentStatus } from"@/src/common/@types/@appointment";

interface AppointmentsCalendarProps {
 appointments: Appointment[];
 isLoading: boolean;
 selectedDate: string | null;
 onSelectDate: (date: string) => void;
 blockedDates?: string[]; // ISO date strings"YYYY-MM-DD"
}

const STATUS_COLORS: Record<EAppointmentStatus, string> = {
 confirmed:"bg-green-500",
 cancelled:"bg-default-100",
 completed:"bg-yellow-500",
};

export function AppointmentsCalendar({
 appointments,
 isLoading,
 selectedDate,
 onSelectDate,
 blockedDates = [],
}: AppointmentsCalendarProps) {
 const t = useTranslations("appointments");
 const locale = useLocale(); // Pegar o idioma atual
 const today = new Date();

 const [viewDate, setViewDate] = useState(() => {
 const d = new Date();
 d.setDate(1);
 return d;
 });

 const year = viewDate.getFullYear();
 const month = viewDate.getMonth();

 // Usar locale correto para o mês
 const localeMap: Record<string, string> = {'en':'en-US','pt':'pt-BR',
 };
 const dateLocale = localeMap[locale] ||'en-US';

 const monthLabel = viewDate.toLocaleDateString(dateLocale, { month:"long", year:"numeric" });

 // Map appointments by date"YYYY-MM-DD"
 const appointmentsByDate = useMemo(() => {
 const map: Record<string, Appointment[]> = {};
 appointments.forEach((appt) => {
 const key = appt.appointmentDate.split("T")[0];
 if (!map[key]) map[key] = [];
 map[key].push(appt);
 });
 return map;
 }, [appointments]);

 // Build calendar grid
 const calendarDays = useMemo(() => {
 const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
 const daysInMonth = new Date(year, month + 1, 0).getDate();
 const days: (number | null)[] = [];

 for (let i = 0; i < firstDay; i++) days.push(null);
 for (let d = 1; d <= daysInMonth; d++) days.push(d);

 return days;
 }, [year, month]);

 const prevMonth = () => {
 setViewDate(new Date(year, month - 1, 1));
 };

 const nextMonth = () => {
 setViewDate(new Date(year, month + 1, 1));
 };

 const formatKey = (day: number) => {
 const mm = String(month + 1).padStart(2,"0");
 const dd = String(day).padStart(2,"0");
 return`${year}-${mm}-${dd}`;
 };

 const isToday = (day: number) => {
 return (
 today.getFullYear() === year &&
 today.getMonth() === month &&
 today.getDate() === day
 );
 };

 const isSelected = (day: number) => formatKey(day) === selectedDate;

 const isBlocked = (day: number) => blockedDates.includes(formatKey(day));

 // Dias da semana traduzidos
 const WEEKDAYS = locale ==='en' 
 ? ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
 : ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

 if (isLoading) {
 return (
 <div className="space-y-3">
 <Skeleton className="h-8 w-48 rounded-lg" />
 <div className="grid grid-cols-7 gap-1">
 {[...Array(35)].map((_, i) => (
 <Skeleton key={i} className="h-14 rounded-lg" />
 ))}
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-1">
 {/* Month navigation */}
 <div className="flex items-center justify-between mb-4">
 <Button isIconOnly size="sm" variant="flat" onPress={prevMonth}>
 <ChevronLeft className="w-4 h-4" />
 </Button>
 <h3 className="text-base font-semibold capitalize text-foreground">{monthLabel}</h3>
 <Button isIconOnly size="sm" variant="flat" onPress={nextMonth}>
 <ChevronRight className="w-4 h-4" />
 </Button>
 </div>

 {/* Weekday headers */}
 <div className="grid grid-cols-7 gap-1 mb-1">
 {WEEKDAYS.map((wd) => (
 <div key={wd} className="text-center text-xs font-semibold text-muted-foreground py-1">
 {wd}
 </div>
 ))}
 </div>

 {/* Days grid */}
 <div className="grid grid-cols-7 gap-1">
 {calendarDays.map((day, idx) => {
 if (!day) return <div key={`empty-${idx}`} />;

 const key = formatKey(day);
 const dayAppts = appointmentsByDate[key] || [];
 const blocked = isBlocked(day);
 const selected = isSelected(day);
 const todayDay = isToday(day);

 return (
 <button
 key={key}
 onClick={() => !blocked && onSelectDate(key)}
 disabled={blocked}
 className={`
 relative flex flex-col items-center justify-start p-1.5 rounded-xl min-h-[56px] border transition-all text-sm
 ${blocked ?"opacity-40 cursor-not-allowed bg-red-500/10 border-red-500/20" :"cursor-pointer hover:bg-default-100"}
 ${selected ?"bg-primary/20 border-primary" :"border-transparent"}
 ${todayDay && !selected ?"border-primary/40 font-bold" :""}`}
 >
 <span className={`text-xs font-medium ${todayDay ?"text-primary" :"text-foreground"}`}>
 {day}
 </span>

 {/* Appointment dots */}
 {dayAppts.length > 0 && (
 <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
 {dayAppts.slice(0, 3).map((appt) => (
 <span
 key={appt.id}
 className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[appt.status]}`}
 />
 ))}
 {dayAppts.length > 3 && (
 <span className="text-[9px] text-muted-foreground">+{dayAppts.length - 3}</span>
 )}
 </div>
 )}
 </button>
 );
 })}
 </div>

 {/* Legend */}
 <div className="flex items-center gap-4 pt-3 border-t border-divider mt-3">
 <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
 <span className="w-2 h-2 rounded-full bg-green-500" /> {t("statusConfirmed")}
 </div>
 <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
 <span className="w-2 h-2 rounded-full bg-yellow-500" /> {t("statusCompleted")}
 </div>
 <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
 <span className="w-2 h-2 rounded-full bg-default-100" /> {t("statusCancelled")}
 </div>
 <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
 <span className="w-2 h-2 rounded-full bg-red-400" /> {t("blocked")}
 </div>
 </div>
 </div>
 );
}
