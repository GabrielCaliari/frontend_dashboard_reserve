// Appointment Types

// Appointment Types

export interface DaySchedule {
  enabled: boolean;
  workStartTime: string; // "HH:MM"
  workEndTime: string; // "HH:MM"
  lunchStartTime?: string; // "HH:MM"
  lunchEndTime?: string; // "HH:MM"
}

export interface ScheduleConfig {
  id?: string;
  tenantId?: string;
  slotIntervalMinutes: number; // 5-480
  capacityPerSlot: number; // >= 1
  days: Record<number, DaySchedule>; // 0=Sunday, 1=Monday, etc.
  createdAt?: string;
  updatedAt?: string;
}

// Legacy format for backward compatibility
export interface LegacyScheduleConfig {
  id?: string;
  tenantId?: string;
  workingDays: number[]; // 0=Domingo, 1=Segunda, ..., 6=Sábado
  workStartTime: string; // "HH:MM"
  workEndTime: string; // "HH:MM"
  slotIntervalMinutes: number; // 5-480
  capacityPerSlot: number; // >= 1
  lunchStartTime?: string; // "HH:MM"
  lunchEndTime?: string; // "HH:MM"
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeSlot {
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  date: string; // ISO date
  availableCapacity: number;
  isAvailable: boolean;
}

export enum EAppointmentStatus {
  confirmed = "confirmed",
  cancelled = "cancelled",
  completed = "completed",
}

export interface Appointment {
  id: string;
  leadId: string;
  appointmentDate: string; // ISO date
  slotStartTime: string; // "HH:MM"
  slotEndTime: string; // "HH:MM"
  status: EAppointmentStatus;
  selectedProduct?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  Lead?: {
    id: string;
    name: string;
    email: string;
    phone_number: string;
  };
}

export interface BlockedPeriod {
  id?: string;
  tenantId?: string;
  startDatetime: string; // ISO datetime
  endDatetime: string; // ISO datetime
  label?: string;
  createdAt?: string;
}

export interface AppointmentListResponse {
  data: Appointment[];
  count: number;
  page: number;
  limit: number;
}

export interface BlockedPeriodListResponse {
  data: BlockedPeriod[];
  count: number;
  page: number;
  limit: number;
}
