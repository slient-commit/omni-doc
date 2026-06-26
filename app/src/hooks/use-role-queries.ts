import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Role, Permission } from '@/types/users';

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get<Role[]>('/roles').then((r) => r.data),
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => api.get<Permission[]>('/roles/permissions').then((r) => r.data),
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; permissionIds: number[] }) =>
      api.post<Role>('/roles', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; name?: string; description?: string; permissionIds?: number[] }) =>
      api.patch<Role>(`/roles/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/roles/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
}
