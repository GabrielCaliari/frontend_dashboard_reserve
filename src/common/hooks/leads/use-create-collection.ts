import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCollectionAction } from '@/src/common/actions/leads/create-collection';
import type { CreateCollectionDto, CollectionDetailResponse } from '@/src/common/@types/@lead';
import { toast } from 'react-hot-toast';

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation<CollectionDetailResponse, Error, CreateCollectionDto>({
    mutationFn: createCollectionAction,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lead-collections', 'list'] });
      
      // Show secret key if collection is restricted
      if (data.data.secret_key) {
        toast.success(
          `Collection created! Secret key: ${data.data.secret_key} (save this, it won't be shown again)`,
          { duration: 10000 }
        );
      } else {
        toast.success('Collection created successfully');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create collection');
    },
  });
}
