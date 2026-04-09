import { useQuery } from "@tanstack/react-query";
import {
  listAppointmentsService,
  type ListAppointmentsParams,
} from "@/src/common/services/appointments/appointments-service";

export function useListAppointments(params: ListAppointmentsParams = {}) {
  return useQuery({
    queryKey: ["appointments", "list", params],
    queryFn: () => listAppointmentsService(params),
  });
}
