import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toaster';
import type { UserData, UserFormData } from '../user-types';

type Rombel = {
  id: string;
  name: string;
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

export function useUsers(onSaved: () => void) {
  const queryClient = useQueryClient();

  const usersQuery = useQuery<UserData[]>({
    queryKey: ['users-all'],
    queryFn: async () => {
      const res = await api.get('/users');
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
  });

  const rombelsQuery = useQuery<Rombel[]>({
    queryKey: ['rombels-list'],
    queryFn: async () => {
      const res = await api.get('/rombels');
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-all'] });
      onSaved();
      toast.success('Pengguna berhasil dibuat!');
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Gagal membuat pengguna'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { fullName: string; email: string; nip?: string } }) => api.put(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-all'] });
      onSaved();
      toast.success('Data pengguna berhasil diperbarui!');
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Gagal memperbarui pengguna'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-all'] });
      toast.success('Pengguna berhasil dihapus');
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Gagal menghapus pengguna'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id }: { id: string; isActive: boolean }) => api.patch(`/users/${id}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-all'] });
      toast.success('Status pengguna berhasil diubah');
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Gagal mengubah status'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) => api.patch(`/users/${id}/reset-password`, { newPassword }),
    onSuccess: () => {
      onSaved();
      toast.success('Password berhasil direset!');
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Gagal mereset password'),
  });

  return {
    users: usersQuery.data ?? [],
    rombels: rombelsQuery.data ?? [],
    isLoading: usersQuery.isLoading,
    createMutation,
    updateMutation,
    deleteMutation,
    toggleActiveMutation,
    resetPasswordMutation,
    queryClient,
  };
}

