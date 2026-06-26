import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Organization } from '@/types/users';

export function useOrganization() {
  return useQuery({
    queryKey: ['organization'],
    queryFn: () => api.get<Organization>('/organization').then((r) => r.data),
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      api.patch<Organization>('/organization', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organization'] }),
  });
}
