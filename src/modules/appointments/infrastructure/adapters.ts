/**
 * Appointments — Infrastructure Adapters
 *
 * Consolidates the former `common/services/appointments/{appointments,blocked-periods,
 * schedule-config}-service.ts` into a single adapter module. Every exported function name
 * and signature is preserved unchanged so consuming hooks (now under
 * `src/shared/hooks/appointments/`) only need their import path updated.
 *
 * Backend module: `reserve-leads` (appointments live under `/leads/admin/appointments`).
 * Generated typed clients live in `src/infraestructure/server/services/
 * {admin-appointments, admin-appointment-blocked-periods,
 * admin-appointment-schedule-configuration, public-appointments}` (see Task 11 codegen).
 * They are NOT delegated to here because, on inspection of their `types.ts`:
 *   - every mutation/query response type is `type XResponse = unknown` for all four
 *     generated services except `public-appointments` (`list`, `getOne`, `cancel`,
 *     `complete`, blocked-periods `list`/`create`/`update`/`delete`, schedule-config
 *     `upsert`/`get` all return `unknown`) — delegating would require an unchecked cast
 *     at every call site (e.g. `response.data.data as Appointment`) with no type-safety
 *     gain over the hand-written services, which already type their `{ data, status }`
 *     envelope precisely via `@/src/shared/domain/types/@appointment`;
 *   - `adminAppointmentsService.list` types `status` as the string-literal union
 *     `'confirmed' | 'cancelled' | 'completed'`, while the hand-written
 *     `listAppointmentsService` accepts the `EAppointmentStatus` enum used across the
 *     domain layer and consuming hooks — using the generated param type would force
 *     enum-to-string-literal casts at call sites;
 *   - `saveScheduleConfigService` (hand-written) contains real business logic — it
 *     converts the app's per-day `ScheduleConfig` (with a `days: Record<number,
 *     DaySchedule>` map, one entry per weekday) into the backend's `LegacyScheduleConfig`
 *     shape (`workingDays: number[]` + a single representative start/end/lunch time)
 *     before calling `PUT /schedule-config`. The generated
 *     `adminAppointmentScheduleConfigurationService.upsert` is a thin wrapper with no
 *     such conversion — delegating to it directly would silently drop this legacy-format
 *     translation and send a payload the backend's legacy endpoint cannot interpret.
 * Given the same pattern already found in Task 12 (access-management) and Task 13
 * (leads) — response types uniformly `unknown`, plus a concrete functional gap (the
 * schedule-config legacy conversion) — this adapter keeps the original `apiClient`-based
 * implementations verbatim. All URL paths and normalization logic here match the
 * pre-migration services exactly.
 *
 * `public-appointments` (availability lookup) has no hand-written counterpart in
 * `common/services/appointments/` and no current caller in `src/`, so it is intentionally
 * not ported here — out of scope for this migration (moving, not adding, functionality).
 */

import { apiClient } from "@/src/infraestructure/axios/api";
import type {
  Appointment,
  AppointmentListResponse,
  BlockedPeriod,
  BlockedPeriodListResponse,
  EAppointmentStatus,
  LegacyScheduleConfig,
  ScheduleConfig,
} from "@/src/shared/domain/types/@appointment";

// ============================================================================
// Appointments (formerly common/services/appointments/appointments-service.ts)
// ============================================================================

export interface ListAppointmentsParams {
  page?: number;
  limit?: number;
  status?: EAppointmentStatus;
}

export interface ListAppointmentsResponse {
  data: AppointmentListResponse;
  status: number;
}

export interface GetAppointmentResponse {
  data: Appointment;
  status: number;
}

export interface UpdateAppointmentResponse {
  data: Appointment;
  status: number;
}

export async function listAppointmentsService(
  params: ListAppointmentsParams = {},
): Promise<ListAppointmentsResponse> {
  const response = await apiClient.get("/leads/admin/appointments", { params });
  return response.data;
}

export async function getAppointmentService(
  id: string,
): Promise<GetAppointmentResponse> {
  const response = await apiClient.get(`/leads/admin/appointments/${id}`);
  return response.data;
}

