import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateLeadStatusAction } from '@/src/common/actions/leads/update-lead-status';
import type { UpdateLeadStatusDto, LeadDetailResponse } from '@/src/common/@types/@lead';
import { toast } from 'react-hot-toast';

interface UpdateLeadStatusParams {
  id: number;
  data: UpdateLeadStatusDto;
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation<LeadDetailResponse, Error, UpdateLeadStatusParams>({
    mutationFn: ({ id, data }) => updateLeadStatusAction(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['leads', 'detail', variables.id] });
      toast.success('Lead status updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update lead status');
    },
  });
}
