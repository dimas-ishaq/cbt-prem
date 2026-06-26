import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toaster';
import { useTranslation } from 'react-i18next';
import type { Subject, SubjectFormData, TeacherSummary } from '../subject-types';

export function useSubjects(onSaved?: () => void) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: subjects, isLoading } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await api.get('/subjects');
      return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: SubjectFormData) => api.post('/subjects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      onSaved?.();
      toast.success(t('subjectCreateSuccess'));
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? t('subjectCreateError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubjectFormData }) => api.put(`/subjects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      onSaved?.();
      toast.success(t('subjectUpdateSuccess'));
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? t('subjectUpdateError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/subjects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success(t('subjectDeleteSuccess'));
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? t('subjectDeleteError')),
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.post('/subjects/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success(t('subjectImportSuccess', { count: res.data.importedCount }));
    },
    onError: (err: any) => {
      const payload = err.response?.data;
      toast.error(payload?.errors?.[0] ?? payload?.message ?? t('subjectImportError'));
    },
  });

  const searchTeachers = useQuery<TeacherSummary[]>({
    queryKey: ['teachers', 'search'],
    enabled: false,
    queryFn: async () => [],
  });

  return {
    subjects: subjects ?? [],
    isLoading,
    createMutation,
    updateMutation,
    deleteMutation,
    importMutation,
    searchTeachers,
  };
}
