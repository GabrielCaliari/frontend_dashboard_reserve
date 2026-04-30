import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelAppointmentService,
  completeAppointmentService,
} from "@/src/common/services/appointments/appointments-service";

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelAppointmentService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => completeAppointmentService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
