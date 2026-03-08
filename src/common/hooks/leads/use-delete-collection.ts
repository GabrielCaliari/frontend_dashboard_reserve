import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCollectionAction } from '@/src/common/actions/leads/delete-collection';
import { toast } from 'react-hot-toast';

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteCollectionAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-collections', 'list'] });
      toast.success('Collection deactivated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to deactivate collection');
    },
  });
}
