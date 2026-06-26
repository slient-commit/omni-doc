import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { TrashResponse } from '@/types/documents';

export function useTrash() {
  return useQuery({
    queryKey: ['trash'],
    queryFn: () => api.get<TrashResponse>('/trash').then((r) => r.data),
  });
}

export function useEmptyTrash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete('/trash/empty').then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trash'] });
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}
