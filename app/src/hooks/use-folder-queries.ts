import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Folder, BreadcrumbItem } from '@/types/documents';

export function useFolders(parentId?: string | number | null, sharedWithMe?: boolean) {
  return useQuery({
    queryKey: ['folders', { parentId: parentId ?? null, sharedWithMe }],
    queryFn: () =>
      api.get<Folder[]>('/folders', { params: { parentId, sharedWithMe } }).then((r) => r.data),
  });
}

export function useFolder(id: number | string) {
  return useQuery({
    queryKey: ['folders', id],
    queryFn: () => api.get<Folder>(`/folders/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useFolderAncestors(id: string | number | null) {
  return useQuery({
    queryKey: ['folders', id, 'ancestors'],
    queryFn: () => api.get<BreadcrumbItem[]>(`/folders/${id}/ancestors`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; parentId?: string | number | null }) =>
      api.post<Folder>('/folders', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
  });
}

// ponytail: all mutations accept number|string — pass uuid from item.uuid
export function useRenameFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number | string; name: string }) =>
      api.patch<Folder>(`/folders/${id}`, { name }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.delete(`/folders/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      qc.invalidateQueries({ queryKey: ['trash'] });
    },
  });
}

export function usePermanentDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.delete(`/folders/${id}/permanent`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      qc.invalidateQueries({ queryKey: ['trash'] });
    },
  });
}

export function useRestoreFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.post(`/folders/${id}/restore`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      qc.invalidateQueries({ queryKey: ['trash'] });
    },
  });
}
