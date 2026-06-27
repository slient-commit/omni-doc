import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Document } from '@/types/documents';

interface DocumentFilters {
  folderId?: string | number | null;
  categoryId?: number;
  search?: string;
  createdById?: number;
  sharedWithMe?: boolean;
}

export function useDocuments(filters: DocumentFilters = {}) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () => api.get<Document[]>('/documents', { params: filters }).then((r) => r.data),
  });
}

// ponytail: accepts uuid string for URL lookup
export function useDocument(id: string) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: () => api.get<Document>(`/documents/${id}`).then((r) => r.data),
    enabled: !!id,
    retry: false,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post<Document>('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

export function useUploadZip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/documents/upload-zip', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data),
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['documents'] });
      qc.refetchQueries({ queryKey: ['folders'] });
    },
  });
}

// ponytail: all mutations accept number|string — pass uuid from item.uuid
export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number | string; originalName?: string; categoryId?: number | null; documentDate?: string; metadata?: Record<string, unknown>; isPrivate?: boolean; allowEdit?: boolean; allowDelete?: boolean; allowMove?: boolean; allowCopy?: boolean }) =>
      api.patch<Document>(`/documents/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.delete(`/documents/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['documents'] });
      qc.refetchQueries({ queryKey: ['folders'] });
      qc.refetchQueries({ queryKey: ['trash'] });
    },
  });
}

export function usePermanentDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.delete(`/documents/${id}/permanent`).then((r) => r.data),
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['documents'] });
      qc.refetchQueries({ queryKey: ['folders'] });
      qc.refetchQueries({ queryKey: ['trash'] });
    },
  });
}

export function useRestoreDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.post(`/documents/${id}/restore`).then((r) => r.data),
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['documents'] });
      qc.refetchQueries({ queryKey: ['folders'] });
      qc.refetchQueries({ queryKey: ['trash'] });
    },
  });
}

export function useCopyDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, targetFolderId }: { id: number | string; targetFolderId?: number | null }) =>
      api.post(`/documents/${id}/copy`, { targetFolderId }).then((r) => r.data),
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['documents'] });
      qc.refetchQueries({ queryKey: ['folders'] });
    },
  });
}

export function useMoveDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, folderIds }: { id: number | string; folderIds: number[] }) =>
      api.post(`/documents/${id}/move`, { folderIds }).then((r) => r.data),
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['documents'] });
      qc.refetchQueries({ queryKey: ['folders'] });
    },
  });
}
