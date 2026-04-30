import { apiClient } from "@/src/common/config/api";
import type {
  Appointment,
  AppointmentListResponse,
  EAppointmentStatus,
} from "@/src/common/@types/@appointment";

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
  params: ListAppointmentsParams = {}
): Promise<ListAppointmentsResponse> {
  const response = await apiClient.get("/leads/admin/appointments", { params });
  return response.data;
}

export async function getAppointmentService(id: string): Promise<GetAppointmentResponse> {
  const response = await apiClient.get(`/leads/admin/appointments/${id}`);
  return response.data;
}

export async function cancelAppointmentService(id: string): Promise<UpdateAppointmentResponse> {
  const response = await apiClient.patch(`/leads/admin/appointments/${id}/cancel`);
  return response.data;
}

export async function completeAppointmentService(id: string): Promise<UpdateAppointmentResponse> {
  const response = await apiClient.patch(`/leads/admin/appointments/${id}/complete`);
  return response.data;
}
