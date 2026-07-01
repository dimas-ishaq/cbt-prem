import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Major, Rombel, Student } from '../rombel-types';

export function useRombelQueries(
  selectedRombelId: string | null,
  isManageOpen: boolean,
  modalFilterMajorId: string,
  filterRombelId: string,
  modalFilterGrade: string,
) {
  const rombelsQuery = useQuery<Rombel[]>({
    queryKey: ['rombels'],
    queryFn: async () => {
      const response = await api.get('/rombels');
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    },
  });

  const majorsQuery = useQuery<Major[]>({
    queryKey: ['majors'],
    queryFn: async () => {
      const response = await api.get('/majors');
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    },
  });

  const rombelDetailQuery = useQuery<Rombel>({
    queryKey: ['rombel-detail', selectedRombelId],
    queryFn: async () => {
      if (!selectedRombelId) return null as unknown as Rombel;
      const response = await api.get(`/rombels/${selectedRombelId}`);
      return response.data;
    },
    enabled: !!selectedRombelId,
  });

  const allStudentsQuery = useQuery<Student[]>({
    queryKey: ['all-students', modalFilterMajorId, filterRombelId, modalFilterGrade],
    queryFn: async () => {
      const response = await api.get('/students', {
        params: {
          majorId: modalFilterMajorId || undefined,
          rombelId: filterRombelId || undefined,
          grade: modalFilterGrade || undefined,
        },
      });
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    },
    enabled: isManageOpen,
  });

  return {
    rombels: rombelsQuery.data,
    isLoading: rombelsQuery.isLoading,
    majors: majorsQuery.data,
    rombelDetail: rombelDetailQuery.data,
    isLoadingDetail: rombelDetailQuery.isLoading,
    allStudents: allStudentsQuery.data,
    isLoadingAllStudents: allStudentsQuery.isLoading,
  };
}
