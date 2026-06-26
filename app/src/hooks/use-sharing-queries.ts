import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ShareLink } from '@/types/documents';

export function useCreateDocumentInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, ...data }: { documentId: number; invitedUserId: number; permission: string }) =>
      api.post(`/documents/${documentId}/invite`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useDeleteDocumentInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, inviteId }: { documentId: number; inviteId: number }) =>
      api.delete(`/documents/${documentId}/invite/${inviteId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useCreateFolderInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ folderId, ...data }: { folderId: number; invitedUserId: number; permission: string }) =>
      api.post(`/folders/${folderId}/invite`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
  });
}

export function useDeleteFolderInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ folderId, inviteId }: { folderId: number; inviteId: number }) =>
      api.delete(`/folders/${folderId}/invite/${inviteId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
  });
}

export function useShareLinks() {
  return useQuery({
    queryKey: ['share-links'],
    queryFn: () => api.get<ShareLink[]>('/share-links').then((r) => r.data),
  });
}

export function useCreateShareLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { documentId?: number; folderId?: number; password?: string; expiresAt?: string }) =>
      api.post<ShareLink>('/share-links', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['share-links'] }),
  });
}

export function useDeleteShareLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/share-links/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['share-links'] }),
  });
}
