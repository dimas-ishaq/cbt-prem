import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toaster';
import type { AuditLog, Menu, RoleDetail } from '../role-types';

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

type RolePayload = Record<string, unknown>;

export function useRoles(auditRoleId: string | null, onSaved: () => void) {
  const queryClient = useQueryClient();

  const rolesQuery = useQuery<RoleDetail[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
  });

  const matrixQuery = useQuery<Menu[]>({
    queryKey: ['permissions-matrix'],
    queryFn: async () => {
      const res = await api.get('/roles/permissions');
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
  });

  const auditLogsQuery = useQuery<AuditLog[]>({
    queryKey: ['audit-logs', auditRoleId],
    queryFn: async () => {
      if (!auditRoleId) return [];
      const res = await api.get(`/roles/${auditRoleId}/audit-logs`);
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
    enabled: !!auditRoleId,
  });

  const createMutation = useMutation({
    mutationFn: (data: RolePayload) => api.post('/roles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      onSaved();
      toast.success('Role berhasil dibuat!');
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Gagal membuat role'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RolePayload }) => api.put(`/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      onSaved();
      toast.success('Role berhasil diperbarui!');
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Gagal memperbarui role'),
  });

  const cloneMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.post(`/roles/${id}/clone`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      onSaved();
      toast.success('Role berhasil diduplikasi!');
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Gagal menduplikasi role'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role berhasil dihapus!');
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Gagal menghapus role'),
  });

  return {
    roles: rolesQuery.data ?? [],
    matrix: matrixQuery.data ?? [],
    auditLogs: auditLogsQuery.data ?? [],
    rolesLoading: rolesQuery.isLoading,
    matrixLoading: matrixQuery.isLoading,
    auditLoading: auditLogsQuery.isLoading,
    createMutation,
    updateMutation,
    cloneMutation,
    deleteMutation,
  };
}

