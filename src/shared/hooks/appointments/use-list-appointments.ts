import { useQuery } from "@tanstack/react-query";
import {
  listAppointmentsService,
  type ListAppointmentsParams,
} from "@/src/modules/appointments/infrastructure/adapters";

export function useListAppointments(params: ListAppointmentsParams = {}) {
  return useQuery({
    queryKey: ["appointments", "list", params],
    queryFn: () => listAppointmentsService(params),
  });
}
