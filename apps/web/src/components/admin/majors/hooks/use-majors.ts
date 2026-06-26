import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toaster';
import type { Major, MajorFormData } from '../major-types';

export function useMajors(onSaved: () => void) {
  const queryClient = useQueryClient();

  const { data: majors, isLoading } = useQuery<Major[]>({
    queryKey: ['majors'],
    queryFn: async () => {
      const response = await api.get('/majors');
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (newMajor: MajorFormData) => api.post('/majors', newMajor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['majors'] });
      onSaved();
      toast.success('Jurusan berhasil ditambahkan!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menambahkan jurusan'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MajorFormData }) => api.put(`/majors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['majors'] });
      onSaved();
      toast.success('Jurusan berhasil diperbarui!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal memperbarui jurusan'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/majors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['majors'] });
      toast.success('Jurusan berhasil dihapus!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menghapus jurusan'),
  });

  return { majors, isLoading, createMutation, updateMutation, deleteMutation };
}