export async function cancelAppointmentService(
  id: string,
): Promise<UpdateAppointmentResponse> {
  const response = await apiClient.patch(
    `/leads/admin/appointments/${id}/cancel`,
  );
  return response.data;
}

export async function completeAppointmentService(
  id: string,
): Promise<UpdateAppointmentResponse> {
  const response = await apiClient.patch(
    `/leads/admin/appointments/${id}/complete`,
  );
  return response.data;
}

// ============================================================================
// Blocked Periods (formerly common/services/appointments/blocked-periods-service.ts)
// ============================================================================

export interface ListBlockedPeriodsParams {
  page?: number;
  limit?: number;
}

export interface ListBlockedPeriodsResponse {
  data: BlockedPeriodListResponse;
  status: number;
}

export interface CreateBlockedPeriodResponse {
  data: BlockedPeriod;
  status: number;
}

export async function listBlockedPeriodsService(
  params: ListBlockedPeriodsParams = {},
): Promise<ListBlockedPeriodsResponse> {
  const response = await apiClient.get(
    "/leads/admin/appointments/blocked-periods",
    { params },
  );
  return response.data;
}

export async function createBlockedPeriodService(
  period: Omit<BlockedPeriod, "id" | "tenantId" | "createdAt">,
): Promise<CreateBlockedPeriodResponse> {
  const response = await apiClient.post(
    "/leads/admin/appointments/blocked-periods",
    period,
  );
  return response.data;
}

export async function updateBlockedPeriodService(
  id: string,
  period: Omit<BlockedPeriod, "id" | "tenantId" | "createdAt">,
): Promise<CreateBlockedPeriodResponse> {
  const response = await apiClient.patch(
    `/leads/admin/appointments/blocked-periods/${id}`,
    period,
  );
  return response.data;
}

export async function deleteBlockedPeriodService(id: string): Promise<void> {
  await apiClient.delete(`/leads/admin/appointments/blocked-periods/${id}`);
}

// ============================================================================
// Schedule Config (formerly common/services/appointments/schedule-config-service.ts)
// ============================================================================

export interface GetScheduleConfigResponse {
  data: ScheduleConfig | LegacyScheduleConfig;
  status: number;
}

export interface SaveScheduleConfigResponse {
  data: ScheduleConfig;
  status: number;
}

export async function getScheduleConfigService(): Promise<GetScheduleConfigResponse> {
  const response = await apiClient.get(
    "/leads/admin/appointments/schedule-config",
  );
  return response.data;
}

export async function saveScheduleConfigService(
  config: ScheduleConfig,
): Promise<SaveScheduleConfigResponse> {
  // Convert new format to legacy format for API compatibility
  const enabledDays = Object.entries(config.days).filter(
    ([_, day]) => day.enabled,
  );

  if (enabledDays.length === 0) {
    throw new Error("At least one working day must be enabled");
  }

  // Find the most common schedule among enabled days
  const schedules = enabledDays.map(([_, day]) => ({
    workStartTime: day.workStartTime,
    workEndTime: day.workEndTime,
    lunchStartTime: day.lunchStartTime || "",
    lunchEndTime: day.lunchEndTime || "",
  }));

  // Use the first schedule as the representative one
  // In a more sophisticated approach, you could find the most common one
  const representativeSchedule = schedules[0];

  const legacyConfig: LegacyScheduleConfig = {
    workingDays: enabledDays.map(([dayNum]) => parseInt(dayNum)),
    workStartTime: representativeSchedule.workStartTime,
    workEndTime: representativeSchedule.workEndTime,
    slotIntervalMinutes: config.slotIntervalMinutes,
    capacityPerSlot: config.capacityPerSlot,
  };

  // Add lunch times if they exist
  if (representativeSchedule.lunchStartTime) {
    legacyConfig.lunchStartTime = representativeSchedule.lunchStartTime;
  }
  if (representativeSchedule.lunchEndTime) {
    legacyConfig.lunchEndTime = representativeSchedule.lunchEndTime;
  }

  const response = await apiClient.put(
    "/leads/admin/appointments/schedule-config",
    legacyConfig,
  );
  return response.data;
}
